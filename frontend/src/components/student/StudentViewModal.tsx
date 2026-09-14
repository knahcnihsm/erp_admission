import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  Grid,
  Button,
  IconButton,
  Chip,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Avatar,
  Divider,
  Paper,
  Tooltip,
} from '@mui/material';
import {
  X,
  Printer,
  Download,
  Eye,
  CheckCircle,
  XCircle,
  User,
  Users,
  MapPin,
  GraduationCap,
  BookOpen,
  CreditCard,
  Bus,
  Home,
  FileCheck,
  Calendar,
  Phone,
  Mail,
  Shield,
  Award,
  Hash,
} from 'lucide-react';
import { useAdmission } from '../../context/AdmissionContext';
import { useThemeContext } from '../../context/ThemeContext';
import { formatDateDisplay } from '../../utils/dateUtils';
import { generateStudentPdf } from '../../utils/exportPdf';
import { CertificateItem, StudentRecord } from '../../types';
import { resolveFileUrl, downloadFile } from '../../api/client';

// Helper component for styled read-only field boxes
const DetailField: React.FC<{
  label: string;
  value: React.ReactNode;
  icon?: React.ReactNode;
  fullWidth?: boolean;
}> = ({ label, value, icon, fullWidth = false }) => {
  const { mode } = useThemeContext();
  const isDark = mode === 'dark';

  return (
    <Box
      sx={{
        width: '100%',
        backgroundColor: isDark ? '#0F172A' : '#F8FAFC',
        border: `1px solid ${isDark ? '#334155' : '#E2E8F0'}`,
        borderRadius: '12px',
        padding: '12px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
        transition: 'all 150ms ease-in-out',
        '&:hover': {
          borderColor: isDark ? '#475569' : '#CBD5E1',
          backgroundColor: isDark ? '#1E293B' : '#F1F5F9',
        },
      }}
    >
      <Typography
        variant="caption"
        sx={{
          fontWeight: 600,
          fontSize: '11.5px',
          color: isDark ? '#94A3B8' : '#64748B',
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
        }}
      >
        {icon}
        {label}
      </Typography>
      <Typography
        variant="body1"
        sx={{
          fontWeight: 600,
          fontSize: '14.5px',
          color: isDark ? '#F8FAFC' : '#1E293B',
          wordBreak: 'break-word',
          textTransform: 'uppercase',
        }}
      >
        {value}
      </Typography>
    </Box>
  );
};

const isEmptyValue = (value: React.ReactNode): boolean =>
  value === undefined || value === null || value === '';

// Field box + grid cell that hides entirely when the database has no value.
const FieldCell: React.FC<{
  label: string;
  value: React.ReactNode;
  icon?: React.ReactNode;
  xs?: number;
  sm?: number;
  md?: number;
}> = ({ label, value, icon, xs = 12, sm, md }) => {
  if (isEmptyValue(value)) return null;
  return (
    <Grid item xs={xs} sm={sm} md={md}>
      <DetailField label={label} value={value} icon={icon} />
    </Grid>
  );
};

// Section Header Component
const SectionHeader: React.FC<{ title: string; icon: React.ReactNode }> = ({ title, icon }) => {
  const { mode } = useThemeContext();
  const isDark = mode === 'dark';

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        marginBottom: '16px',
        paddingBottom: '8px',
        borderBottom: `2px solid ${isDark ? '#334155' : '#E2EBF6'}`,
      }}
    >
      <Box
        sx={{
          width: '36px',
          height: '36px',
          borderRadius: '10px',
          backgroundColor: isDark ? 'rgba(56, 189, 248, 0.15)' : '#E0F2FE',
          color: isDark ? '#38BDF8' : '#0B3D91',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {icon}
      </Box>
      <Typography
        variant="h6"
        sx={{
          fontWeight: 700,
          fontSize: '16px',
          letterSpacing: '0.05em',
          color: isDark ? '#FFFFFF' : '#0B3D91',
          textTransform: 'uppercase',
        }}
      >
        {title}
      </Typography>
    </Box>
  );
};

export const StudentViewModal: React.FC = () => {
  const { mode } = useThemeContext();
  const isDark = mode === 'dark';
  const { viewModalStudent, closeViewModal, showSnackbar } = useAdmission();

  const [previewCert, setPreviewCert] = useState<CertificateItem | null>(null);

  if (!viewModalStudent) return null;

  const s = viewModalStudent;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadCert = (cert: CertificateItem) => {
    if (typeof cert.file === 'string') {
      downloadFile(cert.file, cert.fileName).catch(() =>
        showSnackbar(`Could not download ${cert.name}.`, 'error')
      );
    }
  };

  // Helper values & defaults for comprehensive display
  const studentName = s.personal.studentName || 'STUDENT';
  const regNo = s.personal.registerNumber || 'N/A';
  const appNo = s.personal.applicationNumber || 'N/A';
  const dept = s.academic.department || 'N/A';
  const admissionType = s.academic.admissionCategory || 'N/A';
  const isArchived = s.status === 'Archived';

  // Program condition checks
  const program = s.academic.program || '';
  const isLateralEntry = program.includes('Lateral Entry') || program.includes('Second Year');
  const isPG = program.startsWith('PG') || program.includes('Post Graduate') || program === 'PG';
  const isFirstYear = !isLateralEntry && !isPG;

  // Cut-Off Percentage Calculation: (Maths + Physics + (CS/Bio/Bio-tech/Che)) / 3
  const getCutOffPercentage = (): string | undefined => {
    if (s.hscMarks?.academicMarks && s.hscMarks.academicMarks.length >= 3) {
      const marks = s.hscMarks.academicMarks;
      const getSubjectMarkPct = (keywords: string[]) => {
        const found = marks.find((m) => keywords.some((k) => m.subject.toLowerCase().includes(k)));
        return found && found.maxMarks ? (found.marksObtained / found.maxMarks) * 100 : 0;
      };
      const mathsPct = getSubjectMarkPct(['math']);
      const physicsPct = getSubjectMarkPct(['physic']);
      const thirdPct = getSubjectMarkPct(['chem', 'bio', 'computer']);
      if (mathsPct > 0 || physicsPct > 0 || thirdPct > 0) {
        const avg = (mathsPct + physicsPct + thirdPct) / 3;
        return `${avg.toFixed(2)}%`;
      }
    }
    const dbCutoff = s.hscMarks?.engineeringCutOff || s.fee.cutOffMark;
    if (dbCutoff) {
      const numVal = Number(dbCutoff);
      const pct = (numVal / 300) * 100;
      return `${pct.toFixed(2)}%`;
    }
    return undefined;
  };

  // Fee values for Bus & Hostel cards
  const busFee = s.fee.busFee || 0;
  const hostelFee = s.fee.hostelFee || 0;

  // DB-derived cut-off values
  const engineeringCutOff = s.hscMarks?.engineeringCutOff || s.fee.cutOffMark;
  const cutOffPct = getCutOffPercentage();

  return (
    <>
      <Dialog
        open={Boolean(viewModalStudent)}
        onClose={closeViewModal}
        maxWidth={false}
        fullScreen
        sx={{ '& .MuiDialog-paper': { margin: 0 } }}
        scroll="paper"
        PaperProps={{
          sx: {
            width: { xs: '100%', md: '90vw' },
            maxWidth: { xs: '100%', md: '1400px' },
            height: { xs: '100%', md: '90vh' },
            maxHeight: { xs: '100%', md: '90vh' },
            borderRadius: { xs: 0, md: '18px' },
            backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
            color: isDark ? '#FFFFFF' : '#1E293B',
            boxShadow: isDark
              ? '0 25px 50px -12px rgba(0, 0, 0, 0.7)'
              : '0 25px 50px -12px rgba(11, 61, 145, 0.15)',
            border: `1px solid ${isDark ? '#334155' : '#D6E4F0'}`,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          },
        }}
      >
        {/* ==================== MODAL HEADER ==================== */}
        <DialogTitle
          sx={{
            padding: '20px 28px',
            backgroundColor: isDark ? '#0F172A' : '#0B3D91',
            color: '#FFFFFF',
            borderBottom: `1px solid ${isDark ? '#334155' : '#1E5EFF'}`,
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
            {/* Title & Badge */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <Avatar
                sx={{
                  width: 48,
                  height: 48,
                  backgroundColor: '#38BDF8',
                  color: '#0B3D91',
                  fontWeight: 800,
                  fontSize: '20px',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
                }}
              >
                {studentName.charAt(0)}
              </Avatar>
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Typography variant="h5" sx={{ fontWeight: 800, fontSize: '20px', color: '#FFFFFF', letterSpacing: '0.02em' }}>
                    {studentName}
                  </Typography>
                  <Chip
                    label={isArchived ? 'ARCHIVED' : 'ACTIVE'}
                    color={isArchived ? 'error' : 'success'}
                    size="small"
                    sx={{ fontWeight: 700, fontSize: '11px', height: '22px' }}
                  />
                </Box>
                <Typography variant="body2" sx={{ color: '#93C5FD', fontSize: '13px', fontWeight: 500, mt: '2px' }}>
                  Student Profile | Admission Portal
                </Typography>
              </Box>
            </Box>

            {/* Top Quick Meta Badges */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <Box sx={{ backgroundColor: 'rgba(255, 255, 255, 0.1)', padding: '6px 12px', borderRadius: '8px', textAlign: 'center' }}>
                <Typography variant="caption" sx={{ color: '#93C5FD', display: 'block', fontSize: '10px', textTransform: 'uppercase' }}>
                  Reg Number
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 700, color: '#FFFFFF', fontSize: '13px' }}>
                  {regNo}
                </Typography>
              </Box>

              <Box sx={{ backgroundColor: 'rgba(255, 255, 255, 0.1)', padding: '6px 12px', borderRadius: '8px', textAlign: 'center' }}>
                <Typography variant="caption" sx={{ color: '#93C5FD', display: 'block', fontSize: '10px', textTransform: 'uppercase' }}>
                  App Number
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 700, color: '#FFFFFF', fontSize: '13px' }}>
                  {appNo}
                </Typography>
              </Box>

              <Box sx={{ backgroundColor: 'rgba(255, 255, 255, 0.1)', padding: '6px 12px', borderRadius: '8px', textAlign: 'center' }}>
                <Typography variant="caption" sx={{ color: '#93C5FD', display: 'block', fontSize: '10px', textTransform: 'uppercase' }}>
                  Department
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 700, color: '#FFFFFF', fontSize: '13px' }}>
                  {dept}
                </Typography>
              </Box>

              <Box sx={{ backgroundColor: 'rgba(255, 255, 255, 0.1)', padding: '6px 12px', borderRadius: '8px', textAlign: 'center' }}>
                <Typography variant="caption" sx={{ color: '#93C5FD', display: 'block', fontSize: '10px', textTransform: 'uppercase' }}>
                  Admission Type
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 700, color: '#FFFFFF', fontSize: '13px' }}>
                  {admissionType}
                </Typography>
              </Box>

              <IconButton
                onClick={closeViewModal}
                sx={{
                  color: '#FFFFFF',
                  backgroundColor: 'rgba(255, 255, 255, 0.15)',
                  '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.3)' },
                  marginLeft: '8px',
                }}
              >
                <X size={20} />
              </IconButton>
            </Box>
          </Box>
        </DialogTitle>

        {/* ==================== MODAL BODY CONTENT ==================== */}
        <DialogContent
          id="printable-student-profile"
          sx={{
            padding: '28px 32px',
            backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
            color: isDark ? '#FFFFFF' : '#1E293B',
            overflowY: 'auto',
          }}
        >
          <Grid container spacing={3.5}>
            {/* ==================== SECTION 1: PERSONAL DETAILS ==================== */}
            <Grid item xs={12}>
              <Paper
                elevation={0}
                sx={{
                  padding: '24px',
                  borderRadius: '16px',
                  backgroundColor: isDark ? '#182232' : '#FFFFFF',
                  border: `1px solid ${isDark ? '#334155' : '#E2EBF6'}`,
                  boxShadow: isDark ? 'none' : '0 4px 20px rgba(11, 61, 145, 0.04)',
                }}
              >
                <SectionHeader title="SECTION 1: PERSONAL DETAILS" icon={<User size={20} />} />

                <Grid container spacing={2.5}>
                  {/* Photo & Main Identity Column */}
                  <Grid item xs={12} md={3} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                    <Box
                      sx={{
                        width: 140,
                        height: 160,
                        borderRadius: '16px',
                        border: `2px dashed ${isDark ? '#38BDF8' : '#0B3D91'}`,
                        backgroundColor: isDark ? '#0F172A' : '#F0F9FF',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '12px',
                        textAlign: 'center',
                        gap: '8px',
                      }}
                    >
                      <Avatar
                        sx={{
                          width: 80,
                          height: 80,
                          backgroundColor: isDark ? '#38BDF8' : '#0B3D91',
                          color: '#FFFFFF',
                          fontWeight: 700,
                          fontSize: '28px',
                        }}
                      >
                        {studentName.slice(0, 2).toUpperCase()}
                      </Avatar>
                      <Typography variant="caption" sx={{ fontWeight: 600, color: isDark ? '#94A3B8' : '#64748B', fontSize: '11px' }}>
                        Student Photo
                      </Typography>
                    </Box>
                  </Grid>

                  {/* Personal Fields Grid */}
                  <Grid item xs={12} md={9}>
                    <Grid container spacing={2}>
                      <FieldCell sm={6} md={4} label="Application Number" value={s.personal.applicationNumber} icon={<Hash size={14} />} />
                      <FieldCell sm={6} md={4} label="Register Number" value={s.personal.registerNumber} icon={<Hash size={14} />} />
                      <FieldCell sm={6} md={4} label="Student Full Name" value={s.personal.studentName} icon={<User size={14} />} />

                      <FieldCell sm={6} md={4} label="Date of Birth" value={formatDateDisplay(s.personal.dateOfBirth)} icon={<Calendar size={14} />} />
                      <FieldCell sm={6} md={4} label="Age" value={s.personal.age ? `${s.personal.age} Years` : undefined} icon={<User size={14} />} />
                      <FieldCell sm={6} md={4} label="Gender" value={s.personal.gender} icon={<User size={14} />} />

                      <FieldCell sm={6} md={4} label="Aadhaar Number" value={s.personal.aadhaarNumber} icon={<Shield size={14} />} />
                      <FieldCell sm={6} md={4} label="Nationality" value={s.personal.nationality} icon={<MapPin size={14} />} />
                      <FieldCell sm={6} md={4} label="Caste" value={s.personal.caste} icon={<Users size={14} />} />

                      <FieldCell sm={6} md={4} label="Mobile Number" value={s.communication?.permanentAddress?.mobileNumber} icon={<Phone size={14} />} />
                      <FieldCell sm={6} md={4} label="Email ID" value={s.personal.emailId || s.communication?.permanentAddress?.email || undefined} icon={<Mail size={14} />} />
                    </Grid>
                  </Grid>
                </Grid>
              </Paper>
            </Grid>

            {/* ==================== SECTION 2: PARENT DETAILS ==================== */}
            <Grid item xs={12} md={6}>
              <Paper
                elevation={0}
                sx={{
                  padding: '24px',
                  borderRadius: '16px',
                  backgroundColor: isDark ? '#182232' : '#FFFFFF',
                  border: `1px solid ${isDark ? '#334155' : '#E2EBF6'}`,
                  height: '100%',
                }}
              >
                <SectionHeader title="SECTION 2: PARENT DETAILS" icon={<Users size={20} />} />

                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: isDark ? '#38BDF8' : '#0B3D91', mb: 1, fontSize: '13px' }}>
                      👨 Father Details
                    </Typography>
                  </Grid>
                  <FieldCell sm={6} label="Father Name" value={s.parent.fatherName} icon={<User size={14} />} />
                  <FieldCell sm={6} label="Parent Mobile Number" value={s.parent.fatherMobile || s.parent.parentMobile} icon={<Phone size={14} />} />
                  <FieldCell sm={6} label="Occupation" value={s.parent.fatherOccupation} icon={<BookOpen size={14} />} />
                  <FieldCell sm={6} label="Annual Income" value={s.parent.annualIncome ? `₹ ${s.parent.annualIncome.toLocaleString('en-IN')}` : undefined} icon={<CreditCard size={14} />} />
                </Grid>
              </Paper>
            </Grid>

            {/* ==================== SECTION 3: COMMUNICATION DETAILS ==================== */}
            <Grid item xs={12} md={6}>
              <Paper
                elevation={0}
                sx={{
                  padding: '24px',
                  borderRadius: '16px',
                  backgroundColor: isDark ? '#182232' : '#FFFFFF',
                  border: `1px solid ${isDark ? '#334155' : '#E2EBF6'}`,
                  height: '100%',
                }}
              >
                <SectionHeader title="SECTION 3: COMMUNICATION DETAILS" icon={<MapPin size={20} />} />

                <Grid container spacing={2}>
                  <FieldCell label="Permanent Address" value={s.communication.permanentAddress.addressLine} icon={<MapPin size={14} />} />
                  <FieldCell
                    label="Communication Address"
                    value={s.communication.sameAsPermanent ? s.communication.permanentAddress.addressLine + ' (Same as Permanent)' : s.communication.communicationAddress.addressLine}
                    icon={<MapPin size={14} />}
                  />
                  <FieldCell sm={6} label="District" value={s.personal.district} icon={<MapPin size={14} />} />
                  <FieldCell sm={6} label="Pincode" value={s.communication.permanentAddress.pinCode} icon={<Hash size={14} />} />
                  <FieldCell sm={6} label="Mobile Number" value={s.communication.permanentAddress.mobileNumber} icon={<Phone size={14} />} />
                  <FieldCell sm={6} label="Email ID" value={s.communication.permanentAddress.email || undefined} icon={<Mail size={14} />} />
                </Grid>
              </Paper>
            </Grid>

            {/* ==================== SECTION 4: ADMISSION DETAILS ==================== */}
            <Grid item xs={12}>
              <Paper
                elevation={0}
                sx={{
                  padding: '24px',
                  borderRadius: '16px',
                  backgroundColor: isDark ? '#182232' : '#FFFFFF',
                  border: `1px solid ${isDark ? '#334155' : '#E2EBF6'}`,
                }}
              >
                <SectionHeader title="SECTION 4: ADMISSION DETAILS" icon={<GraduationCap size={20} />} />

                <Grid container spacing={2}>
                  <FieldCell sm={6} md={4} label="Admission Number" value={s.personal.applicationNumber} icon={<Hash size={14} />} />
                  <FieldCell sm={6} md={4} label="Admission Type" value={s.academic.admissionCategory} icon={<Award size={14} />} />
                  <FieldCell sm={6} md={4} label="Academic Year" value={s.academic.batch} icon={<Calendar size={14} />} />

                  <FieldCell sm={6} md={4} label="Department" value={s.academic.department} icon={<BookOpen size={14} />} />
                  <FieldCell sm={6} md={4} label="Programme" value={s.academic.program} icon={<GraduationCap size={14} />} />
                  <FieldCell sm={6} md={4} label="Semester" value={s.academic.semester} icon={<Calendar size={14} />} />

                  <FieldCell sm={6} md={4} label="Joining Date" value={formatDateDisplay(s.academic.dateOfAdmission)} icon={<Calendar size={14} />} />
                </Grid>
              </Paper>
            </Grid>

            {/* ==================== SECTION 5: ACADEMIC DETAILS ==================== */}
            <Grid item xs={12}>
              <Paper
                elevation={0}
                sx={{
                  padding: '24px',
                  borderRadius: '16px',
                  backgroundColor: isDark ? '#182232' : '#FFFFFF',
                  border: `1px solid ${isDark ? '#334155' : '#E2EBF6'}`,
                }}
              >
                <SectionHeader title="SECTION 5: ACADEMIC DETAILS" icon={<BookOpen size={20} />} />

                <Grid container spacing={3}>
                  {/* 10th SSLC Details (Displayed ONLY for First Year & Lateral Entry) */}
                  {(isFirstYear || isLateralEntry) && (
                    <Grid item xs={12} md={6}>
                      <Box sx={{ p: 2, borderRadius: '12px', border: `1px solid ${isDark ? '#334155' : '#E2E8F0'}`, backgroundColor: isDark ? '#0F172A' : '#FAF9FF' }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: isDark ? '#38BDF8' : '#0B3D91', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Award size={16} /> 10th (SSLC) Details
                        </Typography>
                        <Grid container spacing={1.5}>
                          <FieldCell xs={6} label="Board" value={s.qualifyingExam?.sslcBoard || s.qualifyingExam?.examinationPassed} />
                          <FieldCell xs={6} label="School Name" value={s.qualifyingExam?.sslcSchoolName || s.qualifyingExam?.institutionName} />
                          <FieldCell xs={6} label="Register Number" value={s.qualifyingExam?.sslcRegisterNumber} />
                          <FieldCell xs={6} label="Year of Passing" value={s.qualifyingExam?.monthYearPassing} />
                          <FieldCell label="SSLC Percentage" value={s.qualifyingExam?.sslcPercentage ? `${s.qualifyingExam.sslcPercentage}%` : undefined} />
                        </Grid>
                      </Box>
                    </Grid>
                  )}

                  {/* 12th HSC Details (Displayed ONLY for First Year B.Tech) */}
                  {isFirstYear && (
                    <Grid item xs={12} md={6}>
                      <Box sx={{ p: 2, borderRadius: '12px', border: `1px solid ${isDark ? '#334155' : '#E2E8F0'}`, backgroundColor: isDark ? '#0F172A' : '#FAF9FF' }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: isDark ? '#38BDF8' : '#0B3D91', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Award size={16} /> 12th (HSC) Details
                        </Typography>
                        <Grid container spacing={1.5}>
                          <FieldCell xs={6} label="Board" value={s.qualifyingExam?.hscBoard || s.qualifyingExam?.examinationPassed} />
                          <FieldCell xs={6} label="School Name" value={s.qualifyingExam?.hscSchoolName || s.qualifyingExam?.institutionName} />
                          <FieldCell xs={6} label="Register Number" value={s.qualifyingExam?.hscRegisterNumber} />
                          <FieldCell xs={6} label="Year of Passing" value={s.qualifyingExam?.monthYearPassing} />
                          <FieldCell label="HSC Percentage" value={s.hscMarks?.overallPercentage || s.qualifyingExam?.hscPercentage ? `${s.hscMarks?.overallPercentage || s.qualifyingExam?.hscPercentage}%` : undefined} />
                        </Grid>
                      </Box>
                    </Grid>
                  )}

                  {/* Vocational Details (Displayed ONLY for First Year B.Tech if Vocational Stream) */}
                  {isFirstYear && s.hscMarks?.stream === 'Vocational' && (
                    <Grid item xs={12}>
                      <Box sx={{ p: 2, borderRadius: '12px', border: `1px solid ${isDark ? '#334155' : '#E2E8F0'}`, backgroundColor: isDark ? '#0F172A' : '#FAF9FF' }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: isDark ? '#38BDF8' : '#0B3D91', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Award size={16} /> Vocational Details
                        </Typography>
                        <Grid container spacing={1.5}>
                          <FieldCell sm={6} label="Stream" value="Vocational Stream" />
                        </Grid>
                      </Box>
                    </Grid>
                  )}

                  {/* Diploma Details (Displayed ONLY for Second Year B.Tech Lateral Entry) */}
                  {isLateralEntry && (
                    <Grid item xs={12}>
                      <Box sx={{ p: 2, borderRadius: '12px', border: `1px solid ${isDark ? '#334155' : '#E2E8F0'}`, backgroundColor: isDark ? '#0F172A' : '#FAF9FF' }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: isDark ? '#38BDF8' : '#0B3D91', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Award size={16} /> Diploma Details (Lateral Entry)
                        </Typography>
                        <Grid container spacing={1.5}>
                          <FieldCell sm={6} md={4} label="Diploma Course" value={s.diplomaDetails?.diplomaCourse} />
                          <FieldCell sm={6} md={4} label="Institution Name" value={s.diplomaDetails?.institutionName} />
                          <FieldCell sm={6} md={4} label="Board" value={s.diplomaDetails?.board} />
                          <FieldCell xs={6} sm={6} label="2nd Year %" value={s.diplomaDetails?.secondYearPercentage ? `${s.diplomaDetails.secondYearPercentage}%` : undefined} />
                          <FieldCell xs={6} sm={6} label="Aggregate %" value={s.diplomaDetails?.aggregatePercentage ? `${s.diplomaDetails.aggregatePercentage}%` : undefined} />
                        </Grid>
                      </Box>
                    </Grid>
                  )}

                  {/* PG Qualification Details (Displayed ONLY for PG Program) */}
                  {isPG && (
                    <Grid item xs={12}>
                      <Box sx={{ p: 2, borderRadius: '12px', border: `1px solid ${isDark ? '#334155' : '#E2E8F0'}`, backgroundColor: isDark ? '#0F172A' : '#FAF9FF' }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: isDark ? '#38BDF8' : '#0B3D91', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Award size={16} /> Undergraduate (UG) / Qualifying Degree Details
                        </Typography>
                        <Grid container spacing={1.5}>
                          <FieldCell sm={6} md={4} label="Degree Passed" value={s.pgQualification?.examinationPassed || s.qualifyingExam?.examinationPassed} />
                          <FieldCell sm={6} md={4} label="University Name" value={s.pgQualification?.universityName} />
                          <FieldCell sm={6} md={4} label="University Place" value={s.pgQualification?.universityPlace} />
                          <FieldCell sm={6} md={4} label="Institution Name" value={s.pgQualification?.institutionName} />
                          <FieldCell sm={6} md={4} label="Institution Place" value={s.pgQualification?.institutionPlace} />
                          <FieldCell sm={6} md={4} label="Degree Register Number" value={s.pgQualification?.degreeRegistrationNumber} />
                          <FieldCell sm={6} md={4} label="Month & Year of Passing" value={s.pgQualification?.monthYearPassing} />
                          <FieldCell sm={6} md={4} label="Total Percentage" value={s.pgQualification?.totalPercentage ? `${s.pgQualification.totalPercentage}%` : undefined} />
                          <FieldCell sm={6} md={4} label="Main Subject Percentage" value={s.pgQualification?.mainSubjectPercentage ? `${s.pgQualification.mainSubjectPercentage}%` : undefined} />
                        </Grid>
                      </Box>
                    </Grid>
                  )}

                  {/* Cut-Off Mark & Cut-Off Percentage Summary (Displayed ONLY for First Year B.Tech) */}
                  {isFirstYear && (engineeringCutOff || cutOffPct) && (
                    <Grid item xs={12}>
                      <Box sx={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                        {engineeringCutOff && (
                          <DetailField label="Engineering Cut-Off Mark" value={`${engineeringCutOff} / 300`} icon={<Award size={14} />} />
                        )}
                        {cutOffPct && (
                          <DetailField label="Cut-Off Percentage" value={cutOffPct} icon={<Award size={14} />} />
                        )}
                      </Box>
                    </Grid>
                  )}
                </Grid>
              </Paper>
            </Grid>

            {/* ==================== SECTION 6 & 7: BUS & HOSTEL DETAILS ==================== */}
            <Grid item xs={12} md={6}>
              <Paper
                elevation={0}
                sx={{
                  padding: '24px',
                  borderRadius: '16px',
                  backgroundColor: isDark ? '#182232' : '#FFFFFF',
                  border: `1px solid ${isDark ? '#334155' : '#E2EBF6'}`,
                  height: '100%',
                }}
              >
                <SectionHeader title="SECTION 6: BUS DETAILS" icon={<Bus size={20} />} />

                <Grid container spacing={2}>
                  <FieldCell
                    sm={6}
                    label="Bus Required"
                    value={
                      <Chip
                        label={s.fee.busRouteSelected || s.fee.busTransportRequired ? 'YES' : 'NO'}
                        color={s.fee.busRouteSelected || s.fee.busTransportRequired ? 'primary' : 'default'}
                        size="small"
                        sx={{ fontWeight: 700 }}
                      />
                    }
                    icon={<Bus size={14} />}
                  />
                  <FieldCell sm={6} label="Bus Fee" value={busFee ? `₹ ${busFee.toLocaleString('en-IN')}` : undefined} icon={<CreditCard size={14} />} />
                  <FieldCell label="Route" value={s.fee.busRouteSelected} icon={<MapPin size={14} />} />
                  <FieldCell label="Bus Stop" value={s.fee.busStopSelected} icon={<MapPin size={14} />} />
                </Grid>
              </Paper>
            </Grid>

            <Grid item xs={12} md={6}>
              <Paper
                elevation={0}
                sx={{
                  padding: '24px',
                  borderRadius: '16px',
                  backgroundColor: isDark ? '#182232' : '#FFFFFF',
                  border: `1px solid ${isDark ? '#334155' : '#E2EBF6'}`,
                  height: '100%',
                }}
              >
                <SectionHeader title="SECTION 7: HOSTEL DETAILS" icon={<Home size={20} />} />

                <Grid container spacing={2}>
                  <FieldCell
                    sm={6}
                    label="Hostel Required"
                    value={
                      <Chip
                        label={s.fee.hostelRequired ? 'YES' : 'NO'}
                        color={s.fee.hostelRequired ? 'primary' : 'default'}
                        size="small"
                        sx={{ fontWeight: 700 }}
                      />
                    }
                    icon={<Home size={14} />}
                  />
                  <FieldCell sm={6} label="Hostel Fee" value={hostelFee ? `₹ ${hostelFee.toLocaleString('en-IN')}` : undefined} icon={<CreditCard size={14} />} />
                </Grid>
              </Paper>
            </Grid>

            {/* ==================== SECTION 8: FEE DETAILS ==================== */}
            <Grid item xs={12}>
              <Paper
                elevation={0}
                sx={{
                  padding: '24px',
                  borderRadius: '16px',
                  backgroundColor: isDark ? '#182232' : '#FFFFFF',
                  border: `1px solid ${isDark ? '#334155' : '#E2EBF6'}`,
                }}
              >
                <SectionHeader title="SECTION 8: FEE DETAILS" icon={<CreditCard size={20} />} />

                <Grid container spacing={2}>
                  <FieldCell sm={6} md={4} label="Merit Score" value={s.fee.meritPercent !== undefined && s.fee.meritPercent !== null ? `${s.fee.meritPercent}%` : undefined} icon={<Award size={14} />} />
                  <FieldCell sm={6} md={4} label="Original Tuition Fee (Per Year)" value={s.fee.originalTuitionFee ? `₹ ${s.fee.originalTuitionFee.toLocaleString('en-IN')}` : undefined} icon={<CreditCard size={14} />} />
                  <FieldCell sm={6} md={4} label="Scholarship Amount (Per Year)" value={s.fee.scholarshipAmount ? `₹ ${s.fee.scholarshipAmount.toLocaleString('en-IN')}` : undefined} icon={<CreditCard size={14} />} />
                  <FieldCell sm={6} md={4} label="Final Tuition Fee (Per Year)" value={s.fee.tuitionFeePerYear ? `₹ ${s.fee.tuitionFeePerYear.toLocaleString('en-IN')}` : undefined} icon={<CreditCard size={14} />} />
                  <FieldCell sm={6} md={4} label="Course Duration" value={s.fee.courseDurationYears ? `${s.fee.courseDurationYears} Years` : undefined} icon={<Calendar size={14} />} />
                  <FieldCell sm={6} md={4} label="Total Tuition Fee" value={s.fee.totalTuitionFee ? `₹ ${s.fee.totalTuitionFee.toLocaleString('en-IN')}` : undefined} icon={<CreditCard size={14} />} />
                  <FieldCell sm={6} md={4} label="Bus Fee" value={busFee ? `₹ ${busFee.toLocaleString('en-IN')}` : undefined} icon={<Bus size={14} />} />
                  <FieldCell sm={6} md={4} label="Hostel Fee" value={hostelFee ? `₹ ${hostelFee.toLocaleString('en-IN')}` : undefined} icon={<Home size={14} />} />
                  <FieldCell sm={6} md={4} label="GRAND TOTAL FEE" value={s.fee.grandTotalFee ? `₹ ${s.fee.grandTotalFee.toLocaleString('en-IN')}` : undefined} icon={<CreditCard size={14} />} />
                </Grid>
              </Paper>
            </Grid>

            {/* ==================== SECTION 9: UPLOADED CERTIFICATES ==================== */}
            <Grid item xs={12}>
              <Paper
                elevation={0}
                sx={{
                  padding: '24px',
                  borderRadius: '16px',
                  backgroundColor: isDark ? '#182232' : '#FFFFFF',
                  border: `1px solid ${isDark ? '#334155' : '#E2EBF6'}`,
                }}
              >
                <SectionHeader title="UPLOADED CERTIFICATES" icon={<FileCheck size={20} />} />

                <Grid container spacing={2}>
                  {s.certificates && s.certificates.length > 0 ? (
                    s.certificates.map((cert) => {
                      const isUploaded = Boolean(cert.received || cert.file);
                      return (
                        <Grid item xs={12} sm={6} md={4} key={cert.id}>
                          <Paper
                            variant="outlined"
                            sx={{
                              padding: '14px 16px',
                              borderRadius: '12px',
                              backgroundColor: isDark ? '#0F172A' : '#F8FAFC',
                              borderColor: isDark ? '#334155' : '#E2E8F0',
                              display: 'flex',
                              flexDirection: 'column',
                              justifyContent: 'space-between',
                              height: '100%',
                              gap: '12px',
                            }}
                          >
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <FileCheck size={20} color={isUploaded ? '#16A34A' : '#94A3B8'} />
                                <Box>
                                  <Typography variant="body2" sx={{ fontWeight: 700, color: isDark ? '#F8FAFC' : '#1E293B', fontSize: '13.5px' }}>
                                    {cert.name}
                                  </Typography>
                                  <Typography variant="caption" sx={{ color: isUploaded ? (isDark ? '#38BDF8' : '#16A34A') : (isDark ? '#94A3B8' : '#64748B'), fontSize: '11px', display: 'block', fontWeight: 600 }}>
                                    {isUploaded ? (cert.fileName || `${cert.name}.pdf`) : 'Not Uploaded'}
                                  </Typography>
                                </Box>
                              </Box>
                              <Chip
                                label={isUploaded ? 'Uploaded' : 'Not Uploaded'}
                                color={isUploaded ? 'success' : 'default'}
                                size="small"
                                sx={{ fontWeight: 700, fontSize: '10.5px', height: '20px' }}
                              />
                            </Box>

                            {isUploaded ? (
                              <Box sx={{ display: 'flex', gap: '8px', mt: '4px' }}>
                                <Button
                                  variant="outlined"
                                  size="small"
                                  startIcon={<Eye size={14} />}
                                  onClick={() => setPreviewCert(cert)}
                                  sx={{
                                    flex: 1,
                                    height: '32px',
                                    fontSize: '12px',
                                    borderRadius: '8px',
                                    textTransform: 'none',
                                    fontWeight: 600,
                                  }}
                                >
                                  Preview
                                </Button>
                                <Button
                                  variant="contained"
                                  size="small"
                                  startIcon={<Download size={14} />}
                                  onClick={() => handleDownloadCert(cert)}
                                  sx={{
                                    flex: 1,
                                    height: '32px',
                                    fontSize: '12px',
                                    borderRadius: '8px',
                                    textTransform: 'none',
                                    fontWeight: 600,
                                    backgroundColor: isDark ? '#38BDF8' : '#0B3D91',
                                    color: isDark ? '#0F172A' : '#FFFFFF',
                                  }}
                                >
                                  Download
                                </Button>
                              </Box>
                            ) : (
                              <Box sx={{ mt: '4px' }}>
                                <Typography variant="caption" sx={{ color: isDark ? '#64748B' : '#94A3B8', fontStyle: 'italic', fontWeight: 500 }}>
                                  Not Uploaded
                                </Typography>
                              </Box>
                            )}
                          </Paper>
                        </Grid>
                      );
                    })
                  ) : (
                    <Grid item xs={12}>
                      <Typography variant="body2" sx={{ color: isDark ? '#94A3B8' : '#64748B', fontStyle: 'italic' }}>
                        Not Uploaded
                      </Typography>
                    </Grid>
                  )}
                </Grid>
              </Paper>
            </Grid>
          </Grid>
        </DialogContent>

        {/* ==================== BOTTOM BUTTONS ==================== */}
        <DialogActions
          sx={{
            padding: '16px 28px',
            backgroundColor: isDark ? '#0F172A' : '#F8FAFC',
            borderTop: `1px solid ${isDark ? '#334155' : '#E2E8F0'}`,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Button
            variant="outlined"
            onClick={closeViewModal}
            sx={{
              height: '42px',
              padding: '0 24px',
              borderRadius: '10px',
              fontWeight: 600,
              fontSize: '14px',
              color: isDark ? '#CBD5E1' : '#475569',
              borderColor: isDark ? '#334155' : '#CBD5E1',
            }}
          >
            Close
          </Button>

          <Box sx={{ display: 'flex', gap: '14px' }}>
            <Button
              variant="outlined"
              startIcon={<Printer size={18} />}
              onClick={handlePrint}
              sx={{
                height: '42px',
                padding: '0 22px',
                borderRadius: '10px',
                fontWeight: 600,
                fontSize: '14px',
                color: isDark ? '#38BDF8' : '#0B3D91',
                borderColor: isDark ? '#38BDF8' : '#0B3D91',
                '&:hover': {
                  backgroundColor: isDark ? 'rgba(56, 189, 248, 0.1)' : 'rgba(11, 61, 145, 0.05)',
                },
              }}
            >
              Print Student Profile
            </Button>

            <Button
              variant="contained"
              startIcon={<Download size={18} />}
              onClick={() => generateStudentPdf(s)}
              sx={{
                height: '42px',
                padding: '0 24px',
                borderRadius: '10px',
                fontWeight: 600,
                fontSize: '14px',
                backgroundColor: '#16A34A',
                color: '#FFFFFF',
                boxShadow: '0 4px 12px rgba(22, 163, 74, 0.25)',
                '&:hover': {
                  backgroundColor: '#15803D',
                },
              }}
            >
              Export PDF
            </Button>
          </Box>
        </DialogActions>
      </Dialog>

      {/* ==================== CERTIFICATE PREVIEW DIALOG ==================== */}
      {previewCert && (
        <Dialog
          open={Boolean(previewCert)}
          onClose={() => setPreviewCert(null)}
          maxWidth="md"
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: '16px',
              backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
              color: isDark ? '#FFFFFF' : '#1E293B',
              p: 2,
            },
          }}
        >
          <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              📄 Document Preview: {previewCert.name}
            </Typography>
            <IconButton onClick={() => setPreviewCert(null)}>
              <X size={18} />
            </IconButton>
          </DialogTitle>
          <DialogContent>
            {(() => {
              const previewUrl =
                typeof previewCert.file === 'string' ? resolveFileUrl(previewCert.file) : null;
              const isImage = !!previewUrl && /\.(jpe?g|png)$/i.test(previewUrl);
              const isPdf = !!previewUrl && /\.pdf$/i.test(previewUrl);

              if (isImage) {
                return (
                  <Box sx={{ textAlign: 'center' }}>
                    <img
                      src={previewUrl || ''}
                      alt={previewCert.name}
                      style={{ maxWidth: '100%', maxHeight: 480, borderRadius: '12px' }}
                    />
                  </Box>
                );
              }
              if (isPdf) {
                return (
                  <Box sx={{ height: 480 }}>
                    <iframe
                      src={previewUrl || ''}
                      title={previewCert.name}
                      style={{ width: '100%', height: '100%', border: 'none', borderRadius: '12px' }}
                    />
                  </Box>
                );
              }
              return (
                <Box
                  sx={{
                    height: 400,
                    borderRadius: '12px',
                    border: `2px dashed ${isDark ? '#334155' : '#CBD5E1'}`,
                    backgroundColor: isDark ? '#0F172A' : '#F1F5F9',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 2,
                    p: 3,
                    textAlign: 'center',
                  }}
                >
                  <FileCheck size={64} color={isDark ? '#38BDF8' : '#0B3D91'} />
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    {previewCert.name}
                  </Typography>
                  <Typography variant="body2" sx={{ color: isDark ? '#94A3B8' : '#64748B' }}>
                    File: {previewCert.fileName || `${previewCert.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${appNo}.pdf`}
                  </Typography>
                  <Chip
                    label={previewCert.received ? 'Verified & Received' : 'Not Received'}
                    color={previewCert.received ? 'success' : 'default'}
                    sx={{ fontWeight: 700 }}
                  />
                </Box>
              );
            })()}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setPreviewCert(null)}>Close</Button>
            <Button
              variant="contained"
              startIcon={<Download size={16} />}
              onClick={() => {
                handleDownloadCert(previewCert);
                setPreviewCert(null);
              }}
            >
              Download File
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </>
  );
};
