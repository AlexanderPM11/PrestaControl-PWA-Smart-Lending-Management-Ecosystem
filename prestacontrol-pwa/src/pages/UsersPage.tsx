import React, { useEffect, useState } from 'react';
import { UserPlus, UsersRound, ShieldCheck, Pencil, UserX, UserCheck } from 'lucide-react';
import api from '../api/api';
import { useToast } from '../context/ToastContext';
import ConfirmDialog from '../components/ui/ConfirmDialog';

type ManagedUser = { id: number; fullName: string; username: string; role: 'Admin' | 'Cobrador'; isActive: boolean };

const emptyForm = { fullName: '', username: '', password: '', role: 'Cobrador' as 'Admin' | 'Cobrador' };

const UsersPage: React.FC = () => {
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [userToDeactivate, setUserToDeactivate] = useState<ManagedUser | null>(null);
  const toast = useToast();

  const loadUsers = async () => {
    try { setIsLoading(true); const { data } = await api.get('/users'); setUsers(data); }
    catch (error) { console.error(error); toast.error('No se pudieron cargar los usuarios.'); }
    finally { setIsLoading(false); }
  };

  useEffect(() => { void loadUsers(); }, []);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.fullName.trim() || !form.username.trim() || (!editingId && !form.password)) {
      toast.warning(editingId ? 'Completa el nombre y el usuario.' : 'Completa todos los campos obligatorios.'); return;
    }
    try {
      setIsSaving(true);
      const payload = { ...form, password: form.password || null, fullName: form.fullName.trim(), username: form.username.trim() };
      if (editingId) await api.put(`/users/${editingId}`, { ...payload, isActive: users.find(u => u.id === editingId)?.isActive ?? true });
      else await api.post('/users', payload);
      toast.success(editingId ? 'Usuario actualizado.' : 'Usuario creado correctamente.');
      setForm(emptyForm); setEditingId(null); await loadUsers();
    } catch (error: any) { toast.error(error.response?.data?.message || 'No se pudo guardar el usuario.'); }
    finally { setIsSaving(false); }
  };

  const startEdit = (managedUser: ManagedUser) => {
    setEditingId(managedUser.id);
    setForm({ fullName: managedUser.fullName, username: managedUser.username, password: '', role: managedUser.role });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const toggleUser = async () => {
    if (!userToDeactivate) return;
    try {
      if (userToDeactivate.isActive) await api.delete(`/users/${userToDeactivate.id}`);
      else await api.put(`/users/${userToDeactivate.id}`, { ...userToDeactivate, password: null, isActive: true });
      toast.success(userToDeactivate.isActive ? 'Usuario desactivado.' : 'Usuario activado.');
      setUserToDeactivate(null); await loadUsers();
    } catch (error: any) { toast.error(error.response?.data?.message || 'No se pudo actualizar el estado.'); }
  };

  return <div className="space-y-6 pt-2 pb-24">
    <div><div className="mb-2 flex items-center gap-3"><div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-tangerine-50 text-tangerine-500"><UsersRound size={24} /></div><div><h1 className="font-display text-2xl font-black text-sage-900">Usuarios</h1><p className="text-sm font-medium text-sage-500">Administra los accesos de tu equipo.</p></div></div></div>
    <form onSubmit={submit} className="space-y-4 rounded-[28px] border border-sage-100 bg-white p-5 shadow-sm">
      <h2 className="flex items-center gap-2 font-display text-lg font-black text-sage-900"><UserPlus size={19} className="text-tangerine-500" />{editingId ? 'Editar usuario' : 'Nuevo usuario'}</h2>
      <input value={form.fullName} onChange={e => setForm({ ...form, fullName: e.target.value })} placeholder="Nombre completo" className="input-field" />
      <input value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} placeholder="Nombre de usuario" autoComplete="off" className="input-field" />
      <input value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder={editingId ? 'Nueva contraseña (opcional)' : 'Contraseña'} type="password" autoComplete="new-password" className="input-field" />
      <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value as 'Admin' | 'Cobrador' })} className="input-field appearance-none"><option value="Cobrador">Usuario común · Cobrador</option><option value="Admin">Administrador</option></select>
      <div className="flex gap-3"><button type="submit" disabled={isSaving} className="flex-1 rounded-2xl bg-tangerine-500 py-3.5 font-black text-white shadow-lg shadow-tangerine-500/20 disabled:opacity-60">{isSaving ? 'Guardando…' : editingId ? 'Guardar cambios' : 'Crear usuario'}</button>{editingId && <button type="button" onClick={() => { setEditingId(null); setForm(emptyForm); }} className="rounded-2xl bg-sage-100 px-4 font-bold text-sage-700">Cancelar</button>}</div>
    </form>
    <div className="space-y-3">{isLoading ? <div className="py-10 text-center text-sm text-sage-500">Cargando usuarios…</div> : users.map(managedUser => <div key={managedUser.id} className="flex items-center gap-3 rounded-[24px] border border-sage-100 bg-white p-4 shadow-sm"><div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${managedUser.role === 'Admin' ? 'bg-tangerine-50 text-tangerine-500' : 'bg-sage-100 text-sage-600'}`}>{managedUser.role === 'Admin' ? <ShieldCheck size={20} /> : <span className="font-display text-lg font-black">{managedUser.fullName.charAt(0).toUpperCase()}</span>}</div><div className="min-w-0 flex-1"><p className="truncate font-display font-black text-sage-900">{managedUser.fullName}</p><p className="truncate text-xs font-bold text-sage-500">@{managedUser.username} · {managedUser.role === 'Admin' ? 'Administrador' : 'Usuario común'}</p><span className={`mt-1 inline-block text-[10px] font-black uppercase tracking-widest ${managedUser.isActive ? 'text-financial-green' : 'text-red-500'}`}>{managedUser.isActive ? 'Activo' : 'Inactivo'}</span></div><button onClick={() => startEdit(managedUser)} title="Editar usuario" className="rounded-xl p-2 text-sage-400 hover:bg-sage-50 hover:text-tangerine-500"><Pencil size={17} /></button><button onClick={() => setUserToDeactivate(managedUser)} title={managedUser.isActive ? 'Desactivar usuario' : 'Activar usuario'} className="rounded-xl p-2 text-sage-400 hover:bg-sage-50 hover:text-red-500">{managedUser.isActive ? <UserX size={18} /> : <UserCheck size={18} />}</button></div>)}</div>
    <ConfirmDialog isOpen={!!userToDeactivate} type="warning" title={userToDeactivate?.isActive ? '¿Desactivar usuario?' : '¿Activar usuario?'} message={userToDeactivate?.isActive ? 'Este usuario no podrá iniciar sesión hasta que un administrador lo active nuevamente.' : 'El usuario podrá volver a iniciar sesión.'} confirmText={userToDeactivate?.isActive ? 'Sí, desactivar' : 'Sí, activar'} cancelText="Cancelar" onConfirm={() => void toggleUser()} onCancel={() => setUserToDeactivate(null)} />
  </div>;
};

export default UsersPage;
