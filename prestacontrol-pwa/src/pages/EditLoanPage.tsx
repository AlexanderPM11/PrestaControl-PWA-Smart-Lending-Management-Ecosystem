import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Landmark, ArrowLeft, Save, User } from 'lucide-react';
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
    
    // Si no tiene pagos, necesitamos simulacion
    if (!hasPayments && !simulationData) return;

    setIsSubmitting(true);
    setError('');

    try {
      const payload = hasPayments ? {
        clientName: clientName.trim(),
        amount: initialData.amount,
        interestRate: initialData.interestRate,
        lateFeeRate: 50,
        frequency: initialData.frequency,
        installmentsCount: initialData.installmentsCount,
        startDate: initialData.startDate
      } : {
        clientName: clientName.trim(),
        amount: simulationData.amount,
        interestRate: simulationData.interestRate,
        lateFeeRate: 50,
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
        <div className="w-12 h-12 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto pb-24">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate(`/loans/details/${id}`)}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
          >
            <ArrowLeft className="text-slate-600 dark:text-slate-400" />
          </button>
          <div>
            <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 flex items-center gap-3">
              <Landmark className="text-blue-600" size={32} /> Editar Préstamo
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1 font-medium tracking-wide">
              {hasPayments ? 'El préstamo tiene cobros, solo puedes editar la información general.' : 'Edita las condiciones del préstamo. Se recalcularán las cuotas.'}
            </p>
          </div>
        </div>
        
        <motion.button 
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleUpdateLoan}
          disabled={isSubmitting || !clientName.trim()}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white px-6 py-2.5 rounded-xl font-bold shadow-lg shadow-blue-500/30 transition-all transform active:scale-95"
        >
          {isSubmitting ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <Save size={18} />
          )}
          Guardar Cambios
        </motion.button>
      </div>

      {error && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }} 
          animate={{ opacity: 1, y: 0 }} 
          className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-xl text-red-600 dark:text-red-400 text-sm flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {error}
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Client Input */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }} 
          animate={{ opacity: 1, x: 0 }} 
          className="lg:col-span-4 space-y-6"
        >
          <div className="bg-white dark:bg-slate-900/80 backdrop-blur-xl rounded-[32px] shadow-2xl shadow-blue-500/5 p-8 border border-slate-100 dark:border-slate-800">
            <h3 className="text-xs font-black uppercase tracking-widest text-blue-600 dark:text-blue-400 mb-6 flex items-center gap-2">
              <User size={16} /> Identificación
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Nombre Completo</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input
                    type="text"
                    placeholder="Ej. Juan Pérez"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm text-slate-900 dark:text-white font-medium"
                  />
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Simulator */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }} 
          animate={{ opacity: 1, x: 0 }} 
          transition={{ delay: 0.1 }}
          className={`lg:col-span-8 ${hasPayments ? 'opacity-50 pointer-events-none' : ''}`}
        >
          {initialData && (
            <LoanSimulator 
              initialData={initialData} 
              onSimulationChange={setSimulationData} 
            />
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default EditLoanPage;
