import { useToast } from '../context/ToastContext';

export function ToastContainer() {
  const { toasts, dismissToast } = useToast();

  if (toasts.length === 0) return null;

  const variantStyles = {
    success: 'bg-chartrons-olive text-white border-chartrons-olive-light',
    error: 'bg-chartrons-green-dark text-white border-chartrons-green',
    info: 'bg-chartrons-brass text-chartrons-olive-dark border-chartrons-brass',
  };

  const variantIcon = {
    success: '✓',
    error: '✕',
    info: 'ℹ',
  };

  return (
    <div className="fixed top-[5.5rem] inset-x-0 z-[60] flex flex-col items-center gap-2 px-4 pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          role="alert"
          className={`pointer-events-auto w-full max-w-sm flex items-center gap-3 px-4 py-3.5 rounded-2xl shadow-card-hover border animate-slide-down ${variantStyles[toast.variant]}`}
        >
          <span className="text-lg shrink-0" aria-hidden>{variantIcon[toast.variant]}</span>
          <p className="text-sm font-semibold flex-1">{toast.message}</p>
          <button
            onClick={() => dismissToast(toast.id)}
            className="touch-target w-8 h-8 rounded-full flex items-center justify-center opacity-70 hover:opacity-100 text-xs shrink-0"
            aria-label="Dismiss"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}
