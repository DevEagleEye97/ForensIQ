import { useState, useEffect } from 'react';
import {
  Clock, FileBarChart2, AlertTriangle,
  CheckCircle2, XCircle, Image as ImageIcon, Download,
  ArrowUpRight, Search, Inbox, ScanLine,
  FileText, RefreshCw
} from 'lucide-react';
import { cn } from '../lib/utils';

export interface VaultRecord {
  case_id: string;
  file_name: string;
  file_hash: string;
  file_size_bytes: number;
  mime_type: string;
  tamper_probability: number;
  verdict: string;
  classification_model: string;
  exif_software: string | null;
  camera_make: string | null;
  anomalies: string[];
  ela_base64_preview: string | null;
  timestamp_utc: string | null;
}

const statusMeta: Record<string, { icon: typeof CheckCircle2; color: string; badge: string; label: string }> = {
  'Likely Authentic': { icon: CheckCircle2, color: 'text-emerald-400', badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', label: 'Authentic' },
  'Spliced / Edited': { icon: AlertTriangle, color: 'text-amber-400', badge: 'bg-amber-500/10 text-amber-400 border-amber-500/20', label: 'Suspicious' },
  'Likely AI-Generated': { icon: XCircle, color: 'text-rose-400', badge: 'bg-rose-500/10 text-rose-400 border-rose-500/20', label: 'Manipulated' },
};

function formatSize(bytes: number): string {
  const mb = bytes / (1024 * 1024);
  if (mb >= 1) return `${mb.toFixed(1)} MB`;
  const kb = bytes / 1024;
  return `${kb.toFixed(0)} KB`;
}

function formatDate(iso: string | null): string {
  if (!iso) return 'Unknown';
  const d = new Date(iso);
  return d.toISOString().slice(0, 16).replace('T', ' ');
}

export default function HistoryPage() {
  const [records, setRecords] = useState<VaultRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'Likely Authentic' | 'Spliced / Edited' | 'Likely AI-Generated'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    async function fetchVault() {
      try {
        const res = await fetch('/api/vault?limit=100&offset=0');
        if (res.ok) {
          const data = await res.json();
          setRecords(data.items || []);
        }
      } catch (err) {
        console.error('[HistoryPage] Failed to fetch vault:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchVault();
  }, []);

  const filtered = records.filter((item) => {
    const matchesFilter = filter === 'all' || item.verdict === filter;
    const matchesSearch = item.file_name.toLowerCase().includes(searchQuery.toLowerCase()) || item.file_hash.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const exportCSV = () => {
    const headers = 'Case ID,File Name,SHA256,Size,Type,Verdict,Tamper Probability,Timestamp\n';
    const rows = filtered
      .map(
        (i) =>
          `"${i.case_id}","${i.file_name}","${i.file_hash}","${formatSize(i.file_size_bytes)}","${i.mime_type}","${i.verdict}",${i.tamper_probability}%,"${formatDate(i.timestamp_utc)}"`
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
              {filtered.length} of {records.length} cryptographic records indexed
            </p>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={exportCSV}
              disabled={filtered.length === 0}
              className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30 text-indigo-300 text-xs font-mono font-medium transition-all min-h-[44px] flex-1 sm:flex-initial disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="w-3.5 h-3.5" /> Export Ledger CSV
            </button>
            <button
              onClick={() => { setLoading(true); fetch('/api/vault?limit=100&offset=0').then(r => r.json()).then(d => { setRecords(d.items || []); setLoading(false); }); }}
              disabled={loading}
              className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800/50 hover:bg-slate-800 border border-slate-700 text-slate-300 text-xs font-mono font-medium transition-all min-h-[44px] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw className={cn('w-3.5 h-3.5', loading && 'animate-spin')} /> Refresh
            </button>
          </div>
        </div>

        {/* Filters and Search Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 rounded-2xl bg-slate-900/40 border border-slate-800">
          {/* Status Pills */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            {(['all', 'Likely Authentic', 'Spliced / Edited', 'Likely AI-Generated'] as const).map((tab) => (
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
                {tab === 'all' ? 'All Records' : tab === 'Likely Authentic' ? 'Authentic' : tab === 'Spliced / Edited' ? 'Suspicious' : 'Manipulated'}
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
        {loading ? (
          <div className="p-12 text-center rounded-2xl bg-slate-900/30 border border-slate-800/80 space-y-3">
            <div className="p-3 bg-slate-800/60 rounded-full w-fit mx-auto text-slate-500 animate-pulse">
              <ScanLine className="w-8 h-8" />
            </div>
            <p className="text-xs text-slate-400">Fetching cryptographic ledger...</p>
          </div>
        ) : filtered.length === 0 ? (
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
              <span>Size</span>
              <span>Timestamp</span>
              <span className="w-8" />
            </div>

            {/* Rows */}
            <div className="divide-y divide-slate-800/60">
              {filtered.map((item) => {
                const meta = statusMeta[item.verdict] || statusMeta['Likely Authentic'];
                return (
                  <div
                    key={item.case_id}
                    className="p-4 sm:px-5 sm:py-4 flex flex-col md:grid md:grid-cols-[2fr_1fr_1fr_1fr_1fr_auto] gap-3 md:gap-4 items-start md:items-center hover:bg-slate-800/20 transition-colors"
                  >
                    {/* File & Type */}
                    <div className="flex items-center gap-3 min-w-0 w-full md:w-auto">
                      <div className="p-2 rounded-xl bg-slate-800 border border-slate-700/60 flex-shrink-0">
                        <ImageIcon className="w-4 h-4 text-indigo-400" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs sm:text-sm text-slate-200 font-semibold truncate">{item.file_name}</p>
                        <p className="text-[10px] text-slate-500 font-mono truncate" title={item.file_hash}>
                          SHA256: {item.file_hash.slice(0, 16)}...
                        </p>
                      </div>
                    </div>

                    {/* Authenticity Score */}
                    <div className="flex items-center justify-between w-full md:w-auto">
                      <span className="text-[10px] text-slate-500 font-mono md:hidden">Score:</span>
                      <span
                        className={cn(
                          'text-sm font-bold font-mono',
                          item.tamper_probability <= 35 ? 'text-emerald-400' : item.tamper_probability <= 65 ? 'text-amber-400' : 'text-rose-400'
                        )}
                      >
                        {100 - item.tamper_probability}%
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

                    {/* Size */}
                    <div className="flex items-center justify-between w-full md:w-auto text-xs text-slate-400 font-mono">
                      <span className="text-[10px] text-slate-500 md:hidden">Size:</span>
                      <span>{formatSize(item.file_size_bytes)}</span>
                    </div>

                    {/* Date */}
                    <div className="flex items-center justify-between w-full md:w-auto text-xs text-slate-500 font-mono">
                      <span className="text-[10px] md:hidden">Ingested:</span>
                      <span>{formatDate(item.timestamp_utc)}</span>
                    </div>

                    {/* Action */}
                    <div className="w-full md:w-auto flex justify-end">
                      <a
                        href={`/api/report/${item.case_id}/export?format=markdown`}
                        download={`forensic_certificate_${item.case_id}.md`}
                        className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors min-h-[36px] flex items-center justify-center"
                        title="Export forensic certificate"
                        aria-label="Export certificate"
                      >
                        <ArrowUpRight className="w-4 h-4" />
                      </a>
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
  const [deepfakes, setDeepfakes] = useState<VaultRecord[]>([]);

  useEffect(() => {
    async function fetchReports() {
      try {
        const res = await fetch('/api/vault?limit=100&offset=0');
        if (res.ok) {
          const data = await res.json();
          const allRecords = data.items || [];
          setDeepfakes(allRecords.filter((h: VaultRecord) => h.verdict !== 'Likely Authentic'));
        }
      } catch (err) {
        console.error('[ReportsPage] Failed to fetch reports:', err);
      }
    }
    fetchReports();
  }, []);

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
              const meta = statusMeta[item.verdict] || statusMeta['Likely Authentic'];
              return (
                <div
                  key={item.case_id}
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
                        {item.file_name}
                      </h3>
                      <p className="text-[10px] text-slate-500 font-mono mt-0.5">{formatDate(item.timestamp_utc)} · {formatSize(item.file_size_bytes)}</p>
                    </div>

                    <div className="p-2.5 rounded-lg bg-black/40 border border-slate-800 text-[11px] font-mono text-slate-400">
                      <span>Ref SHA-256:</span>
                      <p className="text-slate-300 truncate">{item.file_hash}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
                    <div>
                      <span className="text-[10px] text-slate-500 font-mono uppercase block">Confidence</span>
                      <span
                        className={cn(
                          'text-base font-black font-mono',
                          item.tamper_probability >= 50 ? 'text-amber-400' : 'text-rose-400'
                        )}
                      >
                        {100 - item.tamper_probability}%
                      </span>
                    </div>

                    <a
                      href={`/api/report/${item.case_id}/export?format=markdown`}
                      download={`report_${item.case_id}.md`}
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