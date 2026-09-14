import { z } from 'zod';

export const parentDetailsSchema = z.object({
  fatherName: z.string().min(1, 'Father Name is required'),
  fatherMobile: z
    .string()
    .regex(/^\d{10}$/, 'Mobile Number must be exactly 10 digits'),
  fatherOccupation: z.string().min(1, 'Father Occupation is required'),
  annualIncome: z.number().min(0, 'Annual Income cannot be negative'),
});

export type ParentDetailsFormData = z.infer<typeof parentDetailsSchema>;
