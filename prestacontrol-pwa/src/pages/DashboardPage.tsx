import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, CreditCard, DollarSign, Menu, AlertTriangle, PlusCircle, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';

import api from '../api/api';

const DashboardPage = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await api.get(`/dashboard/stats`);
      setStats(response.data);
    } catch (err) {
      console.error('Error fetching dashboard stats:', err);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    { label: 'Dinero Prestado', value: stats?.totalLoaned || 0, icon: CreditCard, color: 'text-sage-700', bg: 'bg-sage-200' },
    { label: 'Dinero Cobrado', value: stats?.totalCollected || 0, icon: DollarSign, color: 'text-financial-green', bg: 'bg-emerald-100' },
    { label: 'Clientes Activos', value: stats?.activeClients || 0, icon: Users, color: 'text-sage-600', bg: 'bg-sage-100' },
  ];

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

      {/* Stats Cards Mobile Grid */}
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
                  ? `$${stat.value.toLocaleString()}` 
                  : stat.value}
              </p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Secondary Actions */}
      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={() => navigate('/payments')}
          className="flex flex-col items-center justify-center gap-2 p-4 bg-sage-50 border-2 border-sage-200 rounded-3xl hover:bg-sage-100 transition-colors"
        >
          <DollarSign size={24} className="text-sage-700" />
          <span className="font-bold text-sage-900 text-sm">Registrar Pago</span>
        </button>
        <button
          onClick={() => navigate('/loans/delinquent')}
          className="flex flex-col items-center justify-center gap-2 p-4 bg-red-50 border-2 border-red-100 rounded-3xl hover:bg-red-100 transition-colors"
        >
          <AlertTriangle size={24} className="text-red-500" />
          <span className="font-bold text-red-700 text-sm">Morosos</span>
        </button>
      </div>

      {/* Agenda */}
      <div className="bg-white rounded-[32px] p-6 border border-sage-100 shadow-sm mt-4">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-bold text-sage-900 flex items-center gap-2 font-display text-lg">
            <Calendar size={20} className="text-tangerine-500" /> Agenda de Hoy
          </h3>
          <span className={`px-3 py-1 ${stats?.todayAgenda?.length > 0 ? 'bg-tangerine-50 text-tangerine-600' : 'bg-sage-50 text-sage-600'} text-[10px] font-bold rounded-full uppercase`}>
            {stats?.todayAgenda?.length || 0} PENDIENTES
          </span>
        </div>
        
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="w-8 h-8 border-3 border-sage-100 border-t-tangerine-500 rounded-full animate-spin" />
          </div>
        ) : stats?.todayAgenda?.length > 0 ? (
          <div className="space-y-4">
            {stats.todayAgenda.map((item: any) => (
              <div key={item.id} className="flex items-center justify-between p-4 bg-sage-50 rounded-2xl active:scale-95 transition-transform">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-sage-400 shadow-sm">
                    <span className="font-black font-display text-lg">{item.clientName.charAt(0)}</span>
                  </div>
                  <div>
                    <p className="font-bold text-sage-900 text-sm font-sans">{item.clientName}</p>
                    <p className="text-[10px] text-sage-500 font-bold uppercase tracking-wider">Cuota Pendiente</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-black text-sage-900 text-base font-display">${item.amount.toLocaleString()}</p>
                  <button 
                    onClick={() => navigate('/payments')}
                    className="text-[10px] font-bold text-tangerine-500 uppercase tracking-widest mt-1"
                  >
                    COBRAR
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-center bg-sage-50 rounded-2xl border border-dashed border-sage-200">
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mb-3 shadow-sm">
              <Menu size={20} className="text-sage-400" />
            </div>
            <p className="text-sage-500 text-sm font-medium">Libre por hoy</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;
