import { createContext, useContext, useState, useCallback, useRef, useEffect, useMemo, memo } from 'react';

const ToastContext = createContext(null);

let toastId = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const timersRef = useRef(new Map());

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
    // Clear timer if exists
    const timer = timersRef.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timersRef.current.delete(id);
    }
  }, []);

  const addToast = useCallback((message, type = 'info', duration = 5000) => {
    const id = ++toastId;
    setToasts(prev => [...prev, { id, message, type, duration, createdAt: Date.now() }]);
    if (duration > 0) {
      const timer = setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
        timersRef.current.delete(id);
      }, duration);
      timersRef.current.set(id, timer);
    }
    return id;
  }, []);

  // Cleanup all timers on unmount
  useEffect(() => {
    return () => {
      timersRef.current.forEach(timer => clearTimeout(timer));
      timersRef.current.clear();
    };
  }, []);

  const toastApi = useMemo(() => ({
    success: (msg, dur) => addToast(msg, 'success', dur),
    error: (msg, dur) => addToast(msg, 'error', dur),
    warning: (msg, dur) => addToast(msg, 'warning', dur),
    info: (msg, dur) => addToast(msg, 'info', dur),
    remove: removeToast,
  }), [addToast, removeToast]);

  return (
    <ToastContext.Provider value={toastApi}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}

const typeStyles = {
  success: 'border-green-500/30 bg-green-500/10',
  error: 'border-red-500/30 bg-red-500/10',
  warning: 'border-yellow-500/30 bg-yellow-500/10',
  info: 'border-primary-500/30 bg-primary-500/10',
};

const typeIcons = {
  success: '✓',
  error: '✕',
  warning: '⚠',
  info: 'ℹ',
};

const typeIconColors = {
  success: 'text-green-400',
  error: 'text-red-400',
  warning: 'text-yellow-400',
  info: 'text-primary-400',
};

const typeBarColors = {
  success: 'bg-green-500',
  error: 'bg-red-500',
  warning: 'bg-yellow-500',
  info: 'bg-primary-500',
};

function ToastItem({ toast, onRemove }) {
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    if (toast.duration <= 0) return;
    const interval = setInterval(() => {
      const elapsed = Date.now() - toast.createdAt;
      const remaining = Math.max(0, 100 - (elapsed / toast.duration) * 100);
      setProgress(remaining);
      if (remaining <= 0) clearInterval(interval);
    }, 50);
    return () => clearInterval(interval);
  }, [toast.createdAt, toast.duration]);

  return (
    <div
      className={`relative overflow-hidden border rounded-lg p-3 pr-8 shadow-lg backdrop-blur-sm transition-all duration-300 ${typeStyles[toast.type]}`}
      role="alert"
      aria-live="polite"
    >
      <div className="flex items-center gap-2">
        <span className={`text-sm font-bold ${typeIconColors[toast.type]}`}>
          {typeIcons[toast.type]}
        </span>
        <p className="text-sm text-dark-100">{toast.message}</p>
      </div>
      <button
        onClick={() => onRemove(toast.id)}
        className="absolute top-2 right-2 text-dark-400 hover:text-dark-200 text-xs"
        aria-label="Dismiss notification"
      >
        ✕
      </button>
      {toast.duration > 0 && (
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-dark-700">
          <div
            className={`h-full transition-all duration-100 ease-linear ${typeBarColors[toast.type]}`}
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  );
}

const ToastContainer = memo(function ToastContainer({ toasts, onRemove }) {
  if (toasts.length === 0) return null;

  return (
    <div
      className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 max-w-sm w-full pointer-events-none"
      aria-label="Notifications"
    >
      {toasts.slice(-5).map(toast => (
        <div key={toast.id} className="pointer-events-auto animate-slide-in-right">
          <ToastItem toast={toast} onRemove={onRemove} />
        </div>
      ))}
    </div>
  );
});

export default ToastContext;
