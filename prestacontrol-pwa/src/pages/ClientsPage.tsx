import { useEffect, useState } from 'react';
import { Search, UserPlus, Users, Pencil, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../api/api';
import { useToast } from '../context/ToastContext';

const ClientsPage = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const [clients, setClients] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingClient, setEditingClient] = useState<any | null>(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const formatDominicanPhone = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 10);
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
    return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
  };

  const loadClients = () => api.get('/clients').then((response) => setClients(response.data)).catch(() => toast.error('No se pudieron cargar los clientes'));
  useEffect(() => { void loadClients(); }, []);

  const createClient = async () => {
    if (!name.trim()) return toast.warning('Escribe el nombre del cliente');
    if (phone && !/^(809|829|849)-\d{3}-\d{4}$/.test(phone)) return toast.warning('El teléfono debe tener 10 dígitos y comenzar con 809, 829 o 849.');
    try { await api.post('/clients', { fullName: name, phone: phone || null }); toast.success('Cliente registrado'); setName(''); setPhone(''); setShowForm(false); await loadClients(); }
    catch (err: any) { toast.error(err.response?.data?.message || 'No se pudo registrar el cliente'); }
  };

  const openEdit = (client: any) => { setEditingClient(client); setName(client.fullName); setPhone(client.phone || ''); setShowForm(true); };
  const saveClient = async () => {
    if (editingClient) {
      if (!name.trim()) return toast.warning('Escribe el nombre del cliente');
      if (phone && !/^(809|829|849)-\d{3}-\d{4}$/.test(phone)) return toast.warning('El teléfono debe tener 10 dígitos y comenzar con 809, 829 o 849.');
      try { await api.put(`/clients/${editingClient.id}`, { fullName: name, phone: phone || null }); toast.success('Cliente actualizado'); setShowForm(false); setEditingClient(null); await loadClients(); } catch (err: any) { toast.error(err.response?.data?.message || 'No se pudo actualizar el cliente'); }
      return;
    }
    await createClient();
  };

  const filtered = clients.filter((client) => client.fullName.toLowerCase().includes(search.toLowerCase()));
  return <div className="space-y-6 pt-2">
    <div className="flex items-center justify-between"><div className="flex items-center gap-3"><div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-tangerine-500 shadow-sm"><Users size={24} /></div><div><h1 className="font-display text-2xl font-black text-sage-900">Clientes</h1><p className="text-sm font-medium text-sage-500">Tu cartera de clientes</p></div></div><button onClick={() => setShowForm(true)} className="flex h-12 w-12 items-center justify-center rounded-2xl bg-tangerine-500 text-white shadow-lg shadow-tangerine-500/20"><UserPlus size={21} /></button></div>
    <div className="flex items-center gap-3 rounded-2xl border border-sage-100 bg-white px-4 py-2 shadow-sm"><Search size={19} className="text-sage-400" /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar cliente..." className="min-h-10 w-full bg-transparent text-sm font-bold text-sage-900 outline-none" /></div>
    <div className="space-y-3">{filtered.map((client) => <div key={client.id} className="flex items-center gap-3 rounded-3xl border border-sage-100 bg-white p-5 shadow-sm"><button onClick={() => navigate(`/loans?clientId=${client.id}`)} className="min-w-0 flex-1 text-left transition-transform active:scale-[0.98]"><div className="flex items-center justify-between"><div className="min-w-0"><p className="truncate font-display text-lg font-black text-sage-900">{client.fullName}</p><p className="mt-1 text-xs font-medium text-sage-500">{client.phone || 'Sin teléfono'}</p></div><div className="ml-3 text-right"><p className="text-xs font-black text-tangerine-500">{client.activeLoans} activos</p><p className="mt-1 text-xs font-bold text-sage-500">${client.balanceDue.toLocaleString()}</p></div></div></button><button onClick={() => openEdit(client)} aria-label={`Editar ${client.fullName}`} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-sage-50 text-sage-500 transition-colors hover:bg-tangerine-50 hover:text-tangerine-500"><Pencil size={17} /></button></div>)}{filtered.length === 0 && <p className="py-10 text-center text-sm font-medium text-sage-400">No hay clientes registrados.</p>}</div>
    {showForm && <div className="fixed inset-0 z-50 flex items-end justify-center bg-sage-950/40 p-4 backdrop-blur-sm sm:items-center"><div className="w-full max-w-md space-y-5 rounded-[32px] bg-white p-6"><div className="flex items-center justify-between"><h2 className="font-display text-xl font-black text-sage-900">{editingClient ? 'Editar cliente' : 'Nuevo cliente'}</h2><button onClick={() => { setShowForm(false); setEditingClient(null); }} className="text-sage-400"><X size={19} /></button></div><input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nombre completo" className="input-field" autoFocus /><div><input value={phone} onChange={(e) => setPhone(formatDominicanPhone(e.target.value))} placeholder="809-555-5555" inputMode="numeric" maxLength={12} className="input-field" /><p className="mt-1.5 px-1 text-[11px] font-medium text-sage-400">Formato: 809, 829 u 849 + 7 dígitos</p></div><div className="flex gap-3"><button onClick={() => { setShowForm(false); setEditingClient(null); }} className="flex-1 rounded-2xl bg-sage-100 py-3.5 font-bold text-sage-700">Cancelar</button><button onClick={saveClient} className="flex-1 rounded-2xl bg-tangerine-500 py-3.5 font-black text-white">{editingClient ? 'Actualizar' : 'Guardar'}</button></div></div></div>}
  </div>;
};

export default ClientsPage;
