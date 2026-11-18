import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Inbox, UploadCloud } from "lucide-react";
import AppShell from "../components/AppShell.jsx";
import { Card, LoadingState, ErrorState, EmptyState } from "../components/ui.jsx";
import DocumentCard from "../components/DocumentCard.jsx";
import { api } from "../services/api";

export default function Documents() {
  const [documents, setDocuments] = useState(null);
  const [error, setError] = useState(null);
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const query = (params.get("q") || "").toLowerCase();

  function load() {
    setError(null);
    api.listDocuments().then(setDocuments).catch((e) => setError(e.message));
  }

  useEffect(load, []);

  async function handleDelete(id) {
    if (!confirm("Delete this document? This can't be undone.")) return;
    try {
      await api.deleteDocument(id);
      setDocuments((prev) => prev.filter((d) => d.id !== id));
    } catch (e) {
      alert(`Couldn't delete: ${e.message}`);
    }
  }

  const filtered = documents?.filter((d) => d.filename.toLowerCase().includes(query)) || [];

  return (
    <AppShell title="Library & Documents">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-bold text-xl text-ink">All uploaded documents</h2>
          <p className="text-xs text-mute mt-1">
            {documents ? `${documents.length} document${documents.length === 1 ? "" : "s"}` : "Loading…"}
            {query && ` · filtered by "${query}"`}
          </p>
        </div>
        <button
          onClick={() => navigate("/app/upload")}
          className="inline-flex items-center gap-2 bg-ink text-white text-xs font-semibold px-5 py-2.5 rounded-full hover:bg-ink-700 shadow-pill transition-all active:scale-95"
        >
          <UploadCloud size={15} /> Upload report
        </button>
      </div>

      <Card className="p-4 sm:p-6">
        {documents === null && !error && <LoadingState label="Loading documents…" />}
        {error && <ErrorState message={error} onRetry={load} />}
        {documents && filtered.length === 0 && (
          <EmptyState
            icon={Inbox}
            title={query ? "No matches" : "No documents yet"}
            description={query ? `Nothing matches "${query}".` : "Upload your first document to extract intelligence."}
            action={
              <button
                onClick={() => navigate("/app/upload")}
                className="mt-3 text-xs font-semibold bg-ink text-white px-5 py-2.5 rounded-full hover:bg-ink-700 shadow-pill transition-all"
              >
                Upload document
              </button>
            }
          />
        )}
        {documents && filtered.length > 0 && (
          <div className="divide-y divide-black/[0.04]">
            {filtered.map((doc) => (
              <DocumentCard key={doc.id} doc={doc} onDelete={handleDelete} />
            ))}
          </div>
        )}
      </Card>
    </AppShell>
  );
}
