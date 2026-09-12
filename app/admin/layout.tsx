import { redirect } from 'next/navigation';
import type { ReactNode } from 'react';
import { signOutAction } from '@/lib/server/actions/auth/signOut.action';
import { auth } from '@/lib/server/auth/auth';
import { env } from '@/lib/env';
import { AdminNav } from './_components/AdminNav';
import styles from './layout.module.css';

export const instant = false;

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const session = await auth();

  if (!session?.user?.email) {
    redirect('/login?from=/admin');
  }

  const email = session.user.email.toLowerCase();
  if (!env.ADMIN_EMAILS.includes(email)) {
    redirect('/?rejected=1');
  }

  const displayEmail = session.user.email;

  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <div className={styles.brand}>
          <span className={styles.brandTitle}>Kiosco Gustavo</span>
          <span className={styles.brandTag}>Panel admin</span>
        </div>
        <div className={styles.userBlock}>
          <span className={styles.userEmail}>{displayEmail}</span>
          <form action={signOutAction}>
            <button type="submit" className={styles.signOutButton}>
              Cerrar sesión
            </button>
          </form>
        </div>
      </header>
      <AdminNav />
      <main className={styles.main}>{children}</main>
    </div>
  );
}
