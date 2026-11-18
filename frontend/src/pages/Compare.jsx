import { useEffect, useState } from "react";
import { GitCompareArrows } from "lucide-react";
import AppShell from "../components/AppShell.jsx";
import { Card, LoadingState, ErrorState, EmptyState, ConfidenceBar } from "../components/ui.jsx";
import { api } from "../services/api";

export default function Compare() {
  const [documents, setDocuments] = useState(null);
  const [idA, setIdA] = useState("");
  const [idB, setIdB] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.listDocuments().then((docs) => setDocuments(docs.filter((d) => d.status === "completed"))).catch(() => setDocuments([]));
  }, []);

  async function runCompare() {
    if (!idA || !idB || idA === idB) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const r = await api.compareDocuments(idA, idB);
      setResult(r);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  const nameOf = (id) => documents?.find((d) => d.id === id)?.filename;

  return (
    <AppShell title="Compare Documents">
      <div className="mb-6">
        <h2 className="font-bold text-xl text-ink">Cross-document comparison</h2>
        <p className="text-xs text-mute mt-1">Pick two processed documents to compare topics, entities, and semantic overlap.</p>
      </div>

      {documents === null ? (
        <LoadingState label="Loading documents…" />
      ) : documents.length < 2 ? (
        <Card className="p-6">
          <EmptyState
            icon={GitCompareArrows}
            title="Need at least two documents"
            description="Upload and process another document to enable side-by-side comparison."
          />
        </Card>
      ) : (
        <>
          <Card className="p-6 mb-6">
            <div className="grid sm:grid-cols-2 gap-4">
              <Select label="Document A" value={idA} onChange={setIdA} documents={documents} exclude={idB} />
              <Select label="Document B" value={idB} onChange={setIdB} documents={documents} exclude={idA} />
            </div>
            <button
              onClick={runCompare}
              disabled={!idA || !idB || idA === idB || loading}
              className="mt-6 inline-flex items-center gap-2 bg-ink text-white text-xs font-semibold px-6 py-3.5 rounded-full disabled:opacity-40 hover:bg-ink-700 shadow-pill transition-all active:scale-95"
            >
              <GitCompareArrows size={15} /> {loading ? "Comparing documents…" : "Run comparison"}
            </button>
          </Card>

          {error && <ErrorState message={error} />}

          {result && (
            <div className="space-y-6">
              <Card className="p-7">
                <p className="text-xs font-bold uppercase tracking-wider text-mute mb-2">Semantic overlap</p>
                <div className="flex items-baseline gap-3 mb-4">
                  <span className="font-extrabold text-5xl text-ink tracking-tight">{result.similarity_score}%</span>
                  <span className="text-xs text-mute font-medium">vector cosine match</span>
                </div>
                <ConfidenceBar value={result.similarity_score / 100} label="Semantic correlation" />
              </Card>

              <div className="grid sm:grid-cols-3 gap-4">
                <TopicCard title="Common topics" items={result.common_topics} tone="signal" />
                <TopicCard title={`Unique to ${nameOf(idA) || "A"}`} items={result.unique_to_a} tone="good" />
                <TopicCard title={`Unique to ${nameOf(idB) || "B"}`} items={result.unique_to_b} tone="warn" />
              </div>

              <Card className="p-6">
                <h3 className="font-bold text-base text-ink mb-4">Side by side overview</h3>
                <div className="grid sm:grid-cols-2 gap-6 text-sm">
                  <div>
                    <p className="text-xs text-mute font-semibold uppercase mb-1">Classification A</p>
                    <p className="font-semibold text-ink">{result.classification_a || "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-mute font-semibold uppercase mb-1">Classification B</p>
                    <p className="font-semibold text-ink">{result.classification_b || "—"}</p>
                  </div>
                </div>
              </Card>
            </div>
          )}
        </>
      )}
    </AppShell>
  );
}

function Select({ label, value, onChange, documents, exclude }) {
  return (
    <div>
      <label className="text-xs font-semibold text-mute block mb-2">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-paper-light border border-black/[0.04] rounded-2xl px-4 py-3 text-xs font-semibold text-ink outline-none focus:border-ink/20 focus:bg-white transition-all shadow-sm cursor-pointer"
      >
        <option value="">Select a document…</option>
        {documents.filter((d) => d.id !== exclude).map((d) => (
          <option key={d.id} value={d.id}>{d.filename}</option>
        ))}
      </select>
    </div>
  );
}

const TONE_CLASSES = {
  signal: "text-ink bg-white shadow-sm border border-black/[0.04]",
  good: "text-good bg-good/10 border border-good/20",
  warn: "text-warn bg-warn/10 border border-warn/20",
};

function TopicCard({ title, items, tone }) {
  return (
    <Card className="p-5">
      <h3 className="text-xs font-bold uppercase tracking-wider text-mute mb-3">{title}</h3>
      {items.length === 0 ? (
        <p className="text-xs text-mute italic">None detected</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {items.map((t) => (
            <span key={t} className={`text-xs px-3 py-1.5 rounded-full font-semibold ${TONE_CLASSES[tone]}`}>{t}</span>
          ))}
        </div>
      )}
    </Card>
  );
}
