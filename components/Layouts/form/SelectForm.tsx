'use client';
import {
  type Control,
  Controller,
  type FieldError,
  type FieldValues,
  type Path,
} from 'react-hook-form';
import styles from './select-form.module.css';

interface Props<T extends FieldValues> {
  name: Path<T>;
  control: Control<T>;
  options: readonly { option: string; value: string }[];
  label: string;
  error?: FieldError;
  onChange?: (value: string) => void;
}

export const SelectForm = <T extends FieldValues>({
  name,
  control,
  label,
  error,
  options,
  onChange,
}: Props<T>) => {
  return (
    <div className={styles.container}>
      <label htmlFor={name}>{label}</label>
      <Controller
        name={name}
        control={control}
        render={({ field }) => (
          <select
            {...field}
            id={name}
            className={error ? styles.isInvalid : ''}
            onChange={(e) => {
              field.onChange(e);
              onChange?.(e.target.value);
            }}
          >
            <option value="" hidden>
              Seleccione una opción
            </option>
            {options.map(({ option, value }) => (
              <option key={value} value={value}>
                {option}
              </option>
            ))}
          </select>
        )}
      />
      {error && <p className={styles.error}>{error.message}</p>}
    </div>
  );
};
