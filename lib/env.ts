import { z } from 'zod';

const adminEmailsSchema = z
  .string()
  .min(1, 'ADMIN_EMAILS no puede estar vacío')
  .transform((csv) =>
    csv
      .split(',')
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean),
  );

const envSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.string().min(1),
  NEXT_PUBLIC_APP_NAME: z.string().min(1),
  NEXT_PUBLIC_WHATSAPP_NUMBER: z.string().min(1),

  AUTH_SECRET: z.string().min(1),
  AUTH_URL: z.string().optional(),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  ADMIN_EMAILS: adminEmailsSchema,

  DATABASE_URL: z.string().min(1),

  UPLOADTHING_TOKEN: z.string().optional(),
  UPLOADTHING_APP_ID: z.string().optional(),

  CRON_SECRET: z.string().optional(),
});

type EnvShape = z.infer<typeof envSchema>;

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const issues = JSON.stringify(parsed.error.flatten().fieldErrors, null, 2);
  if (process.env.NODE_ENV === 'production') {
    throw new Error(`Invalid environment variables:\n${issues}`);
  }
  console.warn(`[env] Variables incompletas o inválidas (modo dev). Ver .env.example.\n${issues}`);
}

const fallback = {
  NEXT_PUBLIC_APP_URL: '',
  NEXT_PUBLIC_APP_NAME: '',
  NEXT_PUBLIC_WHATSAPP_NUMBER: '',
  AUTH_SECRET: '',
  AUTH_URL: undefined,
  GOOGLE_CLIENT_ID: undefined,
  GOOGLE_CLIENT_SECRET: undefined,
  ADMIN_EMAILS: [],
  DATABASE_URL: '',
  UPLOADTHING_TOKEN: undefined,
  UPLOADTHING_APP_ID: undefined,
  CRON_SECRET: undefined,
} satisfies EnvShape;

export const env: EnvShape = parsed.success ? parsed.data : fallback;
export type Env = EnvShape;
