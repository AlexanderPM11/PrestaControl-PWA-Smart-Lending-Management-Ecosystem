import React, { useState, useEffect } from 'react';
import { Landmark, Plus, Search, Calendar, ChevronRight, AlertCircle, CheckCircle2, Trash2, XCircle, RefreshCw } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../api/api';
import { useToast } from '../context/ToastContext';
import ConfirmDialog, { type ConfirmDialogType } from '../components/ui/ConfirmDialog';

const LoansPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const clientIdFilter = Number(searchParams.get('clientId')) || null;
  const [loans, setLoans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'activos' | 'pagados' | 'anulados'>('activos');
  const toast = useToast();
  const [modalConfig, setModalConfig] = useState<{isOpen: boolean, type: ConfirmDialogType, actionType: 'cancel' | 'delete' | 'reactivate', loanId: number | null, title: string, message: string, error?: string}>({
    isOpen: false,
    type: 'warning',
    actionType: 'cancel',
    loanId: null,
    title: '',
    message: '',
    error: undefined
  });

  useEffect(() => {
    fetchLoans();
  }, []);

  const fetchLoans = async () => {
    try {
      const response = await api.get(`/loans`);
      setLoans(response.data);
    } catch (err) {
      toast.error('Error al cargar la lista de préstamos');
      console.error('Error fetching loans:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelLoan = (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    setModalConfig({
      isOpen: true,
      type: 'warning',
      actionType: 'cancel',
      loanId: id,
      title: 'Anular Préstamo',
      message: '¿Estás seguro de que deseas ANULAR este préstamo? No podrá recibir pagos y se marcará como inactivo.'
    });
  };

  const handleDeleteLoan = (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    setModalConfig({
      isOpen: true,
      type: 'danger',
      actionType: 'delete',
      loanId: id,
      title: 'Eliminar Préstamo',
      message: '¿Estás totalmente seguro de que deseas ELIMINAR este préstamo de la base de datos? Esta acción es irreversible.'
    });
  };

  const handleReactivateLoan = (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    setModalConfig({
      isOpen: true,
      type: 'success',
      actionType: 'reactivate',
      loanId: id,
      title: 'Reactivar Préstamo',
      message: '¿Deseas REACTIVAR este préstamo? Volverá a la lista de activos y podrá recibir pagos nuevamente.'
    });
  };

  const confirmAction = async () => {
    if (!modalConfig.loanId) return;
    try {
      if (modalConfig.actionType === 'cancel') {
        await api.put(`/loans/${modalConfig.loanId}/cancel`);
        toast.warning('El préstamo ha sido anulado.');
      } else if (modalConfig.actionType === 'reactivate') {
        await api.put(`/loans/${modalConfig.loanId}/reactivate`);
        toast.success('El préstamo fue reactivado exitosamente.');
      } else {
        await api.delete(`/loans/${modalConfig.loanId}`);
        toast.success('El préstamo fue eliminado del sistema.');
      }
      setModalConfig({ ...modalConfig, isOpen: false });
      fetchLoans();
    } catch (err: any) {
      console.error('Error in confirmAction:', err);
      const errorMsg = err.response?.data?.message || 'Error al procesar la solicitud.';
      toast.error(errorMsg);
      setModalConfig({ ...modalConfig, isOpen: false });
    }
  };

  const stats = [
    { label: 'Total en Calle', value: loans.reduce((acc, l) => acc + l.balanceDue, 0), icon: Landmark, color: 'text-sage-700', bg: 'bg-sage-200' },
    { label: 'En Mora', value: loans.filter(l => l.status === 'Overdue').length, icon: AlertCircle, color: 'text-tangerine-500', bg: 'bg-tangerine-400/20' },
  ];

  const filteredLoans = loans.filter(l => {
    const matchesClient = !clientIdFilter || l.clientId === clientIdFilter;
    const matchesSearch = l.clientName.toLowerCase().includes(search.toLowerCase());
    if (activeTab === 'activos') return matchesClient && matchesSearch && (l.status === 'Active' || l.status === 'Overdue');
    if (activeTab === 'pagados') return matchesClient && matchesSearch && l.status === 'Paid';
    if (activeTab === 'anulados') return matchesClient && matchesSearch && l.status === 'Cancelled';
    return matchesClient && matchesSearch;
  });

  return (
    <div className="space-y-6 pt-2">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-black text-sage-900 font-display">Préstamos</h2>
          <p className="text-sage-500 text-sm font-medium font-sans">Gestión de cartera</p>
        </div>
        <button 
          onClick={() => navigate('/loans/new')}
          className="bg-tangerine-500 text-white p-3 rounded-2xl shadow-lg shadow-tangerine-500/30 active:scale-95 transition-transform"
        >
          <Plus size={24} />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {stats.map((stat, idx) => (
          <div key={idx} className="bg-white p-4 rounded-3xl shadow-sm border border-sage-100 flex flex-col justify-between h-28">
            <div className={`w-8 h-8 ${stat.bg} rounded-xl flex items-center justify-center mb-2`}>
              <stat.icon className={stat.color} size={16} />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-sage-400 font-sans">{stat.label}</p>
              <p className="text-xl font-black text-sage-900 font-display">
                {typeof stat.value === 'number' && stat.label !== 'En Mora' 
                  ? `$${stat.value.toLocaleString()}` 
                  : stat.value}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white p-2 rounded-[24px] shadow-sm border border-sage-100 flex items-center">
        <Search className="text-sage-400 ml-3" size={20} />
        <input 
          type="text" 
          placeholder="Buscar cliente..." 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-transparent border-none focus:ring-0 px-3 py-2 text-sage-900 placeholder-sage-400 font-sans outline-none"
        />
      </div>

      <div className="flex bg-sage-100 p-1 rounded-2xl">
        <button 
          onClick={() => setActiveTab('activos')}
          className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all font-sans ${activeTab === 'activos' ? 'bg-white text-sage-900 shadow-sm' : 'text-sage-500 hover:text-sage-700'}`}
        >
          Activos
        </button>
        <button 
          onClick={() => setActiveTab('pagados')}
          className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all font-sans ${activeTab === 'pagados' ? 'bg-white text-sage-900 shadow-sm' : 'text-sage-500 hover:text-sage-700'}`}
        >
          Pagados
        </button>
        <button 
          onClick={() => setActiveTab('anulados')}
          className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all font-sans ${activeTab === 'anulados' ? 'bg-white text-sage-900 shadow-sm' : 'text-sage-500 hover:text-sage-700'}`}
        >
          Anulados
        </button>
      </div>

      <div className="space-y-4">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-3 border-sage-100 border-t-tangerine-500 rounded-full animate-spin" />
          </div>
        ) : filteredLoans.length > 0 ? (
          filteredLoans.map((loan) => {
            const progress = ((loan.totalToPay - loan.balanceDue) / loan.totalToPay) * 100;
            return (
              <div 
                key={loan.id} 
                onClick={() => navigate(`/loans/details/${loan.id}`)}
                className="bg-white rounded-3xl p-5 shadow-sm border border-sage-100 flex flex-col gap-4 active:scale-[0.98] transition-transform"
              >
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-sage-100 rounded-2xl flex items-center justify-center text-sage-600 font-black font-display text-xl">
                      {loan.clientName.charAt(0)}
                    </div>
                    <div>
                      <p className="font-bold text-sage-900 text-sm font-sans">{loan.clientName}</p>
                      <p className="text-[10px] text-sage-500 font-bold uppercase flex items-center gap-1">
                        <Calendar size={10} /> {new Date(loan.startDate).toLocaleString('es-DO', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true })}
                      </p>
                    </div>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                    loan.status === 'Cancelled' ? 'bg-sage-100 text-sage-500' : 
                    loan.status === 'Paid' ? 'bg-sage-900 text-white' : 
                    loan.status === 'Overdue' ? 'bg-red-100 text-red-600' : 
                    'bg-tangerine-100 text-tangerine-600'
                  }`}>
                    {loan.status === 'Cancelled' ? 'Anulado' : loan.status === 'Paid' ? 'Pagado' : loan.status === 'Overdue' ? 'En Mora' : 'Activo'}
                  </span>
                </div>

                <div className="flex justify-between items-end">
                  <div>
                    <p className="text-[10px] text-sage-400 font-bold uppercase tracking-widest font-sans mb-1">Total</p>
                    <p className="text-xl font-black text-sage-900 font-display">${loan.amount.toLocaleString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-sage-400 font-bold uppercase tracking-widest font-sans mb-1">Pendiente</p>
                    <p className="text-xl font-black text-tangerine-500 font-display">${loan.balanceDue.toLocaleString()}</p>
                  </div>
                </div>

                <div className="w-full h-1.5 bg-sage-100 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-1000 ${loan.status === 'Overdue' ? 'bg-red-500' : 'bg-tangerine-500'}`}
                    style={{ width: `${progress}%` }}
                  />
                </div>

                <div className="flex justify-between items-center mt-2 border-t border-sage-100 pt-3">
                  <div className="flex gap-2">
                    {loan.status !== 'Cancelled' && loan.status !== 'Paid' && (
                      <button 
                        onClick={(e) => handleCancelLoan(e, loan.id)}
                        className="w-8 h-8 flex items-center justify-center bg-sage-50 text-sage-400 hover:text-amber-500 hover:bg-amber-50 rounded-full transition-colors"
                      >
                        <XCircle size={16} />
                      </button>
                    )}
                    {loan.status === 'Cancelled' && (
                      <button 
                        onClick={(e) => handleReactivateLoan(e, loan.id)}
                        className="w-8 h-8 flex items-center justify-center bg-sage-50 text-sage-400 hover:text-emerald-500 hover:bg-emerald-50 rounded-full transition-colors"
                      >
                        <RefreshCw size={16} />
                      </button>
                    )}
                    <button 
                      onClick={(e) => handleDeleteLoan(e, loan.id)}
                      className="w-8 h-8 flex items-center justify-center bg-sage-50 text-sage-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <ChevronRight size={20} className="text-sage-300" />
                </div>
              </div>
            );
          })
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center bg-white rounded-3xl border border-dashed border-sage-200">
            <div className="w-16 h-16 bg-sage-50 rounded-full flex items-center justify-center mb-4 text-sage-300">
              <CheckCircle2 size={32} />
            </div>
            <h3 className="text-lg font-bold text-sage-900 font-display">Lista Vacía</h3>
            <p className="text-sage-500 text-sm font-medium mt-1 font-sans">No hay préstamos para mostrar aquí.</p>
          </div>
        )}
      </div>

      <ConfirmDialog 
        isOpen={modalConfig.isOpen}
        type={modalConfig.type}
        title={modalConfig.title}
        message={modalConfig.message}
        onConfirm={confirmAction}
        onCancel={() => setModalConfig({ ...modalConfig, isOpen: false })}
      />
    </div>
  );
};

export default LoansPage;
