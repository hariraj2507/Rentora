import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

interface ToastContextType {
  toast: (message: string, type?: Toast['type']) => void;
}

const ToastContext = createContext<ToastContextType>({ toast: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((message: string, type: Toast['type'] = 'success') => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, message, type }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toast: addToast }}>
      {children}
      {/* Toast Container */}
      <div className="fixed bottom-8 right-8 z-[100] space-y-3 pointer-events-none">
        <AnimatePresence>
          {toasts.map(t => (
            <ToastItem key={t.id} toast={t} onDismiss={removeToast} />
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: (id: string) => void }) {
  useEffect(() => {
    const timer = setTimeout(() => onDismiss(toast.id), 4000);
    return () => clearTimeout(timer);
  }, [toast.id, onDismiss]);

  const icons = {
    success: <CheckCircle2 size={20} className="text-emerald-500 shrink-0" />,
    error: <AlertCircle size={20} className="text-red-500 shrink-0" />,
    info: <Info size={20} className="text-blue-500 shrink-0" />,
  };

  const borders = {
    success: 'border-emerald-500/20',
    error: 'border-red-500/20',
    info: 'border-blue-500/20',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: 100, scale: 0.95 }}
      className={`pointer-events-auto flex items-center gap-4 px-6 py-4 rounded-2xl bg-white dark:bg-slate-900 border-2 ${borders[toast.type]} shadow-2xl shadow-slate-500/10 min-w-[320px] max-w-[440px]`}
    >
      {icons[toast.type]}
      <p className="text-sm font-bold text-slate-900 dark:text-white flex-1">{toast.message}</p>
      <button onClick={() => onDismiss(toast.id)} className="text-slate-400 hover:text-slate-600 transition-colors shrink-0">
        <X size={16} />
      </button>
    </motion.div>
  );
}
