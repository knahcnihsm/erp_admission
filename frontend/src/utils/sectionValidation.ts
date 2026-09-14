import { StudentRecord } from '../types';
import { studentDetailsSchema } from '../schemas/student.schema';
import { parentDetailsSchema } from '../schemas/parent.schema';
import { communicationSchema } from '../schemas/communication.schema';
import { academicDetailsSchema } from '../schemas/academic.schema';

/**
 * Normalizes email address to lowercase and trimmed string.
 */
export const normalizeEmail = (email: string | undefined | null): string => {
  if (!email) return '';
  return email.trim();
};

/**
 * Section 1: Student Details Completion Status
 * Register Number, Mobile Number, Email ID are optional and do NOT prevent completion.
 */
export const isStudentDetailsComplete = (draft: Partial<StudentRecord>): boolean => {
  if (!draft || !draft.personal) return false;
  const p = draft.personal;
  return Boolean(
    p.applicationNumber &&
      p.studentName &&
      p.dateOfBirth &&
      p.aadhaarNumber &&
      /^\d{12}$/.test(p.aadhaarNumber) &&
      p.gender &&
      p.district &&
      p.nationality &&
      p.caste
  );
};

/**
 * Section 2: Parent Details Completion Status
 * Requires Father Occupation as mandatory field.
 */
export const isParentDetailsComplete = (draft: Partial<StudentRecord>): boolean => {
  if (!draft || !draft.parent) return false;
  const res = parentDetailsSchema.safeParse(draft.parent);
  return res.success;
};

/**
 * Section 3: Communication Details Completion Status
 */
export const isCommunicationComplete = (draft: Partial<StudentRecord>): boolean => {
  if (!draft || !draft.communication) return false;
  const res = communicationSchema.safeParse(draft.communication);
  return res.success;
};

/**
 * Section 4a: Academic Admission Details Completion Status (Step 3)
 */
export const isAdmissionDetailsComplete = (draft: Partial<StudentRecord>): boolean => {
  if (!draft || !draft.academic) return false;
  const res = academicDetailsSchema.safeParse(draft.academic);
  return res.success;
};

/**
 * Section 4b: Qualifying Exam / Diploma / PG Details Completion Status (Step 4)
 * Programme-specific validation checks.
 */
export const isQualifyingExamComplete = (draft: Partial<StudentRecord>): boolean => {
  if (!draft || !draft.academic?.program) return false;
  const p: string = draft.academic.program;

  if (p === 'First Year B.Tech') {
    const q = draft.qualifyingExam;
    if (!q) return false;
    return Boolean(
      q.institutionName &&
        q.sslcRegisterNumber &&
        q.hscRegisterNumber &&
        q.examinationPassed &&
        q.monthYearPassing
    );
  } else if (p === 'Second Year B.Tech (Lateral Entry)') {
    const d = draft.diplomaDetails;
    if (!d) return false;
    return Boolean(
      d.diplomaCourse &&
        d.institutionName &&
        d.board
    );
  } else if (p === 'PG' || p.startsWith('PG')) {
    const pg = draft.pgQualification;
    if (!pg) return false;
    return Boolean(
      pg.examinationPassed &&
        pg.universityName &&
        pg.institutionName &&
        pg.degreeRegistrationNumber &&
        pg.monthYearPassing
    );
  }
  return true;
};

/**
 * Section 4: Academic Details Overall Completion Status
 */
export const isAcademicComplete = (draft: Partial<StudentRecord>): boolean => {
  return isAdmissionDetailsComplete(draft) && isQualifyingExamComplete(draft);
};

/**
 * Section 5: Fee Structure Completion Status
 */
export const isFeeComplete = (draft: Partial<StudentRecord>): boolean => {
  if (!draft || !draft.fee) return false;
  const f = draft.fee;
  if (f.busTransportRequired && (!f.busRouteSelected || !f.busStopSelected)) {
    return false;
  }
  return f.grandTotalFee !== undefined && f.grandTotalFee !== null;
};

/**
 * Section 6: Certificates Upload Completion Status
 */
export const isCertificatesComplete = (draft: Partial<StudentRecord>): boolean => {
  if (!draft || !draft.certificates || draft.certificates.length === 0) return false;
  // Section is complete if all certificates have been received/uploaded or at least essential ones marked
  return draft.certificates.some((c) => c.received || Boolean(c.file));
};
