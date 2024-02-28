import { useEffect, useMemo, useState, type CSSProperties, type MouseEventHandler, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { RemoveScroll } from 'react-remove-scroll';
import styles from './modal.module.scss';

interface ModalProp {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  isDismissable?: boolean;
  contentStyle?: CSSProperties | undefined;
  contentClassName?: string;
}

const stopPropagation: MouseEventHandler<unknown> = (event) => event.stopPropagation();

const Modal = ({ open, onClose, children, isDismissable = true, contentStyle, contentClassName }: ModalProp) => {
  const handleBackdropClick = useMemo(() => (isDismissable ? onClose : undefined), [onClose, isDismissable]);

  useEffect(() => {
    if (isDismissable) {
      const handleEscape = (event: KeyboardEvent) => open && event.key === 'Escape' && onClose();

      document.addEventListener('keydown', handleEscape);

      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [open, onClose, isDismissable]);

  const [bodyScrollable, setBodyScrollable] = useState(true);
  useEffect(() => {
    setBodyScrollable(getComputedStyle(window.document.body).overflow !== 'hidden');
  }, []);

  return (
    <>
      {open
        ? createPortal(
            <RemoveScroll enabled={bodyScrollable}>
              <div className={styles.container} onClick={handleBackdropClick}>
                <div
                  className={styles.modal + (contentClassName ? ` ${contentClassName}` : '')}
                  style={contentStyle}
                  onClick={stopPropagation}
                >
                  {children}
                </div>
              </div>
            </RemoveScroll>,
            document.body
          )
        : null}
    </>
  );
};

export default Modal;
