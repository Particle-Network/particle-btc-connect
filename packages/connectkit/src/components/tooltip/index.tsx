import { type ReactNode } from 'react';
import styles from './tooltip.module.scss';

const Tooltip = ({ children, content, className }: { children: ReactNode; content: string; className?: string }) => {
  return (
    <div className={styles.tipContainer}>
      {children}
      <div className={styles.tipContent + (className ? ` ${className}` : '')}>{content}</div>
    </div>
  );
};

export default Tooltip;
