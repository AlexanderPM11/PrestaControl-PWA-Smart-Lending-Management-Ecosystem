import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight, CheckCircle2, KeyRound, Send, ShieldCheck, UserRound, X } from 'lucide-react';
import { motion } from 'framer-motion';
import api from '../api/api';

const ForgotPasswordPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      await api.post('/auth/forgot-password', { username: username.trim() });
      setIsSubmitted(true);
    } catch (err: any) {
      setError(err.response?.data?.message || 'No pudimos procesar la solicitud. Verifica el usuario e inténtalo nuevamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-sage-50 px-5 py-6 font-sans text-sage-900 sm:px-8">
      <div className="pointer-events-none absolute -left-24 -top-28 h-80 w-80 rounded-full bg-tangerine-500/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -right-24 h-96 w-96 rounded-full bg-sage-300/25 blur-3xl" />

      <div className="relative mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-md flex-col justify-between">
        <header className="flex items-center justify-between pt-2">
          <Link to="/login" className="group flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-sage-600 transition-colors hover:text-tangerine-600">
            <span className="flex h-9 w-9 items-center justify-center rounded-full border border-sage-200 bg-white shadow-sm transition-transform group-hover:-translate-x-1"><ArrowLeft size={17} /></span>
            Volver al acceso
          </Link>
          <div className="flex h-11 w-11 rotate-3 items-center justify-center rounded-2xl bg-tangerine-500 text-white shadow-lg shadow-tangerine-500/25"><ShieldCheck size={22} strokeWidth={2.4} /></div>
        </header>

        <motion.section initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }} className="my-10 rounded-[2rem] border border-sage-100 bg-white p-6 shadow-2xl shadow-sage-900/10 sm:p-8">
          {!isSubmitted ? (
            <>
              <div className="mb-8">
                <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-tangerine-50 text-tangerine-500"><KeyRound size={26} /></div>
                <p className="mb-2 text-[10px] font-black uppercase tracking-[0.2em] text-tangerine-600">Recupera tu acceso</p>
                <h1 className="font-display text-3xl font-extrabold leading-tight tracking-tight text-sage-950 sm:text-4xl">Volvamos a entrar.</h1>
                <p className="mt-3 text-sm leading-relaxed text-sage-500">Escribe tu usuario y te enviaremos un enlace seguro a tu chat de <span className="font-black text-[#229ED9]">Telegram</span>.</p>
              </div>

              <form onSubmit={handleSubmit} noValidate className="space-y-5">
                <div>
                  <label htmlFor="username" className="mb-2 block text-[11px] font-black uppercase tracking-[0.16em] text-sage-500">Usuario</label>
                  <div className={`flex items-center gap-3 rounded-2xl border-2 bg-sage-50 px-4 transition-colors focus-within:border-tangerine-500 ${error ? 'border-red-200' : 'border-sage-100'}`}>
                    <UserRound size={19} className="shrink-0 text-sage-400" />
                    <input id="username" type="text" value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" className="min-h-14 w-full bg-transparent text-base font-bold text-sage-950 outline-none placeholder:text-sage-300" placeholder="Tu usuario" required />
                  </div>
                </div>

                {error && <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} role="alert" className="flex items-start gap-3 rounded-2xl border border-red-100 bg-red-50 p-3.5 text-sm font-bold leading-snug text-red-700"><X size={18} className="mt-0.5 shrink-0" /><span>{error}</span></motion.div>}

                <button type="submit" disabled={isLoading} className="flex min-h-14 w-full items-center justify-center gap-3 rounded-2xl bg-tangerine-500 px-5 text-base font-black text-white shadow-xl shadow-tangerine-500/25 transition-all hover:bg-tangerine-600 active:scale-[0.98] disabled:cursor-wait disabled:opacity-70">
                  {isLoading ? <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white" /> : <Send size={19} />}
                  {isLoading ? 'Enviando enlace...' : 'Enviar enlace'}
                </button>
              </form>
            </>
          ) : (
            <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} className="py-5 text-center">
              <div className="mx-auto mb-7 flex h-20 w-20 items-center justify-center rounded-[28px] bg-emerald-100 text-financial-green shadow-xl shadow-emerald-500/15"><CheckCircle2 size={40} /></div>
              <p className="mb-2 text-[10px] font-black uppercase tracking-[0.2em] text-financial-green">Solicitud enviada</p>
              <h2 className="font-display text-3xl font-extrabold tracking-tight text-sage-950">Revisa Telegram.</h2>
              <p className="mt-3 text-sm leading-relaxed text-sage-500">Enviamos las instrucciones al chat asociado a tu usuario. El enlace es personal y temporal.</p>
              <Link to="/login" className="mt-9 flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-sage-900 px-5 text-base font-black text-white shadow-xl shadow-sage-900/15 transition-all hover:bg-sage-800 active:scale-[0.98]">Regresar al acceso <ArrowRight size={19} /></Link>
            </motion.div>
          )}
        </motion.section>

        <footer className="flex items-center justify-center gap-2 pb-2 text-center text-[10px] font-bold uppercase tracking-[0.16em] text-sage-400"><ShieldCheck size={13} /> PrestaControl · Acceso seguro</footer>
      </div>
    </main>
  );
};

export default ForgotPasswordPage;
