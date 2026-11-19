import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import Vanta from 'vanta/dist/vanta.net.min';

export default function MatrixBackground() {
  const ref = useRef<HTMLDivElement>(null);
  const fx = useRef<any>(null);

  useEffect(() => {
    if (!ref.current) return;

    try {
      fx.current = (Vanta as any)({
        el: ref.current,
        THREE,
        color: 0x00ff41,
        backgroundColor: 0x0a0a0a,
        spacing: 12,
        maxDistance: 22,
        showDots: true,
        mouseControls: true,
        gyroControls: false,
        scale: 1.0,
      });
    } catch (err) {
      console.warn('[MatrixBackground] Vanta.js WebGL initialization notice:', err);
    }

    return () => {
      if (fx.current && typeof fx.current.destroy === 'function') {
        try {
          fx.current.destroy();
        } catch (_) {}
      }
    };
  }, []);

  return <div ref={ref} className="vanta-bg" />;
}
