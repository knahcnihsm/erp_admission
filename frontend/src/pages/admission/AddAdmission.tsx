import React, { useState } from 'react';
import { Box, Typography, Button, CircularProgress } from '@mui/material';
import { motion } from 'motion/react';
import { ArrowLeft, ArrowRight, Save, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAdmission } from '../../context/AdmissionContext';
import { useThemeContext } from '../../context/ThemeContext';
import { StudentDetailsStep } from './StudentDetailsStep';
import { ParentDetailsStep } from './ParentDetailsStep';
import { CommunicationStep } from './CommunicationStep';
import { AcademicDetailsStep } from './AcademicDetailsStep';
import { QualifyingExamStep } from './QualifyingExamStep';
import { FeeStructureStep } from './FeeStructureStep';
import { CertificatesUploadStep } from './CertificatesUploadStep';

export const AddAdmission: React.FC = () => {
  const navigate = useNavigate();
  const {
    activeStep,
    setActiveStep,
    isEditMode,
    isViewReadOnly,
    savingStep,
    saveCurrentAdmission,
  } = useAdmission();

  const { mode } = useThemeContext();
  const isDark = mode === 'dark';

  const [direction, setDirection] = useState<1 | -1>(1);

  const handleNext = () => {
    if (activeStep < 6) {
      setDirection(1);
      setActiveStep(activeStep + 1);
    }
  };

  const handlePrevious = () => {
    if (activeStep > 0) {
      setDirection(-1);
      setActiveStep(activeStep - 1);
    }
  };

  const handleFinalSave = async () => {
    const ok = await saveCurrentAdmission();
    if (ok) navigate('/');
  };

  const getPageTitle = () => {
    if (isViewReadOnly) return 'View Student Admission Details';
    if (isEditMode) return 'Edit Student Details';
    return 'Add New Admission';
  };

  const getStepTitle = () => {
    switch (activeStep) {
      case 0:
        return 'Student Personal Information';
      case 1:
        return 'Parent & Guardian Details';
      case 2:
        return 'Permanent & Communication Address';
      case 3:
        return 'Academic & Program Details';
      case 4:
        return 'Qualifying Examination & Marks';
      case 5:
        return 'Fee Structure & Facilities';
      case 6:
        return 'Document Verification & Uploads';
      default:
        return '';
    }
  };

  return (
    <Box sx={{ maxWidth: '100%', width: '100%', margin: '0 auto' }}>
      {/* Page Header */}
      <Box sx={{ marginBottom: '20px' }}>
        <Typography sx={{ fontWeight: 700, color: isDark ? '#FFFFFF' : '#0D47A1', fontSize: { xs: '22px', sm: '28px' }, lineHeight: { xs: '30px', sm: '36px' } }}>
          {getPageTitle()}
        </Typography>
        <Typography sx={{ color: isDark ? '#CBD5E1' : '#667085', fontSize: '14px', fontWeight: 500, marginTop: '4px' }}>
          Step {activeStep + 1} of 7 — {getStepTitle()}
        </Typography>
      </Box>

      {/* Step Form Body */}
      <motion.div
        key={activeStep}
        initial={{ opacity: 0, x: direction * 28 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
      >
        <Box sx={{ marginBottom: '32px' }}>
          {activeStep === 0 && <StudentDetailsStep onNext={handleNext} />}
          {activeStep === 1 && <ParentDetailsStep onNext={handleNext} />}
          {activeStep === 2 && <CommunicationStep onNext={handleNext} />}
          {activeStep === 3 && <AcademicDetailsStep onNext={handleNext} />}
          {activeStep === 4 && <QualifyingExamStep onNext={handleNext} />}
          {activeStep === 5 && <FeeStructureStep onNext={handleNext} />}
          {activeStep === 6 && <CertificatesUploadStep onSave={handleFinalSave} />}
        </Box>
      </motion.div>

      {/* Bottom Sticky Action Bar */}
      <Box
        sx={{
          backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
          border: `1px solid ${isDark ? '#334155' : '#E6ECF5'}`,
          borderRadius: '14px',
          padding: '12px 20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: isDark
            ? '0 8px 30px rgba(0, 0, 0, 0.4)'
            : '0 8px 30px rgba(0, 0, 0, 0.06)',
          position: 'sticky',
          bottom: '16px',
          zIndex: 100,
        }}
      >
        <Button
          disabled={activeStep === 0 || savingStep}
          onClick={handlePrevious}
          variant="outlined"
          startIcon={<ArrowLeft size={16} />}
          sx={{
            borderColor: isDark ? '#334155' : '#D8E4F2',
            color: isDark ? '#CBD5E1' : '#1A2B49',
            borderRadius: '14px',
            fontWeight: 600,
            fontSize: '13px',
            padding: '8px 18px',
            '&:hover': {
              borderColor: isDark ? '#38BDF8' : '#1A2B49',
              backgroundColor: isDark ? 'rgba(56,189,248,0.08)' : 'rgba(26,43,73,0.06)',
            },
            '&.Mui-disabled': {
              borderColor: isDark ? '#334155' : '#E6ECF5',
              color: isDark ? '#64748B' : '#9BA3AF',
            },
          }}
        >
          Previous
        </Button>

        <Box sx={{ display: 'flex', gap: '12px' }}>
          {activeStep < 6 ? (
            <Button
              type="submit"
              form="wizard-step-form"
              variant="contained"
              disabled={savingStep}
              startIcon={
                savingStep ? <CircularProgress size={16} color="inherit" /> : <ArrowRight size={16} />
              }
              sx={{
                backgroundColor: isDark ? '#1D6FA4' : '#0D47A1',
                color: '#FFFFFF',
                borderRadius: '14px',
                fontWeight: 600,
                fontSize: '13px',
                padding: '8px 22px',
                '&:hover': {
                  backgroundColor: isDark ? '#38BDF8' : '#0B3D91',
                  color: isDark ? '#0F172A' : '#FFFFFF',
                },
              }}
            >
              Next
            </Button>
          ) : (            !isViewReadOnly && (
              <Button
                type="submit"
                form="wizard-step-form"
                variant="contained"
                disabled={savingStep}
                startIcon={
                  savingStep ? <CircularProgress size={16} color="inherit" /> : <CheckCircle size={16} />
                }
                sx={{
                  backgroundColor: '#16A34A',
                  color: '#FFFFFF',
                  borderRadius: '14px',
                  fontWeight: 700,
                  fontSize: '13px',
                  padding: '8px 24px',
                  '&:hover': { backgroundColor: '#15803D' },
                }}
              >
                {isEditMode ? 'Update Student' : 'Save Admission'}
              </Button>
            )
          )}
        </Box>
      </Box>
    </Box>
  );
};
