import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Collapse,
} from '@mui/material';
import {
  LayoutDashboard,
  UserPlus,
  Pencil,
  Archive,
  FileSpreadsheet,
  CheckCircle2,
  ArrowLeft,
  ChevronDown,
  ChevronRight,
  FileText,
  User,
  Users,
  MapPin,
  GraduationCap,
  CreditCard,
  ListChecks,
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAdmission } from '../../context/AdmissionContext';
import { useThemeContext } from '../../context/ThemeContext';
import { exportStudentsToExcel } from '../../utils/exportExcel';
import { generateStudentPdf } from '../../utils/exportPdf';
import {
  isStudentDetailsComplete,
  isParentDetailsComplete,
  isCommunicationComplete,
  isAdmissionDetailsComplete,
  isQualifyingExamComplete,
  isAcademicComplete,
  isFeeComplete,
  isCertificatesComplete,
} from '../../utils/sectionValidation';

export const Sidebar: React.FC<{ onNavigate?: () => void }> = ({ onNavigate }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { mode } = useThemeContext();
  const isDark = mode === 'dark';

  const prevPathRef = useRef(location.pathname);
  useEffect(() => {
    if (prevPathRef.current !== location.pathname) {
      prevPathRef.current = location.pathname;
      onNavigate?.();
    }
  }, [location.pathname]);

  const {
    activeStep,
    setActiveStep,
    selectedStudentIds,
    students,
    startEditStudent,
    startAddAdmission,
    draftStudent,
    showWarningModal,
    requestNavigation,
    tryNavigateToStep,
  } = useAdmission();

  const [exportOpen, setExportOpen] = useState<boolean>(true);
  const [academicMenuOpen, setAcademicMenuOpen] = useState<boolean>(true);

  const isAdmissionRoute =
    location.pathname.startsWith('/admission') ||
    location.pathname.startsWith('/EditStudent');

  const handleEditClick = () => {
    if (selectedStudentIds.length === 1) {
      const studentToEdit = students.find((s) => s.id === selectedStudentIds[0]);
      if (studentToEdit) {
        requestNavigation(() => {
          startEditStudent(studentToEdit);
          navigate('/EditStudent');
        });
      }
    } else if (selectedStudentIds.length === 0) {
      showWarningModal(
        'No Student Selected',
        'Please select exactly one student to edit.'
      );
    } else {
      showWarningModal(
        'Multiple Students Selected',
        'You can edit only one student at a time.'
      );
    }
  };

  const handleAddAdmissionClick = () => {
    requestNavigation(() => {
      startAddAdmission();
      navigate('/admission');
    });
  };

  // 1. Dashboard active/inactive style
  // 1. Dashboard active/inactive style
  const navItemStyle = (isActive: boolean) => ({
    borderRadius: '8px',
    marginBottom: '6px',
    padding: '8px 12px',
    backgroundColor: isActive
      ? isDark
        ? 'rgba(56, 189, 248, 0.18)'
        : 'rgba(255, 255, 255, 0.95)'
      : 'transparent',
    color: isActive
      ? isDark
        ? '#38BDF8'
        : '#0B3D91'
      : isDark
        ? '#CBD5E1'
        : '#FFFFFF',
    transition: 'all 180ms ease-in-out',
    '&:hover': {
      backgroundColor: isActive
        ? isDark
          ? 'rgba(56, 189, 248, 0.25)'
          : 'rgba(255, 255, 255, 0.98)'
        : isDark
          ? '#334155'
          : 'rgba(255, 255, 255, 0.12)',
    },
  });

  // 2. Wizard active step style
  const stepNavItemStyle = (isActive: boolean) => ({
    borderRadius: '8px',
    marginBottom: '6px',
    padding: '8px 12px',
    backgroundColor: isActive
      ? isDark
        ? '#38BDF8'
        : '#1A73E8'
      : 'transparent',
    color: isActive && isDark ? '#0F172A' : '#FFFFFF',
    fontWeight: isActive ? 700 : 500,
    transition: 'all 180ms ease-in-out',
    '&:hover': {
      backgroundColor: isActive
        ? isDark
          ? '#7DD3FC'
          : '#1565C0'
        : isDark
          ? '#334155'
          : 'rgba(255, 255, 255, 0.12)',
    },
  });

  // 3. Sub-menu item style
  const subNavItemStyle = (isActive: boolean) => ({
    borderRadius: '6px',
    marginBottom: '4px',
    padding: '6px 12px 6px 36px',
    backgroundColor: isActive
      ? isDark
        ? 'rgba(56, 189, 248, 0.15)'
        : 'rgba(255, 255, 255, 0.15)'
      : 'transparent',
    color: isActive && isDark ? '#38BDF8' : '#FFFFFF',
    borderLeft: isActive ? '3px solid #38BDF8' : 'none',
    transition: 'all 180ms ease-in-out',
    '&:hover': {
      backgroundColor: isActive
        ? isDark
          ? 'rgba(56, 189, 248, 0.25)'
          : 'rgba(255, 255, 255, 0.2)'
        : isDark
          ? '#334155'
          : 'rgba(255, 255, 255, 0.08)',
    },
  });

  const program = draftStudent.academic?.program || '';

  const getSubMenuSteps = () => {
    if (!program) return [];
    if (program === 'First Year B.Tech') {
      return [
        { label: 'Admission Details', stepId: 3 },
        { label: 'Qualifying Examination', stepId: 4 },
        { label: 'HSC Marks', stepId: 4 },
      ];
    } else if (program === 'Second Year B.Tech (Lateral Entry)') {
      return [
        { label: 'Admission Details', stepId: 3 },
        { label: 'Diploma Details', stepId: 4 },
      ];
    } else if (program === 'PG') {
      return [
        { label: 'Admission Details', stepId: 3 },
        { label: 'UG / Qualifying Degree', stepId: 4 },
      ];
    }
    return [];
  };

  return (
    <Box
      component="aside"
      sx={{
        width: '240px',
        minWidth: '240px',
        height: 'calc(100vh - 64px)',
        position: 'sticky',
        top: '64px',
        background: isDark
          ? '#0F172A'
          : 'linear-gradient(180deg, #0A2D6E 0%, #0B3D91 55%, #1565C0 100%)',
        display: 'flex',
        flexDirection: 'column',
        color: '#FFFFFF',
        boxShadow: '4px 0 20px rgba(0, 0, 0, 0.15)',
        borderRight: isDark ? '1px solid #334155' : 'none',
        overflow: 'hidden',
        zIndex: 1000,
      }}
    >
      {/* Navigation Menu */}
      <Box sx={{ padding: '8px 8px', flex: '0 0 auto' }}>
        {isAdmissionRoute ? (
          /* Step Wizard Navigation Mode (Dashboard-Style Design) */
          <Box>
            {/* Back to Dashboard Button (Styled like Dashboard item) */}
            <ListItemButton
              onClick={() => requestNavigation(() => navigate('/'))}
              sx={{
                borderRadius: '8px',
                marginBottom: '16px',
                padding: '8px 12px',
                color: '#FFFFFF',
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.12)',
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: '30px', color: isDark ? '#CBD5E1' : '#FFFFFF' }}>
                <ArrowLeft size={17} />
              </ListItemIcon>
              <ListItemText
                primary="BACK TO DASHBOARD"
                primaryTypographyProps={{
                  fontSize: '11.5px',
                  fontWeight: 700,
                  letterSpacing: '0.04em',
                  color: '#FFFFFF',
                }}
              />
            </ListItemButton>

            <List disablePadding>
              {/* 1. Student Details */}
              <ListItemButton
                onClick={() => tryNavigateToStep(0)}
                sx={stepNavItemStyle(activeStep === 0)}
              >
                <ListItemIcon sx={{ minWidth: '30px', color: isDark ? (activeStep === 0 ? '#0F172A' : '#CBD5E1') : '#FFFFFF' }}>
                  {isStudentDetailsComplete(draftStudent) ? <CheckCircle2 size={17} color="#38BDF8" /> : <User size={17} />}
                </ListItemIcon>
                <ListItemText
                  primary="STUDENT DETAILS"
                  primaryTypographyProps={{
                    fontSize: '11.5px',
                    fontWeight: activeStep === 0 ? 700 : 600,
                    letterSpacing: '0.04em',
                    color: 'inherit',
                  }}
                />
              </ListItemButton>

              {/* 2. Parent Details */}
              <ListItemButton
                onClick={() => tryNavigateToStep(1)}
                sx={stepNavItemStyle(activeStep === 1)}
              >
                <ListItemIcon sx={{ minWidth: '30px', color: isDark ? (activeStep === 1 ? '#0F172A' : '#CBD5E1') : '#FFFFFF' }}>
                  {isParentDetailsComplete(draftStudent) ? <CheckCircle2 size={17} color="#38BDF8" /> : <Users size={17} />}
                </ListItemIcon>
                <ListItemText
                  primary="PARENT DETAILS"
                  primaryTypographyProps={{
                    fontSize: '11.5px',
                    fontWeight: activeStep === 1 ? 700 : 600,
                    letterSpacing: '0.04em',
                    color: 'inherit',
                  }}
                />
              </ListItemButton>

              {/* 3. Communication */}
              <ListItemButton
                onClick={() => tryNavigateToStep(2)}
                sx={stepNavItemStyle(activeStep === 2)}
              >
                <ListItemIcon sx={{ minWidth: '30px', color: isDark ? (activeStep === 2 ? '#0F172A' : '#CBD5E1') : '#FFFFFF' }}>
                  {isCommunicationComplete(draftStudent) ? <CheckCircle2 size={17} color="#38BDF8" /> : <MapPin size={17} />}
                </ListItemIcon>
                <ListItemText
                  primary="COMMUNICATION"
                  primaryTypographyProps={{
                    fontSize: '11.5px',
                    fontWeight: activeStep === 2 ? 700 : 600,
                    letterSpacing: '0.04em',
                    color: 'inherit',
                  }}
                />
              </ListItemButton>

              {/* 4. Academic Details (Expandable) */}
              <Box>
                <ListItemButton
                  onClick={() => {
                    setAcademicMenuOpen(!academicMenuOpen);
                    tryNavigateToStep(3);
                  }}
                  sx={stepNavItemStyle(activeStep === 3 || activeStep === 4)}
                >
                  <ListItemIcon sx={{ minWidth: '30px', color: isDark ? ((activeStep === 3 || activeStep === 4) ? '#0F172A' : '#CBD5E1') : '#FFFFFF' }}>
                    {isAcademicComplete(draftStudent) ? <CheckCircle2 size={17} color="#38BDF8" /> : <GraduationCap size={17} />}
                  </ListItemIcon>
                  <ListItemText
                    primary="ACADEMIC DETAILS"
                    primaryTypographyProps={{
                      fontSize: '11.5px',
                      fontWeight: (activeStep === 3 || activeStep === 4) ? 700 : 600,
                      letterSpacing: '0.04em',
                      color: 'inherit',
                    }}
                  />
                  {getSubMenuSteps().length > 0 && (
                    ((activeStep === 3 || activeStep === 4) || academicMenuOpen) ? <ChevronDown size={14} /> : <ChevronRight size={14} />
                  )}
                </ListItemButton>

                <Collapse in={((activeStep === 3 || activeStep === 4) || academicMenuOpen) && getSubMenuSteps().length > 0} timeout="auto" unmountOnExit>
                  <List disablePadding>
                    {getSubMenuSteps().map((subStep, index) => {
                      let isSubActive = false;
                      if (subStep.stepId === 3 && activeStep === 3) {
                        isSubActive = true;
                      } else if (subStep.stepId === 4 && activeStep === 4) {
                        isSubActive = true;
                      }

                      const isSubComplete =
                        subStep.stepId === 3
                          ? isAdmissionDetailsComplete(draftStudent)
                          : isQualifyingExamComplete(draftStudent);

                      return (
                        <ListItemButton
                          key={index}
                          onClick={() => tryNavigateToStep(subStep.stepId)}
                          sx={subNavItemStyle(isSubActive)}
                        >
                          {isSubComplete && (
                            <Box sx={{ marginRight: '8px', display: 'flex', alignItems: 'center' }}>
                              <CheckCircle2 size={14} color="#38BDF8" />
                            </Box>
                          )}
                          <ListItemText
                            primary={subStep.label}
                            primaryTypographyProps={{
                              fontSize: '11px',
                              fontWeight: isSubActive ? 700 : 500,
                              letterSpacing: '0.02em',
                              color: '#FFFFFF',
                            }}
                          />
                        </ListItemButton>
                      );
                    })}
                  </List>
                </Collapse>
              </Box>

              {/* 5. Fee Structure */}
              <ListItemButton
                onClick={() => tryNavigateToStep(5)}
                sx={stepNavItemStyle(activeStep === 5)}
              >
                <ListItemIcon sx={{ minWidth: '30px', color: isDark ? (activeStep === 5 ? '#0F172A' : '#CBD5E1') : '#FFFFFF' }}>
                  {isFeeComplete(draftStudent) ? <CheckCircle2 size={17} color="#38BDF8" /> : <CreditCard size={17} />}
                </ListItemIcon>
                <ListItemText
                  primary="FEE STRUCTURE"
                  primaryTypographyProps={{
                    fontSize: '11.5px',
                    fontWeight: activeStep === 5 ? 700 : 600,
                    letterSpacing: '0.04em',
                    color: 'inherit',
                  }}
                />
              </ListItemButton>

              {/* 6. Certificates Upload */}
              <ListItemButton
                onClick={() => tryNavigateToStep(6)}
                sx={stepNavItemStyle(activeStep === 6)}
              >
                <ListItemIcon sx={{ minWidth: '30px', color: isDark ? (activeStep === 6 ? '#0F172A' : '#CBD5E1') : '#FFFFFF' }}>
                  {isCertificatesComplete(draftStudent) ? <CheckCircle2 size={17} color="#38BDF8" /> : <FileText size={17} />}
                </ListItemIcon>
                <ListItemText
                  primary="CERTIFICATES UPLOAD"
                  primaryTypographyProps={{
                    fontSize: '11.5px',
                    fontWeight: activeStep === 6 ? 700 : 600,
                    letterSpacing: '0.04em',
                    color: 'inherit',
                  }}
                />
              </ListItemButton>
            </List>
          </Box>
        ) : (
          /* Main ERP Sidebar Navigation */
          <List disablePadding>
            {/* Dashboard */}
            <ListItemButton
              onClick={() => requestNavigation(() => navigate('/'))}
              sx={navItemStyle(location.pathname === '/')}
            >
              <ListItemIcon
                sx={{
                  minWidth: '30px',
                  color: location.pathname === '/'
                    ? (isDark ? '#38BDF8' : '#0B3D91')
                    : (isDark ? '#CBD5E1' : '#FFFFFF'),
                }}
              >
                <LayoutDashboard size={17} />
              </ListItemIcon>
              <ListItemText
                primary="DASHBOARD"
                primaryTypographyProps={{
                  fontSize: '11.5px',
                  fontWeight: 700,
                  letterSpacing: '0.04em',
                  color: 'inherit',
                }}
              />
            </ListItemButton>

            {/* Add New Admission */}
            <ListItemButton
              onClick={handleAddAdmissionClick}
              sx={navItemStyle(false)}
            >
              <ListItemIcon sx={{ minWidth: '30px', color: isDark ? '#CBD5E1' : '#FFFFFF' }}>
                <UserPlus size={17} />
              </ListItemIcon>
              <ListItemText
                primary="ADD NEW ADMISSION"
                primaryTypographyProps={{ fontSize: '11.5px', fontWeight: 600, letterSpacing: '0.04em', color: 'inherit' }}
              />
            </ListItemButton>

            {/* Edit Student Details */}
            <ListItemButton
              onClick={handleEditClick}
              sx={navItemStyle(false)}
            >
              <ListItemIcon sx={{ minWidth: '30px', color: isDark ? '#CBD5E1' : '#FFFFFF' }}>
                <Pencil size={17} />
              </ListItemIcon>
              <ListItemText
                primary="EDIT STUDENT DETAILS"
                primaryTypographyProps={{ fontSize: '11.5px', fontWeight: 600, letterSpacing: '0.04em', color: 'inherit' }}
              />
            </ListItemButton>

            {/* Archive Students List */}
            <ListItemButton
              onClick={() => requestNavigation(() => navigate('/archive'))}
              sx={navItemStyle(location.pathname === '/archive')}
            >
              <ListItemIcon
                sx={{
                  minWidth: '30px',
                  color: location.pathname === '/archive'
                    ? (isDark ? '#38BDF8' : '#0B3D91')
                    : (isDark ? '#CBD5E1' : '#FFFFFF'),
                }}
              >
                <Archive size={17} />
              </ListItemIcon>
              <ListItemText
                primary="ARCHIVE STUDENTS LIST"
                primaryTypographyProps={{
                  fontSize: '11.5px',
                  fontWeight: 600,
                  letterSpacing: '0.04em',
                  color: 'inherit',
                }}
              />
            </ListItemButton>

            {/* Bulk Update */}
            <ListItemButton
              onClick={() => requestNavigation(() => navigate('/bulk-update'))}
              sx={navItemStyle(location.pathname === '/bulk-update')}
            >
              <ListItemIcon
                sx={{
                  minWidth: '30px',
                  color: location.pathname === '/bulk-update'
                    ? (isDark ? '#38BDF8' : '#0B3D91')
                    : (isDark ? '#CBD5E1' : '#FFFFFF'),
                }}
              >
                <ListChecks size={17} />
              </ListItemIcon>
              <ListItemText
                primary="BULK UPDATE"
                primaryTypographyProps={{
                  fontSize: '11.5px',
                  fontWeight: 600,
                  letterSpacing: '0.04em',
                  color: 'inherit',
                }}
              />
            </ListItemButton>

            {/* Bulk Add Admission */}
            <ListItemButton
              onClick={() => requestNavigation(() => navigate('/bulk-add-admission'))}
              sx={navItemStyle(location.pathname === '/bulk-add-admission')}
            >
              <ListItemIcon
                sx={{
                  minWidth: '30px',
                  color: location.pathname === '/bulk-add-admission'
                    ? (isDark ? '#38BDF8' : '#0B3D91')
                    : (isDark ? '#CBD5E1' : '#FFFFFF'),
                }}
              >
                <UserPlus size={17} />
              </ListItemIcon>
              <ListItemText
                primary="BULK ADD ADMISSION"
                primaryTypographyProps={{
                  fontSize: '11.5px',
                  fontWeight: 600,
                  letterSpacing: '0.04em',
                  color: 'inherit',
                }}
              />
            </ListItemButton>

          </List>
        )}
      </Box>

      {/* Bottom Campus Building Illustration, Export & Version Container */}
      <Box
        sx={{
          flex: 1,
          minHeight: '200px',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          borderTop: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.2)'}`,
          backgroundImage: isDark
            ? `linear-gradient(180deg, rgba(15, 23, 42, 0.1) 0%, rgba(15, 23, 42, 0.35) 40%, rgba(15, 23, 42, 0.85) 100%), url('/images/dark-logo.png')`
            : `linear-gradient(180deg, rgba(11, 61, 145, 0.1) 0%, rgba(11, 61, 145, 0.35) 40%, rgba(11, 61, 145, 0.85) 100%), url('/images/light-logo.png')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center bottom',
          backgroundRepeat: 'no-repeat',
          transition: 'background-image 200ms ease-in-out',
        }}
      >
        {!isAdmissionRoute ? (
          <Box
            sx={{
              margin: '10px 10px 0 10px',
              padding: '8px 8px 4px 8px',
              borderRadius: '14px',
              backgroundColor: isDark
                ? 'rgba(15, 23, 42, 0.12)'
                : 'rgba(255, 255, 255, 0.30)',
              backdropFilter: isDark
                ? 'blur(3px) saturate(120%)'
                : 'blur(5px) saturate(160%)',
              border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(255, 255, 255, 0.45)'
                }`,
              boxShadow: isDark
                ? '0 4px 16px 0 rgba(0, 0, 0, 0.2)'
                : '0 6px 20px 0 rgba(0, 0, 0, 0.15)',
              transition: 'all 200ms ease-in-out',
            }}
          >
            {/* Export Section Header */}
            <Box sx={{ padding: '6px 8px 4px 8px' }}>
              <Typography
                sx={{
                  fontSize: '10px',
                  fontWeight: 700,
                  color: '#FFFFFF',
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  userSelect: 'none',
                  textShadow: '0 1px 2px rgba(0, 0, 0, 0.4)',
                }}
                onClick={() => setExportOpen(!exportOpen)}
              >
                EXPORT
                {exportOpen ? <ChevronDown size={14} color="#FFFFFF" /> : <ChevronRight size={14} color="#FFFFFF" />}
              </Typography>
            </Box>

            {/* Export Submenu Items */}
            <Collapse in={exportOpen} timeout="auto" unmountOnExit sx={{ backgroundColor: 'transparent !important' }}>
              <List disablePadding sx={{ backgroundColor: 'transparent !important' }}>
                <ListItemButton
                  onClick={() => {
                    if (selectedStudentIds.length === 0) {
                      showWarningModal(
                        'No Student Selected',
                        'Please select at least one student before exporting.'
                      );
                      return;
                    }
                    const selected = students.filter((s) => selectedStudentIds.includes(s.id));
                    exportStudentsToExcel(selected, 'Exported_Selected_Students.xlsx');
                  }}
                  sx={{
                    borderRadius: '8px',
                    marginBottom: '4px',
                    padding: '6px 10px',
                    color: '#E0F2FE',
                    backgroundColor: 'transparent !important',
                    '&:hover': {
                      backgroundColor: isDark
                        ? 'rgba(255, 255, 255, 0.15) !important'
                        : 'rgba(255, 255, 255, 0.3) !important',
                    },
                  }}
                >
                  <ListItemIcon sx={{ minWidth: '28px', color: '#FFFFFF' }}>
                    <FileSpreadsheet size={15} />
                  </ListItemIcon>
                  <ListItemText
                    primary="EXPORT SELECTED"
                    secondary="STUDENT (EXCEL)"
                    primaryTypographyProps={{
                      sx: {
                        fontSize: '10.5px',
                        fontWeight: 700,
                        color: '#FFFFFF',
                        letterSpacing: '0.02em',
                        textShadow: '0 1px 2px rgba(0, 0, 0, 0.4)',
                      },
                    }}
                    secondaryTypographyProps={{
                      sx: {
                        fontSize: '9.5px',
                        color: 'rgba(255, 255, 255, 0.85)',
                        fontWeight: 500,
                        textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)',
                      },
                    }}
                  />
                </ListItemButton>

                <ListItemButton
                  onClick={() => {
                    if (selectedStudentIds.length === 0) {
                      showWarningModal(
                        'No Student Selected',
                        'Please select a student before exporting the PDF.'
                      );
                      return;
                    }
                    const selected = students.filter((s) => selectedStudentIds.includes(s.id));
                    selected.forEach((s) => generateStudentPdf(s));
                  }}
                  sx={{
                    borderRadius: '8px',
                    marginBottom: '4px',
                    padding: '6px 10px',
                    color: '#E0F2FE',
                    backgroundColor: 'transparent !important',
                    '&:hover': {
                      backgroundColor: isDark
                        ? 'rgba(255, 255, 255, 0.15) !important'
                        : 'rgba(255, 255, 255, 0.3) !important',
                    },
                  }}
                >
                  <ListItemIcon sx={{ minWidth: '28px', color: '#FFFFFF' }}>
                    <FileText size={15} />
                  </ListItemIcon>
                  <ListItemText
                    primary="EXPORT STUDENT"
                    secondary="DETAILS (PDF)"
                    primaryTypographyProps={{
                      sx: {
                        fontSize: '10.5px',
                        fontWeight: 700,
                        color: '#FFFFFF',
                        letterSpacing: '0.02em',
                        textShadow: '0 1px 2px rgba(0, 0, 0, 0.4)',
                      },
                    }}
                    secondaryTypographyProps={{
                      sx: {
                        fontSize: '9.5px',
                        color: 'rgba(255, 255, 255, 0.85)',
                        fontWeight: 500,
                        textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)',
                      },
                    }}
                  />
                </ListItemButton>
              </List>
            </Collapse>
          </Box>
        ) : null}

        <Box sx={{ padding: '16px', marginTop: 'auto' }}>
          <Typography variant="body1" sx={{ fontWeight: 700, fontSize: '13px', color: '#FFFFFF', lineHeight: 1.3 }}>
            Academic ERP Systems
          </Typography>
          <Typography variant="caption" sx={{ color: '#93C5FD', fontSize: '12px', fontWeight: 500 }}>
            Version 2.4.0
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};
