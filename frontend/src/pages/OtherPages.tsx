import {
  ScanLine, Clock, FileBarChart2, AlertTriangle,
  CheckCircle2, XCircle, Image, Video, Download,
  ArrowUpRight, Filter
} from 'lucide-react';
import { cn } from '../lib/utils';

const history = [
  { name: 'press_conference.mp4', score: 84, type: 'video', status: 'warn', date: '2026-11-19 09:12', size: '124 MB', duration: '2.1s' },
  { name: 'suspect_photo.jpg', score: 97, type: 'image', status: 'pass', date: '2026-11-19 08:58', size: '4.2 MB', duration: '0.8s' },
  { name: 'leaked_clip.mp4', score: 23, type: 'video', status: 'fail', date: '2026-11-18 23:41', size: '89 MB', duration: '1.9s' },
  { name: 'passport_scan.jpg', score: 91, type: 'image', status: 'pass', date: '2026-11-18 20:03', size: '1.8 MB', duration: '0.6s' },
  { name: 'body_cam_01.mp4', score: 61, type: 'video', status: 'warn', date: '2026-11-18 17:30', size: '210 MB', duration: '3.4s' },
  { name: 'evidence_img3.jpg', score: 99, type: 'image', status: 'pass', date: '2026-11-17 14:11', size: '6.1 MB', duration: '0.9s' },
  { name: 'ai_generated.png', score: 11, type: 'image', status: 'fail', date: '2026-11-17 10:52', size: '2.3 MB', duration: '0.7s' },
];

const statusMeta: Record<string, { icon: typeof CheckCircle2; color: string; badge: string; label: string }> = {
  pass: { icon: CheckCircle2, color: 'text-emerald-400', badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', label: 'Authentic' },
  warn: { icon: AlertTriangle, color: 'text-amber-400', badge: 'bg-amber-500/10 text-amber-400 border-amber-500/20', label: 'Suspicious' },
  fail: { icon: XCircle, color: 'text-rose-400', badge: 'bg-rose-500/10 text-rose-400 border-rose-500/20', label: 'Manipulated' },
};

export default function HistoryPage() {
  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-screen-xl mx-auto p-6 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
              <Clock className="w-5 h-5 text-teal-400" /> Scan History
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">{history.length} records · Last 48 hours</p>
          </div>
          <div className="flex gap-2">
            <button className="flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-700 hover:border-slate-600 text-slate-400 hover:text-slate-200 text-xs font-medium transition-all">
              <Filter className="w-3.5 h-3.5" /> Filter
            </button>
            <button className="flex items-center gap-2 px-3 py-2 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30 text-indigo-400 hover:text-indigo-300 text-xs font-medium transition-all">
              <Download className="w-3.5 h-3.5" /> Export CSV
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="bg-slate-900/40 border border-slate-800 rounded-2xl overflow-hidden">
          <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_auto] gap-4 px-5 py-3 border-b border-slate-800 text-xs text-slate-500 font-semibold uppercase tracking-wider">
            <span>File</span>
            <span>Trust Score</span>
            <span>Verdict</span>
            <span>Analysis Time</span>
            <span>Date</span>
            <span />
          </div>
          {history.map((item, i) => {
            const meta = statusMeta[item.status];
            return (
              <div
                key={item.name + i}
                className={cn(
                  'grid grid-cols-[2fr_1fr_1fr_1fr_1fr_auto] gap-4 px-5 py-4 items-center hover:bg-slate-800/30 transition-colors',
                  i < history.length - 1 && 'border-b border-slate-800/60'
                )}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="p-1.5 rounded-lg bg-slate-800">
                    {item.type === 'video' ? <Video className="w-3.5 h-3.5 text-slate-400" /> : <Image className="w-3.5 h-3.5 text-slate-400" />}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm text-slate-200 font-medium truncate">{item.name}</p>
                    <p className="text-xs text-slate-500">{item.size}</p>
                  </div>
                </div>
                <div className={cn('text-sm font-bold', item.score >= 80 ? 'text-emerald-400' : item.score >= 50 ? 'text-amber-400' : 'text-rose-400')}>
                  {item.score}%
                </div>
                <div>
                  <span className={cn('text-xs px-2.5 py-1 rounded-full border font-medium flex items-center gap-1 w-fit', meta.badge)}>
                    <meta.icon className="w-3 h-3" />
                    {meta.label}
                  </span>
                </div>
                <span className="text-xs text-slate-400 font-mono">{item.duration}</span>
                <span className="text-xs text-slate-500">{item.date}</span>
                <button className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-500 hover:text-slate-200 transition-colors" aria-label="View report">
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function ReportsPage() {
  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-screen-xl mx-auto p-6 space-y-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
              <FileBarChart2 className="w-5 h-5 text-violet-400" /> Reports
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">Auto-generated forensic reports</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {history.filter(h => h.status !== 'pass').map((item, i) => {
            const meta = statusMeta[item.status];
            return (
              <div key={i} className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition-all group cursor-pointer">
                <div className="flex items-start justify-between mb-4">
                  <div className={cn('p-2 rounded-xl border', meta.badge)}>
                    <ScanLine className="w-4 h-4" />
                  </div>
                  <span className={cn('text-xs px-2 py-1 rounded-full border font-medium', meta.badge)}>{meta.label}</span>
                </div>
                <h3 className="text-sm font-semibold text-slate-200 truncate mb-1 group-hover:text-white transition-colors">{item.name}</h3>
                <p className="text-xs text-slate-500 mb-4">{item.date}</p>
                <div className="flex items-center justify-between">
                  <span className={cn('text-lg font-black', item.score >= 80 ? 'text-emerald-400' : item.score >= 50 ? 'text-amber-400' : 'text-rose-400')}>
                    {item.score}%
                  </span>
                  <button className="flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 font-medium transition-colors">
                    <Download className="w-3 h-3" /> Download
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
