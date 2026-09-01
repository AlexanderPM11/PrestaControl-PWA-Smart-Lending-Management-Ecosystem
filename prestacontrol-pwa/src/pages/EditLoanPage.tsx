import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, User } from 'lucide-react';
import { motion } from 'framer-motion';
import api from '../api/api';
import LoanSimulator from '../components/loans/LoanSimulator';

const EditLoanPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [clientName, setClientName] = useState('');
  const [initialData, setInitialData] = useState<any>(null);
  const [hasPayments, setHasPayments] = useState(false);
  const [simulationData, setSimulationData] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLoan = async () => {
      try {
        const [loanRes, paymentsRes] = await Promise.all([
          api.get(`/loans/${id}`),
          api.get(`/loans/${id}/payments`)
        ]);
        
        const loan = loanRes.data;
        const payments = paymentsRes.data;
        
        setClientName(loan.clientName);
        setHasPayments(payments.length > 0);
        
        setInitialData({
          amount: loan.amount,
          interestRate: loan.interestRate,
          installmentsCount: loan.installmentsCount,
          frequency: loan.frequency,
          startDate: loan.startDate
        });

      } catch (err: any) {
        setError('Error cargando el préstamo.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchLoan();
  }, [id]);

  const handleUpdateLoan = async () => {
    if (!clientName.trim()) {
      setError('Debes ingresar el nombre del cliente.');
      return;
    }
    
    if (!hasPayments && !simulationData) return;

    setIsSubmitting(true);
    setError('');

    try {
      const payload = hasPayments ? {
        clientName: clientName.trim(),
        amount: initialData.amount,
        interestRate: initialData.interestRate,
        lateFeeRate: 0,
        frequency: initialData.frequency,
        installmentsCount: initialData.installmentsCount,
        startDate: initialData.startDate
      } : {
        clientName: clientName.trim(),
        amount: simulationData.amount,
        interestRate: simulationData.interestRate,
        lateFeeRate: 0,
        frequency: simulationData.frequency,
        installmentsCount: simulationData.installments,
        startDate: simulationData.startDate
      };

      await api.put(`/loans/${id}`, payload);
      navigate(`/loans/details/${id}`);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al actualizar el préstamo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-sage-200 border-t-financial-green rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pt-2 pb-24 animate-fade-in-up">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button 
          onClick={() => navigate(`/loans/details/${id}`)}
          className="p-3 bg-white rounded-full shadow-sm text-sage-900 hover:bg-sage-100 transition-colors"
        >
          <ArrowLeft size={24} />
        </button>
        <div>
          <h1 className="text-2xl font-black text-sage-900 font-display">Editar Préstamo</h1>
          <p className="text-sage-500 text-sm font-medium font-sans">
            {hasPayments ? 'Solo puedes editar información general.' : 'Edita las condiciones del préstamo.'}
          </p>
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

      {/* Client Input */}
      <div className="bg-white rounded-[32px] p-6 border border-sage-100 shadow-sm space-y-4">
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
      </div>

      {/* Simulator (Only if no payments) */}
      <div className={`${hasPayments ? 'opacity-50 pointer-events-none hidden' : 'block'}`}>
        {initialData && (
          <LoanSimulator 
            initialData={initialData} 
            onSimulationChange={setSimulationData} 
          />
        )}
      </div>

      <motion.button 
        whileTap={{ scale: 0.95 }}
        onClick={handleUpdateLoan}
        disabled={isSubmitting || !clientName.trim()}
        className="btn-primary w-full disabled:opacity-50 disabled:active:scale-100"
      >
        {isSubmitting ? (
          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        ) : (
          'Guardar Cambios'
        )}
      </motion.button>
    </div>
  );
};

export default EditLoanPage;
