import { useState, useEffect, useCallback } from 'react';
import SplashPage from './pages/SplashPage';
import Dashboard from './pages/Dashboard';
import AppHeader, { type Page } from './components/AppHeader';
import HistoryPage, { ReportsPage } from './pages/OtherPages';
import PrivacyPolicyPage from './pages/PrivacyPolicyPage';
import TermsPage from './pages/TermsPage';
import NotFoundPage from './pages/NotFoundPage';
import PagesHub from './pages/PagesHub';
import SmoothCursor from './components/SmoothCursor';
import SmoothScroll from './components/SmoothScroll';
import { ScanLine, Settings, Shield, Github } from 'lucide-react';

type View = 'splash' | 'app';

function resolveRouteFromPath(rawPath: string): { view: View; page: Page } {
  const path = rawPath.toLowerCase().replace(/\/$/, '') || '/';
  
  if (path === '/' || path === '/splash') {
    return { view: 'splash', page: 'dashboard' };
  }
  if (path === '/pages' || path === '/pages/hub') {
    return { view: 'app', page: 'pages' };
  }
  if (path === '/dashboard' || path === '/pages/dashboard') {
    return { view: 'app', page: 'dashboard' };
  }
  if (path === '/history' || path === '/pages/history' || path === '/vault') {
    return { view: 'app', page: 'history' };
  }
  if (path === '/reports' || path === '/pages/reports') {
    return { view: 'app', page: 'reports' };
  }
  if (path === '/scans' || path === '/pages/scans') {
    return { view: 'app', page: 'scans' };
  }
  if (path === '/privacy' || path === '/pages/privacy') {
    return { view: 'app', page: 'privacy' };
  }
  if (path === '/terms' || path === '/pages/terms') {
    return { view: 'app', page: 'terms' };
  }
  if (path === '/settings' || path === '/pages/settings') {
    return { view: 'app', page: 'settings' };
  }
  
  return { view: 'app', page: 'not-found' };
}

export default function App() {
  const initial = resolveRouteFromPath(window.location.pathname);
  const [view, setView] = useState<View>(initial.view);
  const [page, setPage] = useState<Page>(initial.page);

  // Sync state with browser back/forward buttons
  useEffect(() => {
    const handlePopState = () => {
      const route = resolveRouteFromPath(window.location.pathname);
      setView(route.view);
      setPage(route.page);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigateTo = useCallback((targetPage: Page) => {
    setPage(targetPage);
    setView('app');
    const targetUrl = targetPage === 'dashboard' ? '/dashboard' : `/${targetPage}`;
    if (window.location.pathname !== targetUrl) {
      window.history.pushState(null, '', targetUrl);
    }
  }, []);

  const goHome = useCallback(() => {
    setView('splash');
    if (window.location.pathname !== '/') {
      window.history.pushState(null, '', '/');
    }
  }, []);

  return (
    <SmoothScroll>
      {/* 120Hz iOS Fluid Cursor */}
      <SmoothCursor />

      {view === 'splash' ? (
        <SplashPage onEnter={() => navigateTo('dashboard')} />
      ) : (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
          {/* Top Application Header */}
          <AppHeader
            activePage={page}
            onNavigate={navigateTo}
            onGoHome={goHome}
          />

          {/* Main Page Routing */}
          <div className="flex-1 flex flex-col min-h-0">
            {page === 'dashboard' && <Dashboard />}

            {page === 'pages' && (
              <PagesHub onNavigate={navigateTo} onGoHome={goHome} />
            )}

            {page === 'scans' && (
              <div className="flex-1 flex items-center justify-center text-slate-500 flex-col gap-3 p-6 text-center">
                <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-indigo-400">
                  <ScanLine className="w-10 h-10 animate-pulse" />
                </div>
                <h3 className="text-sm font-semibold text-slate-200 font-mono">Live Stream Analysis</h3>
                <p className="text-xs text-slate-500 max-w-sm font-mono">
                  RTP/RTSP ingestion interface armed. Connect frame grabber stream to initiate real-time inspection.
                </p>
              </div>
            )}

            {page === 'history' && <HistoryPage />}
            {page === 'reports' && <ReportsPage />}
            {page === 'privacy' && <PrivacyPolicyPage onBack={() => navigateTo('dashboard')} />}
            {page === 'terms' && <TermsPage onBack={() => navigateTo('dashboard')} />}
            {page === 'not-found' && (
              <NotFoundPage
                onGoHome={goHome}
                onNavigateToDashboard={() => navigateTo('dashboard')}
              />
            )}

            {page === 'settings' && (
              <div className="flex-1 flex items-center justify-center text-slate-500 flex-col gap-3 p-6 text-center">
                <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-slate-400">
                  <Settings className="w-10 h-10" />
                </div>
                <h3 className="text-sm font-semibold text-slate-200 font-mono">Platform Configuration</h3>
                <p className="text-xs text-slate-500 max-w-sm font-mono">
                  API keys and neural models are managed via environment variables (OpenRouter & Hugging Face).
                </p>
              </div>
            )}
          </div>

          {/* Global Tactical Footer */}
          <footer className="border-t border-slate-800/80 bg-slate-950/80 px-4 sm:px-6 py-4 text-xs text-slate-500 font-mono flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Shield className="w-3.5 h-3.5 text-cyan-400" />
              <span>ForensIQ Cyber Forensics Intelligence Platform v2.0</span>
            </div>

            <div className="flex items-center gap-4 text-[11px]">
              <button
                onClick={() => navigateTo('pages')}
                className="hover:text-cyan-300 transition-colors text-cyan-400"
              >
                Pages Hub
              </button>
              <span>·</span>
              <button
                onClick={() => navigateTo('privacy')}
                className="hover:text-slate-300 transition-colors"
              >
                Privacy Protocol
              </button>
              <span>·</span>
              <button
                onClick={() => navigateTo('terms')}
                className="hover:text-slate-300 transition-colors"
              >
                Terms of Analysis
              </button>
              <span>·</span>
              <button
                onClick={() => navigateTo('not-found')}
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
              <span>·</span>
              <a
                href="https://github.com/DevEagleEye97/ForensIQ"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-white transition-colors text-slate-400 flex items-center gap-1 group"
                title="GitHub Repository (DevEagleEye97/ForensIQ)"
              >
                <Github className="w-3.5 h-3.5 group-hover:text-white transition-colors" />
                GitHub
              </a>
            </div>
          </footer>
        </div>
      )}
    </SmoothScroll>
  );
}
