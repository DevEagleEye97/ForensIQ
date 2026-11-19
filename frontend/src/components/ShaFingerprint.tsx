import { useState } from 'react';
import { Eye, EyeOff, Copy, Check, Shield } from 'lucide-react';
import { cn } from '../lib/utils';

interface ShaFingerprintProps {
  hash: string;
  className?: string;
}

export default function ShaFingerprint({ hash, className }: ShaFingerprintProps) {
  const [revealed, setRevealed] = useState(false);
  const [copied, setCopied] = useState(false);

  const cleanHash = hash.replace(/^SHA256:\s*/i, '');
  const masked = cleanHash.length > 12
    ? `${cleanHash.slice(0, 8)}••••••••${cleanHash.slice(-6)}`
    : cleanHash;

  const handleCopy = () => {
    navigator.clipboard.writeText(cleanHash);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={cn("space-y-1.5 font-mono text-xs", className)}>
      <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-xl bg-slate-950/70 border border-slate-800">
        <div className="flex items-center gap-2 min-w-0">
          <Shield className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
          <span className="text-slate-400 text-[11px] flex-shrink-0">SHA-256:</span>
          <span
            className="text-cyan-200 font-semibold tracking-wider truncate selection:bg-cyan-500/30"
            title={revealed ? cleanHash : 'Click eye to unmask full cryptographic digest'}
          >
            {revealed ? cleanHash : masked}
          </span>
        </div>

        <div className="flex items-center gap-1.5 flex-shrink-0">
          <button
            type="button"
            onClick={() => setRevealed((v) => !v)}
            className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700/80 transition-colors"
            title={revealed ? "Mask hash for privacy" : "Reveal full 64-character hash"}
            aria-label="Toggle hash visibility"
          >
            {revealed ? <EyeOff className="w-3.5 h-3.5 text-amber-400" /> : <Eye className="w-3.5 h-3.5 text-slate-400" />}
          </button>

          <button
            type="button"
            onClick={handleCopy}
            className={cn(
              "flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-medium border transition-all",
              copied
                ? "bg-emerald-600 text-white border-emerald-500"
                : "bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-700/80"
            )}
            title="Copy cryptographic digest to clipboard"
          >
            {copied ? (
              <>
                <Check className="w-3 h-3 text-white" />
                <span>Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3 h-3 text-slate-400" />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>
      </div>

      <p className="text-[10px] text-slate-500 italic pl-1">
        Full fingerprint archived privately in Evidence Vault; masked in public viewport for operational privacy.
      </p>
    </div>
  );
}
