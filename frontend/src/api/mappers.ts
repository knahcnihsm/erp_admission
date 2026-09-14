import {
  AcademicDetails,
  CertificateItem,
  CommunicationDetails,
  DiplomaDetails,
  FeeDetails,
  HSCMarksData,
  HSCSubjectMark,
  ParentDetails,
  PGQualificationDetails,
  QualifyingExamDetails,
  StudentPersonalDetails,
  StudentRecord,
} from '../types';
import {
  AcademicStepRequest,
  BusRouteDto,
  Caste,
  CategoryDto,
  CertificateMasterDto,
  CertificatesStepRequest,
  CommunicationStepRequest,
  DiplomaStepRequest,
  FeeStepRequest,
  Gender,
  HscMarksStepRequest,
  ParentStepRequest,
  PaymentStatus,
  PgStepRequest,
  PersonalStepRequest,
  ProgramDto,
  QualifyingExamStepRequest,
  StudentResponseDto,
  StudentStatus,
} from './types';
import { STANDARD_CERTIFICATES } from '../utils/constants';

const num = (v?: number | null): number => (v === null || v === undefined ? 0 : Number(v));

const toFrontendGender = (g?: Gender): 'Male' | 'Female' | 'Others' | undefined => g ?? undefined;

export const toBackendGender = (g?: string): Gender | null => {
  if (!g) return null;
  // Normalise to Title Case: 'male' -> 'Male', 'MALE' -> 'Male', 'Male' -> 'Male'
  const titleCase = g.charAt(0).toUpperCase() + g.slice(1).toLowerCase() as Gender;
  return titleCase === 'Male' || titleCase === 'Female' || titleCase === 'Others'
    ? titleCase
    : null;
};

const toFrontendCaste = (c?: Caste): string => c ?? '';

export const toBackendCaste = (caste?: string): Caste | null => {
  if (!caste) return null;
  const upper = caste.trim().toUpperCase();
  switch (upper) {
    case 'BC':
    case 'BCM':
    case 'MBC':
      return 'OBC';
    case 'OC':
    case 'SCA':
      return 'Others';
    case 'OBC':
    case 'SC':
    case 'ST':
      return upper as Caste;
    case 'OTHERS':
      return 'Others';
    default:
      return null;
  }
};

const toFrontendStatus = (status?: StudentStatus): 'Active' | 'Archived' => {
  if (status === 'Archived') return 'Archived';
  return 'Active';
};

const toFrontendPaymentStatus = (s?: PaymentStatus): 'Paid' | 'Partial' | 'Pending' => {
  switch (s) {
    case 'Paid':
      return 'Paid';
    case 'Partial':
      return 'Partial';
    default:
      return 'Pending';
  }
};

const defaultFee = (): FeeDetails => ({
  cutOffMark: 0,
  tuitionFeePerYear: 0,
  courseDurationYears: 0,
  totalTuitionFee: 0,
  busTransportRequired: false,
  busRouteSelected: '',
  busStopSelected: '',
  busFee: 0,
  hostelRequired: false,
  hostelFee: 0,
  grandTotalFee: 0,
  paidAmount: 0,
  pendingAmount: 0,
  paymentStatus: 'Pending',
  receiptHistory: [],
});

export function toStudentRecord(dto: StudentResponseDto): StudentRecord {
  const p = dto;
  const comm = p.communication;
  const perm = comm?.permanentAddress;
  const commAddr = comm?.communicationAddress;
  const fee = p.fee;

  const personal: StudentPersonalDetails = {
    applicationNumber: p.applicationNumber || '',
    registerNumber: p.registerNumber || '',
    studentName: p.studentName || '',
    dateOfBirth: p.dateOfBirth || '',
    age: p.age ?? 0,
    aadhaarNumber: p.aadhaarNumber || '',
    gender: toFrontendGender(p.gender) as StudentPersonalDetails['gender'],
    district: p.district || '',
    nationality: p.nationality || '',
    caste: toFrontendCaste(p.caste),
    mobileNumber: p.mobileNumber || '',
    emailId: p.emailId || '',
  };

  const parent: ParentDetails = {
    fatherName: p.parent?.fatherName || '',
    fatherMobile: p.parent?.fatherMobile || '',
    fatherOccupation: p.parent?.fatherOccupation || '',
    annualIncome: num(p.parent?.annualIncome),
    parentMobile: p.parent?.fatherMobile || '',
  };

  const communication: CommunicationDetails = {
    permanentAddress: {
      addressLine: perm?.addressLine || '',
      pinCode: perm?.pincode || '',
      phoneNumber: perm?.phone || '',
      mobileNumber: perm?.mobile || '',
      email: perm?.email || '',
    },
    communicationAddress: {
      addressLine: commAddr?.addressLine || '',
      pinCode: commAddr?.pincode || '',
      phoneNumber: commAddr?.phone || '',
      mobileNumber: commAddr?.mobile || '',
      email: commAddr?.email || '',
    },
    sameAsPermanent: comm?.sameAsPermanent ?? false,
  };

  const academic: AcademicDetails = {
    admissionCategory: (p.academic?.category as AcademicDetails['admissionCategory']) || undefined,
    program: (p.academic?.program as AcademicDetails['program']) || undefined,
    department: p.academic?.department || '',
    batch: p.academic?.batch || '',
    dateOfAdmission: p.academic?.dateOfAdmission || '',
  };

  const toMarks = (m?: { subject?: string; monthYear?: string; maxMarks?: number; marksObtained?: number; percentage?: number }[]): HSCSubjectMark[] =>
    (m || []).map((x) => ({
      subject: x.subject || '',
      monthYear: x.monthYear || '',
      maxMarks: num(x.maxMarks),
      marksObtained: num(x.marksObtained),
      percentage: num(x.percentage),
    }));

  const qualifyingExam: QualifyingExamDetails = {
    institutionName: p.qualifyingExam?.institutionName || '',
    institutionPlace: p.qualifyingExam?.institutionPlace || '',
    examinationPassed: (p.qualifyingExam?.examPassed as QualifyingExamDetails['examinationPassed']) || 'HSC',
    monthYearPassing: p.qualifyingExam?.monthYearPassing || '',
    sslcPercentage: p.qualifyingExam?.sslcPercentage ?? 0,
    sslcRegisterNumber: p.qualifyingExam?.sslcRegisterNumber || '',
    hscPercentage: p.qualifyingExam?.hscPercentage ?? 0,
    hscRegisterNumber: p.qualifyingExam?.hscRegisterNumber || '',
  };

  const hscMarks: HSCMarksData = {
    stream: (p.hscMarks?.stream === 'Vocational' ? 'Vocational' : 'Academic') as HSCMarksData['stream'],
    academicMarks: toMarks(p.hscMarks?.academicMarks),
    vocationalMarks: toMarks(p.hscMarks?.vocationalMarks),
    totalMaxMarks: num(p.hscMarks?.totalMaxMarks),
    totalMarksObtained: num(p.hscMarks?.totalMarksObtained),
    overallPercentage: num(p.hscMarks?.overallPercentage),
    engineeringCutOff: num(p.hscMarks?.engineeringCutOff),
  };

  const diplomaDetails: DiplomaDetails = {
    diplomaCourse: p.diplomaDetails?.diplomaCourse || '',
    institutionName: p.diplomaDetails?.institutionName || '',
    board: p.diplomaDetails?.board || '',
    secondYearPercentage: p.diplomaDetails?.secondYearPercentage ?? 0,
    thirdYearPercentage: p.diplomaDetails?.thirdYearPercentage ?? 0,
    aggregatePercentage: p.diplomaDetails?.aggregatePercentage ?? 0,
  };

  const pgQualification: PGQualificationDetails = {
    universityName: p.pgQualification?.universityName || '',
    universityPlace: p.pgQualification?.universityPlace || '',
    institutionName: p.pgQualification?.institutionName || '',
    institutionPlace: p.pgQualification?.institutionPlace || '',
    examinationPassed: p.pgQualification?.examPassed || '',
    monthYearPassing: p.pgQualification?.monthYearPassing || '',
    totalPercentage: p.pgQualification?.totalPercentage ?? 0,
    mainSubjectPercentage: p.pgQualification?.mainSubjectPercentage ?? 0,
    degreeRegistrationNumber: p.pgQualification?.degreeRegistrationNumber || '',
  };

  const feeDetails: FeeDetails = fee
    ? {
        ...defaultFee(),
        cutOffMark: num(fee.cutOffMark),
        meritPercent: num(fee.meritPercent),
        originalTuitionFee: num(fee.originalTuitionFeePerYear),
        scholarshipAmount: num(fee.scholarshipAmount),
        tuitionFeePerYear: num(fee.tuitionFeePerYear),
        courseDurationYears: num(fee.courseDurationYears),
        totalTuitionFee: num(fee.totalTuitionFee),
        busTransportRequired: fee.busRequired ?? false,
        busRouteSelected: fee.routeName || '',
        busStopSelected: fee.busStopName || '',
        busFee: num(fee.busFee),
        hostelRequired: fee.hostelRequired ?? false,
        hostelFee: num(fee.hostelFee),
        grandTotalFee: num(fee.totalFee),
        paidAmount: num(fee.paidAmount),
        pendingAmount: num(fee.pendingAmount),
        paymentStatus: toFrontendPaymentStatus(fee.paymentStatus),
      }
    : defaultFee();

  const certificateDtos = p.certificates || [];
  const certificates: CertificateItem[] =
    certificateDtos.length > 0
      ? certificateDtos.map((c, i) => {
          const serverPath =
            c.filePath && c.filePath.startsWith('/uploads/') ? c.filePath : null;
          return {
            id: c.certificateId !== undefined ? String(c.certificateId) : `cert-${i + 1}`,
            name: c.name || '',
            received: !!c.submitted,
            file: serverPath,
            fileName: serverPath ? serverPath.split('/').pop() || serverPath : undefined,
            uploadedAt: serverPath ? c.uploadedAt : undefined,
          };
        })
      : STANDARD_CERTIFICATES.map((name, i) => ({
          id: `cert-${i + 1}`,
          name,
          received: false,
        }));

  return {
    id: String(p.id),
    personal,
    parent,
    communication,
    academic,
    qualifyingExam,
    hscMarks,
    diplomaDetails,
    pgQualification,
    fee: feeDetails,
    certificates,
    status: toFrontendStatus(p.status),
    createdAt: p.createdAt || '',
    updatedAt: p.updatedAt || '',
    archivedAt: p.archivedAt || '',
    archiveReason: p.archiveReason || '',
  };
}

// ---------------- Step request builders ----------------

export function toPersonalStepRequest(p: StudentPersonalDetails): PersonalStepRequest {
  return {
    applicationNumber: p.applicationNumber,
    registerNumber: p.registerNumber || undefined,
    studentName: p.studentName,
    dateOfBirth: p.dateOfBirth,
    aadhaarNumber: p.aadhaarNumber || undefined,
    gender: toBackendGender(p.gender),
    district: p.district || undefined,
    nationality: p.nationality || undefined,
    caste: toBackendCaste(p.caste),
    mobileNumber: p.mobileNumber || undefined,
    emailId: p.emailId || undefined,
  };
}

export function toParentStepRequest(p: ParentDetails): ParentStepRequest {
  return {
    fatherName: p.fatherName,
    fatherMobile: p.fatherMobile || undefined,
    fatherOccupation: p.fatherOccupation || undefined,
    annualIncome: p.annualIncome ?? undefined,
  };
}

export function toCommunicationStepRequest(c: CommunicationDetails): CommunicationStepRequest {
  const perm = c.permanentAddress;
  const comm = c.communicationAddress;
  return {
    permanentAddress: {
      addressLine: perm.addressLine || undefined,
      pincode: perm.pinCode || undefined,
      phone: perm.phoneNumber || undefined,
      mobile: perm.mobileNumber || undefined,
      email: perm.email || undefined,
    },
    communicationAddress: {
      addressLine: comm.addressLine || undefined,
      pincode: comm.pinCode || undefined,
      phone: comm.phoneNumber || undefined,
      mobile: comm.mobileNumber || undefined,
      email: comm.email || undefined,
    },
    sameAsPermanent: c.sameAsPermanent,
  };
}

export interface AcademicLookup {
  categories: CategoryDto[];
  programs: ProgramDto[];
  departments: { id: number; name: string }[];
}

export function toAcademicStepRequest(
  a: AcademicDetails,
  lookup: AcademicLookup
): AcademicStepRequest {
  const categoryId = lookup.categories.find((c) => c.name === a.admissionCategory)?.id;
  const programId = lookup.programs.find((p) => p.name === a.program)?.id;
  const departmentId = lookup.departments.find((d) => d.name === a.department)?.id;
  return {
    categoryId: categoryId ?? 0,
    programId: programId ?? 0,
    departmentId: departmentId ?? null,
    batch: a.batch || undefined,
    dateOfAdmission: a.dateOfAdmission || undefined,
  };
}

export function toQualifyingExamStepRequest(q: QualifyingExamDetails): QualifyingExamStepRequest {
  return {
    institutionName: q.institutionName || undefined,
    institutionPlace: q.institutionPlace || undefined,
    examPassed: q.examinationPassed || undefined,
    monthYearPassing: q.monthYearPassing || undefined,
    sslcPercentage: q.sslcPercentage ?? undefined,
    sslcRegisterNumber: q.sslcRegisterNumber || undefined,
    hscPercentage: q.hscPercentage ?? undefined,
    hscRegisterNumber: q.hscRegisterNumber || undefined,
  };
}

export function toHscMarksStepRequest(h: HSCMarksData): HscMarksStepRequest {
  return {
    stream: h.stream,
    academicMarks: (h.academicMarks || []).map((m) => ({
      subject: m.subject,
      monthYear: m.monthYear || undefined,
      maxMarks: m.maxMarks,
      marksObtained: m.marksObtained,
    })),
    vocationalMarks: (h.vocationalMarks || []).map((m) => ({
      subject: m.subject,
      monthYear: m.monthYear || undefined,
      maxMarks: m.maxMarks,
      marksObtained: m.marksObtained,
    })),
  };
}

export function toDiplomaStepRequest(d: DiplomaDetails): DiplomaStepRequest {
  return {
    diplomaCourse: d.diplomaCourse || undefined,
    institutionName: d.institutionName || undefined,
    board: d.board || undefined,
    secondYearPercentage: d.secondYearPercentage ?? undefined,
    thirdYearPercentage: d.thirdYearPercentage ?? undefined,
    aggregatePercentage: d.aggregatePercentage ?? undefined,
  };
}

export function toPgStepRequest(p: PGQualificationDetails): PgStepRequest {
  return {
    universityName: p.universityName || undefined,
    universityPlace: p.universityPlace || undefined,
    institutionName: p.institutionName || undefined,
    institutionPlace: p.institutionPlace || undefined,
    examPassed: p.examinationPassed || undefined,
    monthYearPassing: p.monthYearPassing || undefined,
    totalPercentage: p.totalPercentage ?? undefined,
    mainSubjectPercentage: p.mainSubjectPercentage ?? undefined,
    degreeRegistrationNumber: p.degreeRegistrationNumber || undefined,
  };
}

export function toFeeStepRequest(f: FeeDetails, busRoutes: BusRouteDto[]): FeeStepRequest {
  let routeId: number | null = null;
  let busStopId: number | null = null;
  if (f.busTransportRequired && f.busRouteSelected) {
    const route = busRoutes.find((r) => r.name === f.busRouteSelected);
    if (route) {
      routeId = route.id;
      if (f.busStopSelected) {
        const stop = route.stops.find((s) => s.name === f.busStopSelected);
        if (stop) {
          busStopId = stop.id;
        }
      }
    }
  }
  return {
    cutOffMark: f.cutOffMark ?? undefined,
    busRequired: !!f.busTransportRequired,
    routeId,
    busStopId,
    hostelRequired: !!f.hostelRequired,
  };
}

export function toCertificatesStepRequest(
  certs: CertificateItem[],
  masterCertificates: CertificateMasterDto[]
): CertificatesStepRequest {
  return {
    certificates: certs.map((c) => {
      const master = masterCertificates.find(
        (m) => m.name.toUpperCase() === c.name.toUpperCase()
      );
      const parsedId = /^\d+$/.test(c.id) ? Number(c.id) : NaN;
      return {
        certificateId: master?.id ?? parsedId,
        submitted: !!c.received,
        filePath:
          typeof c.file === 'string' && c.file.startsWith('/uploads/')
            ? c.file
            : undefined,
      };
    }),
  };
}
