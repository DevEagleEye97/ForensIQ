import { useState, useCallback } from 'react';
import {
  UploadCloud, Layers, Activity, FileSearch,
  CheckCircle2, AlertTriangle, XCircle, ScanLine, Hash,
  Clock, Image, Video, Download, RefreshCw, ChevronRight,
  Fingerprint, Radio, Database
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDropzone } from 'react-dropzone';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip,
  RadialBarChart, RadialBar, Cell, BarChart, Bar, CartesianGrid
} from 'recharts';
import { cn } from '../lib/utils';

const mockChartData = [
  { frame: '00:01', authenticity: 99 },
  { frame: '00:05', authenticity: 98 },
  { frame: '00:10', authenticity: 95 },
  { frame: '00:15', authenticity: 82 },
  { frame: '00:20', authenticity: 45 },
  { frame: '00:25', authenticity: 32 },
  { frame: '00:30', authenticity: 28 },
  { frame: '00:35', authenticity: 60 },
  { frame: '00:40', authenticity: 92 },
];

const anomalyBarData = [
  { name: 'DCT', score: 12 },
  { name: 'Wavelet', score: 68 },
  { name: 'PRNU', score: 24 },
  { name: 'Noise', score: 55 },
  { name: 'Edges', score: 8 },
  { name: 'Color', score: 31 },
];

const checks = [
  { label: 'Spatial Artifact Scan', status: 'pass', detail: 'No cloning or splicing regions detected' },
  { label: 'Frequency Anomaly', status: 'warn', detail: 'Wavelet residual spike at 00:20–00:30' },
  { label: 'Metadata Integrity', status: 'pass', detail: 'EXIF chain intact, GPS consistent' },
  { label: 'GAN Fingerprint', status: 'fail', detail: 'StyleGAN2 signature detected in region B4' },
  { label: 'Compression History', status: 'pass', detail: 'Single-generation JPEG confirmed' },
  { label: 'Face Consistency', status: 'warn', detail: 'Micro-expression discontinuity at frame 847' },
];

const statusMeta: Record<string, { icon: typeof CheckCircle2; color: string; badge: string }> = {
  pass: { icon: CheckCircle2, color: 'text-emerald-400', badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
  warn: { icon: AlertTriangle, color: 'text-amber-400', badge: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
  fail: { icon: XCircle, color: 'text-rose-400', badge: 'bg-rose-500/10 text-rose-400 border-rose-500/20' },
};

const recentScans = [
  { name: 'press_conference.mp4', score: 84, type: 'video', status: 'warn', time: '2m ago' },
  { name: 'suspect_photo.jpg', score: 97, type: 'image', status: 'pass', time: '14m ago' },
  { name: 'leaked_clip.mp4', score: 23, type: 'video', status: 'fail', time: '1h ago' },
  { name: 'passport_scan.jpg', score: 91, type: 'image', status: 'pass', time: '3h ago' },
];

export default function Dashboard() {
  const [file, setFile] = useState<File | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzed, setAnalyzed] = useState(false);
  const [activeTab, setActiveTab] = useState<'timeline' | 'anomaly'>('timeline');

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
      setAnalyzing(true);
      setAnalyzed(false);
      setTimeout(() => {
        setAnalyzing(false);
        setAnalyzed(true);
      }, 2200);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': [], 'video/*': [] },
    maxFiles: 1,
  });

  const reset = () => { setFile(null); setAnalyzing(false); setAnalyzed(false); };

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-slate-950">
      {/* Sub-header / breadcrumb bar */}
      <div className="border-b border-slate-800/60 bg-slate-900/30 px-6 py-2.5 flex items-center gap-2 text-xs text-slate-500">
        <span className="text-indigo-400 font-medium">ForensIQ</span>
        <ChevronRight className="w-3 h-3" />
        <span>Dashboard</span>
        {file && (
          <>
            <ChevronRight className="w-3 h-3" />
            <span className="text-slate-300">{file.name}</span>
          </>
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Stats Row */}
        <div className="border-b border-slate-800/40 bg-slate-900/20 px-6 py-4 grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Scans Today', value: '247', icon: ScanLine, color: 'text-indigo-400' },
            { label: 'Deepfakes Found', value: '31', icon: Fingerprint, color: 'text-rose-400' },
            { label: 'Avg. Trust Score', value: '79.3%', icon: Radio, color: 'text-emerald-400' },
            { label: 'DB Records', value: '14,882', icon: Database, color: 'text-sky-400' },
          ].map((s) => (
            <div key={s.label} className="flex items-center gap-3">
              <div className={`p-2 rounded-lg bg-slate-800/60 ${s.color}`}>
                <s.icon className="w-4 h-4" />
              </div>
              <div>
                <div className="text-lg font-bold text-slate-100">{s.value}</div>
                <div className="text-xs text-slate-500">{s.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Main Grid */}
        <main className="max-w-screen-xl mx-auto p-6 grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Upload + Analysis Column */}
          <div className="xl:col-span-2 space-y-5">
            {/* Dropzone */}
            <div
              {...getRootProps()}
              className={cn(
                'border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-200',
                'flex flex-col items-center justify-center min-h-[200px] relative overflow-hidden',
                isDragActive
                  ? 'border-indigo-400 bg-indigo-500/10 scale-[1.01]'
                  : analyzed
                  ? 'border-slate-700 bg-slate-900/40 cursor-default'
                  : 'border-slate-800 hover:border-slate-700 bg-slate-900/40'
              )}
            >
              <input {...getInputProps()} disabled={analyzing || analyzed} />
              <AnimatePresence mode="wait">
                {analyzing ? (
                  <motion.div key="analyzing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center gap-3">
                    <div className="relative w-14 h-14">
                      <div className="absolute inset-0 rounded-full border-2 border-indigo-500/30 animate-ping" />
                      <div className="relative w-full h-full rounded-full bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center">
                        <Activity className="w-6 h-6 text-indigo-400 animate-pulse" />
                      </div>
                    </div>
                    <p className="text-sm font-semibold text-slate-200">Analyzing {file?.name}…</p>
                    <div className="w-48 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-gradient-to-r from-indigo-500 to-sky-400 rounded-full"
                        initial={{ width: '0%' }}
                        animate={{ width: '100%' }}
                        transition={{ duration: 2.1, ease: 'easeInOut' }}
                      />
                    </div>
                  </motion.div>
                ) : analyzed ? (
                  <motion.div key="done" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex items-center gap-4 w-full px-4">
                    <div className="p-3 rounded-xl bg-slate-800 border border-slate-700">
                      {file?.type.startsWith('video') ? <Video className="w-7 h-7 text-indigo-400" /> : <Image className="w-7 h-7 text-indigo-400" />}
                    </div>
                    <div className="flex-1 text-left">
                      <p className="font-semibold text-slate-100 text-sm truncate">{file?.name}</p>
                      <p className="text-xs text-slate-400">{(file!.size / 1024 / 1024).toFixed(2)} MB · Analysis complete</p>
                    </div>
                    <button onClick={(e) => { e.stopPropagation(); reset(); }} className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors" aria-label="Reset">
                      <RefreshCw className="w-4 h-4" />
                    </button>
                  </motion.div>
                ) : (
                  <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center gap-3">
                    <div className="p-4 rounded-full bg-slate-800/80 text-indigo-400 border border-slate-700">
                      <UploadCloud className="w-8 h-8" />
                    </div>
                    <p className="font-semibold text-slate-200">Drop suspicious media here, or click to browse</p>
                    <p className="text-xs text-slate-500">Supports PNG · JPG · MP4 · WEBM up to 200 MB</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Chart Panel */}
            <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-5">
              {/* Tab Header */}
              <div className="flex items-center justify-between mb-5">
                <div className="flex gap-1 p-1 bg-slate-800/60 rounded-xl">
                  {(['timeline', 'anomaly'] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => setActiveTab(t)}
                      className={cn(
                        'px-4 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150',
                        activeTab === t
                          ? 'bg-indigo-600 text-white shadow'
                          : 'text-slate-400 hover:text-slate-200'
                      )}
                    >
                      {t === 'timeline' ? 'Authenticity Timeline' : 'Anomaly Breakdown'}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                  <span className="w-2 h-2 rounded-full bg-indigo-500" />
                  Frame-by-frame
                </div>
              </div>

              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  {activeTab === 'timeline' ? (
                    <AreaChart data={mockChartData}>
                      <defs>
                        <linearGradient id="colorAuth" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6366f1" stopOpacity={0.7} />
                          <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="frame" stroke="#475569" fontSize={11} tickLine={false} axisLine={false} />
                      <YAxis stroke="#475569" fontSize={11} tickLine={false} axisLine={false} domain={[0, 100]} />
                      <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '10px', fontSize: 12 }} />
                      <Area type="monotone" dataKey="authenticity" stroke="#818cf8" strokeWidth={2.5} fillOpacity={1} fill="url(#colorAuth)" dot={{ r: 3, fill: '#818cf8', strokeWidth: 0 }} />
                    </AreaChart>
                  ) : (
                    <BarChart data={anomalyBarData} barSize={28}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                      <XAxis dataKey="name" stroke="#475569" fontSize={11} tickLine={false} axisLine={false} />
                      <YAxis stroke="#475569" fontSize={11} tickLine={false} axisLine={false} domain={[0, 100]} />
                      <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '10px', fontSize: 12 }} />
                      <Bar dataKey="score" radius={[6, 6, 0, 0]}>
                        {anomalyBarData.map((entry, i) => (
                          <Cell key={i} fill={entry.score > 50 ? '#f43f5e' : entry.score > 25 ? '#f59e0b' : '#6366f1'} />
                        ))}
                      </Bar>
                    </BarChart>
                  )}
                </ResponsiveContainer>
              </div>
            </div>

            {/* Forensic Checks */}
            <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <ScanLine className="w-4 h-4 text-indigo-400" />
                <span className="text-sm font-semibold text-slate-200">Forensic Check Results</span>
                <span className="ml-auto text-xs text-slate-500">{checks.length} checks run</span>
              </div>
              <div className="space-y-2">
                {checks.map((c) => {
                  const meta = statusMeta[c.status];
                  return (
                    <div key={c.label} className="flex items-start gap-3 p-3 rounded-xl bg-slate-950/40 border border-slate-800/60 hover:border-slate-700/60 transition-colors">
                      <meta.icon className={`w-4 h-4 mt-0.5 flex-shrink-0 ${meta.color}`} />
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-semibold text-slate-200">{c.label}</div>
                        <div className="text-xs text-slate-500 mt-0.5 truncate">{c.detail}</div>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full border font-medium flex-shrink-0 ${meta.badge}`}>
                        {c.status.toUpperCase()}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-5">
            {/* Trust Score Card */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5"
            >
              <div className="flex items-center gap-2 mb-4 text-sm font-semibold text-slate-200">
                <FileSearch className="w-4 h-4 text-indigo-400" />
                Inspection Summary
              </div>

              {/* Radial Score */}
              <div className="relative h-36 w-full mb-3">
                <ResponsiveContainer width="100%" height="100%">
                  <RadialBarChart cx="50%" cy="50%" innerRadius="60%" outerRadius="80%" barSize={12} data={[{ name: 'score', value: 84.2, fill: '#6366f1' }]} startAngle={220} endAngle={-40}>
                    <RadialBar dataKey="value" cornerRadius={6} />
                  </RadialBarChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-black text-slate-100">84.2%</span>
                  <span className="text-xs text-slate-400">Trust Score</span>
                </div>
              </div>

              <div className="space-y-2">
                {checks.slice(0, 4).map((c) => {
                  const meta = statusMeta[c.status];
                  return (
                    <div key={c.label} className="flex items-center justify-between text-xs text-slate-300">
                      <span className="flex items-center gap-1.5">
                        <meta.icon className={`w-3.5 h-3.5 ${meta.color}`} />
                        {c.label}
                      </span>
                      <span className={meta.color + ' font-medium'}>{c.status.charAt(0).toUpperCase() + c.status.slice(1)}</span>
                    </div>
                  );
                })}
              </div>

              <button className="mt-4 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-indigo-500/30 bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 hover:text-indigo-300 text-xs font-semibold transition-all">
                <Download className="w-3.5 h-3.5" />
                Export Report
              </button>
            </motion.div>

            {/* File Metadata */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-4 text-sm font-semibold text-slate-200">
                <Hash className="w-4 h-4 text-sky-400" />
                File Metadata
              </div>
              <div className="space-y-2.5 text-xs">
                {[
                  { label: 'SHA-256', value: file ? '3b4d…f9a2' : '—' },
                  { label: 'Format', value: file ? (file.type.includes('video') ? 'MP4 / H.264' : 'JPEG') : '—' },
                  { label: 'Size', value: file ? `${(file.size / 1024 / 1024).toFixed(2)} MB` : '—' },
                  { label: 'Camera', value: file ? 'Canon EOS R5' : '—' },
                  { label: 'GPS', value: file ? '12.9716°N 77.5946°E' : '—' },
                  { label: 'Modified', value: file ? '2026-11-18 14:32 UTC' : '—' },
                ].map((m) => (
                  <div key={m.label} className="flex justify-between gap-2">
                    <span className="text-slate-500">{m.label}</span>
                    <span className="text-slate-300 font-mono truncate">{m.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Scans */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-4 text-sm font-semibold text-slate-200">
                <Clock className="w-4 h-4 text-teal-400" />
                Recent Scans
              </div>
              <div className="space-y-2">
                {recentScans.map((s) => {
                  const meta = statusMeta[s.status];
                  return (
                    <div key={s.name} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-800/40 cursor-pointer transition-colors group">
                      <div className="p-1.5 rounded-lg bg-slate-800">
                        {s.type === 'video' ? <Video className="w-3.5 h-3.5 text-slate-400" /> : <Image className="w-3.5 h-3.5 text-slate-400" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-slate-200 truncate group-hover:text-white transition-colors">{s.name}</p>
                        <p className="text-[10px] text-slate-500">{s.time}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className={`text-xs font-bold ${meta.color}`}>{s.score}%</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded border ${meta.badge}`}>{s.status}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Layers Panel */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-4 text-sm font-semibold text-slate-200">
                <Layers className="w-4 h-4 text-violet-400" />
                Analysis Layers
              </div>
              {[
                { name: 'Neural Detector', score: 91, color: 'bg-indigo-500' },
                { name: 'Frequency Domain', score: 68, color: 'bg-amber-500' },
                { name: 'Metadata Chain', score: 100, color: 'bg-emerald-500' },
                { name: 'GAN Detection', score: 23, color: 'bg-rose-500' },
              ].map((l) => (
                <div key={l.name} className="mb-3">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-400">{l.name}</span>
                    <span className={cn(
                      'font-semibold',
                      l.score >= 80 ? 'text-emerald-400' : l.score >= 50 ? 'text-amber-400' : 'text-rose-400'
                    )}>{l.score}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                    <motion.div
                      className={`h-full ${l.color} rounded-full`}
                      initial={{ width: 0 }}
                      animate={{ width: `${l.score}%` }}
                      transition={{ duration: 0.8, ease: 'easeOut' }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
