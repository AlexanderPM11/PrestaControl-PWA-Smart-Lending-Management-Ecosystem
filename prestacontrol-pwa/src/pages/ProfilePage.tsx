import React, { useRef, useState } from 'react';
import { UserCircle2, KeyRound, LogOut, CloudBackup, Check, Link2, Unlink, Upload } from 'lucide-react';
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
  const [backupEnabled, setBackupEnabled] = useState(false);
  const [backupConfigured, setBackupConfigured] = useState(false);
  const [googleConfigured, setGoogleConfigured] = useState(false);
  const [isConnectingGoogle, setIsConnectingGoogle] = useState(false);
  const [isRestoringBackup, setIsRestoringBackup] = useState(false);
  const backupFileRef = useRef<HTMLInputElement>(null);
  const [isUpdatingBackup, setIsUpdatingBackup] = useState(false);

  React.useEffect(() => {
    api.get('/backups/settings').then(({ data }) => { setBackupEnabled(data.enabled); setBackupConfigured(data.connected); setGoogleConfigured(data.googleConfigured); }).catch(() => undefined);
    const status = new URLSearchParams(window.location.search).get('backup');
    if (status === 'connected') toast.success('Google Drive conectado correctamente.');
    if (status && status !== 'connected') toast.error('No se pudo conectar Google Drive. Inténtalo nuevamente.');
    if (status) window.history.replaceState({}, '', window.location.pathname);
  }, []);

  const connectGoogleDrive = async () => {
    try {
      setIsConnectingGoogle(true);
      const { data } = await api.get('/backups/google/connect');
      window.location.assign(data.url);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'No se pudo iniciar la conexión con Google Drive.');
      setIsConnectingGoogle(false);
    }
  };

  const disconnectGoogleDrive = async () => {
    try {
      await api.delete('/backups/google/disconnect');
      setBackupConfigured(false);
      setBackupEnabled(false);
      toast.success('Google Drive desconectado.');
    } catch { toast.error('No se pudo desconectar Google Drive.'); }
  };

  const restoreBackup = async (file: File) => {
    if (!window.confirm('Esta acción reemplazará la información actual por la del backup. ¿Deseas continuar?')) return;
    try {
      setIsRestoringBackup(true);
      const formData = new FormData(); formData.append('backup', file);
      await api.post('/backups/restore', formData);
      toast.success('Backup restaurado correctamente.');
      setTimeout(() => window.location.reload(), 1000);
    } catch (err: any) { toast.error(err.response?.data?.message || 'No se pudo restaurar el backup.'); }
    finally { setIsRestoringBackup(false); if (backupFileRef.current) backupFileRef.current.value = ''; }
  };

  const toggleBackups = async () => {
    if (!backupConfigured) { toast.warning('El backup todavía no está configurado en Docker.'); return; }
    try { setIsUpdatingBackup(true); const next = !backupEnabled; await api.put('/backups/settings', { enabled: next }); setBackupEnabled(next); toast.success(next ? 'Backups activados.' : 'Backups desactivados.'); }
    catch (err: any) { toast.error(err.response?.data?.message || 'No se pudo actualizar la configuración de backups.'); }
    finally { setIsUpdatingBackup(false); }
  };

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
        <div className="flex items-start justify-between gap-4">
          <div><h3 className="text-lg font-black text-sage-900 font-display flex items-center gap-2"><CloudBackup size={20} className="text-tangerine-500" /> Backups automáticos</h3><p className="mt-1 text-sm font-medium text-sage-500">Copia cifrada de la aplicación en Google Drive.</p></div>
          {backupConfigured && <button type="button" onClick={toggleBackups} disabled={isUpdatingBackup} aria-label="Activar o desactivar backups" className={`relative h-7 w-12 shrink-0 rounded-full p-1 transition-colors ${backupEnabled ? 'bg-tangerine-500' : 'bg-sage-200'} disabled:cursor-not-allowed disabled:opacity-50`}><span className={`block h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${backupEnabled ? 'translate-x-5' : 'translate-x-0'}`} /></button>}
        </div>
        {!backupConfigured ? <>
          <div className={`mt-4 flex items-center gap-2 rounded-2xl px-3 py-2 text-xs font-bold ${googleConfigured ? 'bg-amber-50 text-amber-700' : 'bg-sage-50 text-sage-600'}`}><CloudBackup size={15} />{googleConfigured ? 'Conecta la cuenta que guardará tus copias.' : 'Google Drive necesita configuración en el entorno.'}</div>
          <button type="button" onClick={connectGoogleDrive} disabled={!googleConfigured || isConnectingGoogle} className="mt-3 w-full rounded-2xl bg-tangerine-500 px-4 py-3 font-black text-white shadow-lg shadow-tangerine-500/20 transition hover:bg-tangerine-600 disabled:cursor-not-allowed disabled:opacity-50"><Link2 size={17} className="mr-2 inline" />{isConnectingGoogle ? 'Abriendo Google…' : 'Conectar Google Drive'}</button>
        </> : <>
          <div className="mt-4 flex items-center gap-2 rounded-2xl bg-sage-50 px-3 py-2 text-xs font-bold text-sage-600"><Check size={15} />{backupEnabled ? 'Activo. Se ejecutará según el horario configurado.' : 'Cuenta conectada, pero backups desactivados.'}</div>
          <button type="button" onClick={disconnectGoogleDrive} className="mt-3 text-xs font-bold text-sage-500 hover:text-red-600"><Unlink size={14} className="mr-1 inline" />Desconectar Google Drive</button>
        </>}
        <div className="mt-5 border-t border-sage-100 pt-4">
          <p className="text-xs font-black uppercase tracking-widest text-sage-500">Restaurar información</p>
          <p className="mt-1 text-xs font-medium text-sage-500">Carga un backup .pca para recuperar la base de datos completa.</p>
          <input ref={backupFileRef} type="file" accept=".pca" className="hidden" onChange={(event) => { const file = event.target.files?.[0]; if (file) void restoreBackup(file); }} />
          <button type="button" onClick={() => backupFileRef.current?.click()} disabled={isRestoringBackup} className="mt-3 w-full rounded-2xl border border-sage-200 bg-sage-50 px-4 py-3 font-black text-sage-700 transition hover:bg-sage-100 disabled:opacity-50"><Upload size={17} className="mr-2 inline" />{isRestoringBackup ? 'Restaurando…' : 'Cargar y restaurar backup'}</button>
        </div>
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
