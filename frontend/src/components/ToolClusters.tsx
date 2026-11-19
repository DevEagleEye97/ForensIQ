import { Cpu, Eye, ShieldCheck } from 'lucide-react';
import { cn } from '../lib/utils';

const clusters = [
  {
    title: 'Pixel & Frequency',
    icon: <Cpu className="text-cyan-400" size={20} />,
    color: 'cyan',
    tools: [
      { name: 'ELA-90', desc: 'Compression Forensics', status: 'ARMED' },
      { name: 'LAP-3X3', desc: 'Edge Gradient Variance', status: 'ARMED' },
      { name: 'FFT-2D', desc: 'Frequency Spectrum', status: 'ONLINE' },
      { name: 'PRNU-S', desc: 'Sensor Noise Fingerprint', status: 'ARMED' }
    ]
  },
  {
    title: 'AI & Vision Models',
    icon: <Eye className="text-emerald-400" size={20} />,
    color: 'emerald',
    tools: [
      { name: 'ViT-V2', desc: 'Deepfake Classifier', status: 'ONLINE' },
      { name: 'VL-72B', desc: 'Multimodal Reasoner', status: 'ONLINE' }
    ]
  },
  {
    title: 'Custody & Compliance',
    icon: <ShieldCheck className="text-amber-400" size={20} />,
    color: 'amber',
    tools: [
      { name: 'EXIF-PRV', desc: 'Metadata Provenance', status: 'ARMED' },
      { name: 'SHA-256', desc: 'Cryptographic Ledger', status: 'ARMED' },
      { name: 'NIST-800', desc: 'Audit & Traceability', status: 'ARMED' },
      { name: 'MARKITDOWN', desc: 'Document Ingestion', status: 'ARMED' }
    ]
  }
];

export default function ToolClusters() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto mt-6 sm:mt-10 px-2 sm:px-4">
      {clusters.map((cluster) => (
        <div
          key={cluster.title}
          className="neo-raised p-6 rounded-2xl transition-all duration-300 group"
        >
          {/* Cluster Header */}
          <div className="flex items-center gap-3 mb-5 pb-4 border-b border-white/5">
            <div className="neo-inset p-2.5 rounded-xl flex items-center justify-center">
              {cluster.icon}
            </div>
            <h3 className="text-white font-bold tracking-wide font-mono text-sm sm:text-base">
              {cluster.title}
            </h3>
          </div>

          {/* Tools List */}
          <div className="space-y-3">
            {cluster.tools.map((tool) => (
              <div key={tool.name} className="flex items-center justify-between group/tool cursor-default py-1">
                <div>
                  <p className="text-sm font-semibold font-mono text-slate-200 group-hover/tool:text-cyan-300 transition-colors">
                    {tool.name}
                  </p>
                  <p className="text-xs text-slate-400 font-sans">{tool.desc}</p>
                </div>
                <span
                  className={cn(
                    'neo-badge font-mono',
                    tool.status === 'ONLINE' ? 'text-emerald-400' : 'text-amber-400'
                  )}
                >
                  {tool.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
