import React, { useEffect } from 'react';

export const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <section className={`bg-white rounded-3xl border border-[#ece2f6] shadow-[0_2px_12px_rgba(120,60,180,0.05)] ${className}`}>
    {children}
  </section>
);

export const Modal: React.FC<{
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  wide?: boolean;
}> = ({ title, onClose, children, wide }) => {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-0 sm:p-6" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`bg-white w-full ${wide ? 'sm:max-w-3xl' : 'sm:max-w-lg'} max-h-[92vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl shadow-xl`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white/95 backdrop-blur flex items-center justify-between px-5 py-4 border-b border-[#f0e8f8]">
          <h2 className="text-base font-bold">{title}</h2>
          <button onClick={onClose} className="w-9 h-9 rounded-full hover:bg-slate-100 text-slate-500 text-xl leading-none" aria-label="닫기">
            ×
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
};

export const Toggle: React.FC<{ checked: boolean; onChange: (v: boolean) => void; label: string; hint?: string }> = ({
  checked,
  onChange,
  label,
  hint,
}) => (
  <label className="flex items-start gap-3 cursor-pointer select-none">
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`mt-0.5 shrink-0 w-11 h-6 rounded-full transition-colors ${checked ? 'bg-purple-600' : 'bg-slate-300'}`}
    >
      <span className={`block w-5 h-5 bg-white rounded-full shadow transition-transform ${checked ? 'translate-x-[22px]' : 'translate-x-0.5'}`} />
    </button>
    <span>
      <span className="text-sm font-semibold text-slate-800">{label}</span>
      {hint && <span className="block text-xs text-slate-500 mt-0.5">{hint}</span>}
    </span>
  </label>
);

export const Segmented = <T extends string | number>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: { id: T; label: string }[];
  onChange: (v: T) => void;
}) => (
  <div className="flex flex-wrap gap-2">
    {options.map((o) => (
      <button
        key={String(o.id)}
        type="button"
        onClick={() => onChange(o.id)}
        className={`px-3.5 py-1.5 rounded-full text-sm border transition-colors ${
          value === o.id
            ? 'bg-[#d9c2ef] border-[#d9c2ef] text-purple-900 font-semibold'
            : 'bg-white border-[#e6dcf1] text-slate-600 hover:border-purple-300'
        }`}
      >
        {o.label}
      </button>
    ))}
  </div>
);

export const Spinner: React.FC<{ className?: string }> = ({ className = 'w-6 h-6' }) => (
  <svg className={`animate-spin text-purple-500 ${className}`} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.2" strokeWidth="4" />
    <path d="M22 12a10 10 0 0 0-10-10" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
  </svg>
);

/** 투명 배경 확인용 체크무늬 */
export const CHECKER =
  'bg-[length:16px_16px] bg-[linear-gradient(45deg,#eee_25%,transparent_25%),linear-gradient(-45deg,#eee_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#eee_75%),linear-gradient(-45deg,transparent_75%,#eee_75%)] bg-[position:0_0,0_8px,8px_-8px,-8px_0]';
