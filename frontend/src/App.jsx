import { Routes, Route } from "react-router-dom";
import Landing from "./pages/Landing.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Documents from "./pages/Documents.jsx";
import Upload from "./pages/Upload.jsx";
import DocumentAnalysis from "./pages/DocumentAnalysis.jsx";
import Compare from "./pages/Compare.jsx";
import Insights from "./pages/Insights.jsx";
import History from "./pages/History.jsx";
import Settings from "./pages/Settings.jsx";
import NotFound from "./pages/NotFound.jsx";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/app" element={<Dashboard />} />
      <Route path="/app/documents" element={<Documents />} />
      <Route path="/app/documents/:id" element={<DocumentAnalysis />} />
      <Route path="/app/upload" element={<Upload />} />
      <Route path="/app/compare" element={<Compare />} />
      <Route path="/app/insights" element={<Insights />} />
      <Route path="/app/history" element={<History />} />
      <Route path="/app/settings" element={<Settings />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
