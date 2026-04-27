import React, { useState, useEffect } from 'react';
import { Wallet, Search, ArrowRight, DollarSign, Calendar, Info, CheckCircle2 } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import api from '../api/api';

const PaymentsPage: React.FC = () => {
  const [loans, setLoans] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [selectedLoan, setSelectedLoan] = useState<any>(null);
  const [displayAmount, setDisplayAmount] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [transactions, setTransactions] = useState<any[]>([]);

  const API_URL = import.meta.env.VITE_API_URL;

  const location = useLocation();

  useEffect(() => {
    fetchPendingLoans();
  }, []);

  const fetchPendingLoans = async () => {
    try {
      const response = await api.get(`/payments/pending`);
      setLoans(response.data);
      
      const searchParams = new URLSearchParams(location.search);
      const initialLoanId = searchParams.get('loanId');
      if (initialLoanId) {
        const found = response.data.find((l: any) => l.id === Number(initialLoanId));
        if (found) {
          setSelectedLoan(found);
        }
      }
    } catch (err) {
      console.error('Error fetching loans:', err);
    }
  };

  const handleProcessPayment = async () => {
    const numAmount = parseFloat(displayAmount.replace(/,/g, ''));
    if (!selectedLoan || numAmount <= 0) return;

    if (numAmount > selectedLoan.balanceDue + 0.01) {
      alert(`El monto (${numAmount.toLocaleString()}) no puede ser mayor al saldo pendiente (${selectedLoan.balanceDue.toLocaleString()})`);
      return;
    }

    setIsSubmitting(true);
    setSuccess(false);

    try {
      const response = await api.post(`/payments`, {
        loanId: selectedLoan.id,
        amount: numAmount,
        paymentMethod: 'Efectivo',
        notes: 'Pago recibido desde la PWA'
      });
      
      setTransactions(response.data);
      setSuccess(true);
      fetchPendingLoans();
      setSelectedLoan(null);
      setDisplayAmount('');
    } catch (err) {
      console.error('Error processing payment:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredLoans = loans.filter(l => 
    l.clientName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Loan List */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-100 dark:border-slate-700 p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="Buscar por cliente..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
              />
            </div>
          </div>

          <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
            {filteredLoans.map((loan) => (
              <button
                key={loan.id}
                onClick={() => setSelectedLoan(loan)}
                className={`w-full text-left p-5 rounded-2xl border transition-all transform hover:scale-[1.01] ${
                  selectedLoan?.id === loan.id 
                    ? 'bg-emerald-50 border-emerald-200 shadow-md dark:bg-emerald-900/20 dark:border-emerald-800' 
                    : 'bg-white border-slate-100 shadow-sm dark:bg-slate-800 dark:border-slate-700'
                }`}
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white">{loan.clientName}</h3>
                    <p className="text-xs text-slate-500 flex items-center gap-1">
                      <Calendar size={12} /> Préstamo #{loan.id} • {loan.frequency}
                    </p>
                  </div>
                  <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase ${
                    loan.status === 'Overdue' ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'
                  }`}>
                    {loan.status === 'Overdue' ? 'Mora' : 'Activo'}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-4 border-t border-slate-100 dark:border-slate-700 pt-3 mt-3">
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Saldo Pendiente</p>
                    <p className="text-lg font-black text-slate-800 dark:text-slate-200">${loan.balanceDue.toLocaleString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Monto Total</p>
                    <p className="text-sm font-semibold text-slate-500">${loan.totalToPay.toLocaleString()}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Payment Form */}
        <div className="lg:col-span-5">
          {selectedLoan ? (
            <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-700 overflow-hidden animate-fade-in-right">
              <div className="bg-emerald-600 p-6 text-white">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-white/20 rounded-lg">
                    <DollarSign size={24} />
                  </div>
                  <h2 className="text-xl font-bold">Procesar Pago</h2>
                </div>
                <p className="text-emerald-100 text-sm">Aplicando cobro para <span className="font-bold">{selectedLoan.clientName}</span></p>
              </div>

              <div className="p-8 space-y-6">
                <div>
                  <label className="block text-sm font-bold text-slate-600 dark:text-slate-400 mb-2 uppercase tracking-widest">Monto a Recibir</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-bold text-slate-400">$</span>
                    <input
                      type="text"
                      value={displayAmount}
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^0-9.]/g, '');
                        if (val === '') {
                          setDisplayAmount('');
                          return;
                        }
                        const parts = val.split('.');
                        parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
                        setDisplayAmount(parts.join('.'));
                      }}
                      placeholder="0.00"
                      className="w-full pl-10 pr-4 py-4 bg-slate-50 dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-700 rounded-2xl text-3xl font-black text-slate-800 dark:text-white focus:border-emerald-500 outline-none transition-all"
                    />
                  </div>
                  <div className="mt-4 grid grid-cols-3 gap-2">
                    {[100, 500, 1000].map(val => (
                      <button 
                        key={val}
                        onClick={() => setDisplayAmount(val.toLocaleString())}
                        className="py-2 bg-slate-100 dark:bg-slate-700 hover:bg-emerald-500 hover:text-white rounded-xl text-xs font-bold transition-all"
                      >
                        +${val.toLocaleString()}
                      </button>
                    ))}
                    <button 
                      onClick={() => setDisplayAmount(selectedLoan.balanceDue.toLocaleString())}
                      className="col-span-3 py-2 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500 hover:text-white rounded-xl text-xs font-black transition-all uppercase tracking-widest"
                    >
                      Saldar Préstamo (${selectedLoan.balanceDue.toLocaleString()})
                    </button>
                  </div>
                </div>

                <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-2xl border border-amber-100 dark:border-amber-800 flex gap-3">
                  <Info className="text-amber-600 shrink-0" size={20} />
                  <p className="text-xs text-amber-700 dark:text-amber-400 leading-relaxed">
                    El sistema aplicará el pago automáticamente en cascada: primero a <strong>moras</strong>, luego a <strong>intereses</strong> y finalmente a <strong>capital</strong> de las cuotas más antiguas.
                  </p>
                </div>

                <button
                  onClick={handleProcessPayment}
                  disabled={isSubmitting || !displayAmount || parseFloat(displayAmount.replace(/,/g, '')) <= 0}
                  className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 dark:disabled:bg-slate-700 text-white rounded-2xl font-black text-lg shadow-xl shadow-emerald-500/30 transition-all transform active:scale-95 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>Confirmar Pago <ArrowRight size={20} /></>
                  )}
                </button>
              </div>
            </div>
          ) : (
            <div className="h-full min-h-[400px] bg-slate-50 dark:bg-slate-900/50 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center p-8 text-center">
              <div className="p-6 bg-white dark:bg-slate-800 rounded-full shadow-lg mb-4 text-slate-300">
                <Wallet size={48} />
              </div>
              <h3 className="text-lg font-bold text-slate-400">Selecciona un préstamo</h3>
              <p className="text-sm text-slate-400 mt-2 max-w-[200px]">Elige un cliente del listado para registrar un nuevo pago</p>
            </div>
          )}

          {success && (
            <div className="mt-6 bg-white dark:bg-slate-800 rounded-3xl shadow-xl p-8 border border-emerald-100 dark:border-emerald-900 animate-bounce-in">
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 rounded-full flex items-center justify-center mb-4">
                  <CheckCircle2 size={32} />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">¡Pago Procesado!</h3>
                <p className="text-sm text-slate-500 mt-1">El monto ha sido distribuido exitosamente.</p>
                
                <div className="w-full mt-6 space-y-2">
                  {transactions.map((tx, idx) => (
                    <div key={idx} className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-900 rounded-xl text-xs">
                      <span className="text-slate-500 font-medium">{tx.description}</span>
                      <span className="font-bold text-emerald-600">+${tx.amount.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentsPage;
