'use server';

import { signOut as signOutAuth } from '@/lib/server/auth/auth';

export async function signOutAction() {
  await signOutAuth({ redirectTo: '/' });
}