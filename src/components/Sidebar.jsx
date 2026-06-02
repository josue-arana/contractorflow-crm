import { BarChart3, BriefcaseBusiness, Calendar, FileText, Hammer, Home, Settings, Users, X } from "lucide-react";

const navItems = [
  { label: "Dashboard", icon: Home, active: true },
  { label: "Leads", icon: BriefcaseBusiness },
  { label: "Customers", icon: Users },
  { label: "Estimates", icon: FileText },
  { label: "Calendar", icon: Calendar },
  { label: "Reports", icon: BarChart3 },
  { label: "Settings", icon: Settings }
];

export default function Sidebar({ isOpen, onClose }) {
  return (
    <>
      {isOpen && <button aria-label="Close sidebar overlay" className="fixed inset-0 z-30 bg-slate-950/50 lg:hidden" onClick={onClose} />}
      <aside className={`fixed inset-y-0 left-0 z-40 flex w-72 transform flex-col bg-slate-950 text-white transition-transform duration-300 lg:static lg:translate-x-0 ${isOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-5">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-2xl bg-blue-500">
              <Hammer size={21} />
            </div>
            <div>
              <p className="text-base font-bold">ContractorFlow</p>
              <p className="text-xs text-slate-400">Small Contractor CRM</p>
            </div>
          </div>
          <button className="rounded-lg p-2 text-slate-400 hover:bg-white/10 lg:hidden" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-5">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <a
                key={item.label}
                href="#"
                className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition ${item.active ? "bg-white text-slate-950" : "text-slate-300 hover:bg-white/10 hover:text-white"}`}
              >
                <Icon size={18} />
                {item.label}
              </a>
            );
          })}
        </nav>

        <div className="m-4 rounded-3xl bg-white/10 p-4 ring-1 ring-white/10">
          <p className="text-sm font-semibold">Pro Tip</p>
          <p className="mt-1 text-xs leading-5 text-slate-300">Follow up within 24 hours to improve estimate close rates.</p>
        </div>
      </aside>
    </>
  );
}
