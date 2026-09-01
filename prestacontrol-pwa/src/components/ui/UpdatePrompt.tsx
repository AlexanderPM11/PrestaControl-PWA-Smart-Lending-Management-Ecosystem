import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Download, RefreshCw, X } from 'lucide-react';

type BuildInfo = { version: string };

const getVersion = async () => {
  const response = await fetch(`/version.json?ts=${Date.now()}`, { cache: 'no-store' });
  if (!response.ok) return null;
  const data = await response.json() as BuildInfo;
  return data.version || null;
};

const UpdatePrompt = () => {
  const [currentVersion, setCurrentVersion] = useState<string | null>(null);
  const [availableVersion, setAvailableVersion] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    let active = true;
    const cleanupLegacyWorker = async () => {
      if (!('serviceWorker' in navigator)) return;
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map((registration) => registration.unregister()));
      const names = await caches.keys();
      await Promise.all(names.map((name) => caches.delete(name)));
    };
    const check = async () => {
      try {
        const version = await getVersion();
        if (!active || !version) return;
        if (currentVersion === null) setCurrentVersion(version);
        else if (version !== currentVersion) {
          setAvailableVersion(version);
          setDismissed(false);
        }
      } catch {
        // Ignore temporary network failures.
      }
    };
    void cleanupLegacyWorker().finally(check);
    const interval = window.setInterval(check, 60 * 1000);
    const onVisible = () => { if (document.visibilityState === 'visible') void check(); };
    document.addEventListener('visibilitychange', onVisible);
    return () => { active = false; window.clearInterval(interval); document.removeEventListener('visibilitychange', onVisible); };
  }, [currentVersion]);

  const updateNow = () => {
    setUpdating(true);
    setDismissed(true);
    const query = window.location.search ? `${window.location.search}&` : '?';
    window.location.href = `${window.location.pathname}${query}update=${Date.now()}`;
  };

  return <AnimatePresence>{availableVersion && !dismissed && <motion.aside initial={{ opacity: 0, y: 24, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 24, scale: 0.96 }} role="status" aria-live="polite" className="fixed inset-x-4 bottom-5 z-[70] mx-auto max-w-md rounded-[28px] border border-sage-200 bg-white p-4 shadow-2xl shadow-sage-900/20">
    <div className="flex items-start gap-3"><div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-tangerine-100 text-tangerine-600"><Download size={21} /></div><div className="min-w-0 flex-1 pr-2"><p className="font-display text-base font-black text-sage-900">Hay una nueva versión</p><p className="mt-1 text-xs font-medium leading-relaxed text-sage-500">Actualiza PrestaControl para ver las mejoras y correcciones más recientes.</p></div><button type="button" onClick={() => setDismissed(true)} aria-label="Cerrar aviso" className="rounded-full p-1.5 text-sage-400 hover:bg-sage-100 hover:text-sage-700"><X size={17} /></button></div>
    <button type="button" onClick={updateNow} disabled={updating} className="mt-4 flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-tangerine-500 px-4 text-sm font-black text-white shadow-lg shadow-tangerine-500/20 transition-colors hover:bg-tangerine-600 disabled:opacity-70"><RefreshCw size={17} className={updating ? 'animate-spin' : ''} />{updating ? 'Actualizando...' : 'Actualizar ahora'}</button>
  </motion.aside>}</AnimatePresence>;
};

export default UpdatePrompt;
