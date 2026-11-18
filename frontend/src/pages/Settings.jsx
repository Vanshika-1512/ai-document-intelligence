import { useState } from "react";
import { Trash2, Info, Sparkles, Database, SlidersHorizontal } from "lucide-react";
import AppShell from "../components/AppShell.jsx";
import { Card } from "../components/ui.jsx";
import { api } from "../services/api";

export default function Settings() {
  const [theme, setTheme] = useState("light");
  const [language, setLanguage] = useState("English");
  const [summaryLength, setSummaryLength] = useState("Balanced");
  const [retrievalDepth, setRetrievalDepth] = useState(4);
  const [clearing, setClearing] = useState(false);
  const [clearMessage, setClearMessage] = useState(null);

  async function handleClearAll() {
    if (!confirm("Delete every uploaded document? This can't be undone.")) return;
    setClearing(true);
    setClearMessage(null);
    try {
      const docs = await api.listDocuments();
      await Promise.all(docs.map((d) => api.deleteDocument(d.id)));
      setClearMessage(`Deleted ${docs.length} document(s).`);
    } catch (e) {
      setClearMessage(`Couldn't clear storage: ${e.message}`);
    } finally {
      setClearing(false);
    }
  }

  return (
    <AppShell title="Preferences">
      <div className="mb-6 max-w-2xl">
        <h2 className="font-bold text-xl text-ink">System Preferences</h2>
        <p className="text-xs text-mute mt-1">
          Pipeline configuration and local session settings.
        </p>
      </div>

      <div className="max-w-2xl space-y-6">
        <SettingsSection icon={SlidersHorizontal} title="General">
          <Row label="Interface Theme">
            <SegmentedControl value={theme} onChange={setTheme} options={["light", "dark"]} disabled />
          </Row>
          <Row label="Language">
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="bg-paper-light border border-black/[0.04] rounded-2xl px-4 py-2 text-xs font-semibold text-ink outline-none cursor-pointer"
            >
              <option>English</option>
              <option>Spanish</option>
              <option>French</option>
              <option>Hindi</option>
            </select>
          </Row>
        </SettingsSection>

        <SettingsSection icon={Sparkles} title="AI settings">
          <Row label="Model">
            <span className="text-xs text-mute font-medium">Local open-source pipeline (spaCy + sentence-transformers + DistilBERT)</span>
          </Row>
          <Row label="Summary length">
            <SegmentedControl value={summaryLength} onChange={setSummaryLength} options={["Concise", "Balanced", "Detailed"]} />
          </Row>
          <Row label="Retrieval depth (top-k chunks)">
            <input
              type="range"
              min="2"
              max="8"
              value={retrievalDepth}
              onChange={(e) => setRetrievalDepth(Number(e.target.value))}
              className="w-36 accent-ink cursor-pointer"
            />
            <span className="text-xs font-bold text-ink ml-3 font-mono">{retrievalDepth} chunks</span>
          </Row>
        </SettingsSection>

        <SettingsSection icon={Database} title="Storage">
          <Row label="Uploaded documents">
            <button
              onClick={handleClearAll}
              disabled={clearing}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-bad hover:underline disabled:opacity-50"
            >
              <Trash2 size={14} /> {clearing ? "Clearing storage…" : "Clear all documents"}
            </button>
          </Row>
          {clearMessage && <p className="text-xs text-mute mt-2">{clearMessage}</p>}
        </SettingsSection>

        <SettingsSection icon={Info} title="About DocIntel">
          <Row label="Version">
            <span className="text-xs font-mono font-semibold text-ink">1.0.0</span>
          </Row>
          <Row label="Architecture">
            <span className="text-xs text-mute">FastAPI · SQLite · sentence-transformers · React 19 · Tailwind</span>
          </Row>
        </SettingsSection>
      </div>
    </AppShell>
  );
}

function SettingsSection({ icon: Icon, title, children }) {
  return (
    <Card className="p-6">
      <div className="flex items-center gap-2.5 mb-5 pb-3 border-b border-black/[0.04]">
        <div className="w-8 h-8 rounded-xl bg-black/[0.04] text-ink flex items-center justify-center">
          <Icon size={16} strokeWidth={2} />
        </div>
        <h3 className="font-bold text-sm text-ink">{title}</h3>
      </div>
      <div className="space-y-4">{children}</div>
    </Card>
  );
}

function Row({ label, children }) {
  return (
    <div className="flex items-center justify-between gap-4 flex-wrap">
      <span className="text-xs font-semibold text-ink/80">{label}</span>
      <div className="flex items-center">{children}</div>
    </div>
  );
}

function SegmentedControl({ value, onChange, options, disabled }) {
  return (
    <div className="inline-flex bg-paper-light border border-black/[0.04] rounded-full p-1 shadow-inner">
      {options.map((opt) => (
        <button
          key={opt}
          disabled={disabled}
          onClick={() => onChange(opt)}
          className={`px-3.5 py-1.5 text-xs font-semibold rounded-full capitalize transition-all disabled:opacity-50 ${
            value === opt ? "bg-ink text-white shadow-sm" : "text-mute hover:text-ink"
          }`}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}
