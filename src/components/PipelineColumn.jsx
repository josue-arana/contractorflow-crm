import { formatCurrency } from "../utils/formatters.js";
import LeadCard from "./LeadCard.jsx";

export default function PipelineColumn({ stage, leads, onDragStart, onDrop }) {
  const total = leads.reduce((sum, lead) => sum + lead.value, 0);

  return (
    <section
      className="min-h-[520px] w-[290px] shrink-0 rounded-3xl border border-slate-200 bg-slate-50 p-3"
      onDragOver={(event) => event.preventDefault()}
      onDrop={() => onDrop(stage.id)}
    >
      <div className="mb-3 flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <span className={`h-3 w-3 rounded-full ${stage.accent}`} />
          <h3 className="text-sm font-bold text-slate-800">{stage.title}</h3>
        </div>
        <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-slate-600 ring-1 ring-slate-200">
          {leads.length}
        </span>
      </div>

      <p className="mb-3 px-1 text-xs font-medium text-slate-500">{formatCurrency(total)} value</p>

      <div className="space-y-3">
        {leads.map((lead) => (
          <LeadCard key={lead.id} lead={lead} onDragStart={onDragStart} />
        ))}
      </div>
    </section>
  );
}
