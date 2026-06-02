import { CalendarDays, GripVertical, MapPin } from "lucide-react";
import { formatCurrency, getPriorityStyles, getProjectStyles } from "../utils/formatters.js";

export default function LeadCard({ lead, onDragStart }) {
  return (
    <article
      draggable
      onDragStart={() => onDragStart(lead.id)}
      className="cursor-grab rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md active:cursor-grabbing"
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <h4 className="font-bold text-slate-950">{lead.client}</h4>
          <p className="mt-1 text-sm text-slate-600">{lead.project}</p>
        </div>
        <GripVertical className="shrink-0 text-slate-300" size={18} />
      </div>

      <div className="mb-3 flex flex-wrap gap-2">
        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${getProjectStyles(lead.type)}`}>{lead.type}</span>
        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${getPriorityStyles(lead.priority)}`}>{lead.priority}</span>
      </div>

      <p className="mb-4 line-clamp-2 text-sm leading-5 text-slate-500">{lead.notes}</p>

      <div className="flex items-center justify-between border-t border-slate-100 pt-3">
        <p className="font-bold text-slate-950">{formatCurrency(lead.value)}</p>
        <div className="flex items-center gap-1 text-xs text-slate-500">
          <CalendarDays size={14} /> {lead.lastContact}
        </div>
      </div>

      <div className="mt-3 flex items-center gap-1 text-xs text-slate-500">
        <MapPin size={14} /> {lead.location}
      </div>
    </article>
  );
}
