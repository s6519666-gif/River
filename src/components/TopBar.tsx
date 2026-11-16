import { useState } from "react";
import { Menu, X } from "lucide-react";

export type AppSection =
  | "water-check"
  | "alerts"
  | "risk-map"
  | "fish-safety"
  | "report";

interface TopBarProps {
  activeSection: AppSection;
  onNavigate: (section: AppSection) => void;
  criticalAlertCount: number;
}

const NAV_ITEMS: Array<{ id: AppSection; label: string }> = [
  { id: "water-check", label: "ตรวจคุณภาพน้ำ" },
  { id: "alerts", label: "แจ้งเตือนภัย" },
  { id: "risk-map", label: "แผนที่ความเสี่ยง" },
  { id: "fish-safety", label: "ความปลอดภัยปลา" },
  { id: "report", label: "แจ้งปัญหา & ภาพ" },
];

export function TopBar({
  activeSection,
  onNavigate,
  criticalAlertCount,
}: TopBarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSelect = (id: AppSection) => {
    onNavigate(id);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-slate-200">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Single text element wordmark */}
        <button
          type="button"
          onClick={() => handleSelect("water-check")}
          className="font-display text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
        >
          River Alert
        </button>

        {/* Zone 2: 5 concise single-line text navigation links */}
        <nav
          aria-label="เมนูหลัก"
          className="hidden lg:flex items-center gap-6 text-sm font-medium"
        >
          {NAV_ITEMS.map((item) => {
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelect(item.id)}
                className={`py-1.5 border-b-2 transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-teal-700 ${
                  isActive
                    ? "border-teal-700 text-teal-800 font-semibold"
                    : "border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300"
                }`}
              >
                {item.label}
                {item.id === "alerts" && criticalAlertCount > 0 ? (
                  <span className="ml-1.5 text-xs font-mono tabular-nums text-rose-700">
                    ({criticalAlertCount})
                  </span>
                ) : null}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: 1 primary action + mobile menu trigger */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => handleSelect("report")}
            className="px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-teal-700 rounded-lg hover:bg-teal-800 transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
          >
            แจ้งปัญหาน้ำเสีย
          </button>

          <button
            type="button"
            aria-label={mobileMenuOpen ? "ปิดเมนู" : "เปิดเมนู"}
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            className="lg:hidden p-2.5 text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Dropdown Navigation */}
      {mobileMenuOpen && (
        <nav
          aria-label="เมนูมือถือ"
          className="lg:hidden border-t border-slate-200 bg-white px-4 py-3 flex flex-col gap-1"
        >
          {NAV_ITEMS.map((item) => {
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelect(item.id)}
                className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                  isActive
                    ? "bg-teal-50 text-teal-800 font-semibold"
                    : "text-slate-700 hover:bg-slate-100"
                }`}
              >
                {item.label}
                {item.id === "alerts" && criticalAlertCount > 0
                  ? ` (${criticalAlertCount})`
                  : ""}
              </button>
            );
          })}
        </nav>
      )}
    </header>
  );
}
