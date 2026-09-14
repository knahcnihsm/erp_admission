import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
} from '@mui/material';
import { useAdmission } from '../../context/AdmissionContext';

export const ConfirmDialog: React.FC = () => {
  const { confirmDialog, hideConfirm } = useAdmission();

  return (
    <Dialog
      open={confirmDialog.open}
      onClose={hideConfirm}
      PaperProps={{
        sx: {
          borderRadius: '12px',
          padding: '8px',
          maxWidth: '440px',
        },
      }}
    >
      <DialogTitle sx={{ fontWeight: 700, color: '#1A2B49' }}>
        {confirmDialog.title}
      </DialogTitle>
      <DialogContent>
        <DialogContentText sx={{ color: '#667085', fontSize: '0.9375rem' }}>
          {confirmDialog.message}
        </DialogContentText>
      </DialogContent>
      <DialogActions sx={{ padding: '16px 24px' }}>
        <Button
          onClick={hideConfirm}
          variant="outlined"
          sx={{
            borderColor: '#D8E4F2',
            color: '#667085',
            borderRadius: '8px',
          }}
        >
          {confirmDialog.cancelText || 'Cancel'}
        </Button>
        <Button
          onClick={confirmDialog.onConfirm}
          variant="contained"
          color="error"
          disableElevation
          sx={{ borderRadius: '8px', fontWeight: 600 }}
        >
          {confirmDialog.confirmText || 'Confirm'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
