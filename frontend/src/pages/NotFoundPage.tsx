import { motion } from 'framer-motion';
import {
  ExternalLink,
  Terminal,
  ShieldAlert,
  Home
} from 'lucide-react';

interface NotFoundPageProps {
  onGoHome: () => void;
  onNavigateToDashboard: () => void;
}

export default function NotFoundPage({ onNavigateToDashboard }: NotFoundPageProps) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 bg-slate-950 text-slate-100 min-h-[75vh] font-mono relative overflow-hidden">
      {/* Background Matrix Accent Glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(0,255,65,0.06),transparent_70%)] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="max-w-md w-full glass-card border border-rose-500/40 rounded-3xl p-8 text-center space-y-6 shadow-2xl relative overflow-hidden backdrop-blur-2xl z-10"
      >
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-1 bg-gradient-to-r from-transparent via-rose-500 to-transparent" />

        <div className="inline-flex items-center justify-center p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-rose-400 mx-auto">
          <ShieldAlert className="w-12 h-12" />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-center gap-2 text-xs text-rose-400 font-bold">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
            <span>EVIDENCE NOT FOUND — CASE #404</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
            Missing Ledger Node
          </h1>
          <p className="text-xs text-slate-400 font-sans leading-relaxed">
            The evidence hash, route, or case dossier you queried is not archived in the ForensIQ SQLite Evidence Vault or has been purged under zero-disk retention.
          </p>
        </div>

        <div className="p-3 bg-black/60 rounded-xl border border-slate-800 text-left text-[11px] text-slate-400 space-y-1">
          <div className="flex items-center gap-1.5 text-slate-500 pb-1 border-b border-slate-800">
            <Terminal className="w-3 h-3 text-cyan-400" />
            <span>VAULT_QUERY_DIAGNOSTICS</span>
          </div>
          <p className="text-slate-500">&gt; SELECT record FROM evidence_vault WHERE hash = NULL;</p>
          <p className="text-rose-400">&gt; Status: 0 rows returned [404 NOT FOUND]</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          <button
            onClick={onNavigateToDashboard}
            className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold transition-all min-h-[44px] shadow-lg shadow-cyan-900/30"
          >
            <Home className="w-4 h-4" />
            Return to Workbench
          </button>
          <a
            href="/docs"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-medium border border-slate-700 transition-all min-h-[44px]"
          >
            <ExternalLink className="w-4 h-4 text-cyan-400" />
            View API Docs
          </a>
        </div>

        <p className="text-[10px] text-slate-600">
          NIST SP 800-86 Cryptographic Chain-of-Custody Protected
        </p>
      </motion.div>
    </div>
  );
}
