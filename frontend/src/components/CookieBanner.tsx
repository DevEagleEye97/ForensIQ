import { useState, useEffect } from 'react';
import { ShieldCheck, X } from 'lucide-react';
import { type Page } from './AppHeader';

interface CookieBannerProps {
  onNavigate: (page: Page) => void;
}

const STORAGE_KEY = 'forensiq_cookie_consent_v1';

export default function CookieBanner({ onNavigate }: CookieBannerProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      const consent = localStorage.getItem(STORAGE_KEY);
      if (!consent) {
        // Small delay so it animates smoothly into view
        const t = setTimeout(() => setVisible(true), 800);
        return () => clearTimeout(t);
      }
    } catch {
      // Ignore localStorage errors
    }
  }, []);

  const handleChoice = (level: 'all' | 'essential') => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ level, timestamp: Date.now() }));
    } catch {}
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <aside
      aria-label="Privacy and cookies"
      className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-50 glass-card p-4 sm:p-5 rounded-2xl border border-cyan-500/40 shadow-2xl shadow-black/90 font-mono text-xs backdrop-blur-2xl animate-in fade-in slide-in-from-bottom-4 duration-300"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 text-cyan-300 font-bold">
          <ShieldCheck className="w-4 h-4 text-cyan-400" />
          <span>Zero-Disk Session Policy</span>
        </div>
        <button
          onClick={() => handleChoice('essential')}
          className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
          aria-label="Dismiss cookie notice"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <p className="text-[11px] text-slate-300/90 font-sans mt-2 leading-relaxed">
        We utilize essential session tokens and anonymous diagnostic telemetry. Under our NIST-compliant zero-disk protocol, your ingested multimedia files are processed strictly in RAM and cleared immediately.
      </p>

      <div className="flex flex-wrap items-center gap-2 mt-3.5 pt-3 border-t border-slate-800">
        <button
          onClick={() => handleChoice('all')}
          className="px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-[11px] transition-colors shadow-sm shadow-cyan-500/20"
        >
          Accept All
        </button>
        <button
          onClick={() => handleChoice('essential')}
          className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 text-[11px] transition-colors"
        >
          Essential Only
        </button>
        <div className="flex items-center gap-2 ml-auto text-[11px]">
          <button
            onClick={() => {
              onNavigate('privacy');
              setVisible(false);
            }}
            className="text-cyan-400 hover:text-cyan-300 hover:underline transition-colors"
          >
            Privacy Policy
          </button>
          <span className="text-slate-600">·</span>
          <button
            onClick={() => {
              onNavigate('terms');
              setVisible(false);
            }}
            className="text-teal-400 hover:text-teal-300 hover:underline transition-colors"
          >
            Terms
          </button>
        </div>
      </div>
    </aside>
  );
}
