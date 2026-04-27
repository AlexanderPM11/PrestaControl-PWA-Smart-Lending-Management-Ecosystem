import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useNavigate, Link } from 'react-router-dom';
import { LogIn, ShieldCheck, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import api from '../api/api';

const schema = yup.object({
  username: yup.string().required('El usuario es obligatorio'),
  password: yup.string().required('La contraseña es obligatoria'),
}).required();

const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: yupResolver(schema),
  });

  const onSubmit = async (data: any) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.post('/Auth/login', data);
      login(response.data.user, response.data.token);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-6">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-100 p-8"
      >
        <div className="flex flex-col items-center mb-10">
          <div className="w-20 h-20 bg-blue-600 rounded-[28px] flex items-center justify-center shadow-2xl shadow-blue-500/40 mb-6 transform rotate-3">
            <ShieldCheck size={40} className="text-white" />
          </div>
          <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">PrestaControl</h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium mt-1">Gestión Financiera Premium</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2 ml-1">Usuario</label>
            <input 
              {...register('username')}
              type="text" 
              className={`w-full px-5 py-4 bg-slate-50 dark:bg-slate-900 border-2 ${errors.username ? 'border-red-500' : 'border-slate-50 dark:border-slate-800'} rounded-2xl focus:border-blue-500 dark:focus:border-blue-500 outline-none transition-all font-medium text-slate-700 dark:text-white`}
              placeholder="admin"
            />
            {errors.username && <p className="text-red-500 text-[10px] font-bold mt-2 ml-1">{errors.username.message}</p>}
          </div>

          <div>
            <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2 ml-1">Contraseña</label>
            <input 
              {...register('password')}
              type="password" 
              className={`w-full px-5 py-4 bg-slate-50 dark:bg-slate-900 border-2 ${errors.password ? 'border-red-500' : 'border-slate-50 dark:border-slate-800'} rounded-2xl focus:border-blue-500 dark:focus:border-blue-500 outline-none transition-all font-medium text-slate-700 dark:text-white`}
              placeholder="••••••••"
            />
            {errors.password && <p className="text-red-500 text-[10px] font-bold mt-2 ml-1">{errors.password.message}</p>}
          </div>

          {error && (
            <motion.div 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-2xl text-xs font-bold border border-red-100 dark:border-red-900/30 text-center"
            >
              {error}
            </motion.div>
          )}

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 text-white py-5 rounded-[24px] font-black text-lg shadow-xl shadow-blue-500/30 transition-all transform active:scale-95 flex items-center justify-center gap-3"
          >
            {loading ? <Loader2 className="animate-spin" size={24} /> : <LogIn size={24} />}
            {loading ? 'Sincronizando...' : 'Acceder al Panel'}
          </button>

          <div className="text-center mt-8">
            <Link to="/forgot-password" university-colors="true" className="text-xs text-slate-400 hover:text-blue-500 font-black uppercase tracking-widest transition-colors">
              ¿Olvidaste tu contraseña?
            </Link>
          </div>
        </form>

        <p className="mt-8 text-center text-slate-400 text-xs">
          Prestacontrol v1.0.0 &copy; 2026
        </p>
      </motion.div>
    </div>
  );
};

export default LoginPage;
