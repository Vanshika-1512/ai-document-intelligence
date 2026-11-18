import { Loader2, FileWarning, Inbox } from "lucide-react";

export function Card({ children, className = "", hover = false }) {
  return (
    <div
      className={`bg-white/90 backdrop-blur-md border border-white/80 rounded-3xl shadow-card transition-all duration-300 ${
        hover ? "hover:shadow-card-hover hover:-translate-y-0.5" : ""
      } ${className}`}
    >
      {children}
    </div>
  );
}

export function PillButton({ children, className = "", variant = "primary", onClick, disabled, ...props }) {
  const base =
    "inline-flex items-center justify-center gap-2 text-sm font-semibold rounded-full px-6 py-3 transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none";
  const variants = {
    primary: "bg-ink hover:bg-ink-700 text-white shadow-pill",
    secondary: "bg-white/80 hover:bg-white text-ink border border-black/[0.05] shadow-sm",
    accent: "bg-[#00D2EE] hover:bg-[#00B4D8] text-ink font-bold shadow-md",
    ghost: "bg-transparent hover:bg-black/5 text-ink/80",
  };
  return (
    <button
      className={`${base} ${variants[variant] || variants.primary} ${className}`}
      onClick={onClick}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}

export function Chip({ active = false, label, count, onClick, className = "" }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-full text-xs font-medium transition-all duration-200 inline-flex items-center gap-1.5 ${
        active
          ? "bg-ink text-white shadow-sm"
          : "bg-white/70 hover:bg-white text-mute hover:text-ink border border-black/[0.04]"
      } ${className}`}
    >
      <span>{label}</span>
      {count !== undefined && (
        <span
          className={`text-[10px] px-1.5 py-0.5 rounded-full ${
            active ? "bg-white/20 text-white" : "bg-black/5 text-mute"
          }`}
        >
          {count}
        </span>
      )}
    </button>
  );
}

export function LoadingState({ label = "Loading…" }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-mute gap-3">
      <div className="w-10 h-10 rounded-full bg-white/80 shadow-sm flex items-center justify-center">
        <Loader2 size={20} className="animate-spin text-ink" />
      </div>
      <p className="text-sm font-medium">{label}</p>
    </div>
  );
}

export function ErrorState({ message = "Something went wrong.", onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
      <div className="w-12 h-12 rounded-full bg-bad/10 text-bad flex items-center justify-center shadow-sm">
        <FileWarning size={22} />
      </div>
      <p className="text-sm text-ink/85 font-medium max-w-sm">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-1 text-xs font-semibold px-4 py-2 rounded-full bg-ink text-white hover:bg-ink-700 transition-colors shadow-sm"
        >
          Try again
        </button>
      )}
    </div>
  );
}

export function EmptyState({ icon: Icon = Inbox, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center gap-3 px-6">
      <div className="w-14 h-14 rounded-full bg-white shadow-sm border border-black/[0.04] text-ink flex items-center justify-center">
        <Icon size={24} strokeWidth={1.75} />
      </div>
      <h3 className="font-semibold text-lg text-ink">{title}</h3>
      {description && <p className="text-sm text-mute max-w-sm leading-relaxed">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

const STATUS_STYLES = {
  uploaded: "bg-black/[0.04] text-mute border border-black/[0.04]",
  extracting: "bg-warn/10 text-warn border border-warn/20",
  analyzing: "bg-warn/10 text-warn border border-warn/20",
  embedding: "bg-warn/10 text-warn border border-warn/20",
  completed: "bg-good/10 text-good border border-good/20",
  failed: "bg-bad/10 text-bad border border-bad/20",
};

const STATUS_LABELS = {
  uploaded: "Queued",
  extracting: "Extracting",
  analyzing: "Analyzing",
  embedding: "Embedding",
  completed: "Completed",
  failed: "Failed",
};

export function StatusBadge({ status }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${
        STATUS_STYLES[status] || "bg-black/[0.04] text-mute border border-black/[0.04]"
      }`}
    >
      {status !== "completed" && status !== "failed" && (
        <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
      )}
      {STATUS_LABELS[status] || status}
    </span>
  );
}

export function ConfidenceBar({ value, label = "Confidence" }) {
  const pct = Math.round((value || 0) * 100);
  return (
    <div>
      <div className="flex items-center justify-between text-xs text-mute mb-2">
        <span className="font-medium">{label}</span>
        <span className="font-semibold text-ink">{pct}%</span>
      </div>
      <div className="h-2 bg-black/[0.06] rounded-full overflow-hidden p-0.5">
        <div
          className="h-full bg-ink rounded-full transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

const ENTITY_COLORS = {
  PERSON: "bg-white/80 text-ink border border-black/[0.05]",
  ORGANIZATION: "bg-white/80 text-ink border border-black/[0.05]",
  LOCATION: "bg-white/80 text-ink border border-black/[0.05]",
  DATE: "bg-white/80 text-ink border border-black/[0.05]",
  MONEY: "bg-white/80 text-ink border border-black/[0.05]",
  PERCENT: "bg-white/80 text-ink border border-black/[0.05]",
  EVENT: "bg-white/80 text-ink border border-black/[0.05]",
  PRODUCT: "bg-white/80 text-ink border border-black/[0.05]",
};

export function EntityTag({ text, label, count }) {
  const style = ENTITY_COLORS[label] || "bg-white/80 text-ink border border-black/[0.05]";
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium shadow-sm ${style}`}>
      <span className="text-[10px] uppercase font-bold text-mute">{label}</span>
      <span className="text-ink">{text}</span>
      {count > 1 && <span className="opacity-50 text-[11px]">×{count}</span>}
    </span>
  );
}
