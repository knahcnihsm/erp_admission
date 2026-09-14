import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  Box,
  IconButton,
  FormHelperText,
} from '@mui/material';
import { X, Archive } from 'lucide-react';
import { useThemeContext } from '../../context/ThemeContext';
import { StudentRecord } from '../../types';

interface ArchiveStudentModalProps {
  open: boolean;
  student: StudentRecord | null;
  onClose: () => void;
  onConfirmArchive: (reason: string, description: string) => Promise<void>;
}

export const ArchiveStudentModal: React.FC<ArchiveStudentModalProps> = ({
  open,
  student,
  onClose,
  onConfirmArchive,
}) => {
  const { mode } = useThemeContext();
  const isDark = mode === 'dark';

  const [reason, setReason] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [errors, setErrors] = useState<{ reason?: string; description?: string }>({});
  const [submitting, setSubmitting] = useState<boolean>(false);

  const handleClose = () => {
    setReason('');
    setDescription('');
    setErrors({});
    setSubmitting(false);
    onClose();
  };

  const handleArchive = async () => {
    const newErrors: { reason?: string; description?: string } = {};

    if (!reason || reason.trim() === '') {
      newErrors.reason = 'Archive reason is required';
    }

    if (!description || description.trim() === '') {
      newErrors.description = 'Description is required';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setSubmitting(true);
    try {
      await onConfirmArchive(reason, description);
      handleClose();
    } catch {
      setSubmitting(false);
    }
  };

  if (!student) return null;

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: '16px',
          padding: '8px',
          backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
          color: isDark ? '#FFFFFF' : '#1E293B',
          boxShadow: isDark
            ? '0 20px 40px rgba(0, 0, 0, 0.6)'
            : '0 20px 40px rgba(11, 61, 145, 0.15)',
          border: `1px solid ${isDark ? '#334155' : '#D6E4F0'}`,
        },
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          pb: 1,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: '10px',
              backgroundColor: isDark ? 'rgba(239, 68, 68, 0.15)' : '#FEE2E2',
              color: '#DC2626',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Archive size={18} />
          </Box>
          <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '18px' }}>
            Archive Student
          </Typography>
        </Box>
        <IconButton onClick={handleClose} size="small" sx={{ color: isDark ? '#94A3B8' : '#64748B' }}>
          <X size={18} />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ py: 2 }}>
        <Typography
          variant="body2"
          sx={{
            mb: 2.5,
            color: isDark ? '#94A3B8' : '#64748B',
            fontSize: '14px',
          }}
        >
          Archiving student <strong>{student.personal.studentName}</strong> (App No: {student.personal.applicationNumber}, Reg No: {student.personal.registerNumber}).
        </Typography>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Archive Reason Text Field */}
          <Box>
            <Typography
              variant="body2"
              sx={{
                fontWeight: 600,
                mb: '6px',
                color: isDark ? '#CBD5E1' : '#374151',
                fontSize: '13.5px',
              }}
            >
              Archive Reason <span style={{ color: '#EF4444' }}>*</span>
            </Typography>
            <TextField
              fullWidth
              size="small"
              placeholder="Enter archive reason (e.g., Transfer Certificate (TC))"
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                if (errors.reason) setErrors((prev) => ({ ...prev, reason: undefined }));
              }}
              error={Boolean(errors.reason)}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '10px',
                  backgroundColor: isDark ? '#0F172A' : '#F9FAFB',
                },
              }}
            />
            {errors.reason && (
              <FormHelperText error sx={{ ml: 0.5, mt: 0.5 }}>
                {errors.reason}
              </FormHelperText>
            )}
          </Box>

          {/* Description Textarea */}
          <Box>
            <Typography
              variant="body2"
              sx={{
                fontWeight: 600,
                mb: '6px',
                color: isDark ? '#CBD5E1' : '#374151',
                fontSize: '13.5px',
              }}
            >
              Description <span style={{ color: '#EF4444' }}>*</span>
            </Typography>
            <TextField
              multiline
              rows={4}
              fullWidth
              placeholder="Enter detailed description for archiving this student..."
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
                if (errors.description) setErrors((prev) => ({ ...prev, description: undefined }));
              }}
              error={Boolean(errors.description)}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '10px',
                  backgroundColor: isDark ? '#0F172A' : '#F9FAFB',
                },
              }}
            />
            {errors.description && (
              <FormHelperText error sx={{ ml: 0.5, mt: 0.5 }}>
                {errors.description}
              </FormHelperText>
            )}
          </Box>
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2, pt: 1, gap: '12px' }}>
        <Button
          variant="outlined"
          onClick={handleClose}
          disabled={submitting}
          sx={{
            height: '40px',
            borderRadius: '10px',
            fontWeight: 600,
            color: isDark ? '#CBD5E1' : '#475569',
            borderColor: isDark ? '#334155' : '#CBD5E1',
            px: 2.5,
          }}
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleArchive}
          disabled={submitting}
          sx={{
            height: '40px',
            borderRadius: '10px',
            fontWeight: 700,
            backgroundColor: '#DC2626',
            color: '#FFFFFF',
            px: 2.5,
            '&:hover': {
              backgroundColor: '#B91C1C',
            },
          }}
        >
          {submitting ? 'Archiving...' : 'Archive Student'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
