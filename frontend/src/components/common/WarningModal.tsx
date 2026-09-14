import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
} from '@mui/material';
import { AlertCircle } from 'lucide-react';
import { useThemeContext } from '../../context/ThemeContext';

interface WarningModalProps {
  open: boolean;
  title: string;
  message: string;
  onClose: () => void;
}

export const WarningModal: React.FC<WarningModalProps> = ({
  open,
  title,
  message,
  onClose,
}) => {
  const { mode } = useThemeContext();
  const isDark = mode === 'dark';

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: '16px',
          padding: '12px 8px',
          backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
          color: isDark ? '#FFFFFF' : '#1E293B',
          boxShadow: isDark
            ? '0 20px 40px rgba(0,0,0,0.6)'
            : '0 20px 40px rgba(11,61,145,0.15)',
          border: `1px solid ${isDark ? '#334155' : '#E2E8F0'}`,
        },
      }}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: '12px', pb: 1 }}>
        <Box
          sx={{
            width: '40px',
            height: '40px',
            borderRadius: '12px',
            backgroundColor: isDark ? 'rgba(239, 68, 68, 0.15)' : '#FEE2E2',
            color: '#EF4444',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <AlertCircle size={22} />
        </Box>
        <Typography
          variant="h6"
          sx={{
            fontWeight: 700,
            fontSize: '17px',
            color: isDark ? '#FFFFFF' : '#1E293B',
          }}
        >
          {title}
        </Typography>
      </DialogTitle>

      <DialogContent sx={{ py: 1.5 }}>
        <Typography
          variant="body1"
          sx={{
            fontSize: '14.5px',
            color: isDark ? '#CBD5E1' : '#475569',
            lineHeight: 1.5,
          }}
        >
          {message}
        </Typography>
      </DialogContent>

      <DialogActions sx={{ pt: 1, pb: 0.5, px: 3 }}>
        <Button
          variant="contained"
          onClick={onClose}
          sx={{
            minWidth: '90px',
            height: '38px',
            borderRadius: '8px',
            fontWeight: 700,
            fontSize: '13px',
            backgroundColor: '#0B3D91',
            color: '#FFFFFF',
            '&:hover': {
              backgroundColor: '#082F49',
            },
          }}
        >
          OK
        </Button>
      </DialogActions>
    </Dialog>
  );
};
