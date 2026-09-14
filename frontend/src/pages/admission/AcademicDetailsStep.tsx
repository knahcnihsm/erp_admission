import React, { useEffect, useRef } from 'react';
import { Grid, TextField, MenuItem, Typography, Box } from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { academicDetailsSchema, AcademicDetailsFormData } from '../../schemas/academic.schema';
import { useAdmission } from '../../context/AdmissionContext';
import { useThemeContext } from '../../context/ThemeContext';
import { AppCard } from '../../components/ui/AppCard';
import { handleFormEnterKeyDown } from '../../utils/enterKeyNavigation';
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

export const AcademicDetailsStep: React.FC<{ onNext: () => void }> = ({ onNext }) => {
  const { mode } = useThemeContext();
  const isDark = mode === 'dark';
  const { draftStudent, updateDraftSection, isViewReadOnly, masterData } = useAdmission();

  const programs = masterData.programs.map((p) => p.name);
  const departmentsForProgram = (program?: string) =>
    program ? (masterData.departmentsByProgram[program] || []).map((d) => d.name) : [];

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<AcademicDetailsFormData>({
    resolver: zodResolver(academicDetailsSchema),
    defaultValues: {
      admissionCategory: draftStudent.academic?.admissionCategory || undefined,
      program: draftStudent.academic?.program || undefined,
      department: draftStudent.academic?.department || '',
      batch: draftStudent.academic?.batch || '',
      dateOfAdmission: draftStudent.academic?.dateOfAdmission || '',
    },
  });

  const watchProgram = watch('program');
  const prevProgramRef = useRef(watchProgram);

  useEffect(() => {
    const prevProgram = prevProgramRef.current;
    prevProgramRef.current = watchProgram;
    if (!watchProgram || prevProgram === watchProgram) return;

    const depts = departmentsForProgram(watchProgram);
    if (depts.length > 0 && !depts.includes(watch('department'))) {
      setValue('department', depts[0]);
    }

    if (watchProgram === 'First Year B.Tech') {
      setValue('batch', '2026 - 2030');
    } else if (watchProgram === 'Second Year B.Tech (Lateral Entry)') {
      setValue('batch', '2026 - 2029');
    } else if (watchProgram === 'PG') {
      setValue('batch', '2026 - 2028');
    }
  }, [watchProgram, setValue, watch]);

  const watchedValues = watch();
  useEffect(() => {
    updateDraftSection('academic', watchedValues as any);
  }, [JSON.stringify(watchedValues)]);

  const availableDepartments = departmentsForProgram(watchProgram);

  const onSubmit = async (data: AcademicDetailsFormData) => {
    updateDraftSection('academic', data);
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
          Academic Admission Details
        </Typography>
        <Typography sx={{ color: isDark ? '#CBD5E1' : '#667085', marginBottom: '24px', fontSize: '14px' }}>
          Select the student's program, department, admission quota, and batch.
        </Typography>

        <Grid container columnSpacing={3} rowSpacing={2.5}>
          <Grid item xs={12} sm={6}>
            <Controller
              name="admissionCategory"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  value={field.value || ''}
                  select
                  label="Admission Category *"
                  fullWidth
                  sx={fieldSx}
                  disabled={isViewReadOnly}
                  error={!!errors.admissionCategory}
                  helperText={errors.admissionCategory?.message}
                >
                  <MenuItem value="CENTAC">CENTAC (Government Quota)</MenuItem>
                  <MenuItem value="Management">Management Quota</MenuItem>
                </TextField>
              )}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <Controller
              name="program"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  value={field.value || ''}
                  select
                  label="Program *"
                  fullWidth
                  sx={fieldSx}
                  disabled={isViewReadOnly}
                  error={!!errors.program}
                  helperText={errors.program?.message}
                >
                  {programs.map((p) => (
                    <MenuItem key={p} value={p}>
                      {p}
                    </MenuItem>
                  ))}
                </TextField>
              )}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <Controller
              name="department"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  value={field.value || ''}
                  select
                  label="Department *"
                  fullWidth
                  sx={fieldSx}
                  disabled={isViewReadOnly || !watchProgram}
                  error={!!errors.department}
                  helperText={errors.department?.message}
                >
                  {availableDepartments.map((dept) => (
                    <MenuItem key={dept} value={dept}>
                      {dept}
                    </MenuItem>
                  ))}
                </TextField>
              )}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <Controller
              name="batch"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Batch *"
                  fullWidth
                  sx={fieldSx}
                  disabled
                  error={!!errors.batch}
                  helperText={errors.batch?.message}
                />
              )}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <Controller
              name="dateOfAdmission"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  type="date"
                  label="Date of Admission *"
                  fullWidth
                  sx={fieldSx}
                  InputLabelProps={{ shrink: true }}
                  disabled={isViewReadOnly}
                  inputProps={{ max: new Date().toISOString().split('T')[0] }}
                  error={!!errors.dateOfAdmission}
                  helperText={errors.dateOfAdmission?.message}
                />
              )}
            />
          </Grid>
        </Grid>
      </AppCard>
    </Box>
  );
};
