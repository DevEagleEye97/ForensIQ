import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useEffect } from 'react';
import ScanLine from '../components/ScanLine';

const checks = [
  {
    name: 'Edge consistency',
    description: 'Detects unnatural sharpness and gradient breaks at splicing boundaries.',
    limit: 'Sensitive to compression. May flag heavy JPEG artifacts.',
  },
  {
    name: 'Compression analysis',
    description: 'Re-compresses at 90% to reveal localized tampering regions.',
    limit: 'Less reliable on PNG and heavily re-encoded images.',
  },
  {
    name: 'Metadata audit',
    description: 'Examines camera hardware signatures and editing software traces.',
    limit: 'Metadata is often stripped during social media sharing.',
  },
  {
    name: 'AI classifier',
    description: 'Vision transformer trained on deepfake and synthetic image datasets.',
    limit: 'New generation models may evade detection.',
  },
];

export default function LandingPage() {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const imageX = useSpring(useTransform(mouseX, [-0.5, 0.5], [-6, 6]), {
    stiffness: 120,
    damping: 20,
  });
  const imageY = useSpring(useTransform(mouseY, [-0.5, 0.5], [-6, 6]), {
    stiffness: 120,
    damping: 20,
  });

  const panelX = useSpring(useTransform(mouseX, [-0.5, 0.5], [12, -12]), {
    stiffness: 120,
    damping: 20,
  });
  const panelY = useSpring(useTransform(mouseY, [-0.5, 0.5], [12, -12]), {
    stiffness: 120,
    damping: 20,
  });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth) - 0.5;
      const y = (e.clientY / window.innerHeight) - 0.5;
      mouseX.set(x);
      mouseY.set(y);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [mouseX, mouseY]);

  return (
    <div className="min-h-screen bg-background text-text">
      {/* Hero */}
      <section className="px-6 py-24 max-w-6xl mx-auto">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-[56px] font-display font-bold leading-tight mb-4"
        >
          Forensic triage for digital evidence.
        </motion.h1>
        
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-20 text-text-muted mb-8 max-w-[65ch]"
        >
          Analyze images for signs of manipulation. Get explainable signals, not absolute verdicts.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <Link
            to="/workbench"
            className="inline-block px-8 py-4 bg-surface border border-border rounded-[20px] text-16 font-medium hover:shadow-[0_8px_24px_rgba(242,194,48,0.15)] hover:border-accent transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-background"
          >
            Open workbench
          </Link>
        </motion.div>

        {/* Hero Animation */}
        <motion.div
          style={{ x: imageX, y: imageY }}
          className="mt-16 relative max-w-2xl mx-auto"
        >
          <div className="relative aspect-[4/3] bg-surface border border-border rounded-[20px] overflow-hidden backdrop-blur-3xl">
            <img
              src="/sample-evidence.jpg"
              alt="Sample evidence"
              className="w-full h-full object-cover opacity-60"
            />
            <ScanLine />
          </div>
        </motion.div>
      </section>

      {/* Four Checks */}
      <section className="px-6 py-24 max-w-6xl mx-auto">
        <motion.h2
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-32 font-display font-bold mb-12"
        >
          Four complementary checks
        </motion.h2>

        <div className="grid md:grid-cols-2 gap-6">
          {checks.map((check, i) => (
            <motion.div
              key={check.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              style={{ x: panelX, y: panelY }}
              className="bg-surface border border-border rounded-[20px] p-8 backdrop-blur-3xl hover:shadow-[0_4px_16px_rgba(0,0,0,0.2)] hover:-translate-y-1 transition-all duration-300"
            >
              <h3 className="text-20 font-display font-bold mb-3">{check.name}</h3>
              <p className="text-16 text-text-muted mb-4">{check.description}</p>
              <p className="text-14 text-text-muted/70 italic">{check.limit}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* What a Result Means */}
      <section className="px-6 py-24 max-w-4xl mx-auto">
        <motion.h2
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-32 font-display font-bold mb-6"
        >
          What a result means
        </motion.h2>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-surface border border-border rounded-[20px] p-8 backdrop-blur-3xl space-y-4"
        >
          <p className="text-16 leading-relaxed">
            ForensIQ provides triage signals, not proof. Each check produces a confidence-weighted indicator that highlights suspicious regions or inconsistencies.
          </p>
          <p className="text-16 leading-relaxed">
            A "fail" status means the tool detected anomalies worth investigating. A "pass" status means no strong signals were found, but does not guarantee authenticity.
          </p>
          <p className="text-16 leading-relaxed text-text-muted">
            Images are transmitted to Hugging Face and OpenRouter for AI classification. Original evidence is preserved locally with SHA-256 fingerprints for chain-of-custody tracking.
          </p>
        </motion.div>
      </section>
    </div>
  );
}
