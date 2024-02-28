import { useState, type CSSProperties } from 'react';
import { copyToClipboard } from '../../utils';
import styles from './copyText.module.scss';

export interface CopyTextProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  value?: string;
  className?: string;
  style?: CSSProperties | undefined;
}

export default function CopyText({ children, value, className, style }: CopyTextProps) {
  const [copied, setCopied] = useState<boolean>();

  const handleClick = async () => {
    if (copied) {
      return;
    }

    try {
      if (value) {
        await copyToClipboard(value);
      } else if (typeof children === 'string' || typeof children === 'number' || typeof children === 'boolean') {
        await copyToClipboard(children.toString());
      } else {
        throw new Error('please set copy value');
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 1000);
    } catch (error) {
      //ignore
    }
  };

  return (
    <div
      className={styles.copyText + (className ? ` ${className}` : '') + (copied ? ` ${styles.copied}` : '')}
      onClick={handleClick}
      style={style}
    >
      {copied ? 'Copied' : children}
    </div>
  );
}
