import React, { useState, useEffect } from 'react';

interface LoanSimulatorProps {
  initialData?: {
    amount: number;
    interestRate: number;
    installmentsCount: number;
    frequency: string;
    startDate: string;
  };
  onSimulationChange?: (data: any) => void;
}

const LoanSimulator: React.FC<LoanSimulatorProps> = ({ initialData, onSimulationChange }) => {
  const [amount, setAmount] = useState<number | ''>(initialData?.amount || '');
  const [interestRate, setInterestRate] = useState<number | ''>(initialData?.interestRate || '');
  const [installments, setInstallments] = useState<number | ''>(initialData?.installmentsCount || '');
  const [frequency, setFrequency] = useState<string>(initialData?.frequency || '');
  const [startDate, setStartDate] = useState<string>(initialData?.startDate ? new Date(initialData.startDate).toISOString().split('T')[0] : '');

  const [simulation, setSimulation] = useState<any[]>([]);
  const [totalToPay, setTotalToPay] = useState<number>(0);

  useEffect(() => {
    if (initialData) {
      setAmount(initialData.amount);
      setInterestRate(initialData.interestRate);
      setInstallments(initialData.installmentsCount);
      setFrequency(initialData.frequency);
      setStartDate(new Date(initialData.startDate).toISOString().split('T')[0]);
    }
  }, [initialData]);

  useEffect(() => {
    calculateSimulation();
  }, [amount, interestRate, installments, frequency, startDate]);

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

  const formatWithSeparators = (val: number | '') => {
    if (val === '') return '';
    const parts = val.toString().split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return parts.join('.');
  };

  const handleInterestChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    // Allow numbers up to 2 digits. If empty, it's valid too.
    if (val === '' || (/^\d{1,2}$/.test(val))) {
      setInterestRate(val ? Number(val) : '');
    }
  };

  const calculateSimulation = () => {
    if (!amount || !interestRate || !installments || !frequency || !startDate) {
      setSimulation([]);
      setTotalToPay(0);
      if (onSimulationChange) onSimulationChange(null);
      return;
    }

    const totalInterest = amount * (interestRate / 100);
    const total = Number(amount) + totalInterest;
    const installmentAmount = total / installments;
    const principalPerInst = amount / installments;
    const interestPerInst = totalInterest / installments;

    const schedule = [];
    let currentData = new Date(startDate);

    for (let i = 1; i <= installments; i++) {
      // Increment date based on frequency
      if (i > 1) {
        if (frequency === 'Diario') currentData.setDate(currentData.getDate() + 1);
        else if (frequency === 'Semanal') currentData.setDate(currentData.getDate() + 7);
        else if (frequency === 'Quincenal') currentData.setDate(currentData.getDate() + 15);
        else if (frequency === 'Mensual') currentData.setMonth(currentData.getMonth() + 1);
      }

      schedule.push({
        number: i,
        date: currentData.toISOString().split('T')[0],
        amount: installmentAmount.toFixed(2),
        principal: principalPerInst.toFixed(2),
        interest: interestPerInst.toFixed(2),
      });
    }

    setSimulation(schedule);
    setTotalToPay(total);
    
    if (onSimulationChange) {
      onSimulationChange({ amount, interestRate, installments, frequency, startDate, total, schedule });
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900/80 backdrop-blur-xl rounded-[32px] shadow-2xl shadow-blue-500/5 p-8 border border-slate-100 dark:border-slate-800">
      <h3 className="text-xl font-black text-slate-800 dark:text-white mb-8 flex items-center gap-3">
        <span className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl text-white shadow-lg shadow-blue-500/30">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
        </span>
        Condiciones del Crédito
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Monto Principal</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">$</span>
              <input
                type="text"
                value={formatWithSeparators(amount)}
                onChange={handleAmountChange}
                placeholder="0.00"
                className="w-full pl-8 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Tasa de Interés (%)</label>
            <input
              type="number"
              value={interestRate}
              onChange={handleInterestChange}
              className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Fecha de Inicio</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-slate-900 dark:text-white"
            />
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Frecuencia</label>
            <select
              value={frequency}
              onChange={(e) => setFrequency(e.target.value)}
              className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-slate-900 dark:text-white"
            >
              <option value="" disabled>Seleccionar Frecuencia</option>
              <option value="Diario">Diario</option>
              <option value="Semanal">Semanal</option>
              <option value="Quincenal">Quincenal</option>
              <option value="Mensual">Mensual</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Número de Cuotas</label>
            <input
              type="number"
              value={installments}
              onChange={(e) => setInstallments(e.target.value ? Number(e.target.value) : '')}
              className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-slate-900 dark:text-white"
            />
          </div>

          <div className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-2xl border border-blue-100/50 dark:border-blue-800/50 flex flex-col justify-center relative overflow-hidden group">
            <div className="absolute -right-6 -top-6 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl group-hover:bg-blue-500/20 transition-all duration-500" />
            <p className="text-xs font-black uppercase tracking-widest text-blue-600 dark:text-blue-400 mb-2 relative z-10">Total a Pagar</p>
            <p className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-700 to-indigo-700 dark:from-blue-400 dark:to-indigo-400 relative z-10">
              ${totalToPay > 0 ? totalToPay.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}
            </p>
          </div>
        </div>
      </div>

      {simulation.length > 0 && (
        <div className="overflow-x-auto mt-8 rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-inner">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/80 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 backdrop-blur-sm">
                <th className="py-4 px-6 font-black text-slate-400 dark:text-slate-500 text-[10px] tracking-widest uppercase"># Cuota</th>
                <th className="py-4 px-6 font-black text-slate-400 dark:text-slate-500 text-[10px] tracking-widest uppercase">Fecha de Pago</th>
                <th className="py-4 px-6 font-black text-slate-400 dark:text-slate-500 text-[10px] tracking-widest uppercase">Monto Total</th>
                <th className="py-4 px-6 font-black text-slate-400 dark:text-slate-500 text-[10px] tracking-widest uppercase">A Capital</th>
                <th className="py-4 px-6 font-black text-slate-400 dark:text-slate-500 text-[10px] tracking-widest uppercase">Interés</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
              {simulation.map((item) => (
                <tr key={item.number} className="hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-colors">
                  <td className="py-3 px-6 text-slate-700 dark:text-slate-300 text-sm font-medium">{item.number}</td>
                  <td className="py-3 px-6 text-slate-700 dark:text-slate-300 text-sm">{item.date}</td>
                  <td className="py-3 px-6 font-bold text-slate-900 dark:text-white text-sm">${item.amount}</td>
                  <td className="py-3 px-6 text-slate-600 dark:text-slate-400 text-sm">${item.principal}</td>
                  <td className="py-3 px-6 text-slate-600 dark:text-slate-400 text-sm">${item.interest}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default LoanSimulator;
