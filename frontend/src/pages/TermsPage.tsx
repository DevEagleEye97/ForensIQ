import {
  FileText,
  Scale,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft
} from 'lucide-react';

interface TermsPageProps {
  onBack: () => void;
}

export default function TermsPage({ onBack }: TermsPageProps) {
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
          <div className="flex items-center gap-2 text-[10px] font-mono text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded-full border border-indigo-500/20">
            <Scale className="w-3.5 h-3.5" />
            Legal Attestation &amp; Evidence Terms
          </div>
        </div>

        {/* Title Header */}
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-teal-500/10 border border-teal-500/20 text-teal-400 text-xs font-mono">
            <FileText className="w-3.5 h-3.5" /> FORENSIQ PLATFORM OPERATOR AGREEMENT
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white font-mono">
            Terms of Forensic Service &amp; Evidentiary Disclaimer
          </h1>
          <p className="text-sm text-slate-400 leading-relaxed">
            Last Updated: November 19, 2026 · Governing Standard: Federal Rules of Evidence Rule 902(14)
          </p>
        </div>

        {/* Warning Banner */}
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="text-xs font-semibold text-amber-300">Evidentiary Notice for Legal Proceedings</h4>
            <p className="text-xs text-amber-200/80 leading-relaxed">
              ForensIQ provides automated multi-tier probabilistic telemetry based on Error Level Analysis (ELA), EXIF hardware signatures, and neural vision classifiers. Scores and classifications must be evaluated alongside comprehensive human forensic expert review prior to submission as evidence in judicial proceedings.
            </p>
          </div>
        </div>

        {/* Sections */}
        <div className="space-y-6 text-sm text-slate-300 leading-relaxed border-t border-slate-800 pt-6">
          <section className="space-y-2">
            <h2 className="text-base font-bold text-white font-mono flex items-center gap-2">
              <span className="text-teal-400">01.</span> Scope of Authorized Use
            </h2>
            <p className="text-xs text-slate-400">
              ForensIQ is licensed for cybersecurity defense, corporate intelligence, journalistic fact-checking, and law enforcement forensic analysis. Users agree not to utilize the platform to reverse-engineer proprietary detection algorithms, develop adversarial evasion techniques, or submit unlawful non-consensual media.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-white font-mono flex items-center gap-2">
              <span className="text-teal-400">02.</span> Probabilistic Inference &amp; False-Positive Disclaimers
            </h2>
            <p className="text-xs text-slate-400">
              Deepfake detection models are probabilistic statistical systems. High ELA variance can occasionally arise from aggressive multi-generation recompression on legitimate messaging platforms. ForensIQ provides transparent telemetry and ELA base64 difference maps to enable independent human verification.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-white font-mono flex items-center gap-2">
              <span className="text-teal-400">03.</span> Chain-of-Custody &amp; Tamper Resistance
            </h2>
            <p className="text-xs text-slate-400">
              Generated forensic reports and SHA-256 evidence vaults are designed to fulfill Rule 902(14) of the Federal Rules of Evidence for self-authenticating digital records. Any alteration to exported certificate markdown/JSON invalidates the cryptographic chain-of-custody seal.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-white font-mono flex items-center gap-2">
              <span className="text-teal-400">04.</span> Limitation of Liability
            </h2>
            <p className="text-xs text-slate-400">
              Under no circumstances shall ForensIQ developers or affiliates be liable for indirect, incidental, or consequential damages arising from algorithmic classifications, network timeouts, or reliance on automated forensic telemetry.
            </p>
          </section>
        </div>

        {/* Bottom attestation */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-500 font-mono flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-slate-400">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Digital Evidence Admissibility Guidelines Verified</span>
          </div>
          <span>Ref: FORENSIQ-LEGAL-TOS-V2</span>
        </div>
      </div>
    </div>
  );
}
