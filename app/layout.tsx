import type { Metadata } from 'next';
import { Caprasimo, Inter } from 'next/font/google';
import { Suspense } from 'react';
import { AuthRejectionToast } from '@/components/AuthRejectionToast/AuthRejectionToast';
import { ToastProvider } from '@/components/Providers/ToastProvider';
import './globals.css';
import './themes/tokens.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const caprasimo = Caprasimo({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-caprasimo',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Kiosco Gustavo',
  description: 'Catálogo y panel admin del kiosco.',
  openGraph: {
    locale: 'es_AR',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${inter.variable} ${caprasimo.variable}`}>
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
