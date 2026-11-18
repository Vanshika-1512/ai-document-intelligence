import { useCallback, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowUp, FileText, Check, X, AlertCircle,
  FileSpreadsheet, FileCode, Sparkles, Scale, BookOpen,
} from "lucide-react";
import { api } from "../services/api";
import { useDocumentStatus } from "../hooks/useDocumentStatus";

const ACCEPTED = ".pdf,.docx,.txt,.csv";
const STAGES = ["uploaded", "extracting", "embedding", "analyzing", "completed"];
const STAGE_LABELS = {
  uploaded: "Queued for processing",
  extracting: "Extracting text & metadata",
  embedding: "Generating vector embeddings",
  analyzing: "Synthesizing summary & insights",
  completed: "Ready for exploration",
};

const SUPPORTED_DOCS = [
  { icon: FileText, label: "PDF Reports", desc: "Structured & scanned" },
  { icon: BookOpen, label: "Word Docs", desc: ".docx papers & notes" },
  { icon: FileSpreadsheet, label: "Data & Tables", desc: "CSV spreadsheets" },
  { icon: FileCode, label: "Plain Text", desc: "TXT transcripts & logs" },
  { icon: Sparkles, label: "Research", desc: "Academic & technical" },
  { icon: Scale, label: "Agreements", desc: "Contracts & briefs" },
];

export default function UploadZone() {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(null);
  const [documentId, setDocumentId] = useState(null);
  const [uploadError, setUploadError] = useState(null);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  const { document: doc } = useDocumentStatus(documentId);

  const handleFile = useCallback(async (file) => {
    setSelectedFile(file);
    setUploadError(null);
    setUploadProgress(10);
    try {
      const created = await api.uploadDocument(file, (p) => setUploadProgress(Math.max(15, p)));
      setDocumentId(created.id);
      setUploadProgress(100);
    } catch (e) {
      setUploadError(e.message);
      setUploadProgress(null);
    }
  }, []);

  const onDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const reset = () => {
    setSelectedFile(null);
    setDocumentId(null);
    setUploadProgress(null);
    setUploadError(null);
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return "—";
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="max-w-xl mx-auto space-y-6">
      {/* Upload card */}
      <div className="bg-white/90 backdrop-blur-md rounded-3xl border border-white/80 p-7 shadow-card">
        <div className="text-center mb-6">
          <h2 className="text-xl font-semibold text-ink">Upload your file</h2>
          <p className="text-sm text-mute mt-1">Drag & drop your file or browse from your device</p>
        </div>

        {/* Drop container */}
        <div
          onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
          onDragLeave={() => setDragActive(false)}
          onDrop={onDrop}
          onClick={() => inputRef.current?.click()}
          className={`cursor-pointer rounded-2xl border-2 border-dashed p-10 flex flex-col items-center justify-center text-center transition-all duration-300 ${
            dragActive
              ? "border-ink bg-black/[0.03] scale-[0.99]"
              : "border-mute/30 bg-[#F5F8F9]/70 hover:border-ink/50 hover:bg-[#F5F8F9]"
          }`}
        >
          <div className="w-14 h-14 rounded-full bg-white shadow-sm border border-black/[0.04] text-ink flex items-center justify-center mb-3 transition-transform hover:scale-105">
            <ArrowUp size={22} strokeWidth={2.2} />
          </div>
          <p className="font-semibold text-ink text-base">Drop your file here</p>
          <p className="text-xs text-mute mt-1">Or browse file from computer</p>
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPTED}
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
          />
        </div>

        {/* Selected file preview / Upload Progress card */}
        {(selectedFile || doc) && (
          <div className="mt-5 p-4 rounded-2xl bg-white border border-black/[0.04] shadow-sm animate-rise">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-ink text-white flex items-center justify-center text-xs font-bold uppercase shrink-0">
                {(selectedFile?.name.split(".").pop() || doc?.file_type || "DOC").slice(0, 4)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-ink truncate">
                  {selectedFile?.name || doc?.filename || "Uploaded file"}
                </p>
                <p className="text-xs text-mute mt-0.5">
                  {formatFileSize(selectedFile?.size || doc?.file_size_bytes)}
                </p>
              </div>
              <span className="text-xs font-semibold text-ink">
                {uploadProgress !== null && uploadProgress < 100 ? `${uploadProgress}%` : "Ready"}
              </span>
            </div>

            {uploadProgress !== null && uploadProgress < 100 && (
              <div className="mt-3">
                <div className="flex justify-between text-[11px] text-mute mb-1 font-medium">
                  <span>Uploading…</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="h-1.5 bg-black/[0.06] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-ink rounded-full transition-all duration-200"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Processing stages tracker */}
        {documentId && (
          <div className="mt-6 pt-6 border-t border-black/[0.05]">
            <p className="text-xs font-bold uppercase tracking-wider text-mute mb-4">Pipeline progress</p>
            {doc?.status === "failed" ? (
              <div className="flex items-start gap-3 bg-bad/10 border border-bad/20 rounded-2xl p-4">
                <AlertCircle size={18} className="text-bad shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-bad">Processing failed</p>
                  <p className="text-xs text-mute mt-1">{doc?.error_message || "Encountered an extraction error."}</p>
                </div>
              </div>
            ) : (
              <ol className="space-y-3">
                {STAGES.map((stage, i) => {
                  const currentIdx = STAGES.indexOf(doc?.status || "uploaded");
                  const done = i < currentIdx || doc?.status === "completed";
                  const active = i === currentIdx && doc?.status !== "completed";
                  return (
                    <li key={stage} className="flex items-center gap-3">
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-[11px] font-semibold transition-all ${
                          done
                            ? "bg-ink text-white"
                            : active
                            ? "bg-ink text-white ring-4 ring-ink/10"
                            : "bg-black/[0.05] text-mute"
                        }`}
                      >
                        {done ? <Check size={13} strokeWidth={2.5} /> : i + 1}
                      </div>
                      <span className={`text-sm ${done || active ? "text-ink font-medium" : "text-mute"}`}>
                        {STAGE_LABELS[stage]}
                      </span>
                      {active && <span className="w-1.5 h-1.5 rounded-full bg-ink animate-pulse ml-1" />}
                    </li>
                  );
                })}
              </ol>
            )}
          </div>
        )}

        {/* Error message */}
        {uploadError && (
          <div className="mt-4 flex items-start gap-2 bg-bad/10 border border-bad/20 rounded-2xl p-3">
            <X size={16} className="text-bad shrink-0 mt-0.5" />
            <p className="text-xs text-bad font-medium">{uploadError}</p>
          </div>
        )}

        {/* Main CTA Pill Button */}
        <div className="mt-6">
          {documentId && doc?.status === "completed" ? (
            <button
              onClick={() => navigate(`/app/documents/${documentId}`)}
              className="w-full bg-ink hover:bg-ink-700 text-white font-semibold py-4 rounded-full transition-all duration-200 shadow-pill active:scale-[0.99] flex items-center justify-center gap-2"
            >
              <Sparkles size={18} /> View Document Intelligence
            </button>
          ) : (
            <button
              onClick={() => {
                if (selectedFile && !documentId) {
                  handleFile(selectedFile);
                } else {
                  inputRef.current?.click();
                }
              }}
              className="w-full bg-ink hover:bg-ink-700 text-white font-semibold py-4 rounded-full transition-all duration-200 shadow-pill active:scale-[0.99] flex items-center justify-center gap-2"
            >
              Analyze with AI
            </button>
          )}

          {documentId && (
            <button
              onClick={reset}
              className="w-full mt-2.5 text-xs text-mute hover:text-ink font-semibold py-2 transition-colors text-center"
            >
              Upload another file
            </button>
          )}
        </div>
      </div>

      {/* Supported reports grid */}
      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-mute mb-3 px-1">Supported document types</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {SUPPORTED_DOCS.map(({ icon: Icon, label, desc }) => (
            <div
              key={label}
              className="bg-white/80 backdrop-blur-md rounded-2xl border border-white/70 p-4 shadow-sm hover:shadow-card hover:-translate-y-0.5 transition-all duration-200 flex flex-col items-center text-center"
            >
              <div className="w-10 h-10 rounded-xl bg-black/[0.04] text-ink flex items-center justify-center mb-2.5">
                <Icon size={18} strokeWidth={1.8} />
              </div>
              <p className="font-semibold text-xs text-ink">{label}</p>
              <p className="text-[11px] text-mute mt-0.5">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
