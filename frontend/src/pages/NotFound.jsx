import { useNavigate } from "react-router-dom";
import { FileQuestion } from "lucide-react";

export default function NotFound() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-paper px-6 text-center">
      <div className="w-14 h-14 rounded-full bg-signal-50 text-signal flex items-center justify-center">
        <FileQuestion size={26} />
      </div>
      <h1 className="font-display font-semibold text-2xl">Page not found</h1>
      <p className="text-sm text-mute max-w-sm">The page you're looking for doesn't exist or has moved.</p>
      <button
        onClick={() => navigate("/")}
        className="bg-ink text-white text-sm font-medium px-5 py-2.5 rounded-lg hover:bg-ink-700 transition-colors"
      >
        Go home
      </button>
    </div>
  );
}
