import { useState } from 'react';
import SplashPage from './pages/SplashPage';
import Dashboard from './pages/Dashboard';
import AppHeader, { type Page } from './components/AppHeader';
import HistoryPage, { ReportsPage } from './pages/OtherPages';
import ForensicAnalysisPage from './pages/ForensicAnalysisPage';
import PrivacyPolicyPage from './pages/PrivacyPolicyPage';
import TermsPage from './pages/TermsPage';
import NotFoundPage from './pages/NotFoundPage';
import { ScanLine, Settings, Shield } from 'lucide-react';

type View = 'splash' | 'app';

export default function App() {
  const [view, setView] = useState<View>('splash');
  const [page, setPage] = useState<Page>('dashboard');

  if (view === 'splash') {
    return <SplashPage onEnter={() => setView('app')} />;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500/30 selection:text-indigo-200">
      {/* Top Application Header */}
      <AppHeader
        activePage={page}
        onNavigate={setPage}
        onGoHome={() => setView('splash')}
      />

      {/* Main Page Routing */}
      <div className="flex-1 flex flex-col min-h-0">
        {page === 'dashboard' && <Dashboard />}

        {page === 'scans' && (
          <div className="flex-1 flex items-center justify-center text-slate-500 flex-col gap-3 p-6 text-center">
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-indigo-400">
              <ScanLine className="w-10 h-10 animate-pulse" />
            </div>
            <h3 className="text-sm font-semibold text-slate-200 font-mono">Live Video Stream Ingestion Node</h3>
            <p className="text-xs text-slate-500 max-w-sm">
              Real-time RTP/RTSP stream anomaly scanning node is running in background daemon mode.
            </p>
          </div>
        )}

        {page === 'history' && <HistoryPage />}
        {page === 'reports' && <ReportsPage />}
        {page === 'forensic-analysis' && <ForensicAnalysisPage />}
        {page === 'privacy' && <PrivacyPolicyPage onBack={() => setPage('dashboard')} />}
        {page === 'terms' && <TermsPage onBack={() => setPage('dashboard')} />}
        {page === 'not-found' && (
          <NotFoundPage
            onGoHome={() => setView('splash')}
            onNavigateToDashboard={() => setPage('dashboard')}
          />
        )}

        {page === 'settings' && (
          <div className="flex-1 flex items-center justify-center text-slate-500 flex-col gap-3 p-6 text-center">
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-slate-400">
              <Settings className="w-10 h-10" />
            </div>
            <h3 className="text-sm font-semibold text-slate-200 font-mono">Platform Configuration</h3>
            <p className="text-xs text-slate-500 max-w-sm">
              System parameters, local SQLite retention windows, and external Hugging Face &amp; OpenRouter fallback thresholds.
            </p>
          </div>
        )}
      </div>

      {/* Global Tactical Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950/80 px-4 sm:px-6 py-4 text-xs text-slate-500 font-mono flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Shield className="w-3.5 h-3.5 text-indigo-400" />
          <span>ForensIQ Cyber Forensics Intelligence Platform v2.0</span>
        </div>

        <div className="flex items-center gap-4 text-[11px]">
          <button
            onClick={() => setPage('privacy')}
            className="hover:text-slate-300 transition-colors"
          >
            Privacy Protocol
          </button>
          <span>·</span>
          <button
            onClick={() => setPage('terms')}
            className="hover:text-slate-300 transition-colors"
          >
            Terms of Analysis
          </button>
          <span>·</span>
          <button
            onClick={() => setPage('not-found')}
            className="hover:text-slate-300 transition-colors text-slate-600"
            title="Preview 404 Page"
          >
            404 View
          </button>
          <span>·</span>
          <a
            href="/docs"
            target="_blank"
            rel="noreferrer"
            className="hover:text-slate-300 transition-colors text-indigo-400"
          >
            API Docs
          </a>
        </div>
      </footer>
    </div>
  );
}
