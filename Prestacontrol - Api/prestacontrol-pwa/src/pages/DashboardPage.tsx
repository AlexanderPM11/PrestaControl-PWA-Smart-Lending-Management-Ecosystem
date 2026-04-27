import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, Users, CreditCard, DollarSign, LogOut, Menu } from 'lucide-react';
import { motion } from 'framer-motion';

const DashboardPage = () => {
  const { user, logout } = useAuth();

  const stats = [
    { label: 'Dinero Prestado', value: '$25,000', icon: CreditCard, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Dinero Cobrado', value: '$12,500', icon: DollarSign, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Clientes Activos', value: '48', icon: Users, color: 'text-purple-600', bg: 'bg-purple-50' },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Mobile Header */}
      <header className="bg-white px-6 py-4 shadow-sm flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
            <LayoutDashboard size={18} className="text-white" />
          </div>
          <span className="font-bold text-slate-800">Prestacontrol</span>
        </div>
        <button onClick={logout} className="p-2 text-slate-400 hover:text-red-500 transition-colors">
          <LogOut size={20} />
        </button>
      </header>

      <main className="p-6 pb-24">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-slate-800">Hola, {user?.fullName}</h2>
          <p className="text-slate-500">Resumen financiero de hoy</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {stats.map((stat, idx) => (
            <motion.div 
              key={idx}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.1 }}
              className="card flex items-center gap-4"
            >
              <div className={`w-12 h-12 ${stat.bg} rounded-xl flex items-center justify-center`}>
                <stat.icon className={stat.color} size={24} />
              </div>
              <div>
                <p className="text-slate-500 text-sm font-medium">{stat.label}</p>
                <p className="text-xl font-bold text-slate-800">{stat.value}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Content Placeholder */}
        <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-12 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
            <Menu size={32} className="text-slate-300" />
          </div>
          <p className="text-slate-500 font-medium">No hay cuotas vencidas hoy</p>
          <p className="text-slate-400 text-sm">Todo está al día en el sistema</p>
        </div>
      </main>

      {/* Bottom Navigation (Mobile Only) */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 px-6 py-3 flex justify-between items-center z-10 md:hidden">
        <button className="flex flex-col items-center gap-1 text-primary-600">
          <LayoutDashboard size={20} />
          <span className="text-[10px] font-bold">Inicio</span>
        </button>
        <button className="flex flex-col items-center gap-1 text-slate-400">
          <Users size={20} />
          <span className="text-[10px] font-bold">Clientes</span>
        </button>
        <button className="flex flex-col items-center gap-1 text-slate-400">
          <CreditCard size={20} />
          <span className="text-[10px] font-bold">Préstamos</span>
        </button>
        <button className="flex flex-col items-center gap-1 text-slate-400">
          <DollarSign size={20} />
          <span className="text-[10px] font-bold">Pagos</span>
        </button>
      </nav>
    </div>
  );
};

export default DashboardPage;
