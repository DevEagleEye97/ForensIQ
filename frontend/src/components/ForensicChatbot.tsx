import { useState, useRef, useEffect } from 'react';
import {
  Send, X, Bot, User, Sparkles, RefreshCw
} from 'lucide-react';
import { cn } from '../lib/utils';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  model?: string;
  time: string;
}

interface ForensicChatbotProps {
  isOpen: boolean;
  onClose: () => void;
  caseContext?: any;
}

const QUICK_CHIPS = [
  'Explain this verdict in plain English',
  'What would change my mind? (Limitations)',
  'Summarize this report for a non-technical reviewer',
];

export default function ForensicChatbot({ isOpen, onClose, caseContext }: ForensicChatbotProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content:
        'ForensIQ Analyst armed. I translate raw ELA variances, EXIF provenance, and neural ViT signals into plain-English findings. Ask me anything about your active case or select a forensic prompt below.',
      time: 'Ready',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const handleSend = async (textToSend?: string) => {
    const query = textToSend || input;
    if (!query.trim() || loading) return;

    const userMsg: Message = {
      role: 'user',
      content: query,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const resp = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: query,
          case_context: caseContext || null,
          history: messages.map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      if (!resp.ok) {
        throw new Error(`HTTP ${resp.status}`);
      }

      const data = await resp.json();
      const assistantMsg: Message = {
        role: 'assistant',
        content: data.reply || 'No analysis returned.',
        model: data.model,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      const fallbackMsg: Message = {
        role: 'assistant',
        content:
          'ForensIQ Local Heuristic: When inspecting automated deepfake verdicts, always cross-reference the ELA noise map against EXIF hardware tags. What a human should double-check: physical hair-strand sharpness and eye-reflection symmetry.',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, fallbackMsg]);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 w-[95vw] sm:w-[420px] h-[550px] max-h-[85vh] glass-card rounded-2xl border border-cyan-500/40 shadow-2xl shadow-black/80 flex flex-col overflow-hidden font-mono text-xs backdrop-blur-2xl">
      {/* Chatbot Header */}
      <div className="p-3.5 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-slate-100 flex items-center gap-1.5">
              Forensic Copilot
              <span className="text-[9px] px-1.5 py-0.2 rounded bg-cyan-950 border border-cyan-500/40 text-cyan-300">
                TRUTHLENS
              </span>
            </h3>
            <p className="text-[10px] text-slate-400">OpenRouter Vision & Forensic Grounding</p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          aria-label="Close Forensic Chatbot"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Case Context Indicator */}
      {caseContext && (
        <div className="px-3.5 py-1.5 bg-indigo-950/30 border-b border-indigo-500/20 text-[10px] text-indigo-300 flex items-center justify-between">
          <span className="truncate">Context: {caseContext.filename || caseContext.case_id || 'Active Evidence'}</span>
          <span className="font-bold text-cyan-400 ml-2">{caseContext.verdict || 'Ready'}</span>
        </div>
      )}

      {/* Messages Stream */}
      <div ref={scrollRef} className="flex-1 p-3.5 overflow-y-auto space-y-3">
        {messages.map((m, idx) => (
          <div
            key={idx}
            className={cn(
              'flex gap-2 max-w-[88%]',
              m.role === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'
            )}
          >
            <div className={cn(
              'w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 text-[11px] font-bold',
              m.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-cyan-400 border border-slate-700'
            )}>
              {m.role === 'user' ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
            </div>

            <div className="space-y-1">
              <div
                className={cn(
                  'p-3 rounded-xl leading-relaxed whitespace-pre-wrap',
                  m.role === 'user'
                    ? 'bg-indigo-600/30 border border-indigo-500/40 text-slate-100'
                    : 'bg-slate-900/90 border border-slate-800 text-slate-200'
                )}
              >
                {m.content}
              </div>

              <div className="flex items-center gap-2 text-[9px] text-slate-500 px-1">
                <span>{m.time}</span>
                {m.model && <span className="text-cyan-400">· {m.model.split('/')[1] || m.model}</span>}
              </div>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex items-center gap-2 text-slate-400 text-[11px] p-2">
            <RefreshCw className="w-3.5 h-3.5 animate-spin text-cyan-400" />
            <span>Consulting multimodal reasoning engine...</span>
          </div>
        )}
      </div>

      {/* Quick Chips */}
      <div className="p-2 border-t border-slate-800/80 bg-slate-950/60 overflow-x-auto flex items-center gap-1.5 scrollbar-none">
        {QUICK_CHIPS.map((chip, i) => (
          <button
            key={i}
            onClick={() => handleSend(chip)}
            disabled={loading}
            className="text-[10px] text-cyan-300 bg-cyan-950/30 hover:bg-cyan-900/50 border border-cyan-500/30 rounded-lg px-2.5 py-1 whitespace-nowrap transition-colors flex items-center gap-1 flex-shrink-0"
          >
            <Sparkles className="w-2.5 h-2.5 text-cyan-400" />
            {chip}
          </button>
        ))}
      </div>

      {/* Input Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="p-3 border-t border-slate-800 bg-slate-950 flex items-center gap-2"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask forensic analyst about evidence..."
          className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
        />
        <button
          type="submit"
          disabled={!input.trim() || loading}
          className={cn(
            'p-2 rounded-xl transition-colors',
            input.trim() && !loading
              ? 'bg-cyan-600 hover:bg-cyan-500 text-white'
              : 'bg-slate-800 text-slate-600 cursor-not-allowed'
          )}
          aria-label="Send message"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
