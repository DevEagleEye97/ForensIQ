import { useState, useEffect } from 'react';
import {
  ShieldCheck, LayoutDashboard, ScanLine, History,
  Bell, Search, Menu, X, ChevronDown,
  ExternalLink, FileBarChart2, Lock, Scale
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';

export type Page =
  | 'dashboard'
  | 'scans'
  | 'history'
  | 'reports'
  | 'settings'
  | 'privacy'
  | 'terms'
  | 'not-found';

interface AppHeaderProps {
  activePage: Page;
  onNavigate: (page: Page) => void;
  onGoHome: () => void;
}

const navItems = [
  { id: 'dashboard' as Page, label: 'Workbench', icon: LayoutDashboard },
  { id: 'history' as Page, label: 'Evidence Vault', icon: History },
  { id: 'reports' as Page, label: 'Dossiers', icon: FileBarChart2 },
  { id: 'scans' as Page, label: 'Live Telemetry', icon: ScanLine },
];

export default function AppHeader({ activePage, onNavigate, onGoHome }: AppHeaderProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [backendOnline, setBackendOnline] = useState<boolean | null>(null);

  useEffect(() => {
    fetch('/health')
      .then((r) => r.json())
      .then((data) => {
        setBackendOnline(data.status === 'OPERATIONAL');
      })
      .catch(() => {
        setBackendOnline(false);
      });
  }, []);

  const notifications = [
    { title: 'Neural Model Synchronized', msg: 'Deep-Fake-Detector-v2 + Nemotron 3.5 active', time: 'Just now', critical: false },
    { title: 'Chain-of-Custody Attestation', msg: 'SQLite Evidence Vault hash integrity verified', time: '12m', critical: false },
    { title: 'High-Variance Ingestion Flagged', msg: 'Localized ELA compression differential >18%', time: '34m', critical: true },
  ];

  return (
    <>
      <header className="border-b border-slate-800 bg-slate-950/95 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-screen-xl mx-auto px-4 h-14 flex items-center justify-between gap-3">

          {/* Left: Brand Identity */}
          <div className="flex items-center gap-3">
            <button
              onClick={onGoHome}
              className="flex items-center gap-2.5 flex-shrink-0 group min-h-[44px] px-1 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 rounded-xl"
              aria-label="ForensIQ Home"
            >
              <div className="p-1.5 bg-indigo-600/20 text-indigo-400 rounded-lg border border-indigo-500/30 group-hover:bg-indigo-600/30 transition-colors">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div className="text-left">
                <span className="text-base font-black tracking-tight bg-gradient-to-r from-indigo-400 via-sky-300 to-teal-300 bg-clip-text text-transparent font-mono">
                  ForensIQ
                </span>
                <span className="text-[9px] text-slate-500 font-mono block -mt-1 hidden sm:block">CYBER FORENSICS v2.0</span>
              </div>
            </button>

            <div className="h-6 w-px bg-slate-800 hidden lg:block" />

            <nav className="hidden lg:flex items-center gap-1" role="navigation" aria-label="Main navigation">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  className={cn(
                    'flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-all duration-150 min-h-[36px]',
                    activePage === item.id
                      ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  )}
                  aria-current={activePage === item.id ? 'page' : undefined}
                >
                  <item.icon className="w-3.5 h-3.5" />
                  {item.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-2">

            <button
              onClick={() => setSearchOpen((v) => !v)}
              className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label="Toggle search input"
            >
              <Search className="w-4 h-4" />
            </button>

            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono border">
              {backendOnline === null ? (
                <span className="text-slate-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-pulse" />
                  Syncing
                </span>
              ) : backendOnline ? (
                <span className="text-emerald-400 flex items-center gap-1 bg-emerald-500/5 px-1 rounded">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Engine Online
                </span>
              ) : (
                <span className="text-amber-400 flex items-center gap-1 bg-amber-500/5 px-1 rounded">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                  Engine Standby
                </span>
              )}
            </div>

            <div className="relative">
              <button
                onClick={() => {
                  setNotifOpen((v) => !v);
                  setUserMenuOpen(false);
                }}
                className="relative p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                aria-label="Notifications"
              >
                <Bell className="w-4 h-4" />
                <span className="absolute top-2.5 right-2.5 w-1.5 h-1.5 bg-rose-500 rounded-full" />
              </button>

              <AnimatePresence>
                {notifOpen && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -6 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -6 }}
                    className="absolute right-0 top-full mt-2 w-80 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl shadow-black/50 overflow-hidden z-50"
                  >
                    <div className="p-3 border-b border-slate-800 flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-200 font-mono">Telemetry Alerts</span>
                      <span className="text-[10px] text-indigo-400 hover:underline cursor-pointer">Acknowledge All</span>
                    </div>
                    <div className="divide-y divide-slate-800/60">
                      {notifications.map((n, i) => (
                        <div key={i} className="p-3 hover:bg-slate-800/50 transition-colors cursor-pointer">
                          <div className="flex items-start gap-2.5">
                            <div className={cn('w-2 h-2 rounded-full mt-1.5 flex-shrink-0', n.critical ? 'bg-rose-500' : 'bg-indigo-500')} />
                            <div className="min-w-0">
                              <p className="text-xs font-semibold text-slate-200 truncate">{n.title}</p>
                              <p className="text-[11px] text-slate-400 leading-tight mt-0.5">{n.msg}</p>
                              <p className="text-[9px] text-slate-500 font-mono mt-1">{n.time}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="relative">
              <button
                onClick={() => {
                  setUserMenuOpen((v) => !v);
                  setNotifOpen(false);
                }}
                className="flex items-center gap-1.5 pl-2 pr-1 py-1 rounded-xl hover:bg-slate-800/60 transition-colors min-h-[44px]"
                aria-label="User navigation menu"
              >
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-sky-500 flex items-center justify-center text-xs font-bold text-white font-mono shadow-sm">
                  IQ
                </div>
                <ChevronDown className={cn('w-3 h-3 text-slate-400 transition-transform hidden sm:block', userMenuOpen && 'rotate-180')} />
              </button>

              <AnimatePresence>
                {userMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -6 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -6 }}
                    className="absolute right-0 top-full mt-2 w-56 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl shadow-black/50 overflow-hidden z-50 text-xs"
                  >
                    <div className="p-3 border-b border-slate-800">
                      <p className="font-semibold text-slate-100 font-mono">Special Agent</p>
                      <p className="text-[11px] text-slate-400 font-mono">investigator@forensiq.ai</p>
                    </div>

                    <div className="p-1.5 space-y-0.5 font-mono">
                      <button
                        onClick={() => {
                          onNavigate('privacy');
                          setUserMenuOpen(false);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition-colors text-left"
                      >
                        <Lock className="w-3.5 h-3.5 text-indigo-400" />
                        Privacy Protocol
                      </button>

                      <button
                        onClick={() => {
                          onNavigate('terms');
                          setUserMenuOpen(false);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition-colors text-left"
                      >
                        <Scale className="w-3.5 h-3.5 text-teal-400" />
                        Evidence Terms
                      </button>

                      <a
                        href="/docs"
                        target="_blank"
                        rel="noreferrer"
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition-colors text-left"
                      >
                        <ExternalLink className="w-3.5 h-3.5 text-sky-400" />
                        FastAPI Swagger Docs
                      </a>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <button
              onClick={() => setMobileOpen((v) => !v)}
              className="lg:hidden p-2.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label="Toggle navigation drawer"
            >
              {mobileOpen ? <X className="w-5 h-5 text-indigo-400" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        <AnimatePresence>
          {searchOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="border-t border-slate-800 overflow-hidden bg-slate-900/90"
            >
              <div className="max-w-screen-xl mx-auto px-4 py-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    autoFocus
                    placeholder="Search SHA-256 hash, evidence filename, or case ID..."
                    className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="lg:hidden border-t border-slate-800 overflow-hidden bg-slate-950/98 backdrop-blur-2xl"
            >
              <nav className="p-4 space-y-1 font-mono text-xs">
                {navItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      onNavigate(item.id);
                      setMobileOpen(false);
                    }}
                    className={cn(
                      'w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all min-h-[44px]',
                      activePage === item.id
                        ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                    )}
                  >
                    <item.icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </button>
                ))}

                <div className="pt-2 border-t border-slate-800/80 my-2 space-y-1">
                  <button
                    onClick={() => {
                      onNavigate('privacy');
                      setMobileOpen(false);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-900 min-h-[44px]"
                  >
                    <Lock className="w-4 h-4 text-indigo-400" />
                    <span>Privacy Protocol</span>
                  </button>

                  <button
                    onClick={() => {
                      onNavigate('terms');
                      setMobileOpen(false);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-900 min-h-[44px]"
                  >
                    <Scale className="w-4 h-4 text-teal-400" />
                    <span>Evidence Terms</span>
                  </button>
                </div>
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </header>
    </>
  );
}
