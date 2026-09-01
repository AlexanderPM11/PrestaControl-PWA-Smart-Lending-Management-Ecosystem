import React, { useState, useEffect } from 'react';
import { Wallet, Search, ArrowLeft, DollarSign, Calendar, Info, CheckCircle2 } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import api from '../api/api';
import { useToast } from '../context/ToastContext';

const PaymentsPage: React.FC = () => {
  const [loans, setLoans] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [selectedLoan, setSelectedLoan] = useState<any>(null);
  const [capitalAmount, setCapitalAmount] = useState<string>('');
  const [interestAmount, setInterestAmount] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [transactions, setTransactions] = useState<any[]>([]);
  const toast = useToast();

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
      toast.error('Error al cargar la lista de préstamos pendientes');
    }
  };

  const handleProcessPayment = async () => {
    const numCapital = parseFloat(capitalAmount.replace(/,/g, '')) || 0;
    const numInterest = parseFloat(interestAmount.replace(/,/g, '')) || 0;
    
    if (!selectedLoan || (numCapital <= 0 && numInterest <= 0)) return;

    if (numCapital > selectedLoan.balanceDue + 0.01) {
      toast.warning(`El abono a capital (${numCapital.toLocaleString()}) no puede ser mayor al saldo pendiente (${selectedLoan.balanceDue.toLocaleString()})`);
      return;
    }

    setIsSubmitting(true);
    setSuccess(false);

    try {
      const response = await api.post(`/payments`, {
        loanId: selectedLoan.id,
        capitalAmount: numCapital,
        interestAmount: numInterest,
        paymentMethod: 'Efectivo',
        notes: 'Pago recibido desde la PWA'
      });
      setTransactions(response.data);
      setSuccess(true);
      fetchPendingLoans();
      setCapitalAmount('');
      setInterestAmount('');
      toast.success('Pago procesado correctamente');
    } catch (err) {
      console.error('Error processing payment:', err);
      toast.error('Error al procesar el pago');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredLoans = loans.filter(l => 
    l.clientName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 pt-2">
      {/* Header */}
      {!selectedLoan ? (
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-financial-green shadow-sm border border-sage-100">
            <DollarSign size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-sage-900 font-display">Cobros</h1>
            <p className="text-sage-500 text-sm font-medium font-sans">Selecciona un cliente</p>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-4">
          <button 
            onClick={() => { setSelectedLoan(null); setSuccess(false); }}
            className="p-3 bg-white rounded-full shadow-sm text-sage-900 hover:bg-sage-100 transition-colors"
          >
            <ArrowLeft size={24} />
          </button>
          <div>
            <h1 className="text-xl font-black text-sage-900 font-display truncate w-48">{selectedLoan.clientName}</h1>
            <p className="text-sage-500 text-sm font-medium font-sans flex items-center gap-1">
              <Calendar size={12} /> Préstamo #{selectedLoan.id}
            </p>
          </div>
        </div>
      )}

      {/* Main Content */}
      {!selectedLoan ? (
        <>
          <div className="bg-white p-2 rounded-[24px] shadow-sm border border-sage-100 flex items-center">
            <Search className="text-sage-400 ml-3" size={20} />
            <input 
              type="text" 
              placeholder="Buscar por cliente..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-transparent border-none focus:ring-0 px-3 py-2 text-sage-900 placeholder-sage-400 font-sans outline-none"
            />
          </div>

          <div className="space-y-3 pb-6">
            {filteredLoans.map((loan) => (
              <button
                key={loan.id}
                onClick={() => setSelectedLoan(loan)}
                className="w-full text-left p-5 rounded-3xl bg-white border border-sage-100 shadow-sm active:scale-95 transition-transform"
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-bold text-sage-900 font-sans">{loan.clientName}</h3>
                    <p className="text-xs text-sage-500 font-medium">Préstamo #{loan.id}</p>
                  </div>
                  <span className={`px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-widest ${
                    loan.status === 'Overdue' ? 'bg-red-100 text-red-600' : 'bg-sage-100 text-sage-600'
                  }`}>
                    {loan.status === 'Overdue' ? 'Mora' : 'Activo'}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-4 border-t border-sage-100 pt-3">
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-sage-400 font-bold font-sans">Saldo Pendiente</p>
                    <p className="text-xl font-black text-tangerine-500 font-display">${loan.balanceDue.toLocaleString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] uppercase tracking-widest text-sage-400 font-bold font-sans">Monto Total</p>
                    <p className="text-sm font-bold text-sage-500">${loan.totalToPay.toLocaleString()}</p>
                  </div>
                </div>
              </button>
            ))}
            {filteredLoans.length === 0 && (
              <div className="text-center py-12">
                <p className="text-sage-400 font-medium font-sans">No se encontraron clientes.</p>
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="space-y-6">
          {!success ? (
            <div className="bg-white rounded-[32px] border border-sage-100 shadow-sm p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-sage-500 uppercase tracking-widest font-sans mb-2 ml-1">Abono a Capital</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-bold text-sage-400">$</span>
                    <input
                      type="text"
                      value={capitalAmount}
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^0-9.]/g, '');
                        if (val === '') {
                          setCapitalAmount('');
                          return;
                        }
                        const parts = val.split('.');
                        parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
                        setCapitalAmount(parts.join('.'));
                      }}
                      placeholder="0.00"
                      className="input-field pl-9 text-2xl font-black font-display py-4"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-sage-500 uppercase tracking-widest font-sans mb-2 ml-1">Pago de Interés</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-bold text-sage-400">$</span>
                    <input
                      type="text"
                      value={interestAmount}
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^0-9.]/g, '');
                        if (val === '') {
                          setInterestAmount('');
                          return;
                        }
                        const parts = val.split('.');
                        parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
                        setInterestAmount(parts.join('.'));
                      }}
                      placeholder="0.00"
                      className="input-field pl-9 text-2xl font-black font-display py-4"
                    />
                  </div>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2">
                {[100, 500, 1000].map(val => (
                  <button 
                    key={val}
                    onClick={() => {
                      const current = parseFloat(capitalAmount.replace(/,/g, '')) || 0;
                      setCapitalAmount((current + val).toLocaleString());
                    }}
                    className="py-2.5 bg-sage-50 hover:bg-sage-100 rounded-xl text-xs font-bold transition-all text-sage-700 font-sans"
                  >
                    +${val.toLocaleString()}
                  </button>
                ))}
                <button 
                  onClick={() => setCapitalAmount(selectedLoan.balanceDue.toLocaleString())}
                  className="col-span-3 py-3 bg-tangerine-50 text-tangerine-600 border border-tangerine-200 hover:bg-tangerine-100 rounded-xl text-xs font-black transition-all uppercase tracking-widest font-sans"
                >
                  Saldar Capital (${selectedLoan.balanceDue.toLocaleString()})
                </button>
              </div>
              
              <div className="p-4 bg-sage-50 rounded-2xl flex gap-3 items-start border border-sage-100">
                <Info className="text-sage-500 shrink-0 mt-0.5" size={18} />
                <p className="text-xs text-sage-600 leading-relaxed font-medium">
                  El abono a capital descontará directamente del préstamo. El pago de interés no reduce el saldo de la deuda.
                </p>
              </div>

              <button
                onClick={handleProcessPayment}
                disabled={isSubmitting || (!capitalAmount && !interestAmount)}
                className="w-full bg-financial-green text-white py-4 rounded-2xl font-black text-lg shadow-lg shadow-financial-green/30 transition-all active:scale-95 flex items-center justify-center disabled:opacity-50 disabled:active:scale-100 font-sans"
              >
                {isSubmitting ? (
                  <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  'Confirmar Pago'
                )}
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-[32px] shadow-sm p-8 border border-sage-100 text-center space-y-4">
              <div className="w-20 h-20 bg-financial-green/10 text-financial-green rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 size={40} />
              </div>
              <div>
                <h3 className="text-2xl font-black text-sage-900 font-display">¡Pago Exitoso!</h3>
                <p className="text-sm text-sage-500 font-medium font-sans mt-1">El monto fue distribuido correctamente.</p>
              </div>
              
              <div className="space-y-2 mt-6">
                {transactions.map((tx, idx) => (
                  <div key={idx} className="flex justify-between items-center p-3 bg-sage-50 rounded-xl text-xs">
                    <span className="text-sage-600 font-medium">{tx.description}</span>
                    <span className="font-bold text-financial-green">+${tx.amount.toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <button
                onClick={() => { setSelectedLoan(null); setSuccess(false); }}
                className="btn-primary mt-6 w-full py-4"
              >
                Volver a Cobros
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PaymentsPage;
