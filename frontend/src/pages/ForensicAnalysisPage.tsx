import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Eye, Layers, Brain, Fingerprint, Activity, ZoomIn, ZoomOut,
  Crosshair, Download, CheckCircle, AlertTriangle, Info,
  ScanLine, FileText, Shield, Hash, Camera, Cpu, ChevronRight,
  ToggleLeft, ToggleRight, Share2, Maximize2
} from 'lucide-react';
import { cn } from '../lib/utils';

type InspectionMode = 'rgb' | 'ela' | 'heatmap' | 'prnu' | 'fft';

const inspectionModes: { id: InspectionMode; label: string; sublabel: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'rgb',     label: 'Original RGB',     sublabel: 'Base layer',      icon: Eye },
  { id: 'ela',     label: 'ELA Matrix',       sublabel: 'Error level',     icon: Layers },
  { id: 'heatmap', label: 'Neural Heatmap',   sublabel: 'AI attention',    icon: Brain },
  { id: 'prnu',    label: 'PRNU Sensor',      sublabel: 'Pattern noise',   icon: Fingerprint },
  { id: 'fft',     label: 'FFT Spectrum',     sublabel: 'Frequency',       icon: Activity },
];

const telemetryEngines = [
  {
    label: 'Facial GAN & Diffusion Synthesis',
    score: 99.4,
    color: 'rose',
    barColor: 'bg-rose-500',
    dotColor: 'bg-rose-500',
    textColor: 'text-rose-400',
    alert: null,
  },
  {
    label: 'Eye & Corneal Reflection Specularity',
    score: 97.8,
    color: 'rose',
    barColor: 'bg-rose-500',
    dotColor: 'bg-rose-500',
    textColor: 'text-rose-400',
    alert: null,
  },
  {
    label: 'JPEG Quantization Gradient (ELA)',
    score: 91.2,
    color: 'amber',
    barColor: 'bg-amber-400',
    dotColor: 'bg-amber-400',
    textColor: 'text-amber-400',
    alert: null,
  },
  {
    label: 'PRNU Sensor Pattern Noise Match',
    score: 14.3,
    color: 'emerald',
    barColor: 'bg-emerald-400',
    dotColor: 'bg-emerald-400',
    textColor: 'text-emerald-400',
    alert: 'Noise Mismatch Alert',
  },
];

const findings = [
  {
    num: '01',
    title: 'Periorbital Latent Inpainting Desync',
    confidence: 99.1,
    region: 'Left eye socket / brow ridge',
    description:
      'Latent-space inpainting artifacts detected in periorbital region. Pixel gradient continuity breaks at boundary of synthesized eye-socket tissue indicating a local diffusion refinement pass inconsistent with natural image formation.',
    severity: 'critical' as const,
  },
  {
    num: '02',
    title: 'Mandibular Boundary Warp Discontinuity',
    confidence: 97.8,
    region: 'Jawline / lower face boundary',
    description:
      'Geometric warp field discontinuity along mandibular edge. Face-swap boundary presents non-physical pixel displacement vectors (Δ > 2.4 px) that exceed natural muscle deformation physics for the detected micro-expression.',
    severity: 'critical' as const,
  },
  {
    num: '03',
    title: 'CFA Bayer Pattern Interpolation Void',
    confidence: 94.3,
    region: 'Mid-forehead / temple',
    description:
      'Color filter array demosaicing signature absent in 23×18px patch. Region lacks the characteristic RGGB Bayer interpolation residue present across all authentic image sectors — consistent with direct synthesis bypass of sensor simulation.',
    severity: 'high' as const,
  },
];

const metadataRows = [
  { label: 'Observed Sensor',  value: 'No EXIF sensor data detected',         mono: true,  alert: true },
  { label: 'Declared EXIF',    value: 'Canon EOS R5 — Model absent in DB',     mono: false, alert: true },
  { label: 'Capture Params',   value: 'f/2.8 · 1/200s · ISO 800 — Plausible', mono: false, alert: false },
  { label: 'Software Trace',   value: 'Stable Diffusion XL 1.0 (inferred)',    mono: true,  alert: true },
  { label: 'SHA-256',          value: 'a3f8…d4c1 · Chain-verified ✓',          mono: true,  alert: false },
];

export default function ForensicAnalysisPage() {
  const [mode, setMode] = useState<InspectionMode>('rgb');
  const [boxesOn, setBoxesOn] = useState(true);
  const [zoom, setZoom] = useState(100);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-24">

      {/* ── Case Context Bar ───────────────────────────────────────── */}
      <div className="bg-slate-900/60 border-b border-slate-800 px-4 py-3">
        <div className="max-w-screen-xl mx-auto space-y-2">
          {/* Top row: breadcrumb + standard badge */}
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2 text-xs font-mono">
              <span className="text-indigo-400 font-semibold">CASE #TL-2025-090</span>
              <span className="text-slate-600">•</span>
              <span className="text-amber-400 font-medium">ITEM #IMG-0842</span>
              <span className="text-slate-600">•</span>
              <span className="text-slate-400">exec_boardroom_leak_orig.png</span>
            </div>
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-slate-800 text-emerald-400 font-mono text-[10px] border border-slate-700">
              <Shield className="w-3 h-3" />
              NIST SP 800-86
            </div>
          </div>

          {/* Bottom row: filename + verdict + quick actions */}
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h2 className="font-semibold text-slate-100 text-sm">exec_boardroom_leak_orig.png</h2>
              <p className="text-xs text-slate-500 font-mono">18.4 MB · 4096×2732px · 24-bit sRGB</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-500/15 text-rose-400 font-mono text-xs font-semibold border border-rose-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
                CRITICAL DETECTED
              </span>
              <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors min-h-[36px]" aria-label="Split view">
                <ScanLine className="w-3.5 h-3.5 text-indigo-400" />
                Split View
              </button>
              <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors min-h-[36px]" aria-label="Inspector">
                <Crosshair className="w-3.5 h-3.5 text-sky-400" />
                Inspector
              </button>
              <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors min-h-[36px]" aria-label="Court Pack export">
                <FileText className="w-3.5 h-3.5 text-amber-400" />
                Court Pack
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-screen-xl mx-auto px-4 py-6 space-y-6">

        {/* ── Inspection Mode Rail ──────────────────────────────────── */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {inspectionModes.map((m) => (
            <button
              key={m.id}
              onClick={() => setMode(m.id)}
              className={cn(
                'flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-medium transition-all flex-shrink-0 min-h-[44px] border',
                mode === m.id
                  ? 'bg-indigo-600/20 text-indigo-300 border-indigo-500/40 shadow-lg shadow-indigo-900/20'
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-800 hover:text-slate-200'
              )}
            >
              <m.icon className="w-3.5 h-3.5" />
              <div className="text-left">
                <div className="font-semibold">{m.label}</div>
                <div className={cn('text-[10px] font-mono', mode === m.id ? 'text-indigo-400' : 'text-slate-600')}>{m.sublabel}</div>
              </div>
            </button>
          ))}
        </div>

        {/* ── Forensic Canvas Viewport ──────────────────────────────── */}
        <div className="relative rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden" style={{ minHeight: '380px' }}>
          {/* HUD top-left */}
          <div className="absolute top-3 left-3 z-10 flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-black/60 backdrop-blur text-indigo-400 font-mono text-[10px] border border-indigo-500/30">
              MAG {zoom}%
            </span>
            <span className="px-2 py-0.5 rounded bg-black/60 backdrop-blur text-rose-400 font-mono text-[10px] border border-rose-500/30">
              ⚠ 3 ANOMALIES
            </span>
          </div>

          {/* HUD top-right */}
          <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5">
            <button onClick={() => setZoom(z => Math.min(z + 25, 300))} className="p-2 rounded-lg bg-black/60 backdrop-blur text-slate-300 hover:text-white border border-slate-700/50 transition-colors min-w-[36px] min-h-[36px] flex items-center justify-center" aria-label="Zoom in">
              <ZoomIn className="w-4 h-4" />
            </button>
            <button onClick={() => setZoom(z => Math.max(z - 25, 25))} className="p-2 rounded-lg bg-black/60 backdrop-blur text-slate-300 hover:text-white border border-slate-700/50 transition-colors min-w-[36px] min-h-[36px] flex items-center justify-center" aria-label="Zoom out">
              <ZoomOut className="w-4 h-4" />
            </button>
            <button onClick={() => setZoom(100)} className="p-2 rounded-lg bg-black/60 backdrop-blur text-slate-300 hover:text-white border border-slate-700/50 transition-colors min-w-[36px] min-h-[36px] flex items-center justify-center" aria-label="Reset zoom">
              <Maximize2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setBoxesOn(v => !v)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-2 rounded-lg backdrop-blur text-xs font-mono transition-colors border min-h-[36px]',
                boxesOn
                  ? 'bg-rose-500/20 text-rose-400 border-rose-500/40'
                  : 'bg-black/60 text-slate-500 border-slate-700/50'
              )}
              aria-label="Toggle anomaly boxes"
            >
              {boxesOn ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
              BOXES {boxesOn ? 'ON' : 'OFF'}
            </button>
          </div>

          {/* Canvas area — simulated forensic view */}
          <div className="flex items-center justify-center" style={{ minHeight: '340px' }}>
            <AnimatePresence mode="wait">
              <motion.div
                key={mode}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="relative w-full flex items-center justify-center"
                style={{ minHeight: '340px' }}
              >
                {/* Fake forensic canvas with mode-specific overlay */}
                <div
                  className={cn(
                    'w-full h-full absolute inset-0 transition-all duration-300',
                    mode === 'rgb'     && 'bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950',
                    mode === 'ela'     && 'bg-gradient-to-br from-rose-950/60 via-slate-900 to-slate-950',
                    mode === 'heatmap' && 'bg-gradient-to-br from-purple-950/50 via-indigo-950/40 to-slate-950',
                    mode === 'prnu'    && 'bg-gradient-to-br from-emerald-950/40 via-slate-900 to-slate-950',
                    mode === 'fft'     && 'bg-gradient-to-br from-sky-950/50 via-slate-900 to-slate-950',
                  )}
                />
                {/* Centered placeholder with crosshair */}
                <div className="relative z-10 flex flex-col items-center gap-3 select-none">
                  <div className="relative">
                    <Crosshair className="w-16 h-16 text-slate-700" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="font-mono text-[9px] text-indigo-400 tracking-widest mt-10">TARGET</span>
                    </div>
                  </div>
                  <span className="font-mono text-xs text-slate-500 uppercase tracking-widest">{inspectionModes.find(m2 => m2.id === mode)?.label}</span>

                  {/* Anomaly boxes overlay simulation */}
                  {boxesOn && (
                    <>
                      <div className="absolute -top-16 -left-20 w-20 h-14 border-2 border-rose-500/70 rounded pointer-events-none">
                        <span className="absolute -top-4 left-0 font-mono text-[9px] text-rose-400 whitespace-nowrap">01 · 99.1%</span>
                      </div>
                      <div className="absolute top-4 left-10 w-16 h-10 border-2 border-rose-500/50 rounded pointer-events-none">
                        <span className="absolute -top-4 left-0 font-mono text-[9px] text-rose-400 whitespace-nowrap">02 · 97.8%</span>
                      </div>
                      <div className="absolute -top-6 right-8 w-18 h-12 border-2 border-amber-400/50 rounded pointer-events-none">
                        <span className="absolute -top-4 left-0 font-mono text-[9px] text-amber-400 whitespace-nowrap">03 · 94.3%</span>
                      </div>
                    </>
                  )}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Bottom telemetry bar */}
          <div className="absolute bottom-0 left-0 right-0 bg-black/70 backdrop-blur border-t border-slate-800/60 px-4 py-2 flex items-center gap-6 font-mono text-[10px] text-slate-500">
            <span>POS <span className="text-slate-300">X: 2048 · Y: 1366</span></span>
            <span>INDEX <span className="text-rose-400 font-semibold">98.7</span></span>
            <span>MODE <span className="text-indigo-400">{mode.toUpperCase()}</span></span>
            <span className="ml-auto text-slate-700">CASE #TL-2025-090 · LOCKED</span>
          </div>
        </div>

        {/* ── Two-column layout: Score + Telemetry / Findings ──────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* LEFT: Synthetic Likelihood Score + Telemetry */}
          <div className="space-y-5">

            {/* Overall Score Card */}
            <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5 space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-slate-500 font-mono uppercase tracking-wider">Overall Synthetic Likelihood</p>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-5xl font-black text-rose-400 tracking-tight">98.7</span>
                    <span className="text-xl text-rose-500 font-bold">%</span>
                  </div>
                </div>
                <span className="px-3 py-1 rounded-lg bg-rose-500/15 text-rose-400 font-mono text-xs font-bold border border-rose-500/30 mt-1">
                  SYNTHETIC
                </span>
              </div>

              {/* Segmented bar: Authentic / Ambiguous / Synthetic */}
              <div>
                <div className="flex rounded-full overflow-hidden h-2.5 gap-0.5">
                  <div className="bg-emerald-500 rounded-l-full" style={{ width: '1.3%' }} />
                  <div className="bg-amber-400" style={{ width: '0.8%' }} />
                  <div className="bg-rose-500 rounded-r-full flex-1" />
                </div>
                <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1.5">
                  <span>Authentic <span className="text-emerald-500">1.3%</span></span>
                  <span>Ambiguous <span className="text-amber-400">0.8%</span></span>
                  <span>Synthetic <span className="text-rose-400">97.9%</span></span>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1 border-t border-slate-800">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-400 flex-shrink-0" />
                <p className="text-xs text-slate-400">
                  Verdict: <span className="text-rose-400 font-semibold">Confirmed Synthetic</span> — confidence exceeds forensic threshold (95%).
                </p>
              </div>
            </div>

            {/* Forensic Telemetry Breakdown */}
            <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5 space-y-4">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-indigo-400" />
                <h3 className="text-sm font-semibold text-slate-200">Forensic Telemetry Breakdown</h3>
              </div>

              <div className="space-y-4">
                {telemetryEngines.map((eng) => (
                  <div key={eng.label} className="space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className={cn('w-2 h-2 rounded-full flex-shrink-0', eng.dotColor)} />
                        <span className="text-xs text-slate-300 truncate">{eng.label}</span>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {eng.alert && (
                          <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                            {eng.alert}
                          </span>
                        )}
                        <span className={cn('font-mono text-xs font-semibold', eng.textColor)}>{eng.score}%</span>
                      </div>
                    </div>
                    <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${eng.score}%` }}
                        transition={{ duration: 0.8, ease: 'easeOut', delay: 0.1 }}
                        className={cn('h-full rounded-full', eng.barColor)}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT: Forensic Finding Dossier */}
          <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5 space-y-4">
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-rose-400" />
              <h3 className="text-sm font-semibold text-slate-200">Forensic Finding Dossier</h3>
              <span className="ml-auto text-[10px] font-mono text-slate-500">3 findings · LOCKED</span>
            </div>

            <div className="space-y-4">
              {findings.map((f) => (
                <div key={f.num} className={cn(
                  'rounded-xl p-4 border space-y-2 transition-colors hover:border-slate-700',
                  f.severity === 'critical'
                    ? 'bg-rose-500/5 border-rose-500/20'
                    : 'bg-amber-500/5 border-amber-500/20'
                )}>
                  <div className="flex items-start gap-3">
                    <span className={cn(
                      'w-7 h-7 rounded-lg flex items-center justify-center font-mono text-xs font-bold flex-shrink-0 mt-0.5',
                      f.severity === 'critical'
                        ? 'bg-rose-500/20 text-rose-400'
                        : 'bg-amber-500/20 text-amber-400'
                    )}>
                      {f.num}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <h4 className="text-xs font-semibold text-slate-200">{f.title}</h4>
                        <span className={cn(
                          'font-mono text-[10px] font-bold flex-shrink-0',
                          f.severity === 'critical' ? 'text-rose-400' : 'text-amber-400'
                        )}>
                          {f.confidence}%
                        </span>
                      </div>
                      <p className="text-[10px] font-mono text-slate-500 mt-0.5">{f.region}</p>
                    </div>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed pl-10">{f.description}</p>
                  <div className="pl-10">
                    <button className={cn(
                      'flex items-center gap-1.5 text-[11px] font-medium transition-colors min-h-[36px] px-3 py-1.5 rounded-lg',
                      f.severity === 'critical'
                        ? 'text-rose-400 hover:bg-rose-500/10'
                        : 'text-amber-400 hover:bg-amber-500/10'
                    )}>
                      <Crosshair className="w-3 h-3" />
                      Inspect Region
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Ledger & EXIF Metadata ────────────────────────────────── */}
        <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Hash className="w-4 h-4 text-sky-400" />
            <h3 className="text-sm font-semibold text-slate-200">Ledger & EXIF Metadata</h3>
            <span className="ml-auto flex items-center gap-1 text-[10px] font-mono text-emerald-400">
              <CheckCircle className="w-3 h-3" />
              Chain-verified
            </span>
          </div>

          <div className="space-y-2">
            {metadataRows.map((row) => (
              <div key={row.label} className="flex items-start gap-3 py-2.5 border-b border-slate-800 last:border-0">
                <div className="flex items-center gap-1.5 w-36 flex-shrink-0">
                  {row.alert && <AlertTriangle className="w-3 h-3 text-amber-400 flex-shrink-0" />}
                  {!row.alert && <Info className="w-3 h-3 text-slate-600 flex-shrink-0" />}
                  <span className="text-xs text-slate-500">{row.label}</span>
                </div>
                <span className={cn(
                  'text-xs',
                  row.mono ? 'font-mono' : '',
                  row.alert ? 'text-amber-400' : 'text-slate-300'
                )}>
                  {row.value}
                </span>
              </div>
            ))}
          </div>

          {/* Quick metadata grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            {[
              { icon: Camera, label: 'Sensor', value: 'None detected', alert: true },
              { icon: Cpu, label: 'Software', value: 'SD-XL 1.0', alert: true },
              { icon: Hash, label: 'SHA-256', value: 'a3f8…d4c1', alert: false },
              { icon: Shield, label: 'Standard', value: 'NIST 800-86', alert: false },
            ].map((item) => (
              <div key={item.label} className={cn(
                'rounded-xl p-3 border',
                item.alert ? 'bg-amber-500/5 border-amber-500/20' : 'bg-slate-800/60 border-slate-700/50'
              )}>
                <div className="flex items-center gap-1.5 mb-1">
                  <item.icon className={cn('w-3.5 h-3.5', item.alert ? 'text-amber-400' : 'text-slate-500')} />
                  <span className="text-[10px] text-slate-500 font-mono uppercase">{item.label}</span>
                </div>
                <p className={cn('text-xs font-semibold', item.alert ? 'text-amber-400' : 'text-slate-300')}>{item.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Action Controls ───────────────────────────────────────── */}
        <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5 space-y-4">
          <h3 className="text-sm font-semibold text-slate-200">Commit & Export</h3>
          {/* Primary CTA */}
          <button className="w-full flex items-center justify-center gap-2.5 py-4 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-sm transition-colors min-h-[52px] shadow-lg shadow-rose-900/30">
            <CheckCircle className="w-5 h-5" />
            Confirm Deepfake &amp; Commit to TruthGraph
          </button>
          {/* Secondary grid */}
          <div className="grid grid-cols-2 gap-3">
            <button className="flex items-center justify-center gap-2 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium transition-colors border border-slate-700 min-h-[44px]">
              <Download className="w-4 h-4 text-indigo-400" />
              Export PDF/A Dossier
            </button>
            <button className="flex items-center justify-center gap-2 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium transition-colors border border-slate-700 min-h-[44px]">
              <Share2 className="w-4 h-4 text-sky-400" />
              Peer Review Queue
            </button>
          </div>
          <p className="text-center text-[10px] text-slate-600 font-mono">
            Committing creates an immutable forensic record · CASE #TL-2025-090
          </p>
        </div>

      </div>
    </div>
  );
}
