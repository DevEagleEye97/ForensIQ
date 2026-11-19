import { useState, useEffect, useRef } from 'react';
import { Terminal, CheckCircle2 } from 'lucide-react';

const logs = [
  { text: '> Initializing NIST SP 800-86 Cryptographic Ledger...', delay: 200 },
  { text: '> Computing SHA-256 bitstream hash... [OK] 15ms', delay: 400 },
  { text: '> Validating binary magic bytes (JPEG FFD8...FFD9)... [PASS]', delay: 600 },
  { text: '> Executing TOOL_01: ELA-90 In-Memory Recompression...', delay: 900 },
  { text: '  └─ Variance detected: 12.4% (Threshold: 15%)', delay: 1100 },
  { text: '> Executing TOOL_03: FFT-2D Frequency Spectrum...', delay: 1400 },
  { text: '  └─ No periodic GAN grid artifacts found.', delay: 1600 },
  { text: '> Querying TOOL_06: ViT-V2 Deepfake Classifier (HuggingFace)...', delay: 2000 },
  { text: '  └─ Engaging Adversarial-Resistant Fallback Heuristics.', delay: 2600 },
  { text: '> Executing TOOL_05: EXIF-PRV Provenance Scan...', delay: 3000 },
  { text: '  └─ Camera Make/Model: Parsed (Integrity Evaluated)', delay: 3300 },
  { text: '> Cross-correlating Tier 1, Tier 2, and Tier 3 signals...', delay: 3700 },
  { text: '> CONSENSUS REACHED. Generating Forensic Report.', delay: 4200, final: true }
];

interface LiveForensicTerminalProps {
  onComplete: () => void;
  fastMode?: boolean;
}

export default function LiveForensicTerminal({ onComplete, fastMode = false }: LiveForensicTerminalProps) {
  const [visibleLogs, setVisibleLogs] = useState<string[]>([]);
  const [done, setDone] = useState(false);
  const terminalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const multiplier = fastMode ? 0.3 : 1.0;
    const timeouts: ReturnType<typeof setTimeout>[] = [];
    logs.forEach((log) => {
      const t = setTimeout(() => {
        setVisibleLogs((prev) => [...prev, log.text]);
        if (log.final) {
          setDone(true);
          const tFinal = setTimeout(onComplete, fastMode ? 250 : 600); // Transition to results
          timeouts.push(tFinal);
        }
      }, Math.round(log.delay * multiplier));
      timeouts.push(t);
    });
    return () => timeouts.forEach((timer) => clearTimeout(timer));
  }, [onComplete, fastMode]);

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [visibleLogs]);

  return (
    <div className="w-full max-w-3xl mx-auto bg-black/90 border border-emerald-500/40 rounded-2xl shadow-[0_0_50px_rgba(0,255,65,0.15)] overflow-hidden font-mono text-xs sm:text-sm backdrop-blur-2xl">
      {/* Terminal Header */}
      <div className="flex items-center justify-between gap-2 px-3 sm:px-4 py-2 sm:py-2.5 bg-emerald-500/10 border-b border-emerald-500/20">
        <div className="flex items-center gap-2 min-w-0">
          <Terminal size={15} className="text-emerald-400 flex-shrink-0" />
          <span className="text-emerald-400 text-[10px] sm:text-xs font-bold tracking-wider truncate">
            FORENSIQ_ENGINE_V2.4 // TELEMETRY
          </span>
        </div>
        <div className="flex gap-2 items-center flex-shrink-0">
          <button
            onClick={onComplete}
            className="text-[10px] text-cyan-400 hover:text-white px-2 py-0.5 rounded border border-cyan-500/30 hover:border-cyan-400 bg-cyan-950/40 transition-colors"
            title="Skip directly to verdict results"
          >
            Skip ⏩
          </button>
          <div className="flex gap-1.5 items-center">
            <div className="w-2 sm:w-2.5 h-2 sm:h-2.5 rounded-full bg-red-500/80 animate-pulse" />
            <div className="w-2 sm:w-2.5 h-2 sm:h-2.5 rounded-full bg-amber-500/80" />
            <div className="w-2 sm:w-2.5 h-2 sm:h-2.5 rounded-full bg-emerald-500/80 shadow-[0_0_6px_rgba(16,185,129,0.8)]" />
          </div>
        </div>
      </div>

      {/* Terminal Body */}
      <div
        ref={terminalRef}
        className="p-3.5 sm:p-5 h-60 sm:h-72 overflow-y-auto text-gray-300 space-y-1.5 select-text selection:bg-emerald-500/30 selection:text-emerald-200 custom-scrollbar"
      >
        {visibleLogs.map((log, i) => (
          <div
            key={i}
            className={`flex items-start gap-1.5 sm:gap-2 text-[11px] sm:text-xs md:text-sm leading-relaxed break-words ${
              log.includes('[PASS]') || log.includes('[OK]')
                ? 'text-emerald-400'
                : log.includes('Timeout') || log.includes('Engaging') || log.includes('ABSENT')
                ? 'text-amber-400'
                : 'text-gray-300'
            }`}
          >
            {log.startsWith('>') ? (
              <span className="text-cyan-400 flex-shrink-0">▶</span>
            ) : (
              <span className="opacity-40 flex-shrink-0">··</span>
            )}
            <span className="animate-in fade-in duration-150 break-words">{log}</span>
          </div>
        ))}

        {!done && (
          <div className="flex items-center gap-2 text-emerald-400 mt-2 font-mono">
            <span className="w-1.5 sm:w-2 h-3.5 sm:h-4 bg-emerald-400 animate-pulse inline-block" />
            <span className="text-[11px] sm:text-xs">Processing forensic bitstream in volatile RAM...</span>
          </div>
        )}

        {done && (
          <div className="flex items-center gap-2 text-emerald-400 mt-3 sm:mt-4 font-bold border-t border-emerald-500/20 pt-2.5 sm:pt-3 text-[11px] sm:text-xs">
            <CheckCircle2 size={15} className="flex-shrink-0" />
            <span className="truncate">ANALYSIS COMPLETE. RENDERING VERDICT.</span>
          </div>
        )}
      </div>
    </div>
  );
}
