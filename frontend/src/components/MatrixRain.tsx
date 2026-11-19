import React, { useEffect, useRef } from 'react';

interface MatrixRainProps {
  columns?: number;
  className?: string;
  color?: string;
  highlightColor?: string;
  fontSize?: number;
  speed?: number;
}

const FORENSIC_GLYPHS = [
  '0', '1', 'F', 'O', 'R', 'E', 'N', 'S', 'I', 'Q',
  'E', 'L', 'A', '9', '0', 'L', 'A', 'P', 'V', 'I', 'T',
  'S', 'H', 'A', '2', '5', '6', 'E', 'X', 'I', 'F',
  'P', 'R', 'N', 'U', 'F', 'F', 'T', 'N', 'I', 'S', 'T',
  '0x4A', '0xFF', '0xD8', '0x89', '0x00', '0x7E', '0x1C',
  'Δ', 'λ', 'Ω', 'Ψ', 'Σ', 'µ', '§', '¶', 'ø'
];

export const MatrixRain: React.FC<MatrixRainProps> = ({
  columns = 10,
  className = '',
  color = 'rgba(56, 189, 248, 0.75)', // sky-400
  highlightColor = '#ffffff',
  fontSize = 13,
  speed = 35,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let lastTime = 0;

    const resizeCanvas = () => {
      const parent = canvas.parentElement;
      if (parent) {
        canvas.width = parent.clientWidth;
        canvas.height = parent.clientHeight;
      }
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Initialize drops for the specified number of columns
    // Spread them evenly across width
    const totalCols = Math.max(columns, 1);
    const drops = Array.from({ length: totalCols }, () => Math.floor(Math.random() * -30));
    const speeds = Array.from({ length: totalCols }, () => 0.6 + Math.random() * 0.8);

    const render = (currentTime: number) => {
      animationFrameId = requestAnimationFrame(render);

      if (currentTime - lastTime < speed) {
        return;
      }
      lastTime = currentTime;

      // Dark translucent wash to create matrix fade trails
      ctx.fillStyle = 'rgba(11, 15, 25, 0.15)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.font = `600 ${fontSize}px "JetBrains Mono", Menlo, Consolas, monospace`;

      const colWidth = canvas.width / totalCols;

      for (let i = 0; i < totalCols; i++) {
        const x = i * colWidth + colWidth * 0.2;
        const y = drops[i] * fontSize;

        const glyph = FORENSIC_GLYPHS[Math.floor(Math.random() * FORENSIC_GLYPHS.length)];

        // Draw glowing head of stream
        ctx.fillStyle = highlightColor;
        ctx.shadowColor = '#38bdf8';
        ctx.shadowBlur = 8;
        ctx.fillText(glyph, x, y);

        // Draw body of trail just above
        ctx.fillStyle = color;
        ctx.shadowBlur = 2;
        const prevGlyph = FORENSIC_GLYPHS[Math.floor(Math.random() * FORENSIC_GLYPHS.length)];
        ctx.fillText(prevGlyph, x, y - fontSize);

        // Reset shadow
        ctx.shadowBlur = 0;

        // Increment drop
        drops[i] += speeds[i];

        // Reset when falling beyond canvas
        if (y > canvas.height && Math.random() > 0.96) {
          drops[i] = -Math.floor(Math.random() * 15);
        }
      }
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [columns, color, highlightColor, fontSize, speed]);

  return (
    <canvas
      ref={canvasRef}
      className={`block w-full h-full pointer-events-none select-none ${className}`}
    />
  );
};

export default MatrixRain;
