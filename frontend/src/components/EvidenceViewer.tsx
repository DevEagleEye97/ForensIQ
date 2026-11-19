import { useState } from 'react';
import { motion } from 'framer-motion';

interface EvidenceViewerProps {
  file: File;
  elaEnabled: boolean;
  onToggleEla: () => void;
}

export default function EvidenceViewer({ file, elaEnabled, onToggleEla }: EvidenceViewerProps) {
  const [sliderPosition, setSliderPosition] = useState(50);
  const imageUrl = URL.createObjectURL(file);

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSliderPosition(Number(e.target.value));
  };

  return (
    <div className="relative w-full max-w-3xl">
      <div className="relative aspect-[4/3] bg-surface border border-border rounded-[20px] overflow-hidden backdrop-blur-3xl">
        {/* Original Image */}
        <img
          src={imageUrl}
          alt="Original evidence"
          className="absolute inset-0 w-full h-full object-contain"
        />

        {/* ELA Overlay */}
        {elaEnabled && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 w-full h-full"
            style={{
              clipPath: `inset(0 ${100 - sliderPosition}% 0 0)`,
            }}
          >
            <div
              className="w-full h-full"
              style={{
                background: `linear-gradient(90deg, 
                  rgba(58, 42, 122, 0.6) 0%, 
                  rgba(181, 48, 122, 0.6) 33%, 
                  rgba(255, 154, 60, 0.6) 66%, 
                  rgba(255, 241, 208, 0.6) 100%)`,
              }}
            />
          </motion.div>
        )}

        {/* Slider */}
        {elaEnabled && (
          <>
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-accent pointer-events-none"
              style={{ left: `${sliderPosition}%` }}
            />
            <input
              type="range"
              min="0"
              max="100"
              value={sliderPosition}
              onChange={handleSliderChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize"
              aria-label="Compare original and ELA view"
            />
          </>
        )}
      </div>

      {/* ELA Toggle */}
      <div className="mt-4 flex items-center justify-center gap-3">
        <button
          onClick={onToggleEla}
          className={`px-6 py-3 rounded-[20px] border transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-background ${
            elaEnabled
              ? 'bg-accent/10 border-accent text-accent'
              : 'bg-surface border-border text-text hover:shadow-[0_4px_16px_rgba(0,0,0,0.2)]'
          }`}
        >
          {elaEnabled ? 'ELA view' : 'Original'}
        </button>
      </div>
    </div>
  );
}
