import * as XLSX from 'xlsx';
import { StudentRecord } from '../types';

export const exportStudentsToExcel = (students: StudentRecord[], filename: string = 'Students_List.xlsx') => {
  const exportData = students.map((s) => ({
    'Application No': (s.personal.applicationNumber || '').toUpperCase(),
    'Register No': (s.personal.registerNumber || '').toUpperCase(),
    'Student Name': s.personal.studentName,
    'DOB': s.personal.dateOfBirth,
    'Gender': s.personal.gender,
    'Aadhaar No': s.personal.aadhaarNumber,
    'District': s.personal.district,
    'Category': s.personal.caste,
    'Admission Category': s.academic.admissionCategory,
    'Program': s.academic.program,
    'Department': s.academic.department,
    'Batch': s.academic.batch,
    'Father Name': s.parent.fatherName,
    'Father Mobile': s.parent.fatherMobile,
    'Mobile Number': s.communication.permanentAddress.mobileNumber,
    'Email': (s.communication.permanentAddress.email || s.personal.emailId || '').trim(),
    'Cut-Off Mark': s.fee.cutOffMark ?? 'N/A',
    'Merit Score (%)': s.fee.meritPercent ?? 'N/A',
    'Original Tuition Fee (₹/Yr)': s.fee.originalTuitionFee ?? 'N/A',
    'Scholarship Amount (₹/Yr)': s.fee.scholarshipAmount ?? 'N/A',
    'Final Tuition Fee (₹/Yr)': s.fee.tuitionFeePerYear,
    'Total Tuition Fee (₹)': s.fee.totalTuitionFee,
    'Grand Total Fee (₹)': s.fee.grandTotalFee,
    'Status': s.status,
    'Archive Reason': s.archiveReason || 'N/A',
  }));

  const worksheet = XLSX.utils.json_to_sheet(exportData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Students');
  XLSX.writeFile(workbook, filename);
};
