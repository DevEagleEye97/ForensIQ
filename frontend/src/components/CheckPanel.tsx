import { motion } from 'framer-motion';

interface CheckPanelProps {
  checks: {
    edge_consistency: { status: 'pass' | 'warn' | 'fail'; confidence: number };
    compression: { status: 'pass' | 'warn' | 'fail'; confidence: number };
    metadata: { status: 'pass' | 'warn' | 'fail'; confidence: number };
    ai_classifier: { status: 'pass' | 'warn' | 'fail'; confidence: number };
  };
}

const checkLabels = {
  edge_consistency: 'Edge consistency',
  compression: 'Compression analysis',
  metadata: 'Metadata audit',
  ai_classifier: 'AI classifier',
};

export default function CheckPanel({ checks }: CheckPanelProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4 }}
      className="bg-surface border border-border rounded-[20px] p-6 backdrop-blur-3xl hover:shadow-[0_4px_16px_rgba(0,0,0,0.2)] hover:-translate-y-1 transition-all duration-300"
    >
      <h2 className="text-20 font-display font-bold mb-6">Checks</h2>

      <div className="space-y-4">
        {Object.entries(checks).map(([key, check]) => (
          <div key={key} className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <p className="text-16 font-medium">{checkLabels[key as keyof typeof checkLabels]}</p>
              <p className="text-14 text-text-muted mt-1">
                Confidence: {Math.round(check.confidence * 100)}%
              </p>
            </div>

            <div
              className={`px-3 py-1 rounded-full text-14 font-medium ${
                check.status === 'pass'
                  ? 'bg-pass/10 text-pass'
                  : check.status === 'warn'
                  ? 'bg-warn/10 text-warn'
                  : 'bg-fail/10 text-fail'
              }`}
            >
              {check.status}
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
