import { Users, Github, Award, Sparkles } from 'lucide-react';

interface TeamMember {
  name: string;
  role: string;
  spec: string;
  note: string;
  avatarColor: string;
}

const TEAM_MEMBERS: TeamMember[] = [
  {
    name: 'Dhanush Gangadhar',
    role: 'Team Leader',
    spec: 'Backend & Forensic Architecture',
    note: 'Architected the asynchronous zero-disk RAM pipeline and NIST SP 800-86 cryptographic ledger.',
    avatarColor: 'from-cyan-500 to-blue-600',
  },
  {
    name: 'Disha',
    role: 'Frontend Engineering',
    spec: 'UI/UX & High-Precision Design',
    note: 'Crafted the cyberpunk matrix visuals, fluid 120Hz Lenis scrolling, and tactical investigative HUD.',
    avatarColor: 'from-teal-400 to-emerald-600',
  },
  {
    name: 'G Ashritha',
    role: 'AI Systems',
    spec: 'Model Integration & Multimodal Correlation',
    note: 'Engineered cross-modal indicator correlation, ELA thermal divergence, and neural ViT classification.',
    avatarColor: 'from-purple-500 to-indigo-600',
  },
  {
    name: 'Gagan GC',
    role: 'Product Strategy',
    spec: 'Pitch, Compliance & Evidence Dossiers',
    note: 'Bridged complex sensor vectors into human-first investigative clarity, legal chain-of-custody, and forensic indicator dossiers.',
    avatarColor: 'from-amber-400 to-rose-600',
  },
];

export default function TeamSection() {
  return (
    <section id="team" className="py-12 border-t border-slate-800/80 font-mono">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-8">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b border-slate-800/80">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-cyan-500/30 bg-cyan-950/40 text-cyan-300 text-[11px] mb-2">
              <Users className="w-3.5 h-3.5 text-cyan-400" />
              <span>TEAM BHAIRAVA // SL. NO. 106</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white font-mono">
              The Engineers Behind ForensIQ
            </h2>
            <p className="text-xs text-slate-400 font-sans mt-1 max-w-xl">
              Four engineers unified to replace black-box AI speculation with deterministic digital forensics and calibrated uncertainty.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-emerald-500/30 bg-emerald-950/30 text-emerald-300 text-xs">
              <Award className="w-3.5 h-3.5 text-emerald-400" />
              <span>SAPTHAHACKS 2026 // PS04</span>
            </span>

            <a
              href="https://github.com/DevEagleEye97/ForensIQ"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs transition-colors group"
            >
              <Github className="w-3.5 h-3.5 text-slate-300 group-hover:text-white" />
              <span>GitHub Repository</span>
            </a>
          </div>
        </div>

        {/* 4 Member Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {TEAM_MEMBERS.map((m) => (
            <div
              key={m.name}
              className="glass-card p-5 rounded-2xl border border-slate-800/90 hover:border-cyan-500/40 transition-all flex flex-col justify-between space-y-4 group"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div
                    className={`w-10 h-10 rounded-xl bg-gradient-to-tr ${m.avatarColor} flex items-center justify-center text-slate-950 font-black text-sm shadow-md group-hover:scale-105 transition-transform`}
                  >
                    {m.name.charAt(0)}
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-cyan-300">
                    {m.role}
                  </span>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors">
                    {m.name}
                  </h3>
                  <p className="text-[11px] text-slate-400 font-sans mt-0.5">
                    {m.spec}
                  </p>
                </div>

                <p className="text-[11px] text-slate-300/80 font-sans leading-relaxed border-t border-slate-800/80 pt-2.5">
                  "{m.note}"
                </p>
              </div>

              <div className="text-[10px] text-slate-500 flex items-center gap-1.5 pt-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span>Verified Core Contributor</span>
              </div>
            </div>
          ))}
        </div>

        {/* "Why We Built This" Quote Block */}
        <div className="glass-card p-6 sm:p-8 rounded-2xl border border-cyan-500/30 relative overflow-hidden bg-gradient-to-br from-slate-950/80 via-slate-900/60 to-cyan-950/20">
          <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 space-y-3">
            <div className="flex items-center gap-2 text-cyan-400 text-xs font-mono uppercase tracking-wider font-semibold">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span>The TruthLens Conviction — Why We Built ForensIQ</span>
            </div>

            <blockquote className="text-sm sm:text-base text-slate-200 font-sans leading-relaxed italic border-l-2 border-cyan-500 pl-4 py-1">
              "We built ForensIQ because digital evidence should never rely on black-box guesswork. In an era where a single synthetic voice or manipulated photo can alter judicial verdicts, siphon life savings, or fabricate false narratives, investigators deserve transparent triage signals: byte-level decompilation, explicit uncertainty, and reproducible chain-of-custody."
            </blockquote>

            <div className="flex items-center justify-between pt-2 text-xs text-slate-400 font-mono">
              <span className="text-cyan-300 font-bold">— Team Bhairava (Sl. No. 106)</span>
              <span className="text-slate-500 hidden sm:inline">SAPTHAHACKS 2026 // Bangalore</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
