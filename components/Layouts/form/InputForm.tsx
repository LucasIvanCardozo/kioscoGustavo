'use client';
import {
  type Control,
  Controller,
  type FieldError,
  type FieldValues,
  type Path,
} from 'react-hook-form';
import styles from './input-form.module.css';

interface Props<T extends FieldValues> {
  name: Path<T>;
  control: Control<T>;
  label: string;
  type?: string;
  min?: number;
  max?: number;
  error?: FieldError;
  autoFocus?: boolean;
  inputMode?: 'none' | 'text' | 'numeric' | 'tel' | 'search' | 'email' | 'url';
  'data-testid'?: string;
}

export const InputForm = <T extends FieldValues>({
  name,
  control,
  label,
  type,
  min,
  max,
  error,
  autoFocus,
  inputMode,
  'data-testid': dataTestId,
}: Props<T>) => {
  return (
    <div className={styles.container}>
      <label htmlFor={name}>{label}</label>
      <Controller
        name={name}
        control={control}
        render={({ field }) => (
          <input
            {...field}
            id={name}
            type={type}
            min={min}
            max={max}
            // biome-ignore lint/a11y/noAutofocus: InputForm accepts autoFocus as a prop; callers opt in for forms where the input is the primary focus target (e.g. login, single-field forms)
            autoFocus={autoFocus}
            value={field.value == null ? '' : field.value}
            inputMode={inputMode}
            className={`${error && styles.isInvalid}`}
            data-testid={dataTestId}
          />
        )}
      />
      {error && <p className={styles.error}>{error.message}</p>}
    </div>
  );
};
