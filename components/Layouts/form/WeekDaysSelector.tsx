'use client';
import {
  type Control,
  Controller,
  type FieldErrors,
  type FieldValues,
  type Path,
} from 'react-hook-form';
import styles from './week-days-selector.module.css';

type Option<T extends string | number> = {
  label: string;
  value: T;
};

interface Props<T extends FieldValues> {
  name: Path<T>;
  label: string;
  options: Option<string | number>[];
  control: Control<T>;
  error?: FieldErrors<T>[Path<T>];
}

export const WeekDaysSelector = <T extends FieldValues>({
  name,
  label,
  options,
  control,
  error,
}: Props<T>) => {
  return (
    <div className={styles.container}>
      <span>{label}</span>
      <Controller
        name={name}
        control={control}
        render={({ field }) => (
          <div className={`${styles.options} ${error ? styles.isInvalid : ''}`}>
            {options.map((o) => (
              <label key={String(o.value)}>
                <input
                  type="checkbox"
                  value={o.value}
                  checked={Array.isArray(field.value) && field.value.includes(o.value)}
                  onChange={(e) => {
                    const isChecked = e.target.checked;
                    const currentValues = Array.isArray(field.value) ? field.value : [];
                    if (isChecked) {
                      field.onChange([...currentValues, o.value]);
                    } else {
                      field.onChange(currentValues.filter((v) => v !== o.value));
                    }
                  }}
                />
                {o.label[0]}
              </label>
            ))}
          </div>
        )}
      />

      {error && (
        <p className={styles.error}>
          {'message' in error && typeof error.message === 'string'
            ? error.message
            : 'Error de selección'}
        </p>
      )}
    </div>
  );
};
