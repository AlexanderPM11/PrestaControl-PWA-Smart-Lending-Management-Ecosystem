import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, CreditCard, DollarSign, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = [
    { label: 'Inicio', icon: LayoutDashboard, path: '/dashboard' },

    { label: 'Préstamos', icon: LoansPagePath(location.pathname), path: '/loans' },
    { label: 'Cobros', icon: DollarSign, path: '/payments' },
  ];

  function LoansPagePath(path: string) {
    if (path.startsWith('/loans')) return CreditCard;
    return CreditCard;
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Shared Header */}
      <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md px-6 py-4 shadow-sm flex items-center justify-between sticky top-0 z-30 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/dashboard')}>
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/30">
            <LayoutDashboard size={18} className="text-white" />
          </div>
          <span className="font-bold text-slate-800 dark:text-white">PrestaControl</span>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="hidden md:block text-right">
            <p className="text-sm font-bold text-slate-900 dark:text-white">{user?.fullName}</p>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-black">Administrador</p>
          </div>
          <button 
            onClick={logout} 
            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all"
            title="Cerrar Sesión"
          >
            <LogOut size={20} />
          </button>
        </div>
      </header>

      {/* Page Content */}
      <main className="pb-24">
        {children}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-white/20 dark:border-slate-800 px-6 py-3 flex justify-between items-center z-40 rounded-[24px] shadow-2xl shadow-slate-900/10 min-w-[320px] md:min-w-[400px]">
        {navItems.map((item, idx) => {
          const isActive = location.pathname === item.path || (item.path === '/loans' && location.pathname.startsWith('/loans'));
          return (
            <Link 
              key={idx} 
              to={item.path} 
              className={`flex flex-col items-center gap-1 transition-all px-4 py-1 rounded-xl ${
                isActive 
                  ? 'text-blue-600 dark:text-blue-400 transform scale-110' 
                  : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
              }`}
            >
              <item.icon size={20} strokeWidth={isActive ? 2.5 : 2} />
              <span className={`text-[10px] font-black uppercase tracking-tighter ${isActive ? 'opacity-100' : 'opacity-60'}`}>
                {item.label}
              </span>
              {isActive && (
                <div className="absolute -bottom-1 w-1 h-1 bg-blue-600 rounded-full shadow-lg shadow-blue-500/50" />
              )}
            </Link>
          );
        })}
      </nav>
    </div>
  );
};

export default MainLayout;
