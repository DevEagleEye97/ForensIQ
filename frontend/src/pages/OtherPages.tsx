import { useState } from 'react';
import {
  Clock, FileBarChart2, AlertTriangle,
  CheckCircle2, XCircle, Image as ImageIcon, Video, Download,
  ArrowUpRight, Search, Inbox, ScanLine,
  FileText
} from 'lucide-react';
import { cn } from '../lib/utils';

export interface HistoryItem {
  id: string;
  name: string;
  score: number;
  type: 'image' | 'video';
  status: 'pass' | 'warn' | 'fail';
  date: string;
  size: string;
  duration: string;
  hash: string;
}

const initialHistory: HistoryItem[] = [
  { id: 'CASE-01', name: 'press_conference.mp4', score: 84, type: 'video', status: 'warn', date: '2026-11-19 09:12', size: '124 MB', duration: '2.1s', hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855' },
  { id: 'CASE-02', name: 'suspect_photo.jpg', score: 97, type: 'image', status: 'pass', date: '2026-11-19 08:58', size: '4.2 MB', duration: '0.8s', hash: '6a85913c93efcb598fbe3d272f39d12d9aea254b0e9e1982b682662c5b96c8a7' },
  { id: 'CASE-03', name: 'leaked_clip.mp4', score: 23, type: 'video', status: 'fail', date: '2026-11-18 23:41', size: '89 MB', duration: '1.9s', hash: '3d272f39d12d9aea254b6a85913c93efcb598fbe0e9e1982b682662c5b96c8a7' },
  { id: 'CASE-04', name: 'passport_scan.jpg', score: 91, type: 'image', status: 'pass', date: '2026-11-18 20:03', size: '1.8 MB', duration: '0.6s', hash: 'c4421b0e9e1982b682662c5b96c8a76a85913c93efcb598fbe3d272f39d12d9a' },
  { id: 'CASE-05', name: 'body_cam_01.mp4', score: 61, type: 'video', status: 'warn', date: '2026-11-18 17:30', size: '210 MB', duration: '3.4s', hash: 'f8c9053cef8f4a898a7eba45e21f43ef6a85913c93efcb598fbe3d272f39d12d' },
  { id: 'CASE-06', name: 'evidence_img3.jpg', score: 99, type: 'image', status: 'pass', date: '2026-11-17 14:11', size: '6.1 MB', duration: '0.9s', hash: '9f4ba46e69f375c4421b0e9e1982b682662c5b96c8a76a85913c93efcb598fbe' },
  { id: 'CASE-07', name: 'ai_generated_face.png', score: 11, type: 'image', status: 'fail', date: '2026-11-17 10:52', size: '2.3 MB', duration: '0.7s', hash: 'e69f3759f4ba46c4421b0e9e1982b682662c5b96c8a76a85913c93efcb598fbe' },
];

const statusMeta: Record<string, { icon: typeof CheckCircle2; color: string; badge: string; label: string }> = {
  pass: { icon: CheckCircle2, color: 'text-emerald-400', badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', label: 'Authentic' },
  warn: { icon: AlertTriangle, color: 'text-amber-400', badge: 'bg-amber-500/10 text-amber-400 border-amber-500/20', label: 'Suspicious' },
  fail: { icon: XCircle, color: 'text-rose-400', badge: 'bg-rose-500/10 text-rose-400 border-rose-500/20', label: 'Manipulated' },
};

export default function HistoryPage() {
  const [filter, setFilter] = useState<'all' | 'pass' | 'warn' | 'fail'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = initialHistory.filter((item) => {
    const matchesFilter = filter === 'all' || item.status === filter;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || item.hash.includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const exportCSV = () => {
    const headers = 'ID,Name,Type,Score,Status,Date,Size,SHA256\n';
    const rows = filtered
      .map(
        (i) =>
          `"${i.id}","${i.name}","${i.type}",${i.score},"${i.status}","${i.date}","${i.size}","${i.hash}"`
      )
      .join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `forensiq_ledger_export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex-1 overflow-y-auto bg-slate-950 text-slate-100 p-4 sm:p-6">
      <div className="max-w-screen-xl mx-auto space-y-6">

        {/* Header & Controls */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2 font-mono">
              <Clock className="w-5 h-5 text-teal-400" /> Evidence Vault Ledger
            </h2>
            <p className="text-xs text-slate-400 mt-0.5 font-mono">
              {filtered.length} of {initialHistory.length} cryptographic records indexed
            </p>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={exportCSV}
              className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30 text-indigo-300 text-xs font-mono font-medium transition-all min-h-[44px] flex-1 sm:flex-initial"
            >
              <Download className="w-3.5 h-3.5" /> Export Ledger CSV
            </button>
          </div>
        </div>

        {/* Filters and Search Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 rounded-2xl bg-slate-900/40 border border-slate-800">
          {/* Status Pills */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            {(['all', 'pass', 'warn', 'fail'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setFilter(tab)}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-all min-h-[36px] flex-shrink-0 capitalize',
                  filter === tab
                    ? 'bg-indigo-600 text-white shadow'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                )}
              >
                {tab === 'all' ? 'All Records' : tab === 'pass' ? 'Authentic' : tab === 'warn' ? 'Suspicious' : 'Manipulated'}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="relative min-w-[240px]">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search filename or SHA-256..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors min-h-[38px] font-mono"
            />
          </div>
        </div>

        {/* Ledger Table / Mobile Cards */}
        {filtered.length === 0 ? (
          /* Empty State */
          <div className="p-12 text-center rounded-2xl bg-slate-900/30 border border-slate-800/80 space-y-3">
            <div className="p-3 bg-slate-800/60 rounded-full w-fit mx-auto text-slate-500">
              <Inbox className="w-8 h-8" />
            </div>
            <h3 className="text-sm font-semibold text-slate-200">No Evidence Records Found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              No matching forensic ledger records correspond to your active search or verdict filter criteria.
            </p>
            <button
              onClick={() => {
                setFilter('all');
                setSearchQuery('');
              }}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono transition-colors"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="bg-slate-900/40 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            {/* Desktop Table Header */}
            <div className="hidden md:grid grid-cols-[2fr_1fr_1fr_1fr_1fr_auto] gap-4 px-5 py-3 border-b border-slate-800 text-[11px] text-slate-500 font-mono font-semibold uppercase tracking-wider">
              <span>Evidence File</span>
              <span>Authenticity</span>
              <span>Verdict</span>
              <span>Latency</span>
              <span>Timestamp</span>
              <span className="w-8" />
            </div>

            {/* Rows */}
            <div className="divide-y divide-slate-800/60">
              {filtered.map((item) => {
                const meta = statusMeta[item.status];
                return (
                  <div
                    key={item.id}
                    className="p-4 sm:px-5 sm:py-4 flex flex-col md:grid md:grid-cols-[2fr_1fr_1fr_1fr_1fr_auto] gap-3 md:gap-4 items-start md:items-center hover:bg-slate-800/20 transition-colors"
                  >
                    {/* File & Type */}
                    <div className="flex items-center gap-3 min-w-0 w-full md:w-auto">
                      <div className="p-2 rounded-xl bg-slate-800 border border-slate-700/60 flex-shrink-0">
                        {item.type === 'video' ? (
                          <Video className="w-4 h-4 text-indigo-400" />
                        ) : (
                          <ImageIcon className="w-4 h-4 text-indigo-400" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs sm:text-sm text-slate-200 font-semibold truncate">{item.name}</p>
                        <p className="text-[10px] text-slate-500 font-mono truncate" title={item.hash}>
                          SHA256: {item.hash.slice(0, 16)}...
                        </p>
                      </div>
                    </div>

                    {/* Authenticity Score */}
                    <div className="flex items-center justify-between w-full md:w-auto">
                      <span className="text-[10px] text-slate-500 font-mono md:hidden">Score:</span>
                      <span
                        className={cn(
                          'text-sm font-bold font-mono',
                          item.score >= 80 ? 'text-emerald-400' : item.score >= 50 ? 'text-amber-400' : 'text-rose-400'
                        )}
                      >
                        {item.score}%
                      </span>
                    </div>

                    {/* Verdict */}
                    <div className="flex items-center justify-between w-full md:w-auto">
                      <span className="text-[10px] text-slate-500 font-mono md:hidden">Verdict:</span>
                      <span className={cn('text-xs px-2.5 py-0.5 rounded-full border font-mono font-medium flex items-center gap-1', meta.badge)}>
                        <meta.icon className="w-3 h-3" />
                        {meta.label}
                      </span>
                    </div>

                    {/* Analysis Latency */}
                    <div className="flex items-center justify-between w-full md:w-auto text-xs text-slate-400 font-mono">
                      <span className="text-[10px] text-slate-500 md:hidden">Analysis Latency:</span>
                      <span>{item.duration}</span>
                    </div>

                    {/* Date */}
                    <div className="flex items-center justify-between w-full md:w-auto text-xs text-slate-500 font-mono">
                      <span className="text-[10px] md:hidden">Ingested:</span>
                      <span>{item.date}</span>
                    </div>

                    {/* Action */}
                    <div className="w-full md:w-auto flex justify-end">
                      <button
                        onClick={exportCSV}
                        className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors min-h-[36px]"
                        title="Export cryptographic record"
                        aria-label="Export record"
                      >
                        <ArrowUpRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

export function ReportsPage() {
  const deepfakes = initialHistory.filter((h) => h.status !== 'pass');

  return (
    <div className="flex-1 overflow-y-auto bg-slate-950 text-slate-100 p-4 sm:p-6">
      <div className="max-w-screen-xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2 font-mono">
              <FileBarChart2 className="w-5 h-5 text-violet-400" /> Forensic Incident Reports
            </h2>
            <p className="text-xs text-slate-400 mt-0.5 font-mono">
              Auto-generated cryptographic dossiers for verified anomalies
            </p>
          </div>
        </div>

        {deepfakes.length === 0 ? (
          /* Empty state */
          <div className="p-12 text-center rounded-2xl bg-slate-900/30 border border-slate-800/80 space-y-3">
            <div className="p-3 bg-slate-800/60 rounded-full w-fit mx-auto text-slate-500">
              <FileText className="w-8 h-8" />
            </div>
            <h3 className="text-sm font-semibold text-slate-200">No Incident Dossiers Active</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              All indexed cases have met authenticity thresholds. When anomalies or deepfakes are identified, exportable reports populate here.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {deepfakes.map((item) => {
              const meta = statusMeta[item.status];
              return (
                <div
                  key={item.id}
                  className="bg-slate-900/50 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition-all group flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div className={cn('p-2 rounded-xl border', meta.badge)}>
                        <ScanLine className="w-4 h-4" />
                      </div>
                      <span className={cn('text-xs px-2 py-0.5 rounded-full border font-mono font-medium', meta.badge)}>
                        {meta.label}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-sm font-semibold text-slate-200 truncate group-hover:text-white transition-colors">
                        {item.name}
                      </h3>
                      <p className="text-[10px] text-slate-500 font-mono mt-0.5">{item.date} · {item.size}</p>
                    </div>

                    <div className="p-2.5 rounded-lg bg-black/40 border border-slate-800 text-[11px] font-mono text-slate-400">
                      <span>Ref SHA-256:</span>
                      <p className="text-slate-300 truncate">{item.hash}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
                    <div>
                      <span className="text-[10px] text-slate-500 font-mono uppercase block">Confidence</span>
                      <span
                        className={cn(
                          'text-base font-black font-mono',
                          item.score >= 50 ? 'text-amber-400' : 'text-rose-400'
                        )}
                      >
                        {item.score}%
                      </span>
                    </div>

                    <a
                      href={`/api/report/${item.id}/export?format=markdown`}
                      download={`report_${item.id}.md`}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 text-xs font-mono transition-colors border border-indigo-500/20 min-h-[36px]"
                    >
                      <Download className="w-3.5 h-3.5" /> Certificate
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
}
