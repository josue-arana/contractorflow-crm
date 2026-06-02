import { useMemo, useState } from "react";
import { CalendarDays, CheckCircle2, DollarSign, Hammer, Menu, Search, TrendingUp, Users, X } from "lucide-react";
import Sidebar from "./components/Sidebar.jsx";
import Topbar from "./components/Topbar.jsx";
import MetricCard from "./components/MetricCard.jsx";
import PipelineBoard from "./components/PipelineBoard.jsx";
import { initialLeads } from "./data/leads.js";
import { formatCurrency } from "./utils/formatters.js";

export default function App() {
  const [leads, setLeads] = useState(initialLeads);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const metrics = useMemo(() => {
    const openLeads = leads.filter((lead) => !["won", "lost"].includes(lead.status));
    const wonLeads = leads.filter((lead) => lead.status === "won");
    const pipelineValue = openLeads.reduce((sum, lead) => sum + lead.value, 0);
    const wonValue = wonLeads.reduce((sum, lead) => sum + lead.value, 0);

    return [
      {
        title: "Open Pipeline",
        value: formatCurrency(pipelineValue),
        change: "+18% vs last month",
        icon: DollarSign
      },
      {
        title: "Active Leads",
        value: openLeads.length,
        change: "Across 4 project types",
        icon: Users
      },
      {
        title: "Won Revenue",
        value: formatCurrency(wonValue),
        change: "1 closed project",
        icon: CheckCircle2
      },
      {
        title: "Estimates Due",
        value: 5,
        change: "This week",
        icon: CalendarDays
      }
    ];
  }, [leads]);

  return (
    <div className="min-h-screen bg-slate-50 lg:flex">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar onMenuClick={() => setSidebarOpen(true)} />

        <main className="flex-1 space-y-6 px-4 py-5 sm:px-6 lg:px-8">
          <section className="rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 p-6 text-white shadow-soft">
            <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
              <div>
                <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-sm text-slate-200 ring-1 ring-white/10">
                  <Hammer size={16} /> Contractor CRM Dashboard
                </div>
                <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">ContractorFlow CRM</h1>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">
                  Track remodeling, deck, roofing, and painting leads from first call to signed contract.
                </p>
              </div>

              <div className="flex w-full items-center rounded-2xl bg-white/10 px-4 py-3 ring-1 ring-white/10 lg:max-w-sm">
                <Search className="mr-3 text-slate-300" size={18} />
                <input
                  className="w-full bg-transparent text-sm text-white placeholder:text-slate-400 focus:outline-none"
                  placeholder="Search clients, projects, or locations..."
                />
              </div>
            </div>
          </section>

          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {metrics.map((metric) => (
              <MetricCard key={metric.title} {...metric} />
            ))}
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-soft sm:p-6">
            <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
              <div>
                <h2 className="text-xl font-bold text-slate-950">Lead Pipeline</h2>
                <p className="mt-1 text-sm text-slate-500">Drag cards between stages as each contractor lead moves forward.</p>
              </div>
              <button className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800">
                <TrendingUp size={17} /> Add Lead
              </button>
            </div>

            <PipelineBoard leads={leads} setLeads={setLeads} />
          </section>
        </main>
      </div>
    </div>
  );
}
