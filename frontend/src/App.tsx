import { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import SplashPage from './pages/SplashPage';
import Dashboard from './pages/Dashboard';
import AppHeader, { type Page } from './components/AppHeader';
import TeamSection from './components/TeamSection';
import CookieBanner from './components/CookieBanner';
import CinematicLoader from './components/CinematicLoader';
import MatrixBackground from './components/MatrixBackground';
import Aurora from './components/Aurora';
import SmoothCursor from './components/SmoothCursor';
import SmoothScroll from './components/SmoothScroll';
import { ScanLine, Settings, Shield, Github } from 'lucide-react';

// Code Splitting (FCP/LCP Optimization)
const ComparePage = lazy(() => import('./pages/ComparePage'));
const TemporalVideoPage = lazy(() => import('./pages/TemporalVideoPage'));
const VoiceAudioPage = lazy(() => import('./pages/VoiceAudioPage'));
const ThreatIntelPage = lazy(() => import('./pages/ThreatIntelPage'));
const HistoryPage = lazy(() => import('./pages/OtherPages').then((m) => ({ default: m.default })));
const ReportsPage = lazy(() => import('./pages/OtherPages').then((m) => ({ default: m.ReportsPage })));
const PrivacyPolicyPage = lazy(() => import('./pages/PrivacyPolicyPage'));
const TermsPage = lazy(() => import('./pages/TermsPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));
const PagesHub = lazy(() => import('./pages/PagesHub'));

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
  if (path === '/compare' || path === '/pages/compare') {
    return { view: 'app', page: 'compare' };
  }
  if (path === '/video' || path === '/pages/video') {
    return { view: 'app', page: 'video' };
  }
  if (path === '/audio' || path === '/pages/audio') {
    return { view: 'app', page: 'audio' };
  }
  if (path === '/threat-intel' || path === '/threats' || path === '/intel' || path === '/pages/threat-intel') {
    return { view: 'app', page: 'threat-intel' };
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
  if (path === '/team' || path === '/pages/team') {
    return { view: 'app', page: 'team' };
  }
  
  return { view: 'app', page: 'not-found' };
}

export default function App() {
  const initial = resolveRouteFromPath(window.location.pathname);
  const [view, setView] = useState<View>(initial.view);
  const [page, setPage] = useState<Page>(initial.page);
  const [isCinematicLoading, setIsCinematicLoading] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('skipIntro') === 'true') return false;
    }
    return true;
  });

  const replayCinematic = useCallback(() => {
    setIsCinematicLoading(true);
  }, []);

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
    <>
      {/* Persistent Global Aurora Background (React Bits @react-bits/Aurora-JS-CSS) */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <Aurora
          colorStops={['#00FF41', '#00D9FF', '#0A1422']}
          blend={0.6}
          amplitude={1.1}
          speed={0.65}
          opacity={0.65}
          mouseInteraction={false}
        />
      </div>

      {/* Persistent Global Vanta.js NET Matrix Layer (Fixed at z-0, persists across all pages) */}
      <MatrixBackground />

      {isCinematicLoading && (
        <CinematicLoader onComplete={() => setIsCinematicLoading(false)} />
      )}

      <SmoothScroll>
        {/* 120Hz iOS Fluid Cursor */}
        <SmoothCursor />

        <div className="content-layer">
          {view === 'splash' ? (
            <SplashPage
              onEnter={() => navigateTo('dashboard')}
              onReplayCinematic={replayCinematic}
              onNavigate={navigateTo}
            />
          ) : (
            <div className="min-h-screen bg-slate-950/60 text-slate-100 flex flex-col font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
              {/* Top Application Header */}
              <AppHeader
                activePage={page}
                onNavigate={navigateTo}
                onGoHome={goHome}
              />

          {/* Main Page Routing */}
          <div className="flex-1 flex flex-col min-h-0">
            <Suspense fallback={
              <div className="flex-1 flex items-center justify-center p-12 text-cyan-400 font-mono text-sm">
                <div className="flex items-center gap-3">
                  <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
                  <span>INITIALIZING FORENSIC SUBSYSTEM...</span>
                </div>
              </div>
            }>
              {page === 'dashboard' && <Dashboard />}

              {page === 'compare' && <ComparePage />}
              {page === 'video' && <TemporalVideoPage />}
              {page === 'audio' && <VoiceAudioPage />}
              {page === 'threat-intel' && <ThreatIntelPage />}

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
              {page === 'team' && (
                <div className="flex-1 p-4 sm:p-6 lg:p-8">
                  <TeamSection />
                </div>
              )}
              {page === 'privacy' && (
                <PrivacyPolicyPage
                  onBack={() => navigateTo('dashboard')}
                  onSwitchToTerms={() => navigateTo('terms')}
                />
              )}
              {page === 'terms' && (
                <TermsPage
                  onBack={() => navigateTo('dashboard')}
                  onSwitchToPrivacy={() => navigateTo('privacy')}
                />
              )}
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
            </Suspense>
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

          {/* Privacy & Zero-Disk Session Banner */}
          <CookieBanner onNavigate={navigateTo} />
        </div>
      )}
        </div>
      </SmoothScroll>
    </>
  );
}
