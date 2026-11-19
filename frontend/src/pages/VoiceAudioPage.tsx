import { useState, useEffect, useRef } from 'react';
import {
  Mic, Play, Pause,
  Activity, Radio, Volume2
} from 'lucide-react';
import { cn } from '../lib/utils';

export default function VoiceAudioPage() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [spoofProb] = useState<number>(76);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Audio Waveform Visualizer Simulator
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let t = 0;

    const renderWave = () => {
      ctx.fillStyle = 'rgba(6, 10, 18, 0.25)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const midY = canvas.height / 2;
      const count = 48;
      const barWidth = canvas.width / count;

      for (let i = 0; i < count; i++) {
        const x = i * barWidth;
        // Animated frequency amplitude
        const amp = isPlaying
          ? Math.sin(t * 0.05 + i * 0.3) * Math.cos(t * 0.08 + i * 0.15) * 45 + 50
          : Math.sin(i * 0.2) * 12 + 18;

        const isGlitchTile = isPlaying && i >= 18 && i <= 28;

        ctx.fillStyle = isGlitchTile ? '#ff0055' : i % 2 === 0 ? '#00d9ff' : '#00ff41';
        ctx.fillRect(x + 2, midY - amp / 2, barWidth - 4, amp);
      }

      t++;
      animId = requestAnimationFrame(renderWave);
    };

    renderWave();

    return () => cancelAnimationFrame(animId);
  }, [isPlaying]);

  return (
    <div className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-teal-500/10 border border-teal-500/30 text-teal-400">
              <Mic className="w-5 h-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-wide font-mono">
              Voice & Audio Forensics
            </h1>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full border border-teal-500/30 bg-teal-950/40 text-teal-300">
              TOOL_12 // ASV-72
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl font-mono">
            PS04 Audio Forensics: Anti-Spoof Voice Probe (ASVspoof benchmark), spectral prosody discontinuity, and breath-gap acoustic artifact analysis.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-[11px] font-mono px-3 py-1.5 rounded-xl border border-emerald-500/30 bg-emerald-950/30 text-emerald-300 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            ACOUSTIC ENGINE READY (COMING SOON)
          </span>
        </div>
      </div>

      {/* Main Waveform Canvas Card */}
      <div className="glass-card p-5 rounded-2xl space-y-4 font-mono">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsPlaying((p) => !p)}
              className="w-10 h-10 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-slate-950 flex items-center justify-center font-bold shadow-lg shadow-teal-500/25 transition-transform hover:scale-105"
            >
              {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
            </button>
            <div>
              <p className="text-xs font-bold text-slate-200">Sample Forensic Speech Stream</p>
              <p className="text-[10px] text-slate-500">Duration: 00:04.28 · 44.1 kHz · 16-bit PCM Mono</p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400">STATUS:</span>
            <span className={cn('font-bold', isPlaying ? 'text-cyan-400' : 'text-slate-500')}>
              {isPlaying ? 'ANALYZING HARMONICS...' : 'STANDBY'}
            </span>
          </div>
        </div>

        {/* Dynamic Waveform Visualizer Canvas */}
        <div className="relative w-full h-44 bg-black/60 rounded-xl overflow-hidden border border-slate-800 flex items-center justify-center">
          <canvas
            ref={canvasRef}
            width={800}
            height={180}
            className="w-full h-full object-cover"
          />

          {/* Region Markers Overlay */}
          <div className="absolute top-2 left-3 px-2 py-1 rounded bg-black/80 border border-slate-800 text-[9px] text-slate-400">
            Hz 0 - 22,050 Hz (Mel Spectrogram Spectrum)
          </div>
          {isPlaying && (
            <div className="absolute top-2 right-3 px-2.5 py-1 rounded bg-rose-950/80 border border-rose-500/50 text-[10px] text-rose-300 animate-pulse">
              ANOMALY: VOCAL TRACT LATENCY SPIKE (00:01.8 - 00:02.4)
            </div>
          )}
        </div>
      </div>

      {/* Acoustic Diagnostics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 font-mono text-xs">
        {/* Metric 1: Cloned Speech Probability */}
        <div className="glass-card p-5 rounded-2xl space-y-3">
          <div className="flex items-center justify-between text-slate-400">
            <span>Synthetic Speech Probability</span>
            <Radio className="w-4 h-4 text-teal-400" />
          </div>
          <p className="text-3xl font-black text-rose-400 tracking-tight">{spoofProb}%</p>
          <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-400 to-rose-500 rounded-full"
              style={{ width: `${spoofProb}%` }}
            />
          </div>
          <p className="text-[11px] text-slate-400 leading-tight">
            Trained on ASVspoof 2021 logical access dataset. Exceeds 65% critical threshold for synthetic vocoder resynthesis.
          </p>
        </div>

        {/* Metric 2: Breath-Gap Analysis */}
        <div className="glass-card p-5 rounded-2xl space-y-3">
          <div className="flex items-center justify-between text-slate-400">
            <span>Prosody & Breath-Gap Metric</span>
            <Activity className="w-4 h-4 text-cyan-400" />
          </div>
          <p className="text-3xl font-black text-amber-400 tracking-tight">ABSENT</p>
          <div className="p-2.5 rounded-xl bg-black/40 border border-slate-800 text-[11px] text-slate-300">
            Zero biological inhale micro-pauses recorded across 4.28s utterance. Typical marker of diffusion speech synthesis (ElevenLabs/VALL-E).
          </div>
        </div>

        {/* Metric 3: Mel-Frequency Cepstral (MFCC) Residuals */}
        <div className="glass-card p-5 rounded-2xl space-y-3">
          <div className="flex items-center justify-between text-slate-400">
            <span>MFCC Residual Variance</span>
            <Volume2 className="w-4 h-4 text-indigo-400" />
          </div>
          <p className="text-3xl font-black text-cyan-400 tracking-tight">Δ 0.082</p>
          <div className="p-2.5 rounded-xl bg-black/40 border border-slate-800 text-[11px] text-slate-300">
            Spectral cutoff detected at 16 kHz. Audio exhibits characteristics of low-bitrate neural codec upsampling.
          </div>
        </div>
      </div>
    </div>
  );
}
