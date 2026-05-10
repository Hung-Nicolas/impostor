import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, AlertTriangle, Info, X } from 'lucide-react';

interface ToastData {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

let toastListeners: ((toast: ToastData) => void)[] = [];

export function showToast(message: string, type: ToastData['type'] = 'info') {
  const toast: ToastData = { id: `${Date.now()}-${Math.random()}`, message, type };
  toastListeners.forEach((l) => l(toast));
}

const icons = {
  success: { Icon: Check, border: 'border-l-[#22C55E]', bg: 'bg-[rgba(34,197,94,0.1)]' },
  error: { Icon: AlertTriangle, border: 'border-l-[#EF4444]', bg: 'bg-[rgba(239,68,68,0.1)]' },
  info: { Icon: Info, border: 'border-l-[#00E5CC]', bg: 'bg-[rgba(0,229,204,0.1)]' },
};

export function ToastContainer() {
  const [toasts, setToasts] = useState<ToastData[]>([]);

  useEffect(() => {
    const listener = (t: ToastData) => setToasts((prev) => [...prev, t]);
    toastListeners.push(listener);
    return () => { toastListeners = toastListeners.filter((l) => l !== listener); };
  }, []);

  useEffect(() => {
    if (toasts.length === 0) return;
    const timer = setTimeout(() => {
      setToasts((prev) => prev.slice(1));
    }, 3000);
    return () => clearTimeout(timer);
  }, [toasts]);

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[300] flex flex-col gap-2 w-[90%] max-w-sm">
      <AnimatePresence>
        {toasts.map((toast) => {
          const { Icon: IconComp, border, bg } = icons[toast.type];
          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className={`flex items-center gap-2 bg-[#14141C] border border-[rgba(255,255,255,0.06)] ${border} border-l-[3px] rounded-xl px-4 py-3 shadow-[0_4px_16px_rgba(0,0,0,0.4)]`}
            >
              <div className={`${bg} rounded-full p-1`}>
                <IconComp size={14} className={toast.type === 'success' ? 'text-[#22C55E]' : toast.type === 'error' ? 'text-[#EF4444]' : 'text-[#00E5CC]'} />
              </div>
              <span className="text-sm text-[#F0F0F5] flex-1">{toast.message}</span>
              <button onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}>
                <X size={14} className="text-[#5A5A6A]" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
