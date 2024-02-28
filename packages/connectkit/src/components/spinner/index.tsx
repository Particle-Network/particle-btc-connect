import { type CSSProperties } from 'react';
import styles from './spinner.module.scss';

const Spinner = ({ className, style }: { className?: string; style?: CSSProperties | undefined }) => {
  return <span className={styles.loader + (className ? ` ${className}` : '')} style={style}></span>;
};

export default Spinner;
