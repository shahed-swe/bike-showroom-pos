import { X } from 'lucide-react';

export default function Modal({ open, onClose, title, children, size = 'md' }) {
  if (!open) return null;
  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-xl',
    lg: 'max-w-3xl',
    xl: 'max-w-5xl',
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm">
      <div className={`bg-white dark:bg-ink-900 rounded-2xl shadow-2xl w-full ${sizes[size]} max-h-[90vh] flex flex-col border border-slate-100 dark:border-ink-800`}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-ink-800">
          <h3 className="font-display font-bold text-lg text-slate-800 dark:text-slate-100">{title}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-ink-800 text-slate-500 dark:text-slate-400">
            <X size={18} />
          </button>
        </div>
        <div className="overflow-y-auto p-6">{children}</div>
      </div>
    </div>
  );
}
