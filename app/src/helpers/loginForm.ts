import { z } from 'zod';
import { normalizeServerBaseUrl } from '@/src/helpers/authenticatedServerOrigin';

export const loginFormSchema = z.object({
  server: z
    .string()
    .trim()
    .min(1, 'Enter your PICR server address')
    .refine((value) => normalizeServerBaseUrl(value) !== null, {
      message: 'Enter a valid HTTP or HTTPS server address',
    }),
});

export type LoginFormValues = z.infer<typeof loginFormSchema>;

export const normalizeServerUrl = (value: string): string => {
  return normalizeServerBaseUrl(value) ?? value.trim();
};
