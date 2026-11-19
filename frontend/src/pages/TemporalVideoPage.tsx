import { useState } from 'react';
import {
  Video, Play, AlertTriangle,
  Clock, Activity, Sparkles, Cpu, CheckCircle2, RefreshCw
} from 'lucide-react';
import { cn } from '../lib/utils';

interface SampleKeyframe {
  frame: number;
  timestamp: string;
  tamperScore: number;
  anomaly: string;
  flagged: boolean;
}

const DEMO_KEYFRAMES: SampleKeyframe[] = [
  { frame: 12, timestamp: '00:00.48', tamperScore: 12, anomaly: 'Consistent grain structure', flagged: false },
  { frame: 24, timestamp: '00:00.96', tamperScore: 14, anomaly: 'Natural facial motion', flagged: false },
  { frame: 48, timestamp: '00:01.92', tamperScore: 22, anomaly: 'Compression artifact', flagged: false },
  { frame: 72, timestamp: '00:02.88', tamperScore: 68, anomaly: 'Lip boundary jitter / frame blending', flagged: true },
  { frame: 96, timestamp: '00:03.84', tamperScore: 84, anomaly: 'Facial warp & synthetic lighting flicker', flagged: true },
  { frame: 120, timestamp: '00:04.80', tamperScore: 78, anomaly: 'Temporal blink discontinuity', flagged: true },
  { frame: 144, timestamp: '00:05.76', tamperScore: 30, anomaly: 'Re-stabilized camera motion', flagged: false },
  { frame: 168, timestamp: '00:06.72', tamperScore: 16, anomaly: 'Baseline lighting verified', flagged: false },
];

export default function TemporalVideoPage() {
  const [selectedFrame, setSelectedFrame] = useState<SampleKeyframe>(DEMO_KEYFRAMES[4]);
  const [isSimulating, setIsSimulating] = useState(false);

  const simulateAnalysis = () => {
    setIsSimulating(true);
    setTimeout(() => {
      setIsSimulating(false);
    }, 1200);
  };

  return (
    <div className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">
              <Video className="w-5 h-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-wide font-mono">
              Temporal Video Forensics
            </h1>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full border border-indigo-500/30 bg-indigo-950/40 text-indigo-300">
              TOOL_11 // TEMP-V2
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl font-mono">
            PS04 Temporal Forensics: Frame-by-frame deepfake timeline analysis, optical flicker continuity probing, and audiovisual lip-sync discrepancy modeling.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-[11px] font-mono px-3 py-1.5 rounded-xl border border-amber-500/30 bg-amber-950/30 text-amber-300 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            ROADMAP // v3.0 IN DEV
          </span>
          <button
            onClick={simulateAnalysis}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl border border-slate-800 bg-slate-900/60 hover:bg-slate-900 text-xs font-mono text-cyan-300 transition-colors"
          >
            <RefreshCw className={cn('w-3.5 h-3.5', isSimulating && 'animate-spin')} />
            Preview Model Architecture
          </button>
        </div>
      </div>

      {/* Honest Roadmap Specification Banner */}
      <div className="p-3.5 sm:p-4 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-200 text-xs font-mono flex items-start sm:items-center gap-3">
        <span className="text-base">🚧</span>
        <div className="leading-relaxed">
          <strong>ROADMAP SPECIFICATION:</strong> Video temporal keyframe models are scheduled for the v3.0 release. The live production backend is actively focused on multi-spectral image, document, and cryptographic provenance triage. The timeline below illustrates the planned frame-by-frame architecture.
        </div>
      </div>

      {/* Video Temporal Timeline */}
      <div className="glass-card p-5 rounded-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-indigo-400" />
            <h3 className="text-xs font-bold text-slate-200 font-mono">
              Sampled Keyframe Timeline (00:00 - 00:07)
            </h3>
          </div>
          <span className="text-[11px] text-slate-500 font-mono">24 FPS Sampling Interval</span>
        </div>

        {/* Frame Strip Carousel */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {DEMO_KEYFRAMES.map((kf) => (
            <div
              key={kf.frame}
              onClick={() => setSelectedFrame(kf)}
              className={cn(
                'p-2.5 rounded-xl border transition-all cursor-pointer flex flex-col gap-2 font-mono text-center relative overflow-hidden group',
                selectedFrame.frame === kf.frame
                  ? 'border-indigo-400 bg-indigo-950/40 shadow-lg shadow-indigo-950/50'
                  : kf.flagged
                  ? 'border-rose-500/40 bg-rose-950/20 hover:border-rose-400'
                  : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
              )}
            >
              {/* Fake Frame Canvas Icon */}
              <div className="h-14 rounded-lg bg-black/60 flex items-center justify-center text-slate-500 relative overflow-hidden">
                <Play className="w-4 h-4 text-slate-400 group-hover:text-white transition-colors" />
                {kf.flagged && (
                  <div className="absolute top-1 right-1 w-2 h-2 rounded-full bg-rose-500" />
                )}
              </div>

              <div>
                <p className="text-[10px] text-slate-400">{kf.timestamp}</p>
                <p className="text-xs font-bold text-slate-200">Frame #{kf.frame}</p>
                <p className={cn('text-[10px] font-bold mt-1', kf.tamperScore > 50 ? 'text-rose-400' : 'text-emerald-400')}>
                  {kf.tamperScore}% RISK
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Frame Detail & Discontinuity Graph */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Selected Frame Telemetry */}
        <div className="glass-card p-5 rounded-2xl space-y-4 font-mono text-xs">
          <div className="flex items-center gap-2 text-slate-200 font-bold border-b border-slate-800 pb-3">
            <Cpu className="w-4 h-4 text-indigo-400" />
            <span>Keyframe #{selectedFrame.frame} Diagnostic</span>
          </div>

          <div className="space-y-3">
            <div>
              <p className="text-slate-500">Timestamp</p>
              <p className="text-sm font-bold text-white">{selectedFrame.timestamp}</p>
            </div>

            <div>
              <p className="text-slate-500">Tamper Probability Index</p>
              <div className="flex items-center gap-2 mt-1">
                <div className="flex-1 h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className={cn('h-full rounded-full transition-all', selectedFrame.tamperScore > 50 ? 'bg-rose-500' : 'bg-emerald-500')}
                    style={{ width: `${selectedFrame.tamperScore}%` }}
                  />
                </div>
                <span className={cn('font-bold', selectedFrame.tamperScore > 50 ? 'text-rose-400' : 'text-emerald-400')}>
                  {selectedFrame.tamperScore}%
                </span>
              </div>
            </div>

            <div>
              <p className="text-slate-500">Detected Signature</p>
              <p className="text-xs text-slate-300 bg-black/40 p-2 rounded-lg border border-slate-800 mt-1">
                {selectedFrame.anomaly}
              </p>
            </div>

            <div className="pt-2 border-t border-slate-800">
              <span className={cn(
                'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold',
                selectedFrame.flagged ? 'bg-rose-950/60 text-rose-300 border border-rose-500/40' : 'bg-emerald-950/60 text-emerald-300 border border-emerald-500/40'
              )}>
                {selectedFrame.flagged ? <AlertTriangle className="w-3 h-3 text-rose-400" /> : <CheckCircle2 className="w-3 h-3 text-emerald-400" />}
                {selectedFrame.flagged ? 'TEMPORAL ANOMALY FLAGGED' : 'TEMPORAL CONSISTENCY PASS'}
              </span>
            </div>
          </div>
        </div>

        {/* Ingestion & Sensor Architecture Panel */}
        <div className="lg:col-span-2 glass-card p-5 rounded-2xl space-y-4 font-mono text-xs">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2 text-slate-200 font-bold">
              <Activity className="w-4 h-4 text-cyan-400" />
              <span>Multi-Frame Consistency Pipeline (PS04 Architecture)</span>
            </div>
            <span className="text-[10px] text-cyan-400">FPS: 24 · Codec: H.264/AV1</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-900/60 space-y-1">
              <p className="text-[10px] text-slate-500">1. SAMPLING STRATEGY</p>
              <p className="font-bold text-slate-200">Sparse Keyframe Sampling</p>
              <p className="text-[11px] text-slate-400 leading-tight">Extracts I-frames and motion vectors to avoid processing redundant static blocks.</p>
            </div>

            <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-900/60 space-y-1">
              <p className="text-[10px] text-slate-500">2. INTER-FRAME CONTINUITY</p>
              <p className="font-bold text-slate-200">Warp & Blink Discontinuity</p>
              <p className="text-[11px] text-slate-400 leading-tight">Tracks eye-blink frequency, jawline warping, and artificial lighting jitter across timestamps.</p>
            </div>

            <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-900/60 space-y-1">
              <p className="text-[10px] text-slate-500">3. CORRELATION ENGINE</p>
              <p className="font-bold text-slate-200">Consensus Scoring</p>
              <p className="text-[11px] text-slate-400 leading-tight">Correlates per-frame ViT embeddings with spatial ELA to output a single honest timeline.</p>
            </div>
          </div>

          {/* Full Implementation Notice */}
          <div className="p-4 rounded-xl border border-indigo-500/30 bg-indigo-950/20 flex items-center justify-between gap-4 mt-2">
            <div className="flex items-center gap-3">
              <Sparkles className="w-5 h-5 text-indigo-400 flex-shrink-0" />
              <div>
                <p className="font-bold text-slate-100">Live Video Ingestion API Coming in Phase 2</p>
                <p className="text-[11px] text-slate-400">
                  Pre-configured backend bindings in <code className="text-cyan-300">routers/workbench.py</code> handle chunked keyframe ingestion to prevent memory exhaustion under 25MB limits.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
