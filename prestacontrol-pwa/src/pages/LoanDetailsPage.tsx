import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Edit3, DollarSign, History, Clock, List, CreditCard } from 'lucide-react';
import api from '../api/api';

const LoanDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loan, setLoan] = useState<any>(null);
  const [payments, setPayments] = useState<any[]>([]);
  const [audits, setAudits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'historial' | 'auditoria' | 'cuotas'>('historial');

  useEffect(() => {
    if (id) {
      fetchData();
    }
  }, [id]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [loanRes, paymentsRes, auditsRes] = await Promise.all([
        api.get(`/loans/${id}`),
        api.get(`/loans/${id}/payments`),
        api.get(`/loans/${id}/audits`)
      ]);
      setLoan(loanRes.data);
      setPayments(paymentsRes.data);
      setAudits(auditsRes.data);
    } catch (err) {
      console.error('Error fetching loan details:', err);
      alert('Error cargando los detalles del préstamo.');
      navigate('/loans');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-sage-200 border-t-financial-green rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!loan) return null;

  const progress = ((loan.totalToPay - loan.balanceDue) / loan.totalToPay) * 100;

  return (
    <div className="space-y-6 pt-2 pb-24 animate-fade-in-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button 
          onClick={() => navigate('/loans')}
          className="p-3 bg-white rounded-full shadow-sm text-sage-900 hover:bg-sage-100 transition-colors"
        >
          <ChevronLeft size={24} />
        </button>
      </div>

      <div className="flex flex-col items-center text-center space-y-3">
        <div className="w-16 h-16 bg-sage-900 text-white font-display text-2xl rounded-[20px] flex items-center justify-center shadow-lg shadow-sage-900/20">
          {loan.clientName.charAt(0).toUpperCase()}
        </div>
        <div>
          <h1 className="text-2xl font-black text-sage-900 font-display">{loan.clientName}</h1>
          <p className="text-sage-500 font-medium text-sm font-sans mt-1">
            Préstamo #{loan.id.toString().padStart(4, '0')} • Creado el {new Date(loan.startDate).toLocaleDateString()}
          </p>
        </div>
      </div>

      <div className="flex gap-3">
        <button 
          onClick={() => navigate(`/loans/edit/${loan.id}`)}
          className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-white border border-sage-200 hover:bg-sage-50 text-sage-700 rounded-2xl font-bold transition-all shadow-sm font-sans"
        >
          <Edit3 size={18} /> Editar
        </button>
        {loan.status !== 'Cancelled' && loan.status !== 'Paid' && (
          <button 
            onClick={() => navigate(`/payments?loanId=${loan.id}`)}
            className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-tangerine-500 hover:bg-tangerine-600 text-white rounded-2xl font-black shadow-lg shadow-tangerine-500/30 transition-all active:scale-95 font-sans"
          >
            <DollarSign size={18} /> Cobrar
          </button>
        )}
      </div>

      {/* Cards */}
      <div className="space-y-3">
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-sage-100">
          <p className="text-[10px] font-black uppercase tracking-widest text-sage-400 font-sans mb-1">Monto Principal</p>
          <p className="text-2xl font-black text-sage-900 font-display">${loan.amount.toLocaleString()}</p>
          <p className="text-[10px] font-bold text-sage-400 font-sans mt-1">Capital inicial</p>
        </div>
        
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-sage-100">
          <p className="text-[10px] font-black uppercase tracking-widest text-sage-400 font-sans mb-1">Total a Pagar</p>
          <p className="text-2xl font-black text-financial-green font-display">${loan.totalToPay.toLocaleString()}</p>
          <p className="text-[10px] font-bold text-sage-400 font-sans mt-1">Incluye intereses ({loan.interestRate}%)</p>
        </div>

        <div className="bg-white p-6 rounded-3xl shadow-sm border border-sage-100">
          <p className="text-[10px] font-black uppercase tracking-widest text-sage-400 font-sans mb-1">Total Pagado</p>
          <p className="text-2xl font-black text-sage-900 font-display">${(loan.totalToPay - loan.balanceDue).toLocaleString()}</p>
          <div className="w-full bg-sage-100 h-1.5 rounded-full mt-3 overflow-hidden">
            <div 
              className="bg-financial-green h-full transition-all duration-1000" 
              style={{ width: `${Math.min(100, progress)}%` }}
            />
          </div>
        </div>

        <div className="bg-tangerine-500 p-6 rounded-3xl shadow-lg shadow-tangerine-500/20 relative overflow-hidden text-white border border-tangerine-600/30">
          <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
          <p className="text-[10px] font-black uppercase tracking-widest text-tangerine-100 font-sans mb-1">Saldo Pendiente</p>
          <p className="text-3xl font-black font-display">${loan.balanceDue.toLocaleString()}</p>
          <div className="w-full bg-tangerine-600 h-1.5 rounded-full mt-3 overflow-hidden">
            <div 
              className="bg-white h-full transition-all duration-1000" 
              style={{ width: `${Math.max(0.5, progress)}%` }}
            />
          </div>
          <div className="mt-4 flex items-center justify-between font-sans">
            <span className={`px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-widest bg-white text-tangerine-600`}>
              {loan.status === 'Cancelled' ? 'Anulado' : loan.status === 'Paid' ? 'Completado' : loan.status === 'Overdue' ? 'En Mora' : 'Activo'}
            </span>
            <p className="text-[10px] font-black text-white tracking-widest uppercase">
              {progress > 0 && progress < 1 ? progress.toFixed(2) : Math.round(progress)}% PAGADO
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-[32px] shadow-sm border border-sage-100 overflow-hidden">
        <div className="flex bg-sage-50 m-2 rounded-2xl p-1">
            <button 
              onClick={() => setActiveTab('historial')}
              className={`flex-1 flex justify-center items-center gap-2 py-3 rounded-xl text-xs font-bold transition-all ${activeTab === 'historial' ? 'bg-white text-sage-900 shadow-sm' : 'text-sage-500'}`}
            >
              <History size={16} /> Pagos
            </button>
            <button 
              onClick={() => setActiveTab('cuotas')}
              className={`flex-1 flex justify-center items-center gap-2 py-3 rounded-xl text-xs font-bold transition-all ${activeTab === 'cuotas' ? 'bg-white text-sage-900 shadow-sm' : 'text-sage-500'}`}
            >
              <List size={16} /> Cuotas
            </button>
            <button 
              onClick={() => setActiveTab('auditoria')}
              className={`flex-1 flex justify-center items-center gap-2 py-3 rounded-xl text-xs font-bold transition-all ${activeTab === 'auditoria' ? 'bg-white text-sage-900 shadow-sm' : 'text-sage-500'}`}
            >
              <Clock size={16} /> Cambios
            </button>
        </div>

        <div className="p-2">
          {activeTab === 'historial' ? (
            <div className="space-y-2">
              {payments.length > 0 ? payments.map((payment: any) => (
                <div key={payment.id} className="p-4 bg-sage-50 rounded-2xl flex flex-col gap-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[10px] font-bold text-sage-400 uppercase font-sans">#{payment.id.toString().padStart(6, '0')}</span>
                      <p className="text-sm font-bold text-sage-900 font-sans mt-0.5">
                        {new Date(payment.paymentDate).toLocaleDateString()}
                      </p>
                    </div>
                    <p className="font-black text-financial-green font-display">+${payment.amount.toLocaleString()}</p>
                  </div>
                  <div className="flex justify-between items-center mt-1">
                    <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-1 bg-white text-sage-600 rounded-lg">
                      <CreditCard size={10} /> {payment.paymentMethod}
                    </span>
                    {payment.notes && (
                      <p className="text-xs text-sage-500 italic max-w-[150px] truncate" title={payment.notes}>
                        {payment.notes}
                      </p>
                    )}
                  </div>
                </div>
              )) : (
                <div className="py-10 text-center">
                  <div className="w-12 h-12 bg-sage-50 rounded-full flex items-center justify-center mx-auto mb-3 text-sage-400">
                    <History size={24} />
                  </div>
                  <h3 className="text-sm font-bold text-sage-500 font-sans">Sin pagos</h3>
                  <p className="text-sage-400 text-xs mt-1 font-sans">Aún no hay abonos.</p>
                </div>
              )}
            </div>
          ) : activeTab === 'cuotas' ? (
            <div className="space-y-2">
              {loan.installments.map((inst: any) => (
                <div key={inst.id} className="p-4 bg-sage-50 rounded-2xl flex flex-col gap-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[10px] font-bold text-sage-400 uppercase font-sans">Cuota {inst.installmentNumber}</span>
                      <p className="text-sm font-bold text-sage-900 font-sans mt-0.5">
                        Vence: {new Date(inst.dueDate).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-black text-sage-900 font-display">${inst.amount.toLocaleString()}</p>
                      <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest mt-1 inline-block ${
                        inst.status === 'Paid' ? 'bg-financial-green/10 text-financial-green' :
                        inst.status === 'Overdue' ? 'bg-red-100 text-red-600' :
                        inst.status === 'Partial' ? 'bg-tangerine-100 text-tangerine-600' :
                        'bg-sage-200 text-sage-600'
                      }`}>
                        {inst.status === 'Paid' ? 'Pagada' : inst.status === 'Overdue' ? 'Vencida' : inst.status === 'Partial' ? 'Parcial' : 'Pendiente'}
                      </span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center text-xs font-sans mt-1 pt-2 border-t border-sage-200/50">
                    <p className="text-sage-500">Pagado: <span className="font-bold text-financial-green">${inst.paidAmount.toLocaleString()}</span></p>
                    <p className="text-sage-500">Debe: <span className="font-bold text-tangerine-500">${(inst.amount - inst.paidAmount).toLocaleString()}</span></p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4">
              {audits.length > 0 ? (
                <div className="space-y-4">
                  {audits.map((audit) => (
                    <div key={audit.id} className="flex gap-3 items-start">
                      <div className="mt-1 flex flex-col items-center">
                        <div className="w-2.5 h-2.5 rounded-full bg-sage-300"></div>
                        <div className="w-0.5 h-full min-h-[30px] bg-sage-100 mt-1"></div>
                      </div>
                      <div className="flex-1 pb-2">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] font-black uppercase tracking-widest text-sage-600 font-sans">
                            {audit.action}
                          </span>
                          <span className="text-[9px] font-bold text-sage-400 font-sans">
                            {new Date(audit.date).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="bg-sage-50 p-3 rounded-xl">
                          <p className="text-xs text-sage-700 font-medium font-sans whitespace-pre-wrap leading-relaxed">
                            {audit.changesDescription}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-10 text-center">
                  <div className="w-12 h-12 bg-sage-50 rounded-full flex items-center justify-center mx-auto mb-3 text-sage-400">
                    <Clock size={24} />
                  </div>
                  <h3 className="text-sm font-bold text-sage-500 font-sans">Sin cambios</h3>
                  <p className="text-sage-400 text-xs mt-1 font-sans">No hay registro de modificaciones.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoanDetailsPage;
