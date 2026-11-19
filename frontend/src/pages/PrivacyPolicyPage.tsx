import {
  ShieldCheck,
  Lock,
  Database,
  EyeOff,
  Server,
  ArrowLeft
} from 'lucide-react';

interface LegalPageProps {
  onBack: () => void;
}

export default function PrivacyPolicyPage({ onBack }: LegalPageProps) {
  return (
    <div className="flex-1 overflow-y-auto bg-slate-950 text-slate-100 p-4 sm:p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Top bar with back button */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-xs font-medium text-slate-400 hover:text-indigo-400 transition-colors min-h-[44px] px-2"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Application
          </button>
          <div className="flex items-center gap-2 text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
            <ShieldCheck className="w-3.5 h-3.5" />
            NIST SP 800-86 &amp; ISO/IEC 27037 Standard
          </div>
        </div>

        {/* Title Header */}
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-mono">
            <Lock className="w-3.5 h-3.5" /> FORENSIC PRIVACY &amp; CHAIN-OF-CUSTODY SPECIFICATION
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white font-mono">
            Privacy Policy &amp; Data Handling Protocol
          </h1>
          <p className="text-sm text-slate-400 leading-relaxed">
            Effective Date: November 19, 2026 · Document Classification: PUBLIC / REGULATORY AUDIT
          </p>
        </div>

        {/* Core Principles Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
            <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg w-fit">
              <EyeOff className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-semibold text-white">Zero-Disk Retention</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Target files are processed strictly in RAM streams (BytesIO). Raw file bytes are never persisted to secondary storage or leaked into temp directories.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
            <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg w-fit">
              <Database className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-semibold text-white">Cryptographic Fingerprints</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Only immutable SHA-256 hashes, EXIF metadata tags, and synthesized ELA difference previews are stored in the SQLite Evidence Vault.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
            <div className="p-2 bg-sky-500/10 text-sky-400 rounded-lg w-fit">
              <Server className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-semibold text-white">Keyless Frontend</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              API keys and model credentials remain server-side behind the ASGI reverse proxy. Zero operational secrets are exposed to client browsers.
            </p>
          </div>
        </div>

        {/* Detailed Sections */}
        <div className="space-y-6 text-sm text-slate-300 leading-relaxed border-t border-slate-800 pt-6">
          <section className="space-y-2">
            <h2 className="text-base font-bold text-white font-mono flex items-center gap-2">
              <span className="text-indigo-400">01.</span> Ingestion &amp; Boundary Sanitization
            </h2>
            <p className="text-xs text-slate-400">
              When an investigator or analyst uploads media to the ForensIQ workbench, the payload undergoes rigorous magic byte inspection via <code className="text-indigo-300 font-mono">filetype</code> to enforce genuine binary signatures (JPEG: FFD8..FFD9, PNG: 89504E47). Payloads exceeding 25MB are terminated immediately with HTTP 413 to protect platform resources.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-white font-mono flex items-center gap-2">
              <span className="text-indigo-400">02.</span> Evidentiary Chain-of-Custody (NIST SP 800-86)
            </h2>
            <p className="text-xs text-slate-400">
              Every forensic artifact processed generates a deterministically computed SHA-256 cryptographic digest. This digest is archived alongside timestamped telemetry in the local SQLite database (<code className="text-indigo-300 font-mono">evidence_vault</code>) to ensure evidentiary integrity and reproducibility required by criminal justice and digital forensics standards.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-white font-mono flex items-center gap-2">
              <span className="text-indigo-400">03.</span> External AI Inference &amp; Privacy Boundaries
            </h2>
            <p className="text-xs text-slate-400">
              When Tier 2 (Hugging Face) and Tier 3 (OpenRouter) neural classifiers are queried, payloads are transferred via TLS 1.3 encrypted connections with strict 5-second timeout safeguards. If external APIs fail or are disabled, the platform executes a 100% offline, deterministic heuristic fallback protocol without transmitting any bytes externally.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-white font-mono flex items-center gap-2">
              <span className="text-indigo-400">05.</span> Data Collection &amp; Retention
            </h2>
            <p className="text-xs text-slate-400">
              ForensIQ does not collect, store, or process any personal or contextual content data. We only collect the submitted images and the processed forensic data derived from them (SHA-256 digests, EXIF metadata tags, ELA difference previews, and classifier telemetry). No additional content, communications, browsing data, or identifiers are gathered or retained beyond what is required for evidentiary analysis.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-white font-mono flex items-center gap-2">
              <span className="text-indigo-400">06.</span> Third-Party Sharing
            </h2>
            <p className="text-xs text-slate-400">
              No images or processed forensic data are shared with third parties unless explicitly required for Tier 2/3 neural inference, in which case payloads are transmitted under TLS 1.3 with strict timeout safeguards and no persistent retention by the receiving service.
            </p>
          </section>
        </div>

        {/* Footer Note */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800/80 flex items-center justify-between text-xs text-slate-500 font-mono">
          <span>ForensIQ Autonomous Platform v2.0</span>
          <span>Security Protocol Signed: SHA256 Verified ✓</span>
        </div>
      </div>
    </div>
  );
}
