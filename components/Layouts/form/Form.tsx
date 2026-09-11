import type { FormHTMLAttributes, ReactNode } from 'react';
import styles from './form.module.css';

interface Props extends Omit<FormHTMLAttributes<HTMLFormElement>, 'children'> {
  children: ReactNode;
}

export const Form = ({ children, ...props }: Props) => {
  return (
    <form {...props} className={`${styles.container} ${props.className || ''}`}>
      {children}
    </form>
  );
};
