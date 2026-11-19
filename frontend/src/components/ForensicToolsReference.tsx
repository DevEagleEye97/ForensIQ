import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Cpu, Eye, FileSearch, ShieldCheck, Layers,
  Binary, Compass, Sparkles, Database, FileCode,
  X
} from 'lucide-react';

export interface ForensicTool {
  id: string;
  code: string;
  name: string;
  category: 'Spatial & Frequency' | 'Deepfake & Neural' | 'Provenance & Integrity';
  icon: React.ElementType;
  status: 'ONLINE' | 'ARMED' | 'ACTIVE';
  latency: string;
  metric: string;
  description: string;
  spec: string;
  color: string;
  borderColor: string;
  glowColor: string;
}

export const FORENSIC_TOOLS_10: ForensicTool[] = [
  // Left 5 Tools
  {
    id: 'tool-01',
    code: 'TOOL_01 // ELA-90',
    name: 'Error Level Analysis (90% Q-Table)',
    category: 'Spatial & Frequency',
    icon: Layers,
    status: 'ARMED',
    latency: '85ms',
    metric: 'Δ 15% Threshold',
    description: 'In-memory JPEG re-compression at 90% quality highlighting localized compression differential. Pasted elements show distinct quantization noise.',
    spec: 'Standard: ITU-T T.81 | Kernel: Q90 Differential Matrix | Target: Splice & Inpainting',
    color: 'text-amber-400',
    borderColor: 'border-amber-500/30',
    glowColor: 'rgba(245, 158, 11, 0.2)',
  },
  {
    id: 'tool-02',
    code: 'TOOL_02 // LAP-3X3',
    name: '2D Laplacian Gradient Kernel',
    category: 'Spatial & Frequency',
    icon: Binary,
    status: 'ARMED',
    latency: '45ms',
    metric: 'Local Variance σ²',
    description: 'Calculates second-derivative image gradient variance using a 3x3 Laplacian filter. Unnatural edge sharpness or synthetic seams trigger warnings.',
    spec: 'Kernel: [[0, 1, 0], [1, -4, 1], [0, 1, 0]] | Boundary Aperture: 32px Windows',
    color: 'text-sky-400',
    borderColor: 'border-sky-500/30',
    glowColor: 'rgba(56, 189, 248, 0.2)',
  },
  {
    id: 'tool-03',
    code: 'TOOL_03 // FFT-2D',
    name: '2D Fast Fourier Transform Spectrum',
    category: 'Spatial & Frequency',
    icon: Cpu,
    status: 'ONLINE',
    latency: '110ms',
    metric: 'Spectrum dB Peaks',
    description: 'Decomposes spatial image data into frequency domain to surface periodic grid artifacts and checkerboard anomalies typical of GAN upsamplers.',
    spec: 'Transform: Radix-2 2D FFT | Window: Hanning | Range: High-Frequency Power Spectrum',
    color: 'text-cyan-400',
    borderColor: 'border-cyan-500/30',
    glowColor: 'rgba(6, 182, 212, 0.2)',
  },
  {
    id: 'tool-04',
    code: 'TOOL_04 // PRNU-S',
    name: 'Photo Response Non-Uniformity',
    category: 'Spatial & Frequency',
    icon: Eye,
    status: 'ARMED',
    latency: '140ms',
    metric: 'Silicon Sensor Hash',
    description: 'Extracts microscopic CMOS sensor noise fingerprint (PRNU) to authenticate specific camera hardware and unmask spliced inter-device elements.',
    spec: 'Algorithm: Wavelet Denoising Filter | Correlation: Normalized Peak to Correlation Energy',
    color: 'text-teal-400',
    borderColor: 'border-teal-500/30',
    glowColor: 'rgba(20, 184, 166, 0.2)',
  },
  {
    id: 'tool-05',
    code: 'TOOL_05 // EXIF-PRV',
    name: 'Hardware EXIF & Provenance Scanner',
    category: 'Provenance & Integrity',
    icon: FileSearch,
    status: 'ARMED',
    latency: '25ms',
    metric: 'Binary Header Pass',
    description: 'Parses raw binary markers for camera Make, Model, Lens, GPS coordinates, and flags editing software tags (Photoshop/GIMP) or stripped metadata.',
    spec: 'Standard: JEITA CP-3451E / TIFF 6.0 | Geotag: WGS-84 Precision Coordinate Resolution',
    color: 'text-indigo-400',
    borderColor: 'border-indigo-500/30',
    glowColor: 'rgba(99, 102, 241, 0.2)',
  },

  // Right 5 Tools
  {
    id: 'tool-06',
    code: 'TOOL_06 // VIT-V2',
    name: 'ViT Deepfake Classifier (HF Transformer)',
    category: 'Deepfake & Neural',
    icon: Sparkles,
    status: 'ONLINE',
    latency: '340ms',
    metric: 'Confidence % Score',
    description: 'Vision Transformer trained on deepfake face-swap benchmarks. Computes probability of generative GAN/diffusion synthesis across facial landmarks.',
    spec: 'Model: prithivMLmods/Deep-Fake-Detector-v2-Model | Patch: 16x16 | Classes: Real / Fake',
    color: 'text-fuchsia-400',
    borderColor: 'border-fuchsia-500/30',
    glowColor: 'rgba(217, 70, 239, 0.2)',
  },
  {
    id: 'tool-07',
    code: 'TOOL_07 // VL-72B',
    name: 'Multi-Modal Vision-Language Reasoner',
    category: 'Deepfake & Neural',
    icon: Compass,
    status: 'ONLINE',
    latency: '820ms',
    metric: 'Physical Logic Triage',
    description: 'Autonomous reasoning engine verifying light ray physics, shadow consistency, reflective specular highlights, and anatomical integrity.',
    spec: 'Engine: OpenRouter Vision Completion (Nemotron / Multi-Modal VL) | Zero-Crash Fallback',
    color: 'text-violet-400',
    borderColor: 'border-violet-500/30',
    glowColor: 'rgba(139, 92, 246, 0.2)',
  },
  {
    id: 'tool-08',
    code: 'TOOL_08 // MARKITDOWN',
    name: 'Microsoft MarkItDown Multimodal Ingestion',
    category: 'Provenance & Integrity',
    icon: FileCode,
    status: 'ARMED',
    latency: '190ms',
    metric: 'Multi-Format Parser',
    description: 'Universal document forensics converter transforming PDFs, Word DOCX, Excel spreadsheets, audio, and images into unified structured markdown dossiers.',
    spec: 'Engine: Microsoft MarkItDown Core v0.0.1a4 | OCR & Metadata Extraction Pipeline',
    color: 'text-emerald-400',
    borderColor: 'border-emerald-500/30',
    glowColor: 'rgba(16, 185, 129, 0.2)',
  },
  {
    id: 'tool-09',
    code: 'TOOL_09 // SHA-256',
    name: 'Cryptographic Chain-of-Custody Ledger',
    category: 'Provenance & Integrity',
    icon: ShieldCheck,
    status: 'ARMED',
    latency: '15ms',
    metric: 'SHA-256 Bitstream Hash',
    description: 'Generates immutable SHA-256 digital fingerprint immediately upon buffer ingestion, guaranteeing bit-level evidentiary chain-of-custody.',
    spec: 'Standard: FIPS PUB 180-4 Secure Hash Standard | Zero In-Transit Modification Verification',
    color: 'text-rose-400',
    borderColor: 'border-rose-500/30',
    glowColor: 'rgba(244, 63, 94, 0.2)',
  },
  {
    id: 'tool-10',
    code: 'TOOL_10 // NIST-800',
    name: 'Evidence Vault Self-Authentication',
    category: 'Provenance & Integrity',
    icon: Database,
    status: 'ARMED',
    latency: '30ms',
    metric: 'NIST SP 800-86 Audit',
    description: 'Integrates automated acquisition, preservation, analysis, and presentation audit logging adhering to legal standards for digital forensics.',
    spec: 'Framework: NIST Special Publication 800-86 | Federal Rules of Evidence Rule 902(14)',
    color: 'text-sky-300',
    borderColor: 'border-sky-500/30',
    glowColor: 'rgba(56, 189, 248, 0.2)',
  },
];

interface ToolCardProps {
  tool: ForensicTool;
  onSelect: (tool: ForensicTool) => void;
  selected?: boolean;
}

export const ToolCard: React.FC<ToolCardProps> = ({ tool, onSelect, selected }) => {
  const Icon = tool.icon;
  return (
    <motion.button
      type="button"
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      onClick={() => onSelect(tool)}
      className={`w-full text-left p-2.5 rounded-xl border transition-all duration-200 bg-slate-900/70 backdrop-blur-md relative overflow-hidden group ${
        selected
          ? `${tool.borderColor} shadow-lg ring-1 ring-sky-400/50`
          : 'border-slate-800/80 hover:border-slate-700'
      }`}
      style={{
        boxShadow: selected ? `0 0 15px ${tool.glowColor}` : undefined,
      }}
    >
      <div className="flex items-center justify-between gap-2 mb-1">
        <div className="flex items-center gap-2">
          <div className={`p-1.5 rounded-lg bg-slate-950 border ${tool.borderColor} ${tool.color}`}>
            <Icon className="w-3.5 h-3.5" />
          </div>
          <span className="font-mono text-[10px] text-slate-400 font-semibold group-hover:text-slate-200">
            {tool.code}
          </span>
        </div>
        <span className="flex items-center gap-1 font-mono text-[9px] text-emerald-400 font-medium px-1.5 py-0.5 rounded bg-emerald-950/40 border border-emerald-500/30">
          <span className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse" />
          {tool.status}
        </span>
      </div>

      <div className="text-xs font-semibold text-slate-200 truncate group-hover:text-white transition-colors">
        {tool.name}
      </div>

      <div className="flex items-center justify-between mt-1 text-[10px] font-mono text-slate-500">
        <span>{tool.metric}</span>
        <span className="text-slate-400">{tool.latency}</span>
      </div>
    </motion.button>
  );
};

export const ToolModal: React.FC<{ tool: ForensicTool | null; onClose: () => void }> = ({
  tool,
  onClose,
}) => {
  if (!tool) return null;
  const Icon = tool.icon;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="relative w-full max-w-lg rounded-2xl border border-slate-700 bg-slate-900/95 p-6 shadow-2xl text-slate-100 font-sans"
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3 mb-4">
            <div className={`p-2.5 rounded-xl bg-slate-950 border ${tool.borderColor} ${tool.color}`}>
              <Icon className="w-6 h-6" />
            </div>
            <div>
              <div className="font-mono text-xs text-sky-400 font-semibold">{tool.code}</div>
              <h3 className="text-lg font-bold text-slate-100">{tool.name}</h3>
            </div>
          </div>

          <div className="space-y-3 text-xs leading-relaxed text-slate-300">
            <div>
              <div className="font-mono text-[10px] uppercase tracking-wider text-slate-400 mb-1">
                Analytical Methodology
              </div>
              <p className="bg-slate-950/60 p-3 rounded-lg border border-slate-800/80 text-slate-300 font-mono text-[11px]">
                {tool.description}
              </p>
            </div>

            <div>
              <div className="font-mono text-[10px] uppercase tracking-wider text-slate-400 mb-1">
                Technical Specification & Standard
              </div>
              <p className="bg-slate-950/60 p-3 rounded-lg border border-slate-800/80 text-cyan-300 font-mono text-[11px]">
                {tool.spec}
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-2">
              <div className="p-2 rounded bg-slate-950/50 border border-slate-800 text-center">
                <span className="block font-mono text-[10px] text-slate-500">LATENCY</span>
                <span className="font-mono text-xs font-bold text-slate-200">{tool.latency}</span>
              </div>
              <div className="p-2 rounded bg-slate-950/50 border border-slate-800 text-center">
                <span className="block font-mono text-[10px] text-slate-500">STATE</span>
                <span className="font-mono text-xs font-bold text-emerald-400">{tool.status}</span>
              </div>
              <div className="p-2 rounded bg-slate-950/50 border border-slate-800 text-center">
                <span className="block font-mono text-[10px] text-slate-500">DIAGNOSTIC</span>
                <span className="font-mono text-xs font-bold text-sky-400">{tool.metric}</span>
              </div>
            </div>
          </div>

          <div className="mt-5 pt-4 border-t border-slate-800 flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-mono text-xs font-semibold transition-colors"
            >
              Acknowledge Spec
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
