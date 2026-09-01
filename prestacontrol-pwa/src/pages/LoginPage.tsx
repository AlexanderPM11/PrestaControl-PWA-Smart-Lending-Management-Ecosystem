import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { Link, useNavigate } from 'react-router-dom';
import { AlertCircle, ArrowRight, Eye, EyeOff, LockKeyhole, ShieldCheck, Sparkles, UserRound, Wifi } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import api from '../api/api';

const schema = yup.object({
  username: yup.string().trim().required('Escribe tu usuario'),
  password: yup.string().required('Escribe tu contraseña'),
}).required();

type LoginForm = yup.InferType<typeof schema>;

const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>({ resolver: yupResolver(schema) });

  const onSubmit = async (data: LoginForm) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.post('/Auth/login', data);
      const user = response.data.User || response.data.user;
      const token = response.data.Token || response.data.token;
      login(user, token);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.status === 401
        ? 'Datos de acceso incorrectos. Revisa tu usuario y contraseña.'
        : 'No pudimos conectar con PrestaControl. Inténtalo nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen overflow-hidden bg-sage-950 px-5 py-6 font-sans text-white sm:px-8">
      <div className="pointer-events-none absolute -left-28 -top-28 h-80 w-80 rounded-full bg-tangerine-500/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -right-24 h-96 w-96 rounded-full bg-sage-600/30 blur-3xl" />
      <div className="relative mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-md flex-col justify-between">
        <header className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 rotate-3 items-center justify-center rounded-2xl bg-tangerine-500 shadow-lg shadow-tangerine-500/25"><ShieldCheck size={23} strokeWidth={2.4} /></div>
            <div><p className="font-display text-lg font-extrabold tracking-tight">PrestaControl</p><p className="text-[10px] font-bold uppercase tracking-[0.22em] text-sage-300">Tu control financiero</p></div>
          </div>
          <div className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[10px] font-bold text-sage-200"><Wifi size={12} className="text-financial-green" /> En línea</div>
        </header>

        <motion.section initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }} className="my-10 rounded-[2rem] border border-white/10 bg-white p-6 text-sage-950 shadow-2xl shadow-black/30 sm:p-8">
          <div className="mb-8"><div className="mb-5 inline-flex items-center gap-2 rounded-full bg-tangerine-50 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-tangerine-600"><Sparkles size={13} /> Panel administrativo</div><h1 className="font-display text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl">Bienvenido de nuevo.</h1><p className="mt-2 text-sm leading-relaxed text-sage-500">Accede a tu espacio para revisar préstamos, pagos y el movimiento de tu cartera.</p></div>
          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
            <div><label htmlFor="username" className="mb-2 block text-[11px] font-black uppercase tracking-[0.16em] text-sage-500">Usuario</label><div className={`flex items-center gap-3 rounded-2xl border-2 bg-sage-50 px-4 transition-colors focus-within:border-tangerine-500 ${errors.username ? 'border-financial-red/70' : 'border-sage-100'}`}><UserRound size={19} className="shrink-0 text-sage-400" /><input id="username" {...register('username')} autoComplete="username" className="min-h-14 w-full bg-transparent text-base font-bold text-sage-950 outline-none placeholder:text-sage-300" placeholder="Tu usuario" /></div>{errors.username && <p className="mt-1.5 text-xs font-bold text-financial-red">{errors.username.message}</p>}</div>
            <div><div className="mb-2 flex items-center justify-between"><label htmlFor="password" className="block text-[11px] font-black uppercase tracking-[0.16em] text-sage-500">Contraseña</label><LockKeyhole size={14} className="text-sage-400" /></div><div className={`flex items-center gap-3 rounded-2xl border-2 bg-sage-50 px-4 transition-colors focus-within:border-tangerine-500 ${errors.password ? 'border-financial-red/70' : 'border-sage-100'}`}><input id="password" {...register('password')} type={showPassword ? 'text' : 'password'} autoComplete="current-password" className="min-h-14 w-full bg-transparent text-base font-bold text-sage-950 outline-none placeholder:text-sage-300" placeholder="Tu contraseña" /><button type="button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'} className="rounded-xl p-2 text-sage-400 transition-colors hover:bg-sage-100 hover:text-sage-700">{showPassword ? <EyeOff size={19} /> : <Eye size={19} />}</button></div>{errors.password && <p className="mt-1.5 text-xs font-bold text-financial-red">{errors.password.message}</p>}</div>
            {error && <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} role="alert" className="flex items-start gap-3 rounded-2xl border border-financial-red/20 bg-red-50 p-3.5 text-sm font-bold leading-snug text-red-700"><AlertCircle size={19} className="mt-0.5 shrink-0" /><span>{error}</span></motion.div>}
            <button type="submit" disabled={loading} className="flex min-h-14 w-full items-center justify-center gap-3 rounded-2xl bg-tangerine-500 px-5 text-base font-black text-white shadow-xl shadow-tangerine-500/25 transition-all hover:bg-tangerine-600 active:scale-[0.98] disabled:cursor-wait disabled:opacity-70">{loading ? <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white" /> : <ArrowRight size={21} />}{loading ? 'Validando acceso...' : 'Entrar a mi panel'}</button>
            <div className="text-center"><Link to="/forgot-password" className="text-xs font-black text-sage-500 underline decoration-sage-200 underline-offset-4 transition-colors hover:text-tangerine-600">¿Olvidaste tu contraseña?</Link></div>
          </form>
        </motion.section>
        <footer className="pb-2 text-center text-[10px] font-bold uppercase tracking-[0.18em] text-sage-400">PrestaControl · Gestión clara, decisiones inteligentes</footer>
      </div>
    </main>
  );
};

export default LoginPage;
