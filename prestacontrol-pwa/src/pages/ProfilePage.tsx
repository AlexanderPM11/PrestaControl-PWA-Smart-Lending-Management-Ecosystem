import React, { useState } from 'react';
import { UserCircle2, KeyRound, LogOut, Check } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import api from '../api/api';

const ProfilePage: React.FC = () => {
  const { user, logout, login } = useAuth();
  const toast = useToast();

  const [fullName, setFullName] = useState(user?.fullName || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [isSubmittingProfile, setIsSubmittingProfile] = useState(false);
  const [isSubmittingPassword, setIsSubmittingPassword] = useState(false);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      toast.warning('El nombre no puede estar vacío');
      return;
    }

    try {
      setIsSubmittingProfile(true);
      await api.put('/auth/profile', { fullName: fullName.trim() });
      toast.success('Perfil actualizado correctamente');
      
      if (user) {
        const updatedUser = { ...user, fullName: fullName.trim() };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        window.location.reload(); 
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error al actualizar el perfil');
    } finally {
      setIsSubmittingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.warning('Debe llenar todos los campos');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.warning('La nueva contraseña y la confirmación no coinciden');
      return;
    }

    try {
      setIsSubmittingPassword(true);
      await api.put('/auth/password', {
        currentPassword,
        newPassword
      });
      toast.success('Contraseña actualizada correctamente');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error al cambiar la contraseña');
    } finally {
      setIsSubmittingPassword(false);
    }
  };

  return (
    <div className="space-y-6 mt-4">
      <div className="flex flex-col items-center justify-center space-y-2 mb-8">
        <div className="w-24 h-24 bg-sage-200 rounded-full flex items-center justify-center text-sage-900 border-4 border-white shadow-xl shadow-sage-200/50">
          <span className="text-4xl font-black font-display uppercase">{user?.fullName?.charAt(0)}</span>
        </div>
        <h2 className="text-2xl font-black text-sage-900 font-display">{user?.fullName}</h2>
        <p className="text-sm font-bold text-sage-500 font-sans tracking-wider uppercase">@{user?.username}</p>
      </div>

      <div className="bg-white p-6 rounded-[32px] shadow-sm border border-sage-100">
        <h3 className="text-lg font-black text-sage-900 font-display mb-4 flex items-center gap-2">
          <UserCircle2 size={20} className="text-tangerine-500" /> Datos Personales
        </h3>
        <form onSubmit={handleUpdateProfile} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-sage-500 uppercase tracking-widest font-sans mb-1">Nombre Completo</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-4 py-3 bg-sage-50 border border-sage-200 rounded-xl font-bold focus:ring-2 focus:ring-tangerine-500 outline-none text-sage-900"
            />
          </div>
          <button
            type="submit"
            disabled={isSubmittingProfile}
            className="w-full py-3.5 bg-sage-900 hover:bg-sage-800 text-white rounded-2xl font-bold shadow-lg shadow-sage-900/20 transition-all flex justify-center items-center font-sans disabled:opacity-50"
          >
            {isSubmittingProfile ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : 'Actualizar Nombre'}
          </button>
        </form>
      </div>

      <div className="bg-white p-6 rounded-[32px] shadow-sm border border-sage-100">
        <h3 className="text-lg font-black text-sage-900 font-display mb-4 flex items-center gap-2">
          <KeyRound size={20} className="text-tangerine-500" /> Seguridad
        </h3>
        <form onSubmit={handleChangePassword} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-sage-500 uppercase tracking-widest font-sans mb-1">Contraseña Actual</label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full px-4 py-3 bg-sage-50 border border-sage-200 rounded-xl font-bold focus:ring-2 focus:ring-tangerine-500 outline-none text-sage-900"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-sage-500 uppercase tracking-widest font-sans mb-1">Nueva Contraseña</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-4 py-3 bg-sage-50 border border-sage-200 rounded-xl font-bold focus:ring-2 focus:ring-tangerine-500 outline-none text-sage-900"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-sage-500 uppercase tracking-widest font-sans mb-1">Confirmar Nueva Contraseña</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-3 bg-sage-50 border border-sage-200 rounded-xl font-bold focus:ring-2 focus:ring-tangerine-500 outline-none text-sage-900"
            />
          </div>
          <button
            type="submit"
            disabled={isSubmittingPassword}
            className="w-full py-3.5 bg-sage-900 hover:bg-sage-800 text-white rounded-2xl font-bold shadow-lg shadow-sage-900/20 transition-all flex justify-center items-center font-sans disabled:opacity-50"
          >
            {isSubmittingPassword ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : 'Cambiar Contraseña'}
          </button>
        </form>
      </div>

      <div className="pt-4 pb-8">
        <button
          onClick={logout}
          className="w-full py-4 bg-red-50 hover:bg-red-100 text-red-600 rounded-[24px] font-black font-display transition-colors flex items-center justify-center gap-2 border border-red-200"
        >
          <LogOut size={20} /> Cerrar Sesión
        </button>
      </div>
    </div>
  );
};

export default ProfilePage;
