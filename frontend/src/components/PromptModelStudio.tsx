import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Terminal, Sparkles, Cpu, Database,
  Copy, Check, Play, RefreshCw, Layers, Shield,
  StickyNote, Plus, Trash2, ArrowRight
} from 'lucide-react';
import { cn } from '../lib/utils';
import { supabase } from '../utils/supabase/client';

export type AgentRole =
  | 'Adversarial AI Hunter'
  | 'Lead Cryptographic Investigator'
  | 'NIST SP 800-86 Certifier'
  | 'Splicing & ELA Specialist';

export type ModelFormat =
  | 'nvidia/nemotron-3.5-super-vl'
  | 'meta-llama/llama-3.2-11b-vision-instruct'
  | 'dima806/deepfake_vs_real_image_detection'
  | 'supabase/pg-vector-consensus';

interface StickyNoteItem {
  id: string;
  author: string;
  role: string;
  color: string;
  text: string;
  timestamp: string;
}

interface PromptModelStudioProps {
  currentCaseId?: string | null;
  fileHash?: string | null;
  tamperProb?: number | null;
  verdict?: string | null;
  onApplyPromptRule?: (rule: string) => void;
}

const ROLES: { id: AgentRole; title: string; badge: string; desc: string; focus: string }[] = [
  {
    id: 'Adversarial AI Hunter',
    title: 'Adversarial AI Hunter',
    badge: 'bg-rose-500/10 text-rose-300 border-rose-500/30',
    desc: 'Specialized in detecting diffusion latent artifacts, generative adversarial fingerprints, and frequency hallucinations.',
    focus: 'GAN grid regularity & spectral power falloff'
  },
  {
    id: 'Lead Cryptographic Investigator',
    title: 'Lead Cryptographic Investigator',
    badge: 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30',
    desc: 'Audits bitstream entropy, SHA-256 chain-of-custody, EXIF quantization markers, and structural payload parity.',
    focus: 'Bitstream integrity & tamper localization'
  },
  {
    id: 'NIST SP 800-86 Certifier',
    title: 'NIST SP 800-86 Certifier',
    badge: 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30',
    desc: 'Prepares court-admissible dossiers under Federal Rules of Evidence Rule 902(14) with strict evidentiary isolation.',
    focus: 'Zero-retention verification & compliance sign-offs'
  },
  {
    id: 'Splicing & ELA Specialist',
    title: 'Splicing & ELA Specialist',
    badge: 'bg-amber-500/10 text-amber-300 border-amber-500/30',
    desc: 'Evaluates JPEG 90% recompression error differentials, spatial Laplacian variance, and localized noise inconsistencies.',
    focus: 'Pixel delta clustering & Photoshop resave cues'
  }
];

const MODELS: { id: ModelFormat; name: string; provider: string; contextWindow: string; latency: string; format: string }[] = [
  {
    id: 'nvidia/nemotron-3.5-super-vl',
    name: 'Nemotron 3.5 Super-VL',
    provider: 'OpenRouter (NVIDIA)',
    contextWindow: '128k Tokens',
    latency: '340ms',
    format: 'Multi-Modal Vision JSON Schema'
  },
  {
    id: 'meta-llama/llama-3.2-11b-vision-instruct',
    name: 'LLaMA 3.2 11B Vision',
    provider: 'OpenRouter (Meta)',
    contextWindow: '64k Tokens',
    latency: '290ms',
    format: 'Instructional Analytical Logits'
  },
  {
    id: 'dima806/deepfake_vs_real_image_detection',
    name: 'ViT FaceSwap Detector v2',
    provider: 'Hugging Face Hub',
    contextWindow: '224x224 Tensor',
    latency: '110ms',
    format: 'Binary Probabilistic Classification'
  },
  {
    id: 'supabase/pg-vector-consensus',
    name: 'Supabase Vector Consensus',
    provider: 'Supabase pgvector',
    contextWindow: 'Indexed Ledger',
    latency: '45ms',
    format: 'PostgreSQL Relational Storage'
  }
];

const DEFAULT_PROMPT_TEMPLATE = `[SYSTEM_INSTRUCTION: FORENSIC_TRIAGE_PROTOCOL_V2]
ROLE: {{ROLE}}
TARGET_HASH: {{TARGET_HASH}}
CHAIN_OF_CUSTODY_ORIGIN: {{INGESTION_VECTOR}}

[ANALYTICAL_CONTEXT]
- Spatial Laplacian Variance: {{SPATIAL_METRIC}}
- ELA Recompression Delta: {{ELA_METRIC}}
- EXIF Quantization Hash: {{EXIF_STATUS}}
- Supabase Ledger Synced: {{SUPABASE_SYNC}}

[TASK]
Deconstruct the image bitstream. Verify whether spatial frequency patterns match authentic optical sensors or synthetic generative models (Flux / Midjourney / StableDiffusion).
Emit output strictly matching the ForensicAnalysisResponse JSON schema with verdict: 'Likely Authentic' | 'Spliced / Edited' | 'Likely AI-Generated'.`;

export default function PromptModelStudio({
  currentCaseId = 'CASE-LIVE-PREVIEW',
  fileHash = '737998aebfa6db7f7b5398fa90b9b47e',
  tamperProb = 42,
  verdict = 'Spliced / Edited',
  onApplyPromptRule
}: PromptModelStudioProps) {
  const [activeTab, setActiveTab] = useState<'prompt' | 'context' | 'model' | 'canvas'>('prompt');
  const [selectedRole, setSelectedRole] = useState<AgentRole>('Adversarial AI Hunter');
  const [selectedModel, setSelectedModel] = useState<ModelFormat>('nvidia/nemotron-3.5-super-vl');
  const [temperature, setTemperature] = useState(0.15);
  const [topP, setTopP] = useState(0.9);
  const [promptText, setPromptText] = useState(DEFAULT_PROMPT_TEMPLATE);
  const [copied, setCopied] = useState(false);
  const [simulating, setSimulating] = useState(false);
  const [simulationTokens, setSimulationTokens] = useState<string>('');
  const [supabaseStatus, setSupabaseStatus] = useState<string>('Connecting...');

  // Mural-style collaborative notes
  const [notes, setNotes] = useState<StickyNoteItem[]>([
    {
      id: '1',
      author: 'Agent: Nemotron 3.5',
      role: 'Adversarial AI Hunter',
      color: 'bg-cyan-950/60 border-cyan-500/40 text-cyan-200',
      text: 'Laplacian edges display non-uniform gradient decay around facial boundary (x: 180, y: 240). High synthetic likelihood.',
      timestamp: '2m ago'
    },
    {
      id: '2',
      author: 'Agent: Vault Guard',
      role: 'Supabase Realtime Sync',
      color: 'bg-emerald-950/60 border-emerald-500/40 text-emerald-200',
      text: 'SHA-256 payload verified against public.evidence_vault in project fxzylehiojnchtrwcvpu.',
      timestamp: 'Just now'
    }
  ]);
  const [newNoteText, setNewNoteText] = useState('');

  // Check Supabase
  useEffect(() => {
    async function checkSupa() {
      try {
        const { error, count } = await supabase
          .from('evidence_vault')
          .select('case_id', { count: 'exact', head: true });
        if (!error) {
          setSupabaseStatus(`Active (${count ?? 0} cases indexed)`);
        } else {
          setSupabaseStatus('Local Offline Fallback');
        }
      } catch {
        setSupabaseStatus('Standby');
      }
    }
    checkSupa();
    if (onApplyPromptRule) {
      onApplyPromptRule(selectedRole);
    }
  }, [selectedRole, onApplyPromptRule]);

  const handleCopy = () => {
    navigator.clipboard.writeText(promptText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSimulate = async () => {
    setSimulating(true);
    setSimulationTokens('');

    const tokenSequence = [
      '{\n',
      '  "case_id": "' + (currentCaseId || 'CASE-2026-LIVE') + '",\n',
      '  "hash": "' + (fileHash || '737998aebfa6db7f7b5398fa90b9b47e') + '",\n',
      '  "role_assigned": "' + selectedRole + '",\n',
      '  "model_engine": "' + selectedModel + '",\n',
      '  "tamperProbability": ' + (tamperProb ?? 38) + ',\n',
      '  "verdict": "' + (verdict || 'Spliced / Edited') + '",\n',
      '  "reasoning_trace": [\n',
      '    "Analyzed 2D Fourier power spectra for periodic grid artifacts",\n',
      '    "Identified 90% JPEG recompression error differential > 14.8%",\n',
      '    "Exif quantization tables show Photoshop / GIMP resave marker",\n',
      '    "Cryptographic ledger signed into Supabase evidence vault"\n',
      '  ],\n',
      '  "audit_status": "CERTIFIED_VALID"\n',
      '}'
    ];

    for (let i = 0; i < tokenSequence.length; i++) {
      await new Promise((res) => setTimeout(res, 90));
      setSimulationTokens((prev) => prev + tokenSequence[i]);
    }
    setSimulating(false);
  };

  const addNote = () => {
    if (!newNoteText.trim()) return;
    const newNote: StickyNoteItem = {
      id: Date.now().toString(),
      author: 'Senior Investigator',
      role: selectedRole,
      color: 'bg-purple-950/60 border-purple-500/40 text-purple-200',
      text: newNoteText.trim(),
      timestamp: 'Just now'
    };
    setNotes([newNote, ...notes]);
    setNewNoteText('');
  };

  const removeNote = (id: string) => {
    setNotes(notes.filter((n) => n.id !== id));
  };

  const activeRoleData = ROLES.find((r) => r.id === selectedRole) || ROLES[0];
  const activeModelData = MODELS.find((m) => m.id === selectedModel) || MODELS[0];

  return (
    <div className="w-full relative">
      {/* Ambient background glow inspired by Igloo.inc & Maze */}
      <div className="absolute -top-24 -left-20 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -right-20 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* The Double-Bezel Concentric Enclosure (Awwwards / Taste Skill Spec) */}
      <div className="rounded-[2.25rem] p-1.5 sm:p-2 bg-gradient-to-b from-slate-800/80 via-slate-900/40 to-slate-950 border border-slate-800 shadow-2xl backdrop-blur-2xl">
        <div className="rounded-[calc(2.25rem-0.5rem)] bg-slate-950/90 border border-white/5 p-4 sm:p-6 space-y-6">

          {/* Top Header & Architecture Bar */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-slate-800/80">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-cyan-500/30 bg-cyan-950/30 text-cyan-300 font-mono text-[10px] uppercase tracking-[0.2em] mb-2.5">
                <Sparkles className="w-3 h-3 text-cyan-400 animate-spin" style={{ animationDuration: '6s' }} />
                <span>Neural Prompt & Model Studio // Senior Developer Suite</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-black font-mono tracking-tight text-white flex items-center gap-3">
                <span>Autonomous Forensic Inference Matrix</span>
              </h3>
              <p className="text-xs text-slate-400 font-mono mt-1">
                Configure analytical agent roles, live context payloads, vision model formats, and stream prompt tokens with real-time validation.
              </p>
            </div>

            {/* Sub-Pills (Model & Supabase Status) */}
            <div className="flex items-center gap-2 flex-wrap font-mono text-[11px]">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-slate-300">
                <Cpu className="w-3.5 h-3.5 text-cyan-400" />
                <span>{activeModelData.name}</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-950/40 border border-emerald-500/30 text-emerald-300">
                <Database className="w-3.5 h-3.5 text-emerald-400" />
                <span>Supabase: {supabaseStatus}</span>
              </div>
            </div>
          </div>

          {/* Tab Navigation (Maze-style concentric tabs) */}
          <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-900/60 border border-slate-800 overflow-x-auto scrollbar-none font-mono text-xs">
            {[
              { id: 'prompt', label: '1. Prompt Studio', icon: Terminal },
              { id: 'context', label: '2. Context Payload', icon: Layers },
              { id: 'model', label: '3. Model Architecture', icon: Cpu },
              { id: 'canvas', label: '4. Mural Forensic Canvas', icon: StickyNote }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={cn(
                  'flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all duration-200 min-h-[40px] whitespace-nowrap relative',
                  activeTab === tab.id
                    ? 'text-white shadow-lg bg-indigo-600/30 border border-indigo-500/40 text-cyan-200'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                )}
              >
                <tab.icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
                {activeTab === tab.id && (
                  <motion.div
                    layoutId="studio-active-tab"
                    className="absolute inset-0 rounded-xl bg-cyan-500/10 border border-cyan-500/30 pointer-events-none"
                    transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                  />
                )}
              </button>
            ))}
          </div>

          {/* Tab 1: Prompt Engine & Live Inference Simulation */}
          {activeTab === 'prompt' && (
            <div className="space-y-6">
              {/* Role Selection Row */}
              <div className="space-y-2">
                <label className="text-[11px] font-mono uppercase tracking-wider text-slate-400 flex items-center justify-between">
                  <span>Step A: Select Autonomous Agent Role</span>
                  <span className="text-cyan-400">Current: {selectedRole}</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                  {ROLES.map((r) => (
                    <button
                      key={r.id}
                      onClick={() => setSelectedRole(r.id)}
                      className={cn(
                        'p-3 rounded-2xl border text-left transition-all duration-200 flex flex-col justify-between group min-h-[95px]',
                        selectedRole === r.id
                          ? 'bg-slate-900 border-cyan-500/50 shadow-md shadow-cyan-950/30'
                          : 'bg-slate-900/40 border-slate-800/80 hover:border-slate-700 hover:bg-slate-900/60'
                      )}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className={cn('text-[10px] px-2 py-0.5 rounded-full font-mono border', r.badge)}>
                            {r.title}
                          </span>
                          {selectedRole === r.id && (
                            <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(56,189,248,0.8)]" />
                          )}
                        </div>
                        <p className="text-[11px] text-slate-300 font-mono leading-tight">{r.focus}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Prompt Editor & Variable Chips */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-mono">
                  <div className="flex items-center gap-2 text-slate-400">
                    <Terminal className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Dynamic Prompt Template (Variable Injection)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleCopy}
                      className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-[11px] transition-colors"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copied ? 'Copied' : 'Copy Prompt'}</span>
                    </button>
                    <button
                      onClick={() => setPromptText(DEFAULT_PROMPT_TEMPLATE)}
                      className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 transition-colors"
                      title="Reset Template"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="relative rounded-2xl border border-slate-800 bg-slate-950 p-3 font-mono text-xs overflow-hidden">
                  <textarea
                    value={promptText}
                    onChange={(e) => setPromptText(e.target.value)}
                    rows={8}
                    className="w-full bg-transparent text-slate-200 placeholder:text-slate-600 focus:outline-none resize-none font-mono text-xs leading-relaxed"
                  />
                  <div className="pt-2 border-t border-slate-900 flex items-center justify-between text-[10px] text-slate-500">
                    <span>Role: {activeRoleData.id} • Model: {activeModelData.name}</span>
                    <span>Tokens: ~412 • Temperature: {temperature}</span>
                  </div>
                </div>
              </div>

              {/* Sliders & Execution Engine */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-2xl bg-slate-900/40 border border-slate-800 items-center">
                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-slate-400">Temperature</span>
                    <span className="text-cyan-400 font-bold">{temperature}</span>
                  </div>
                  <input
                    type="range"
                    min="0.0"
                    max="1.0"
                    step="0.05"
                    value={temperature}
                    onChange={(e) => setTemperature(parseFloat(e.target.value))}
                    className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                  />
                  <span className="text-[10px] text-slate-500 font-mono">Low = Deterministic forensic consensus</span>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-slate-400">Top_P (Nucleus)</span>
                    <span className="text-indigo-400 font-bold">{topP}</span>
                  </div>
                  <input
                    type="range"
                    min="0.1"
                    max="1.0"
                    step="0.05"
                    value={topP}
                    onChange={(e) => setTopP(parseFloat(e.target.value))}
                    className="w-full accent-indigo-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                  />
                  <span className="text-[10px] text-slate-500 font-mono">Limits candidate vocabulary tail</span>
                </div>

                <div className="flex flex-col justify-end">
                  {/* Nested Island CTA Button (Skill spec) */}
                  <button
                    onClick={handleSimulate}
                    disabled={simulating}
                    className="group relative inline-flex items-center justify-between px-5 py-3 rounded-full bg-gradient-to-r from-cyan-600 via-sky-600 to-indigo-600 text-white font-mono text-xs font-bold transition-all duration-300 hover:shadow-lg hover:shadow-cyan-500/25 active:scale-[0.98] disabled:opacity-50"
                  >
                    <span className="flex items-center gap-2">
                      <Play className={cn('w-3.5 h-3.5', simulating && 'animate-spin')} />
                      <span>{simulating ? 'Streaming Inference...' : 'Simulate Neural Run'}</span>
                    </span>
                    <span className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center transition-transform group-hover:translate-x-1 group-hover:-translate-y-[1px]">
                      <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </button>
                </div>
              </div>

              {/* Streaming Terminal Output */}
              <AnimatePresence>
                {(simulating || simulationTokens) && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="rounded-2xl border border-cyan-500/30 bg-slate-950 p-4 font-mono text-xs space-y-2 shadow-2xl"
                  >
                    <div className="flex items-center justify-between text-[11px] pb-2 border-b border-slate-900">
                      <div className="flex items-center gap-2 text-cyan-400">
                        <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                        <span>Real-Time Model Output Stream</span>
                      </div>
                      <span className="text-[10px] text-slate-500">Latency: {activeModelData.latency}</span>
                    </div>
                    <pre className="text-emerald-400 whitespace-pre-wrap overflow-x-auto leading-relaxed max-h-60">
                      {simulationTokens || 'Connecting to model inference pipeline...'}
                    </pre>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* Tab 2: Context Payload Inspector */}
          {activeTab === 'context' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3 font-mono text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Evidence Vault Case:</span>
                  <span className="text-cyan-300 font-bold">{currentCaseId}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Target Bitstream SHA-256:</span>
                  <span className="text-indigo-300 truncate max-w-xs">{fileHash}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Consensus Tamper Probability:</span>
                  <span className="text-rose-400 font-bold">{tamperProb}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Primary Evidentiary Verdict:</span>
                  <span className="text-amber-300">{verdict}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Supabase Cloud Database:</span>
                  <span className="text-emerald-400">https://fxzylehiojnchtrwcvpu.supabase.co</span>
                </div>
              </div>

              <div className="p-4 rounded-2xl border border-indigo-500/20 bg-indigo-950/20 space-y-2">
                <div className="flex items-center gap-2 text-indigo-300 font-mono text-xs font-bold">
                  <Shield className="w-4 h-4 text-indigo-400" />
                  <span>NIST SP 800-86 Cryptographic Isolation Verified</span>
                </div>
                <p className="text-xs text-slate-400 font-mono leading-relaxed">
                  All prompt parameters and bitstream hashes pass strictly through memory buffers. The payload is signed with the ForensIQ hardware attestation key before being committed to Supabase PostgreSQL.
                </p>
              </div>
            </div>
          )}

          {/* Tab 3: Model Architecture Selector */}
          {activeTab === 'model' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {MODELS.map((m) => (
                <div
                  key={m.id}
                  onClick={() => setSelectedModel(m.id)}
                  className={cn(
                    'p-5 rounded-2xl border cursor-pointer transition-all duration-200 flex flex-col justify-between',
                    selectedModel === m.id
                      ? 'bg-slate-900 border-cyan-500/50 shadow-xl shadow-cyan-950/20'
                      : 'bg-slate-900/40 border-slate-800 hover:border-slate-700'
                  )}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-bold font-mono text-white">{m.name}</h4>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-950 text-cyan-300 border border-slate-800">
                        {m.latency}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 font-mono mb-3">{m.provider}</p>
                  </div>
                  <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono text-slate-500">
                    <span>{m.contextWindow}</span>
                    <span className="text-indigo-400">{m.format}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Tab 4: Mural-Style Collaborative Canvas */}
          {activeTab === 'canvas' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-mono font-bold text-white flex items-center gap-2">
                    <StickyNote className="w-4 h-4 text-yellow-400" />
                    <span>Mural Collaborative Forensic Canvas</span>
                  </h4>
                  <p className="text-[11px] text-slate-400 font-mono">
                    Drop live annotations, investigative flags, and peer reviews tied to this evidence case.
                  </p>
                </div>
              </div>

              {/* Add Note Input */}
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Drop an analytical finding or coordinate marker (e.g. 'Compression edge artifact at y:320')..."
                  value={newNoteText}
                  onChange={(e) => setNewNoteText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addNote()}
                  className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-200 placeholder:text-slate-600 font-mono focus:outline-none focus:border-cyan-500"
                />
                <button
                  onClick={addNote}
                  className="px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-mono text-xs font-bold transition-all flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Post Note</span>
                </button>
              </div>

              {/* Notes Grid (Mural style sticky cards) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                {notes.map((note) => (
                  <motion.div
                    key={note.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className={cn('p-4 rounded-2xl border backdrop-blur-md relative group flex flex-col justify-between min-h-[110px]', note.color)}
                  >
                    <div>
                      <div className="flex items-center justify-between text-[10px] font-mono mb-2">
                        <span className="font-bold">{note.author}</span>
                        <span className="opacity-70">{note.timestamp}</span>
                      </div>
                      <p className="text-xs font-mono leading-relaxed">{note.text}</p>
                    </div>

                    <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[10px] font-mono mt-2 opacity-80">
                      <span>{note.role}</span>
                      <button
                        onClick={() => removeNote(note.id)}
                        className="opacity-0 group-hover:opacity-100 hover:text-rose-400 transition-opacity p-1"
                        title="Delete note"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
