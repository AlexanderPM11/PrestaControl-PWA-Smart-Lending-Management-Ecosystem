import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Wallet, UserCircle2, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const isHome = location.pathname === '/dashboard' || location.pathname === '/';

  const navItems = [
    { label: 'Inicio', icon: LayoutDashboard, path: '/dashboard' },
    { label: 'Préstamos', icon: Wallet, path: '/loans' },
    { label: 'Perfil', icon: UserCircle2, path: '/profile' }, // Replace logout with profile placeholder or keep logout
  ];

  return (
    <div className="min-h-screen bg-sage-100 flex items-center justify-center font-sans">
      <div className="w-full max-w-md bg-sage-50 min-h-screen md:min-h-[850px] md:h-[90vh] md:rounded-[40px] md:shadow-2xl md:shadow-sage-900/20 md:border-8 md:border-white relative overflow-hidden flex flex-col">
        
        {/* Header */}
        <header className="px-6 pt-12 pb-4 flex items-center justify-between z-10 sticky top-0 bg-sage-50/90 backdrop-blur-md">
          {isHome ? (
            <div className="flex flex-col">
              <span className="text-sm font-bold text-sage-500 uppercase tracking-widest">Hola,</span>
              <span className="text-2xl font-black text-sage-900 font-display">{user?.fullName?.split(' ')[0] || 'Admin'}</span>
            </div>
          ) : (
            <button 
              onClick={() => navigate(-1)}
              className="p-3 bg-white rounded-full shadow-sm text-sage-900 hover:bg-sage-100 transition-colors"
            >
              <ArrowLeft size={24} />
            </button>
          )}

          {isHome && (
            <button 
              onClick={logout} 
              className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm text-sage-900 hover:text-tangerine-500 transition-colors border border-sage-200"
              title="Cerrar Sesión"
            >
              <span className="font-display font-black text-lg">{user?.fullName?.charAt(0)}</span>
            </button>
          )}
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto pb-32 px-6 scrollbar-hide">
          {children}
        </main>

        {/* Bottom Navigation */}
        <nav className="absolute bottom-6 left-6 right-6 bg-white/90 backdrop-blur-2xl border border-sage-200 px-6 py-4 flex justify-between items-center z-40 rounded-[32px] shadow-2xl shadow-sage-900/10">
          {navItems.map((item, idx) => {
            const isActive = location.pathname === item.path || (item.path === '/loans' && location.pathname.startsWith('/loans'));
            return (
              <Link 
                key={idx} 
                to={item.path === '/profile' ? '#' : item.path} 
                onClick={(e) => {
                  if(item.path === '/profile') {
                    e.preventDefault();
                    logout();
                  }
                }}
                className={`flex flex-col items-center gap-1.5 transition-all w-16 ${
                  isActive 
                    ? 'text-tangerine-500 transform scale-110' 
                    : 'text-sage-400 hover:text-sage-900'
                }`}
              >
                <item.icon size={24} strokeWidth={isActive ? 2.5 : 2} />
                <span className={`text-[10px] font-bold font-display uppercase tracking-widest ${isActive ? 'opacity-100' : 'opacity-0 h-0 overflow-hidden'}`}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
};

export default MainLayout;
