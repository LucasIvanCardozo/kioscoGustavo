'use client';

import type { ReactNode } from 'react';
import { Toaster } from 'react-hot-toast';

export function ToastProvider({ children }: { children: ReactNode }) {
  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            maxWidth: '100%',
          },
        }}
      />
      {children}
    </>
  );
}