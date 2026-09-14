import React from 'react';
import { Snackbar as MuiSnackbar, Alert } from '@mui/material';
import { useAdmission } from '../../context/AdmissionContext';

export const AppSnackbar: React.FC = () => {
  const { snackbar, hideSnackbar } = useAdmission();

  return (
    <MuiSnackbar
      open={snackbar.open}
      autoHideDuration={4000}
      onClose={hideSnackbar}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
    >
      <Alert
        onClose={hideSnackbar}
        severity={snackbar.severity}
        variant="filled"
        sx={{ width: '100%', borderRadius: '8px', fontWeight: 600 }}
      >
        {snackbar.message}
      </Alert>
    </MuiSnackbar>
  );
};
