import React from 'react';
import { motion } from 'framer-motion';
import {
  LayoutDashboard, History, FileBarChart2, ScanLine,
  Settings, Shield, Lock, ExternalLink,
  ArrowRight, Terminal, FileCode, Database,
  GitCompare, Video, Mic, ShieldAlert
} from 'lucide-react';
import { type Page } from '../components/AppHeader';

interface PagesHubProps {
  onNavigate: (page: Page) => void;
  onGoHome: () => void;
}

interface PageDescriptor {
  id: Page;
  path: string;
  title: string;
  subtitle: string;
  category: 'Workbench Core' | 'Forensic Vault' | 'Compliance & Governance' | 'System & Specs';
  icon: React.ElementType;
  status: 'ACTIVE' | 'OPERATIONAL' | 'ARMED';
  color: string;
  borderColor: string;
  description: string;
}

const PAGE_REGISTRY: PageDescriptor[] = [
  {
    id: 'dashboard',
    path: '/dashboard',
    title: 'Forensic Workbench',
    subtitle: 'Autonomous Image & Deepfake Triage',
    category: 'Workbench Core',
    icon: LayoutDashboard,
    status: 'ACTIVE',
    color: 'text-cyan-400',
    borderColor: 'border-cyan-500/30',
    description: 'Multi-spectral image forensics analyzing 2D Laplacian spatial gradients, 90% JPEG ELA differentials, EXIF camera signatures, and Hugging Face ViT face-swap models.',
  },
  {
    id: 'compare',
    path: '/compare',
    title: 'Differential Forensics',
    subtitle: 'Split Slider & Divergence Heatmap',
    category: 'Workbench Core',
    icon: GitCompare,
    status: 'ACTIVE',
    color: 'text-cyan-300',
    borderColor: 'border-cyan-400/40',
    description: 'Upload reference (real) and suspect (fake) media side-by-side with an interactive split slider, per-pixel divergence heatmap, and tile-level AI explanations.',
  },
  {
    id: 'video',
    path: '/video',
    title: 'Video Forensics',
    subtitle: 'Temporal Inter-Frame Consistency',
    category: 'Workbench Core',
    icon: Video,
    status: 'OPERATIONAL',
    color: 'text-emerald-400',
    borderColor: 'border-emerald-500/30',
    description: 'Keyframe decomposition across 24 FPS timelines to flag optical flow warping, face boundary flickering, and deepfake blend artifacts.',
  },
  {
    id: 'audio',
    path: '/audio',
    title: 'Audio Forensics',
    subtitle: 'Voice Synthesis & ASV-Spoof',
    category: 'Workbench Core',
    icon: Mic,
    status: 'OPERATIONAL',
    color: 'text-amber-400',
    borderColor: 'border-amber-500/30',
    description: 'Acoustic waveform analysis inspecting synthetic breath-gap absence, high-frequency robotic rolloff, and spectral MFCC voice cloning fingerprints.',
  },
  {
    id: 'threat-intel',
    path: '/threat-intel',
    title: 'Threat Intelligence',
    subtitle: 'Sourced Global & Regional Cyber Data',
    category: 'System & Specs',
    icon: ShieldAlert,
    status: 'ACTIVE',
    color: 'text-rose-400',
    borderColor: 'border-rose-500/30',
    description: 'Verified cyber fraud and deepfake growth telemetry from NCRB 2023, WEF 2025, CyberPeace Foundation, and Europol with zero hallucination.',
  },
  {
    id: 'history',
    path: '/history',
    title: 'Evidence Vault Ledger',
    subtitle: 'NIST SP 800-86 Cryptographic Ledger',
    category: 'Forensic Vault',
    icon: History,
    status: 'OPERATIONAL',
    color: 'text-indigo-400',
    borderColor: 'border-indigo-500/30',
    description: 'Immutable evidence ledger storing analyzed cases, tamper probabilities, SHA-256 bitstream hashes, CSV ledger exports, and full audit trails.',
  },
  {
    id: 'history',
    path: '/supabase',
    title: 'Supabase Cloud Vault',
    subtitle: 'PostgreSQL Realtime Telemetry',
    category: 'Forensic Vault',
    icon: Database,
    status: 'ACTIVE',
    color: 'text-emerald-400',
    borderColor: 'border-emerald-500/30',
    description: 'PostgreSQL encrypted cloud ledger on fxzylehiojnchtrwcvpu with row-level security (RLS), real-time WebSocket subscriptions, and REST replication.',
  },
  {
    id: 'reports',
    path: '/reports',
    title: 'Intelligence Dossiers',
    subtitle: 'Structured Forensic Reports',
    category: 'Forensic Vault',
    icon: FileBarChart2,
    status: 'OPERATIONAL',
    color: 'text-purple-400',
    borderColor: 'border-purple-500/30',
    description: 'Forensic triage dossiers with cryptographic sign-offs, anomaly signal vector breakdowns, and human review indicators.',
  },
  {
    id: 'scans',
    path: '/scans',
    title: 'Live Telemetry',
    subtitle: 'Real-Time RTP/RTSP Pipeline',
    category: 'Workbench Core',
    icon: ScanLine,
    status: 'ARMED',
    color: 'text-sky-400',
    borderColor: 'border-sky-500/30',
    description: 'High-throughput live stream ingestion interface for video and camera feeds (RTP/RTSP frame decomposition).',
  },
  {
    id: 'settings',
    path: '/settings',
    title: 'Platform Configuration',
    subtitle: 'Security, Models & Access Keys',
    category: 'System & Specs',
    icon: Settings,
    status: 'ARMED',
    color: 'text-amber-400',
    borderColor: 'border-amber-500/30',
    description: 'Manage OpenRouter Nemotron 3.5 VL models, Hugging Face credentials, SQLite vault backups, and API authorization guards.',
  },
  {
    id: 'privacy',
    path: '/privacy',
    title: 'Privacy Protocol',
    subtitle: 'In-Memory Zero-Disk Retention',
    category: 'Compliance & Governance',
    icon: Shield,
    status: 'OPERATIONAL',
    color: 'text-emerald-400',
    borderColor: 'border-emerald-500/30',
    description: 'Zero-retention data processing protocol ensuring evidence buffers are processed strictly in RAM and cleared post-inference.',
  },
  {
    id: 'terms',
    path: '/terms',
    title: 'Terms of Analysis',
    subtitle: 'Evidentiary Chain-of-Custody Rules',
    category: 'Compliance & Governance',
    icon: Lock,
    status: 'OPERATIONAL',
    color: 'text-rose-400',
    borderColor: 'border-rose-500/30',
    description: 'Legal terms governing automated forensic classification, Federal Rules of Evidence Rule 902(14), and expert witness attestation.',
  },
];

export const PagesHub: React.FC<PagesHubProps> = ({ onNavigate, onGoHome }) => {
  return (
    <div className="flex-1 bg-slate-950 text-slate-100 p-6 md:p-10 max-w-7xl mx-auto w-full font-sans">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-8 border-b border-slate-800">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-sky-500/30 bg-sky-950/40 text-sky-300 font-mono text-xs mb-3">
            <Terminal className="w-3.5 h-3.5 text-sky-400" />
            <span>ROUTER DIRECTORY // /pages</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black font-mono tracking-tight text-white">
            ForensIQ Routing Matrix
          </h1>
          <p className="text-sm text-slate-400 font-mono mt-1">
            Complete index of system modules, evidentiary vaults, compliance policies, and API endpoints.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onGoHome}
            className="px-4 py-2 rounded-lg border border-slate-700 hover:border-slate-600 bg-slate-900/60 hover:bg-slate-800 text-slate-300 text-xs font-mono font-semibold transition-colors"
          >
            &larr; Cinematic Splash
          </button>
          <button
            onClick={() => onNavigate('dashboard')}
            className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-mono font-bold transition-all shadow-md shadow-cyan-600/30 flex items-center gap-2"
          >
            Launch Workbench
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Pages Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mt-8">
        {PAGE_REGISTRY.map((p, idx) => {
          const Icon = p.icon;
          return (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              onClick={() => onNavigate(p.id)}
              className="cursor-pointer p-5 rounded-2xl border border-slate-800/80 bg-slate-900/40 hover:bg-slate-900/80 hover:border-cyan-500/40 transition-all duration-200 group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-2.5 rounded-xl bg-slate-950 border ${p.borderColor} ${p.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] text-slate-500 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                      {p.path}
                    </span>
                    <span className="font-mono text-[9px] text-emerald-400 px-1.5 py-0.5 rounded bg-emerald-950/40 border border-emerald-500/20">
                      {p.status}
                    </span>
                  </div>
                </div>

                <div className="font-mono text-[10px] text-slate-500 uppercase tracking-wider mb-1">
                  {p.category}
                </div>
                <h3 className="font-mono text-base font-bold text-slate-100 group-hover:text-cyan-300 transition-colors mb-1">
                  {p.title}
                </h3>
                <div className="text-xs text-sky-400/80 font-mono mb-3">{p.subtitle}</div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {p.description}
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs font-mono text-cyan-400 group-hover:translate-x-0.5 transition-transform">
                <span>Navigate &rarr;</span>
                <span className="text-[10px] text-slate-600">ID: {p.id}</span>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Backend Endpoints Direct Reference */}
      <div className="mt-12 p-6 rounded-2xl border border-slate-800 bg-slate-900/20 font-mono">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-300 mb-4">
          <FileCode className="w-4 h-4 text-cyan-400" />
          <span>MICROSERVICES API & TELEMETRY ACCESS</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <a
            href="/docs"
            target="_blank"
            rel="noreferrer"
            className="p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 flex items-center justify-between text-slate-300 hover:text-white"
          >
            <span>/docs (OpenAPI Swagger)</span>
            <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
          </a>
          <a
            href="/health"
            target="_blank"
            rel="noreferrer"
            className="p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 flex items-center justify-between text-slate-300 hover:text-white"
          >
            <span>/health (System Health)</span>
            <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
          </a>
          <a
            href="/redoc"
            target="_blank"
            rel="noreferrer"
            className="p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 flex items-center justify-between text-slate-300 hover:text-white"
          >
            <span>/redoc (ReDoc Spec)</span>
            <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
          </a>
          <a
            href="/openapi.json"
            target="_blank"
            rel="noreferrer"
            className="p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 flex items-center justify-between text-slate-300 hover:text-white"
          >
            <span>/openapi.json (JSON Schema)</span>
            <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
          </a>
        </div>
      </div>
    </div>
  );
};

export default PagesHub;
