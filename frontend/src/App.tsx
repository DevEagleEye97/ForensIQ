import { useState } from 'react';
import SplashPage from './pages/SplashPage';
import Dashboard from './pages/Dashboard';
import AppHeader from './components/AppHeader';
import HistoryPage, { ReportsPage } from './pages/OtherPages';
import ForensicAnalysisPage from './pages/ForensicAnalysisPage';
import { ScanLine, Settings } from 'lucide-react';

type Page = 'dashboard' | 'scans' | 'history' | 'reports' | 'settings' | 'forensic-analysis';
type View = 'splash' | 'app';

export default function App() {
  const [view, setView] = useState<View>('splash');
  const [page, setPage] = useState<Page>('dashboard');

  if (view === 'splash') {
    return <SplashPage onEnter={() => setView('app')} />;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <AppHeader
        activePage={page}
        onNavigate={setPage}
        onGoHome={() => setView('splash')}
      />

      {page === 'dashboard' && <Dashboard />}
      {page === 'scans' && (
        <div className="flex-1 flex items-center justify-center text-slate-500 flex-col gap-3">
          <ScanLine className="w-10 h-10 text-slate-700" />
          <p className="text-sm">Live Scans — Coming Soon</p>
        </div>
      )}
      {page === 'history' && <HistoryPage />}
      {page === 'reports' && <ReportsPage />}
      {page === 'forensic-analysis' && <ForensicAnalysisPage />}
      {page === 'settings' && (
        <div className="flex-1 flex items-center justify-center text-slate-500 flex-col gap-3">
          <Settings className="w-10 h-10 text-slate-700" />
          <p className="text-sm">Settings — Coming Soon</p>
        </div>
      )}
    </div>
  );
}
