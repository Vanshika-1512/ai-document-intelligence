import { NavLink } from "react-router-dom";
import {
  LayoutGrid, FileStack, UploadCloud,
  Sparkles, GitCompareArrows, History, Settings, ScanText, X,
} from "lucide-react";

const NAV_ITEMS = [
  { to: "/app", label: "Dashboard", icon: LayoutGrid, end: true },
  { to: "/app/documents", label: "Documents", icon: FileStack },
  { to: "/app/upload", label: "Upload report", icon: UploadCloud },
  { to: "/app/insights", label: "Insights", icon: Sparkles },
  { to: "/app/compare", label: "Compare", icon: GitCompareArrows },
  { to: "/app/history", label: "History", icon: History },
  { to: "/app/settings", label: "Settings", icon: Settings },
];

export default function Sidebar({ open, onClose }) {
  return (
    <>
      {open && (
        <div
          className="fixed inset-0 bg-ink/30 backdrop-blur-sm z-30 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}
      <aside
        className={`fixed lg:sticky top-0 h-screen w-64 bg-white/80 backdrop-blur-xl border-r border-black/[0.05] text-ink flex flex-col z-40
        transform transition-transform duration-300 ease-out ${open ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0`}
      >
        <div className="flex items-center justify-between px-6 h-20 border-b border-black/[0.04]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-ink flex items-center justify-center text-white relative shadow-sm overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-tr from-accent-cyan/20 to-transparent" />
              <ScanText size={20} strokeWidth={2} className="relative z-10" />
            </div>
            <div>
              <span className="font-semibold text-base tracking-tight text-ink block">DocIntel</span>
              <span className="text-[11px] text-mute block -mt-0.5 font-medium">Document Intelligence</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden text-mute hover:text-ink w-8 h-8 rounded-full bg-black/5 flex items-center justify-center"
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto scrollbar-thin">
          {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3.5 px-4 py-3 rounded-2xl text-[14px] font-medium transition-all duration-200 ${
                  isActive
                    ? "bg-ink text-white shadow-pill font-semibold"
                    : "text-mute hover:text-ink hover:bg-black/[0.03]"
                }`
              }
            >
              <Icon size={18} strokeWidth={2} />
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>
    </>
  );
}
