import { z } from 'zod';

export const academicDetailsSchema = z.object({
  admissionCategory: z.enum(['Centac', 'Management'], {
    errorMap: () => ({ message: 'Admission Category is required' }),
  }),
  program: z.enum([
    'First Year B.Tech',
    'Second Year B.Tech (Lateral Entry)',
    'PG',
  ], { errorMap: () => ({ message: 'Program is required' }) }),
  department: z.string().min(1, 'Department is required'),
  batch: z.string().min(1, 'Batch is required'),
  dateOfAdmission: z.string().min(1, 'Date of Admission is required'),
});

export type AcademicDetailsFormData = z.infer<typeof academicDetailsSchema>;
