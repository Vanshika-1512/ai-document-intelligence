import AppShell from "../components/AppShell.jsx";
import UploadZone from "../components/UploadZone.jsx";

export default function Upload() {
  return (
    <AppShell title="Upload">
      <div className="mb-6">
        <h2 className="font-display font-semibold text-xl">Upload a document</h2>
        <p className="text-sm text-mute mt-1">The pipeline extracts, embeds, and analyzes it automatically.</p>
      </div>
      <UploadZone />
    </AppShell>
  );
}
