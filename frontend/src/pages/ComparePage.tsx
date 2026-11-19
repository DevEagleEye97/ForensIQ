import { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import {
  GitCompare, Upload, AlertTriangle, ShieldCheck,
  CheckCircle2, Layers, Cpu, Eye, RefreshCw, ArrowRight
} from 'lucide-react';
import { cn } from '../lib/utils';

interface DivergentRegion {
  x: number;
  y: number;
  w: number;
  h: number;
  intensity: number;
  verdict: string;
}

interface CompareResult {
  status: string;
  reference_sha256: string;
  suspect_sha256: string;
  reference_filename: string;
  suspect_filename: string;
  dimensions: string;
  divergence_pct: number;
  divergent_regions_count: number;
  divergent_regions: DivergentRegion[];
  heatmap_base64: string;
  verdict: string;
  verdict_status: 'Pass' | 'Warn' | 'Fail';
  summary: string;
}

export default function ComparePage() {
  const [refFile, setRefFile] = useState<File | null>(null);
  const [refPreview, setRefPreview] = useState<string | null>(null);
  const [susFile, setSusFile] = useState<File | null>(null);
  const [susPreview, setSusPreview] = useState<string | null>(null);

  const [sliderPos, setSliderPos] = useState<number>(50);
  const [activeView, setActiveView] = useState<'slider' | 'heatmap'>('slider');
  const [comparing, setComparing] = useState<boolean>(false);
  const [result, setResult] = useState<CompareResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Dropzone Reference
  const { getRootProps: getRefProps, getInputProps: getRefInput } = useDropzone({
    accept: { 'image/*': ['.jpeg', '.jpg', '.png', '.webp'] },
    maxFiles: 1,
    maxSize: 25 * 1024 * 1024,
    onDrop: (files) => {
      if (files[0]) {
        setRefFile(files[0]);
        setRefPreview(URL.createObjectURL(files[0]));
        setErrorMsg(null);
      }
    },
  });

  // Dropzone Suspect
  const { getRootProps: getSusProps, getInputProps: getSusInput } = useDropzone({
    accept: { 'image/*': ['.jpeg', '.jpg', '.png', '.webp'] },
    maxFiles: 1,
    maxSize: 25 * 1024 * 1024,
    onDrop: (files) => {
      if (files[0]) {
        setSusFile(files[0]);
        setSusPreview(URL.createObjectURL(files[0]));
        setErrorMsg(null);
      }
    },
  });

  const handleRunCompare = async () => {
    if (!refFile || !susFile) {
      setErrorMsg('Please upload both a Reference (Real) image and a Suspect (Fake) image.');
      return;
    }

    setComparing(true);
    setErrorMsg(null);

    const formData = new FormData();
    formData.append('reference_file', refFile);
    formData.append('suspect_file', susFile);

    try {
      const resp = await fetch('/api/compare', {
        method: 'POST',
        body: formData,
      });

      if (!resp.ok) {
        const errData = await resp.json().catch(() => ({}));
        throw new Error(errData.detail || `Server returned error ${resp.status}`);
      }

      const data: CompareResult = await resp.json();
      setResult(data);
    } catch (err: any) {
      setErrorMsg(err.message || 'Comparison failed. Could not process image pair.');
    } finally {
      setComparing(false);
    }
  };

  const loadDemoPair = async () => {
    // Generate synthetic demo pair via client-side Canvas
    const createSample = (color: string, text: string, withArtifact: boolean = false): Promise<{ file: File; url: string }> => {
      return new Promise((resolve) => {
        const canvas = document.createElement('canvas');
        canvas.width = 400;
        canvas.height = 400;
        const ctx = canvas.getContext('2d')!;

        // Base gradient
        const grad = ctx.createLinearGradient(0, 0, 400, 400);
        grad.addColorStop(0, color);
        grad.addColorStop(1, '#050a14');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 400, 400);

        // Subject element
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(200, 200, 90, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#0a0f1d';
        ctx.font = 'bold 20px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(text, 200, 205);

        if (withArtifact) {
          // Splice localized fake inpainting patch
          ctx.fillStyle = '#ff0055';
          ctx.fillRect(140, 160, 120, 70);
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 14px monospace';
          ctx.fillText('INPAINTED SEAM', 200, 200);
        }

        canvas.toBlob((blob) => {
          const file = new File([blob!], withArtifact ? 'suspect_spliced.jpg' : 'reference_authentic.jpg', { type: 'image/jpeg' });
          resolve({ file, url: URL.createObjectURL(blob!) });
        }, 'image/jpeg', 0.92);
      });
    };

    const ref = await createSample('#10b981', 'AUTHENTIC ASSET');
    const sus = await createSample('#10b981', 'SUSPECT ASSET', true);

    setRefFile(ref.file);
    setRefPreview(ref.url);
    setSusFile(sus.file);
    setSusPreview(sus.url);
    setErrorMsg(null);
  };

  return (
    <div className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <GitCompare className="w-5 h-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-wide font-mono">
              Differential Forensics
            </h1>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full border border-cyan-500/30 bg-cyan-950/40 text-cyan-300">
              TOOL_09 // DIFF-SPEC
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl font-mono">
            Dual-channel alignment inspection. Ingest an authentic reference alongside a suspect asset to isolate pixel divergence, synthesis seams, and localized inpainting.
          </p>
        </div>

        <button
          onClick={loadDemoPair}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-800 bg-slate-900/60 hover:border-cyan-500/50 hover:bg-slate-900 text-xs font-mono text-cyan-300 transition-all shadow-sm"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Load Demo Pair
        </button>
      </div>

      {/* Dual Upload Zone */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Reference Upload */}
        <div
          {...getRefProps()}
          className={cn(
            'glass-card rounded-2xl p-5 border-2 border-dashed transition-all cursor-pointer flex flex-col items-center justify-center min-h-[220px] text-center relative overflow-hidden group',
            refPreview ? 'border-emerald-500/50 bg-emerald-950/10' : 'border-slate-800 hover:border-emerald-500/40'
          )}
        >
          <input {...getRefInput()} />
          {refPreview ? (
            <div className="relative w-full h-44 flex items-center justify-center">
              <img src={refPreview} alt="Reference" className="max-h-full max-w-full rounded-xl object-contain shadow-lg" />
              <div className="absolute top-2 left-2 px-2 py-1 rounded bg-black/80 border border-emerald-500/40 text-[10px] font-mono text-emerald-400 font-bold">
                REF: AUTHENTIC
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-emerald-400 w-fit mx-auto group-hover:scale-105 transition-transform">
                <Upload className="w-6 h-6" />
              </div>
              <p className="text-xs font-semibold text-slate-200 font-mono">1. Upload Reference Image (Authentic)</p>
              <p className="text-[11px] text-slate-500 font-mono">Known original, uncompressed, or trusted capture (JPEG/PNG)</p>
            </div>
          )}
        </div>

        {/* Suspect Upload */}
        <div
          {...getSusProps()}
          className={cn(
            'glass-card rounded-2xl p-5 border-2 border-dashed transition-all cursor-pointer flex flex-col items-center justify-center min-h-[220px] text-center relative overflow-hidden group',
            susPreview ? 'border-rose-500/50 bg-rose-950/10' : 'border-slate-800 hover:border-rose-500/40'
          )}
        >
          <input {...getSusInput()} />
          {susPreview ? (
            <div className="relative w-full h-44 flex items-center justify-center">
              <img src={susPreview} alt="Suspect" className="max-h-full max-w-full rounded-xl object-contain shadow-lg" />
              <div className="absolute top-2 left-2 px-2 py-1 rounded bg-black/80 border border-rose-500/40 text-[10px] font-mono text-rose-400 font-bold">
                SUSPECT: TARGET
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-rose-400 w-fit mx-auto group-hover:scale-105 transition-transform">
                <Upload className="w-6 h-6" />
              </div>
              <p className="text-xs font-semibold text-slate-200 font-mono">2. Upload Suspect Image (Potential Fake)</p>
              <p className="text-[11px] text-slate-500 font-mono">Suspect viral, social media asset, or cloned document</p>
            </div>
          )}
        </div>
      </div>

      {/* Action Trigger */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-slate-500 font-mono">
          Security: Magic bytes verified · 25MB max per image · In-memory aligned differencing
        </p>

        <button
          onClick={handleRunCompare}
          disabled={comparing || !refFile || !susFile}
          className={cn(
            'flex items-center gap-2 px-6 py-3 rounded-xl font-mono text-xs font-bold uppercase tracking-wider transition-all shadow-lg',
            refFile && susFile && !comparing
              ? 'bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white shadow-cyan-500/20'
              : 'bg-slate-900 text-slate-600 border border-slate-800 cursor-not-allowed'
          )}
        >
          {comparing ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin text-cyan-400" />
              Aligning Pixels & Computing Difference...
            </>
          ) : (
            <>
              Execute Differential Forensics
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>

      {errorMsg && (
        <div className="p-3.5 rounded-xl border border-rose-500/40 bg-rose-950/30 text-rose-300 text-xs font-mono flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Comparison Results Arena */}
      {result && (
        <div className="space-y-6">
          {/* Verdict Banner */}
          <div className="glass-card p-5 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border border-cyan-500/30">
            <div className="flex items-center gap-3">
              <div className={cn(
                'p-3 rounded-xl border',
                result.verdict_status === 'Pass'
                  ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-400'
                  : 'bg-rose-950/40 border-rose-500/50 text-rose-400'
              )}>
                {result.verdict_status === 'Pass' ? <ShieldCheck className="w-6 h-6" /> : <AlertTriangle className="w-6 h-6" />}
              </div>
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Differential Verdict</span>
                <h3 className="text-lg font-bold text-white font-mono">{result.verdict}</h3>
                <p className="text-xs text-slate-300 font-mono mt-0.5">{result.summary}</p>
              </div>
            </div>

            <div className="flex items-center gap-6 border-t md:border-t-0 md:border-l border-slate-800 pt-3 md:pt-0 md:pl-6 text-xs font-mono">
              <div>
                <p className="text-slate-500">Pixel Divergence</p>
                <p className={cn('text-xl font-bold font-mono', result.divergence_pct > 1 ? 'text-rose-400' : 'text-emerald-400')}>
                  {result.divergence_pct}%
                </p>
              </div>
              <div>
                <p className="text-slate-500">Flagged Seams</p>
                <p className="text-xl font-bold font-mono text-cyan-400">
                  {result.divergent_regions_count}
                </p>
              </div>
            </div>
          </div>

          {/* Interactive Viewer Section */}
          <div className="glass-card p-5 rounded-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-cyan-400" />
                <span className="text-xs font-bold text-slate-200 font-mono">Split-Slider Visual Comparator</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveView('slider')}
                  className={cn(
                    'px-3 py-1 rounded-lg text-xs font-mono transition-colors',
                    activeView === 'slider' ? 'bg-cyan-600/30 text-cyan-300 border border-cyan-500/40' : 'text-slate-400 hover:text-white'
                  )}
                >
                  Side-by-Side Split
                </button>
                <button
                  onClick={() => setActiveView('heatmap')}
                  className={cn(
                    'px-3 py-1 rounded-lg text-xs font-mono transition-colors',
                    activeView === 'heatmap' ? 'bg-cyan-600/30 text-cyan-300 border border-cyan-500/40' : 'text-slate-400 hover:text-white'
                  )}
                >
                  Thermal Heatmap
                </button>
              </div>
            </div>

            {/* Split Slider Display */}
            {activeView === 'slider' && refPreview && susPreview && (
              <div className="relative w-full h-[450px] bg-black/60 rounded-xl overflow-hidden flex items-center justify-center select-none border border-slate-800">
                {/* Reference Background Layer */}
                <img
                  src={refPreview}
                  alt="Reference Layer"
                  className="absolute inset-0 w-full h-full object-contain pointer-events-none"
                />

                {/* Suspect Foreground Layer with Clip Path */}
                <div
                  className="absolute inset-0 overflow-hidden"
                  style={{ clipPath: `inset(0 0 0 ${sliderPos}%)` }}
                >
                  <img
                    src={susPreview}
                    alt="Suspect Layer"
                    className="absolute inset-0 w-full h-full object-contain pointer-events-none"
                  />
                </div>

                {/* Vertical Divider Line */}
                <div
                  className="absolute top-0 bottom-0 w-1 bg-cyan-400 shadow-[0_0_15px_#00d9ff] pointer-events-none z-20"
                  style={{ left: `${sliderPos}%` }}
                >
                  <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-slate-900 border-2 border-cyan-400 flex items-center justify-center text-cyan-400 shadow-xl">
                    <GitCompare className="w-4 h-4" />
                  </div>
                </div>

                {/* Draggable Range Control Overlay */}
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={sliderPos}
                  onChange={(e) => setSliderPos(Number(e.target.value))}
                  className="absolute inset-0 opacity-0 cursor-ew-resize w-full h-full z-30"
                  aria-label="Drag to compare authentic versus suspect"
                />

                {/* Overlay Indicators */}
                <div className="absolute top-3 left-3 px-2.5 py-1 rounded bg-black/80 border border-emerald-500/40 text-[10px] font-mono text-emerald-400 z-10 pointer-events-none">
                  ◄ AUTHENTIC (0% - {sliderPos}%)
                </div>
                <div className="absolute top-3 right-3 px-2.5 py-1 rounded bg-black/80 border border-rose-500/40 text-[10px] font-mono text-rose-400 z-10 pointer-events-none">
                  SUSPECT ({sliderPos}% - 100%) ►
                </div>
              </div>
            )}

            {/* Heatmap View */}
            {activeView === 'heatmap' && (
              <div className="relative w-full h-[450px] bg-black/80 rounded-xl overflow-hidden flex items-center justify-center border border-slate-800">
                <img
                  src={result.heatmap_base64}
                  alt="Divergence Heatmap"
                  className="max-h-full max-w-full object-contain shadow-2xl"
                />
                <div className="absolute bottom-3 left-3 px-3 py-1.5 rounded-lg bg-black/85 border border-slate-800 text-[10px] font-mono text-slate-300">
                  <span className="text-cyan-400 font-bold">HEATMAP PALETTE:</span> Black = Identical | Cyan = Marginal | Yellow/Red = Heavy Synthesis Departure
                </div>
              </div>
            )}
          </div>

          {/* Divergent Regions Grid & Plain English Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Regions List */}
            <div className="lg:col-span-2 glass-card p-5 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4 text-cyan-400" />
                  <h4 className="text-xs font-bold text-slate-200 font-mono">Divergent Tile Regions (Top Coordinates)</h4>
                </div>
                <span className="text-[10px] text-slate-500 font-mono">{result.divergent_regions.length} anomalies mapped</span>
              </div>

              {result.divergent_regions.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-72 overflow-y-auto pr-1">
                  {result.divergent_regions.map((region, idx) => (
                    <div key={idx} className="p-3 rounded-xl border border-slate-800/80 bg-slate-900/60 text-xs font-mono space-y-1">
                      <div className="flex items-center justify-between text-slate-300">
                        <span className="font-bold text-cyan-300">Region #{idx + 1}</span>
                        <span className="text-rose-400 font-bold">Δ {(region.intensity * 100).toFixed(1)}%</span>
                      </div>
                      <p className="text-[11px] text-slate-400">Offset: X:{region.x} Y:{region.y} (Box {region.w}x{region.h})</p>
                      <p className="text-[10px] text-amber-300 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3 text-amber-400" />
                        {region.verdict}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-slate-500 font-mono text-xs">
                  <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                  No high-frequency divergence tiles detected. Image signatures are uniform.
                </div>
              )}
            </div>

            {/* Cryptographic Traceability Card */}
            <div className="glass-card p-5 rounded-2xl space-y-4 text-xs font-mono">
              <div className="flex items-center gap-2 text-slate-200 font-bold">
                <Cpu className="w-4 h-4 text-indigo-400" />
                <span>Forensic Certificate</span>
              </div>

              <div className="space-y-2 text-[11px]">
                <div>
                  <span className="text-slate-500">Ref SHA-256:</span>
                  <p className="text-slate-300 break-all bg-black/40 p-1.5 rounded border border-slate-800 mt-0.5">
                    {result.reference_sha256}
                  </p>
                </div>

                <div>
                  <span className="text-slate-500">Suspect SHA-256:</span>
                  <p className="text-slate-300 break-all bg-black/40 p-1.5 rounded border border-slate-800 mt-0.5">
                    {result.suspect_sha256}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-800 text-[10px] text-slate-400 space-y-1">
                  <p>• Method: Interpolated Multi-Channel Difference</p>
                  <p>• Precision: Double-Float Array Variance</p>
                  <p>• Output: Traceable Evidence Certificate</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
