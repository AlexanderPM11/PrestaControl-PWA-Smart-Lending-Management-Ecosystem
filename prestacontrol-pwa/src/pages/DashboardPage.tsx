import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Users, CreditCard, DollarSign, Menu, AlertTriangle, PlusCircle, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';

import api from '../api/api';

const DashboardPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const API_URL = import.meta.env.VITE_API_URL;

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
    { label: 'Dinero Prestado', value: stats?.totalLoaned || 0, icon: CreditCard, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Dinero Cobrado', value: stats?.totalCollected || 0, icon: DollarSign, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Clientes Activos', value: stats?.activeClients || 0, icon: Users, color: 'text-purple-600', bg: 'bg-purple-50' },
  ];

  const quickActions = [
    { label: 'Nuevo Préstamo', icon: PlusCircle, path: '/loans/new', color: 'bg-blue-600' },
    { label: 'Registrar Pago', icon: DollarSign, path: '/payments', color: 'bg-emerald-600' },
    { label: 'Ver Morosos', icon: AlertTriangle, path: '/loans/delinquent', color: 'bg-red-600' },
  ];

  return (
    <div className="p-6">
      <div className="mb-8">
        <h2 className="text-2xl font-black text-slate-800 dark:text-white">Hola, {user?.fullName}</h2>
        <p className="text-slate-500 dark:text-slate-400 font-medium">Panel de control operativo</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {statCards.map((stat, idx) => (
          <motion.div 
            key={idx}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-800 flex items-center gap-4"
          >
            <div className={`w-12 h-12 ${stat.bg} rounded-2xl flex items-center justify-center`}>
              <stat.icon className={stat.color} size={24} />
            </div>
            <div>
              <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">{stat.label}</p>
              <p className="text-2xl font-black text-slate-900 dark:text-white">
                {typeof stat.value === 'number' && stat.label !== 'Clientes Activos' 
                  ? `$${stat.value.toLocaleString()}` 
                  : stat.value}
              </p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4">Acciones Rápidas</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {quickActions.map((action, idx) => (
            <button
              key={idx}
              onClick={() => navigate(action.path)}
              className="flex items-center gap-4 p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 hover:border-blue-500 dark:hover:border-blue-500 transition-all group"
            >
              <div className={`p-3 ${action.color} text-white rounded-xl shadow-lg transition-transform group-hover:scale-110`}>
                <action.icon size={20} />
              </div>
              <span className="font-bold text-slate-700 dark:text-slate-200">{action.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Recent Activity / Agenda */}
      <div className="bg-white dark:bg-slate-900 rounded-[32px] p-8 border border-slate-100 dark:border-slate-800 shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Calendar size={18} className="text-blue-600" /> Agenda de Hoy
          </h3>
          <span className={`px-3 py-1 ${stats?.todayAgenda?.length > 0 ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'} dark:bg-opacity-20 text-[10px] font-bold rounded-full uppercase`}>
            {stats?.todayAgenda?.length || 0} PENDIENTES
          </span>
        </div>
        
        {loading ? (
          <div className="flex justify-center py-10">
            <div className="w-8 h-8 border-3 border-slate-100 border-t-blue-600 rounded-full animate-spin" />
          </div>
        ) : stats?.todayAgenda?.length > 0 ? (
          <div className="space-y-3">
            {stats.todayAgenda.map((item: any) => (
              <div key={item.id} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl hover:bg-white dark:hover:bg-slate-800 transition-all border border-transparent hover:border-slate-100 dark:hover:border-slate-700 group">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-white dark:bg-slate-900 rounded-xl flex items-center justify-center text-slate-400 group-hover:text-blue-600 shadow-sm transition-all">
                    <Users size={18} />
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 dark:text-white text-sm">{item.clientName}</p>
                    <p className="text-[10px] text-slate-500 font-medium">Cuota Pendiente</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-black text-slate-900 dark:text-white text-sm">${item.amount.toLocaleString()}</p>
                  <button 
                    onClick={() => navigate('/payments')}
                    className="text-[10px] font-bold text-blue-600 hover:underline"
                  >
                    COBRAR AHORA
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
              <Menu size={32} className="text-slate-300 dark:text-slate-600" />
            </div>
            <p className="text-slate-500 dark:text-slate-400 font-medium italic">Sin actividad registrada para hoy</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;
