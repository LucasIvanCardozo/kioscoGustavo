import { redirect } from 'next/navigation';
import { GoogleIcon } from '@/components/UI/Icons/GoogleIcon';
import { signInAction } from '@/lib/server/actions/auth/signIn.action';
import { auth } from '@/lib/server/auth/auth';
import { env } from '@/lib/env';
import styles from './page.module.css';

export const instant = false;

const ERROR_MESSAGES: Record<string, string> = {
  Configuration: 'Hay un problema de configuración. Contactá al administrador.',
  AccessDenied: 'No tenés permisos para acceder.',
  Verification: 'El link de verificación expiró o ya fue usado.',
  OAuthSignin: 'No se pudo iniciar el proceso con Google.',
  OAuthCallback: 'No se pudo completar el inicio de sesión con Google.',
  OAuthCreateAccount: 'No se pudo crear la cuenta con Google.',
  EmailCreateAccount: 'No se pudo crear la cuenta con este email.',
  Callback: 'Error en el callback de autenticación.',
  OAuthAccountNotLinked:
    'Esta cuenta de Google ya está vinculada a otro método de inicio de sesión.',
  EmailSignin: 'No se pudo enviar el email de inicio de sesión.',
  SessionRequired: 'Tenés que iniciar sesión para acceder a esa página.',
};

function isSafeFrom(value: string | undefined): value is string {
  if (!value) return false;
  if (!value.startsWith('/')) return false;
  if (value.startsWith('//')) return false;
  if (value.startsWith('/\\')) return false;
  return true;
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; from?: string }>;
}) {
  const { error, from } = await searchParams;
  const safeFrom = isSafeFrom(from) ? from : '/admin';

  const session = await auth();
  if (session?.user?.email) {
    const email = session.user.email.toLowerCase();
    if (env.ADMIN_EMAILS.includes(email)) {
      redirect(safeFrom);
    }
  }

  const errorMessage = error ? (ERROR_MESSAGES[error] ?? 'No se pudo iniciar sesión.') : null;

  return (
    <main className={styles.container}>
      <div className={styles.card}>
        <div className={styles.header}>
          <p className={styles.brand}>Panel admin</p>
          <h1 className={styles.title}>Iniciar sesión</h1>
          <p className={styles.subtitle}>Accedé con tu cuenta de Google para continuar.</p>
        </div>

        {errorMessage ? (
          <div className={styles.error} role="alert">
            {errorMessage}
          </div>
        ) : null}

        <form action={signInAction} className={styles.form}>
          <input type="hidden" name="provider" value="google" />
          <input type="hidden" name="from" value={safeFrom} />
          <button type="submit" className={styles.googleButton}>
            <GoogleIcon className={styles.googleIcon} />
            <span className={styles.buttonText}>Continuar con Google</span>
          </button>
        </form>

        <p className={styles.footer}>
          Solo las cuentas autorizadas pueden acceder al panel de administración.
        </p>

        <a href="/" className={styles.homeLink}>
          ← Volver al inicio
        </a>
      </div>
    </main>
  );
}
