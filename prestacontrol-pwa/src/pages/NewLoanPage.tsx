import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, User, DollarSign, Percent, Search, UserPlus, X } from 'lucide-react';
import { motion } from 'framer-motion';
import api from '../api/api';
import { useToast } from '../context/ToastContext';

const NewLoanPage: React.FC = () => {
  const navigate = useNavigate();
  const [clientName, setClientName] = useState('');
  const [clientId, setClientId] = useState<number | null>(null);
  const [clients, setClients] = useState<any[]>([]);
  const [clientSearch, setClientSearch] = useState('');
  const [showClientList, setShowClientList] = useState(false);
  const [showQuickCreate, setShowQuickCreate] = useState(false);
  const [newClientPhone, setNewClientPhone] = useState('');
  const [isCreatingClient, setIsCreatingClient] = useState(false);
  const formatDominicanPhone = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 10);
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
    return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
  };
  const [amount, setAmount] = useState<number | ''>('');
  const [interestRate, setInterestRate] = useState<number | ''>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const toast = useToast();

  React.useEffect(() => {
    api.get('/clients').then((response) => setClients(response.data)).catch(() => toast.error('No se pudo cargar la lista de clientes'));
  }, []);

  const formatWithSeparators = (val: number | '') => {
    if (val === '') return '';
    const parts = val.toString().split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return parts.join('.');
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/[^0-9.]/g, '');
    if (val === '') {
      setAmount('');
      return;
    }
    const num = parseFloat(val);
    if (!isNaN(num)) {
      setAmount(num);
    }
  };

  const handleInterestChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val === '' || (/^\d{1,2}$/.test(val))) {
      setInterestRate(val ? Number(val) : '');
    }
  };

  const handleSaveLoan = async () => {
    if (!clientName.trim()) {
      toast.error('Debes ingresar el nombre del cliente.');
      return;
    }
    if (!amount || amount <= 0) {
      toast.error('Debes ingresar un monto válido.');
      return;
    }
    if (interestRate === '' || interestRate < 0) {
      toast.error('Debes ingresar una tasa de interés válida.');
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        clientId,
        clientName: clientName.trim(),
        amount: Number(amount),
        interestRate: Number(interestRate),
        lateFeeRate: 0,
        frequency: 'Mensual',
        installmentsCount: 1,
        startDate: new Date().toISOString()
      };

      await api.post(`/loans`, payload);
      toast.success('Préstamo registrado exitosamente.');
      navigate('/loans');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error al guardar el préstamo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickCreateClient = async () => {
    if (!clientName.trim()) {
      toast.error('Escribe el nombre del cliente.');
      return;
    }
    setIsCreatingClient(true);
    try {
      const response = await api.post('/clients', { fullName: clientName.trim(), phone: newClientPhone.trim() || null });
      const createdClient = response.data;
      setClients((current) => [createdClient, ...current]);
      setClientId(createdClient.id);
      setClientName(createdClient.fullName);
      setNewClientPhone('');
      setShowQuickCreate(false);
      setShowClientList(false);
      toast.success('Cliente registrado y seleccionado.');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'No se pudo registrar el cliente.');
    } finally {
      setIsCreatingClient(false);
    }
  };

  return (
    <div className="space-y-6 pt-2">
      <div className="flex items-center gap-4">
        <button 
          onClick={() => navigate('/loans')}
          className="p-3 bg-white rounded-full shadow-sm text-sage-900 hover:bg-sage-100 transition-colors"
        >
          <ArrowLeft size={24} />
        </button>
        <div>
          <h1 className="text-2xl font-black text-sage-900 font-display">Nuevo Préstamo</h1>
          <p className="text-sage-500 text-sm font-medium font-sans">Registro de crédito</p>
        </div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }} 
        className="space-y-6"
      >
        <div className="bg-white rounded-[32px] p-6 border border-sage-100 shadow-sm space-y-6">
          
          <div>
            <label className="block text-xs font-bold text-sage-500 uppercase tracking-widest font-sans mb-2 ml-1">Cliente</label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-sage-400" size={20} />
              <input
                type="text"
                placeholder="Ej. Juan Pérez"
                value={clientName}
                onChange={(e) => { setClientName(e.target.value); setClientId(null); setClientSearch(e.target.value); setShowClientList(true); }}
                onFocus={() => setShowClientList(true)}
                className="input-field pl-12"
              />
              {showClientList && (
                <div className="absolute left-0 right-0 top-full z-20 mt-2 max-h-56 overflow-y-auto rounded-2xl border border-sage-100 bg-white p-2 shadow-xl">
                  <div className="flex items-center gap-2 border-b border-sage-100 px-2 pb-2 text-sage-400"><Search size={16} /><span className="text-xs font-medium">Clientes registrados</span></div>
                  {clients.filter((client) => client.fullName.toLowerCase().includes(clientSearch.toLowerCase())).map((client) => (
                    <button key={client.id} type="button" onClick={() => { setClientId(client.id); setClientName(client.fullName); setShowClientList(false); }} className="flex w-full items-center justify-between rounded-xl px-3 py-3 text-left hover:bg-sage-50"><span className="text-sm font-bold text-sage-900">{client.fullName}</span><span className="text-[10px] font-bold text-sage-400">{client.activeLoans} activos</span></button>
                  ))}
                  <button type="button" onClick={() => { setShowClientList(false); setShowQuickCreate(true); }} className="flex w-full items-center gap-2 rounded-xl px-3 py-3 text-left text-xs font-black text-tangerine-600 hover:bg-tangerine-50"><UserPlus size={16} /> Registrar cliente nuevo</button>
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-sage-500 uppercase tracking-widest font-sans mb-2 ml-1">Monto Principal</label>
            <div className="relative">
              <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-sage-400" size={20} />
              <input
                type="text"
                value={formatWithSeparators(amount)}
                onChange={handleAmountChange}
                placeholder="0"
                className="input-field pl-12 font-display text-lg"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-sage-500 uppercase tracking-widest font-sans mb-2 ml-1">Interés (%)</label>
            <div className="relative">
              <Percent className="absolute left-4 top-1/2 -translate-y-1/2 text-sage-400" size={20} />
              <input
                type="number"
                value={interestRate}
                onChange={handleInterestChange}
                placeholder="0"
                className="input-field pl-12 font-display text-lg"
              />
            </div>
          </div>

          {amount && interestRate !== '' && (
            <div className="mt-4 p-6 bg-tangerine-50 rounded-3xl border-2 border-tangerine-200 flex flex-col justify-center text-center">
              <p className="text-xs font-bold tracking-widest text-tangerine-600 mb-1 uppercase font-sans">Interés Estimado por Cuota</p>
              <p className="text-4xl font-black text-tangerine-500 font-display">
                ${((Number(amount) * (Number(interestRate) / 100))).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
          )}

        </div>
        
        <motion.button 
          whileTap={{ scale: 0.95 }}
          onClick={handleSaveLoan}
          disabled={isSubmitting || !clientName.trim()}
          className="btn-primary disabled:opacity-50 disabled:active:scale-100"
        >
          {isSubmitting ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            'Registrar Préstamo'
          )}
        </motion.button>

      </motion.div>

      {showQuickCreate && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-sage-950/40 p-4 backdrop-blur-sm sm:items-center">
          <div className="w-full max-w-md space-y-5 rounded-[32px] bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between">
              <div><p className="text-xs font-black uppercase tracking-widest text-tangerine-500">Alta rápida</p><h2 className="mt-1 font-display text-xl font-black text-sage-900">Nuevo cliente</h2><p className="mt-1 text-sm text-sage-500">Quedará seleccionado para este préstamo.</p></div>
              <button type="button" onClick={() => setShowQuickCreate(false)} className="rounded-full p-2 text-sage-400 hover:bg-sage-50"><X size={19} /></button>
            </div>
            <input value={clientName} onChange={(e) => setClientName(e.target.value)} placeholder="Nombre completo" className="input-field" autoFocus />
            <div><input value={newClientPhone} onChange={(e) => setNewClientPhone(formatDominicanPhone(e.target.value))} placeholder="809-555-5555" inputMode="numeric" maxLength={12} className="input-field" /><p className="mt-1.5 px-1 text-[11px] font-medium text-sage-400">Formato: 809, 829 u 849 + 7 dígitos</p></div>
            <div className="flex gap-3"><button type="button" onClick={() => setShowQuickCreate(false)} className="flex-1 rounded-2xl bg-sage-100 py-3.5 font-bold text-sage-700">Cancelar</button><button type="button" onClick={handleQuickCreateClient} disabled={isCreatingClient} className="flex-1 rounded-2xl bg-tangerine-500 py-3.5 font-black text-white disabled:opacity-60">{isCreatingClient ? 'Guardando...' : 'Guardar cliente'}</button></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NewLoanPage;
