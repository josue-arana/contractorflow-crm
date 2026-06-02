import { useMemo, useState } from "react";
import { pipelineStages } from "../data/leads.js";
import PipelineColumn from "./PipelineColumn.jsx";

export default function PipelineBoard({ leads, setLeads }) {
  const [draggingLeadId, setDraggingLeadId] = useState(null);

  const groupedLeads = useMemo(() => {
    return pipelineStages.reduce((acc, stage) => {
      acc[stage.id] = leads.filter((lead) => lead.status === stage.id);
      return acc;
    }, {});
  }, [leads]);

  function handleDrop(stageId) {
    if (!draggingLeadId) return;

    setLeads((currentLeads) =>
      currentLeads.map((lead) =>
        lead.id === draggingLeadId ? { ...lead, status: stageId } : lead
      )
    );

    setDraggingLeadId(null);
  }

  return (
    <div className="hide-scrollbar flex gap-4 overflow-x-auto pb-2">
      {pipelineStages.map((stage) => (
        <PipelineColumn
          key={stage.id}
          stage={stage}
          leads={groupedLeads[stage.id]}
          onDragStart={setDraggingLeadId}
          onDrop={handleDrop}
        />
      ))}
    </div>
  );
}
