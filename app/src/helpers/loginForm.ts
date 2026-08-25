import { z } from 'zod';

export const loginFormSchema = z.object({
  server: z.string().url(),
  username: z.string().trim().min(1, 'Username is required'),
  password: z.string().min(8),
});

export type LoginFormValues = z.infer<typeof loginFormSchema>;

export const normalizeServerUrl = (value: string): string => {
  const trimmed = value.trim();
  const withProtocol = /^https?:\/\//i.test(trimmed)
    ? trimmed
    : `https://${trimmed}`;

  return withProtocol.endsWith('/') ? withProtocol : `${withProtocol}/`;
};
