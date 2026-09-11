import type { NextAuthConfig } from 'next-auth';
import Google from 'next-auth/providers/google';
import { authCallbacks } from '@/lib/server/auth/authCallbacks';
import { env } from '@/lib/env';

export const authConfig = {
  trustHost: true,
  session: { strategy: 'jwt' },
  pages: {
    signIn: '/login',
  },
  providers: [
    Google({
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
      allowDangerousEmailAccountLinking: true,
    }),
  ],
  callbacks: authCallbacks,
} satisfies NextAuthConfig;
