import React, { useState, useEffect } from 'react';
import { AlertCircle, Search, Calendar, User, TrendingUp, Clock } from 'lucide-react';
import api from '../api/api';

const DelinquentLoansPage: React.FC = () => {
  const [loans, setLoans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const API_URL = import.meta.env.VITE_API_URL;

  useEffect(() => {
    fetchDelinquentLoans();
  }, []);

  const fetchDelinquentLoans = async () => {
    try {
      const response = await api.get(`/delinquency/loans`);
      setLoans(response.data);
    } catch (err) {
      console.error('Error fetching delinquent loans:', err);
    } finally {
      setLoading(false);
    }
  };

  const totalArrears = loans.reduce((acc, loan) => 
    acc + loan.installments.reduce((sum: number, inst: any) => sum + inst.lateFeeAmount, 0)
  , 0);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-end gap-6 mb-10">

        <div className="flex gap-4">
          <div className="bg-white dark:bg-slate-800 p-4 rounded-3xl shadow-xl border border-slate-100 dark:border-slate-700 flex items-center gap-4">
            <div className="p-3 bg-red-500 rounded-2xl text-white shadow-lg shadow-red-500/30">
              <TrendingUp size={20} />
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Total Recargos</p>
              <p className="text-xl font-black text-slate-900 dark:text-white">${totalArrears.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
            </div>
          </div>
          
          <div className="bg-white dark:bg-slate-800 p-4 rounded-3xl shadow-xl border border-slate-100 dark:border-slate-700 flex items-center gap-4">
            <div className="p-3 bg-slate-100 dark:bg-slate-700 text-slate-500 rounded-2xl">
              <User size={20} />
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Clientes en Mora</p>
              <p className="text-xl font-black text-slate-900 dark:text-white">{loans.length}</p>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-12 h-12 border-4 border-slate-200 border-t-red-500 rounded-full animate-spin mb-4" />
          <p className="text-slate-500 font-medium">Calculando intereses de mora...</p>
        </div>
      ) : loans.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loans.map((loan) => {
            const lateFees = loan.installments.reduce((sum: number, inst: any) => sum + inst.lateFeeAmount, 0);
            return (
              <div key={loan.id} className="bg-white dark:bg-slate-800 rounded-[32px] p-1 border border-slate-100 dark:border-slate-700 shadow-2xl hover:shadow-red-500/10 transition-all group overflow-hidden">
                <div className="p-6">
                  <div className="flex justify-between items-start mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-slate-100 dark:bg-slate-900 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-red-500 group-hover:text-white transition-all">
                        <User size={24} />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 dark:text-white line-clamp-1">{loan.clientName}</h3>
                        <p className="text-xs text-slate-400 font-medium">Préstamo #{loan.id}</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex justify-between items-end">
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Días de Atraso</p>
                        <div className="flex items-center gap-1.5 text-red-600 font-black">
                          <Clock size={16} />
                          <span>Crítico</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Monto Total</p>
                        <p className="text-lg font-black text-slate-900 dark:text-white">${loan.balanceDue.toLocaleString()}</p>
                      </div>
                    </div>

                    <div className="p-4 bg-red-50 dark:bg-red-900/10 rounded-2xl border border-red-100 dark:border-red-900/30">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-red-700 dark:text-red-400">Interés de Mora Acumulado</span>
                        <span className="text-sm font-black text-red-600">${lateFees.toFixed(2)}</span>
                      </div>
                    </div>

                    <button className="w-full py-3 bg-slate-900 dark:bg-white dark:text-slate-900 text-white rounded-2xl font-bold text-sm hover:bg-slate-800 dark:hover:bg-slate-100 transition-all flex items-center justify-center gap-2">
                      Gestionar Cobro <ArrowRight size={16} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-slate-50 dark:bg-slate-900/50 rounded-[40px] border-2 border-dashed border-slate-200 dark:border-slate-800 py-32 text-center">
          <div className="w-20 h-20 bg-white dark:bg-slate-800 rounded-full shadow-xl mx-auto flex items-center justify-center text-emerald-500 mb-6">
            <CheckCircle2 size={40} />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">¡Cartera Saludable!</h2>
          <p className="text-slate-500 dark:text-slate-400 mt-2">No se encontraron clientes con pagos atrasados.</p>
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
