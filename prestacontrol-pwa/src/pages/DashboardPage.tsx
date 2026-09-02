import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, CreditCard, DollarSign, Menu, PlusCircle, ArrowUpRight, ReceiptText, Activity, ChevronRight, Clock3, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';
import { useToast } from '../context/ToastContext';

import api from '../api/api';

const DashboardPage = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await api.get(`/dashboard/stats`);
      setStats(response.data);
    } catch (err) {
      console.error('Error fetching dashboard stats:', err);
      toast.error('Error al cargar las estadísticas del dashboard');
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    { label: 'Dinero Prestado', value: stats?.totalLoaned || 0, icon: CreditCard, color: 'text-sage-700', bg: 'bg-sage-200' },
    { label: 'Dinero Cobrado', value: stats?.totalCollected || 0, icon: DollarSign, color: 'text-financial-green', bg: 'bg-emerald-100' },
    { label: 'Clientes Activos', value: stats?.activeClients || 0, icon: Users, color: 'text-sage-600', bg: 'bg-sage-100' },
  ];

  const formatMoney = (value = 0) => `$${Number(value).toLocaleString('es-DO', { maximumFractionDigits: 0 })}`;
  const formatDate = (value: string) => new Date(value).toLocaleDateString('es-DO', { day: 'numeric', month: 'short' });

  return (
    <div className="space-y-6 pt-2">
      {/* Primary Action */}
      <motion.button 
        whileTap={{ scale: 0.95 }}
        onClick={() => navigate('/loans/new')}
        className="w-full bg-tangerine-500 text-white p-5 rounded-3xl shadow-lg shadow-tangerine-500/30 flex items-center justify-between group"
      >
        <div className="text-left">
          <p className="text-sm font-bold opacity-80 uppercase tracking-widest font-sans">Acción Rápida</p>
          <p className="text-2xl font-black font-display">Nuevo Préstamo</p>
        </div>
        <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm group-hover:scale-110 transition-transform">
          <PlusCircle size={28} />
        </div>
      </motion.button>

      {/* Portfolio snapshot */}
      <section className="relative overflow-hidden rounded-[30px] bg-sage-900 p-5 text-white shadow-xl shadow-sage-900/10">
        <div className="pointer-events-none absolute -right-10 -top-12 h-36 w-36 rounded-full bg-tangerine-500/20 blur-2xl" />
        <div className="relative flex items-start justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-sage-300">Resumen de cartera</p>
            <p className="mt-2 text-3xl font-black font-display">{formatMoney(stats?.totalLoaned)}</p>
            <p className="mt-1 text-xs text-sage-300">Capital colocado actualmente</p>
          </div>
          <div className="rounded-2xl bg-white/10 p-3 text-tangerine-400"><Activity size={22} /></div>
        </div>
        <div className="relative mt-5 grid grid-cols-3 divide-x divide-white/10">
          <div><p className="text-xl font-black font-display">{stats?.activeLoans || 0}</p><p className="text-[10px] text-sage-300">Préstamos activos</p></div>
          <div className="pl-3"><p className="text-xl font-black font-display">{stats?.activeClients || 0}</p><p className="text-[10px] text-sage-300">Clientes activos</p></div>
        </div>
      </section>

      {/* Financial indicators */}
      <div className="grid grid-cols-2 gap-4">
        {statCards.map((stat, idx) => (
          <motion.div 
            key={idx}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className={`p-5 rounded-3xl bg-white border border-sage-100 shadow-sm flex flex-col justify-between h-32 ${idx === 0 ? 'col-span-2' : 'col-span-1'}`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className={`w-10 h-10 ${stat.bg} rounded-2xl flex items-center justify-center`}>
                <stat.icon className={stat.color} size={20} />
              </div>
            </div>
            <div>
              <p className="text-sage-500 text-[10px] font-bold uppercase tracking-widest font-sans">{stat.label}</p>
              <p className="text-2xl font-black text-sage-900 font-display">
                {typeof stat.value === 'number' && stat.label !== 'Clientes Activos' 
                  ? formatMoney(stat.value)
                  : stat.value}
              </p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Recent activity */}
      <section className="rounded-[30px] border border-sage-100 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-sage-500">Movimiento reciente</p>
            <h3 className="mt-1 flex items-center gap-2 text-lg font-black text-sage-900 font-display"><ReceiptText size={19} className="text-tangerine-500" /> Últimos cobros</h3>
          </div>
          <button onClick={() => navigate('/payments')} className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-tangerine-500">Ver todos <ChevronRight size={14} /></button>
        </div>
        {loading ? <div className="h-16 animate-pulse rounded-2xl bg-sage-50" /> : stats?.recentPayments?.length ? (
          <div className="space-y-3">
            {stats.recentPayments.map((payment: any) => (
              <div key={payment.id} className="flex items-center gap-3 rounded-2xl bg-sage-50 px-3 py-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-financial-green"><ArrowUpRight size={19} /></div>
                <div className="min-w-0 flex-1"><p className="truncate text-sm font-bold text-sage-900">{payment.clientName}</p><p className="flex items-center gap-1 text-[10px] text-sage-500"><Clock3 size={11} /> {formatDate(payment.paymentDate)} · {payment.paymentMethod}</p></div>
                <p className="text-sm font-black text-financial-green font-display">+{formatMoney(payment.amount)}</p>
              </div>
            ))}
          </div>
        ) : <p className="rounded-2xl bg-sage-50 py-5 text-center text-xs text-sage-500">Todavía no hay cobros registrados.</p>}
      </section>

      {/* Payment shortcut */}
      <div className="grid grid-cols-1 gap-4">
        <button
          onClick={() => navigate('/payments')}
          className="group flex items-center justify-between rounded-3xl border-2 border-sage-200 bg-sage-50 p-4 transition-colors hover:bg-sage-100"
        >
          <span className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-sage-700 shadow-sm"><DollarSign size={22} /></span><span className="text-left"><span className="block text-[10px] font-bold uppercase tracking-widest text-sage-500">Cobros</span><span className="font-bold text-sage-900 text-sm">Registrar pago</span></span></span>
          <ChevronRight size={18} className="text-sage-400 transition-transform group-hover:translate-x-1" />
        </button>
      </div>

      <div className="flex items-center gap-3 rounded-2xl border border-sage-100 bg-white px-4 py-3 shadow-sm">
        <div className="rounded-xl bg-sage-100 p-2 text-sage-600"><ShieldCheck size={17} /></div>
        <p className="text-[11px] leading-relaxed text-sage-600">Tus movimientos quedan registrados para mantener una gestión clara y segura.</p>
      </div>
    </div>
  );
};

export default DashboardPage;
