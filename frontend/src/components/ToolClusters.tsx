import { Cpu, Eye, ShieldCheck } from 'lucide-react';

const clusters = [
  {
    title: 'Pixel & Frequency',
    icon: <Cpu className="text-cyan-400" size={20} />,
    color: 'cyan',
    badgeClass: 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400',
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
    badgeClass: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
    tools: [
      { name: 'ViT-V2', desc: 'Deepfake Classifier', status: 'ONLINE' },
      { name: 'VL-72B', desc: 'Multimodal Reasoner', status: 'ONLINE' }
    ]
  },
  {
    title: 'Custody & Compliance',
    icon: <ShieldCheck className="text-amber-400" size={20} />,
    color: 'amber',
    badgeClass: 'bg-amber-500/10 border-amber-500/20 text-amber-400',
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
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto mt-10 px-4">
      {clusters.map((cluster) => (
        <div
          key={cluster.title}
          className="bg-black/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-[0_0_30px_rgba(0,0,0,0.5)] hover:border-cyan-500/40 hover:shadow-cyan-950/30 transition-all duration-300 group"
        >
          {/* Cluster Header */}
          <div className="flex items-center gap-3 mb-5 border-b border-white/5 pb-4">
            <div className={`p-2 rounded-lg border ${cluster.badgeClass}`}>
              {cluster.icon}
            </div>
            <h3 className="text-white font-bold tracking-wide font-mono text-sm sm:text-base">
              {cluster.title}
            </h3>
          </div>

          {/* Tools List */}
          <div className="space-y-3 font-mono">
            {cluster.tools.map((tool) => (
              <div key={tool.name} className="flex items-center justify-between group/tool cursor-default py-1">
                <div>
                  <p className="text-sm font-semibold text-gray-300 group-hover/tool:text-cyan-300 transition-colors">
                    {tool.name}
                  </p>
                  <p className="text-xs text-gray-500 font-sans">{tool.desc}</p>
                </div>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    tool.status === 'ONLINE'
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                      : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                  }`}
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
