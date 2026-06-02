export const pipelineStages = [
  { id: "new", title: "New Lead", accent: "bg-blue-500" },
  { id: "scheduled", title: "Estimate Scheduled", accent: "bg-cyan-500" },
  { id: "sent", title: "Estimate Sent", accent: "bg-amber-500" },
  { id: "followUp", title: "Follow Up", accent: "bg-purple-500" },
  { id: "won", title: "Won", accent: "bg-emerald-500" },
  { id: "lost", title: "Lost", accent: "bg-rose-500" }
];

export const initialLeads = [
  {
    id: "lead-001",
    client: "Maria Thompson",
    project: "Kitchen Remodeling",
    type: "Remodeling",
    value: 32500,
    status: "new",
    priority: "High",
    lastContact: "Today",
    location: "Baltimore, MD",
    notes: "Wants cabinets, countertops, flooring, and lighting updated."
  },
  {
    id: "lead-002",
    client: "James Carter",
    project: "Rear Deck Renovation",
    type: "Deck",
    value: 14800,
    status: "new",
    priority: "Medium",
    lastContact: "Yesterday",
    location: "Owings Mills, MD",
    notes: "Existing deck has rotted boards and needs railing replacement."
  },
  {
    id: "lead-003",
    client: "Alicia Brown",
    project: "Roof Replacement",
    type: "Roofing",
    value: 21600,
    status: "scheduled",
    priority: "High",
    lastContact: "May 30",
    location: "Towson, MD",
    notes: "Storm damage inspection scheduled for this week."
  },
  {
    id: "lead-004",
    client: "Ricket Residence",
    project: "Exterior Painting",
    type: "Painting",
    value: 7900,
    status: "scheduled",
    priority: "Low",
    lastContact: "May 29",
    location: "Chestertown, MD",
    notes: "Needs pressure washing, trim repair, and exterior repaint."
  },
  {
    id: "lead-005",
    client: "Nguyen Family",
    project: "Basement Full Renovation",
    type: "Remodeling",
    value: 44200,
    status: "sent",
    priority: "High",
    lastContact: "May 28",
    location: "Columbia, MD",
    notes: "Estimate sent for framing, drywall, bathroom, and flooring."
  },
  {
    id: "lead-006",
    client: "Robert Wilson",
    project: "Composite Deck Build",
    type: "Deck",
    value: 28750,
    status: "sent",
    priority: "Medium",
    lastContact: "May 27",
    location: "Annapolis, MD",
    notes: "Comparing treated lumber versus composite material pricing."
  },
  {
    id: "lead-007",
    client: "Sofia Martinez",
    project: "Garage Roof Repair",
    type: "Roofing",
    value: 6200,
    status: "followUp",
    priority: "Medium",
    lastContact: "May 24",
    location: "Silver Spring, MD",
    notes: "Asked for photos and warranty information."
  },
  {
    id: "lead-008",
    client: "Greenfield HOA",
    project: "Common Area Painting",
    type: "Painting",
    value: 18500,
    status: "followUp",
    priority: "High",
    lastContact: "May 22",
    location: "Laurel, MD",
    notes: "Board review pending. Needs insurance documents."
  },
  {
    id: "lead-009",
    client: "David Robinson",
    project: "Bathroom Remodel",
    type: "Remodeling",
    value: 19800,
    status: "won",
    priority: "High",
    lastContact: "May 20",
    location: "Rockville, MD",
    notes: "Deposit received. Project starts next month."
  },
  {
    id: "lead-010",
    client: "Patel Residence",
    project: "Roof Tune Up",
    type: "Roofing",
    value: 3900,
    status: "lost",
    priority: "Low",
    lastContact: "May 18",
    location: "Glen Burnie, MD",
    notes: "Client selected a lower-cost provider."
  }
];
