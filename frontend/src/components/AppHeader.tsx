import { useState } from 'react';
import {
  ShieldCheck, LayoutDashboard, ScanLine, History,
  Settings, Bell, Search, Menu, X, ChevronDown,
  Zap, User, LogOut, HelpCircle, Moon, ExternalLink,
  FileBarChart2, Database, Radio, Microscope
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';

type Page = 'dashboard' | 'scans' | 'history' | 'reports' | 'settings' | 'forensic-analysis';

interface AppHeaderProps {
  activePage: Page;
  onNavigate: (page: Page) => void;
  onGoHome: () => void;
}

const navItems = [
  { id: 'dashboard' as Page, label: 'Dashboard', icon: LayoutDashboard },
  { id: 'scans' as Page, label: 'Live Scans', icon: ScanLine },
  { id: 'history' as Page, label: 'History', icon: History },
  { id: 'reports' as Page, label: 'Reports', icon: FileBarChart2 },
  { id: 'forensic-analysis' as Page, label: 'Case Analysis', icon: Microscope },
  { id: 'settings' as Page, label: 'Settings', icon: Settings },
];

export default function AppHeader({ activePage, onNavigate, onGoHome }: AppHeaderProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  const notifications = [
    { title: 'Deepfake Detected', msg: 'suspect_clip.mp4 flagged with 94% confidence', time: '2m', critical: true },
    { title: 'Scan Complete', msg: 'press_conference.mp4 analysis finished', time: '8m', critical: false },
    { title: 'DB Updated', msg: 'GAN fingerprint database refreshed (v3.14)', time: '1h', critical: false },
  ];

  return (
    <>
      {/* Main Header */}
      <header className="border-b border-slate-800 bg-slate-950/90 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-screen-xl mx-auto px-4 h-14 flex items-center gap-4">
          {/* Logo */}
          <button
            onClick={onGoHome}
            className="flex items-center gap-2.5 flex-shrink-0 group"
            aria-label="Go to home"
          >
            <div className="p-1.5 bg-indigo-600/20 text-indigo-400 rounded-lg border border-indigo-500/30 group-hover:bg-indigo-600/30 transition-colors">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div className="hidden sm:block">
              <span className="text-base font-black tracking-tight bg-gradient-to-r from-indigo-400 via-sky-300 to-teal-300 bg-clip-text text-transparent">
                ForensIQ
              </span>
            </div>
          </button>

          {/* Divider */}
          <div className="h-6 w-px bg-slate-800 hidden md:block" />

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1 flex-1" role="navigation" aria-label="Main navigation">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={cn(
                  'flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-150',
                  activePage === item.id
                    ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                )}
                aria-current={activePage === item.id ? 'page' : undefined}
              >
                <item.icon className="w-3.5 h-3.5" />
                {item.label}
              </button>
            ))}
          </nav>

          {/* Right Controls */}
          <div className="flex items-center gap-2 ml-auto">
            {/* Search */}
            <button
              onClick={() => setSearchOpen(v => !v)}
              className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition-colors"
              aria-label="Search"
            >
              <Search className="w-4 h-4" />
            </button>

            {/* Status Badge */}
            <span className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Online
            </span>

            {/* Notifications */}
            <div className="relative">
              <button
                onClick={() => { setNotifOpen(v => !v); setUserMenuOpen(false); }}
                className="relative p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition-colors"
                aria-label="Notifications"
              >
                <Bell className="w-4 h-4" />
                <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-rose-500 rounded-full" />
              </button>

              <AnimatePresence>
                {notifOpen && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -6 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -6 }}
                    className="absolute right-0 top-full mt-2 w-80 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl shadow-black/40 overflow-hidden z-50"
                  >
                    <div className="p-4 border-b border-slate-800 flex items-center justify-between">
                      <span className="text-sm font-semibold text-slate-200">Notifications</span>
                      <span className="text-xs text-indigo-400 hover:text-indigo-300 cursor-pointer">Mark all read</span>
                    </div>
                    {notifications.map((n, i) => (
                      <div key={i} className={cn('p-4 hover:bg-slate-800/50 cursor-pointer transition-colors', i < notifications.length - 1 && 'border-b border-slate-800/60')}>
                        <div className="flex items-start gap-3">
                          <div className={cn('w-2 h-2 rounded-full mt-1.5 flex-shrink-0', n.critical ? 'bg-rose-500' : 'bg-indigo-500')} />
                          <div>
                            <p className="text-xs font-semibold text-slate-200">{n.title}</p>
                            <p className="text-xs text-slate-400 mt-0.5">{n.msg}</p>
                            <p className="text-[10px] text-slate-600 mt-1">{n.time} ago</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* User Menu */}
            <div className="relative">
              <button
                onClick={() => { setUserMenuOpen(v => !v); setNotifOpen(false); }}
                className="flex items-center gap-2 pl-2 pr-1 py-1 rounded-xl hover:bg-slate-800/60 transition-colors"
                aria-label="User menu"
              >
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-sky-500 flex items-center justify-center text-xs font-bold text-white">
                  D
                </div>
                <ChevronDown className={cn('w-3 h-3 text-slate-400 transition-transform hidden sm:block', userMenuOpen && 'rotate-180')} />
              </button>

              <AnimatePresence>
                {userMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -6 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -6 }}
                    className="absolute right-0 top-full mt-2 w-56 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl shadow-black/40 overflow-hidden z-50"
                  >
                    <div className="p-3 border-b border-slate-800">
                      <p className="text-sm font-semibold text-slate-100">Disha</p>
                      <p className="text-xs text-slate-400">disha@forensiq.ai</p>
                    </div>
                    <div className="p-1.5">
                      {[
                        { icon: User, label: 'Profile' },
                        { icon: Zap, label: 'API Keys' },
                        { icon: Moon, label: 'Appearance' },
                        { icon: HelpCircle, label: 'Help & Docs', external: true },
                      ].map((item) => (
                        <button key={item.label} className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 text-sm transition-colors">
                          <item.icon className="w-4 h-4" />
                          {item.label}
                          {item.external && <ExternalLink className="w-3 h-3 ml-auto opacity-50" />}
                        </button>
                      ))}
                    </div>
                    <div className="p-1.5 border-t border-slate-800">
                      <button className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-rose-500/10 text-slate-400 hover:text-rose-400 text-sm transition-colors">
                        <LogOut className="w-4 h-4" />
                        Sign Out
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileOpen(v => !v)}
              className="md:hidden p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <AnimatePresence>
          {searchOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="border-t border-slate-800 overflow-hidden"
            >
              <div className="max-w-screen-xl mx-auto px-4 py-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    autoFocus
                    placeholder="Search scans, reports, files…"
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/30"
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Mobile Nav Drawer */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="md:hidden border-t border-slate-800 overflow-hidden"
            >
              <nav className="p-3 space-y-1">
                {navItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => { onNavigate(item.id); setMobileOpen(false); }}
                    className={cn(
                      'w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all',
                      activePage === item.id
                        ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/20'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                    )}
                  >
                    <item.icon className="w-4 h-4" />
                    {item.label}
                  </button>
                ))}
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Secondary breadcrumb / context strip for certain pages */}
      <div className="border-b border-slate-800/40 bg-slate-900/20 px-4 py-2 flex items-center justify-between gap-4 text-xs text-slate-500 overflow-x-auto">
        <div className="flex items-center gap-4 flex-shrink-0">
          <span className="flex items-center gap-1.5">
            <Database className="w-3.5 h-3.5 text-sky-500" />
            GAN DB v3.14
          </span>
          <span className="flex items-center gap-1.5">
            <Radio className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
            Live Feed Active
          </span>
        </div>
        <div className="flex-shrink-0 text-slate-600">
          Last sync: just now
        </div>
      </div>
    </>
  );
}
