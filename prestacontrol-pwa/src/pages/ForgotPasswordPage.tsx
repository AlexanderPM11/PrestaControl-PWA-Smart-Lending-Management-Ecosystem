import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Send, CheckCircle2 } from 'lucide-react';
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
      await api.post('/auth/forgot-password', { username });
      setIsSubmitted(true);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al procesar la solicitud. Verifica el usuario.');
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-[40px] shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden">
        <div className="p-10">
          <div className="mb-10">
            <Link to="/login" className="text-slate-400 hover:text-blue-600 flex items-center gap-2 text-xs font-black uppercase tracking-widest transition-colors">
              <ArrowLeft size={16} />
              Volver al Login
            </Link>
          </div>

          {!isSubmitted ? (
            <>
              <h1 className="text-3xl font-black text-slate-900 dark:text-white mb-2 leading-tight">Recuperación</h1>
              <p className="text-slate-500 dark:text-slate-400 mb-8 font-medium">
                Ingresa tu usuario para recibir un enlace en <span className="text-blue-600 font-bold">Telegram</span>.
              </p>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2 ml-1">Usuario</label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-900 border-2 border-slate-50 dark:border-slate-800 rounded-2xl focus:border-blue-500 dark:focus:border-blue-500 outline-none transition-all font-medium text-slate-700 dark:text-white"
                    placeholder="Ej: admin"
                    required
                  />
                </div>

                {error && (
                  <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 text-red-600 dark:text-red-400 rounded-2xl text-xs font-bold text-center">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 text-white py-5 rounded-[24px] font-black text-lg shadow-xl shadow-blue-500/30 transition-all transform active:scale-95 flex items-center justify-center gap-3"
                >
                  {isLoading ? 'Enviando...' : (
                    <>
                      Enviar Enlace <Send size={20} />
                    </>
                  )}
                </button>
              </form>
            </>
          ) : (
            <div className="text-center py-6">
              <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 rounded-[28px] flex items-center justify-center mx-auto mb-8 shadow-xl shadow-emerald-500/20">
                <CheckCircle2 size={40} />
              </div>
              <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-2">¡Enviado!</h2>
              <p className="text-slate-500 dark:text-slate-400 mb-10 font-medium leading-relaxed">
                Hemos enviado las instrucciones a tu chat de Telegram.
              </p>
              <Link
                to="/login"
                className="inline-block w-full bg-slate-900 dark:bg-white dark:text-slate-900 text-white py-5 rounded-[24px] font-black text-lg hover:scale-105 transition-all shadow-xl"
              >
                Regresar al Inicio
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
