import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, User, DollarSign, Percent } from 'lucide-react';
import { motion } from 'framer-motion';
import api from '../api/api';

const NewLoanPage: React.FC = () => {
  const navigate = useNavigate();
  const [clientName, setClientName] = useState('');
  const [amount, setAmount] = useState<number | ''>('');
  const [interestRate, setInterestRate] = useState<number | ''>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const formatWithSeparators = (val: number | '') => {
    if (val === '') return '';
    const parts = val.toString().split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return parts.join('.');
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/[^0-9.]/g, '');
    if (val === '') {
      setAmount('');
      return;
    }
    const num = parseFloat(val);
    if (!isNaN(num)) {
      setAmount(num);
    }
  };

  const handleInterestChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val === '' || (/^\d{1,2}$/.test(val))) {
      setInterestRate(val ? Number(val) : '');
    }
  };

  const handleSaveLoan = async () => {
    if (!clientName.trim()) {
      setError('Debes ingresar el nombre del cliente.');
      return;
    }
    if (!amount || amount <= 0) {
      setError('Debes ingresar un monto válido.');
      return;
    }
    if (interestRate === '' || interestRate < 0) {
      setError('Debes ingresar una tasa de interés válida.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const payload = {
        clientName: clientName.trim(),
        amount: Number(amount),
        interestRate: Number(interestRate),
        lateFeeRate: 0,
        frequency: 'Mensual',
        installmentsCount: 1,
        startDate: new Date().toISOString()
      };

      await api.post(`/loans`, payload);
      navigate('/loans');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al guardar el préstamo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 pt-2">
      <div className="flex items-center gap-4">
        <button 
          onClick={() => navigate('/loans')}
          className="p-3 bg-white rounded-full shadow-sm text-sage-900 hover:bg-sage-100 transition-colors"
        >
          <ArrowLeft size={24} />
        </button>
        <div>
          <h1 className="text-2xl font-black text-sage-900 font-display">Nuevo Préstamo</h1>
          <p className="text-sage-500 text-sm font-medium font-sans">Registro de crédito</p>
        </div>
      </div>

      {error && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }} 
          animate={{ opacity: 1, y: 0 }} 
          className="p-4 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-sm flex items-center gap-2 font-sans"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {error}
        </motion.div>
      )}

      <motion.div 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }} 
        className="space-y-6"
      >
        <div className="bg-white rounded-[32px] p-6 border border-sage-100 shadow-sm space-y-6">
          
          <div>
            <label className="block text-xs font-bold text-sage-500 uppercase tracking-widest font-sans mb-2 ml-1">Cliente</label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-sage-400" size={20} />
              <input
                type="text"
                placeholder="Ej. Juan Pérez"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                className="input-field pl-12"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-sage-500 uppercase tracking-widest font-sans mb-2 ml-1">Monto Principal</label>
            <div className="relative">
              <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-sage-400" size={20} />
              <input
                type="text"
                value={formatWithSeparators(amount)}
                onChange={handleAmountChange}
                placeholder="0"
                className="input-field pl-12 font-display text-lg"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-sage-500 uppercase tracking-widest font-sans mb-2 ml-1">Interés (%)</label>
            <div className="relative">
              <Percent className="absolute left-4 top-1/2 -translate-y-1/2 text-sage-400" size={20} />
              <input
                type="number"
                value={interestRate}
                onChange={handleInterestChange}
                placeholder="0"
                className="input-field pl-12 font-display text-lg"
              />
            </div>
          </div>

          {amount && interestRate !== '' && (
            <div className="mt-4 p-6 bg-tangerine-50 rounded-3xl border-2 border-tangerine-200 flex flex-col justify-center text-center">
              <p className="text-xs font-bold tracking-widest text-tangerine-600 mb-1 uppercase font-sans">Total a Pagar</p>
              <p className="text-4xl font-black text-tangerine-500 font-display">
                ${(Number(amount) + (Number(amount) * (Number(interestRate) / 100))).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
          )}

        </div>
        
        <motion.button 
          whileTap={{ scale: 0.95 }}
          onClick={handleSaveLoan}
          disabled={isSubmitting || !clientName.trim()}
          className="btn-primary disabled:opacity-50 disabled:active:scale-100"
        >
          {isSubmitting ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            'Registrar Préstamo'
          )}
        </motion.button>

      </motion.div>
    </div>
  );
};

export default NewLoanPage;
