import '@/lib/env';
import { PrismaAdapter } from '@auth/prisma-adapter';
import NextAuth from 'next-auth';
import { authConfig } from '@/lib/server/auth/auth.config';
import db from '@/lib/server/db/db';

export const { auth, handlers, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(db),
});

export type SessionUser = {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
};

declare module 'next-auth' {
  interface Session {
    user: SessionUser;
  }
}
