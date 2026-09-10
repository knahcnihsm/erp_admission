export type Gender = 'Male' | 'Female' | 'Others';
export type Caste = 'SC' | 'ST' | 'OBC' | 'Others';
export type Nationality = 'Indian' | 'Other';

export interface StudentPersonalDetails {
  applicationNumber: string;
  registerNumber?: string;
  studentName: string;
  dateOfBirth: string; // YYYY-MM-DD
  age: number;
  aadhaarNumber: string; // 12 digits
  gender: Gender;
  district: string;
  nationality: string;
  caste: string;
  mobileNumber?: string; // 10 digits
  emailId?: string;
}

export interface ParentDetails {
  fatherName: string;
  fatherMobile: string; // 10 digits
  fatherOccupation: string;
  annualIncome: number;
  parentMobile?: string;
}

export interface Address {
  addressLine: string;
  pinCode: string; // 6 digits
  phoneNumber?: string;
  mobileNumber: string; // 10 digits
  email: string;
}

export interface CommunicationDetails {
  permanentAddress: Address;
  communicationAddress: Address;
  sameAsPermanent: boolean;
}

export type AdmissionCategory = 'Centac' | 'Management';
export type ProgramType = 'First Year B.Tech' | 'Second Year B.Tech (Lateral Entry)' | 'PG';

export interface AcademicDetails {
  admissionCategory: AdmissionCategory;
  program: ProgramType;
  department: string;
  batch: string;
  dateOfAdmission: string;
  semester?: string;
  counsellingRank?: string | number;
  firstGraduate?: boolean | string;
  scholarship?: boolean | string;
}

export type ExamPassed = 'HSC' | 'CBSE' | 'ISC' | 'Other';

export interface QualifyingExamDetails {
  institutionName: string;
  institutionPlace: string;
  examinationPassed: ExamPassed;
  monthYearPassing: string;
  sslcPercentage: number;
  sslcRegisterNumber: string;
  sslcBoard?: string;
  sslcMarksObtained?: number;
  sslcTotalMarks?: number;
  sslcSchoolName?: string;
  hscPercentage: number;
  hscRegisterNumber: string;
  hscBoard?: string;
  hscSchoolName?: string;
}

export interface HSCSubjectMark {
  subject: string;
  monthYear: string;
  maxMarks: number;
  marksObtained: number;
  percentage: number;
}

export interface HSCMarksData {
  stream: 'Academic' | 'Vocational';
  academicMarks: HSCSubjectMark[];
  vocationalMarks: HSCSubjectMark[];
  totalMaxMarks: number;
  totalMarksObtained: number;
  overallPercentage: number;
  engineeringCutOff: number;
}

export interface DiplomaDetails {
  diplomaCourse: string;
  institutionName: string;
  board: 'DOTE' | 'AICTE' | 'Autonomous' | 'Other' | string;
  secondYearPercentage: number;
  thirdYearPercentage: number;
  aggregatePercentage: number;
}

export interface PGQualificationDetails {
  universityName: string;
  universityPlace: string;
  institutionName: string;
  institutionPlace: string;
  examinationPassed: string; // e.g. B.E., B.Tech, B.Sc
  monthYearPassing: string;
  totalPercentage: number;
  mainSubjectPercentage: number;
  degreeRegistrationNumber: string;
}

export interface ReceiptRecord {
  receiptNo: string;
  date: string;
  amount: number;
  mode: 'Cash' | 'Online' | 'DD' | 'UPI' | 'Cheque';
  status: 'Completed' | 'Pending';
}

export interface FeeDetails {
  cutOffMark: number;
  meritPercent?: number;
  originalTuitionFee?: number;
  scholarshipAmount?: number;
  tuitionFeePerYear: number;
  courseDurationYears: number;
  totalTuitionFee: number;
  busTransportRequired?: boolean;
  busRouteSelected: string; // Empty if transport is off
  busStopSelected?: string;  // Empty if transport is off
  busFee: number;
  hostelRequired: boolean;
  hostelFee: number;
  grandTotalFee: number;
  paidAmount?: number;
  pendingAmount?: number;
  paymentStatus?: 'Paid' | 'Partial' | 'Pending';
  receiptHistory?: ReceiptRecord[];
}

export interface CertificateItem {
  id: string;
  name: string;
  received: boolean;
  file?: File | string | null;
  fileName?: string;
  uploadedAt?: string;
}

export interface StudentRecord {
  id: string;
  personal: StudentPersonalDetails;
  parent: ParentDetails;
  communication: CommunicationDetails;
  academic: AcademicDetails;
  qualifyingExam?: QualifyingExamDetails;
  hscMarks?: HSCMarksData;
  diplomaDetails?: DiplomaDetails;
  pgQualification?: PGQualificationDetails;
  fee: FeeDetails;
  certificates: CertificateItem[];
  status: 'Active' | 'Archived';
  createdAt: string;
  updatedAt: string;

  // Archive audit fields
  archivedAt?: string;
  archiveReason?: string;
}
