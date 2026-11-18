import { useEffect, useState } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { Sparkles } from "lucide-react";
import AppShell from "../components/AppShell.jsx";
import { Card, LoadingState, EmptyState } from "../components/ui.jsx";
import { api } from "../services/api";

const COLORS = ["#5B5FEE", "#8B7FFF", "#12B76A", "#F79009", "#F04438", "#0E7490", "#BE185D", "#A16207"];

export default function Insights() {
  const [documents, setDocuments] = useState(null);
  const [analyses, setAnalyses] = useState({});

  useEffect(() => {
    api.listDocuments().then(async (docs) => {
      setDocuments(docs);
      const completed = docs.filter((d) => d.status === "completed");
      const results = {};
      await Promise.all(
        completed.map(async (d) => {
          try {
            results[d.id] = await api.getAnalysis(d.id);
          } catch (_) {}
        })
      );
      setAnalyses(results);
    }).catch(() => setDocuments([]));
  }, []);

  if (documents === null) {
    return (
      <AppShell title="Insights">
        <LoadingState label="Crunching numbers…" />
      </AppShell>
    );
  }

  const completed = documents.filter((d) => d.status === "completed");

  if (completed.length === 0) {
    return (
      <AppShell title="Insights">
        <Card className="p-2">
          <EmptyState icon={Sparkles} title="No insights yet" description="Process at least one document to see aggregate stats here." />
        </Card>
      </AppShell>
    );
  }

  const totalWords = completed.reduce((s, d) => s + d.word_count, 0);
  const totalChars = completed.reduce((s, d) => s + d.char_count, 0);
  const totalSentences = completed.reduce((s, d) => s + d.sentence_count, 0);
  const totalPages = completed.reduce((s, d) => s + d.page_count, 0);
  const totalReadingTime = completed.reduce((s, d) => s + d.reading_time_minutes, 0);

  const classificationCounts = {};
  Object.values(analyses).forEach((a) => {
    if (a?.classification_label) classificationCounts[a.classification_label] = (classificationCounts[a.classification_label] || 0) + 1;
  });
  const classificationData = Object.entries(classificationCounts).map(([name, value]) => ({ name, value }));

  const stats = [
    ["Total words", totalWords.toLocaleString()],
    ["Total characters", totalChars.toLocaleString()],
    ["Total sentences", totalSentences.toLocaleString()],
    ["Total pages", totalPages.toLocaleString()],
    ["Combined reading time", `${totalReadingTime.toFixed(0)} min`],
    ["Documents analyzed", completed.length],
  ];

  return (
    <AppShell title="System Insights">
      <div className="mb-6">
        <h2 className="font-bold text-xl text-ink">Corpus Analytics</h2>
        <p className="text-xs text-mute mt-1">Aggregate statistics across all processed documents and reports.</p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {stats.map(([label, value]) => (
          <Card key={label} className="p-5" hover>
            <p className="text-xs font-semibold text-mute">{label}</p>
            <p className="font-bold text-2xl text-ink mt-2 tracking-tight">{value}</p>
          </Card>
        ))}
      </div>

      {classificationData.length > 0 && (
        <Card className="p-6">
          <h3 className="font-bold text-base text-ink mb-1">Documents by classification</h3>
          <p className="text-xs text-mute mb-4">Distribution across categories</p>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={classificationData} dataKey="value" nameKey="name" innerRadius={60} outerRadius={95} paddingAngle={2}>
                {classificationData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "rgba(255,255,255,0.95)",
                  borderRadius: "16px",
                  border: "1px solid rgba(0,0,0,0.05)",
                  boxShadow: "0 10px 25px -5px rgba(0,0,0,0.1)",
                  fontSize: "12px",
                  fontWeight: 600,
                }}
              />
              <Legend wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      )}
    </AppShell>
  );
}
