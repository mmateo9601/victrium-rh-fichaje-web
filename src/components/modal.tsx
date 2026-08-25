'use client';

import { ReactNode, useEffect, useId } from 'react';

type ModalProps = {
  open: boolean;
  title: string;
  description?: string;
  children: ReactNode;
  actions?: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  onClose: () => void;
};

export function Modal({ open, title, description, children, actions, size = 'lg', onClose }: ModalProps) {
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    if (!open) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    const body = globalThis.document?.body;
    const previousOverflow = body?.style.overflow;
    if (body) {
      body.style.overflow = 'hidden';
    }
    window.addEventListener('keydown', onKeyDown);

    return () => {
      if (body && previousOverflow !== undefined) {
        body.style.overflow = previousOverflow;
      }
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  return (
    <div className="dialog-backdrop" role="presentation" onClick={onClose}>
      <div
        className={`dialog-card dialog-card--${size}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="dialog-card__header">
          <div>
            <h3 id={titleId}>{title}</h3>
            {description ? (
              <p id={descriptionId} className="meta">
                {description}
              </p>
            ) : null}
          </div>
          <button className="button button-secondary" type="button" onClick={onClose}>
            Cerrar
          </button>
        </div>

        <div className="dialog-card__content">{children}</div>

        {actions ? <div className="dialog-card__actions">{actions}</div> : null}
      </div>
    </div>
  );
}
