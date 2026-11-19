import { useEffect, useRef, useState, useMemo } from 'react';
import * as THREE from 'three';
import NET from 'vanta/dist/vanta.net.min';
import { Terminal, Cpu, Database, Eye } from 'lucide-react';
import './CinematicLoader.css';

interface CinematicLoaderProps {
  onComplete: () => void;
  /** Allow instant bypass for development or rapid testing */
  skippable?: boolean;
}

const FORENSIQ_LETTERS = ['F', 'O', 'R', 'E', 'N', 'S', 'I', 'Q'];

const SYSTEM_STATUS_STEPS = [
  'INITIALIZING ZERO-TRUST FORENSIC CORES...',
  'CALIBRATING SPATIAL & FREQUENCY SENSORS...',
  'SYNCHRONIZING SECURE EVIDENCE VAULT...',
  'NEURAL MULTIMODAL INFERENCE ARMED...',
];

export default function CinematicLoader({ onComplete, skippable = true }: CinematicLoaderProps) {
  // Animation Phases: 1 (Init 0-0.5s), 2 (Reveal 0.5-2.5s), 3 (Dissolve 2.5-3.5s), 4 (Exit 3.5-4.5s)
  const [phase, setPhase] = useState<1 | 2 | 3 | 4>(1);
  const [revealedLetters, setRevealedLetters] = useState<number>(0);
  const [progress, setProgress] = useState<number>(0);
  const [statusText, setStatusText] = useState<string>(SYSTEM_STATUS_STEPS[0]);
  const [vantaFailed, setVantaFailed] = useState<boolean>(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const vantaRef = useRef<HTMLDivElement>(null);
  const vantaEffectRef = useRef<any>(null);
  const matrixCanvasRef = useRef<HTMLCanvasElement>(null);

  // Check user preference for reduced motion
  const prefersReducedMotion = useMemo(() => {
    return typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }, []);

  // Keyboard shortcut: ESC to skip
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && skippable) {
        onComplete();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onComplete, skippable]);

  // Vanta.js initialization with Three.js (Green Matrix lines on Deep Midnight Blue-Black)
  useEffect(() => {
    if (prefersReducedMotion) {
      onComplete();
      return;
    }

    if (!vantaRef.current) return;

    try {
      vantaEffectRef.current = NET({
        el: vantaRef.current,
        THREE,
        mouseControls: true,
        touchControls: true,
        gyroControls: false,
        minHeight: 200.0,
        minWidth: 200.0,
        scale: 1.0,
        scaleMobile: 1.0,
        color: 0x00ff41,
        backgroundColor: 0x020713,
        points: 13.0,
        maxDistance: 25.0,
        spacing: 16.0,
        showDots: false,
      });
    } catch (err) {
      console.warn('[ForensIQ Cinematic] Vanta.js WebGL fallback to Canvas Matrix:', err);
      setVantaFailed(true);
    }

    return () => {
      if (vantaEffectRef.current && typeof vantaEffectRef.current.destroy === 'function') {
        try {
          vantaEffectRef.current.destroy();
        } catch (_) {}
      }
    };
  }, [prefersReducedMotion, onComplete]);

  // Dual-tone Canvas Matrix Rain (Matrix Green + Cyber Electric Blue mixture)
  useEffect(() => {
    const canvas = matrixCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    const chars = '01FORENSIQCRYPTOSHA256VERIFYEVIDENCE01011001TAMPEREDELAGANNEURALCYBERDEFENSE';
    const fontSize = 14;
    const columns = Math.floor(width / fontSize);

    // Track stream colors (green streams vs cyan-blue streams)
    const streamColors = Array.from({ length: columns }, () =>
      Math.random() > 0.45 ? 'blue' : 'green'
    );
    const drops = Array.from({ length: columns }, () => Math.floor(Math.random() * -50));

    const draw = () => {
      // Semi-transparent deep black-blue fade for ghosting trails
      ctx.fillStyle = 'rgba(2, 6, 17, 0.09)';
      ctx.fillRect(0, 0, width, height);

      ctx.font = `${fontSize}px monospace`;

      for (let i = 0; i < drops.length; i++) {
        const text = chars[Math.floor(Math.random() * chars.length)];
        const x = i * fontSize;
        const y = drops[i] * fontSize;
        const isBlueStream = streamColors[i] === 'blue';

        // Leading tip character glows in white/cyan
        if (Math.random() > 0.88) {
          ctx.fillStyle = '#ffffff';
          ctx.shadowColor = isBlueStream ? '#00d9ff' : '#00ff41';
          ctx.shadowBlur = 8;
        } else if (isBlueStream) {
          ctx.fillStyle = Math.random() > 0.5 ? '#00d9ff' : '#38bdf8';
          ctx.shadowColor = '#00d9ff';
          ctx.shadowBlur = 4;
        } else {
          ctx.fillStyle = Math.random() > 0.5 ? '#00ff41' : '#10b981';
          ctx.shadowColor = '#00ff41';
          ctx.shadowBlur = 4;
        }

        ctx.fillText(text, x, y);
        ctx.shadowBlur = 0; // reset shadow for performance

        if (y > height && Math.random() > 0.975) {
          drops[i] = 0;
          streamColors[i] = Math.random() > 0.45 ? 'blue' : 'green';
        }
        drops[i]++;
      }

      animId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // 4.5s Choreographed Timeline
  useEffect(() => {
    if (prefersReducedMotion) return;

    const startTime = performance.now();
    const TOTAL_DURATION = 4500; // 4.5s

    // Progress counter ticker
    const progressInterval = setInterval(() => {
      const elapsed = performance.now() - startTime;
      const pct = Math.min(100, Math.floor((elapsed / TOTAL_DURATION) * 100));
      setProgress(pct);

      if (elapsed < 1200) {
        setStatusText(SYSTEM_STATUS_STEPS[0]);
      } else if (elapsed < 2400) {
        setStatusText(SYSTEM_STATUS_STEPS[1]);
      } else if (elapsed < 3400) {
        setStatusText(SYSTEM_STATUS_STEPS[2]);
      } else {
        setStatusText(SYSTEM_STATUS_STEPS[3]);
      }
    }, 40);

    // Phase 1 -> Phase 2 (at 500ms): Stagger letter reveal
    const phase2Timer = setTimeout(() => {
      setPhase(2);
      FORENSIQ_LETTERS.forEach((_, idx) => {
        setTimeout(() => {
          setRevealedLetters((prev) => Math.max(prev, idx + 1));
        }, idx * 160);
      });
    }, 500);

    // Phase 2 -> Phase 3 (at 2500ms): Dissolve reveal into app preview
    const phase3Timer = setTimeout(() => {
      setPhase(3);
    }, 2500);

    // Phase 3 -> Phase 4 (at 3500ms): Letterbox frames slide out, logo scales up and fades
    const phase4Timer = setTimeout(() => {
      setPhase(4);
    }, 3500);

    // Complete at 4500ms
    const completeTimer = setTimeout(() => {
      clearInterval(progressInterval);
      onComplete();
    }, TOTAL_DURATION);

    return () => {
      clearInterval(progressInterval);
      clearTimeout(phase2Timer);
      clearTimeout(phase3Timer);
      clearTimeout(phase4Timer);
      clearTimeout(completeTimer);
    };
  }, [prefersReducedMotion, onComplete]);

  // Matrix background opacity mapped to phase
  const matrixOpacity = phase === 1 ? 0.35 : phase === 4 ? 0.2 : 0.65;

  return (
    <div
      ref={containerRef}
      role="alert"
      aria-live="assertive"
      aria-label="ForensIQ forensic system initializing"
      className="fixed inset-0 z-[9999] bg-[#020611] text-white overflow-hidden select-none font-mono"
    >
      {/* LAYER 1: Full-Viewport Vanta.js NET / Matrix Rain Background */}
      <div
        ref={vantaRef}
        className="absolute inset-0 z-0 transition-opacity duration-1000"
        style={{ opacity: matrixOpacity }}
      />
      <canvas
        ref={matrixCanvasRef}
        className="absolute inset-0 z-0 pointer-events-none transition-opacity duration-1000"
        style={{ opacity: vantaFailed ? 0.85 : matrixOpacity * 0.55 }}
      />

      {/* BACKSIDE LINES: 3D Perspective Horizon & Tactical Coordinate Grid */}
      <div className="cyber-grid-backdrop z-[2]" />
      <div className="cyber-horizon-grid z-[3]" />
      <div className="cyber-crosshair-lines z-[4]">
        <div className="cyber-crosshair-x" />
        <div className="cyber-crosshair-y" />
      </div>

      {/* AMBIENT GLOW ORBS: Blend of Deep Black, Neon Green & Cyber Blue */}
      <div className="absolute top-1/4 -left-20 w-[550px] h-[550px] bg-emerald-500/15 rounded-full blur-[120px] pointer-events-none z-[5]" />
      <div className="absolute bottom-1/4 -right-20 w-[550px] h-[550px] bg-cyan-500/18 rounded-full blur-[130px] pointer-events-none z-[5]" />
      <div className="absolute -bottom-20 left-1/3 w-[600px] h-[400px] bg-blue-600/15 rounded-full blur-[140px] pointer-events-none z-[5]" />

      {/* Ambient Vignette for cinematic shadow depth */}
      <div className="forensiq-ambient-vignette z-[6]" />

      {/* LAYER 2: Blackout Cinematic Frames with Dual Green + Blue Glow */}
      <div
        className={`cinematic-frame cinematic-frame-top z-10 transition-transform duration-700 ease-out ${
          phase === 4 ? '-translate-y-full' : 'translate-y-0'
        }`}
      />
      <div
        className={`cinematic-frame cinematic-frame-bottom z-10 transition-transform duration-700 ease-out ${
          phase === 4 ? 'translate-y-full' : 'translate-y-0'
        }`}
      />
      <div
        className={`cinematic-frame cinematic-frame-left z-10 transition-transform duration-700 ease-out ${
          phase === 4 ? '-translate-x-full' : 'translate-x-0'
        }`}
      />
      <div
        className={`cinematic-frame cinematic-frame-right z-10 transition-transform duration-700 ease-out ${
          phase === 4 ? 'translate-x-full' : 'translate-x-0'
        }`}
      />

      {/* Subtle Scanline Overlay */}
      <div className="forensiq-scanline z-15" />

      {/* LAYER 3 & 4: Center Content & FORENSIQ Logo Text Reveal */}
      <div className="relative z-30 w-full h-full flex flex-col items-center justify-center px-4">
        <div
          className={`relative flex flex-col items-center transition-all duration-700 ease-in-out ${
            phase === 4 ? 'scale-110 opacity-0 blur-sm' : 'scale-100 opacity-100'
          }`}
        >
          {/* Top Classification Banner (Dual Emerald + Cyan) */}
          <div className="flex items-center gap-2 mb-4 text-[10px] sm:text-xs tracking-[0.3em] uppercase font-bold opacity-90">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_10px_#00ff41]" />
            <span className="bg-gradient-to-r from-emerald-400 via-cyan-300 to-sky-400 bg-clip-text text-transparent">
              TOP SECRET // AUTONOMOUS MULTIMODAL FORENSICS
            </span>
          </div>

          {/* MAIN LOGO: Dissolve & Mask Showcase */}
          <div className="relative flex items-center justify-center my-2 sm:my-4">
            {/* Phase 3 Dissolve Background Preview Window (App peek through letters) */}
            {phase >= 3 && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden opacity-45">
                <div className="w-[120%] h-[120%] border border-cyan-500/50 rounded-xl bg-slate-950/85 p-3 grid grid-cols-3 gap-2 text-[9px] text-cyan-300 font-mono scale-90 blur-[0.5px] shadow-[0_0_30px_rgba(0,217,255,0.3)]">
                  <div className="border border-emerald-500/40 p-2 rounded bg-emerald-950/20">
                    <p className="text-emerald-400 font-bold">ELA ERROR ANALYSIS</p>
                    <p className="text-slate-300 mt-1">Noise variance: 0.042</p>
                    <p className="text-slate-400">Resave cycles: 3</p>
                  </div>
                  <div className="border border-cyan-500/40 p-2 rounded bg-cyan-950/20">
                    <p className="text-cyan-400 font-bold">SPECTRAL FFT SCAN</p>
                    <p className="text-slate-300 mt-1">Nyquist peak: 44.1kHz</p>
                    <p className="text-slate-400">Artifact delta: +12%</p>
                  </div>
                  <div className="border border-indigo-500/40 p-2 rounded bg-indigo-950/20">
                    <p className="text-indigo-400 font-bold">EXIF PROVENANCE</p>
                    <p className="text-slate-300 mt-1">SHA-256: 737998ae</p>
                    <p className="text-slate-400">Tamper: DETERMINISTIC</p>
                  </div>
                </div>
              </div>
            )}

            {/* Letter-by-letter Reveal Container */}
            <div className={`flex items-center gap-1 sm:gap-2.5 ${phase === 3 ? 'forensiq-through-mask' : ''}`}>
              {FORENSIQ_LETTERS.map((letter, index) => {
                const isRevealed = revealedLetters > index;
                return (
                  <span
                    key={index}
                    className={`forensiq-logo-letter forensiq-logo-letter-hybrid transition-all duration-300 ${
                      isRevealed
                        ? 'opacity-100 translate-y-0 filter-none'
                        : 'opacity-0 translate-y-8 blur-md'
                    }`}
                    style={{
                      animationDelay: `${index * 160}ms`,
                    }}
                  >
                    {letter}
                  </span>
                );
              })}
            </div>
          </div>

          {/* Subtitle / Department Tag */}
          <div className="text-[11px] sm:text-xs tracking-[0.25em] font-semibold mt-1 bg-gradient-to-r from-slate-400 via-cyan-200 to-slate-400 bg-clip-text text-transparent">
            TRUTHLENS COGNITIVE DEFENSE PIPELINE
          </div>
        </div>

        {/* LAYER 5: Tactical Loading Indicator & Telemetry */}
        <div
          className={`relative z-40 mt-10 sm:mt-12 flex flex-col items-center gap-3 transition-opacity duration-500 ${
            phase === 4 ? 'opacity-0' : 'opacity-100'
          }`}
        >
          {/* Triple-Glow Hybrid Progress Bar (Green to Cyan to Blue) */}
          <div className="w-60 sm:w-80 h-[3.5px] bg-slate-950 rounded-full overflow-hidden border border-cyan-900/60 p-[1px] shadow-[0_0_20px_rgba(0,217,255,0.35)]">
            <div
              className="h-full bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-500 transition-all duration-100 ease-out rounded-full"
              style={{
                width: `${progress}%`,
                boxShadow: '0 0 16px rgba(0, 255, 65, 0.9), 0 0 28px rgba(0, 217, 255, 0.85), 0 0 40px rgba(59, 130, 246, 0.6)',
              }}
            />
          </div>

          {/* Dynamic Typewriter / Status Text */}
          <div className="flex items-center gap-2 text-[10px] sm:text-xs text-cyan-300 tracking-wider font-mono">
            <Terminal className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span className="min-h-[18px]">{statusText}</span>
            <span className="text-emerald-400 font-bold ml-1">{progress}%</span>
          </div>

          {/* Telemetry Hardware Badges (Green, Cyan, Blue) */}
          <div className="hidden sm:flex items-center gap-4 text-[9px] text-slate-400 pt-1 font-mono">
            <span className="flex items-center gap-1.5 px-2 py-0.5 rounded border border-emerald-500/30 bg-emerald-950/30 text-emerald-300">
              <Cpu className="w-3 h-3 text-emerald-400" /> ELA+EXIF ENGINE
            </span>
            <span>•</span>
            <span className="flex items-center gap-1.5 px-2 py-0.5 rounded border border-cyan-500/30 bg-cyan-950/30 text-cyan-300">
              <Eye className="w-3 h-3 text-cyan-400" /> VISION TRANSFORMER
            </span>
            <span>•</span>
            <span className="flex items-center gap-1.5 px-2 py-0.5 rounded border border-blue-500/30 bg-blue-950/30 text-blue-300">
              <Database className="w-3 h-3 text-blue-400" /> SHA-256 VAULT
            </span>
          </div>
        </div>
      </div>

      {/* Skip Intro Button (Top Right) */}
      {skippable && (
        <button
          onClick={onComplete}
          className="absolute top-4 right-4 z-50 text-[10px] text-slate-400 hover:text-cyan-300 tracking-wider font-mono px-3 py-1.5 rounded-lg border border-slate-800 bg-black/60 hover:border-cyan-500/50 backdrop-blur-md transition-all duration-200"
          title="Skip Intro (Escape)"
        >
          SKIP INTRO [ESC]
        </button>
      )}
    </div>
  );
}
