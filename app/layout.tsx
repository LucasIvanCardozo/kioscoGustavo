import type { Metadata } from 'next';
import { Suspense } from 'react';
import { AuthRejectionToast } from '@/components/AuthRejectionToast/AuthRejectionToast';
import { ToastProvider } from '@/components/Providers/ToastProvider';
import './globals.css';
import './themes/tokens.css';

export const metadata: Metadata = {
  title: 'Kiosco Lucas',
  description: 'Catálogo y panel admin del kiosco.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" data-theme="default">
      <body>
        <ToastProvider>
          <Suspense>
            <AuthRejectionToast />
          </Suspense>
          {children}
        </ToastProvider>
      </body>
    </html>
  );
}