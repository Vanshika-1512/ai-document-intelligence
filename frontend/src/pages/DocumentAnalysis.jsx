import { useEffect, useState } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { Search, ArrowLeft, FileText } from "lucide-react";
import AppShell from "../components/AppShell.jsx";
import { Card, LoadingState, ErrorState } from "../components/ui.jsx";
import ChatInterface from "../components/ChatInterface.jsx";
import { useDocumentStatus } from "../hooks/useDocumentStatus.js";
import { api } from "../services/api";

const TABS = ["Summary", "Chat"];

export default function DocumentAnalysis() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { document: doc, error: statusError } = useDocumentStatus(id);

  const [tab, setTab] = useState(params.get("tab") === "chat" ? "Chat" : "Summary");
  const [text, setText] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState(null);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    if (doc?.status !== "completed") return;
    api.getDocumentText(id).then((r) => setText(r.text)).catch(() => setText(""));
    api.getAnalysis(id).then(setAnalysis).catch(() => {});
  }, [id, doc?.status]);

  async function runSearch(e) {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setSearching(true);
    try {
      const results = await api.searchDocument(id, searchQuery);
      setSearchResults(results);
    } catch (e) {
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  }

  if (statusError) {
    return (
      <AppShell title="Document">
        <ErrorState message={statusError} />
      </AppShell>
    );
  }

  if (!doc || (doc.status !== "completed" && doc.status !== "failed")) {
    return (
      <AppShell title="Document">
        <LoadingState label={`Processing document… (${doc?.status || "starting"})`} />
      </AppShell>
    );
  }

  if (doc.status === "failed") {
    return (
      <AppShell title="Document">
        <ErrorState message={doc.error_message || "This document failed to process."} />
      </AppShell>
    );
  }

  return (
    <AppShell title={doc.filename}>
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate("/app/documents")}
          className="w-10 h-10 rounded-full bg-white/90 shadow-sm border border-white/80 flex items-center justify-center text-ink hover:scale-105 active:scale-95 transition-all"
          aria-label="Back to documents"
        >
          <ArrowLeft size={16} />
        </button>
        <div>
          <h2 className="font-bold text-xl text-ink tracking-tight truncate max-w-lg">{doc.filename}</h2>
          <p className="text-xs text-mute mt-0.5">
            {doc.file_type.toUpperCase()} · {doc.page_count} page{doc.page_count === 1 ? "" : "s"} · {doc.word_count.toLocaleString()} words
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Left: document viewer */}
        <Card className="p-6 flex flex-col max-h-[calc(100vh-9.5rem)]">
          <div className="flex items-center justify-between mb-4 pb-4 border-b border-black/[0.05]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-ink text-white flex items-center justify-center text-xs font-bold uppercase shadow-sm">
                {(doc.file_type || "DOC").slice(0, 4)}
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-sm text-ink truncate">{doc.filename}</p>
                <p className="text-xs text-mute font-medium">{doc.reading_time_minutes} min read</p>
              </div>
            </div>
          </div>

          <form onSubmit={runSearch} className="mb-4">
            <div className="flex items-center gap-2.5 bg-paper-light border border-black/[0.04] rounded-full px-4 py-2.5 focus-within:border-ink/20 focus-within:bg-white transition-all shadow-sm">
              <Search size={15} className="text-mute shrink-0" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search passages using semantic meaning…"
                className="bg-transparent outline-none text-xs w-full placeholder:text-mute text-ink"
              />
            </div>
          </form>

          {searchResults !== null ? (
            <div className="flex-1 overflow-y-auto scrollbar-thin space-y-3">
              <div className="flex items-center justify-between px-1">
                <p className="text-xs font-semibold text-mute">{searching ? "Searching…" : `${searchResults.length} matching passage(s)`}</p>
                <button onClick={() => setSearchResults(null)} className="text-xs text-ink font-bold hover:underline">
                  Clear
                </button>
              </div>
              {searchResults.map((r, i) => (
                <div key={i} className="bg-paper-light border border-black/[0.04] rounded-2xl p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-ink bg-white px-2.5 py-1 rounded-full shadow-sm">{r.page ? `Page ${r.page}` : "Match"}</span>
                    <span className="text-xs text-mute font-mono">{Math.round(r.score * 100)}% match</span>
                  </div>
                  <p className="text-sm text-ink/80 leading-relaxed">{r.content}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto scrollbar-thin text-sm text-ink/80 leading-relaxed whitespace-pre-line p-2">
              {text === null ? <LoadingState label="Loading text…" /> : text || "No extracted text available."}
            </div>
          )}
        </Card>

        {/* Right: AI intelligence panel */}
        <Card className="p-6 flex flex-col max-h-[calc(100vh-9.5rem)]">
          {/* Pill Tabs styled like the mockup filter row */}
          <div className="flex gap-1.5 mb-5 p-1 bg-black/[0.04] rounded-full overflow-x-auto scrollbar-thin shrink-0">
            {TABS.map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-4 py-2 text-xs font-semibold rounded-full whitespace-nowrap transition-all duration-200 ${
                  tab === t
                    ? "bg-ink text-white shadow-sm"
                    : "text-mute hover:text-ink hover:bg-white/60"
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          <div className={`flex-1 ${tab === "Chat" ? "flex flex-col min-h-0 overflow-hidden" : "overflow-y-auto scrollbar-thin"}`}>
            {tab === "Summary" && <SummaryTab analysis={analysis} />}
            {tab === "Chat" && <ChatInterface documentId={id} />}
          </div>
        </Card>
      </div>
    </AppShell>
  );
}

function SummaryTab({ analysis }) {
  if (!analysis) return <LoadingState label="Loading summary…" />;
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-medium text-mute mb-2">Quick summary</h3>
        <p className="text-sm text-ink/85 leading-relaxed">{analysis.summary_short || "—"}</p>
      </div>
      <div>
        <h3 className="text-sm font-medium text-mute mb-2">Detailed summary</h3>
        <p className="text-sm text-ink/85 leading-relaxed">{analysis.summary_detailed || "—"}</p>
      </div>
      <div>
        <h3 className="text-sm font-medium text-mute mb-2">Key points</h3>
        <ul className="space-y-2">
          {(analysis.key_points || []).map((point, i) => (
            <li key={i} className="text-sm text-ink/85 flex gap-2">
              <span className="text-signal shrink-0">—</span>
              {point}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
