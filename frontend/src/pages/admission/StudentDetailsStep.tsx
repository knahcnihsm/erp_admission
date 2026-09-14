import React, { useState } from 'react';
import {
  Grid,
  TextField,
  MenuItem,
  Typography,
  Box,
  Button,
} from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { studentDetailsSchema, StudentDetailsFormData } from '../../schemas/student.schema';
import { useAdmission } from '../../context/AdmissionContext';
import { useThemeContext } from '../../context/ThemeContext';
import { DISTRICTS } from '../../utils/constants';
import { calculateAgeFromDOB } from '../../utils/dateUtils';
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
    height: '50px',
    borderRadius: '12px',
    fontSize: '15px',
    '& input': {
      padding: '13px 16px',
    },
    '& input::placeholder': {
      fontSize: '14.5px',
    },
    '& .MuiSelect-select': {
      padding: '13px 16px',
      display: 'flex',
      alignItems: 'center',
    },
    '& .MuiSvgIcon-root': {
      fontSize: '20px',
    },
  },
});

export const StudentDetailsStep: React.FC<{ onNext: () => void }> = ({ onNext }) => {
  const { mode } = useThemeContext();
  const isDark = mode === 'dark';

  const { draftStudent, updateDraftSection, isViewReadOnly } = useAdmission();

  // Determine initial states for custom entries
  const initCaste = draftStudent.personal?.caste || '';
  const isCustomCaste = initCaste !== '' && !['SC', 'ST', 'OBC', 'Others'].includes(initCaste);

  const initNationality = draftStudent.personal?.nationality || '';
  const isCustomNationality = initNationality !== '' && initNationality !== 'Indian';

  const initDistrict = draftStudent.personal?.district || '';
  const standardDistricts = DISTRICTS.filter((d) => d !== 'Other District');
  const isCustomDistrict = initDistrict !== '' && !standardDistricts.includes(initDistrict);

  const [showCustomCaste, setShowCustomCaste] = useState<boolean>(isCustomCaste);
  const [showCustomNationality, setShowCustomNationality] = useState<boolean>(isCustomNationality);
  const [showCustomDistrict, setShowCustomDistrict] = useState<boolean>(isCustomDistrict);

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<StudentDetailsFormData>({
    resolver: zodResolver(studentDetailsSchema),
    defaultValues: {
      applicationNumber: draftStudent.personal?.applicationNumber || '',
      registerNumber: draftStudent.personal?.registerNumber || '',
      studentName: draftStudent.personal?.studentName || '',
      dateOfBirth: draftStudent.personal?.dateOfBirth || '',
      age: draftStudent.personal?.age ?? undefined,
      aadhaarNumber: draftStudent.personal?.aadhaarNumber || '',
      gender: draftStudent.personal?.gender || undefined,
      district: draftStudent.personal?.district || '',
      nationality: draftStudent.personal?.nationality || 'Indian',
      caste: draftStudent.personal?.caste || undefined,
      mobileNumber: draftStudent.personal?.mobileNumber || '',
      emailId: draftStudent.personal?.emailId || '',
    },
  });

  const watchedValues = watch();
  const watchDOB = watch('dateOfBirth');

  React.useEffect(() => {
    updateDraftSection('personal', watchedValues as any);
  }, [JSON.stringify(watchedValues)]);

  React.useEffect(() => {
    if (watchDOB) {
      const computedAge = calculateAgeFromDOB(watchDOB);
      setValue('age', computedAge);
    }
  }, [watchDOB, setValue]);

  const onSubmit = async (data: StudentDetailsFormData) => {
    updateDraftSection('personal', data);
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

      <AppCard>
        <Typography sx={{ fontWeight: 700, color: isDark ? '#FFFFFF' : '#0D47A1', marginBottom: '4px', fontSize: '22px' }}>
          Student Personal Details
        </Typography>
        <Typography sx={{ color: isDark ? '#CBD5E1' : '#667085', marginBottom: '24px', fontSize: '14px' }}>
          Enter the student's personal information to begin the admission process.
        </Typography>

        <Grid container columnSpacing={3} rowSpacing={2.5}>
          <Grid item xs={12} sm={6}>
            <Controller
              name="applicationNumber"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Application Number *"
                  fullWidth
                  sx={fieldSx}
                  disabled={isViewReadOnly}
                  inputProps={getNoAutofillInputProps('app_no')}
                  error={!!errors.applicationNumber}
                  helperText={errors.applicationNumber?.message}
                />
              )}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <Controller
              name="registerNumber"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Register Number"
                  fullWidth
                  sx={fieldSx}
                  disabled={isViewReadOnly}
                  inputProps={getNoAutofillInputProps('reg_no')}
                  error={!!errors.registerNumber}
                  helperText={errors.registerNumber?.message}
                />
              )}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <Controller
              name="studentName"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Student Full Name *"
                  fullWidth
                  sx={fieldSx}
                  disabled={isViewReadOnly}
                  inputProps={getNoAutofillInputProps('stud_name')}
                  error={!!errors.studentName}
                  helperText={errors.studentName?.message}
                />
              )}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <Controller
              name="dateOfBirth"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  type="date"
                  label="Date of Birth *"
                  fullWidth
                  sx={fieldSx}
                  InputLabelProps={{ shrink: true }}
                  disabled={isViewReadOnly}
                  error={!!errors.dateOfBirth}
                  helperText={errors.dateOfBirth?.message}
                />
              )}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <Controller
              name="age"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  value={field.value || ''}
                  label="Age (Auto Calculated)"
                  fullWidth
                  sx={fieldSx}
                  InputProps={{ readOnly: true }}
                  disabled
                  error={!!errors.age}
                  helperText={errors.age?.message}
                />
              )}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <Controller
              name="aadhaarNumber"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Aadhaar Number (12 Digits) *"
                  fullWidth
                  sx={fieldSx}
                  disabled={isViewReadOnly}
                  inputProps={{ ...getNoAutofillInputProps('aadhaar'), maxLength: 12 }}
                  error={!!errors.aadhaarNumber}
                  helperText={errors.aadhaarNumber?.message}
                />
              )}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <Controller
              name="gender"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  value={field.value || ''}
                  select
                  label="Gender *"
                  fullWidth
                  sx={fieldSx}
                  disabled={isViewReadOnly}
                  error={!!errors.gender}
                  helperText={errors.gender?.message}
                >
                  <MenuItem value="Male">Male</MenuItem>
                  <MenuItem value="Female">Female</MenuItem>
                  <MenuItem value="Others">Others</MenuItem>
                </TextField>
              )}
            />
          </Grid>

          {/* Mobile Number */}
          <Grid item xs={12} sm={6}>
            <Controller
              name="mobileNumber"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Mobile Number (10 Digits)"
                  fullWidth
                  sx={fieldSx}
                  disabled={isViewReadOnly}
                  inputProps={{ ...getNoAutofillInputProps('mobile'), maxLength: 10 }}
                  error={!!errors.mobileNumber}
                  helperText={errors.mobileNumber?.message}
                />
              )}
            />
          </Grid>

          {/* Email ID */}
          <Grid item xs={12} sm={6}>
            <Controller
              name="emailId"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Email ID"
                  value={field.value || ''}
                  onChange={(e) => field.onChange(e.target.value.trim())}
                  onBlur={(e) => field.onChange(e.target.value.trim())}
                  autoComplete="off"
                  inputProps={getNoAutofillInputProps('email_id')}
                  type="email"
                  fullWidth
                  sx={{ ...fieldSx, '& input': { textTransform: 'none' } }}
                  disabled={isViewReadOnly}
                  error={!!errors.emailId}
                  helperText={errors.emailId?.message}
                />
              )}
            />
          </Grid>

          {/* Nationality Dropdown/Input Swap */}
          <Grid item xs={12} sm={6}>
            <Controller
              name="nationality"
              control={control}
              render={({ field }) =>
                showCustomNationality ? (
                  <TextField
                    {...field}
                    label="Nationality (Specify) *"
                    fullWidth
                    sx={fieldSx}
                    disabled={isViewReadOnly}
                    error={!!errors.nationality}
                    helperText={errors.nationality?.message}
                    InputProps={{
                      endAdornment: !isViewReadOnly && (
                        <Button
                          onClick={() => {
                            setShowCustomNationality(false);
                            setValue('nationality', 'Indian');
                          }}
                          sx={{ fontSize: '11px', minWidth: 'auto', p: '2px 8px', color: '#0D47A1', fontWeight: 700 }}
                        >
                          Reset
                        </Button>
                      ),
                    }}
                  />
                ) : (
                  <TextField
                    {...field}
                    select
                    label="Nationality *"
                    fullWidth
                    sx={fieldSx}
                    disabled={isViewReadOnly}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === 'Other') {
                        setShowCustomNationality(true);
                        field.onChange('');
                      } else {
                        field.onChange(val);
                      }
                    }}
                    error={!!errors.nationality}
                    helperText={errors.nationality?.message}
                  >
                    <MenuItem value="Indian">Indian</MenuItem>
                    <MenuItem value="Other">Other</MenuItem>
                  </TextField>
                )
              }
            />
          </Grid>

          {/* Caste Dropdown/Input Swap */}
          <Grid item xs={12} sm={6}>
            <Controller
              name="caste"
              control={control}
              render={({ field }) =>
                showCustomCaste ? (
                  <TextField
                    {...field}
                    label="Caste / Category (Specify) *"
                    fullWidth
                    sx={fieldSx}
                    disabled={isViewReadOnly}
                    error={!!errors.caste}
                    helperText={errors.caste?.message}
                    InputProps={{
                      endAdornment: !isViewReadOnly && (
                        <Button
                          onClick={() => {
                            setShowCustomCaste(false);
                            setValue('caste', undefined as any);
                          }}
                          sx={{ fontSize: '11px', minWidth: 'auto', p: '2px 8px', color: '#0D47A1', fontWeight: 700 }}
                        >
                          Reset
                        </Button>
                      ),
                    }}
                  />
                ) : (
                  <TextField
                    {...field}
                    value={field.value || ''}
                    select
                    label="Caste / Category *"
                    fullWidth
                    sx={fieldSx}
                    disabled={isViewReadOnly}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === 'Other') {
                        setShowCustomCaste(true);
                        field.onChange('');
                      } else {
                        field.onChange(val);
                      }
                    }}
                    error={!!errors.caste}
                    helperText={errors.caste?.message}
                  >
                    <MenuItem value="SC">SC</MenuItem>
                    <MenuItem value="ST">ST</MenuItem>
                    <MenuItem value="OBC">OBC</MenuItem>
                    <MenuItem value="Other">Other</MenuItem>
                  </TextField>
                )
              }
            />
          </Grid>

          {/* District Dropdown/Input Swap */}
          <Grid item xs={12} sm={6}>
            <Controller
              name="district"
              control={control}
              render={({ field }) =>
                showCustomDistrict ? (
                  <TextField
                    {...field}
                    label="District (Specify) *"
                    fullWidth
                    sx={fieldSx}
                    disabled={isViewReadOnly}
                    error={!!errors.district}
                    helperText={errors.district?.message}
                    InputProps={{
                      endAdornment: !isViewReadOnly && (
                        <Button
                          onClick={() => {
                            setShowCustomDistrict(false);
                            setValue('district', '');
                          }}
                          sx={{ fontSize: '11px', minWidth: 'auto', p: '2px 8px', color: '#0D47A1', fontWeight: 700 }}
                        >
                          Reset
                        </Button>
                      ),
                    }}
                  />
                ) : (
                  <TextField
                    {...field}
                    select
                    label="District *"
                    fullWidth
                    sx={fieldSx}
                    disabled={isViewReadOnly}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === 'Other District') {
                        setShowCustomDistrict(true);
                        field.onChange('');
                      } else {
                        field.onChange(val);
                      }
                    }}
                    error={!!errors.district}
                    helperText={errors.district?.message}
                  >
                    <MenuItem value="">No Selection</MenuItem>
                    {DISTRICTS.map((d) => (
                      <MenuItem key={d} value={d}>
                        {d}
                      </MenuItem>
                    ))}
                  </TextField>
                )
              }
            />
          </Grid>
        </Grid>
      </AppCard>
    </Box>
  );
};
