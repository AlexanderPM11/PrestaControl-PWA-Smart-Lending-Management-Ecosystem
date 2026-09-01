import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Edit3, DollarSign, History, Clock, List, CreditCard } from 'lucide-react';
import api from '../api/api';
import { useToast } from '../context/ToastContext';

const LoanDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loan, setLoan] = useState<any>(null);
  const [payments, setPayments] = useState<any[]>([]);
  const [audits, setAudits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'historial' | 'auditoria' | 'cuotas'>('historial');
  const [editingPayment, setEditingPayment] = useState<any>(null);
  const [editCapital, setEditCapital] = useState('');
  const [editInterest, setEditInterest] = useState('');
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);
  const toast = useToast();

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
      toast.error('Error cargando los detalles del préstamo.');
      navigate('/loans');
    } finally {
      setLoading(false);
    }
  };

  const handleEditPaymentSubmit = async () => {
    if (!editingPayment) return;
    const numCap = parseFloat(editCapital.replace(/,/g, '')) || 0;
    const numInt = parseFloat(editInterest.replace(/,/g, '')) || 0;

    if (numCap < 0 || numInt < 0 || (numCap === 0 && numInt === 0)) {
      toast.warning('Debe ingresar al menos un monto válido');
      return;
    }

    try {
      setIsSubmittingEdit(true);
      await api.put(`/payments/${editingPayment.id}`, {
        capitalAmount: numCap,
        interestAmount: numInt,
        notes: editingPayment.notes // keep existing notes
      });
      toast.success('Pago actualizado correctamente');
      setEditingPayment(null);
      fetchData(); // Refresh loan balance and payments
    } catch (err: any) {
      console.error('Error updating payment:', err);
      toast.error(err.response?.data?.message || 'Error al actualizar el pago');
    } finally {
      setIsSubmittingEdit(false);
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
          Préstamo #{loan.id.toString().padStart(4, '0')} • {new Date(loan.startDate).toLocaleString('es-DO', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true })}
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
                <div key={payment.id} className="p-4 bg-sage-50 rounded-2xl flex flex-col gap-2 relative group">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[10px] font-bold text-sage-400 uppercase font-sans">#{payment.id.toString().padStart(6, '0')}</span>
                      <p className="text-sm font-bold text-sage-900 font-sans mt-0.5">
                        {new Date(payment.paymentDate).toLocaleString('es-DO', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true })}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-black text-financial-green font-display">+${payment.amount.toLocaleString()}</p>
                      <button 
                        onClick={() => {
                          setEditingPayment(payment);
                          setEditCapital(payment.capitalAmount?.toString() || '0');
                          setEditInterest(payment.interestAmount?.toString() || '0');
                        }}
                        className="text-sage-400 hover:text-tangerine-500 mt-1 transition-colors float-right"
                        title="Editar Pago"
                      >
                        <Edit3 size={14} />
                      </button>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center text-xs bg-white/50 p-2 rounded-lg border border-sage-100 mt-1">
                    <p className="text-sage-600 font-medium">Capital: <span className="font-bold text-sage-900">${(payment.capitalAmount || 0).toLocaleString()}</span></p>
                    <p className="text-sage-600 font-medium">Interés: <span className="font-bold text-tangerine-600">${(payment.interestAmount || 0).toLocaleString()}</span></p>
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
                        Vence: {new Date(inst.dueDate).toLocaleString('es-DO', { day: '2-digit', month: 'short', year: 'numeric' })}
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
                            {new Date(audit.date).toLocaleString('es-DO', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true })}
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
      {/* Edit Payment Modal */}
      {editingPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-sage-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-[32px] p-6 w-full max-w-md shadow-2xl space-y-6">
            <h3 className="text-xl font-black text-sage-900 font-display">Editar Pago #{editingPayment.id}</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-sage-500 uppercase tracking-widest font-sans mb-1">Abono a Capital</label>
                <input
                  type="text"
                  value={editCapital}
                  onChange={(e) => {
                    const val = e.target.value.replace(/[^0-9.]/g, '');
                    const parts = val.split('.');
                    if(parts[0]) parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
                    setEditCapital(parts.join('.'));
                  }}
                  className="w-full px-4 py-3 bg-sage-50 border border-sage-200 rounded-xl font-bold focus:ring-2 focus:ring-tangerine-500 outline-none text-sage-900"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-sage-500 uppercase tracking-widest font-sans mb-1">Pago de Interés</label>
                <input
                  type="text"
                  value={editInterest}
                  onChange={(e) => {
                    const val = e.target.value.replace(/[^0-9.]/g, '');
                    const parts = val.split('.');
                    if(parts[0]) parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
                    setEditInterest(parts.join('.'));
                  }}
                  className="w-full px-4 py-3 bg-sage-50 border border-sage-200 rounded-xl font-bold focus:ring-2 focus:ring-tangerine-500 outline-none text-sage-900"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setEditingPayment(null)}
                className="flex-1 py-3.5 bg-sage-100 hover:bg-sage-200 text-sage-700 rounded-2xl font-bold transition-all font-sans"
              >
                Cancelar
              </button>
              <button
                onClick={handleEditPaymentSubmit}
                disabled={isSubmittingEdit}
                className="flex-1 py-3.5 bg-tangerine-500 hover:bg-tangerine-600 text-white rounded-2xl font-black shadow-lg shadow-tangerine-500/30 transition-all flex justify-center items-center font-sans disabled:opacity-50"
              >
                {isSubmittingEdit ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default LoanDetailsPage;
