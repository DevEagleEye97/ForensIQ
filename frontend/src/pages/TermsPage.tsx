import {
  FileText,
  Scale,
  Lock,
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  ShieldAlert
} from 'lucide-react';

interface TermsPageProps {
  onBack: () => void;
  onSwitchToPrivacy?: () => void;
}

export default function TermsPage({ onBack, onSwitchToPrivacy }: TermsPageProps) {
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
            {onSwitchToPrivacy && (
              <button
                onClick={onSwitchToPrivacy}
                className="px-3 py-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 transition-all flex items-center gap-1.5"
              >
                <Lock className="w-3.5 h-3.5 text-indigo-400" />
                Privacy Policy
              </button>
            )}
            <span className="px-3 py-1.5 rounded-lg bg-teal-600/30 text-teal-300 border border-teal-500/40 font-semibold flex items-center gap-1.5 shadow-sm">
              <Scale className="w-3.5 h-3.5 text-teal-400" />
              Terms &amp; Conditions
            </span>
          </div>
        </div>

        {/* Title Header */}
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-teal-500/10 border border-teal-500/20 text-teal-400 text-xs font-mono">
            <FileText className="w-3.5 h-3.5" /> FORENSIQ PLATFORM OPERATOR AGREEMENT
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white font-mono">
            Terms of Forensic Service &amp; Conditions
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 leading-relaxed font-mono">
            Last Updated: November 20, 2026 · Governing Standard: Federal Rules of Evidence Rule 902(14)
          </p>
        </div>

        {/* Evidentiary Notice Banner */}
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3 backdrop-blur-sm">
          <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="text-xs font-semibold text-amber-300 font-mono">Evidentiary Notice for Legal Proceedings</h4>
            <p className="text-xs text-amber-200/80 leading-relaxed font-sans">
              ForensIQ generates multi-spectral probabilistic telemetry based on Error Level Analysis (ELA), EXIF hardware signatures, and neural vision classifiers. Numerical probability scores and algorithmic classifications must be evaluated alongside comprehensive human forensic expert review prior to introduction as evidence in legal proceedings.
            </p>
          </div>
        </div>

        {/* Core Principles Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2 backdrop-blur-sm">
            <div className="p-2 bg-teal-500/10 text-teal-400 rounded-lg w-fit">
              <Scale className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-semibold text-white font-mono">Rule 902(14) Attestation</h3>
            <p className="text-xs text-slate-400 leading-relaxed font-sans">
              Exported SHA-256 evidence certificates are formatted to satisfy Federal Rules of Evidence Rule 902(14) for self-authenticating digital records.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2 backdrop-blur-sm">
            <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg w-fit">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-semibold text-white font-mono">Permitted Use</h3>
            <p className="text-xs text-slate-400 leading-relaxed font-sans">
              ForensIQ is licensed for cyber defense, journalism verification, fraud mitigation, corporate threat intelligence, and lawful investigation.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2 backdrop-blur-sm">
            <div className="p-2 bg-rose-500/10 text-rose-400 rounded-lg w-fit">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-semibold text-white font-mono">Adversarial Defense</h3>
            <p className="text-xs text-slate-400 leading-relaxed font-sans">
              Users agree not to probe, benchmark, or extract models to construct adversarial evasion vectors, spoofing pipelines, or deepfake synthesizers.
            </p>
          </div>
        </div>

        {/* Sections */}
        <div className="space-y-6 text-sm text-slate-300 leading-relaxed border-t border-slate-800 pt-6">
          <section className="space-y-2">
            <h2 className="text-base font-bold text-white font-mono flex items-center gap-2">
              <span className="text-teal-400">01.</span> Scope of Authorized Use &amp; Platform Access
            </h2>
            <p className="text-xs text-slate-400">
              ForensIQ is granted to authorized operators for cybersecurity defense, institutional fact-checking, and digital evidence analysis. By utilizing the platform, you certify that all uploaded files are legally obtained or submitted within authorized evidentiary or research boundaries. Submitting non-consensual sexually explicit content, unlawful malware binaries, or copyrighted materials without proper investigative authorization is strictly prohibited.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-white font-mono flex items-center gap-2">
              <span className="text-teal-400">02.</span> Probabilistic Inference &amp; False-Positive Disclaimers
            </h2>
            <p className="text-xs text-slate-400">
              Deepfake detection models are probabilistic statistical systems. High ELA variance can occasionally arise from aggressive multi-generation recompression on messaging services (e.g. WhatsApp, Telegram, or web screen captures). Normal photos with stripped metadata are marked as <code className="text-amber-400 font-mono">Authentic (Metadata Stripped)</code>. Operators must review the visual difference previews and technical signals before rendering final evidentiary determinations.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-white font-mono flex items-center gap-2">
              <span className="text-teal-400">03.</span> Chain-of-Custody &amp; Cryptographic Tamper Resistance
            </h2>
            <p className="text-xs text-slate-400">
              Generated forensic reports and SHA-256 evidence vaults are designed to fulfill Rule 902(14) of the Federal Rules of Evidence for self-authenticating digital records. Any alteration to exported certificate markdown, JSON, or HTML seals invalidates the cryptographic chain-of-custody guarantee.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-white font-mono flex items-center gap-2">
              <span className="text-teal-400">04.</span> Data Collection Scope &amp; Processing Boundaries
            </h2>
            <p className="text-xs text-slate-400">
              ForensIQ does not harvest or retain personal contextual data. We strictly process the uploaded image bytes in volatile RAM (BytesIO streams) and record only derived forensic metadata (SHA-256 digests, EXIF tags, spatial anomaly scores, and classification telemetry). No raw file content is preserved on disk after feature extraction.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-white font-mono flex items-center gap-2">
              <span className="text-teal-400">05.</span> Prohibition on Reverse-Engineering &amp; Adversarial Evasion
            </h2>
            <p className="text-xs text-slate-400">
              Operators agree not to utilize ForensIQ to conduct automated adversarial perturbation attacks, train synthetic generator discriminators, or reverse-engineer the heuristic consensus algorithms for the purpose of evading deepfake detection systems.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-white font-mono flex items-center gap-2">
              <span className="text-teal-400">06.</span> Limitation of Liability &amp; Judicial Expert Attestation
            </h2>
            <p className="text-xs text-slate-400">
              Under no circumstances shall ForensIQ developers, contributors, or Team Bhairava be liable for indirect, incidental, or consequential damages resulting from algorithmic misclassifications, network timeouts, or third-party inference disruptions. Automated scoring should be corroborated by qualified human forensic examiners for court filings.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-white font-mono flex items-center gap-2">
              <span className="text-teal-400">07.</span> Governing Law &amp; Platform Updates
            </h2>
            <p className="text-xs text-slate-400">
              These terms are governed by international digital forensics standards and evidentiary principles. ForensIQ reserves the right to update these terms to reflect evolving AI regulatory frameworks (such as the EU AI Act and national deepfake transparency mandates).
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
