import {
  Lock,
  Database,
  EyeOff,
  Server,
  ArrowLeft,
  Scale,
  FileCheck2
} from 'lucide-react';

interface LegalPageProps {
  onBack: () => void;
  onSwitchToTerms?: () => void;
}

export default function PrivacyPolicyPage({ onBack, onSwitchToTerms }: LegalPageProps) {
  return (
    <div className="flex-1 overflow-y-auto bg-slate-950 text-slate-100 p-4 sm:p-8 selection:bg-cyan-500/30 selection:text-cyan-200">
      <div className="max-w-4xl mx-auto space-y-8 pb-12">
        {/* Top bar with back button & Tab Switcher */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800 pb-4 gap-3">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-xs font-medium text-slate-400 hover:text-cyan-400 transition-colors min-h-[44px] px-2 font-mono group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Back to Application
          </button>

          {/* Quick Legal Switcher Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-900 border border-slate-800 rounded-xl font-mono text-xs">
            <span className="px-3 py-1.5 rounded-lg bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 font-semibold flex items-center gap-1.5 shadow-sm">
              <Lock className="w-3.5 h-3.5 text-indigo-400" />
              Privacy Policy
            </span>
            {onSwitchToTerms && (
              <button
                onClick={onSwitchToTerms}
                className="px-3 py-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 transition-all flex items-center gap-1.5"
              >
                <Scale className="w-3.5 h-3.5 text-teal-400" />
                Terms &amp; Conditions
              </button>
            )}
          </div>
        </div>

        {/* Title Header */}
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-mono">
            <Lock className="w-3.5 h-3.5" /> FORENSIC PRIVACY &amp; CHAIN-OF-CUSTODY SPECIFICATION
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white font-mono">
            Privacy Policy &amp; Data Protocol
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 leading-relaxed font-mono">
            Effective Date: November 20, 2026 · Document Classification: PUBLIC / FORENSIC AUDIT · Standard: NIST SP 800-86
          </p>
        </div>

        {/* Core Principles Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2 backdrop-blur-sm">
            <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg w-fit">
              <EyeOff className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-semibold text-white font-mono">Zero-Disk Retention</h3>
            <p className="text-xs text-slate-400 leading-relaxed font-sans">
              Media is processed strictly in volatile RAM streams (BytesIO). Raw file bytes are never written to disk or preserved in temporary staging directories.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2 backdrop-blur-sm">
            <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg w-fit">
              <Database className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-semibold text-white font-mono">Masked Fingerprints</h3>
            <p className="text-xs text-slate-400 leading-relaxed font-sans">
              Only immutable cryptographic SHA-256 hashes, EXIF hardware tags, and synthesized ELA heatmaps are indexed for evidentiary verification.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2 backdrop-blur-sm">
            <div className="p-2 bg-sky-500/10 text-sky-400 rounded-lg w-fit">
              <Server className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-semibold text-white font-mono">Keyless Frontend</h3>
            <p className="text-xs text-slate-400 leading-relaxed font-sans">
              All neural weights and model credentials remain server-side behind the ASGI reverse proxy. Zero sensitive secrets are transmitted to client browsers.
            </p>
          </div>
        </div>

        {/* Evidentiary Notice Banner */}
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-start gap-3">
          <FileCheck2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
          <div className="space-y-1 text-xs">
            <h4 className="font-semibold text-emerald-300 font-mono">NIST SP 800-86 &amp; ISO/IEC 27037 Attestation</h4>
            <p className="text-emerald-200/80 leading-relaxed font-sans">
              ForensIQ operates under international digital forensics guidelines. Ingested files are cryptographically fingerprinted upon byte stream receipt. The original evidence bitstream is protected against tampering and discarded immediately upon analytical feature extraction.
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
              <strong>Mandatory Transit Notice:</strong> To perform AI deepfake analysis, uploaded images are securely transmitted over TLS 1.3 to third-party inference APIs (Hugging Face, OpenRouter). We do not store your images on our servers or external services beyond the immediate analysis session. In the event of network disruption, rate limits, or missing API keys, ForensIQ automatically engages our local in-memory 2D-FFT spectral neural engine with zero external transmission.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-white font-mono flex items-center gap-2">
              <span className="text-indigo-400">04.</span> Data Collection Scope &amp; No PII Logging
            </h2>
            <p className="text-xs text-slate-400">
              ForensIQ does not collect, harvest, or monetize any personal or contextual content data. We only analyze the submitted media and the processed forensic metrics derived from it (SHA-256 digests, EXIF metadata tags, ELA difference previews, and classifier telemetry). No personal contact records, browsing cookies, or external device identifiers are gathered or stored.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-white font-mono flex items-center gap-2">
              <span className="text-indigo-400">05.</span> Third-Party Sharing Restrictions
            </h2>
            <p className="text-xs text-slate-400">
              No images, biometric facial coordinates, or processed forensic data are ever sold or shared with commercial data brokers. Analytical payloads are transmitted solely to the user-authorized neural inference providers (OpenRouter / Hugging Face) under strict zero-persistence API agreements.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-white font-mono flex items-center gap-2">
              <span className="text-indigo-400">06.</span> User Rights &amp; Regulatory Compliance (GDPR, CCPA, DPDP)
            </h2>
            <p className="text-xs text-slate-400">
              Under GDPR Articles 15-22, the California Consumer Privacy Act (CCPA), and India's Digital Personal Data Protection (DPDP) Act 2023, operators have the right to inspect, export, or immediately purge any case record indexed in their Evidence Vault. Purging a case record permanently eliminates its cryptographic hash and metadata associations.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-white font-mono flex items-center gap-2">
              <span className="text-indigo-400">07.</span> Contact &amp; Forensic Auditing Inquiries
            </h2>
            <p className="text-xs text-slate-400">
              Inquiries regarding forensic chain-of-custody compliance, model verification protocols, or security audits should be directed to Team Bhairava via our official repository issue tracker at <a href="https://github.com/DevEagleEye97/ForensIQ" target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:underline">github.com/DevEagleEye97/ForensIQ</a>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
