import { AlertTriangle, CheckCircle2, OctagonAlert } from "lucide-react";
import type { RiskLevel } from "../types/river";

interface StatusBadgeProps {
  status: RiskLevel;
  customLabel?: string;
}

export function StatusBadge({ status, customLabel }: StatusBadgeProps) {
  if (status === "critical") {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-700 whitespace-nowrap">
        <OctagonAlert className="w-3.5 h-3.5 shrink-0 text-rose-600" aria-hidden="true" />
        <span>{customLabel || "เกินมาตรฐาน (วิกฤต)"}</span>
      </span>
    );
  }

  if (status === "warning") {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-700 whitespace-nowrap">
        <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-amber-600" aria-hidden="true" />
        <span>{customLabel || "เฝ้าระวัง"}</span>
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 whitespace-nowrap">
      <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-600" aria-hidden="true" />
      <span>{customLabel || "ปกติปลอดภัย"}</span>
    </span>
  );
}
