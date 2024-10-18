import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type MouseEventHandler,
  type ReactNode,
} from 'react';
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

  const modalRef = useRef<HTMLDivElement>(null);
  const [modalHeight, setModalHeight] = useState<number>();

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

  useEffect(() => {
    if (modalRef.current) {
      setModalHeight(modalRef.current.offsetHeight);
      console.log('modalRef.current.offsetHeight------', modalRef.current.offsetHeight);
    }
  }, [modalRef.current?.offsetHeight]);

  return (
    <>
      {open
        ? createPortal(
            <RemoveScroll enabled={bodyScrollable}>
              <div
                className={styles.container}
                onClick={handleBackdropClick}
                style={
                  {
                    '--modal-height': `${modalHeight || 0}px`,
                  } as React.CSSProperties
                }
              >
                <div
                  className={styles.modal + (contentClassName ? ` ${contentClassName}` : '')}
                  style={contentStyle}
                  onClick={stopPropagation}
                  ref={modalRef}
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
