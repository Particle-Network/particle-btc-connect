import { type CSSProperties, type ReactNode } from 'react';
import Spinner from '../spinner';
import styles from './button.module.scss';

const Button = ({
  children,
  isLoading,
  isDisabled,
  onClick,
  className,
  style,
}: {
  children: ReactNode;
  isLoading?: boolean;
  isDisabled?: boolean;
  onClick?: () => void;
  className?: string;
  style?: CSSProperties | undefined;
}) => {
  return (
    <button
      className={styles.btn + (className ? ` ${className}` : '')}
      onClick={isLoading || isDisabled ? undefined : onClick}
      disabled={isDisabled}
      style={style}
    >
      {isLoading && !isDisabled && <Spinner />}
      {children}
    </button>
  );
};

export default Button;
