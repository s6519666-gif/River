import { useState } from "react";
import {
  BellRing,
  Droplets,
  Fish,
  MapPinned,
  Menu,
  MessageSquareWarning,
  X,
  type LucideIcon,
} from "lucide-react";
import { RiverLogo } from "./RiverLogo";

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

const NAV_ITEMS: Array<{ id: AppSection; label: string; icon: LucideIcon }> = [
  { id: "water-check", label: "ตรวจคุณภาพน้ำ", icon: Droplets },
  { id: "alerts", label: "ประกาศเตือน", icon: BellRing },
  { id: "risk-map", label: "แผนที่รายงานคุณภาพน้ำ", icon: MapPinned },
  { id: "fish-safety", label: "ความปลอดภัยปลา", icon: Fish },
  { id: "report", label: "ข้อสังเกตชุมชน", icon: MessageSquareWarning },
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
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/95 shadow-[0_2px_12px_rgba(15,76,72,0.04)] backdrop-blur-md">
      <div className="mx-auto flex h-[4.5rem] max-w-[1440px] items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
        <button
          type="button"
          onClick={() => handleSelect("water-check")}
          aria-label="River Alert — กลับไปหน้าตรวจคุณภาพน้ำ"
          className="flex shrink-0 items-center gap-3 rounded-xl text-left focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-teal-700"
        >
          <RiverLogo className="size-10 shrink-0" />
          <span className="flex flex-col leading-tight">
            <span className="font-display text-[15px] font-bold tracking-tight text-slate-900 sm:text-base">
              River <span className="text-teal-800">Alert</span>
            </span>
            <span className="mt-1 hidden text-[10px] font-medium tracking-wide text-slate-500 sm:block">
              เฝ้าระวังแม่น้ำไทย
            </span>
          </span>
        </button>

        <nav
          aria-label="เมนูหลัก"
          className="hidden items-center gap-1 xl:flex"
        >
          {NAV_ITEMS.map((item) => {
            const isActive = activeSection === item.id;
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelect(item.id)}
                aria-current={isActive ? "page" : undefined}
                className={`inline-flex items-center gap-2 rounded-lg px-3 py-2.5 text-[13px] font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700 ${
                  isActive
                    ? "bg-teal-50 text-teal-900"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <Icon className="size-4 shrink-0" aria-hidden="true" />
                <span className="whitespace-nowrap">{item.label}</span>
                {item.id === "alerts" && criticalAlertCount > 0 ? (
                  <span className="rounded-full bg-rose-100 px-1.5 py-0.5 text-[10px] font-semibold leading-none text-rose-800">
                    {criticalAlertCount}
                  </span>
                ) : null}
              </button>
            );
          })}
        </nav>

        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={() => handleSelect("report")}
            className="inline-flex items-center gap-2 rounded-lg bg-teal-800 px-3 py-2.5 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-teal-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700 sm:px-4 sm:text-sm"
          >
            <MessageSquareWarning className="size-4" aria-hidden="true" />
            <span className="hidden sm:inline">แจ้งปัญหาน้ำเสีย</span>
            <span className="sm:hidden">แจ้งปัญหา</span>
          </button>

          <button
            type="button"
            aria-label={mobileMenuOpen ? "ปิดเมนู" : "เปิดเมนู"}
            aria-expanded={mobileMenuOpen}
            aria-controls="river-mobile-navigation"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            className="rounded-lg p-2.5 text-slate-700 transition-colors hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700 xl:hidden"
          >
            {mobileMenuOpen ? (
              <X className="size-5" aria-hidden="true" />
            ) : (
              <Menu className="size-5" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>

      <nav
        id="river-mobile-navigation"
        aria-label="เมนูมือถือ"
        hidden={!mobileMenuOpen}
        className={`flex flex-col gap-1 border-t border-slate-200 bg-white px-4 py-3 sm:px-6 xl:hidden ${
          mobileMenuOpen ? "" : "hidden"
        }`}
      >
        {NAV_ITEMS.map((item) => {
          const isActive = activeSection === item.id;
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => handleSelect(item.id)}
              aria-current={isActive ? "page" : undefined}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700 ${
                isActive
                  ? "bg-teal-50 text-teal-900"
                  : "text-slate-700 hover:bg-slate-50"
              }`}
            >
              <Icon className="size-4 shrink-0" aria-hidden="true" />
              <span className="flex-1">{item.label}</span>
              {item.id === "alerts" && criticalAlertCount > 0 ? (
                <span className="rounded-full bg-rose-100 px-2 py-1 text-xs font-semibold text-rose-800">
                  {criticalAlertCount} รายการ
                </span>
              ) : null}
            </button>
          );
        })}
      </nav>
    </header>
  );
}
