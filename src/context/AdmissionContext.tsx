import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import {
  StudentRecord,
  SnackbarState,
  ConfirmDialogState,
  StudentFilterParams,
  CertificateItem,
} from '../types';
import { WarningModal } from '../components/common/WarningModal';
import { STANDARD_CERTIFICATES } from '../utils/constants';
import { masterDataApi, studentApi, certificateApi, ApiError } from '../api/client';
import {
  toStudentRecord,
  toPersonalStepRequest,
  toParentStepRequest,
  toCommunicationStepRequest,
  toAcademicStepRequest,
  toQualifyingExamStepRequest,
  toHscMarksStepRequest,
  toDiplomaStepRequest,
  toPgStepRequest,
  toFeeStepRequest,
  toCertificatesStepRequest,
  AcademicLookup,
} from '../api/mappers';
import {
  BusRouteDto,
  CategoryDto,
  CertificateMasterDto,
  DepartmentDto,
  FeeStructureDto,
  HostelDto,
  ProgramDto,
  ScholarshipStructureDto,
  SubmitAdmissionRequest,
} from '../api/types';
import { studentDetailsSchema } from '../schemas/student.schema';
import { parentDetailsSchema } from '../schemas/parent.schema';
import { communicationSchema } from '../schemas/communication.schema';
import { academicDetailsSchema } from '../schemas/academic.schema';
import {
  isStudentDetailsComplete,
  isParentDetailsComplete,
  isCommunicationComplete,
  isAdmissionDetailsComplete,
  isQualifyingExamComplete,
  isFeeComplete,
} from '../utils/sectionValidation';

export interface MasterData {
  programs: ProgramDto[];
  departments: DepartmentDto[];
  departmentsByProgram: Record<string, DepartmentDto[]>;
  categories: CategoryDto[];
  certificates: CertificateMasterDto[];
  hostels: HostelDto[];
  busRoutes: BusRouteDto[];
  feeStructures: FeeStructureDto[];
  scholarshipStructures: ScholarshipStructureDto[];
}

const emptyMasterData: MasterData = {
  programs: [],
  departments: [],
  departmentsByProgram: {},
  categories: [],
  certificates: [],
  hostels: [],
  busRoutes: [],
  feeStructures: [],
  scholarshipStructures: [],
};

export interface WarningModalState {
  open: boolean;
  title: string;
  message: string;
}

interface AdmissionContextType {
  students: StudentRecord[];
  archivedStudents: StudentRecord[];
  selectedStudentIds: string[];
  setSelectedStudentIds: React.Dispatch<React.SetStateAction<string[]>>;

  // Master data (from backend)
  masterData: MasterData;
  masterDataLoading: boolean;

  // Initial app bootstrap loading state
  appLoading: boolean;

  // Active step & Draft form state
  activeStep: number;
  setActiveStep: (step: number) => void;
  draftStudent: Partial<StudentRecord>;
  setDraftStudent: React.Dispatch<React.SetStateAction<Partial<StudentRecord>>>;
  updateDraftSection: <K extends keyof StudentRecord>(section: K, value: StudentRecord[K]) => void;

  // Edit / View state
  isEditMode: boolean;
  isViewReadOnly: boolean;
  editingStudentId: string | null;
  viewModalStudent: StudentRecord | null;
  closeViewModal: () => void;
  startAddAdmission: () => void;
  startEditStudent: (student: StudentRecord) => void;
  startViewStudent: (student: StudentRecord) => Promise<void>;

  // Actions (async, backed by REST API)
  savingStep: boolean;
  saveCurrentAdmission: () => Promise<boolean>;
  archiveSelectedStudents: (reason: string) => Promise<void>;
  archiveSingleStudent: (studentId: string, reason: string, description?: string) => Promise<void>;
  restoreStudents: (studentIds: string[]) => Promise<void>;
  refreshStudents: () => Promise<void>;

  // Common UI State
  snackbar: SnackbarState;
  showSnackbar: (message: string, severity?: SnackbarState['severity']) => void;
  hideSnackbar: () => void;

  confirmDialog: ConfirmDialogState;
  showConfirm: (
    title: string,
    message: string,
    onConfirm: () => void,
    confirmText?: string,
    cancelText?: string
  ) => void;
  hideConfirm: () => void;

  // Unsaved Changes Protection & Step Navigation Guards
  isFormDirty: boolean;
  clearCurrentDraft: () => void;
  requestNavigation: (onConfirm: () => void) => void;
  tryNavigateToStep: (targetStep: number) => boolean;

  // Warning Modal State
  warningModal: WarningModalState;
  showWarningModal: (title: string, message: string) => void;
  closeWarningModal: () => void;
}

const AdmissionContext = createContext<AdmissionContextType | null>(null);

export const useAdmission = () => {
  const ctx = useContext(AdmissionContext);
  if (!ctx) {
    throw new Error('useAdmission must be used within AdmissionProvider');
  }
  return ctx;
};

const defaultDraft: Partial<StudentRecord> = {
  personal: {
    applicationNumber: '',
    registerNumber: '',
    studentName: '',
    dateOfBirth: '',
    age: undefined,
    aadhaarNumber: '',
    gender: undefined,
    district: '',
    nationality: 'Indian',
    caste: undefined,
  } as any,
  parent: {
    fatherName: '',
    fatherMobile: '',
    fatherOccupation: '',
    annualIncome: undefined,
  } as any,
  communication: {
    permanentAddress: {
      addressLine: '',
      pinCode: '',
      mobileNumber: '',
      email: '',
    },
    communicationAddress: {
      addressLine: '',
      pinCode: '',
      mobileNumber: '',
      email: '',
    },
    sameAsPermanent: false,
  } as any,
  academic: {
    admissionCategory: undefined,
    program: undefined,
    department: '',
    batch: '',
    dateOfAdmission: '',
  } as any,
  fee: {
    cutOffMark: undefined,
    tuitionFeePerYear: undefined,
    courseDurationYears: 4,
    totalTuitionFee: undefined,
    busTransportRequired: false,
    busRouteSelected: '',
    busStopSelected: '',
    busFee: 0,
    hostelRequired: false,
    hostelFee: 0,
    grandTotalFee: undefined,
  } as any,
  certificates: STANDARD_CERTIFICATES.map((name, i) => ({
    id: `cert-${i + 1}`,
    name,
    received: false,
  })),
};

const messageFromError = (e: unknown): string => {
  if (e instanceof ApiError) return e.message;
  if (e instanceof Error) return e.message;
  return 'Something went wrong. Please try again.';
};

export const AdmissionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [archivedStudents, setArchivedStudents] = useState<StudentRecord[]>([]);
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);

  const [masterData, setMasterData] = useState<MasterData>(emptyMasterData);
  const [masterDataLoading, setMasterDataLoading] = useState<boolean>(true);
  const [initialLoading, setInitialLoading] = useState<boolean>(true);

  const [activeStep, setActiveStep] = useState<number>(0);
  const [draftStudent, setDraftStudent] = useState<Partial<StudentRecord>>(defaultDraft);
  const [isEditMode, setIsEditMode] = useState<boolean>(false);
  const [isViewReadOnly, setIsViewReadOnly] = useState<boolean>(false);
  const [editingStudentId, setEditingStudentId] = useState<string | null>(null);
  const [savingStep, setSavingStep] = useState<boolean>(false);

  const [snackbar, setSnackbar] = useState<SnackbarState>({
    open: false,
    message: '',
    severity: 'success',
  });

  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState>({
    open: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  const [warningModal, setWarningModal] = useState<WarningModalState>({
    open: false,
    title: '',
    message: '',
  });

  const showWarningModal = (title: string, message: string) => {
    setWarningModal({ open: true, title, message });
  };

  const closeWarningModal = () => {
    setWarningModal((prev) => ({ ...prev, open: false }));
  };

  // Refs mirror state so async step saves always read fresh values.
  const draftRef = useRef<Partial<StudentRecord>>(defaultDraft);
  const editingStudentIdRef = useRef<string | null>(null);
  const activeStepRef = useRef<number>(0);
  const isViewReadOnlyRef = useRef<boolean>(false);
  const isEditModeRef = useRef<boolean>(false);
  const masterDataRef = useRef<MasterData>(emptyMasterData);

  const setDraftStudentSafe: React.Dispatch<React.SetStateAction<Partial<StudentRecord>>> = (
    value
  ) => {
    setDraftStudent((prev) => {
      const next = typeof value === 'function' ? (value as (p: Partial<StudentRecord>) => Partial<StudentRecord>)(prev) : value;
      draftRef.current = next;
      return next;
    });
  };

  const updateDraftSection = <K extends keyof StudentRecord>(
    section: K,
    value: StudentRecord[K]
  ) => {
    setDraftStudentSafe((prev) => ({ ...prev, [section]: value }));
  };

  const showSnackbar = (message: string, severity: SnackbarState['severity'] = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const hideSnackbar = () => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  };

  // ---------------- Storage & Unsaved Changes Helpers ----------------

  const getStorageKey = () => {
    return isEditModeRef.current && editingStudentIdRef.current
      ? `admission_draft_edit_${editingStudentIdRef.current}`
      : 'admission_draft_new';
  };

  const clearCurrentDraft = () => {
    try {
      const key = getStorageKey();
      localStorage.removeItem(key);
    } catch {
      // ignore storage errors
    }
  };

  const isFormDirty = React.useMemo(() => {
    if (isViewReadOnly) return false;
    const p = draftStudent.personal;
    if (!isEditMode) {
      return Boolean(
        p?.studentName ||
          p?.applicationNumber ||
          p?.aadhaarNumber ||
          p?.registerNumber ||
          draftStudent.parent?.fatherName ||
          draftStudent.communication?.permanentAddress?.addressLine
      );
    }
    // Edit mode dirty check
    const currentStr = JSON.stringify(draftStudent);
    const existingStr = JSON.stringify(
      students.find((s) => s.id === editingStudentId) || {}
    );
    return currentStr !== existingStr && Boolean(editingStudentId);
  }, [draftStudent, isEditMode, editingStudentId, isViewReadOnly, students]);

  // Save to localStorage when draft changes
  useEffect(() => {
    if (isViewReadOnly) return;
    if (isFormDirty) {
      try {
        const key = getStorageKey();
        localStorage.setItem(key, JSON.stringify(draftStudent));
      } catch {
        // ignore
      }
    }
  }, [draftStudent, isFormDirty, isViewReadOnly]);

  // Browser beforeunload protection
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isFormDirty) {
        e.preventDefault();
        e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
        return e.returnValue;
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isFormDirty]);

  const resetFormState = () => {
    try {
      const key = getStorageKey();
      localStorage.removeItem(key);
    } catch {
      // ignore
    }
    setDraftStudentSafe(JSON.parse(JSON.stringify(defaultDraft)));
    setIsEditMode(false);
    isEditModeRef.current = false;
    setIsViewReadOnly(false);
    isViewReadOnlyRef.current = false;
    setEditingStudentId(null);
    editingStudentIdRef.current = null;
    setActiveStep(0);
    activeStepRef.current = 0;
  };

  const requestNavigation = (onConfirmNav: () => void) => {
    if (!isFormDirty) {
      resetFormState();
      onConfirmNav();
      return;
    }
    showConfirm(
      'Unsaved Changes Warning',
      'Leaving this page will cause your unsaved form changes to be lost. Are you sure you want to proceed?',
      () => {
        resetFormState();
        onConfirmNav();
      },
      'Leave / Go to Dashboard',
      'Stay on Page'
    );
  };

  const tryNavigateToStep = (targetStep: number): boolean => {
    if (isViewReadOnlyRef.current) {
      setActiveStepSafe(targetStep);
      return true;
    }

    if (targetStep <= activeStepRef.current) {
      setActiveStepSafe(targetStep);
      return true;
    }

    const draft = draftRef.current;
    const stepChecks: { step: number; name: string; isComplete: () => boolean }[] = [
      { step: 0, name: 'Student Personal Information', isComplete: () => isStudentDetailsComplete(draft) },
      { step: 1, name: 'Parent & Guardian Details', isComplete: () => isParentDetailsComplete(draft) },
      { step: 2, name: 'Permanent & Communication Address', isComplete: () => isCommunicationComplete(draft) },
      { step: 3, name: 'Academic Admission Details', isComplete: () => isAdmissionDetailsComplete(draft) },
      { step: 4, name: 'Qualifying Examination / UG Details', isComplete: () => isQualifyingExamComplete(draft) },
      { step: 5, name: 'Fee Structure & Facilities', isComplete: () => isFeeComplete(draft) },
    ];

    for (let s = 0; s < targetStep; s++) {
      const check = stepChecks.find((c) => c.step === s);
      if (check && !check.isComplete()) {
        setActiveStepSafe(check.step);
        showSnackbar(`Please complete all required fields in ${check.name} before moving forward.`, 'error');
        return false;
      }
    }

    setActiveStepSafe(targetStep);
    return true;
  };

  const showConfirm = (
    title: string,
    message: string,
    onConfirm: () => void,
    confirmText: string = 'Confirm',
    cancelText: string = 'Cancel'
  ) => {
    setConfirmDialog({
      open: true,
      title,
      message,
      confirmText,
      cancelText,
      onConfirm: () => {
        onConfirm();
        hideConfirm();
      },
    });
  };

  const hideConfirm = () => {
    setConfirmDialog((prev) => ({ ...prev, open: false }));
  };

  // ---------------- Data loading ----------------

  const loadMasterData = async () => {
    try {
      const [programs, departments, categories, certificates, hostels, busRoutes, feeStructures, scholarshipStructures] =
        await Promise.all([
          masterDataApi.programs(),
          masterDataApi.departments(),
          masterDataApi.categories(),
          masterDataApi.certificates(),
          masterDataApi.hostels(),
          masterDataApi.busRoutes(),
          masterDataApi.feeStructures(),
          masterDataApi.scholarshipStructures(),
        ]);

      const deptByProgramName: Record<string, DepartmentDto[]> = {};
      for (const program of programs) {
        try {
          deptByProgramName[program.name] = await masterDataApi.departmentsByProgram(program.id);
        } catch {
          deptByProgramName[program.name] = [];
        }
      }

      const next: MasterData = {
        programs,
        departments,
        departmentsByProgram: deptByProgramName,
        categories,
        certificates,
        hostels,
        busRoutes,
        feeStructures,
        scholarshipStructures,
      };
      masterDataRef.current = next;
      setMasterData(next);
    } catch (e) {
      showSnackbar(messageFromError(e), 'error');
    } finally {
      setMasterDataLoading(false);
    }
  };

  const loadStudents = async () => {
    try {
      const [activePage, archivedPage] = await Promise.all([
        studentApi.listStudents({ page: 0, size: 1000 }),
        studentApi.listStudents({ status: 'Archived', page: 0, size: 1000 }),
      ]);

      setStudents(activePage.content.map(toStudentRecord));
      setArchivedStudents(archivedPage.content.map(toStudentRecord));
    } catch (e) {
      showSnackbar(messageFromError(e), 'error');
    } finally {
      setInitialLoading(false);
    }
  };

  useEffect(() => {
    loadMasterData();
    loadStudents();
  }, []);

  // ---------------- Wizard state ----------------

  const [viewModalStudent, setViewModalStudent] = useState<StudentRecord | null>(null);

  const closeViewModal = () => {
    setViewModalStudent(null);
  };

  const startAddAdmission = () => {
    setIsEditMode(false);
    isEditModeRef.current = false;
    setIsViewReadOnly(false);
    isViewReadOnlyRef.current = false;
    setEditingStudentId(null);
    editingStudentIdRef.current = null;
    setActiveStep(0);
    activeStepRef.current = 0;

    // Check localStorage for saved draft
    let initialVal = JSON.parse(JSON.stringify(defaultDraft));
    try {
      const saved = localStorage.getItem('admission_draft_new');
      if (saved) {
        initialVal = { ...initialVal, ...JSON.parse(saved) };
      }
    } catch {
      // ignore
    }

    setDraftStudentSafe(initialVal);
  };

  const startEditStudent = async (student: StudentRecord) => {
    const preservingUnsaved = editingStudentIdRef.current === student.id;

    setIsEditMode(true);
    isEditModeRef.current = true;
    setIsViewReadOnly(false);
    isViewReadOnlyRef.current = false;
    setEditingStudentId(student.id);
    editingStudentIdRef.current = student.id;
    setActiveStep(0);
    activeStepRef.current = 0;

    if (preservingUnsaved) {
      return;
    }

    let initialVal = JSON.parse(JSON.stringify(student));
    try {
      const saved = localStorage.getItem(`admission_draft_edit_${student.id}`);
      if (saved) {
        initialVal = { ...initialVal, ...JSON.parse(saved) };
      }
    } catch {
      // ignore
    }

    setDraftStudentSafe(initialVal);

    try {
      const dto = await studentApi.getStudent(student.id);
      const dbRecord = toStudentRecord(dto);
      // Only set dbRecord if no localStorage draft exists
      const saved = localStorage.getItem(`admission_draft_edit_${student.id}`);
      if (!saved) {
        setDraftStudentSafe(JSON.parse(JSON.stringify(dbRecord)));
      }
    } catch {
      // Keep existing record if error
    }
  };

  const startViewStudent = async (student: StudentRecord) => {
    setIsEditMode(false);
    isEditModeRef.current = false;
    setIsViewReadOnly(true);
    isViewReadOnlyRef.current = true;
    setEditingStudentId(student.id);
    editingStudentIdRef.current = student.id;
    setActiveStep(0);
    activeStepRef.current = 0;

    try {
      const dto = await studentApi.getStudent(student.id);
      const dbRecord = toStudentRecord(dto);
      setDraftStudentSafe(JSON.parse(JSON.stringify(dbRecord)));
      setViewModalStudent(dbRecord);
    } catch {
      setDraftStudentSafe(JSON.parse(JSON.stringify(student)));
      setViewModalStudent(student);
    }
  };

  const setActiveStepSafe = (step: number) => {
    activeStepRef.current = step;
    setActiveStep(step);
  };

  // ---------------- Step persistence ----------------

  const mergeDto = (dto: Parameters<typeof toStudentRecord>[0]) => {
    const record = toStudentRecord(dto);
    draftRef.current = { ...draftRef.current, ...record };
    setDraftStudentSafe((prev) => ({ ...prev, ...record }));
    return record;
  };

  const saveCurrentAdmission = async (): Promise<boolean> => {
    if (isViewReadOnlyRef.current) return false;

    const draft = draftRef.current;
    const master = masterDataRef.current;

    // Validate all sections before submitting
    const sectionChecks: { step: number; valid: boolean }[] = [
      { step: 0, valid: studentDetailsSchema.safeParse(draft.personal).success },
      { step: 1, valid: parentDetailsSchema.safeParse(draft.parent).success },
      { step: 2, valid: communicationSchema.safeParse(draft.communication).success },
      { step: 3, valid: academicDetailsSchema.safeParse(draft.academic).success },
    ];
    const invalid = sectionChecks.find((check) => !check.valid);
    if (invalid) {
      setActiveStepSafe(invalid.step);
      showSnackbar('Please complete the highlighted section before saving.', 'error');
      return false;
    }

    const lookup: AcademicLookup = {
      categories: master.categories,
      programs: master.programs,
      departments: master.departments,
    };
    const program = draft.academic?.program;

    const payload: SubmitAdmissionRequest = {
      studentId: editingStudentIdRef.current ? Number(editingStudentIdRef.current) : null,
      personal: toPersonalStepRequest(draft.personal!),
      parent: toParentStepRequest(draft.parent!),
      communication: toCommunicationStepRequest(draft.communication!),
      academic: toAcademicStepRequest(draft.academic!, lookup),
      qualifyingExam:
        program === 'First Year B.Tech' && draft.qualifyingExam
          ? toQualifyingExamStepRequest(draft.qualifyingExam)
          : undefined,
      hscMarks:
        program === 'First Year B.Tech' && draft.hscMarks
          ? toHscMarksStepRequest(draft.hscMarks)
          : undefined,
      diploma:
        program === 'Second Year B.Tech (Lateral Entry)' && draft.diplomaDetails
          ? toDiplomaStepRequest(draft.diplomaDetails)
          : undefined,
      pg:
        program === 'PG' && draft.pgQualification
          ? toPgStepRequest(draft.pgQualification)
          : undefined,
      fee: draft.fee ? toFeeStepRequest(draft.fee, master.busRoutes) : undefined,
      certificates: draft.certificates
        ? toCertificatesStepRequest(draft.certificates, master.certificates)
        : undefined,
    };

    setSavingStep(true);
    try {
      const dto = await studentApi.submitAdmission(payload);
      const studentId = dto.id;

      const masterCertificates = master.certificates || [];
      const certIdOf = (cert: CertificateItem): number | null => {
        const master = masterCertificates.find(
          (m) => m.name.toUpperCase() === cert.name.toUpperCase()
        );
        if (master) return master.id;
        const parsed = /^\d+$/.test(cert.id) ? Number(cert.id) : NaN;
        return Number.isNaN(parsed) ? null : parsed;
      };

      const certsToUpload = (draft.certificates || []).filter(
        (c) => c.file instanceof File
      );
      const certsToRemove = (draft.certificates || []).filter(
        (c) => c.file == null || c.file === ''
      );

      await Promise.all([
        ...certsToUpload.map((c) => {
          const certificateId = certIdOf(c);
          if (certificateId == null) {
            showSnackbar(`Could not resolve certificate: ${c.name}`, 'error');
            return Promise.resolve();
          }
          return certificateApi
            .upload(studentId, certificateId, c.file as File)
            .catch((e) =>
              showSnackbar(`Upload failed for ${c.name}: ${messageFromError(e)}`, 'error')
            );
        }),
        ...certsToRemove.map((c) => {
          const certificateId = certIdOf(c);
          return certificateId != null
            ? certificateApi.remove(studentId, certificateId).catch(() => undefined)
            : Promise.resolve();
        }),
      ]);

      const fresh = await studentApi.getStudent(studentId);
      const record = mergeDto(fresh);

      setStudents((prev) => {
        const exists = prev.some((s) => s.id === record.id);
        if (exists) return prev.map((s) => (s.id === record.id ? record : s));
        return [record, ...prev];
      });

      showSnackbar(
        isEditModeRef.current
          ? 'Student details updated successfully!'
          : 'New Admission created successfully!'
      );
      clearCurrentDraft();
      startAddAdmission();
      startViewStudent(record);
      return true;
    } catch (e) {
      showSnackbar(messageFromError(e), 'error');
      return false;
    } finally {
      setSavingStep(false);
    }
  };

  // ---------------- Archive / restore ----------------

  const archiveSingleStudent = async (studentId: string, reason: string, description?: string) => {
    try {
      const dto = await studentApi.archive(Number(studentId), { reason, description });
      const record = toStudentRecord(dto);
      setStudents((prev) => prev.filter((s) => s.id !== studentId));
      setArchivedStudents((prev) => [record, ...prev]);
      setSelectedStudentIds((prev) => prev.filter((id) => id !== studentId));
      showSnackbar('Student archived successfully.');
    } catch (e) {
      showSnackbar(messageFromError(e), 'error');
    }
  };

  const archiveSelectedStudents = async (reason: string) => {
    if (selectedStudentIds.length === 0) return;
    try {
      const dtos = await Promise.all(
        selectedStudentIds.map((id) => studentApi.archive(Number(id), { reason }))
      );
      const records = dtos.map(toStudentRecord);
      setStudents((prev) => prev.filter((s) => !selectedStudentIds.includes(s.id)));
      setArchivedStudents((prev) => [...records, ...prev]);
      showSnackbar(`${records.length} student(s) archived successfully.`);
      setSelectedStudentIds([]);
    } catch (e) {
      showSnackbar(messageFromError(e), 'error');
    }
  };

  const restoreStudents = async (studentIds: string[]) => {
    try {
      const dtos = await Promise.all(studentIds.map((id) => studentApi.restore(Number(id))));
      const records = dtos.map(toStudentRecord);
      setArchivedStudents((prev) => prev.filter((s) => !studentIds.includes(s.id)));
      setStudents((prev) => [...records, ...prev]);
      showSnackbar(`${records.length} student(s) restored to Active list successfully.`);
    } catch (e) {
      showSnackbar(messageFromError(e), 'error');
    }
  };

  return (
    <AdmissionContext.Provider
      value={{
        students,
        archivedStudents,
        selectedStudentIds,
        setSelectedStudentIds,
        masterData,
        masterDataLoading,
        appLoading: initialLoading || masterDataLoading,
        activeStep,
        setActiveStep: setActiveStepSafe,
        draftStudent,
        setDraftStudent: setDraftStudentSafe,
        updateDraftSection,
        isEditMode,
        isViewReadOnly,
        editingStudentId,
        viewModalStudent,
        closeViewModal,
        startAddAdmission,
        startEditStudent,
        startViewStudent,
        savingStep,
        saveCurrentAdmission,
        archiveSelectedStudents,
        archiveSingleStudent,
        restoreStudents,
        refreshStudents: loadStudents,
        snackbar,
        showSnackbar,
        hideSnackbar,
        confirmDialog,
        showConfirm,
        hideConfirm,
        isFormDirty,
        clearCurrentDraft,
        requestNavigation,
        tryNavigateToStep,
        warningModal,
        showWarningModal,
        closeWarningModal,
      }}
    >
      {children}
      <WarningModal
        open={warningModal.open}
        title={warningModal.title}
        message={warningModal.message}
        onClose={closeWarningModal}
      />
    </AdmissionContext.Provider>
  );
};

export type { StudentFilterParams };
