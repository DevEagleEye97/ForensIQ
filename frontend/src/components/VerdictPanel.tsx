import { motion } from 'framer-motion';

interface VerdictPanelProps {
  analysis: {
    verdict: {
      overall: string;
      confidence: number;
      summary: string;
    };
    file_details: {
      name: string;
      size: string;
      hash: string;
      format: string;
    };
  };
}

export default function VerdictPanel({ analysis }: VerdictPanelProps) {
  const handleExport = () => {
    const report = {
      ...analysis,
      exported_at: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `forensic-report-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4 }}
      className="bg-surface border border-border rounded-[20px] p-6 backdrop-blur-3xl hover:shadow-[0_4px_16px_rgba(0,0,0,0.2)] hover:-translate-y-1 transition-all duration-300 space-y-6"
    >
      {/* Verdict */}
      <div>
        <h2 className="text-20 font-display font-bold mb-2">Verdict</h2>
        <p className="text-32 font-display font-bold text-accent mb-2">
          {analysis.verdict.overall}
        </p>
        <p className="text-14 text-text-muted">
          Confidence: {Math.round(analysis.verdict.confidence * 100)}%
        </p>
        <p className="text-16 text-text-muted mt-4 leading-relaxed">
          {analysis.verdict.summary}
        </p>
      </div>

      {/* File Details */}
      <div className="pt-6 border-t border-border">
        <h3 className="text-16 font-display font-bold mb-3">File details</h3>
        <div className="space-y-2 text-14">
          <div className="flex justify-between">
            <span className="text-text-muted">Name</span>
            <span className="font-data">{analysis.file_details.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-muted">Size</span>
            <span className="font-data">{analysis.file_details.size}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-muted">Format</span>
            <span className="font-data">{analysis.file_details.format}</span>
          </div>
          <div className="flex justify-between items-start">
            <span className="text-text-muted">SHA-256</span>
            <span className="font-data text-12 break-all text-right max-w-[180px]">
              {analysis.file_details.hash}
            </span>
          </div>
        </div>
      </div>

      {/* Export */}
      <button
        onClick={handleExport}
        className="w-full px-6 py-3 bg-surface border border-border rounded-[20px] text-16 font-medium hover:shadow-[0_4px_16px_rgba(242,194,48,0.15)] hover:border-accent transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-background"
      >
        Export report
      </button>
    </motion.div>
  );
}
