import { z } from 'zod';
import { SERVICES, ADDONS } from '../data/pricing.js';
import { hasControlChars, isValidAustralianPhone } from '../lib/utils.js';

const serviceKeys = Object.keys(SERVICES) as [string, ...string[]];
const addonKeys = Object.keys(ADDONS) as [string, ...string[]];

const noControlChars = (value: string) => !hasControlChars(value);

const optionalTrimmedString = (max: number, label: string) =>
  z
    .string()
    .trim()
    .max(max, `${label} must be ${max} characters or fewer.`)
    .refine(noControlChars, `${label} contains invalid characters.`)
    .transform((value) => (value === '' ? undefined : value))
    .optional();

export const quoteRequestSchema = z.object({
  service: z.enum(serviceKeys, { message: 'Invalid service selection.' }),
  name: z
    .string({ message: 'Name is required.' })
    .trim()
    .min(1, 'Name is required.')
    .max(100, 'Name must be 100 characters or fewer.')
    .refine(noControlChars, 'Name contains invalid characters.'),
  phone: z
    .string({ message: 'Phone is required.' })
    .trim()
    .min(1, 'Phone is required.')
    .max(20, 'Phone must be 20 characters or fewer.')
    .refine(isValidAustralianPhone, 'Invalid Australian phone number.'),
  email: z
    .string({ message: 'Email is required.' })
    .trim()
    .min(1, 'Email is required.')
    .max(254, 'Email must be 254 characters or fewer.')
    .pipe(z.email('Invalid email address.')),
  suburb: z
    .string({ message: 'Suburb is required.' })
    .trim()
    .min(1, 'Suburb is required.')
    .max(100, 'Suburb must be 100 characters or fewer.')
    .refine(noControlChars, 'Suburb contains invalid characters.'),
  addons: z
    .union([z.string(), z.array(z.string())])
    .optional()
    .transform((value) => {
      if (value == null) return undefined;
      return Array.isArray(value) ? value : [value];
    })
    .pipe(z.array(z.enum(addonKeys, { message: 'Invalid add-on selection.' })).optional()),
  vehicle_model: optionalTrimmedString(100, 'Vehicle make & model'),
  notes: optionalTrimmedString(1000, 'Notes'),
  company: optionalTrimmedString(100, 'Company'),
  terms_accepted: z.literal(true, {
    message: 'You must agree to the Terms & Conditions.',
  }),
});

export type QuoteRequestInput = z.infer<typeof quoteRequestSchema>;
