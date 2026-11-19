import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Terminal, Activity } from 'lucide-react';

interface CinematicTitleProps {
  onComplete?: () => void;
}

const LETTERS = ['F', 'O', 'R', 'E', 'N', 'S', 'I', 'Q'];

export const CinematicTitle: React.FC<CinematicTitleProps> = ({ onComplete }) => {
  const [animationSettled, setAnimationSettled] = useState(false);
  const [activeLetter, setActiveLetter] = useState<number | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimationSettled(true);
      onComplete?.();
    }, 1400);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="relative flex flex-col items-center justify-center select-none py-6">
      {/* Top Telemetry / Status Pill */}
      <motion.div
        initial={{ opacity: 0, scale: 0.85, y: -12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full border border-sky-500/30 bg-sky-950/40 text-sky-300 text-[11px] font-mono font-medium tracking-widest uppercase mb-6 shadow-lg shadow-sky-950/50 backdrop-blur-md"
      >
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
        </span>
        <Terminal className="w-3.5 h-3.5 text-sky-400" />
        <span>CYBER FORENSICS INTELLIGENCE CORE · V2.4</span>
        <span className="text-slate-600">|</span>
        <span className="text-emerald-400 font-bold">READY</span>
      </motion.div>

      {/* Main Title Aperture & Letters Container */}
      <div className="relative px-6 py-4 flex items-center justify-center">
        {/* Cinematic Laser Scanline Sweep */}
        <motion.div
          initial={{ left: '-10%', opacity: 0 }}
          animate={{ left: ['-10%', '110%'], opacity: [0, 1, 1, 0] }}
          transition={{ duration: 1.8, delay: 0.8, ease: 'easeInOut', repeat: Infinity, repeatDelay: 6 }}
          className="absolute top-0 bottom-0 w-24 pointer-events-none bg-gradient-to-r from-transparent via-cyan-400/30 to-transparent skew-x-12 z-20"
        />

        {/* Tactical Corner Brackets (Framing HUD) */}
        <motion.div
          initial={{ opacity: 0, scale: 1.3 }}
          animate={{ opacity: 0.7, scale: 1 }}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="absolute -top-3 -left-3 w-5 h-5 border-t-2 border-l-2 border-sky-500 pointer-events-none"
        />
        <motion.div
          initial={{ opacity: 0, scale: 1.3 }}
          animate={{ opacity: 0.7, scale: 1 }}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="absolute -top-3 -right-3 w-5 h-5 border-t-2 border-r-2 border-sky-500 pointer-events-none"
        />
        <motion.div
          initial={{ opacity: 0, scale: 1.3 }}
          animate={{ opacity: 0.7, scale: 1 }}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="absolute -bottom-3 -left-3 w-5 h-5 border-b-2 border-l-2 border-indigo-500 pointer-events-none"
        />
        <motion.div
          initial={{ opacity: 0, scale: 1.3 }}
          animate={{ opacity: 0.7, scale: 1 }}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="absolute -bottom-3 -right-3 w-5 h-5 border-b-2 border-r-2 border-indigo-500 pointer-events-none"
        />

        {/* Ambient Radial Backglow */}
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-600/15 via-indigo-600/20 to-teal-500/15 blur-2xl rounded-3xl pointer-events-none" />

        {/* Letter-by-letter Stagger Opening */}
        <h1 className="relative flex items-center gap-1 sm:gap-2.5 md:gap-4 font-black tracking-tight text-5xl sm:text-7xl md:text-8xl lg:text-9xl font-mono text-slate-100 drop-shadow-2xl">
          {LETTERS.map((char, index) => (
            <motion.span
              key={`${char}-${index}`}
              initial={{
                opacity: 0,
                y: 40,
                scale: 2.2,
                filter: 'blur(16px)',
                rotateX: -45,
              }}
              animate={{
                opacity: 1,
                y: 0,
                scale: activeLetter === index ? 1.15 : 1,
                filter: 'blur(0px)',
                rotateX: 0,
              }}
              transition={{
                duration: 0.7,
                delay: 0.2 + index * 0.08,
                type: 'spring',
                stiffness: 140,
                damping: 14,
              }}
              onMouseEnter={() => setActiveLetter(index)}
              onMouseLeave={() => setActiveLetter(null)}
              className="relative inline-block cursor-pointer transition-colors duration-150 group"
            >
              {/* Individual Glow & Gradient */}
              <span className="bg-gradient-to-b from-white via-sky-200 to-indigo-400 bg-clip-text text-transparent group-hover:from-cyan-300 group-hover:to-teal-200">
                {char}
              </span>

              {/* Sub-label for each letter (tactical indexing) */}
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: animationSettled ? 0.4 : 0 }}
                className="absolute -bottom-4 left-1/2 -translate-x-1/2 text-[9px] font-mono text-cyan-400 font-semibold"
              >
                0{index + 1}
              </motion.span>
            </motion.span>
          ))}
        </h1>
      </div>

      {/* Frequency Spectrograph / Audio-Visualizer Ticks */}
      <motion.div
        initial={{ opacity: 0, scaleX: 0.3 }}
        animate={{ opacity: 1, scaleX: 1 }}
        transition={{ duration: 0.8, delay: 0.9 }}
        className="flex items-center gap-1.5 mt-8 mb-4 px-6 py-1.5 rounded-lg bg-slate-900/60 border border-slate-800/80 backdrop-blur"
      >
        <Activity className="w-3.5 h-3.5 text-cyan-400 mr-2 animate-pulse" />
        {Array.from({ length: 24 }).map((_, i) => (
          <motion.div
            key={i}
            animate={{
              height: [4, (i % 5 + 2) * 3 + Math.sin(i) * 3, 4],
            }}
            transition={{
              duration: 1.2,
              repeat: Infinity,
              delay: (i * 0.05) % 0.8,
              ease: 'easeInOut',
            }}
            className={`w-1 rounded-full ${
              i % 4 === 0
                ? 'bg-cyan-400 shadow-sm shadow-cyan-400'
                : i % 2 === 0
                ? 'bg-indigo-400'
                : 'bg-slate-700'
            }`}
          />
        ))}
        <span className="text-[10px] font-mono text-slate-400 ml-2 tracking-wider">
          FREQ.SPECTRUM // ONLINE
        </span>
      </motion.div>

      {/* Subtitle & Classification */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 1.1 }}
        className="text-center max-w-2xl px-4"
      >
        <p className="text-sm sm:text-base md:text-lg font-mono text-cyan-300 font-semibold tracking-wide">
          AUTONOMOUS MULTI-SPECTRAL DIGITAL FORENSICS & DEEPFAKE TRIAGE
        </p>
        <p className="text-xs sm:text-sm text-slate-400 mt-2 font-mono">
          NIST SP 800-86 Cryptographic Evidence Ledger · Neural Face-Swap Scan · ELA Compression Differential
        </p>
      </motion.div>
    </div>
  );
};

export default CinematicTitle;
