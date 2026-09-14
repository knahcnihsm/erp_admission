import jsPDF from 'jspdf';
import { StudentRecord } from '../types';
import { COLLEGE_INFO } from './constants';

const PAGE_WIDTH = 210;
const PAGE_HEIGHT = 297;
const MARGIN = 14;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;
const GUTTER = 6;
const COL_WIDTH = (CONTENT_WIDTH - GUTTER) / 2;
const BOTTOM_MARGIN = 26;

export const generateStudentPdf = (student: StudentRecord) => {
  const doc = new jsPDF('p', 'mm', 'a4');

  const value = (v: unknown): string => {
    if (v === null || v === undefined) return '—';
    const s = String(v).trim();
    return s.length === 0 ? '—' : s;
  };
  const upper = (v: unknown): string => value(v).toUpperCase();
  const inr = (n: number): string => `Rs. ${n.toLocaleString('en-IN')}`;

  let y = 0;

  const ensureSpace = (needed: number) => {
    if (y + needed > PAGE_HEIGHT - BOTTOM_MARGIN) {
      doc.addPage();
      y = MARGIN + 4;
    }
  };

  const drawField = (x: number, w: number, label: string, text: string): number => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text(label.toUpperCase(), x, y + 3);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(30, 41, 59);
    const lines = doc.splitTextToSize(text, w) as string[];
    doc.text(lines, x, y + 6.5);

    const bottom = y + 6.5 + (lines.length - 1) * 3.8;
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.25);
    doc.line(x, bottom + 2.4, x + w, bottom + 2.4);
    return bottom + 2.4 - y;
  };

  const drawRow = (fields: [string, string][]) => {
    ensureSpace(16);
    let used = 0;
    fields.forEach(([label, text], i) => {
      const x = MARGIN + i * (COL_WIDTH + GUTTER);
      used = Math.max(used, drawField(x, COL_WIDTH, label, text));
    });
    y += used + 5;
  };

  const drawFullRow = (label: string, text: string) => {
    ensureSpace(16);
    y += drawField(MARGIN, CONTENT_WIDTH, label, text) + 5;
  };

  const drawSection = (title: string) => {
    ensureSpace(16);
    y += 5;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(21, 101, 192);
    doc.text(title.toUpperCase(), MARGIN, y);
    y += 2;
    doc.setDrawColor(21, 101, 192);
    doc.setLineWidth(0.5);
    doc.line(MARGIN, y, PAGE_WIDTH - MARGIN, y);
    y += 7;
  };

  // Header Banner
  doc.setFillColor(13, 71, 161);
  doc.rect(0, 0, PAGE_WIDTH, 30, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text(COLLEGE_INFO.name, PAGE_WIDTH / 2, 12, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(`${COLLEGE_INFO.portalTitle} — ${COLLEGE_INFO.systemName}`, PAGE_WIDTH / 2, 19, { align: 'center' });
  doc.text(COLLEGE_INFO.tagline, PAGE_WIDTH / 2, 25, { align: 'center' });

  // Title
  y = 38;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.setTextColor(15, 23, 42);
  doc.text('STUDENT INFORMATION SHEET', MARGIN, y);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(102, 112, 133);
  doc.text(
    `Generated on ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}`,
    PAGE_WIDTH - MARGIN,
    y,
    { align: 'right' }
  );
  y += 8;

  // 1. Student Details
  drawSection('1. Student Details');
  drawRow([
    ['Student Name', upper(student.personal.studentName)],
    ['Application Number', upper(student.personal.applicationNumber)],
  ]);
  drawRow([
    ['Register Number', upper(student.personal.registerNumber)],
    ['Date of Birth', `${student.personal.dateOfBirth} (Age: ${student.personal.age})`],
  ]);
  drawRow([
    ['Gender', upper(student.personal.gender)],
    ['Caste', upper(student.personal.caste)],
  ]);
  drawRow([
    ['Aadhaar Number', upper(student.personal.aadhaarNumber)],
    ['Nationality', upper(student.personal.nationality)],
  ]);
  drawRow([
    ['District', upper(student.personal.district)],
    ['Mobile Number', upper(student.personal.mobileNumber ?? '')],
  ]);
  drawFullRow('Email ID', student.personal.emailId || '—');

  // 2. Contact Information
  drawSection('2. Contact Information');
  drawFullRow('Permanent Address', upper(student.communication.permanentAddress.addressLine));
  drawRow([
    ['Mobile Number', upper(student.communication.permanentAddress.mobileNumber)],
    ['Email', student.communication.permanentAddress.email || '—'],
  ]);
  drawRow([
    ['PIN Code', upper(student.communication.permanentAddress.pinCode)],
    ['Phone', upper(student.communication.permanentAddress.phoneNumber ?? '')],
  ]);
  drawFullRow(
    'Communication Address',
    student.communication.sameAsPermanent
      ? 'Same as Permanent Address'
      : upper(student.communication.communicationAddress.addressLine)
  );

  // 3. Educational Background
  drawSection('3. Educational Background');
  drawRow([
    ['Admission Category', upper(student.academic.admissionCategory)],
    ['Program', upper(student.academic.program)],
  ]);
  drawRow([
    ['Department', upper(student.academic.department)],
    ['Batch', upper(student.academic.batch)],
  ]);
  drawRow([
    ['Date of Admission', value(student.academic.dateOfAdmission)],
    ['Previous School', upper(student.qualifyingExam?.institutionName ?? '')],
  ]);
  drawRow([
    ['Examination Passed', upper(student.qualifyingExam?.examinationPassed ?? '')],
    ['Month / Year of Passing', value(student.qualifyingExam?.monthYearPassing ?? '')],
  ]);
  drawRow([
    ['SSLC Percentage', student.qualifyingExam?.sslcPercentage !== undefined ? `${student.qualifyingExam.sslcPercentage}%` : '—'],
    ['HSC Percentage', student.qualifyingExam?.hscPercentage !== undefined ? `${student.qualifyingExam.hscPercentage}%` : '—'],
  ]);

  // 4. Parent / Guardian Information
  drawSection('4. Parent / Guardian Information');
  drawRow([
    ['Father Name', upper(student.parent.fatherName)],
    ['Father Mobile', upper(student.parent.fatherMobile)],
  ]);
  drawRow([
    ['Father Occupation', upper(student.parent.fatherOccupation)],
    ['Parent Mobile', upper(student.parent.parentMobile ?? '')],
  ]);
  drawFullRow('Annual Income', inr(student.parent.annualIncome));

  // Signature Block
  if (y > PAGE_HEIGHT - 55) {
    doc.addPage();
    y = MARGIN;
  }
  const sigY = PAGE_HEIGHT - 40;
  const sigLabels = ['STUDENT SIGNATURE', 'PARENT / GUARDIAN SIGNATURE', 'PRINCIPAL / ERP OFFICER SIGNATURE'];
  const third = CONTENT_WIDTH / 3;
  sigLabels.forEach((label, i) => {
    const left = MARGIN + third * i;
    doc.setDrawColor(100, 116, 139);
    doc.setLineWidth(0.3);
    doc.line(left + 5, sigY, left + third - 5, sigY);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(label, left + third / 2, sigY + 5, { align: 'center' });
  });

  doc.save(`${student.personal.registerNumber}_Student_Information_Sheet.pdf`);
};
