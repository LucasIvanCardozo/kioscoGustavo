'use client';

import { faTimes } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Image from 'next/image';
import { useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@/components/UI/Button';
import styles from './ImageViewer.module.css';

type Props = {
  image: { src: string; alt: string } | null;
  onClose: () => void;
};

export function ImageViewer({ image, onClose }: Props) {
  const titleId = useId();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!image) return;
    previouslyFocusedRef.current = document.activeElement as HTMLElement | null;
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) {
      dialog.show();
    }
    return () => {
      if (dialog?.open) dialog.close();
      previouslyFocusedRef.current?.focus();
    };
  }, [image]);

  useEffect(() => {
    if (!image) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [image, onClose]);

  useEffect(() => {
    if (!image) return;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, [image]);

  if (!image || typeof document === 'undefined') return null;

  return createPortal(
    <div className={styles.wrapper}>
      <button
        type="button"
        className={styles.backdrop}
        onClick={onClose}
        aria-label="Cerrar imagen"
        tabIndex={-1}
      />
      <dialog ref={dialogRef} className={styles.dialog} aria-modal="true" aria-labelledby={titleId}>
        <span id={titleId} className="sr-only">
          {image.alt}
        </span>
        <div className={styles.imageContainer}>
          <Image
            src={image.src}
            alt={image.alt}
            fill
            sizes="100vw"
            unoptimized
            className={styles.image}
          />
        </div>
      </dialog>
      <Button variant="transparent" onClick={onClose} className={styles.close} aria-label="Cerrar">
        <FontAwesomeIcon icon={faTimes} />
      </Button>
    </div>,
    document.body,
  );
}
