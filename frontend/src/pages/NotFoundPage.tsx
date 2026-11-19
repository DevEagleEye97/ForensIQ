import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Terminal,
  ShieldAlert,
  Home
} from 'lucide-react';

interface NotFoundPageProps {
  onGoHome: () => void;
  onNavigateToDashboard: () => void;
}

export default function NotFoundPage({ onGoHome, onNavigateToDashboard }: NotFoundPageProps) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 bg-slate-950 text-slate-100 min-h-[70vh]">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="max-w-md w-full bg-slate-900/80 border border-slate-800 rounded-2xl p-8 text-center space-y-6 shadow-2xl relative overflow-hidden"
      >
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-1 bg-gradient-to-r from-transparent via-rose-500 to-transparent" />

        <div className="inline-flex items-center justify-center p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-rose-400 mx-auto">
          <ShieldAlert className="w-12 h-12" />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-center gap-2 text-xs font-mono text-rose-400">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
            <span>ERROR 404 // NON_EXISTENT_EVIDENCE_RECORD</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white font-mono">
            Case Node Not Found
          </h1>
          <p className="text-xs text-slate-400 leading-relaxed">
            The evidence identifier, ledger route, or cryptographic hash you requested does not exist in the ForensIQ SQLite Evidence Vault or has been purged.
          </p>
        </div>

        <div className="p-3 bg-black/60 rounded-xl border border-slate-800/80 text-left font-mono text-[11px] text-slate-400 space-y-1">
          <div className="flex items-center gap-1.5 text-slate-500 pb-1 border-b border-slate-800">
            <Terminal className="w-3 h-3 text-indigo-400" />
            <span>VAULT_QUERY_DIAGNOSTICS</span>
          </div>
          <p className="text-slate-500">&gt; SELECT record FROM evidence_vault WHERE id = NULL;</p>
          <p className="text-rose-400">&gt; Status: 0 rows returned [404 NOT FOUND]</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          <button
            onClick={onNavigateToDashboard}
            className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-all min-h-[44px] shadow-lg shadow-indigo-900/30"
          >
            <Home className="w-4 h-4" />
            Return to Workbench
          </button>
          <button
            onClick={onGoHome}
            className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-all min-h-[44px]"
          >
            <ArrowLeft className="w-4 h-4" />
            System Splash
          </button>
        </div>

        <p className="text-[10px] font-mono text-slate-600">
          NIST SP 800-86 Cryptographic Chain-of-Custody Protected
        </p>
      </motion.div>
    </div>
  );
}
