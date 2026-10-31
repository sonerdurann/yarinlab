import { useEffect, useRef, type ReactNode } from 'react';

type Props = {
  titleId: string;
  title: string;
  onClose: () => void;
  wide?: boolean;
  /** Üst üste açık pencerelerde yalnızca en üsttekinin Esc ve Tab davranışı etkindir. */
  active?: boolean;
  children: ReactNode;
};

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])';

/** Ortak erişilebilir pencere: odak içeri alınır ve içinde döner, Esc kapatır, kapanınca odak geri verilir. */
export function Modal({ titleId, title, onClose, wide, active = true, children }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    ref.current?.focus();
    return () => opener?.focus?.();
  }, []);

  useEffect(() => {
    if (!active) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') return onClose();
      if (e.key !== 'Tab' || !ref.current) return;
      const items = [...ref.current.querySelectorAll<HTMLElement>(FOCUSABLE)].filter((el) => el.offsetParent !== null);
      if (!items.length) return;
      const first = items[0], last = items[items.length - 1];
      const at = document.activeElement;
      if (e.shiftKey && (at === first || at === ref.current)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && at === last) {
        e.preventDefault();
        first.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [active, onClose]);

  return (
    <div className="modal-backdrop">
      <div className={wide ? 'modal wide' : 'modal'} role="dialog" aria-modal="true" aria-labelledby={titleId} tabIndex={-1} ref={ref}>
        <div className="modal-head">
          <h2 id={titleId}>{title}</h2>
          <button onClick={onClose} aria-label="Kapat">
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
