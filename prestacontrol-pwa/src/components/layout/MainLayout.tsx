import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Wallet, UserCircle2, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import ConfirmDialog from '../ui/ConfirmDialog';

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false);

  const isHome = location.pathname === '/dashboard' || location.pathname === '/';

  const navItems = [
    { label: 'Inicio', icon: LayoutDashboard, path: '/dashboard' },
    { label: 'Préstamos', icon: Wallet, path: '/loans' },
    { label: 'Perfil', icon: UserCircle2, path: '/profile' }, // Replace logout with profile placeholder or keep logout
  ];

  return (
    <div className="h-dvh overflow-hidden bg-sage-100 flex items-center justify-center font-sans">
      <div className="w-full max-w-md bg-sage-50 h-dvh md:h-[90vh] md:rounded-[40px] md:shadow-2xl md:shadow-sage-900/20 md:border-8 md:border-white relative overflow-hidden flex flex-col">
        
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
              onClick={() => setIsLogoutDialogOpen(true)}
              className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm text-sage-900 hover:text-tangerine-500 transition-colors border border-sage-200"
              title="Cerrar Sesión"
            >
              <span className="font-display font-black text-lg">{user?.fullName?.charAt(0)}</span>
            </button>
          )}
        </header>

        {/* Page Content */}
        <main className="min-h-0 flex-1 overflow-y-auto pb-36 px-6 scrollbar-hide">
          {children}
        </main>

        {/* Bottom Navigation */}
        <nav className="fixed inset-x-0 bottom-0 z-40 w-full bg-white/95 px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-3 shadow-[0_-12px_32px_rgba(41,51,47,0.16)] backdrop-blur-2xl">
          <div className="mx-auto flex w-full max-w-md items-center justify-around gap-2">
          {navItems.map((item, idx) => {
            const isActive = location.pathname === item.path || (item.path === '/loans' && location.pathname.startsWith('/loans'));
            return (
              <Link 
                key={idx} 
                to={item.path} 
                className={`flex min-h-14 flex-1 flex-col items-center justify-center gap-1 rounded-2xl px-2 transition-all active:scale-95 ${
                  isActive 
                    ? 'bg-tangerine-50 text-tangerine-500 shadow-sm shadow-tangerine-500/10' 
                    : 'text-sage-400 hover:bg-sage-50 hover:text-sage-900'
                }`}
              >
                <item.icon size={24} strokeWidth={isActive ? 2.5 : 2} />
                <span className="text-[10px] font-bold font-display uppercase tracking-widest">
                  {item.label}
                </span>
              </Link>
            );
          })}
          </div>
        </nav>

        <ConfirmDialog
          isOpen={isLogoutDialogOpen}
          type="warning"
          title="¿Cerrar sesión?"
          message="Tu sesión permanecerá segura. Podrás volver a entrar cuando quieras con tus credenciales."
          confirmText="Sí, cerrar sesión"
          cancelText="Cancelar"
          onConfirm={() => {
            setIsLogoutDialogOpen(false);
            logout();
          }}
          onCancel={() => setIsLogoutDialogOpen(false)}
        />
      </div>
    </div>
  );
};

export default MainLayout;
