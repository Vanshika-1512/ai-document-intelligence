import { useNavigate } from "react-router-dom";
import {
  ScanText, FileSearch, Sparkles, Shapes, MessageCircleQuestion,
  Tags, UploadCloud, Code2, ArrowUpRight, CheckCircle2,
  FileSpreadsheet, BookOpen, Scale, FileCode,
} from "lucide-react";

const FEATURES = [
  { icon: FileSearch, title: "Smart Extraction", body: "Extract text, layout, and reading stats automatically from PDFs, Word docs, and spreadsheets." },
  { icon: Sparkles, title: "Hierarchical Summaries", body: "Short, detailed, and key-point summaries synthesized hierarchically across long documents." },
  { icon: Shapes, title: "Explainable Classification", body: "Classify documents into research, contracts, reports, and invoices with visible confidence scores." },
  { icon: MessageCircleQuestion, title: "Grounded Chat Assistant", body: "Ask detailed questions and receive answers synthesized directly from retrieved passages with citations." },
  { icon: Tags, title: "Named Entity Detection", body: "Extract people, organizations, locations, currencies, and percentages powered by spaCy." },
  { icon: ScanText, title: "Dense Semantic Search", body: "Search documents by conceptual meaning via sentence-transformer vector embeddings." },
];

const SUPPORTED_REPORTS = [
  { icon: ScanText, title: "PDF Reports", desc: "Digital & scanned documents" },
  { icon: BookOpen, title: "Word Documents", desc: ".docx manuscripts & notes" },
  { icon: FileSpreadsheet, title: "Data Spreadsheets", desc: "CSV tables & financial rows" },
  { icon: FileCode, title: "Plain Text", desc: "TXT transcripts & raw logs" },
  { icon: Sparkles, title: "Research Papers", desc: "Academic papers & citations" },
  { icon: Scale, title: "Contracts & Briefs", desc: "Legal agreements & clauses" },
];

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="bg-paper min-h-screen text-ink selection:bg-ink selection:text-white">
      {/* Top Navigation */}
      <header className="max-w-7xl mx-auto flex items-center justify-between px-6 py-6 lg:px-12">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-ink flex items-center justify-center text-white shadow-pill relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-tr from-accent-cyan/30 to-transparent" />
            <ScanText size={20} strokeWidth={2} className="relative z-10" />
          </div>
          <div>
            <span className="font-bold text-lg tracking-tight text-ink block">DocIntel</span>
            <span className="text-[11px] text-mute block -mt-1 font-medium">Document Intelligence</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/app")}
            className="text-xs font-semibold text-ink px-4 py-2.5 rounded-full bg-white/80 hover:bg-white border border-black/[0.04] shadow-sm transition-all"
          >
            Dashboard
          </button>
          <button
            onClick={() => navigate("/app/upload")}
            className="text-xs font-semibold bg-ink text-white px-5 py-2.5 rounded-full hover:bg-ink-700 shadow-pill transition-all active:scale-95"
          >
            Upload report
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-6 pt-10 pb-20 lg:px-12 grid lg:grid-cols-12 gap-12 items-center">
        <div className="lg:col-span-6 space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/80 border border-white/90 shadow-sm text-xs font-medium text-ink">
            <span className="w-2 h-2 rounded-full bg-good animate-pulse" />
            <span>100% Private Local Transformer Pipeline</span>
          </div>

          <h1 className="font-extrabold text-4xl sm:text-5xl lg:text-[3.25rem] leading-[1.1] tracking-tight text-ink">
            Turn complex documents into clear intelligence
          </h1>

          <p className="text-base sm:text-lg text-mute max-w-lg leading-relaxed">
            Upload any medical report, research paper, contract, or dataset. DocIntel summarizes, classifies, and answers your questions with zero hallucinations.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            <button
              onClick={() => navigate("/app/upload")}
              className="inline-flex items-center gap-2 bg-ink hover:bg-ink-700 text-white text-sm font-semibold px-7 py-4 rounded-full shadow-pill hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              <UploadCloud size={18} /> Upload document
            </button>
            <button
              onClick={() => navigate("/app")}
              className="inline-flex items-center gap-2 bg-white/80 hover:bg-white text-ink text-sm font-semibold px-6 py-4 rounded-full border border-black/[0.04] shadow-sm transition-all"
            >
              Explore workspace <ArrowUpRight size={16} />
            </button>
          </div>

          {/* Value bullets */}
          <div className="pt-4 flex flex-wrap gap-y-2 gap-x-6 text-xs text-mute font-medium">
            <span className="flex items-center gap-1.5 text-ink/80">
              <CheckCircle2 size={15} className="text-good" /> Verifiable citations
            </span>
            <span className="flex items-center gap-1.5 text-ink/80">
              <CheckCircle2 size={15} className="text-good" /> Offline & private
            </span>
            <span className="flex items-center gap-1.5 text-ink/80">
              <CheckCircle2 size={15} className="text-good" /> Multi-format support
            </span>
          </div>
        </div>

        {/* Hero Interactive Device Mockup (Styled directly like the middle phone mockup) */}
        <div className="lg:col-span-6 flex justify-center">
          <div className="relative w-full max-w-md">
            {/* Ambient background glow */}
            <div className="absolute -inset-4 bg-gradient-to-r from-accent-cyan/20 to-accent-teal/20 rounded-[3rem] blur-2xl" />

            {/* Mobile device frame styled after the user's uploaded mockup */}
            <div className="relative bg-gradient-to-b from-[#E7EFF1] via-[#DCE5E7] to-[#D0DDE1] rounded-[2.75rem] p-5 shadow-2xl border-4 border-white/80 overflow-hidden">
              {/* Dynamic Island / Header */}
              <div className="flex items-center justify-between px-3 pt-1 pb-4">
                <span className="text-xs font-semibold text-ink">9:41</span>
                <div className="w-20 h-5 bg-ink rounded-full mx-auto" />
                <span className="text-xs font-semibold text-ink">100%</span>
              </div>

              {/* Inner card container */}
              <div className="bg-white/90 backdrop-blur-md rounded-3xl p-6 shadow-sm border border-white/80 text-center">
                <p className="text-xs font-bold uppercase tracking-wider text-mute">Intelligence Assistant</p>
                <h3 className="text-xl font-bold text-ink mt-1">What would you like to know?</h3>
                <p className="text-xs text-mute mt-1 max-w-xs mx-auto">
                  Describe what you're seeking. DocIntel will extract and synthesize verified insights.
                </p>

                {/* Glowing 3D Orb centerpiece directly matching the user's image */}
                <div className="relative w-32 h-32 mx-auto my-6 flex items-center justify-center">
                  <div className="absolute inset-0 rounded-full bg-accent-cyan/30 blur-2xl animate-pulseGlow" />
                  <div className="relative w-28 h-28 rounded-full bg-gradient-to-tr from-[#0284C7] via-[#00D2EE] to-[#80F2FF] shadow-orb flex items-center justify-center overflow-hidden border-2 border-white/80 animate-floatOrb">
                    <div className="absolute inset-1.5 rounded-full bg-gradient-to-b from-white/50 via-transparent to-black/30" />
                    <div className="w-12 h-12 rounded-full bg-white/35 backdrop-blur-md flex items-center justify-center shadow-inner">
                      <Sparkles size={24} className="text-white drop-shadow" />
                    </div>
                  </div>
                </div>

                {/* Pill Chips row matching [Headache] [Fever] [Cough] from mockup */}
                <div className="flex items-center justify-center gap-2 overflow-x-auto py-1">
                  <span className="text-xs font-semibold bg-ink text-white px-4 py-1.5 rounded-full shadow-sm">
                    Summary
                  </span>
                  <span className="text-xs font-medium bg-black/[0.04] text-ink px-3 py-1.5 rounded-full">
                    Key findings
                  </span>
                  <span className="text-xs font-medium bg-black/[0.04] text-ink px-3 py-1.5 rounded-full">
                    Entities
                  </span>
                  <span className="text-xs font-medium bg-black/[0.04] text-ink px-3 py-1.5 rounded-full">
                    Extract
                  </span>
                </div>

                {/* Bottom interactive chat pill */}
                <div className="mt-5 bg-paper-light/80 rounded-2xl p-3 border border-black/[0.03] flex items-center justify-between text-left">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-good" />
                    <span className="text-xs text-mute font-medium truncate">Ask anything about this document…</span>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-ink text-white flex items-center justify-center shrink-0 shadow-pill">
                    <ArrowUpRight size={14} />
                  </div>
                </div>
              </div>

              {/* Bottom bar pill button matching the mockup */}
              <div className="mt-4">
                <button
                  onClick={() => navigate("/app/upload")}
                  className="w-full bg-ink text-white py-3.5 rounded-full text-xs font-semibold shadow-pill hover:bg-ink-700 transition-all flex items-center justify-center gap-2"
                >
                  <Sparkles size={14} /> Analyze report with DocIntel
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Supported Reports Grid (Matching the right phone mockup) */}
      <section className="max-w-7xl mx-auto px-6 py-16 lg:px-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-mute">Multi-Format Ingestion</p>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-ink mt-1">Supported reports & documents</h2>
          </div>
          <p className="text-sm text-mute mt-2 md:mt-0 max-w-md">
            Any textual or structured file format is parsed, indexed, and made queryable locally.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {SUPPORTED_REPORTS.map(({ icon: Icon, title, desc }) => (
            <div
              key={title}
              className="bg-white/90 backdrop-blur-md rounded-3xl p-5 border border-white/80 shadow-card hover:shadow-card-hover hover:-translate-y-1 transition-all duration-300 flex flex-col items-center text-center group"
            >
              <div className="w-12 h-12 rounded-2xl bg-black/[0.04] text-ink group-hover:bg-ink group-hover:text-white transition-colors flex items-center justify-center mb-3">
                <Icon size={20} strokeWidth={1.8} />
              </div>
              <h3 className="font-semibold text-xs text-ink">{title}</h3>
              <p className="text-[11px] text-mute mt-1 leading-snug">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section className="max-w-7xl mx-auto px-6 py-16 lg:px-12">
        <div className="text-center max-w-xl mx-auto mb-12">
          <p className="text-xs font-bold uppercase tracking-wider text-mute">Automated Intelligence</p>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-ink mt-1">Six NLP pipelines in one click</h2>
          <p className="text-sm text-mute mt-2">
            Every document uploaded undergoes simultaneous extraction, chunking, vector embedding, and semantic understanding.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map(({ icon: Icon, title, body }) => (
            <div
              key={title}
              className="bg-white/90 backdrop-blur-md border border-white/80 rounded-3xl p-6 shadow-card hover:shadow-card-hover hover:-translate-y-1 transition-all duration-300"
            >
              <div className="w-11 h-11 rounded-2xl bg-black/[0.04] text-ink flex items-center justify-center mb-4">
                <Icon size={20} strokeWidth={2} />
              </div>
              <h3 className="font-bold text-base text-ink mb-2">{title}</h3>
              <p className="text-sm text-mute leading-relaxed">{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Verified Metrics Section */}
      <section className="max-w-7xl mx-auto px-6 py-12 lg:px-12">
        <div className="bg-white/90 backdrop-blur-md rounded-3xl border border-white/80 p-8 lg:p-12 shadow-card grid grid-cols-2 lg:grid-cols-4 gap-8 text-center sm:text-left">
          {[
            ["4", "File formats parsed natively"],
            ["6", "NLP analytical stages"],
            ["<2s", "Extractive QA retrieval latency"],
            ["100%", "Grounded local AI model pipeline"],
          ].map(([value, label]) => (
            <div key={label}>
              <p className="font-extrabold text-3xl sm:text-4xl text-ink tracking-tight">{value}</p>
              <p className="text-xs text-mute font-medium mt-1.5">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="max-w-7xl mx-auto px-6 py-12 lg:px-12 flex flex-col sm:flex-row justify-between items-center gap-4 border-t border-black/[0.05]">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-ink flex items-center justify-center text-white">
            <ScanText size={13} />
          </div>
          <span className="text-xs font-semibold text-mute">© 2026 DocIntel — Local AI Document Intelligence</span>
        </div>
        <div className="flex gap-6 text-xs text-mute font-medium">
          <button onClick={() => navigate("/app")} className="hover:text-ink transition-colors">Workspace</button>
          <button onClick={() => navigate("/app/upload")} className="hover:text-ink transition-colors">Upload</button>
          <button onClick={() => navigate("/app/documents")} className="hover:text-ink transition-colors">Library</button>
        </div>
      </footer>
    </div>
  );
}