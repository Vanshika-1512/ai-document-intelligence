import { useNavigate } from "react-router-dom";
import { Search, Bell, Menu } from "lucide-react";

export default function Navbar({ onMenuClick, title }) {
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-20 h-20 bg-paper/60 backdrop-blur-md border-b border-black/[0.04] flex items-center justify-between gap-4 px-6 lg:px-10">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="lg:hidden w-10 h-10 rounded-full bg-white/90 shadow-sm flex items-center justify-center text-ink/80 hover:text-ink transition-colors"
          aria-label="Open menu"
        >
          <Menu size={20} />
        </button>
        {title && (
          <h1 className="font-semibold text-xl text-ink tracking-tight hidden sm:block">
            {title}
          </h1>
        )}
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden md:flex items-center gap-2.5 bg-white/90 border border-white/80 shadow-sm rounded-full px-4 py-2 w-72 focus-within:w-80 focus-within:border-ink/20 transition-all duration-300">
          <Search size={16} className="text-mute" />
          <input
            type="search"
            placeholder="Search documents or topics…"
            className="bg-transparent outline-none text-sm w-full placeholder:text-mute/70 text-ink"
            onKeyDown={(e) => {
              if (e.key === "Enter" && e.currentTarget.value.trim()) {
                navigate(`/app/documents?q=${encodeURIComponent(e.currentTarget.value.trim())}`);
              }
            }}
          />
        </div>

        <button
          className="relative w-10 h-10 rounded-full bg-white/90 shadow-sm border border-white/80 text-mute hover:text-ink flex items-center justify-center transition-all duration-200"
          aria-label="Notifications"
        >
          <Bell size={18} />
          <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-ink" />
        </button>

        <div className="w-10 h-10 rounded-full bg-ink text-white flex items-center justify-center text-sm font-semibold shadow-pill">
          AI
        </div>
      </div>
    </header>
  );
}
