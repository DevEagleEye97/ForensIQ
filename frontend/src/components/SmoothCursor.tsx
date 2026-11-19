import React, { useEffect, useState, useRef } from 'react';

/**
 * 120 Hz iOS-style fluid cursor with momentum physics,
 * magnetic element snapping, and dynamic morphing.
 */
export const SmoothCursor: React.FC = () => {
  const [enabled, setEnabled] = useState(true);
  const [hovered, setHovered] = useState(false);
  const [clicked, setClicked] = useState(false);
  const [magneticTarget, setMagneticTarget] = useState<{ x: number; y: number; width: number; height: number } | null>(null);

  // Position references for 120Hz lerp
  const mouse = useRef({ x: -100, y: -100 });
  const cursor = useRef({ x: -100, y: -100, vx: 0, vy: 0 });
  const cursorElRef = useRef<HTMLDivElement | null>(null);
  const dotElRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // Disable on touch screens or mobile
    if (window.matchMedia('(pointer: coarse)').matches) {
      setEnabled(false);
      return;
    }

    const onMouseMove = (e: MouseEvent) => {
      mouse.current.x = e.clientX;
      mouse.current.y = e.clientY;

      // Check if hovering an interactive element (iOS magnetic attraction)
      const target = e.target as HTMLElement | null;
      if (target) {
        const interactive = target.closest(
          'button, a, input, select, textarea, [role="button"], .interactive-element'
        );
        if (interactive) {
          const rect = interactive.getBoundingClientRect();
          setHovered(true);
          // Magnetic center pull if within close range
          setMagneticTarget({
            x: rect.left + rect.width / 2,
            y: rect.top + rect.height / 2,
            width: rect.width,
            height: rect.height,
          });
          return;
        }
      }
      setHovered(false);
      setMagneticTarget(null);
    };

    const onMouseDown = () => setClicked(true);
    const onMouseUp = () => setClicked(false);
    const onMouseLeave = () => {
      mouse.current.x = -100;
      mouse.current.y = -100;
    };

    window.addEventListener('mousemove', onMouseMove, { passive: true });
    window.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mouseup', onMouseUp);
    document.addEventListener('mouseleave', onMouseLeave);

    // 120Hz Animation Loop via requestAnimationFrame
    let animationFrameId: number;

    const animate = () => {
      // Smooth iOS-style spring deceleration (lerp factor ~0.20 for 120Hz feel)
      const targetX = magneticTarget ? magneticTarget.x : mouse.current.x;
      const targetY = magneticTarget ? magneticTarget.y : mouse.current.y;

      const dx = targetX - cursor.current.x;
      const dy = targetY - cursor.current.y;

      cursor.current.vx = dx * 0.22;
      cursor.current.vy = dy * 0.22;

      cursor.current.x += cursor.current.vx;
      cursor.current.y += cursor.current.vy;

      // Compute velocity for dynamic squash & stretch
      const speed = Math.hypot(cursor.current.vx, cursor.current.vy);
      const angle = Math.atan2(cursor.current.vy, cursor.current.vx) * (180 / Math.PI);
      const stretch = Math.min(1 + speed * 0.015, 1.35);
      const squash = Math.max(1 - speed * 0.01, 0.8);

      if (cursorElRef.current) {
        if (hovered && magneticTarget) {
          // Snap/morph into target capsule bounds
          const targetW = Math.min(magneticTarget.width + 12, 160);
          const targetH = Math.min(magneticTarget.height + 8, 80);
          cursorElRef.current.style.transform = `translate3d(${cursor.current.x}px, ${cursor.current.y}px, 0) translate(-50%, -50%) scale(${clicked ? 0.92 : 1})`;
          cursorElRef.current.style.width = `${targetW}px`;
          cursorElRef.current.style.height = `${targetH}px`;
          cursorElRef.current.style.borderRadius = '14px';
        } else {
          const baseSize = clicked ? 24 : 32;
          cursorElRef.current.style.transform = `translate3d(${cursor.current.x}px, ${cursor.current.y}px, 0) translate(-50%, -50%) rotate(${angle}deg) scale(${stretch}, ${squash})`;
          cursorElRef.current.style.width = `${baseSize}px`;
          cursorElRef.current.style.height = `${baseSize}px`;
          cursorElRef.current.style.borderRadius = '9999px';
        }
      }

      if (dotElRef.current) {
        // Dot tracks mouse exactly without delay
        dotElRef.current.style.transform = `translate3d(${mouse.current.x}px, ${mouse.current.y}px, 0) translate(-50%, -50%)`;
      }

      animationFrameId = requestAnimationFrame(animate);
    };

    animationFrameId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mouseup', onMouseUp);
      document.removeEventListener('mouseleave', onMouseLeave);
    };
  }, [hovered, magneticTarget, clicked]);

  if (!enabled) return null;

  return (
    <>
      {/* Outer iOS fluid capsule / ring */}
      <div
        ref={cursorElRef}
        aria-hidden="true"
        className="pointer-events-none fixed top-0 left-0 z-[9999] transition-[width,height,border-radius,background-color] duration-150 ease-out will-change-transform select-none"
        style={{
          border: hovered ? '1.5px solid rgba(56, 189, 248, 0.7)' : '1px solid rgba(56, 189, 248, 0.45)',
          backgroundColor: hovered ? 'rgba(56, 189, 248, 0.12)' : 'rgba(56, 189, 248, 0.05)',
          boxShadow: hovered ? '0 0 20px rgba(56, 189, 248, 0.35)' : '0 0 8px rgba(56, 189, 248, 0.15)',
        }}
      />

      {/* Inner pinpoint reticle dot */}
      <div
        ref={dotElRef}
        aria-hidden="true"
        className="pointer-events-none fixed top-0 left-0 z-[10000] w-1.5 h-1.5 rounded-full bg-cyan-400 will-change-transform shadow-[0_0_6px_#38bdf8]"
      />
    </>
  );
};

export default SmoothCursor;
