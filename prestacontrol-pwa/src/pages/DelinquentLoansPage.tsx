import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, TrendingUp, Clock, AlertTriangle } from 'lucide-react';
import api from '../api/api';
import { useToast } from '../context/ToastContext';

const DelinquentLoansPage: React.FC = () => {
  const [loans, setLoans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const toast = useToast();

  useEffect(() => {
    fetchDelinquentLoans();
  }, []);

  const fetchDelinquentLoans = async () => {
    try {
      const response = await api.get(`/delinquency/loans`);
      setLoans(response.data);
    } catch (err) {
      console.error('Error fetching delinquent loans:', err);
      toast.error('Error al cargar la lista de morosos');
    } finally {
      setLoading(false);
    }
  };

  const totalArrears = loans.reduce((acc, loan) => 
    acc + loan.installments.reduce((sum: number, inst: any) => sum + inst.lateFeeAmount, 0)
  , 0);

  return (
    <div className="space-y-6 pt-2 pb-24 animate-fade-in-up">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center shadow-sm">
          <AlertTriangle size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-black text-sage-900 font-display">Morosos</h1>
          <p className="text-sage-500 text-sm font-medium font-sans">Clientes con pagos atrasados</p>
        </div>
      </div>

      <div className="flex gap-4">
        <div className="flex-1 bg-white p-4 rounded-3xl shadow-sm border border-sage-100 flex flex-col justify-between">
          <div className="w-8 h-8 bg-red-100 text-red-500 rounded-xl flex items-center justify-center mb-2">
            <TrendingUp size={16} />
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold text-sage-400 tracking-wider font-sans">Total Recargos</p>
            <p className="text-lg font-black text-red-500 font-display">${totalArrears.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
          </div>
        </div>
        
        <div className="flex-1 bg-white p-4 rounded-3xl shadow-sm border border-sage-100 flex flex-col justify-between">
          <div className="w-8 h-8 bg-sage-100 text-sage-500 rounded-xl flex items-center justify-center mb-2">
            <User size={16} />
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold text-sage-400 tracking-wider font-sans">En Mora</p>
            <p className="text-lg font-black text-sage-900 font-display">{loans.length}</p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-10 h-10 border-4 border-sage-200 border-t-red-500 rounded-full animate-spin mb-4" />
          <p className="text-sage-500 font-medium font-sans text-sm">Calculando mora...</p>
        </div>
      ) : loans.length > 0 ? (
        <div className="space-y-4">
          {loans.map((loan) => {
            const lateFees = loan.installments.reduce((sum: number, inst: any) => sum + inst.lateFeeAmount, 0);
            return (
              <div key={loan.id} className="bg-white rounded-[24px] p-5 border border-sage-100 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-16 h-16 bg-red-50 rounded-bl-[40px] flex items-start justify-end p-3">
                  <Clock size={16} className="text-red-400" />
                </div>
                
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-sage-50 rounded-xl flex items-center justify-center text-sage-400">
                    <span className="font-black font-display text-lg">{loan.clientName.charAt(0)}</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-sage-900 font-sans line-clamp-1">{loan.clientName}</h3>
                    <p className="text-xs text-sage-400 font-medium font-sans">Préstamo #{loan.id}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-[10px] font-bold text-sage-400 uppercase tracking-widest font-sans mb-1">Monto Pendiente</p>
                      <p className="text-lg font-black text-sage-900 font-display">${loan.balanceDue.toLocaleString()}</p>
                    </div>
                  </div>

                  <div className="p-3 bg-red-50 rounded-xl border border-red-100/50 flex justify-between items-center font-sans">
                    <span className="text-xs font-bold text-red-700">Recargos</span>
                    <span className="text-sm font-black text-red-600">${lateFees.toFixed(2)}</span>
                  </div>

                  <button 
                    onClick={() => navigate(`/payments?loanId=${loan.id}`)}
                    className="w-full py-3.5 mt-2 bg-sage-50 text-sage-700 border border-sage-200 hover:bg-sage-100 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 font-sans active:scale-95"
                  >
                    Gestionar Cobro <ArrowRight size={16} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-sage-50 rounded-3xl border border-dashed border-sage-200 py-16 text-center mt-6">
          <div className="w-16 h-16 bg-white rounded-full shadow-sm mx-auto flex items-center justify-center text-financial-green mb-4">
            <CheckCircle2 size={32} />
          </div>
          <h2 className="text-xl font-black text-sage-900 font-display">¡Cartera Saludable!</h2>
          <p className="text-sage-500 font-sans text-sm mt-2">No hay clientes con pagos atrasados.</p>
        </div>
      )}
    </div>
  );
};

const CheckCircle2 = ({ size }: { size: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
);

const ArrowRight = ({ size }: { size: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12" />
    <polyline points="12 5 19 12 12 19" />
  </svg>
);

export default DelinquentLoansPage;
