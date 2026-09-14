import { z } from 'zod';

const singleAddressSchema = z.object({
  addressLine: z.string().min(1, 'Address is required'),
  pinCode: z.string().regex(/^\d{6}$/, 'PIN Code must be 6 digits'),
  phoneNumber: z.string().optional(),
  mobileNumber: z.string().regex(/^\d{10}$/, 'Mobile Number must be 10 digits'),
  email: z.string().email('Enter a valid email address'),
});

export const communicationSchema = z.object({
  permanentAddress: singleAddressSchema,
  communicationAddress: singleAddressSchema,
  sameAsPermanent: z.boolean(),
});

export type CommunicationFormData = z.infer<typeof communicationSchema>;
