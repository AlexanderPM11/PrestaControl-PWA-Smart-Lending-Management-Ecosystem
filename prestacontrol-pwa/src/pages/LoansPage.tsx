import React, { useState, useEffect } from 'react';
import { Landmark, Plus, Filter, Search, Calendar, ChevronRight, TrendingUp, AlertCircle, CheckCircle2, Trash2, XCircle, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../api/api';

const LoansPage: React.FC = () => {
  const navigate = useNavigate();
  const [loans, setLoans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'activos' | 'pagados' | 'anulados'>('activos');
  const [modalConfig, setModalConfig] = useState<{isOpen: boolean, type: 'cancel' | 'delete' | 'reactivate', loanId: number | null, title: string, message: string, error?: string}>({
    isOpen: false,
    type: 'cancel',
    loanId: null,
    title: '',
    message: '',
    error: undefined
  });

  const API_URL = import.meta.env.VITE_API_URL;

  useEffect(() => {
    fetchLoans();
  }, []);

  const fetchLoans = async () => {
    try {
      const response = await api.get(`/loans`);
      setLoans(response.data);
    } catch (err) {
      console.error('Error fetching loans:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelLoan = (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    setModalConfig({
      isOpen: true,
      type: 'cancel',
      loanId: id,
      title: 'Anular Préstamo',
      message: '¿Estás seguro de que deseas ANULAR este préstamo? No podrá recibir pagos y se marcará como inactivo.'
    });
  };

  const handleDeleteLoan = (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    setModalConfig({
      isOpen: true,
      type: 'delete',
      loanId: id,
      title: 'Eliminar Préstamo',
      message: '¿Estás totalmente seguro de que deseas ELIMINAR este préstamo de la base de datos? Esta acción es irreversible.'
    });
  };

  const handleReactivateLoan = (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    setModalConfig({
      isOpen: true,
      type: 'reactivate',
      loanId: id,
      title: 'Reactivar Préstamo',
      message: '¿Deseas REACTIVAR este préstamo? Volverá a la lista de activos y podrá recibir pagos nuevamente.'
    });
  };

  const confirmAction = async () => {
    if (!modalConfig.loanId) return;
    try {
      if (modalConfig.type === 'cancel') {
        await api.put(`/loans/${modalConfig.loanId}/cancel`);
      } else if (modalConfig.type === 'reactivate') {
        await api.put(`/loans/${modalConfig.loanId}/reactivate`);
      } else {
        await api.delete(`/loans/${modalConfig.loanId}`);
      }
      setModalConfig({ ...modalConfig, isOpen: false });
      fetchLoans();
    } catch (err: any) {
      console.error('Error in confirmAction:', err);
      const errorMsg = err.response?.data?.message || 'Error al procesar la solicitud.';
      setModalConfig({ ...modalConfig, error: errorMsg });
    }
  };

  const stats = [
    { label: 'Total en Calle', value: loans.reduce((acc, l) => acc + l.balanceDue, 0), icon: Landmark, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Intereses', value: loans.reduce((acc, l) => acc + (l.totalToPay - l.amount), 0), icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'En Mora', value: loans.filter(l => l.status === 'Overdue').length, icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-50' },
  ];

  const filteredLoans = loans.filter(l => {
    const matchesSearch = l.clientName.toLowerCase().includes(search.toLowerCase());
    if (activeTab === 'activos') return matchesSearch && (l.status === 'Active' || l.status === 'Overdue');
    if (activeTab === 'pagados') return matchesSearch && l.status === 'Paid';
    if (activeTab === 'anulados') return matchesSearch && l.status === 'Cancelled';
    return matchesSearch;
  });

  return (
    <div className="p-6 max-w-7xl mx-auto pb-24">
      <div className="flex flex-col md:flex-row md:items-center justify-end gap-6 mb-10">
        <div className="flex gap-3">
          <button className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-5 py-3 rounded-2xl font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 transition-all">
            <Filter size={18} /> Filtros
          </button>
          <button 
            onClick={() => navigate('/loans/new')}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-2xl font-bold shadow-xl shadow-blue-500/30 transition-all transform active:scale-95"
          >
            <Plus size={20} /> Nuevo Préstamo
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        {stats.map((stat, idx) => (
          <div key={idx} className="bg-white dark:bg-slate-900 p-6 rounded-[32px] shadow-xl border border-slate-100 dark:border-slate-800 flex items-center gap-5">
            <div className={`w-14 h-14 ${stat.bg} dark:bg-opacity-10 rounded-2xl flex items-center justify-center`}>
              <stat.icon className={stat.color} size={28} />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{stat.label}</p>
              <p className="text-2xl font-black text-slate-900 dark:text-white">
                {typeof stat.value === 'number' && stat.label !== 'En Mora' 
                  ? `$${stat.value.toLocaleString()}` 
                  : stat.value}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-[40px] shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden">
        <div className="p-6 border-b border-slate-50 dark:border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl w-full md:w-auto">
            <button 
              onClick={() => setActiveTab('activos')}
              className={`flex-1 md:flex-none px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'activos' ? 'bg-white dark:bg-slate-700 text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
            >
              Activos
            </button>
            <button 
              onClick={() => setActiveTab('pagados')}
              className={`flex-1 md:flex-none px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'pagados' ? 'bg-white dark:bg-slate-700 text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
            >
              Pagados
            </button>
            <button 
              onClick={() => setActiveTab('anulados')}
              className={`flex-1 md:flex-none px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'anulados' ? 'bg-white dark:bg-slate-700 text-amber-600 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
            >
              Anulados
            </button>
          </div>
          
          <div className="relative w-full md:w-64">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Buscar..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-12 pr-6 py-2.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border-none focus:ring-2 focus:ring-blue-500 text-slate-700 dark:text-slate-200 outline-none"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-700 text-[10px] uppercase font-black tracking-widest text-slate-400">
                <th className="px-8 py-5">Cliente</th>
                <th className="px-8 py-5">Préstamo</th>
                <th className="px-8 py-5">Progreso de Pago</th>
                <th className="px-8 py-5">Desglose (Pagado / Pendiente)</th>
                <th className="px-8 py-5">Estado</th>
                <th className="px-8 py-5 text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-8 py-20 text-center">
                    <div className="w-10 h-10 border-4 border-slate-100 border-t-blue-600 rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-slate-400 font-medium italic">Sincronizando cartera...</p>
                  </td>
                </tr>
              ) : filteredLoans.length > 0 ? (
                filteredLoans.map((loan) => {
                  const progress = ((loan.totalToPay - loan.balanceDue) / loan.totalToPay) * 100;
                  return (
                    <tr 
                      key={loan.id} 
                      onClick={() => navigate(`/loans/details/${loan.id}`)}
                      className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-all cursor-pointer"
                    >
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-500 font-bold group-hover:bg-blue-600 group-hover:text-white transition-all">
                            {loan.clientName.charAt(0)}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 dark:text-white">{loan.clientName}</p>
                            <p className="text-[10px] text-slate-500 font-medium">#{loan.id.toString().padStart(4, '0')}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="space-y-1">
                          <p className="text-sm font-black text-slate-700 dark:text-slate-300">${loan.amount.toLocaleString()}</p>
                          <p className="text-[10px] text-slate-400 flex items-center gap-1">
                            <Calendar size={10} /> {loan.frequency}
                          </p>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="w-40">
                          <div className="flex justify-between mb-1.5 items-end">
                            <span className={`text-[10px] font-black ${loan.status === 'Overdue' ? 'text-red-500' : 'text-emerald-500'}`}>
                              {progress > 0 && progress < 1 ? progress.toFixed(2) : Math.round(progress)}%
                            </span>
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Completado</span>
                          </div>
                          <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden shadow-inner">
                            <div 
                              className={`h-full transition-all duration-1000 relative ${loan.status === 'Overdue' ? 'bg-gradient-to-r from-red-400 to-red-600' : 'bg-gradient-to-r from-emerald-400 to-emerald-600'}`}
                              style={{ width: `${progress}%` }}
                            >
                              <div className="absolute inset-0 bg-white/20 animate-pulse" />
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                              <span className="text-[10px] text-slate-400 font-medium mr-1">Pagado:</span>
                              ${(loan.totalToPay - loan.balanceDue).toLocaleString()}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-600" />
                            <p className="text-xs font-black text-slate-900 dark:text-white">
                              <span className="text-[10px] text-slate-400 font-medium mr-1">Pendiente:</span>
                              ${loan.balanceDue.toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase border ${
                          loan.status === 'Cancelled' 
                            ? 'bg-slate-50 text-slate-500 border-slate-200 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400' 
                            : loan.status === 'Paid'
                            ? 'bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-400'
                            : loan.status === 'Overdue' 
                            ? 'bg-red-50 text-red-600 border-red-100 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400' 
                            : 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-900/20 dark:border-emerald-800 dark:text-emerald-400'
                        }`}>
                          {loan.status === 'Cancelled' ? 'Anulado' : loan.status === 'Paid' ? 'Pagado' : loan.status === 'Overdue' ? 'En Mora' : 'Activo'}
                        </span>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {loan.status !== 'Cancelled' && loan.status !== 'Paid' && (
                            <button 
                              onClick={(e) => handleCancelLoan(e, loan.id)}
                              className="p-2 text-slate-300 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-500/10 rounded-xl transition-all tooltip"
                              title="Anular Préstamo"
                            >
                              <XCircle size={18} />
                            </button>
                          )}
                          {loan.status === 'Cancelled' && (
                            <button 
                              onClick={(e) => handleReactivateLoan(e, loan.id)}
                              className="p-2 text-slate-300 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 rounded-xl transition-all tooltip"
                              title="Reactivar Préstamo"
                            >
                              <RefreshCw size={18} />
                            </button>
                          )}
                          <button 
                            onClick={(e) => handleDeleteLoan(e, loan.id)}
                            className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-all tooltip"
                            title="Eliminar Préstamo"
                          >
                            <Trash2 size={18} />
                          </button>
                          <button className="p-2 text-slate-300 hover:text-blue-600 transition-colors ml-2">
                            <ChevronRight size={20} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="px-8 py-32 text-center">
                    <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6 text-emerald-500">
                      <CheckCircle2 size={40} />
                    </div>
                    <h3 className="text-xl font-bold text-slate-400">Sin préstamos activos</h3>
                    <p className="text-slate-400 text-sm mt-1">Todo está en orden por aquí.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Custom Confirm Modal */}
      {modalConfig.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm px-4">
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 max-w-md w-full shadow-2xl animate-fade-in-up border border-slate-100 dark:border-slate-700">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 ${
              modalConfig.type === 'cancel' ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-500' : 
              modalConfig.type === 'reactivate' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-500' :
              'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-500'
            }`}>
              {modalConfig.type === 'cancel' ? <AlertCircle size={32} /> : 
               modalConfig.type === 'reactivate' ? <RefreshCw size={32} /> : 
               <Trash2 size={32} />}
            </div>
            <h3 className="text-2xl font-black text-center text-slate-900 dark:text-white mb-2">
              {modalConfig.title}
            </h3>
            <p className="text-slate-500 dark:text-slate-400 text-center text-sm mb-8 leading-relaxed">
              {modalConfig.message}
            </p>

            {modalConfig.error && (
              <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-2xl animate-shake">
                <p className="text-xs font-bold text-red-600 dark:text-red-400 text-center">
                  {modalConfig.error}
                </p>
              </div>
            )}
            <div className="flex gap-4">
              <button 
                onClick={() => setModalConfig({ ...modalConfig, isOpen: false })}
                className="flex-1 px-4 py-3 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600 transition-all"
              >
                Cancelar
              </button>
              <button 
                onClick={confirmAction}
                className={`flex-1 px-4 py-3 rounded-xl font-bold text-white transition-all shadow-lg ${
                  modalConfig.type === 'cancel' ? 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/30' : 
                  modalConfig.type === 'reactivate' ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/30' :
                  'bg-red-600 hover:bg-red-700 shadow-red-500/30'
                }`}
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LoansPage;
