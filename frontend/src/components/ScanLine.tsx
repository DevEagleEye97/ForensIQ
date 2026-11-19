import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

export default function ScanLine() {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(mediaQuery.matches);

    const handler = (e: MediaQueryListEvent) => setReduced(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  if (reduced) return null;

  return (
    <>
      {/* Scan line */}
      <motion.div
        className="absolute left-0 right-0 h-1 bg-accent shadow-[0_0_20px_rgba(242,194,48,0.8)]"
        initial={{ top: '0%' }}
        animate={{ top: ['0%', '100%', '0%'] }}
        transition={{
          duration: 9,
          repeat: Infinity,
          ease: 'linear',
        }}
      />

      {/* Evidence marker */}
      <motion.div
        className="absolute w-12 h-12 border-2 border-accent rounded-full"
        style={{ top: '30%', left: '60%' }}
        initial={{ opacity: 0, scale: 0 }}
        animate={{
          opacity: [0, 1, 1, 0],
          scale: [0, 1, 1, 0],
        }}
        transition={{
          duration: 9,
          times: [0, 0.3, 0.7, 1],
          repeat: Infinity,
        }}
      />
    </>
  );
}
