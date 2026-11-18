import { useEffect, useState } from "react";
import { History as HistoryIcon } from "lucide-react";
import AppShell from "../components/AppShell.jsx";
import { Card, LoadingState, ErrorState, EmptyState, StatusBadge } from "../components/ui.jsx";
import { api } from "../services/api";
import { useNavigate } from "react-router-dom";

export default function History() {
  const [documents, setDocuments] = useState(null);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  function load() {
    setError(null);
    api.listDocuments().then(setDocuments).catch((e) => setError(e.message));
  }
  useEffect(load, []);

  return (
    <AppShell title="Processing History">
      <div className="mb-6">
        <h2 className="font-bold text-xl text-ink">Ingestion & Processing History</h2>
        <p className="text-xs text-mute mt-1">Every document parsed through the transformer pipeline.</p>
      </div>

      <Card className="overflow-hidden p-2 sm:p-4">
        {documents === null && !error && <LoadingState label="Loading history…" />}
        {error && <ErrorState message={error} onRetry={load} />}
        {documents && documents.length === 0 && (
          <EmptyState icon={HistoryIcon} title="No history yet" description="Documents you process will show up here." />
        )}
        {documents && documents.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs font-bold text-mute uppercase tracking-wider border-b border-black/[0.04]">
                  <th className="px-5 py-3.5">Filename</th>
                  <th className="px-5 py-3.5">Format</th>
                  <th className="px-5 py-3.5">Uploaded</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/[0.03]">
                {documents.map((doc) => (
                  <tr
                    key={doc.id}
                    className="hover:bg-white/80 cursor-pointer transition-colors"
                    onClick={() => navigate(`/app/documents/${doc.id}`)}
                  >
                    <td className="px-5 py-4 font-semibold text-ink">{doc.filename}</td>
                    <td className="px-5 py-4 text-mute uppercase text-xs font-mono">{doc.file_type}</td>
                    <td className="px-5 py-4 text-mute text-xs">
                      {new Date(doc.upload_date).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}
                    </td>
                    <td className="px-5 py-4"><StatusBadge status={doc.status} /></td>
                    <td className="px-5 py-4 text-ink font-semibold text-xs text-right">
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-black/[0.04] hover:bg-ink hover:text-white transition-colors">
                        Inspect →
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </AppShell>
  );
}
