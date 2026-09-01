import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertCircle, Trash2, RefreshCw, X } from 'lucide-react';

export type ConfirmDialogType = 'danger' | 'warning' | 'success';

export interface ConfirmDialogProps {
  isOpen: boolean;
  type?: ConfirmDialogType;
  title: string;
  message: string;
  error?: string | null;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  type = 'danger',
  title,
  message,
  error,
  onConfirm,
  onCancel,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar'
}) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-sage-900/40 backdrop-blur-sm"
          onClick={onCancel}
        />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative bg-white rounded-[32px] p-6 max-w-[320px] w-full shadow-2xl border border-sage-100 z-10"
        >
          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 ${
            type === 'warning' ? 'bg-amber-100 text-amber-600' : 
            type === 'success' ? 'bg-emerald-100 text-emerald-600' :
            'bg-red-100 text-red-600'
          }`}>
            {type === 'warning' ? <AlertCircle size={32} /> : 
             type === 'success' ? <RefreshCw size={32} /> : 
             <Trash2 size={32} />}
          </div>
          
          <h3 className="text-xl font-black text-center text-sage-900 mb-2 font-display">
            {title}
          </h3>
          <p className="text-sage-500 text-center text-xs mb-6 font-medium leading-relaxed font-sans">
            {message}
          </p>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-xl">
              <p className="text-[10px] font-bold text-red-600 text-center uppercase tracking-wider font-sans">
                {error}
              </p>
            </div>
          )}

          <div className="flex flex-col gap-2">
            <button 
              onClick={onConfirm}
              className={`w-full py-3.5 rounded-2xl font-bold text-white transition-all shadow-lg text-sm font-sans ${
                type === 'warning' ? 'bg-amber-500 shadow-amber-500/30' : 
                type === 'success' ? 'bg-emerald-500 shadow-emerald-500/30' :
                'bg-red-500 shadow-red-500/30'
              }`}
            >
              {confirmText}
            </button>
            <button 
              onClick={onCancel}
              className="w-full py-3.5 rounded-2xl font-bold text-sage-500 bg-sage-50 hover:bg-sage-100 transition-colors text-sm font-sans"
            >
              {cancelText}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default ConfirmDialog;
