'use client';

import { useEffect, useRef } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';

export function AuthRejectionToast() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const firedRef = useRef(false);

  useEffect(() => {
    if (firedRef.current) return;
    if (searchParams.get('rejected') !== '1') return;

    firedRef.current = true;
    toast.error('No tenés permisos para acceder al panel admin');

    const params = new URLSearchParams(searchParams.toString());
    params.delete('rejected');
    const next = params.toString();
    router.replace(next ? `${pathname}?${next}` : pathname);
  }, [searchParams, pathname, router]);

  return null;
}