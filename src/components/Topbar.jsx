import { Bell, Menu, Plus } from "lucide-react";

export default function Topbar({ onMenuClick }) {
  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <button className="rounded-xl border border-slate-200 p-2 text-slate-600 lg:hidden" onClick={onMenuClick}>
            <Menu size={21} />
          </button>
          <div>
            <p className="text-sm text-slate-500">Good morning</p>
            <h2 className="text-base font-bold text-slate-950">Sales Pipeline Overview</h2>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button className="hidden rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 sm:inline-flex sm:items-center sm:gap-2">
            <Plus size={17} /> New Estimate
          </button>
          <button className="rounded-xl border border-slate-200 p-2.5 text-slate-600 hover:bg-slate-50">
            <Bell size={19} />
          </button>
          <div className="grid h-10 w-10 place-items-center rounded-full bg-slate-950 text-sm font-bold text-white">JA</div>
        </div>
      </div>
    </header>
  );
}
