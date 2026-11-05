import React, { createContext, useContext, useState, useCallback } from 'react';
import { AlertCircle, CheckCircle2, Info, X, AlertTriangle } from 'lucide-react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(({ type = 'info', title, message, duration = 4000 }) => {
    const id = Date.now().toString() + Math.random().toString().slice(2, 6);
    const newToast = { id, type, title, message };

    setToasts((prev) => [...prev, newToast]);

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  }, [removeToast]);

  const showSuccess = useCallback((message, title = 'Success') => {
    showToast({ type: 'success', title, message });
  }, [showToast]);

  const showError = useCallback((message, title = 'Error') => {
    showToast({ type: 'error', title, message, duration: 6000 });
  }, [showToast]);

  const showInfo = useCallback((message, title = 'Notice') => {
    showToast({ type: 'info', title, message });
  }, [showToast]);

  return (
    <ToastContext.Provider value={{ showToast, showSuccess, showError, showInfo }}>
      {children}
      {/* Toast Overlay Container */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none p-2 sm:p-0">
        {toasts.map((t) => {
          const typeStyles = {
            success: 'bg-emerald-50 border-emerald-200 text-emerald-900',
            error: 'bg-rose-50 border-rose-200 text-rose-900',
            warning: 'bg-amber-50 border-amber-200 text-amber-900',
            info: 'bg-indigo-50 border-indigo-200 text-indigo-900',
          }[t.type] || 'bg-slate-50 border-slate-200 text-slate-900';

          const IconComponent = {
            success: CheckCircle2,
            error: AlertCircle,
            warning: AlertTriangle,
            info: Info,
          }[t.type] || Info;

          const iconColor = {
            success: 'text-emerald-600',
            error: 'text-rose-600',
            warning: 'text-amber-600',
            info: 'text-indigo-600',
          }[t.type] || 'text-slate-600';

          return (
            <div
              key={t.id}
              className={`pointer-events-auto border rounded-xl p-3.5 shadow-lg backdrop-blur flex items-start gap-3 transition-all transform duration-300 animate-in fade-in slide-in-from-bottom-2 ${typeStyles}`}
            >
              <IconComponent className={`w-5 h-5 shrink-0 mt-0.5 ${iconColor}`} />
              <div className="flex-1 min-w-0">
                {t.title && <p className="text-xs font-bold leading-tight mb-0.5">{t.title}</p>}
                <p className="text-xs leading-relaxed opacity-90 break-words">{t.message}</p>
              </div>
              <button
                onClick={() => removeToast(t.id)}
                className="text-slate-400 hover:text-slate-700 transition p-0.5 rounded"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    // Graceful fallback if invoked outside provider
    return {
      showToast: console.log,
      showSuccess: console.log,
      showError: console.error,
      showInfo: console.info
    };
  }
  return ctx;
}
