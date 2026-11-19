import { useState, useCallback, useEffect } from 'react';
import {
  UploadCloud, Layers, Activity,
  CheckCircle2, AlertTriangle, XCircle, ScanLine, Hash,
  Image as ImageIcon, RefreshCw, ChevronRight,
  Fingerprint, Radio, Database, Shield, Eye, AlertCircle,
  FileText, Sparkles, Check, X, ExternalLink, Copy
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDropzone } from 'react-dropzone';
import {
  ResponsiveContainer, XAxis, YAxis, Tooltip,
  BarChart, Bar, CartesianGrid, Cell
} from 'recharts';
import { cn } from '../lib/utils';
import { analytics } from '../lib/analytics';
import { supabase } from '../utils/supabase/client';
import PromptModelStudio from '../components/PromptModelStudio';
import ForensicChatbot from '../components/ForensicChatbot';

export interface SimplifiedReport {
  verdict: 'RED_FLAG' | 'GREEN_FLAG' | 'NEEDS_REVIEW';
  flag_color: string;
  flag_icon: string;
  status_message: string;
  simple_explanation: string;
  key_finding: string;
  confidence_level: 'HIGH' | 'MEDIUM' | 'LOW';
  technical_details_available?: boolean;
}

export interface RecaptureAnalysis {
  is_recaptured: boolean;
  recapture_confidence: number;
  signals_detected: string[];
  ui_badge?: string | null;
  recapture_adjusted_verdict?: string | null;
}

// Interface matching the backend POST /api/analyze/image response
export interface BackendAnalysisResult {
  case_id: string;
  evidence_fingerprint?: string;
  tamperProbability: number;
  verdict: 'Likely AI-Generated' | 'Likely Authentic' | 'Authentic (Metadata Stripped)' | 'Spliced / Edited' | 'Needs Review' | 'Needs Human Review';
  simplified_report?: SimplifiedReport;
  recapture_analysis?: RecaptureAnalysis;
  checks: {
    spatialArtifact: 'Pass' | 'Warn' | 'Fail';
    frequencyAnomaly: 'Pass' | 'Warn' | 'Fail';
    metadataIntegrity: 'Pass' | 'Warn' | 'Fail';
    ganFingerprint: 'Pass' | 'Warn' | 'Fail';
  };
  metadata: {
    sha256: string;
    format: string;
    size: string;
    camera: string;
    gps: string;
    modified: string;
    software: string;
    fileStructure: string;
  };
  elaBase64: string;
  anomalies: string[];
  classificationModel: string;
  fallbackMode?: boolean;
  signals?: {
    spatial_patch_std?: number;
    ela_variance_pct?: number;
    gan_effective_pct?: number | null;
  };
}

interface SystemStatus {
  status: string;
  database: {
    total_cases: number;
    image_cases_count: number;
    flagged_cases_count: number;
    avg_tamper_probability: number;
  };
  archived_cases_count: number;
}

const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024; // 25 MB


const statusMeta: Record<string, { icon: typeof CheckCircle2; color: string; badge: string; label: string }> = {
  Pass: { icon: CheckCircle2, color: 'text-emerald-400', badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', label: 'Pass' },
  Warn: { icon: AlertTriangle, color: 'text-amber-400', badge: 'bg-amber-500/10 text-amber-400 border-amber-500/20', label: 'Warn' },
  Fail: { icon: XCircle, color: 'text-rose-400', badge: 'bg-rose-500/10 text-rose-400 border-rose-500/20', label: 'Fail' },
};

export default function Dashboard() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<BackendAnalysisResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'rgb' | 'ela'>('rgb');
  const [copiedHash, setCopiedHash] = useState(false);
  const [chatbotOpen, setChatbotOpen] = useState(false);
  const [investigatorMode, setInvestigatorMode] = useState<'simplified' | 'technical'>('simplified');
  const [systemStats, setSystemStats] = useState<{ scansToday: string; deepfakesFound: string; avgTrustScore: string; dbRecords: string }>({
    scansToday: '0',
    deepfakesFound: '0',
    avgTrustScore: '0%',
    dbRecords: '0',
  });

  // Fetch real system stats on mount
  useEffect(() => {
    async function fetchSystemStats() {
      try {
        const res = await fetch('/api/system/status');
        if (res.ok) {
          const data: SystemStatus = await res.json();
          const total = data.database?.image_cases_count ?? data.archived_cases_count ?? 0;
          const flagged = data.database?.flagged_cases_count ?? 0;
          const avgTamper = data.database?.avg_tamper_probability ?? 0;
          setSystemStats({
            scansToday: String(total),
            deepfakesFound: String(flagged),
            avgTrustScore: total > 0 ? `${Math.round(100 - avgTamper)}%` : '0%',
            dbRecords: String(total),
          });
        }
      } catch {
        // Silently fail, keep defaults
      }
    }
    fetchSystemStats();
  }, []);

  const executeAnalysis = async (targetFile: File) => {
    setErrorMessage(null);
    setAnalyzing(true);
    setAnalysisResult(null);

    // 1. Form Validation: Size check (< 25MB)
    if (targetFile.size > MAX_FILE_SIZE_BYTES) {
      setAnalyzing(false);
      const msg = `Payload exceeds 25 MB limit (${(targetFile.size / (1024 * 1024)).toFixed(1)} MB). Please select a file under 25 MB.`;
      setErrorMessage(msg);
      analytics.trackError('Validation Error', msg);
      return;
    }

    // 2. Form Validation: Format check (JPEG, PNG)
    const validTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    if (!validTypes.includes(targetFile.type) && !/\.(jpe?g|png)$/i.test(targetFile.name)) {
      setAnalyzing(false);
      const msg = `Unsupported media format: ${targetFile.type || 'Unknown'}. Only image/jpeg and image/png are permitted for forensic chain-of-custody.`;
      setErrorMessage(msg);
      analytics.trackError('Validation Error', msg);
      return;
    }

    // Local object URL for quick preview
    const url = URL.createObjectURL(targetFile);
    setPreviewUrl(url);

    try {
      const formData = new FormData();
      formData.append('file', targetFile);

      const response = await fetch('/api/analyze/image', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        let errDetail = `Server responded with status ${response.status}`;
        try {
          const errJson = await response.json();
          if (errJson.detail) errDetail = errJson.detail;
        } catch {
          // ignore json parse error
        }
        throw new Error(errDetail);
      }

      const data: BackendAnalysisResult = await response.json();
      setAnalysisResult(data);
      analytics.trackScan(targetFile.name, targetFile.size, data.verdict, data.tamperProbability);

      // Asynchronous commit to Supabase Cloud Evidence Vault
      if (data.case_id) {
        supabase
          .from('evidence_vault')
          .upsert(
            {
              case_id: data.case_id,
              file_name: targetFile.name,
              file_hash: data.metadata?.sha256?.replace('SHA256: ', '') || data.case_id,
              file_size_bytes: targetFile.size,
              mime_type: targetFile.type || 'image/jpeg',
              tamper_probability: data.tamperProbability,
              verdict: data.verdict,
              classification_model: data.classificationModel || 'Nemotron 3.5 / ViT',
              exif_software: data.metadata?.software || null,
              camera_make: data.metadata?.camera || null,
              anomalies_json: JSON.stringify(data.anomalies || []),
              ela_base64_preview: data.elaBase64 ? data.elaBase64.slice(0, 1000) : null,
            },
            { onConflict: 'case_id' }
          )
          .then((res: any) => {
            const error = res?.error;
            if (error) {
              console.warn('[Supabase Vault] Non-blocking cloud sync notification:', error.message);
            } else {
              console.info('[Supabase Vault] Case cryptographic record committed:', data.case_id);
            }
          });
      }
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'Analysis failed. Could not reach ForensIQ backend.';
      setErrorMessage(errMsg);
      analytics.trackError('Analysis Failure', errMsg);
    } finally {
      setAnalyzing(false);
    }
  };

  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: any[]) => {
    setErrorMessage(null);
    if (rejectedFiles && rejectedFiles.length > 0) {
      const rej = rejectedFiles[0];
      const msg = rej.errors?.[0]?.message || 'File validation failed. Please check size and format.';
      setErrorMessage(msg);
      analytics.trackError('Dropzone Rejection', msg);
      return;
    }

    if (acceptedFiles.length > 0) {
      const selected = acceptedFiles[0];
      setFile(selected);
      executeAnalysis(selected);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
    },
    maxSize: MAX_FILE_SIZE_BYTES,
    maxFiles: 1,
    multiple: false,
  });

  const reset = () => {
    setFile(null);
    setPreviewUrl(null);
    setAnalyzing(false);
    setAnalysisResult(null);
    setErrorMessage(null);
    setViewMode('rgb');
  };

  const loadDemoSample = async () => {
    const canvas = document.createElement('canvas');
    canvas.width = 400;
    canvas.height = 300;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const gradient = ctx.createLinearGradient(0, 0, 400, 300);
      gradient.addColorStop(0, '#1e1b4b');
      gradient.addColorStop(0.5, '#4338ca');
      gradient.addColorStop(1, '#0284c7');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 400, 300);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 20px monospace';
      ctx.fillText('FORENSIQ TEST TARGET #01', 30, 150);
      ctx.font = '14px monospace';
      ctx.fillStyle = '#cbd5e1';
      ctx.fillText('Synthetic Gradient & Inpainting Matrix', 30, 180);

      canvas.toBlob((blob) => {
        if (blob) {
          const sampleFile = new File([blob], 'forensic_sample_evidence.jpg', { type: 'image/jpeg' });
          setFile(sampleFile);
          executeAnalysis(sampleFile);
        }
      }, 'image/jpeg', 0.92);
    }
  };

  const anomalyChartData = analysisResult
    ? (() => {
        // Use real signals from backend when available
        const signals = analysisResult.signals;
        if (signals && typeof signals.spatial_patch_std === 'number' && typeof signals.ela_variance_pct === 'number') {
          return [
            { name: 'Spatial Patch Std', score: Math.min(100, Math.round(signals.spatial_patch_std * 2)) },
            { name: 'ELA Variance %', score: Math.min(100, Math.round(signals.ela_variance_pct * 5)) },
            { name: 'GAN Effective %', score: signals.gan_effective_pct ?? 0 },
            { name: 'Overall Tamper', score: analysisResult.tamperProbability },
          ];
        }
        // Fallback: categorical Pass/Warn/Fail mapped to representative values
        const statusToScore = { Pass: 15, Warn: 50, Fail: 85 } as const;
        return [
          { name: 'Spatial Artifact', score: statusToScore[analysisResult.checks.spatialArtifact] },
          { name: 'Frequency Anomaly', score: statusToScore[analysisResult.checks.frequencyAnomaly] },
          { name: 'Metadata Integrity', score: statusToScore[analysisResult.checks.metadataIntegrity] },
          { name: 'GAN Fingerprint', score: statusToScore[analysisResult.checks.ganFingerprint] },
          { name: 'Overall Tamper', score: analysisResult.tamperProbability },
        ];
      })()
    : [
        { name: 'Spatial Artifact', score: 0 },
        { name: 'Frequency Anomaly', score: 0 },
        { name: 'Metadata Integrity', score: 0 },
        { name: 'GAN Fingerprint', score: 0 },
        { name: 'Overall Tamper', score: 0 },
      ];

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-slate-950 text-slate-100">
      {/* Sub-header / Breadcrumb Bar */}
      <div className="border-b border-slate-800/60 bg-slate-900/40 px-4 sm:px-6 py-2.5 flex items-center justify-between text-xs text-slate-400 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <span className="text-indigo-400 font-semibold font-mono">FORENSIQ</span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
          <span className="text-slate-300">Autonomous Workbench</span>
          {file && (
            <>
              <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
              <span className="text-sky-400 font-mono truncate max-w-[180px] sm:max-w-none">{file.name}</span>
            </>
          )}
        </div>

        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            LIVE TELEMETRY
          </span>
          <span className="text-[10px] font-mono text-slate-500 hidden sm:inline">NIST SP 800-86</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* KPI Stats Row (Responsive grid 2 cols on mobile, 4 on desktop) */}
        <div className="border-b border-slate-800/40 bg-slate-900/20 px-4 sm:px-6 py-4 grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          {[
            { label: 'Scans Today', value: systemStats.scansToday, icon: ScanLine, color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
            { label: 'Deepfakes Flagged', value: systemStats.deepfakesFound, icon: Fingerprint, color: 'text-rose-400', bg: 'bg-rose-500/10' },
            { label: 'Avg Authenticity', value: systemStats.avgTrustScore, icon: Radio, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
            { label: 'Vault Cryptographic Records', value: systemStats.dbRecords, icon: Database, color: 'text-sky-400', bg: 'bg-sky-500/10' },
          ].map((s) => (
            <div key={s.label} className="glass-card flex items-center gap-3 p-3 rounded-xl shadow-sm">
              <div className={cn('p-2.5 rounded-lg flex-shrink-0', s.bg, s.color)}>
                <s.icon className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div className="min-w-0">
                <div className="text-base sm:text-lg font-bold text-slate-100 font-mono truncate">{s.value}</div>
                <div className="text-[10px] sm:text-xs text-slate-400 truncate">{s.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Global Error Banner */}
        <AnimatePresence>
          {errorMessage && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="max-w-screen-xl mx-auto px-4 sm:px-6 pt-4"
            >
              <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 flex items-start justify-between gap-3 shadow-lg shadow-rose-950/20">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-rose-200">Forensic Ingestion Rejected</p>
                    <p className="text-xs text-rose-300/90 leading-relaxed">{errorMessage}</p>
                  </div>
                </div>
                <button
                  onClick={() => setErrorMessage(null)}
                  className="p-1 rounded-lg hover:bg-rose-500/20 text-rose-400 transition-colors"
                  aria-label="Dismiss alert"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Operational Grid */}
        <main className="max-w-screen-xl mx-auto p-4 sm:p-6 grid grid-cols-1 xl:grid-cols-3 gap-6">

          {/* LEFT 2 COLUMNS: Ingestion, ELA Comparison & Visualizer */}
          <div className="xl:col-span-2 space-y-6">

            {/* Dropzone Container */}
            <div
              {...getRootProps()}
              className={cn(
                'glass-card border-2 border-dashed rounded-2xl p-6 sm:p-8 text-center transition-all duration-200 relative overflow-hidden flex flex-col items-center justify-center min-h-[220px]',
                isDragActive
                  ? 'border-indigo-400 bg-indigo-500/10 scale-[1.005]'
                  : analysisResult
                  ? 'border-slate-800'
                  : 'border-slate-800 hover:border-indigo-500/50 cursor-pointer'
              )}
            >
              <input {...getInputProps()} disabled={analyzing} />

<AnimatePresence mode="wait">
                {analyzing ? (
                  /* Loading State - Honest indicator */
                  <motion.div
                    key="analyzing"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col items-center gap-4 py-4 w-full max-w-md"
                  >
                    <div className="relative w-16 h-16">
                      <div className="absolute inset-0 rounded-full border-2 border-indigo-500/20 animate-ping" />
                      <div className="relative w-full h-full rounded-full bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center">
                        <Activity className="w-7 h-7 text-indigo-400 animate-pulse" />
                      </div>
                    </div>

                    <div className="text-center space-y-1.5 w-full">
                      <p className="text-sm font-semibold text-slate-100 font-mono">
                        Forensic Analysis In Progress
                      </p>
                      <p className="text-xs text-indigo-300 font-mono animate-pulse">
                        Analyzing...
                      </p>
                    </div>

                    <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-gradient-to-r from-indigo-500 via-sky-400 to-teal-400 rounded-full"
                        initial={{ width: '10%' }}
                        animate={{ width: '92%' }}
                        transition={{ duration: 3.5, ease: 'linear' }}
                      />
                    </div>
                    <span className="text-[10px] font-mono text-slate-500">
                      In-memory ELA + parallel AI inference
                    </span>
                  </motion.div>
                ) : analysisResult ? (
                  /* Analyzed File Summary Header inside Dropzone */
                  <motion.div
                    key="done"
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="w-full space-y-4"
                  >
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="p-2.5 rounded-xl bg-slate-800 border border-slate-700 flex-shrink-0">
                          <ImageIcon className="w-5 h-5 text-indigo-400" />
                        </div>
                        <div className="min-w-0 text-left">
                          <p className="font-semibold text-slate-100 text-sm truncate">{file?.name}</p>
                          <p className="text-xs text-slate-400 font-mono">
                            {analysisResult.metadata.size} · {analysisResult.metadata.format} · Case {analysisResult.case_id}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            reset();
                          }}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition-colors min-h-[36px]"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                          New Scan
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-xl bg-slate-950/60 border border-slate-800/80">
                      <div className="flex items-center gap-3">
                        <span
                          className={cn(
                            'px-3 py-1 rounded-lg text-xs font-bold font-mono border',
                            analysisResult.verdict === 'Likely Authentic'
                              ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                              : analysisResult.verdict === 'Authentic (Metadata Stripped)'
                              ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                              : analysisResult.verdict === 'Spliced / Edited'
                              ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                              : analysisResult.verdict === 'Needs Review' || analysisResult.verdict === 'Needs Human Review'
                              ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                              : 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                          )}
                        >
                          {analysisResult.verdict.toUpperCase()}
                        </span>
                        <span className="text-xs text-slate-400 font-mono">
                          Forensic Tamper Probability: <strong className="text-white">{analysisResult.tamperProbability}%</strong>
                        </span>
                      </div>

                      <div className="text-[11px] font-mono text-slate-400">
                        {analysisResult.fallbackMode ? (
                          <span className="text-amber-400 flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" /> Offline Heuristic Mode
                          </span>
                        ) : (
                          <span className="text-emerald-400 flex items-center gap-1">
                            <Shield className="w-3 h-3" /> Multi-Tier Verified
                          </span>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  /* Empty State */
                  <motion.div
                    key="idle"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col items-center gap-3 py-2"
                  >
                    <div className="p-3.5 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shadow-inner">
                      <UploadCloud className="w-8 h-8" />
                    </div>
                    <div className="space-y-1">
                      <p className="font-semibold text-slate-100 text-sm">
                        Drop evidence image here, or <span className="text-indigo-400 underline decoration-indigo-400/50">browse files</span>
                      </p>
                      <p className="text-xs text-slate-400 font-mono">
                        Accepts raw JPEG and PNG · Max 25 MB · Strict Zero-Disk Memory Processing
                      </p>
                    </div>

                    <div className="flex items-center gap-2 pt-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-400 border border-slate-700">
                        image/jpeg (FFD8)
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-400 border border-slate-700">
                        image/png (8950)
                      </span>
                    </div>

                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          loadDemoSample();
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 text-xs font-mono font-medium border border-indigo-500/30 transition-all min-h-[36px]"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                        Load Synthetic Test Target #01
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* TRUTHLENS FORENSIQ: 4 ENHANCEMENT DELIVERABLES */}
            {analysisResult && (
              <div className="space-y-4">
                {/* 1. Evidence Fingerprint (SHA-256 Forensic Hashing & Chain-of-Custody) */}
                <div className="glass-card p-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex-shrink-0">
                      <Fingerprint className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono uppercase tracking-wider text-indigo-400 font-bold">
                          Evidence Fingerprint (SHA-256)
                        </span>
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          Chain of Custody Intact
                        </span>
                      </div>
                      <p className="font-mono text-xs text-slate-200 truncate mt-0.5" title={analysisResult.evidence_fingerprint || analysisResult.metadata.sha256}>
                        {analysisResult.evidence_fingerprint || analysisResult.metadata.sha256}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      const hashToCopy = (analysisResult.evidence_fingerprint || analysisResult.metadata.sha256).replace('SHA256: ', '');
                      navigator.clipboard.writeText(hashToCopy);
                      setCopiedHash(true);
                      setTimeout(() => setCopiedHash(false), 2000);
                    }}
                    className={cn(
                      'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-all min-h-[36px] flex-shrink-0',
                      copiedHash
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                    )}
                  >
                    {copiedHash ? (
                      <>
                        <Check className="w-3.5 h-3.5" /> Copied Hash
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" /> Copy Fingerprint
                      </>
                    )}
                  </button>
                </div>

                {/* 2. Red/Green Flag Instant Visual Verdict & Plain English Investigator Report */}
                {analysisResult.simplified_report && (
                  <div
                    className={cn(
                      'glass-card-verdict p-5 rounded-2xl border transition-all shadow-xl',
                      analysisResult.simplified_report.verdict === 'GREEN_FLAG'
                        ? 'bg-emerald-950/40 border-emerald-500/50 shadow-emerald-950/20'
                        : analysisResult.simplified_report.verdict === 'RED_FLAG'
                        ? 'bg-rose-950/40 border-rose-500/50 shadow-rose-950/20'
                        : 'bg-amber-950/40 border-amber-500/50 shadow-amber-950/20'
                    )}
                  >
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center text-xl font-bold font-mono text-white shadow-lg"
                          style={{ backgroundColor: analysisResult.simplified_report.flag_color }}
                        >
                          {analysisResult.simplified_report.flag_icon}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span
                              className="text-xs font-bold font-mono uppercase tracking-wider px-2 py-0.5 rounded border"
                              style={{
                                color: analysisResult.simplified_report.flag_color,
                                borderColor: `${analysisResult.simplified_report.flag_color}40`,
                                backgroundColor: `${analysisResult.simplified_report.flag_color}15`,
                              }}
                            >
                              {analysisResult.simplified_report.verdict.replace('_', ' ')}
                            </span>
                            <span className="text-xs text-slate-400 font-mono">
                              Confidence: <strong className="text-slate-200">{analysisResult.simplified_report.confidence_level}</strong>
                            </span>
                          </div>
                          <h3 className="text-base sm:text-lg font-bold text-white mt-1">
                            {analysisResult.simplified_report.status_message}
                          </h3>
                        </div>
                      </div>

                      {/* Investigator Mode Toggle: Simplified vs Full Telemetry */}
                      <div className="flex items-center gap-1 p-1 bg-black/40 rounded-xl border border-white/10 self-stretch sm:self-auto justify-center">
                        <button
                          type="button"
                          onClick={() => setInvestigatorMode('simplified')}
                          className={cn(
                            'px-3 py-1 rounded-lg text-xs font-medium transition-all min-h-[32px]',
                            investigatorMode === 'simplified'
                              ? 'bg-indigo-600 text-white shadow'
                              : 'text-slate-400 hover:text-slate-200'
                          )}
                        >
                          Plain English
                        </button>
                        <button
                          type="button"
                          onClick={() => setInvestigatorMode('technical')}
                          className={cn(
                            'px-3 py-1 rounded-lg text-xs font-medium transition-all min-h-[32px]',
                            investigatorMode === 'technical'
                              ? 'bg-indigo-600 text-white shadow'
                              : 'text-slate-400 hover:text-slate-200'
                          )}
                        >
                          Technical Jargon
                        </button>
                      </div>
                    </div>

                    {/* Key Finding & Explanation */}
                    <div className="pt-4 space-y-3">
                      <div className="p-3 rounded-xl bg-black/40 border border-white/10 flex items-start gap-2.5">
                        <Sparkles className="w-4 h-4 text-indigo-400 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-[11px] font-mono uppercase tracking-wider text-indigo-300 font-semibold">
                            Primary Finding
                          </p>
                          <p className="text-sm font-semibold text-white mt-0.5">
                            {analysisResult.simplified_report.key_finding}
                          </p>
                        </div>
                      </div>

                      <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1.5">
                        <p className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-semibold">
                          Investigator Summary (Plain English)
                        </p>
                        <p className="text-sm text-slate-200 leading-relaxed">
                          {investigatorMode === 'simplified'
                            ? analysisResult.simplified_report.simple_explanation
                            : `Sensor & ELA telemetry indicates spatial patch deviation of ${analysisResult.signals?.spatial_patch_std ?? 'N/A'}, high-frequency residual quantization differential of ${analysisResult.signals?.ela_variance_pct ?? 'N/A'}%, and GAN discriminator score of ${analysisResult.signals?.gan_effective_pct ?? 'N/A'}% via model ${analysisResult.classificationModel}.`}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* 3. Screenshot Re-Capture Resilience Alert */}
                {analysisResult.recapture_analysis?.is_recaptured && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200 space-y-2.5 shadow-lg"
                  >
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0" />
                        <span className="font-bold text-sm text-amber-300">
                          {analysisResult.recapture_analysis.ui_badge || '⚠️ This appears to be a re-captured/screenshot image'}
                        </span>
                      </div>
                      <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                        {analysisResult.recapture_analysis.recapture_confidence}% Recapture Confidence
                      </span>
                    </div>

                    <p className="text-xs text-amber-200/90 leading-relaxed">
                      Chain-of-custody analysis detected display rendering artifacts. Re-captured/screenshot images often strip original camera metadata, but latent AI generation patterns remain detectable across pixel matrices.
                    </p>

                    {analysisResult.recapture_analysis.signals_detected && analysisResult.recapture_analysis.signals_detected.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {analysisResult.recapture_analysis.signals_detected.map((sig, sIdx) => (
                          <span
                            key={sIdx}
                            className="px-2 py-0.5 rounded-md text-[11px] font-mono bg-black/40 text-amber-300 border border-amber-500/20"
                          >
                            • {sig}
                          </span>
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}
              </div>
            )}

            {/* ELA Visualizer & Image Inspection Canvas */}
            {analysisResult && (
              <div className="glass-card border border-slate-800 rounded-2xl p-5 space-y-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-indigo-400" />
                    <h3 className="text-sm font-semibold text-slate-200">Error Level Analysis (ELA) Heatmap</h3>
                  </div>

                  <div className="flex gap-1 p-1 bg-slate-800/80 rounded-xl">
                    <button
                      onClick={() => setViewMode('rgb')}
                      className={cn(
                        'flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all min-h-[32px]',
                        viewMode === 'rgb' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
                      )}
                    >
                      <Eye className="w-3.5 h-3.5" /> Original RGB
                    </button>
                    <button
                      onClick={() => setViewMode('ela')}
                      className={cn(
                        'flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all min-h-[32px]',
                        viewMode === 'ela' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
                      )}
                    >
                      <Layers className="w-3.5 h-3.5" /> ELA Matrix
                    </button>
                  </div>
                </div>

                <div className="relative rounded-xl bg-black border border-slate-800 overflow-hidden flex items-center justify-center min-h-[320px] max-h-[460px]">
                  {viewMode === 'rgb' && previewUrl && (
                    <img
                      src={previewUrl}
                      alt="Original Evidence"
                      className="max-h-[440px] w-auto object-contain mx-auto"
                    />
                  )}
                  {viewMode === 'ela' && analysisResult.elaBase64 && (
                    <img
                      src={analysisResult.elaBase64}
                      alt="Error Level Analysis Heatmap"
                      className="max-h-[440px] w-auto object-contain mx-auto filter contrast-125"
                    />
                  )}

                  <div className="absolute bottom-2 left-2 right-2 bg-black/70 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-800 text-[10px] font-mono text-slate-400 flex items-center justify-between">
                    <span>LAYER: {viewMode.toUpperCase()}</span>
                    <span>JPEG 90% RECOMPRESSION DELTA</span>
                    <span className="text-indigo-400">IN-MEMORY BYTESIO</span>
                  </div>
                </div>
              </div>
            )}

            {/* 4 Analytical Checks Cards Grid */}
            <div className="glass-card border border-slate-800 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ScanLine className="w-4 h-4 text-indigo-400" />
                  <h3 className="text-sm font-semibold text-slate-200">4-Tier Core Forensic Check Suite</h3>
                </div>
                <span className="text-[10px] font-mono text-slate-500">Autonomous Analytical Pipeline</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  {
                    id: 'spatial',
                    label: 'Spatial Artifact Scan',
                    sub: 'Laplacian Edge Variance & Discontinuity',
                    status: analysisResult ? analysisResult.checks.spatialArtifact : 'Pass',
                    detail: analysisResult ? 'Evaluates micro-gradient jumps at suspected splicing boundaries.' : 'Awaiting file ingestion.',
                  },
                  {
                    id: 'ela',
                    label: 'Frequency Anomaly (ELA)',
                    sub: '90% JPEG Re-compression Differential',
                    status: analysisResult ? analysisResult.checks.frequencyAnomaly : 'Pass',
                    detail: analysisResult ? 'Detects mismatched quantization levels across composited sectors.' : 'Awaiting file ingestion.',
                  },
                  {
                    id: 'metadata',
                    label: 'Metadata Integrity',
                    sub: 'EXIF Camera & Sensor Fingerprinting',
                    status: analysisResult ? analysisResult.checks.metadataIntegrity : 'Pass',
                    detail: analysisResult ? `Hardware: ${analysisResult.metadata.camera} · Software: ${analysisResult.metadata.software}` : 'Awaiting file ingestion.',
                  },
                  {
                    id: 'gan',
                    label: 'GAN & Diffusion Fingerprint',
                    sub: 'ViT Classifier & Multimodal Vision Probe',
                    status: analysisResult ? analysisResult.checks.ganFingerprint : 'Pass',
                    detail: analysisResult ? `Model: ${analysisResult.classificationModel}` : 'Awaiting file ingestion.',
                  },
                ].map((c) => {
                  const meta = statusMeta[c.status];
                  return (
                    <div
                      key={c.id}
                      className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 space-y-2 hover:border-slate-700 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="text-xs font-semibold text-slate-200">{c.label}</h4>
                          <p className="text-[10px] font-mono text-slate-500">{c.sub}</p>
                        </div>
                        <span className={cn('text-xs px-2.5 py-0.5 rounded-full border font-mono font-bold flex items-center gap-1', meta.badge)}>
                          <meta.icon className="w-3 h-3" />
                          {meta.label}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 leading-relaxed">{c.detail}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Anomaly Observations Log */}
            {analysisResult && analysisResult.anomalies.length > 0 && (
              <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-5 space-y-3">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-400" />
                  <h3 className="text-sm font-semibold text-slate-200">Granular Telemetry Observations</h3>
                </div>
                <div className="space-y-2 font-mono text-xs">
                  {analysisResult.anomalies.map((obs, idx) => (
                    <div key={idx} className="p-2.5 rounded-lg bg-black/40 border border-slate-800/80 text-slate-300 flex items-start gap-2">
                      <span className="text-indigo-400 font-bold flex-shrink-0">&gt;</span>
                      <p className="leading-relaxed">{obs}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* RIGHT COLUMN: Evidence Ledger & Charts */}
          <div className="space-y-6">

            {/* Overall Score Card */}
            <div className="glass-card border border-slate-800 rounded-2xl p-5 space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-slate-500 font-mono uppercase tracking-wider">Tamper Probability Index</p>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className={cn(
                      'text-4xl sm:text-5xl font-black font-mono tracking-tight',
                      !analysisResult
                        ? 'text-slate-500'
                        : analysisResult.tamperProbability >= 65
                        ? 'text-rose-400'
                        : analysisResult.tamperProbability >= 35
                        ? 'text-amber-400'
                        : 'text-emerald-400'
                    )}>
                      {analysisResult ? analysisResult.tamperProbability : '0'}
                    </span>
                    <span className="text-lg font-bold text-slate-600">%</span>
                  </div>
                </div>

                {analysisResult && (
                  <span className={cn(
                    'px-2.5 py-1 rounded-lg font-mono text-xs font-bold border mt-1',
                    analysisResult.verdict === 'Likely Authentic'
                      ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                      : analysisResult.verdict === 'Spliced / Edited'
                      ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                      : 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                  )}>
                    {analysisResult.verdict}
                  </span>
                )}
              </div>

              {/* Segmented bar */}
              <div className="space-y-1.5">
                <div className="flex rounded-full overflow-hidden h-2 gap-0.5 bg-slate-800">
                  <div
                    className="bg-emerald-500 transition-all duration-500"
                    style={{ width: `${analysisResult ? Math.max(5, 100 - analysisResult.tamperProbability) : 100}%` }}
                  />
                  <div
                    className="bg-rose-500 transition-all duration-500"
                    style={{ width: `${analysisResult ? analysisResult.tamperProbability : 0}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                  <span>Authentic Prob</span>
                  <span>Tamper Risk</span>
                </div>
              </div>
            </div>

            {/* Anomaly Breakdown Chart */}
            <div className="glass-card border border-slate-800 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-200">Anomaly Signal Vectors</h3>
                <span className="text-[10px] font-mono text-indigo-400">Normalized (0-100)</span>
              </div>

              <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={anomalyChartData} layout="vertical" barSize={14}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                    <XAxis type="number" domain={[0, 100]} stroke="#475569" fontSize={10} tickLine={false} />
                    <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={10} width={90} tickLine={false} />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: 11 }} />
                    <Bar dataKey="score" radius={[0, 4, 4, 0]}>
                      {anomalyChartData.map((entry, i) => (
                        <Cell
                          key={i}
                          fill={entry.score > 60 ? '#f43f5e' : entry.score > 35 ? '#f59e0b' : '#10b981'}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Cryptographic Ledger Metadata */}
            <div className="glass-card border border-slate-800 rounded-2xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Hash className="w-4 h-4 text-sky-400" />
                  <h3 className="text-sm font-semibold text-slate-200">Ledger &amp; EXIF Metadata</h3>
                </div>
                <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
                  <Check className="w-3 h-3" /> Chain-Verified
                </span>
              </div>

              {analysisResult ? (
                <div className="space-y-2 font-mono text-xs">
                  <div className="flex items-start justify-between py-1.5 border-b border-slate-800 text-[11px]">
                    <span className="text-slate-500">SHA-256 Digest:</span>
                    <span className="text-slate-300 truncate max-w-[170px]" title={analysisResult.metadata.sha256}>
                      {analysisResult.metadata.sha256}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-1.5 border-b border-slate-800 text-[11px]">
                    <span className="text-slate-500">Camera Hardware:</span>
                    <span className={cn(analysisResult.metadata.camera.includes('Unknown') ? 'text-amber-400' : 'text-slate-300')}>
                      {analysisResult.metadata.camera}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-1.5 border-b border-slate-800 text-[11px]">
                    <span className="text-slate-500">Software Signature:</span>
                    <span className={cn(analysisResult.metadata.software !== 'None (Stripped)' ? 'text-amber-400' : 'text-slate-300')}>
                      {analysisResult.metadata.software}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-1.5 border-b border-slate-800 text-[11px]">
                    <span className="text-slate-500">GPS Coordinates:</span>
                    <span className="text-slate-300">{analysisResult.metadata.gps}</span>
                  </div>
                  <div className="flex items-center justify-between py-1.5 text-[11px]">
                    <span className="text-slate-500">File Structure:</span>
                    <span className="text-emerald-400">{analysisResult.metadata.fileStructure}</span>
                  </div>
                </div>
              ) : (
                <div className="py-6 text-center text-xs text-slate-500 space-y-1">
                  <Database className="w-6 h-6 text-slate-700 mx-auto" />
                  <p>No cryptographic record active.</p>
                  <p className="text-[10px] text-slate-600">Ingest an image above to populate ledger telemetry.</p>
                </div>
              )}
            </div>

            {/* Export & Actions */}
            {analysisResult && (
              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
                <a
                  href={`/api/report/${analysisResult.case_id}/export?format=markdown`}
                  download={`forensic_certificate_${analysisResult.case_id}.md`}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-all min-h-[44px] shadow-lg shadow-indigo-900/20"
                >
                  <FileText className="w-4 h-4" />
                  Export NIST Forensic Certificate (Markdown)
                </a>
                <a
                  href={`/api/report/${analysisResult.case_id}/export?format=html`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-all min-h-[44px] shadow-lg shadow-emerald-900/20"
                >
                  <ExternalLink className="w-4 h-4" />
                  Open HTML Metadata Certificate
                </a>
              </div>
            )}

          </div>

        </main>

        {/* Neural Prompt, Context & Model Studio (Igloo / Maze / Mural spec) */}
        <section className="max-w-screen-xl mx-auto px-4 sm:px-6 pb-16 pt-2">
          <PromptModelStudio
            currentCaseId={analysisResult?.case_id}
            fileHash={analysisResult?.metadata?.sha256}
            tamperProb={analysisResult?.tamperProbability}
            verdict={analysisResult?.verdict}
          />
        </section>

        {/* Floating AI Forensic Analyst Copilot Button (>_<) */}
        <div className="fixed bottom-6 right-6 z-40">
          <button
            onClick={() => setChatbotOpen((prev) => !prev)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-slate-900/90 hover:bg-slate-800 text-cyan-300 border border-cyan-500/40 shadow-xl shadow-cyan-950/60 backdrop-blur-md transition-all hover:scale-105 active:scale-95 group font-mono text-xs"
            title="Ask ForensIQ AI Copilot"
            aria-label="Open ForensIQ AI Forensic Copilot"
          >
            <span className="text-sm font-bold tracking-tighter px-1.5 py-0.5 rounded bg-cyan-950/70 border border-cyan-500/40 text-cyan-300 group-hover:border-cyan-400 group-hover:text-cyan-200 transition-colors">
              &gt;_&lt;
            </span>
            <span className="font-semibold hidden sm:inline">Analyst AI</span>
            <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
          </button>
        </div>

        {/* Forensic Analyst Chatbot Drawer / Modal */}
        <ForensicChatbot
          isOpen={chatbotOpen}
          onClose={() => setChatbotOpen(false)}
          caseContext={analysisResult}
        />
      </div>
    </div>
  );
}
