import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  ShieldCheck, ArrowRight, Upload, ChevronDown,
  Terminal, Activity, Layers, Sparkles, Github
} from 'lucide-react';
import MatrixRain from '../components/MatrixRain';
import CinematicTitle from '../components/CinematicTitle';
import type { Page } from '../components/AppHeader';
import {
  FORENSIC_TOOLS_10,
  ToolCard,
  ToolModal,
  type ForensicTool
} from '../components/ForensicToolsReference';

interface SplashPageProps {
  onEnter: () => void;
  onReplayCinematic?: () => void;
  onNavigate?: (page: Page) => void;
}

export default function SplashPage({ onEnter, onReplayCinematic, onNavigate }: SplashPageProps) {
  const [selectedTool, setSelectedTool] = useState<ForensicTool | null>(null);

  const leftTools = FORENSIC_TOOLS_10.slice(0, 5);
  const rightTools = FORENSIC_TOOLS_10.slice(5, 10);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 overflow-x-hidden selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Top Fixed HUD Navigation */}
      <nav className="fixed top-0 inset-x-0 z-50 border-b border-slate-800/80 bg-slate-950/85 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-cyan-600/20 text-cyan-400 rounded-lg border border-cyan-500/40 shadow-sm shadow-cyan-500/20">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-base font-black font-mono tracking-wider bg-gradient-to-r from-white via-cyan-200 to-indigo-300 bg-clip-text text-transparent">
                FORENSIQ
              </span>
              <span className="text-[10px] font-mono text-slate-400 tracking-tight">
                CYBER FORENSICS SUITE
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {onReplayCinematic && (
              <button
                onClick={onReplayCinematic}
                className="hidden lg:flex items-center gap-1.5 font-mono text-[11px] text-emerald-400 bg-emerald-950/40 hover:bg-emerald-900/60 px-3 py-1.5 rounded-full border border-emerald-500/40 transition-colors"
                title="Replay 4.5s Cyberpunk Matrix Cinematic Intro"
              >
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                <span>CINEMATIC INTRO</span>
              </button>
            )}

            {onNavigate && (
              <div className="hidden xl:flex items-center gap-2 font-mono text-[11px] text-slate-400">
                <button
                  onClick={() => onNavigate('privacy')}
                  className="hover:text-cyan-300 transition-colors"
                >
                  Privacy
                </button>
                <span>·</span>
                <button
                  onClick={() => onNavigate('terms')}
                  className="hover:text-cyan-300 transition-colors"
                >
                  Terms
                </button>
              </div>
            )}

            <div className="hidden md:flex items-center gap-2 font-mono text-[11px] text-slate-400 bg-slate-900/80 px-3 py-1.5 rounded-full border border-slate-800">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>10 ACTIVE ANALYTICAL ENGINES</span>
            </div>

            <a
              href="https://github.com/DevEagleEye97/ForensIQ"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-900 border border-slate-800 transition-colors flex items-center justify-center group"
              title="View on GitHub (DevEagleEye97/ForensIQ)"
              aria-label="GitHub Repository"
            >
              <Github className="w-4 h-4 text-slate-400 group-hover:text-white transition-colors" />
            </a>

            <button
              onClick={onEnter}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white text-xs font-mono font-bold uppercase tracking-wider transition-all duration-150 hover:shadow-lg hover:shadow-cyan-500/25 border border-cyan-400/30"
            >
              Launch Workbench
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </nav>

      {/* Main Cinematic Hero Arena */}
      <section className="relative pt-24 pb-16 px-4 sm:px-6 min-h-[92vh] flex flex-col justify-center overflow-hidden">
        {/* Full-width Tactical Grid Backdrop */}
        <div
          className="absolute inset-0 opacity-[0.04] pointer-events-none"
          style={{
            backgroundImage: `linear-gradient(rgba(56,189,248,1) 1px, transparent 1px), linear-gradient(90deg, rgba(56,189,248,1) 1px, transparent 1px)`,
            backgroundSize: '50px 50px',
          }}
        />

        {/* Ambient Glow Orbs */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] bg-cyan-900/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-10 left-10 w-96 h-96 bg-indigo-900/15 rounded-full blur-3xl pointer-events-none" />

        {/* 3-Column Tactical Layout: Left Matrix/Tools | Center Cinematic FORENSIQ | Right Matrix/Tools */}
        <div className="max-w-[1500px] mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-6 items-center z-10">
          
          {/* LEFT FLANK: 5 Matrix Streams + Tools 1 to 5 */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="hidden lg:flex lg:col-span-3 flex-col gap-3 relative rounded-2xl border border-slate-800/80 bg-slate-950/60 p-3.5 backdrop-blur-md shadow-2xl overflow-hidden group"
          >
            {/* 5-Column Matrix Stream Rain Backdrop */}
            <div className="absolute inset-0 opacity-25 group-hover:opacity-35 transition-opacity">
              <MatrixRain columns={5} color="rgba(56, 189, 248, 0.7)" speed={35} fontSize={12} />
            </div>

            {/* Left Header */}
            <div className="relative z-10 flex items-center justify-between border-b border-slate-800/80 pb-2 px-1">
              <div className="flex items-center gap-1.5 font-mono text-[11px] font-bold text-sky-400">
                <Layers className="w-3.5 h-3.5 text-sky-400" />
                <span>SPATIAL & FREQUENCY SUITE</span>
              </div>
              <span className="font-mono text-[9px] text-slate-500 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
                5 ENGINES
              </span>
            </div>

            {/* Left 5 Tool Cards */}
            <div className="relative z-10 flex flex-col gap-2">
              {leftTools.map((tool) => (
                <ToolCard
                  key={tool.id}
                  tool={tool}
                  onSelect={setSelectedTool}
                  selected={selectedTool?.id === tool.id}
                />
              ))}
            </div>

            <div className="relative z-10 pt-1 border-t border-slate-800/60 flex items-center justify-between text-[10px] font-mono text-slate-500 px-1">
              <span>MATRIX STREAM 01-05</span>
              <span className="text-emerald-400 flex items-center gap-1">
                <span className="w-1 h-1 rounded-full bg-emerald-400" /> SYNCED
              </span>
            </div>
          </motion.div>

          {/* CENTER STAGE: Cinematic Letter-by-Letter Opening */}
          <div className="lg:col-span-6 flex flex-col items-center justify-center text-center px-2 py-4">
            {/* The Cinematic "FORENSIQ" Letter Opening */}
            <CinematicTitle />

            {/* Tactical Action Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 1.3 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-8 w-full max-w-md"
            >
              <button
                onClick={onEnter}
                className="group w-full sm:w-auto flex-1 flex items-center justify-center gap-3 px-8 py-4 rounded-xl bg-gradient-to-r from-cyan-600 via-sky-600 to-indigo-600 hover:from-cyan-500 hover:via-sky-500 hover:to-indigo-500 text-white font-mono font-bold text-sm tracking-wider uppercase transition-all duration-200 shadow-xl shadow-cyan-600/30 hover:shadow-cyan-500/50 hover:-translate-y-0.5 border border-cyan-400/40"
              >
                <Upload className="w-4 h-4 group-hover:scale-110 transition-transform text-cyan-200" />
                Initialize Workbench
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>

              <button
                onClick={() => {
                  const el = document.getElementById('engines-matrix');
                  el?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="w-full sm:w-auto px-6 py-4 rounded-xl border border-slate-700/80 hover:border-slate-600 bg-slate-900/60 hover:bg-slate-800/80 text-slate-300 hover:text-white font-mono text-xs font-semibold tracking-wider uppercase transition-all"
              >
                Inspect All 10 Tools
              </button>
            </motion.div>

            {/* Quick Metrics Bar */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 1.5 }}
              className="mt-10 grid grid-cols-2 sm:grid-cols-4 gap-3 w-full max-w-2xl text-left"
            >
              <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/70">
                <span className="block font-mono text-[9px] text-slate-500 uppercase">Detection Speed</span>
                <span className="font-mono text-sm font-bold text-cyan-300">&lt; 150ms ELA</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/70">
                <span className="block font-mono text-[9px] text-slate-500 uppercase">Disk Footprint</span>
                <span className="font-mono text-sm font-bold text-emerald-400">Zero-Disk RAM</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/70">
                <span className="block font-mono text-[9px] text-slate-500 uppercase">Model Depth</span>
                <span className="font-mono text-sm font-bold text-indigo-400">ViT + Nemotron</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/70">
                <span className="block font-mono text-[9px] text-slate-500 uppercase">Evidence Std</span>
                <span className="font-mono text-sm font-bold text-slate-200">NIST SP 800-86</span>
              </div>
            </motion.div>
          </div>

          {/* RIGHT FLANK: 5 Matrix Streams + Tools 6 to 10 */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="hidden lg:flex lg:col-span-3 flex-col gap-3 relative rounded-2xl border border-slate-800/80 bg-slate-950/60 p-3.5 backdrop-blur-md shadow-2xl overflow-hidden group"
          >
            {/* 5-Column Matrix Stream Rain Backdrop */}
            <div className="absolute inset-0 opacity-25 group-hover:opacity-35 transition-opacity">
              <MatrixRain columns={5} color="rgba(168, 85, 247, 0.7)" speed={35} fontSize={12} />
            </div>

            {/* Right Header */}
            <div className="relative z-10 flex items-center justify-between border-b border-slate-800/80 pb-2 px-1">
              <div className="flex items-center gap-1.5 font-mono text-[11px] font-bold text-purple-400">
                <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                <span>NEURAL & CUSTODY SUITE</span>
              </div>
              <span className="font-mono text-[9px] text-slate-500 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
                5 ENGINES
              </span>
            </div>

            {/* Right 5 Tool Cards */}
            <div className="relative z-10 flex flex-col gap-2">
              {rightTools.map((tool) => (
                <ToolCard
                  key={tool.id}
                  tool={tool}
                  onSelect={setSelectedTool}
                  selected={selectedTool?.id === tool.id}
                />
              ))}
            </div>

            <div className="relative z-10 pt-1 border-t border-slate-800/60 flex items-center justify-between text-[10px] font-mono text-slate-500 px-1">
              <span>MATRIX STREAM 06-10</span>
              <span className="text-emerald-400 flex items-center gap-1">
                <span className="w-1 h-1 rounded-full bg-emerald-400" /> ARMED
              </span>
            </div>
          </motion.div>

        </div>

        {/* Mobile / Tablet 10-Tool Carousel / Grid (Visible on smaller viewports) */}
        <div className="lg:hidden mt-10 max-w-2xl mx-auto w-full">
          <div className="flex items-center justify-between mb-3 px-1">
            <span className="font-mono text-xs font-bold text-cyan-400 flex items-center gap-2">
              <Terminal className="w-4 h-4" /> 10 DIAGNOSTIC TOOLS REFERENCE
            </span>
            <span className="font-mono text-[10px] text-slate-500">TAP TO INSPECT</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-72 overflow-y-auto p-1 rounded-xl bg-slate-900/40 border border-slate-800/70">
            {FORENSIC_TOOLS_10.map((tool) => (
              <ToolCard
                key={tool.id}
                tool={tool}
                onSelect={setSelectedTool}
                selected={selectedTool?.id === tool.id}
              />
            ))}
          </div>
        </div>

        {/* Scroll down indicator */}
        <div className="flex flex-col items-center justify-center mt-12 text-slate-600 text-xs font-mono">
          <span>DEEP MATRIX SPECIFICATIONS BELOW</span>
          <ChevronDown className="w-4 h-4 animate-bounce mt-1 text-cyan-500/70" />
        </div>
      </section>

      {/* 10-Engine Diagnostic Reference Grid Section */}
      <section id="engines-matrix" className="py-20 px-4 sm:px-6 border-t border-slate-800/80 bg-slate-950/90 relative">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-cyan-500/30 bg-cyan-950/40 text-cyan-300 font-mono text-[11px] mb-3">
              <Activity className="w-3.5 h-3.5 text-cyan-400" />
              <span>THE 10-MATRIX FORENSIC SUITE</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-black font-mono tracking-tight text-white mb-4">
              Comprehensive Forensic Reference
            </h2>
            <p className="text-sm sm:text-base text-slate-400 font-mono leading-relaxed">
              Every digital tampering operation disrupts mathematical pixel coherence. ForensIQ applies 10 parallel analytical layers to uncover the ground truth.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {FORENSIC_TOOLS_10.map((tool, idx) => {
              const Icon = tool.icon;
              return (
                <motion.div
                  key={tool.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.05 }}
                  onClick={() => setSelectedTool(tool)}
                  className="cursor-pointer p-4 rounded-xl border border-slate-800 bg-slate-900/40 hover:bg-slate-900/80 hover:border-cyan-500/40 transition-all duration-200 group flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className={`p-2 rounded-lg bg-slate-950 border ${tool.borderColor} ${tool.color}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className="font-mono text-[9px] text-emerald-400 px-1.5 py-0.5 rounded bg-emerald-950/40 border border-emerald-500/20">
                        {tool.status}
                      </span>
                    </div>
                    <div className="font-mono text-[10px] text-slate-500 mb-1">{tool.code}</div>
                    <h3 className="font-mono text-sm font-bold text-slate-200 group-hover:text-cyan-300 transition-colors mb-2">
                      {tool.name}
                    </h3>
                    <p className="text-xs text-slate-400 leading-relaxed line-clamp-3 mb-4">
                      {tool.description}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-[10px] font-mono">
                    <span className="text-slate-500">{tool.metric}</span>
                    <span className="text-cyan-400 group-hover:underline">Inspect Spec &rarr;</span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Bottom Interactive CTA */}
      <section className="py-20 px-4 sm:px-6 relative overflow-hidden">
        <div className="max-w-4xl mx-auto rounded-3xl border border-cyan-500/30 bg-gradient-to-br from-cyan-950/40 via-slate-900/90 to-indigo-950/40 p-8 sm:p-12 text-center relative shadow-2xl backdrop-blur-xl">
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 to-indigo-500/5 pointer-events-none" />
          <ShieldCheck className="w-12 h-12 text-cyan-400 mx-auto mb-4" />
          <h2 className="text-2xl sm:text-3xl font-black font-mono text-white mb-3">
            Deploy Evidence Investigation
          </h2>
          <p className="text-slate-400 font-mono text-xs sm:text-sm max-w-xl mx-auto mb-8">
            Perform in-memory Error Level Analysis, ViT deepfake classification, and NIST SP 800-86 cryptographic logging in under 3 seconds.
          </p>
          <button
            onClick={onEnter}
            className="inline-flex items-center gap-3 px-8 py-4 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-mono font-bold text-sm tracking-wider uppercase transition-all duration-200 shadow-xl shadow-cyan-600/30 hover:scale-[1.02]"
          >
            Launch Investigation Workbench
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </section>

      {/* Footer with Comprehensive Legal & Technical Framework Links */}
      <footer className="border-t border-slate-800/80 py-8 px-6 bg-slate-950/95 backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-xs font-mono text-slate-400">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-cyan-400" />
            <span className="text-slate-200 font-semibold">ForensIQ</span>
            <span>— Autonomous Multi-Spectral Media Forensics Platform</span>
          </div>

          <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-[11px]">
            {onNavigate && (
              <>
                <button
                  onClick={() => onNavigate('privacy')}
                  className="text-cyan-400 hover:text-cyan-300 underline underline-offset-4 transition-colors"
                >
                  Privacy Policy &amp; Data Protocol
                </button>
                <span className="text-slate-600">·</span>
                <button
                  onClick={() => onNavigate('terms')}
                  className="text-teal-400 hover:text-teal-300 underline underline-offset-4 transition-colors"
                >
                  Terms &amp; Conditions
                </button>
                <span className="text-slate-600">·</span>
                <button
                  onClick={() => onNavigate('pages')}
                  className="text-slate-400 hover:text-slate-200 transition-colors"
                >
                  Pages Hub
                </button>
                <span className="text-slate-600">·</span>
              </>
            )}
            <a
              href="/docs"
              target="_blank"
              rel="noreferrer"
              className="text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              API Docs
            </a>
            <span className="text-slate-600">·</span>
            <a
              href="https://github.com/DevEagleEye97/ForensIQ"
              target="_blank"
              rel="noreferrer"
              className="hover:text-white transition-colors"
            >
              GitHub
            </a>
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-4 pt-3 border-t border-slate-900 text-center text-[10px] text-slate-600 font-mono">
          Compliant with NIST SP 800-86 &amp; Federal Rules of Evidence Rule 902(14) · Zero-Disk In-Memory Analysis
        </div>
      </footer>

      {/* Technical Spec Modal */}
      <ToolModal tool={selectedTool} onClose={() => setSelectedTool(null)} />
    </div>
  );
}
