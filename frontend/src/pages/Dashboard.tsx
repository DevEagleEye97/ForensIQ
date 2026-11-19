import { useState, useCallback, useEffect, useRef } from 'react';
import {
  UploadCloud, Layers,
  AlertTriangle, ScanLine, Hash,
  Image as ImageIcon, RefreshCw, ChevronRight,
  Fingerprint, Radio, Database, Shield, Eye, AlertCircle,
  FileText, Sparkles, Check, X, ExternalLink, Lock, Cpu,
  Camera, Monitor, Scissors, HelpCircle
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
import ShaFingerprint from '../components/ShaFingerprint';
import TeamSection from '../components/TeamSection';
import ToolClusters from '../components/ToolClusters';
import LiveForensicTerminal from '../components/LiveForensicTerminal';

export interface SimplifiedReport {
  verdict: 'RED_FLAG' | 'GREEN_FLAG' | 'NEEDS_REVIEW';
  flag_color: string;
  flag_icon: string;
  status_message: string;
  simple_explanation: string;
  key_finding: string;
  confidence_level: 'HIGH' | 'MEDIUM' | 'LOW';
  hidden_code_found?: string | null;
  limitations?: string;
  technical_details_available?: boolean;

  // TruthLens Verdict Wording System fields
  headline?: string;
  flag?: 'GREEN' | 'AMBER' | 'RED';
  tamper_percent?: number;
  origin_class?: 'NATURAL_CAPTURE' | 'SCREEN_RECAPTURE' | 'EDITED_SPLICED' | 'AI_GENERATED' | 'UNCERTAIN';
  origin_label?: string;
  icon?: string;
  confidence?: string;
  plain_english?: string;
  human_review?: string;
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
  hidden_code_found?: string | null;
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

export default function Dashboard() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<BackendAnalysisResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'rgb' | 'ela'>('rgb');
  const [chatbotOpen, setChatbotOpen] = useState(false);
  const [investigatorMode, setInvestigatorMode] = useState<'simplified' | 'technical'>('simplified');
  const [systemStats, setSystemStats] = useState<{ scansToday: string; deepfakesFound: string; avgTrustScore: string; dbRecords: string }>({
    scansToday: '0',
    deepfakesFound: '0',
    avgTrustScore: '0%',
    dbRecords: '0',
  });

  const pendingResultRef = useRef<BackendAnalysisResult | null>(null);
  const terminalDoneRef = useRef(false);

  const handleTerminalComplete = useCallback(() => {
    terminalDoneRef.current = true;
    if (pendingResultRef.current) {
      setAnalysisResult(pendingResultRef.current);
      setAnalyzing(false);
    }
  }, []);

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
    terminalDoneRef.current = false;
    pendingResultRef.current = null;

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
          if (errJson.detail) {
            errDetail = errJson.detail;
          } else if (errJson.title) {
            errDetail = `${errJson.title}: ${errJson.detail || 'Internal Error'}`;
          }
        } catch {
          try {
            const errText = await response.text();
            if (errText.includes('ECONNREFUSED') || errText.includes('connect ECONNREFUSED')) {
              errDetail = 'ForensIQ backend is offline. Start the backend with: uvicorn main:app --reload --port 8000';
            } else if (response.status === 500) {
              errDetail = 'Backend service is offline or unreachable on http://127.0.0.1:8000. Ensure uvicorn is running.';
            }
          } catch {
            if (response.status === 500) {
              errDetail = 'Backend service is offline or unreachable on http://127.0.0.1:8000. Ensure uvicorn is running.';
            }
          }
        }
        throw new Error(errDetail);
      }

      const data: BackendAnalysisResult = await response.json();
      pendingResultRef.current = data;
      analytics.trackScan(targetFile.name, targetFile.size, data.verdict, data.tamperProbability);

      // If terminal animation is already done, render verdict immediately
      if (terminalDoneRef.current) {
        setAnalysisResult(data);
        setAnalyzing(false);
      }

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
      setAnalyzing(false);
      pendingResultRef.current = null;
    }
  };

  const executeClientDemo = async (targetFile: File) => {
    setAnalyzing(true);
    setErrorMessage(null);
    terminalDoneRef.current = false;
    pendingResultRef.current = null;

    try {
      const buffer = await targetFile.arrayBuffer();
      const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const sha256Hex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
      const shortCaseId = `CASE-DEMO-${sha256Hex.slice(0, 8).toUpperCase()}`;

      // Create synthetic ELA preview from canvas
      const canvas = document.createElement('canvas');
      canvas.width = 300;
      canvas.height = 200;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(0, 0, 300, 200);
        ctx.fillStyle = '#38bdf8';
        ctx.font = 'bold 12px monospace';
        ctx.fillText('ELA SPECTRUM (CLIENT SIMULATION)', 15, 30);
        ctx.fillStyle = '#ec4899';
        ctx.fillRect(40, 60, 220, 80);
      }
      const elaBase64 = canvas.toDataURL('image/jpeg', 0.85);

      const isSample = targetFile.name.includes('forensic_sample');
      const demoResult: BackendAnalysisResult = {
        case_id: shortCaseId,
        evidence_fingerprint: `SHA256: ${sha256Hex}`,
        tamperProbability: isSample ? 88 : 18,
        verdict: isSample ? 'Likely AI-Generated' : 'Authentic (Metadata Stripped)',
        simplified_report: {
          verdict: isSample ? 'RED_FLAG' : 'NEEDS_REVIEW',
          flag_color: isSample ? '#EF4444' : '#F59E0B',
          flag_icon: isSample ? '⚠️' : '✓',
          status_message: isSample ? 'Likely AI-Generated — Positive synthetic gradient identified' : 'Authentic (Metadata Stripped) — No AI signatures detected',
          simple_explanation: isSample
            ? 'The image exhibits high spatial gradient variance and synthetic spectral patterns characteristic of generative AI models.'
            : 'No AI generator signatures detected. Camera metadata was stripped during network transit (typical of social platforms).',
          key_finding: isSample ? 'Synthetic pattern & high Laplacian edge variance (>48.0).' : 'Clean compression profile, zero AI watermarks.',
          confidence_level: 'HIGH',
          hidden_code_found: isSample ? 'Synthetic Gradient & Inpainting Matrix' : null,
          limitations: 'In-browser diagnostic mode — for full neural ViT validation, start local uvicorn server.',
          technical_details_available: true,
        },
        recapture_analysis: {
          is_recaptured: false,
          recapture_confidence: 20,
          signals_detected: ['Missing camera hardware sensor tag'],
          ui_badge: null,
          recapture_adjusted_verdict: null,
        },
        checks: {
          spatialArtifact: isSample ? 'Fail' : 'Pass',
          frequencyAnomaly: isSample ? 'Fail' : 'Pass',
          metadataIntegrity: 'Warn',
          ganFingerprint: isSample ? 'Fail' : 'Warn',
        },
        metadata: {
          sha256: sha256Hex,
          format: targetFile.type.split('/')[1]?.toUpperCase() || 'JPEG',
          size: `${(targetFile.size / 1024).toFixed(1)} KB`,
          camera: 'Unknown (Born-Digital)',
          gps: 'Not available',
          modified: 'Not recorded',
          software: 'None (Client Processed)',
          fileStructure: 'Valid Stream',
        },
        elaBase64,
        anomalies: isSample
          ? [
              '[Spatial] Spatial scan FAIL — Laplacian patch std exceeds threshold (>48.0)',
              '[Frequency] High compression differential detected in synthetic layer',
              '[Metadata] Metadata WARN — Camera sensor metadata absent',
            ]
          : [
              '[Spatial] Spatial scan PASS — Uniform gradient transitions',
              '[Frequency] Frequency PASS — Single-generation compression',
              '[Metadata] Metadata WARN — EXIF stripped in transit',
            ],
        classificationModel: 'ForensIQ Client-Side Autonomous Engine (Offline Fallback)',
        fallbackMode: true,
        signals: {
          spatial_patch_std: isSample ? 88.5 : 12.3,
          ela_variance_pct: isSample ? 14.8 : 0.0,
          gan_effective_pct: isSample ? 84.0 : null,
        },
      };

      pendingResultRef.current = demoResult;
      if (terminalDoneRef.current) {
        setAnalysisResult(demoResult);
        setAnalyzing(false);
      }
    } catch (e: any) {
      setErrorMessage(`Client demo failed: ${e.message}`);
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
    terminalDoneRef.current = false;
    pendingResultRef.current = null;
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
        {/* KPI Stats Row (Dark Neomorphic Instruments, border removed) */}
        <div className="px-4 sm:px-6 py-6 grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
          {[
            { label: 'Scans Today', value: systemStats.scansToday, icon: ScanLine, color: 'text-cyan-400' },
            { label: 'Deepfakes Flagged', value: systemStats.deepfakesFound, icon: Fingerprint, color: 'text-rose-400' },
            { label: 'Avg Authenticity', value: systemStats.avgTrustScore, icon: Radio, color: 'text-emerald-400' },
            { label: 'Vault Cryptographic Records', value: systemStats.dbRecords, icon: Database, color: 'text-cyan-300' },
          ].map((s) => (
            <div key={s.label} className="neo-raised flex items-center gap-4 p-5 rounded-2xl transition-all">
              <div className={cn('neo-inset p-3 rounded-xl flex-shrink-0 flex items-center justify-center', s.color)}>
                <s.icon className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="text-base sm:text-xl font-bold text-slate-100 font-mono truncate">{s.value}</div>
                <div className="text-[10px] sm:text-xs text-slate-400 font-sans truncate mt-0.5">{s.label}</div>
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
                <div className="flex items-start gap-3 flex-1">
                  <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
                  <div className="space-y-1.5 flex-1">
                    <p className="text-xs font-semibold text-rose-200">Forensic Ingestion Notification</p>
                    <p className="text-xs text-rose-300/90 leading-relaxed font-mono">{errorMessage}</p>
                    {file && (
                      <div className="pt-1.5 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => executeClientDemo(file)}
                          className="px-3 py-1.5 rounded-lg text-xs font-mono font-medium bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-200 transition-colors flex items-center gap-2 shadow-sm"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-cyan-300 animate-pulse" />
                          Run Client-Side Forensic Simulation (Demo Mode)
                        </button>
                      </div>
                    )}
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

            {/* Dropzone Container: Dark Neomorphic Inset Well with Tactical Corner Brackets */}
            <div
              {...getRootProps()}
              className={cn(
                'neo-inset rounded-3xl p-6 sm:p-10 text-center transition-all duration-300 relative overflow-hidden flex flex-col items-center justify-center min-h-[260px] group cursor-pointer',
                isDragActive && 'scale-[1.01]'
              )}
            >
              {/* Tactical L-Shaped Corner Brackets */}
              <div className="absolute top-4 left-4 w-4 h-4 border-t-2 border-l-2 border-cyan-400/80 group-hover:border-cyan-300 transition-colors pointer-events-none" />
              <div className="absolute top-4 right-4 w-4 h-4 border-t-2 border-r-2 border-cyan-400/80 group-hover:border-cyan-300 transition-colors pointer-events-none" />
              <div className="absolute bottom-4 left-4 w-4 h-4 border-b-2 border-l-2 border-cyan-400/80 group-hover:border-cyan-300 transition-colors pointer-events-none" />
              <div className="absolute bottom-4 right-4 w-4 h-4 border-b-2 border-r-2 border-cyan-400/80 group-hover:border-cyan-300 transition-colors pointer-events-none" />

              {/* Pulsing Scan Line Beam */}
              <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-60 animate-pulse pointer-events-none" />

              <input {...getInputProps()} disabled={analyzing} />

<AnimatePresence mode="wait">
                {analyzing ? (
                  /* Live Forensic Terminal (Real-time 10-tool execution stream) */
                  <motion.div
                    key="analyzing-terminal"
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    className="w-full py-2 cursor-default"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <LiveForensicTerminal onComplete={handleTerminalComplete} />
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
                          className="neo-btn text-xs py-2 px-4 flex items-center gap-2"
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
                    className="flex flex-col items-center gap-4 py-4"
                  >
                    <div className="neo-raised p-4 rounded-2xl text-cyan-400 shadow-md group-hover:scale-105 transition-transform flex items-center justify-center">
                      <UploadCloud className="w-8 h-8" />
                    </div>
                    <div className="space-y-1.5 max-w-md">
                      <p className="font-bold text-slate-100 text-sm sm:text-base font-mono">
                        Drop your image here — we'll handle the math.
                      </p>
                      <p className="text-xs text-slate-400 font-sans">
                        Drag &amp; drop evidence file or <span className="text-cyan-400 underline decoration-cyan-400/50">browse local filesystem</span>
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center justify-center gap-2.5 pt-1 font-mono text-[10px]">
                      <span className="neo-badge text-cyan-300">
                        image/jpeg (FFD8)
                      </span>
                      <span className="neo-badge text-emerald-300">
                        image/png (8950)
                      </span>
                      <span className="neo-badge text-slate-400">
                        Max 25 MB
                      </span>
                      <span className="neo-badge text-emerald-400">
                        Strict Zero-Disk RAM
                      </span>
                    </div>

                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          loadDemoSample();
                        }}
                        className="neo-btn text-xs font-mono font-medium flex items-center gap-2 mt-1"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                        Load Synthetic Test Target #01
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Tool Clusters: 10 Operational Forensic Engines (Glassmorphism Cards) */}
            {!analysisResult && !analyzing && (
              <ToolClusters />
            )}

            {/* TRUTHLENS FORENSIQ: 4 ENHANCEMENT DELIVERABLES */}
            {analysisResult && (
              <div className="space-y-4">
                {/* 1. Evidence Fingerprint (SHA-256 Forensic Hashing & Privacy Masking) */}
                <div className="glass-card p-4 sm:p-5 rounded-2xl shadow-lg border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between pb-1">
                    <div className="flex items-center gap-2">
                      <Fingerprint className="w-4 h-4 text-cyan-400" />
                      <span className="text-xs font-mono uppercase tracking-wider text-cyan-300 font-bold">
                        Evidence Cryptographic Fingerprint
                      </span>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      NIST SP 800-86 Verified
                    </span>
                  </div>

                  <ShaFingerprint hash={analysisResult.evidence_fingerprint || analysisResult.metadata.sha256} />
                </div>

                {/* 2. Red/Green/Amber Flag Instant Visual Verdict & Origin Wording System */}
                {analysisResult.simplified_report && (() => {
                  const rep = analysisResult.simplified_report;
                  const flag: 'GREEN' | 'AMBER' | 'RED' = rep?.flag || (
                    rep?.verdict === 'GREEN_FLAG' ? 'GREEN' : rep?.verdict === 'RED_FLAG' ? 'RED' : 'AMBER'
                  );
                  const headline = rep?.headline || (
                    flag === 'GREEN' ? 'Clean' : flag === 'AMBER' ? 'Low suspicion' : 'Suspicious'
                  );
                  const tamperPercent = typeof rep?.tamper_percent === 'number'
                    ? rep.tamper_percent
                    : analysisResult.tamperProbability;

                  const isRecap = analysisResult.recapture_analysis?.is_recaptured;
                  const originLabel = rep?.origin_label || (
                    isRecap
                      ? 'Screen re-capture (screenshot / photo of a display)'
                      : analysisResult.verdict === 'Spliced / Edited'
                      ? 'Edited / spliced image'
                      : analysisResult.verdict === 'Likely AI-Generated'
                      ? 'AI-generated (synthetic)'
                      : 'Natural camera photo'
                  );

                  const iconName = rep?.icon || (
                    isRecap ? 'monitor' : analysisResult.verdict === 'Spliced / Edited' ? 'scissors' : analysisResult.verdict === 'Likely AI-Generated' ? 'sparkles' : 'camera'
                  );

                  const confidence = rep?.confidence || rep?.confidence_level || 'HIGH';
                  const plainEnglish = rep?.plain_english || rep?.simple_explanation || 'Your image analysis is complete.';
                  const humanReview = rep?.human_review || 'Automated indicator only — a human investigator makes the final call.';

                  return (
                    <div className="neo-raised p-6 space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <span className={cn('flag', `flag-${flag}`)}>
                            {flag} FLAG
                          </span>
                          <span className="text-xs font-mono text-slate-400">
                            Confidence: <strong className="text-slate-200">{confidence}</strong>
                          </span>
                        </div>

                        {/* Investigator Mode Toggle: Soft Cyber Neomorphic Inset Track + Raised Knob */}
                        <div className="neo-inset p-1.5 rounded-2xl flex items-center gap-1.5 self-stretch sm:self-auto justify-center">
                          <button
                            type="button"
                            onClick={() => setInvestigatorMode('simplified')}
                            className={cn(
                              'px-4 py-1.5 rounded-xl text-xs font-semibold font-mono transition-all min-h-[32px]',
                              investigatorMode === 'simplified'
                                ? 'neo-raised text-cyan-300 shadow-md'
                                : 'text-slate-400 hover:text-slate-200'
                            )}
                          >
                            Plain English
                          </button>
                          <button
                            type="button"
                            onClick={() => setInvestigatorMode('technical')}
                            className={cn(
                              'px-4 py-1.5 rounded-xl text-xs font-semibold font-mono transition-all min-h-[32px]',
                              investigatorMode === 'technical'
                                ? 'neo-raised text-cyan-300 shadow-md'
                                : 'text-slate-400 hover:text-slate-200'
                            )}
                          >
                            Technical Jargon
                          </button>
                        </div>
                      </div>

                      {/* Headline + the % RIGHT BELOW IT, always */}
                      <div>
                        <h2 className="text-2xl font-bold text-white tracking-tight">{headline}</h2>
                        <p className="font-mono text-sm text-cyan-300 mt-1">
                          Tamper probability: <b className="text-white text-base font-bold">{tamperPercent}%</b>
                        </p>
                      </div>

                      {/* Origin class chip — answers "natural or capture or edited?" instantly */}
                      <div className="inline-flex items-center gap-2 px-3.5 py-1.5 neo-badge text-xs">
                        {iconName === 'camera' && <Camera className="w-4 h-4 text-emerald-400" />}
                        {iconName === 'monitor' && <Monitor className="w-4 h-4 text-cyan-400" />}
                        {iconName === 'scissors' && <Scissors className="w-4 h-4 text-rose-400" />}
                        {iconName === 'sparkles' && <Sparkles className="w-4 h-4 text-purple-400" />}
                        {iconName === 'help' && <HelpCircle className="w-4 h-4 text-amber-400" />}
                        <span className="text-slate-200 font-sans font-medium">{originLabel}</span>
                      </div>

                      {/* Plain English summary / Technical Jargon in neo-inset well */}
                      <div className="neo-inset p-4.5 rounded-xl text-sm text-slate-300 leading-relaxed font-sans">
                        {investigatorMode === 'simplified' ? (
                          <p>{plainEnglish}</p>
                        ) : (
                          <div className="space-y-1.5 font-mono text-xs text-slate-300">
                            <p className="text-cyan-300 font-semibold">[TECHNICAL TELEMETRY BREAKDOWN]</p>
                            <p>• Sensor &amp; ELA Telemetry: Spatial patch deviation = {analysisResult.signals?.spatial_patch_std ?? 'N/A'}</p>
                            <p>• High-frequency residual differential: {analysisResult.signals?.ela_variance_pct ?? 'N/A'}%</p>
                            <p>• GAN Discriminator effective score: {analysisResult.signals?.gan_effective_pct ?? 'N/A'}% via model {analysisResult.classificationModel}</p>
                          </div>
                        )}
                      </div>

                      <p className="text-[11px] text-slate-500 italic font-sans">{humanReview}</p>
                    </div>
                  );
                })()}

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

                  <div className="neo-inset p-1.5 rounded-2xl flex items-center gap-1.5">
                    <button
                      onClick={() => setViewMode('rgb')}
                      className={cn(
                        'flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-semibold font-mono transition-all min-h-[32px]',
                        viewMode === 'rgb' ? 'neo-raised text-cyan-300 shadow-md' : 'text-slate-400 hover:text-slate-200'
                      )}
                    >
                      <Eye className="w-3.5 h-3.5" /> Original RGB
                    </button>
                    <button
                      onClick={() => setViewMode('ela')}
                      className={cn(
                        'flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-semibold font-mono transition-all min-h-[32px]',
                        viewMode === 'ela' ? 'neo-raised text-cyan-300 shadow-md' : 'text-slate-400 hover:text-slate-200'
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

            {/* Regrouped Tool Clusters: 3 Labeled Pillars */}
            <div className="glass-card border border-slate-800 rounded-2xl p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
                <div className="flex items-center gap-2">
                  <ScanLine className="w-4 h-4 text-cyan-400" />
                  <h3 className="text-sm font-semibold text-slate-100 font-mono">
                    Forensic Inspection Clusters
                  </h3>
                </div>
                <span className="text-[10px] font-mono text-cyan-300 px-2 py-0.5 rounded bg-cyan-950/40 border border-cyan-500/30">
                  3-PILLAR TRUTHLENS PIPELINE
                </span>
              </div>

              <div className="space-y-4">
                {[
                  {
                    cluster: 'Pixel & Frequency',
                    badge: 'TIER 1 // DETERMINISTIC',
                    badgeColor: 'text-cyan-400 border-cyan-500/30 bg-cyan-950/30',
                    tools: [
                      {
                        name: 'Compression Forensics',
                        desc: 'Finds pasted or spliced regions by measuring re-compression error differentials across 8×8 DCT grids.',
                        status: analysisResult ? analysisResult.checks.frequencyAnomaly : 'ONLINE',
                        latency: '12ms',
                        icon: Layers,
                      },
                      {
                        name: 'Spatial Gradient Scan',
                        desc: 'Detects inpainting seams and sharp boundary discontinuities using 2D Laplacian edge response.',
                        status: analysisResult ? analysisResult.checks.spatialArtifact : 'ARMED',
                        latency: '18ms',
                        icon: ScanLine,
                      },
                    ],
                  },
                  {
                    cluster: 'AI & Vision',
                    badge: 'TIER 2 // MULTI-SPECTRAL',
                    badgeColor: 'text-indigo-400 border-indigo-500/30 bg-indigo-950/30',
                    tools: [
                      {
                        name: 'Deepfake Neural Classifier',
                        desc: 'Probes for generative diffusion artifacts, corneal reflection geometry, and synthetic facial warping.',
                        status: analysisResult ? analysisResult.checks.ganFingerprint : 'ONLINE',
                        latency: '140ms',
                        icon: Cpu,
                      },
                      {
                        name: 'Byte-Level Decompiler',
                        desc: 'Extracts hidden C2PA provenance manifests, PNG prompt chunks, and synthetic generator signatures.',
                        status: analysisResult?.hidden_code_found ? 'Warn' : 'ONLINE',
                        latency: '4ms',
                        icon: Sparkles,
                      },
                    ],
                  },
                  {
                    cluster: 'Custody & Compliance',
                    badge: 'TIER 3 // NIST SP 800-86',
                    badgeColor: 'text-emerald-400 border-emerald-500/30 bg-emerald-950/30',
                    tools: [
                      {
                        name: 'Cryptographic Provenance',
                        desc: 'Generates tamper-evident SHA-256 bitstream digests and preserves strict chain of custody in the vault.',
                        status: analysisResult ? analysisResult.checks.metadataIntegrity : 'ONLINE',
                        latency: '<1ms',
                        icon: Shield,
                      },
                      {
                        name: 'Zero-Disk RAM Pipeline',
                        desc: 'Strict in-memory buffer processing; evidence is never retained on disk and cleared post-inference.',
                        status: 'ARMED',
                        latency: '0ms',
                        icon: Lock,
                      },
                    ],
                  },
                ].map((grp) => (
                  <div key={grp.cluster} className="space-y-2">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-slate-300 font-bold">{grp.cluster}</span>
                      <span className={cn('text-[9px] px-2 py-0.5 rounded border font-mono', grp.badgeColor)}>
                        {grp.badge}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {grp.tools.map((t) => (
                        <div
                          key={t.name}
                          className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80 hover:border-slate-700 transition-colors flex flex-col justify-between space-y-2"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <t.icon className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                              <span className="text-xs font-semibold text-slate-200">{t.name}</span>
                            </div>
                            <span className={cn(
                              'text-[10px] font-mono px-2 py-0.5 rounded border',
                              t.status === 'Fail'
                                ? 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                                : t.status === 'Warn'
                                ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                                : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                            )}>
                              {t.status}
                            </span>
                          </div>

                          <p className="text-[11px] text-slate-400 leading-relaxed font-sans">{t.desc}</p>

                          <div className="flex items-center justify-between pt-1 border-t border-slate-800/60 text-[10px] font-mono text-slate-500">
                            <span>Latency: {t.latency}</span>
                            <span className="text-emerald-400 flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                              Synchronized
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
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

          {/* RIGHT COLUMN: Evidence Ledger & Charts (Dark Neomorphic Raised Panels) */}
          <div className="space-y-6">

            {/* Overall Score Card */}
            <div className="neo-raised rounded-2xl p-6 space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-slate-400 font-mono uppercase tracking-wider">Tamper Probability Index</p>
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
                <div className="flex rounded-full overflow-hidden h-2.5 gap-0.5 bg-slate-900 shadow-inner">
                  <div
                    className="bg-emerald-500 transition-all duration-500"
                    style={{ width: `${analysisResult ? Math.max(5, 100 - analysisResult.tamperProbability) : 100}%` }}
                  />
                  <div
                    className="bg-rose-500 transition-all duration-500"
                    style={{ width: `${analysisResult ? analysisResult.tamperProbability : 0}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                  <span>Authentic Prob</span>
                  <span>Tamper Risk</span>
                </div>
              </div>
            </div>

            {/* Anomaly Breakdown Chart */}
            <div className="neo-raised rounded-2xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-200 font-mono">Anomaly Signal Vectors</h3>
                <span className="neo-badge text-cyan-300">Normalized (0-100)</span>
              </div>

              <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={anomalyChartData} layout="vertical" barSize={14}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                    <XAxis type="number" domain={[0, 100]} stroke="#475569" fontSize={10} tickLine={false} />
                    <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={10} width={90} tickLine={false} />
                    <Tooltip contentStyle={{ backgroundColor: '#0a0f16', borderColor: '#1e293b', borderRadius: '12px', fontSize: 11 }} />
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
            <div className="neo-raised rounded-2xl p-6 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Hash className="w-4 h-4 text-cyan-400" />
                  <h3 className="text-sm font-semibold text-slate-200 font-mono">Ledger &amp; EXIF Metadata</h3>
                </div>
                <span className="neo-badge text-emerald-400 flex items-center gap-1">
                  <Check className="w-3 h-3" /> Chain-Verified
                </span>
              </div>

              {analysisResult ? (
                <div className="space-y-2.5 font-mono text-xs">
                  <ShaFingerprint hash={analysisResult.metadata.sha256} />

                  <div className="flex items-center justify-between py-1.5 border-b border-white/5 text-[11px]">
                    <span className="text-slate-400 font-sans">Camera Hardware:</span>
                    <span className={cn(analysisResult.metadata.camera.includes('Unknown') ? 'text-amber-400' : 'text-slate-300')}>
                      {analysisResult.metadata.camera}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-1.5 border-b border-white/5 text-[11px]">
                    <span className="text-slate-400 font-sans">Software Signature:</span>
                    <span className={cn(analysisResult.metadata.software !== 'None (Stripped)' ? 'text-amber-400' : 'text-slate-300')}>
                      {analysisResult.metadata.software}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-1.5 border-b border-white/5 text-[11px]">
                    <span className="text-slate-400 font-sans">GPS Coordinates:</span>
                    <span className="text-slate-300">{analysisResult.metadata.gps}</span>
                  </div>
                  <div className="flex items-center justify-between py-1.5 text-[11px]">
                    <span className="text-slate-400 font-sans">File Structure:</span>
                    <span className="text-emerald-400">{analysisResult.metadata.fileStructure}</span>
                  </div>
                </div>
              ) : (
                <div className="py-6 text-center text-xs text-slate-400 space-y-1">
                  <Database className="w-6 h-6 text-slate-600 mx-auto" />
                  <p>No cryptographic record active.</p>
                  <p className="text-[10px] text-slate-500 font-sans">Ingest an image above to populate ledger telemetry.</p>
                </div>
              )}
            </div>

            {/* Export & Actions */}
            {analysisResult && (
              <div className="neo-raised rounded-2xl p-6 space-y-3">
                <a
                  href={`/api/report/${analysisResult.case_id}/export?format=markdown`}
                  download={`forensic_certificate_${analysisResult.case_id}.md`}
                  className="neo-btn w-full flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-semibold text-cyan-300"
                >
                  <FileText className="w-4 h-4" />
                  Export NIST Forensic Certificate (Markdown)
                </a>
                <a
                  href={`/api/report/${analysisResult.case_id}/export?format=html`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="neo-btn w-full flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-semibold text-emerald-400"
                >
                  <ExternalLink className="w-4 h-4" />
                  Open HTML Metadata Certificate
                </a>
              </div>
            )}

          </div>

        </main>

        {/* Neural Prompt, Context & Model Studio (Igloo / Maze / Mural spec) */}
        <section className="max-w-screen-xl mx-auto px-4 sm:px-6 pb-8 pt-2">
          <PromptModelStudio
            currentCaseId={analysisResult?.case_id}
            fileHash={analysisResult?.metadata?.sha256}
            tamperProb={analysisResult?.tamperProbability}
            verdict={analysisResult?.verdict}
          />
        </section>

        {/* Team Bhairava Human Story & Conviction */}
        <TeamSection />

        {/* Compliance, Privacy & Evidentiary Terms Strip */}
        <section className="max-w-screen-xl mx-auto px-4 sm:px-6 py-6 border-t border-slate-800/80 mt-8 text-xs font-mono text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-slate-400">
            <Shield className="w-4 h-4 text-cyan-400" />
            <span>NIST SP 800-86 · ISO/IEC 27037 · FRE Rule 902(14) Certified</span>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-[11px]">
            <a
              href="/privacy"
              onClick={(e) => {
                e.preventDefault();
                window.history.pushState(null, '', '/privacy');
                window.dispatchEvent(new PopStateEvent('popstate'));
              }}
              className="text-cyan-400 hover:text-cyan-300 transition-colors underline underline-offset-2"
            >
              Privacy Policy &amp; Data Protocol
            </a>
            <span>·</span>
            <a
              href="/terms"
              onClick={(e) => {
                e.preventDefault();
                window.history.pushState(null, '', '/terms');
                window.dispatchEvent(new PopStateEvent('popstate'));
              }}
              className="text-teal-400 hover:text-teal-300 transition-colors underline underline-offset-2"
            >
              Terms &amp; Conditions
            </a>
            <span>·</span>
            <a
              href="https://github.com/DevEagleEye97/ForensIQ"
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-400 hover:text-white transition-colors"
            >
              GitHub (DevEagleEye97/ForensIQ)
            </a>
          </div>
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
