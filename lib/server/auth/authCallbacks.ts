import type { NextAuthConfig } from 'next-auth';
import { env } from '@/lib/env';

export const authCallbacks: NextAuthConfig['callbacks'] = {
  jwt: async ({ token, user }) => {
    if (user) token.sub = user.id;
    return token;
  },
  session: async ({ session, token }) => {
    if (!token.sub) return session;

    session.user = {
      id: token.sub,
      name: session.user?.name,
      email: session.user?.email,
      emailVerified: session.user?.emailVerified,
      image: session.user?.image,
    };

    return session;
  },
  authorized: async ({ auth, request }) => {
    const { pathname } = request.nextUrl;

    if (pathname.startsWith('/admin')) {
      if (!auth?.user?.email) return false;
      const email = auth.user.email.toLowerCase();
      return env.ADMIN_EMAILS.includes(email);
    }

    return true;
  },
  redirect: async ({ url, baseUrl }) => {
    if (url.startsWith('/')) return `${baseUrl}${url}`;
    try {
      const target = new URL(url);
      if (target.origin === baseUrl) return url;
    } catch {
      return baseUrl;
    }
    return baseUrl;
  },
};