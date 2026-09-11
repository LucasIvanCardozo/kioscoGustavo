import { Children, type ReactNode } from 'react';
import styles from './modal-actions.module.css';

export const ModalActions = ({ children }: { children: ReactNode }) => {
  const items = Children.toArray(children);
  if (items.length === 0) return null;
  return <div className={styles.actions}>{items}</div>;
};
