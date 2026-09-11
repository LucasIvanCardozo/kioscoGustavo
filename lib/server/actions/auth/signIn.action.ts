'use server';

import { signIn as signInAuth } from '@/lib/server/auth/auth';

export async function signInAction(formData: FormData) {
  const provider = (formData.get('provider') as string) ?? 'google';
  const from = (formData.get('from') as string) || '/admin';
  await signInAuth(provider, { redirectTo: from });
}