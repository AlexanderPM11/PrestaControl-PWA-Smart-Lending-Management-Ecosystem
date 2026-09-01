import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertCircle, CheckCircle2, Info, AlertTriangle, X } from 'lucide-react';
import { type ToastMessage, type ToastType } from '../../context/ToastContext';

interface ToastContainerProps {
  toasts: ToastMessage[];
  removeToast: (id: string) => void;
}

const ToastItem: React.FC<{ toast: ToastMessage; onClose: () => void }> = ({ toast, onClose }) => {
  const getIcon = (type: ToastType) => {
    switch (type) {
      case 'success': return <CheckCircle2 size={24} className="text-emerald-500" />;
      case 'error': return <AlertCircle size={24} className="text-red-500" />;
      case 'warning': return <AlertTriangle size={24} className="text-amber-500" />;
      case 'info': return <Info size={24} className="text-blue-500" />;
    }
  };

  const getStyles = (type: ToastType) => {
    switch (type) {
      case 'success': return 'border-emerald-100 bg-emerald-50/90 shadow-emerald-500/10';
      case 'error': return 'border-red-100 bg-red-50/90 shadow-red-500/10';
      case 'warning': return 'border-amber-100 bg-amber-50/90 shadow-amber-500/10';
      case 'info': return 'border-blue-100 bg-blue-50/90 shadow-blue-500/10';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
      className={`mb-3 p-4 rounded-2xl border shadow-xl backdrop-blur-md flex items-start gap-3 w-full max-w-sm pointer-events-auto ${getStyles(toast.type)}`}
    >
      <div className="flex-shrink-0 mt-0.5">{getIcon(toast.type)}</div>
      <div className="flex-1">
        {toast.title && <h4 className="text-sm font-bold text-slate-800 font-display mb-0.5">{toast.title}</h4>}
        <p className="text-xs font-medium text-slate-600 font-sans leading-relaxed">{toast.message}</p>
      </div>
      <button 
        onClick={onClose}
        className="flex-shrink-0 p-1 rounded-lg hover:bg-black/5 transition-colors text-slate-400"
      >
        <X size={16} />
      </button>
    </motion.div>
  );
};

const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, removeToast }) => {
  return (
    <div className="fixed top-4 left-0 right-0 z-[100] flex flex-col items-center justify-start pointer-events-none px-4">
      <AnimatePresence>
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
        ))}
      </AnimatePresence>
    </div>
  );
};

export default ToastContainer;
