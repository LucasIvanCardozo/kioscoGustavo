'use client';
import {
  type Control,
  Controller,
  type FieldError,
  type FieldValues,
  type Path,
} from 'react-hook-form';
import styles from './textarea-form.module.css';

interface Props<T extends FieldValues> {
  name: Path<T>;
  control: Control<T>;
  label: string;
  placeholder?: string;
  error?: FieldError;
  'data-testid'?: string;
}

export const TextareaForm = <T extends FieldValues>({
  name,
  control,
  label,
  placeholder,
  error,
  'data-testid': dataTestId,
}: Props<T>) => {
  return (
    <div className={styles.container}>
      <label htmlFor={name}>{label}</label>
      <Controller
        name={name}
        control={control}
        render={({ field }) => (
          <textarea
            {...field}
            id={name}
            className={`${styles.textarea} ${error ? styles.isInvalid : ''}`}
            placeholder={placeholder}
            value={field.value ?? ''}
            data-testid={dataTestId}
          />
        )}
      />
      {error && <p className={styles.error}>{error.message}</p>}
    </div>
  );
};
