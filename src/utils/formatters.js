export function formatCurrency(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0
  }).format(value);
}

export function getPriorityStyles(priority) {
  const styles = {
    High: "bg-rose-50 text-rose-700 ring-rose-100",
    Medium: "bg-amber-50 text-amber-700 ring-amber-100",
    Low: "bg-slate-100 text-slate-600 ring-slate-200"
  };

  return styles[priority] || styles.Low;
}

export function getProjectStyles(type) {
  const styles = {
    Remodeling: "bg-indigo-50 text-indigo-700",
    Deck: "bg-orange-50 text-orange-700",
    Roofing: "bg-sky-50 text-sky-700",
    Painting: "bg-emerald-50 text-emerald-700"
  };

  return styles[type] || "bg-slate-100 text-slate-700";
}
