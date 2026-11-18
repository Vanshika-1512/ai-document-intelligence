import { useEffect, useRef, useState } from "react";
import {
  Send, Sparkles, Loader2, Clock,
  Plus, Paperclip, MessageSquare,
} from "lucide-react";
import { api } from "../services/api";
import MarkdownRenderer from "./MarkdownRenderer";

const SUGGESTIONS = [
  "What is this document about?",
  "Explain the core concept in detail",
  "Summarize key takeaways",
  "What are the main advantages & limitations?",
  "List actionable steps",
];

export default function ChatInterface({ documentId }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = (smooth = true) => {
    messagesEndRef.current?.scrollIntoView({
      behavior: smooth ? "smooth" : "auto",
      block: "end",
    });
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: smooth ? "smooth" : "auto",
      });
    }
  };

  useEffect(() => {
    api.chatHistory(documentId).then((history) => {
      setMessages(history.map((h) => ({
        question: h.question,
        answer: h.answer,
        sources: h.sources,
        timing: null,
      })));
    }).catch(() => { });
  }, [documentId]);

  useEffect(() => {
    scrollToBottom(true);
    const t1 = setTimeout(() => scrollToBottom(true), 60);
    const t2 = setTimeout(() => scrollToBottom(true), 250);
    const t3 = setTimeout(() => scrollToBottom(true), 600);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [messages, sending]);

  async function ask(question) {
    if (!question.trim() || sending) return;
    const cleanQ = question.trim();
    setInput("");
    setSending(true);

    const historyPayload = messages
      .filter((m) => m.answer && !m.isError)
      .slice(-4)
      .map((m) => ({ question: m.question, answer: m.answer }));

    setMessages((prev) => [...prev, { question: cleanQ, answer: null, sources: [], timing: null }]);

    try {
      const result = await api.chat(documentId, cleanQ, historyPayload);
      setMessages((prev) => {
        const copy = [...prev];
        copy[copy.length - 1] = {
          question: cleanQ,
          answer: result.answer,
          sources: result.sources || [],
          timing: result.timing || null,
        };
        return copy;
      });
    } catch (e) {
      setMessages((prev) => {
        const copy = [...prev];
        copy[copy.length - 1] = {
          question: cleanQ,
          answer: `I encountered an issue processing your question: ${e.message}. Please try again or rephrase.`,
          sources: [],
          timing: null,
          isError: true,
        };
        return copy;
      });
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div ref={scrollRef} className="flex-1 overflow-y-auto scrollbar-thin px-1 py-2 space-y-5 min-h-0">
        {messages.length === 0 && (
          <div className="text-center py-6 flex flex-col items-center">
            {/* Luminous Intelligence Orb */}
            <div className="relative w-28 h-28 my-3 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full bg-accent-cyan/25 blur-2xl animate-pulseGlow" />
              <div className="relative w-24 h-24 rounded-full bg-gradient-to-tr from-[#0284C7] via-[#00D2EE] to-[#80F2FF] shadow-orb flex items-center justify-center overflow-hidden border border-white/60 animate-floatOrb">
                <div className="absolute inset-1 rounded-full bg-gradient-to-b from-white/40 via-transparent to-black/20" />
                <div className="w-10 h-10 rounded-full bg-white/30 backdrop-blur-sm flex items-center justify-center">
                  <Sparkles size={20} className="text-white drop-shadow" />
                </div>
              </div>
            </div>

            <h3 className="text-lg font-semibold text-ink mt-2">What would you like to know?</h3>
            <p className="text-xs text-mute max-w-sm mx-auto mt-1 mb-5 leading-relaxed">
              Describe what you're looking for. DocIntel will synthesize precise answers grounded in this document.
            </p>

            {/* Suggestion Chips */}
            <div className="flex flex-wrap gap-2 justify-center max-w-md mx-auto">
              {SUGGESTIONS.map((s, idx) => (
                <button
                  key={s}
                  onClick={() => ask(s)}
                  className={`text-xs px-4 py-2 rounded-full transition-all duration-200 border ${idx === 0
                      ? "bg-ink text-white border-ink shadow-sm font-semibold"
                      : "bg-white/80 hover:bg-white text-ink/80 hover:text-ink border-black/[0.04] shadow-sm font-medium"
                    }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} className="space-y-2 animate-rise">
            {/* User Question */}
            <div className="flex justify-end">
              <div className="bg-ink text-white text-sm px-5 py-3 rounded-3xl rounded-br-sm max-w-[85%] shadow-pill leading-relaxed font-medium">
                {m.question}
              </div>
            </div>

            {/* Assistant Answer */}
            <div className="flex justify-start">
              <div className="bg-white/95 backdrop-blur-md border border-white/90 text-sm p-5 rounded-3xl rounded-bl-sm max-w-[92%] shadow-card">
                {m.answer === null ? (
                  <div className="flex items-center gap-3 text-mute py-2">
                    <Loader2 size={18} className="animate-spin text-ink" />
                    <span className="text-xs font-semibold">Reading document & synthesizing answer…</span>
                  </div>
                ) : (
                  <>
                    <div className={m.isError ? "text-bad" : "text-ink"}>
                      {m.isError ? (
                        <p>{m.answer}</p>
                      ) : (
                        <MarkdownRenderer content={m.answer} />
                      )}
                    </div>

                    {/* Metadata & Response Timing */}
                    {m.timing && (
                      <div className="mt-4 pt-3 flex items-center justify-between text-[11px] text-mute border-t border-black/[0.05]">
                        <span className="flex items-center gap-1.5 font-medium">
                          <span className="w-1.5 h-1.5 rounded-full bg-good" />
                          <span>Grounded in document context</span>
                        </span>
                        <span className="flex items-center gap-1 font-mono text-[10px] bg-black/[0.03] px-2.5 py-1 rounded-full">
                          <Clock size={11} />
                          <span>{m.timing.total_ms}ms</span>
                        </span>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} className="h-4 shrink-0" />
      </div>

      {/* Input Container styled like the center phone mockup */}
      <div className="mt-4 bg-white/95 backdrop-blur-md rounded-3xl border border-white/80 p-3 shadow-card">
        <div className="flex items-center justify-between px-2 pt-1 pb-1.5 text-[11px] text-mute border-b border-black/[0.03]">
          <span className="font-medium">Direct document comprehension</span>
          <span className="text-[10px] text-mute/70">Powered by Local RAG</span>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            ask(input);
          }}
          className="flex items-center gap-2 pt-2 px-1"
        >
          <div className="flex items-center gap-1 text-mute">
            <button
              type="button"
              className="w-8 h-8 rounded-full hover:bg-black/5 flex items-center justify-center transition-colors text-mute hover:text-ink"
              title="Add context"
            >
              <Plus size={16} />
            </button>
            <button
              type="button"
              className="w-8 h-8 rounded-full hover:bg-black/5 flex items-center justify-center transition-colors text-mute hover:text-ink"
              title="Attach document reference"
            >
              <Paperclip size={15} />
            </button>
          </div>

          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask anything about this document…"
            disabled={sending}
            className="flex-1 bg-transparent px-2 py-2 text-sm outline-none placeholder:text-mute/60 text-ink disabled:opacity-50"
          />

          <button
            type="submit"
            disabled={sending || !input.trim()}
            className="w-10 h-10 rounded-full bg-ink text-white flex items-center justify-center disabled:opacity-30 hover:bg-ink-700 transition-all shrink-0 shadow-pill active:scale-95"
            aria-label="Send"
          >
            {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={15} />}
          </button>
        </form>
      </div>
    </div>
  );
}
