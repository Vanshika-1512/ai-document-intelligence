import { useNavigate } from "react-router-dom";
import { FileText, MessageSquare, Trash2, GitCompareArrows } from "lucide-react";
import { StatusBadge } from "./ui.jsx";

export default function DocumentCard({ doc, onDelete, onCompareToggle, compareSelected, showActions = true }) {
  const navigate = useNavigate();

  return (
    <div className="flex items-center gap-4 p-3.5 my-1.5 hover:bg-white rounded-2xl border border-transparent hover:border-black/[0.04] hover:shadow-sm transition-all duration-200 group">
      {/* File Badge styled like the PDF card in the user mockup */}
      <div className="w-11 h-11 rounded-xl bg-ink text-white flex items-center justify-center shrink-0 text-xs font-bold uppercase shadow-sm">
        {(doc.file_type || "DOC").slice(0, 4)}
      </div>

      <button
        onClick={() => navigate(`/app/documents/${doc.id}`)}
        className="min-w-0 flex-1 text-left"
      >
        <p className="text-sm font-semibold text-ink truncate group-hover:text-ink-700">{doc.filename}</p>
        <p className="text-xs text-mute mt-0.5">
          {new Date(doc.upload_date).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
          {doc.word_count > 0 && ` · ${doc.word_count.toLocaleString()} words`}
        </p>
      </button>

      <StatusBadge status={doc.status} />

      {showActions && (
        <div className="flex items-center gap-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
          {onCompareToggle && (
            <button
              onClick={() => onCompareToggle(doc.id)}
              title="Select for comparison"
              className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${compareSelected
                  ? "bg-ink text-white shadow-pill"
                  : "bg-black/[0.04] text-mute hover:text-ink hover:bg-black/[0.08]"
                }`}
            >
              <GitCompareArrows size={14} />
            </button>
          )}
          <button
            onClick={() => navigate(`/app/documents/${doc.id}?tab=chat`)}
            title="Chat with document"
            className="w-8 h-8 rounded-full bg-black/[0.04] text-mute hover:text-ink hover:bg-black/[0.08] flex items-center justify-center transition-colors"
          >
            <MessageSquare size={14} />
          </button>
          <button
            onClick={() => navigate(`/app/documents/${doc.id}`)}
            title="Inspect"
            className="w-8 h-8 rounded-full bg-black/[0.04] text-mute hover:text-ink hover:bg-black/[0.08] flex items-center justify-center transition-colors"
          >
            <FileText size={14} />
          </button>
          {onDelete && (
            <button
              onClick={() => onDelete(doc.id)}
              title="Delete"
              className="w-8 h-8 rounded-full bg-black/[0.04] text-mute hover:text-bad hover:bg-bad/10 flex items-center justify-center transition-colors"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
