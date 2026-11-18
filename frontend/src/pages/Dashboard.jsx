import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BarChart, Bar, XAxis, ResponsiveContainer, Tooltip, CartesianGrid } from "recharts";
import { FileStack, Sparkles, MessagesSquare, Timer, UploadCloud, GitCompareArrows, Inbox, Activity } from "lucide-react";
import AppShell from "../components/AppShell.jsx";
import { Card, LoadingState, EmptyState } from "../components/ui.jsx";
import DocumentCard from "../components/DocumentCard.jsx";
import { api } from "../services/api";

export default function Dashboard() {
  const [documents, setDocuments] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    api.listDocuments().then(setDocuments).catch(() => setDocuments([]));
  }, []);

  if (documents === null) {
    return (
      <AppShell title="Dashboard">
        <LoadingState label="Loading intelligence dashboard…" />
      </AppShell>
    );
  }

  const completed = documents.filter((d) => d.status === "completed");
  const questionsAsked = 0;
  const avgTime =
    completed.length > 0
      ? (completed.reduce((sum, d) => sum + (d.processing_time_seconds || 0), 0) / completed.length).toFixed(1)
      : "—";

  const activityData = buildActivityData(documents);
  const totalUploadsThisWeek = activityData.reduce((acc, d) => acc + d.count, 0);

  const cards = [
    { label: "Total files", value: documents.length, icon: FileStack },
    { label: "Analyzed documents", value: completed.length, icon: Sparkles },
    { label: "Avg. turnaround", value: avgTime === "—" ? "—" : `${avgTime}s`, icon: Timer },
    { label: "AI queries resolved", value: questionsAsked, icon: MessagesSquare },
  ];

  return (
    <AppShell title="Health & Document Insights">
      {/* Metrics Row */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {cards.map(({ label, value, icon: Icon }) => (
          <Card key={label} className="p-5" hover>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-mute">{label}</span>
              <div className="w-9 h-9 rounded-2xl bg-black/[0.04] text-ink flex items-center justify-center">
                <Icon size={16} strokeWidth={2} />
              </div>
            </div>
            <p className="font-bold text-2xl text-ink tracking-tight">{value}</p>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent Documents Section */}
        <Card className="lg:col-span-2 p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="font-semibold text-lg text-ink">Recent files & reports</h2>
              <p className="text-xs text-mute mt-0.5">Documents ingested into local vector storage</p>
            </div>
            <button
              onClick={() => navigate("/app/documents")}
              className="text-xs font-semibold text-ink px-3 py-1.5 rounded-full bg-black/[0.04] hover:bg-black/[0.08] transition-colors"
            >
              View all
            </button>
          </div>

          {documents.length === 0 ? (
            <EmptyState
              icon={Inbox}
              title="No reports uploaded yet"
              description="Drop in a medical report, research paper, contract, or dataset to begin."
              action={
                <button
                  onClick={() => navigate("/app/upload")}
                  className="mt-2 text-xs font-semibold bg-ink text-white px-5 py-2.5 rounded-full hover:bg-ink-700 shadow-pill transition-all"
                >
                  Upload file
                </button>
              }
            />
          ) : (
            <div className="divide-y divide-black/[0.04]">
              {documents.slice(0, 6).map((doc) => (
                <DocumentCard key={doc.id} doc={doc} />
              ))}
            </div>
          )}
        </Card>

        {/* Right Column: Activity Chart & Quick Actions */}
        <div className="space-y-6">
          {/* Activity Chart matching the Left Mockup "Sleep quality +8%" style */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-black/[0.04] text-ink flex items-center justify-center">
                  <Activity size={16} strokeWidth={2} />
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-ink">Ingestion trend</h3>
                  <p className="text-[11px] text-mute">Past 7 days</p>
                </div>
              </div>
              <span className="text-xl font-bold text-ink">
                {totalUploadsThisWeek > 0 ? `+${totalUploadsThisWeek}` : "0"}
              </span>
            </div>

            <div className="h-40 w-full mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={activityData} margin={{ top: 10, right: 0, left: -25, bottom: 0 }}>
                  <CartesianGrid vertical={false} stroke="rgba(0,0,0,0.03)" />
                  <XAxis
                    dataKey="day"
                    tick={{ fontSize: 11, fill: "#647582", fontWeight: 500 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "rgba(255, 255, 255, 0.95)",
                      borderRadius: "16px",
                      border: "1px solid rgba(0,0,0,0.05)",
                      boxShadow: "0 10px 25px -5px rgba(0,0,0,0.1)",
                      fontSize: "12px",
                      fontWeight: 600,
                    }}
                    cursor={{ fill: "rgba(0,0,0,0.02)" }}
                  />
                  <Bar
                    dataKey="count"
                    fill="#12181B"
                    radius={[8, 8, 8, 8]}
                    barSize={14}
                    background={{ fill: "rgba(0,0,0,0.04)", radius: 8 }}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Quick Actions */}
          <Card className="p-6">
            <h3 className="font-semibold text-sm text-ink mb-3">Quick actions</h3>
            <div className="space-y-2">
              <QuickAction
                icon={UploadCloud}
                label="Upload new report"
                onClick={() => navigate("/app/upload")}
              />
              <QuickAction
                icon={MessagesSquare}
                label="Explore & Ask AI"
                onClick={() => navigate("/app/documents")}
              />
              <QuickAction
                icon={GitCompareArrows}
                label="Compare two documents"
                onClick={() => navigate("/app/compare")}
              />
            </div>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}

function QuickAction({ icon: Icon, label, onClick }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center justify-between px-4 py-3 rounded-2xl bg-white/70 border border-black/[0.04] hover:border-black/20 hover:bg-white transition-all text-xs font-semibold text-ink shadow-sm group"
    >
      <div className="flex items-center gap-3">
        <div className="w-7 h-7 rounded-lg bg-black/[0.04] group-hover:bg-ink group-hover:text-white transition-colors flex items-center justify-center text-ink">
          <Icon size={14} strokeWidth={2} />
        </div>
        <span>{label}</span>
      </div>
      <span className="text-mute group-hover:text-ink transition-colors font-mono">→</span>
    </button>
  );
}

function buildActivityData(documents) {
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push({
      key: d.toDateString(),
      day: d.toLocaleDateString(undefined, { weekday: "short" }),
      count: 0,
    });
  }
  documents.forEach((doc) => {
    const key = new Date(doc.upload_date).toDateString();
    const bucket = days.find((d) => d.key === key);
    if (bucket) bucket.count += 1;
  });
  return days;
}
