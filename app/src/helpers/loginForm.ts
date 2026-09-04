import { z } from 'zod';
import { normalizeServerBaseUrl } from '@/src/helpers/authenticatedServerOrigin';

export const loginFormSchema = z.object({
  server: z
    .string()
    .url()
    .refine((value) => normalizeServerBaseUrl(value) !== null, {
      message: 'Server URL must use HTTP or HTTPS',
    }),
  username: z.string().trim().min(1, 'Username is required'),
  password: z.string().min(8),
});

export type LoginFormValues = z.infer<typeof loginFormSchema>;

export const normalizeServerUrl = (value: string): string => {
  return normalizeServerBaseUrl(value) ?? value.trim();
};
