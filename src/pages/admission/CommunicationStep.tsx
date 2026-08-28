import React, { useEffect } from 'react';
import {
  Grid,
  TextField,
  Typography,
  Box,
  FormControlLabel,
  Checkbox,
} from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { communicationSchema, CommunicationFormData } from '../../schemas/communication.schema';
import { useAdmission } from '../../context/AdmissionContext';
import { useThemeContext } from '../../context/ThemeContext';
import { AppCard } from '../../components/ui/AppCard';
import { handleFormEnterKeyDown } from '../../utils/enterKeyNavigation';
import { getNoAutofillInputProps } from '../../utils/autofillHelper';
import { focusFirstFormError } from '../../utils/formFocus';

const getFieldSx = (isDark: boolean) => ({
  '& .MuiInputLabel-root': {
    fontSize: '14.5px',
    fontWeight: 600,
    color: isDark ? '#CBD5E1' : '#344054',
    transform: 'translate(14px, 14px) scale(1)',
  },
  '& .MuiInputLabel-shrink': {
    color: isDark ? '#F8FAFC' : '#0D47A1',
    transform: 'translate(14px, -9px) scale(0.75)',
  },
  '& .MuiOutlinedInput-root': {
    minHeight: '50px',
    borderRadius: '12px',
    fontSize: '15px',
    '& input': {
      padding: '13px 16px',
    },
    '& textarea': {
      padding: '4px 6px',
    },
    '& input::placeholder': {
      fontSize: '14.5px',
    },
    '& .MuiSvgIcon-root': {
      fontSize: '20px',
    },
  },
});

export const CommunicationStep: React.FC<{ onNext: () => void }> = ({ onNext }) => {
  const { mode } = useThemeContext();
  const isDark = mode === 'dark';
  const { draftStudent, updateDraftSection, isViewReadOnly } = useAdmission();

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CommunicationFormData>({
    resolver: zodResolver(communicationSchema),
    defaultValues: {
      permanentAddress: {
        addressLine: draftStudent.communication?.permanentAddress?.addressLine || '',
        pinCode: draftStudent.communication?.permanentAddress?.pinCode || '',
        phoneNumber: draftStudent.communication?.permanentAddress?.phoneNumber || '',
        mobileNumber: draftStudent.communication?.permanentAddress?.mobileNumber || '',
        email: draftStudent.communication?.permanentAddress?.email || '',
      },
      communicationAddress: {
        addressLine: draftStudent.communication?.communicationAddress?.addressLine || '',
        pinCode: draftStudent.communication?.communicationAddress?.pinCode || '',
        phoneNumber: draftStudent.communication?.communicationAddress?.phoneNumber || '',
        mobileNumber: draftStudent.communication?.communicationAddress?.mobileNumber || '',
        email: draftStudent.communication?.communicationAddress?.email || '',
      },
      sameAsPermanent: draftStudent.communication?.sameAsPermanent ?? false,
    },
  });

  const watchedValues = watch();
  const sameAsPermanent = watch('sameAsPermanent');
  const permAddress = watch('permanentAddress');

  useEffect(() => {
    updateDraftSection('communication', watchedValues as any);
  }, [JSON.stringify(watchedValues)]);

  useEffect(() => {
    if (sameAsPermanent) {
      setValue('communicationAddress', { ...permAddress }, { shouldValidate: true, shouldDirty: true });
    }
  }, [sameAsPermanent, JSON.stringify(permAddress), setValue]);

  const onSubmit = async (data: CommunicationFormData) => {
    updateDraftSection('communication', data);
    onNext();
  };

  const fieldSx = getFieldSx(isDark);

  return (
    <Box
      component="form"
      id="wizard-step-form"
      autoComplete="off"
      onKeyDown={(e) => handleFormEnterKeyDown(e, handleSubmit(onSubmit, focusFirstFormError))}
      onSubmit={handleSubmit(onSubmit, focusFirstFormError)}
    >
      {/* Hidden dummy inputs to trap Chrome profile autofill */}
      <input type="text" name="prevent_autofill_user" id="prevent_autofill_user" style={{ display: 'none' }} tabIndex={-1} autoComplete="off" />
      <input type="password" name="prevent_autofill_pass" id="prevent_autofill_pass" style={{ display: 'none' }} tabIndex={-1} autoComplete="off" />

      {/* Permanent Address Card */}
      <AppCard sx={{ marginBottom: '24px' }}>
        <Typography sx={{ fontWeight: 700, color: isDark ? '#FFFFFF' : '#0D47A1', marginBottom: '4px', fontSize: '22px' }}>
          Permanent Address
        </Typography>
        <Typography sx={{ color: isDark ? '#CBD5E1' : '#667085', marginBottom: '24px', fontSize: '14px' }}>
          Enter the student's primary permanent address information.
        </Typography>

        <Grid container columnSpacing={3} rowSpacing={2.5}>
          <Grid item xs={12}>
            <Controller
              name="permanentAddress.addressLine"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  multiline
                  rows={2}
                  label="Address Line *"
                  fullWidth
                  sx={fieldSx}
                  disabled={isViewReadOnly}
                  inputProps={getNoAutofillInputProps('perm_addr')}
                  error={!!errors.permanentAddress?.addressLine}
                  helperText={errors.permanentAddress?.addressLine?.message}
                />
              )}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <Controller
              name="permanentAddress.pinCode"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="PIN Code (6 Digits) *"
                  fullWidth
                  sx={fieldSx}
                  disabled={isViewReadOnly}
                  inputProps={{ ...getNoAutofillInputProps('perm_pin'), maxLength: 6 }}
                  error={!!errors.permanentAddress?.pinCode}
                  helperText={errors.permanentAddress?.pinCode?.message}
                />
              )}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <Controller
              name="permanentAddress.mobileNumber"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Mobile Number (10 Digits) *"
                  fullWidth
                  sx={fieldSx}
                  disabled={isViewReadOnly}
                  inputProps={{ ...getNoAutofillInputProps('perm_mobile'), maxLength: 10 }}
                  error={!!errors.permanentAddress?.mobileNumber}
                  helperText={errors.permanentAddress?.mobileNumber?.message}
                />
              )}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <Controller
              name="permanentAddress.email"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Email ID"
                  value={field.value || ''}
                  onChange={(e) => field.onChange(e.target.value.trim())}
                  onBlur={(e) => field.onChange(e.target.value.trim())}
                  autoComplete="off"
                  inputProps={getNoAutofillInputProps('perm_email')}
                  type="email"
                  fullWidth
                  sx={{ ...fieldSx, '& input': { textTransform: 'none' } }}
                  disabled={isViewReadOnly}
                  error={!!errors.permanentAddress?.email}
                  helperText={errors.permanentAddress?.email?.message}
                />
              )}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <Controller
              name="permanentAddress.phoneNumber"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Landline / Phone Number (Optional)"
                  fullWidth
                  sx={fieldSx}
                  disabled={isViewReadOnly}
                  inputProps={getNoAutofillInputProps('perm_phone')}
                />
              )}
            />
          </Grid>
        </Grid>
      </AppCard>

      {/* Communication Address Card */}
      <AppCard>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <Typography sx={{ fontWeight: 700, color: isDark ? '#FFFFFF' : '#0D47A1', fontSize: '22px' }}>
            Communication Address
          </Typography>
          <Controller
            name="sameAsPermanent"
            control={control}
            render={({ field }) => (
              <FormControlLabel
                control={
                  <Checkbox
                    checked={field.value}
                    onChange={(e) => field.onChange(e.target.checked)}
                    disabled={isViewReadOnly}
                    color="primary"
                    sx={{ '& .MuiSvgIcon-root': { fontSize: '20px' } }}
                  />
                }
                label="Same as Permanent Address"
                sx={{ '& .MuiTypography-root': { fontWeight: 600, color: isDark ? '#38BDF8' : '#0D47A1', fontSize: '14.5px' } }}
              />
            )}
          />
        </Box>

        <Grid container columnSpacing={3} rowSpacing={2.5}>
          <Grid item xs={12}>
            <Controller
              name="communicationAddress.addressLine"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  multiline
                  rows={2}
                  label="Address Line *"
                  fullWidth
                  sx={fieldSx}
                  disabled={sameAsPermanent || isViewReadOnly}
                  inputProps={getNoAutofillInputProps('comm_addr')}
                  error={!!errors.communicationAddress?.addressLine}
                  helperText={errors.communicationAddress?.addressLine?.message}
                />
              )}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <Controller
              name="communicationAddress.pinCode"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="PIN Code *"
                  fullWidth
                  sx={fieldSx}
                  disabled={sameAsPermanent || isViewReadOnly}
                  inputProps={{ ...getNoAutofillInputProps('comm_pin'), maxLength: 6 }}
                  error={!!errors.communicationAddress?.pinCode}
                  helperText={errors.communicationAddress?.pinCode?.message}
                />
              )}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <Controller
              name="communicationAddress.mobileNumber"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Mobile Number *"
                  fullWidth
                  sx={fieldSx}
                  disabled={sameAsPermanent || isViewReadOnly}
                  inputProps={{ ...getNoAutofillInputProps('comm_mobile'), maxLength: 10 }}
                  error={!!errors.communicationAddress?.mobileNumber}
                  helperText={errors.communicationAddress?.mobileNumber?.message}
                />
              )}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <Controller
              name="communicationAddress.email"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Email ID"
                  value={field.value || ''}
                  onChange={(e) => field.onChange(e.target.value.trim())}
                  onBlur={(e) => field.onChange(e.target.value.trim())}
                  autoComplete="off"
                  inputProps={getNoAutofillInputProps('comm_email')}
                  type="email"
                  fullWidth
                  sx={{ ...fieldSx, '& input': { textTransform: 'none' } }}
                  disabled={sameAsPermanent || isViewReadOnly}
                  error={!!errors.communicationAddress?.email}
                  helperText={errors.communicationAddress?.email?.message}
                />
              )}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <Controller
              name="communicationAddress.phoneNumber"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Landline / Phone Number"
                  fullWidth
                  sx={fieldSx}
                  disabled={sameAsPermanent || isViewReadOnly}
                  inputProps={getNoAutofillInputProps('comm_phone')}
                />
              )}
            />
          </Grid>
        </Grid>
      </AppCard>
    </Box>
  );
};
