'use client';

import { faCircleNotch, faX } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Image from 'next/image';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '@/components/UI/Button';
import { compressImageForUpload } from '@/lib/shared/image-compressor';
import { MAX_UPLOAD_SIZE } from '@/lib/shared/constants/upload';
import type { ImageValue } from '@/lib/shared/types/image';
import styles from './image-form.module.css';

const formatBytes = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(0)} MB`;
};

interface Props {
  value: ImageValue | undefined;
  onChange: (value: ImageValue | undefined) => void;
  label?: string;
  error?: string;
}

export const ImageForm = ({ value, onChange, label, error }: Props) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);

  const localFile =
    value && typeof value === 'object' && 'file' in value && value.file instanceof File
      ? value.file
      : null;

  const localPreview = useMemo(
    () => (localFile ? URL.createObjectURL(localFile) : null),
    [localFile],
  );

  useEffect(() => {
    return () => {
      if (localPreview) URL.revokeObjectURL(localPreview);
    };
  }, [localPreview]);

  const remoteUrl = value && typeof value === 'object' && 'url' in value ? value.url : null;

  const previewUrl = remoteUrl ?? localPreview;
  const hasImage = previewUrl !== null;

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_UPLOAD_SIZE) {
      setLocalError(`La imagen no puede pesar más de ${formatBytes(MAX_UPLOAD_SIZE)}.`);
      onChange('');
      event.target.value = '';
      return;
    }
    setLocalError(null);
    setIsCompressing(true);
    try {
      const compressed = await compressImageForUpload(file);
      onChange({ file: compressed });
    } catch {
      setLocalError('No se pudo procesar la imagen. Probá con otra.');
      onChange('');
    } finally {
      setIsCompressing(false);
      event.target.value = '';
    }
  };

  const handleRemove = () => {
    setLocalError(null);
    onChange('');
  };

  const handleChangeImage = () => {
    fileInputRef.current?.click();
  };

  const combinedError = error ?? localError;
  const isInvalid = Boolean(combinedError);

  return (
    <fieldset className={styles.container}>
      {label && <legend className={styles.label}>{label}</legend>}
      <div className={`${styles.wrapper} ${isInvalid ? styles.isInvalid : ''}`}>
        {isCompressing ? (
          <div className={styles.compressing}>
            <FontAwesomeIcon icon={faCircleNotch} spin className={styles.spinner} />
            <span>Procesando imagen…</span>
          </div>
        ) : hasImage ? (
          <div className={styles.preview}>
            <Image
              src={previewUrl ?? ''}
              alt="Preview"
              fill
              className={styles.image}
              style={{ objectFit: 'cover' }}
              sizes="200px"
            />
            <div className={styles.actions}>
              <button
                type="button"
                onClick={handleRemove}
                className={styles.removeButton}
                title="Quitar imagen"
                aria-label="Quitar imagen"
              >
                <FontAwesomeIcon icon={faX} />
              </button>
            </div>
          </div>
        ) : (
          <div className={styles.uploadArea}>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={handleFileSelect}
              className={styles.fileInput}
              aria-label="Subir imagen"
            />
            <Button type="button" variant="secondary" onClick={handleChangeImage}>
              Subir imagen
            </Button>
            <p className={styles.hint}>JPG/PNG/WEBP, máximo {formatBytes(MAX_UPLOAD_SIZE)}.</p>
            {localError && <p className={styles.localError}>{localError}</p>}
          </div>
        )}
      </div>
      {hasImage && !isCompressing && (
        <div className={styles.changeRow}>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={handleFileSelect}
            className={styles.fileInput}
            aria-label="Cambiar imagen"
          />
          <Button type="button" variant="ghost" size="sm" onClick={handleChangeImage}>
            Cambiar imagen
          </Button>
        </div>
      )}
      {combinedError && <p className={styles.error}>{combinedError}</p>}
    </fieldset>
  );
};
