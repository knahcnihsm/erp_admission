export type Gender = 'Male' | 'Female' | 'Others';
export type Caste = 'OBC' | 'SC' | 'ST' | 'Others';
export type StudentStatus = 'Draft' | 'Active' | 'Archived';
export type PaymentStatus = 'Paid' | 'Partial' | 'Pending';

export interface PersonalStepRequest {
  applicationNumber: string;
  registerNumber?: string;
  studentName: string;
  dateOfBirth: string;
  aadhaarNumber?: string;
  gender?: Gender | null;
  district?: string;
  nationality?: string;
  caste?: Caste | null;
  mobileNumber?: string;
  emailId?: string;
}

export interface ParentStepRequest {
  fatherName: string;
  fatherMobile?: string;
  fatherOccupation?: string;
  annualIncome?: number;
}

export interface AddressRequest {
  addressLine?: string;
  pincode?: string;
  phone?: string;
  mobile?: string;
  email?: string;
}

export interface CommunicationStepRequest {
  permanentAddress: AddressRequest;
  communicationAddress: AddressRequest;
  sameAsPermanent: boolean;
}

export interface AcademicStepRequest {
  categoryId: number;
  programId: number;
  departmentId?: number | null;
  batch?: string;
  dateOfAdmission?: string;
}

export interface QualifyingExamStepRequest {
  institutionName?: string;
  institutionPlace?: string;
  examPassed?: string;
  monthYearPassing?: string;
  sslcPercentage?: number;
  sslcRegisterNumber?: string;
  hscPercentage?: number;
  hscRegisterNumber?: string;
}

export interface SubjectMarkRequest {
  subject: string;
  monthYear?: string;
  maxMarks?: number;
  marksObtained?: number;
}

export interface HscMarksStepRequest {
  stream: string;
  academicMarks: SubjectMarkRequest[];
  vocationalMarks: SubjectMarkRequest[];
}

export interface DiplomaStepRequest {
  diplomaCourse?: string;
  institutionName?: string;
  board?: string;
  secondYearPercentage?: number;
  thirdYearPercentage?: number;
  aggregatePercentage?: number;
}

export interface PgStepRequest {
  universityName?: string;
  universityPlace?: string;
  institutionName?: string;
  institutionPlace?: string;
  examPassed?: string;
  monthYearPassing?: string;
  totalPercentage?: number;
  mainSubjectPercentage?: number;
  degreeRegistrationNumber?: string;
}

export interface FeeStepRequest {
  cutOffMark?: number;
  busRequired: boolean;
  routeId?: number | null;
  busStopId?: number | null;
  hostelRequired: boolean;
}

export interface CertificateItemRequest {
  certificateId: number;
  submitted: boolean;
  filePath?: string;
}

export interface CertificatesStepRequest {
  certificates: CertificateItemRequest[];
}

export interface SubmitAdmissionRequest {
  studentId?: number | null;
  personal: PersonalStepRequest;
  parent: ParentStepRequest;
  communication: CommunicationStepRequest;
  academic: AcademicStepRequest;
  qualifyingExam?: QualifyingExamStepRequest;
  hscMarks?: HscMarksStepRequest;
  diploma?: DiplomaStepRequest;
  pg?: PgStepRequest;
  fee?: FeeStepRequest;
  certificates?: CertificatesStepRequest;
}

export interface ArchiveRequest {
  reason: string;
  description?: string;
}

export interface SubjectMarkDto {
  subject: string;
  monthYear?: string;
  maxMarks?: number;
  marksObtained?: number;
  percentage?: number;
}

export interface CertificateDto {
  certificateId?: number;
  name?: string;
  submitted: boolean;
  filePath?: string;
  uploadedAt?: string;
}

export interface StudentResponseDto {
  id: number;
  applicationNumber?: string;
  registerNumber?: string;
  studentName?: string;
  dateOfBirth?: string;
  age?: number;
  aadhaarNumber?: string;
  mobileNumber?: string;
  emailId?: string;
  gender?: Gender;
  district?: string;
  nationality?: string;
  caste?: Caste;
  status: StudentStatus;
  createdAt?: string;
  updatedAt?: string;
  archivedAt?: string;
  archiveReason?: string;
  parent?: {
    fatherName?: string;
    fatherMobile?: string;
    fatherOccupation?: string;
    annualIncome?: number;
  };
  communication?: {
    permanentAddress?: {
      addressLine?: string;
      pincode?: string;
      phone?: string;
      mobile?: string;
      email?: string;
    };
    communicationAddress?: {
      addressLine?: string;
      pincode?: string;
      phone?: string;
      mobile?: string;
      email?: string;
    };
    sameAsPermanent?: boolean;
  };
  academic?: {
    categoryId?: number;
    category?: string;
    programId?: number;
    program?: string;
    durationYears?: number;
    departmentId?: number;
    department?: string;
    batch?: string;
    dateOfAdmission?: string;
  };
  qualifyingExam?: {
    institutionName?: string;
    institutionPlace?: string;
    examPassed?: string;
    monthYearPassing?: string;
    sslcPercentage?: number;
    sslcRegisterNumber?: string;
    hscPercentage?: number;
    hscRegisterNumber?: string;
  };
  hscMarks?: {
    stream?: string;
    academicMarks?: SubjectMarkDto[];
    vocationalMarks?: SubjectMarkDto[];
    totalMaxMarks?: number;
    totalMarksObtained?: number;
    overallPercentage?: number;
    engineeringCutOff?: number;
  };
  diplomaDetails?: {
    diplomaCourse?: string;
    institutionName?: string;
    board?: string;
    secondYearPercentage?: number;
    thirdYearPercentage?: number;
    aggregatePercentage?: number;
  };
  pgQualification?: {
    universityName?: string;
    universityPlace?: string;
    institutionName?: string;
    institutionPlace?: string;
    examPassed?: string;
    monthYearPassing?: string;
    totalPercentage?: number;
    mainSubjectPercentage?: number;
    degreeRegistrationNumber?: string;
  };
  fee?: {
    cutOffMark?: number;
    meritPercent?: number;
    originalTuitionFeePerYear?: number;
    scholarshipAmount?: number;
    tuitionFeePerYear?: number;
    courseDurationYears?: number;
    totalTuitionFee?: number;
    busRequired?: boolean;
    routeId?: number;
    routeName?: string;
    busStopId?: number;
    busStopName?: string;
    busFee?: number;
    hostelRequired?: boolean;
    hostelFee?: number;
    totalFee?: number;
    paidAmount?: number;
    pendingAmount?: number;
    paymentStatus?: PaymentStatus;
  };
  certificates?: CertificateDto[];
}

export interface StudentSummaryDto {
  id: number;
  applicationNumber?: string;
  registerNumber?: string;
  studentName?: string;
  program?: string;
  department?: string;
  category?: string;
  batch?: string;
  status: StudentStatus;
  createdAt?: string;
  archivedAt?: string;
  archiveReason?: string;
}

export interface ProgramDto {
  id: number;
  name: string;
  durationYears?: number;
}

export interface DepartmentDto {
  id: number;
  name: string;
}

export interface CategoryDto {
  id: number;
  name: string;
}

export interface BusStopDto {
  id: number;
  order?: number;
  name: string;
  fee?: number;
}

export interface BusRouteDto {
  id: number;
  name: string;
  busFee?: number;
  stops: BusStopDto[];
}

export interface CertificateMasterDto {
  id: number;
  name: string;
}

export interface HostelDto {
  id: number;
  fee?: number;
}

export interface FeeStructureDto {
  id: number;
  program?: string;
  department?: string;
  category?: string;
  min?: number;
  max?: number;
  fee?: number;
}

export interface ScholarshipStructureDto {
  id: number;
  program?: string;
  department?: string;
  category?: string;
  min?: number;
  max?: number;
  scholarshipAmount?: number;
}

export interface PageDto<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

export interface StudentStatsDto {
  active: number;
  archived: number;
  draft: number;
}

// ---------------- Bulk Update ----------------

export interface BulkUpdateColumn {
  name: string;
  type: string;
  required: boolean;
  enumValues?: string[] | null;
  fkReference?: string | null;
  isKey: boolean;
}

export interface BulkUpdateTable {
  tableName: string;
  columns: BulkUpdateColumn[];
}

export interface BulkUpdateSchema {
  lookupKey: string;
  updatedBy: string;
  tables: BulkUpdateTable[];
  masterData: Record<string, string[]>;
}

export interface BulkUpdateSheet {
  tableName: string;
  rows: Record<string, string>[];
}

export interface BulkUpdateRequest {
  sheets: BulkUpdateSheet[];
}

export interface BulkChange {
  tableName: string;
  fieldName: string;
  oldValue: string;
  newValue: string;
}

export interface BulkRecordPreview {
  applicationNo: string;
  studentName: string;
  valid: boolean;
  errors: string[];
  changes: BulkChange[];
}

export interface BulkPreviewSummary {
  totalRecords: number;
  validRecords: number;
  invalidRecords: number;
  changedRecords: number;
  unchangedRecords: number;
}

export interface BulkUpdatePreview {
  summary: BulkPreviewSummary;
  records: BulkRecordPreview[];
}

export interface BulkApplySummary {
  totalRecords: number;
  updatedRecords: number;
  skippedRecords: number;
  failedRecords: number;
}

export interface BulkRecordResult {
  applicationNo: string;
  studentName: string;
  status: string;
  errors: string[];
}

export interface BulkUpdateApply {
  summary: BulkApplySummary;
  results: BulkRecordResult[];
}

// ---------------- Bulk Add Admission ----------------

export interface BulkAdmissionRecordPreview {
  applicationNo: string;
  studentName: string;
  program: string;
  totalFee: string;
  valid: boolean;
  errors: string[];
}

export interface BulkAdmissionPreviewSummary {
  totalRecords: number;
  validRecords: number;
  invalidRecords: number;
}

export interface BulkAdmissionPreview {
  summary: BulkAdmissionPreviewSummary;
  records: BulkAdmissionRecordPreview[];
}

export interface BulkAdmissionApplySummary {
  totalRecords: number;
  createdRecords: number;
  failedRecords: number;
}

export interface BulkAdmissionResult {
  applicationNo: string;
  studentName: string;
  status: string;
  errors: string[];
}

export interface BulkAdmissionApply {
  summary: BulkAdmissionApplySummary;
  results: BulkAdmissionResult[];
}

// ---------------- Admin Profile API ----------------

export interface AdminProfileDto {
  id: number;
  adminName: string;
  username: string;
  role: string;
}

export interface UpdateAdminProfileRequest {
  adminName?: string;
  username?: string;
  currentPassword?: string;
  newPassword?: string;
}
