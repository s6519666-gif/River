import { useEffect, useMemo, useState } from "react";
import { Bell, Check, MapPin, ShieldCheck } from "lucide-react";
import type { RiskLevel, RiverAlertItem } from "../types/river";
import { StatusBadge } from "./StatusBadge";

interface AlertSystemViewProps {
  alerts: RiverAlertItem[];
  loading: boolean;
  onInspectStationOnMap: (stationId: string) => void;
}

type TargetGroup = "villagers" | "fishermen" | "farmers";

const PREFS_STORAGE_KEY = "river_alert_subscriptions_v1";

interface AlertPreferences {
  mercuryAlert: boolean;
  leadAlert: boolean;
  arsenicAlert: boolean;
  lowDoAlert: boolean;
  selectedBasins: string[];
}

const ALL_BASINS = [
  "แม่น้ำเจ้าพระยา",
  "แม่น้ำท่าจีน",
  "แม่น้ำแม่กลอง",
  "แม่น้ำโขง",
  "แม่น้ำปิง",
  "แม่น้ำชี",
];

export function AlertSystemView({
  alerts,
  loading,
  onInspectStationOnMap,
}: AlertSystemViewProps) {
  const [severityFilter, setSeverityFilter] = useState<"all" | RiskLevel>("all");
  const [targetGroup, setTargetGroup] = useState<TargetGroup>("villagers");
  const [savedNotice, setSavedNotice] = useState(false);

  const [prefs, setPrefs] = useState<AlertPreferences>(() => {
    try {
      const raw = localStorage.getItem(PREFS_STORAGE_KEY);
      if (raw) {
        return JSON.parse(raw) as AlertPreferences;
      }
    } catch {
      // Ignore storage failure
    }
    return {
      mercuryAlert: true,
      leadAlert: true,
      arsenicAlert: true,
      lowDoAlert: true,
      selectedBasins: ["แม่น้ำเจ้าพระยา", "แม่น้ำท่าจีน", "แม่น้ำแม่กลอง"],
    };
  });

  useEffect(() => {
    try {
      localStorage.setItem(PREFS_STORAGE_KEY, JSON.stringify(prefs));
    } catch {
      // Ignore storage failure
    }
  }, [prefs]);

  const filteredAlerts = useMemo(() => {
    return alerts.filter(
      (a) => severityFilter === "all" || a.severity === severityFilter
    );
  }, [alerts, severityFilter]);

  const toggleBasin = (basin: string) => {
    setPrefs((prev) => {
      const exists = prev.selectedBasins.includes(basin);
      return {
        ...prev,
        selectedBasins: exists
          ? prev.selectedBasins.filter((b) => b !== basin)
          : [...prev.selectedBasins, basin],
      };
    });
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 1800);
  };

  const toggleTrigger = (
    key: "mercuryAlert" | "leadAlert" | "arsenicAlert" | "lowDoAlert"
  ) => {
    setPrefs((prev) => ({ ...prev, [key]: !prev[key] }));
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 1800);
  };

  return (
    <div className="space-y-8">
      {/* Header & Controls */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-1.5 max-w-2xl">
          <div className="text-xs text-slate-500 font-medium">
            ระบบแจ้งเตือนสารพิษเกินค่ามาตรฐาน · อ้างอิงเกณฑ์คุณภาพน้ำผิวดิน
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-900">
            ศูนย์แจ้งเตือนภัยสารปนเปื้อนในแม่น้ำ
          </h1>
          <p className="text-sm text-slate-600">
            ติดตามประกาศเตือนภัยล่าสุดเมื่อตรวจพบปรอท ตะกั่ว หรือสารหนูเกินมาตรฐาน
            พร้อมแนวทางปฏิบัติแยกตามกลุ่มผู้ใช้น้ำริมแม่น้ำ
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
            {(
              [
                { id: "all", label: "ทั้งหมด" },
                { id: "critical", label: "วิกฤต" },
                { id: "warning", label: "เฝ้าระวัง" },
                { id: "normal", label: "ปกติ" },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSeverityFilter(tab.id)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  severityFilter === tab.id
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* Alert Feed */}
        <div className="xl:col-span-8 space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl px-5 py-3.5 flex flex-wrap items-center justify-between gap-3">
            <span className="text-xs font-semibold text-slate-700">
              แสดงคำแนะนำปฏิบัติตัวสำหรับกลุ่ม:
            </span>
            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
              {(
                [
                  { id: "villagers", label: "ประชาชนริมแม่น้ำ" },
                  { id: "fishermen", label: "ชาวประมง" },
                  { id: "farmers", label: "เกษตรกรและผู้เลี้ยงปลา" },
                ] as const
              ).map((g) => (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => setTargetGroup(g.id)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    targetGroup === g.id
                      ? "bg-white text-teal-800 font-semibold shadow-sm"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  {g.label}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-40 bg-white border border-slate-200 rounded-xl animate-pulse"
                />
              ))}
            </div>
          ) : filteredAlerts.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-xl p-10 text-center">
              <ShieldCheck className="w-9 h-9 text-emerald-600 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-800">
                ไม่พบรายการแจ้งเตือนในระดับที่เลือก
              </p>
              <button
                type="button"
                onClick={() => setSeverityFilter("all")}
                className="mt-3 px-4 py-2 text-xs font-semibold text-teal-800 bg-teal-50 rounded-lg hover:bg-teal-100 cursor-pointer"
              >
                แสดงการแจ้งเตือนทั้งหมด
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredAlerts.map((alert) => {
                const advisoryText =
                  targetGroup === "villagers"
                    ? alert.advisoryVillagersTh
                    : targetGroup === "fishermen"
                    ? alert.advisoryFishermenTh
                    : alert.advisoryFarmersTh;

                return (
                  <article
                    key={alert.id}
                    className="bg-white border border-slate-200 rounded-xl p-6 space-y-4"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                          <span>{alert.riverNameTh}</span>
                          <span aria-hidden="true">·</span>
                          <span>{alert.provinceTh}</span>
                          <span aria-hidden="true">·</span>
                          <span>{alert.detectedAt}</span>
                        </div>
                        <h2 className="text-base sm:text-lg font-bold text-slate-900">
                          {alert.headlineTh}
                        </h2>
                      </div>
                      <StatusBadge status={alert.severity} />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 py-3 border-y border-slate-100 text-xs">
                      <div>
                        <div className="text-slate-500">สารปนเปื้อนที่ตรวจพบ</div>
                        <div className="font-semibold text-slate-900 mt-0.5">
                          {alert.contaminantTh}
                        </div>
                      </div>
                      <div>
                        <div className="text-slate-500">ค่าที่วัดได้จริง</div>
                        <div className="font-mono tabular-nums font-semibold text-slate-900 mt-0.5">
                          {alert.measuredValue}
                        </div>
                      </div>
                      <div>
                        <div className="text-slate-500">เทียบค่ามาตรฐาน</div>
                        <div
                          className={`font-semibold mt-0.5 ${
                            alert.severity === "critical"
                              ? "text-rose-700"
                              : alert.severity === "warning"
                              ? "text-amber-700"
                              : "text-emerald-700"
                          }`}
                        >
                          {alert.exceedRatio} ({alert.standardLimit})
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <p className="text-sm text-slate-700 leading-relaxed">
                        <span className="font-semibold text-slate-900">
                          ข้อปฏิบัติสำหรับ
                          {targetGroup === "villagers"
                            ? "ประชาชนริมแม่น้ำ"
                            : targetGroup === "fishermen"
                            ? "ชาวประมง"
                            : "เกษตรกรและผู้เลี้ยงปลา"}
                          :{" "}
                        </span>
                        {advisoryText}
                      </p>

                      <button
                        type="button"
                        onClick={() => onInspectStationOnMap(alert.stationId)}
                        className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
                      >
                        <MapPin className="w-3.5 h-3.5" />
                        <span>ดูจุดเสี่ยงบนแผนที่</span>
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Alert Subscription Preferences */}
        <aside className="xl:col-span-4 bg-white border border-slate-200 rounded-xl p-6 space-y-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Bell className="w-4 h-4 text-teal-700" />
                <span>ตั้งค่าการรับแจ้งเตือนพื้นที่</span>
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                เลือกชนิดสารพิษและลุ่มน้ำใกล้บ้านเพื่อติดตามความเสี่ยงต่อเนื่อง
              </p>
            </div>
            {savedNotice && (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 shrink-0">
                <Check className="w-3.5 h-3.5" />
                <span>บันทึกแล้ว</span>
              </span>
            )}
          </div>

          <div className="space-y-3 pt-2 border-t border-slate-100">
            <div className="text-xs font-semibold text-slate-700">
              เกณฑ์สารปนเปื้อนที่ต้องการแจ้งเตือน
            </div>

            {(
              [
                {
                  key: "mercuryAlert",
                  title: "สารปรอท (Hg) > 0.002 mg/L",
                  desc: "แจ้งเตือนทันทีเมื่อพบปรอทสะสมในน้ำหรือเสี่ยงต่อสัตว์น้ำ",
                },
                {
                  key: "leadAlert",
                  title: "สารตะกั่ว (Pb) > 0.05 mg/L",
                  desc: "แจ้งเตือนอันตรายต่อระบบประสาทและน้ำอุปโภค",
                },
                {
                  key: "arsenicAlert",
                  title: "สารหนู (As) > 0.01 mg/L",
                  desc: "แจ้งเตือนกรณีพบสารหนูจากน้ำไหลหลากหรือเหมืองแร่",
                },
                {
                  key: "lowDoAlert",
                  title: "ออกซิเจนละลายน้ำ (DO) < 4.0 mg/L",
                  desc: "แจ้งเตือนล่วงหน้าสำหรับผู้เลี้ยงปลากระชังและบ่อปลา",
                },
              ] as const
            ).map((item) => {
              const checked = prefs[item.key];
              return (
                <label
                  key={item.key}
                  className="flex items-start gap-3 p-3 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleTrigger(item.key)}
                    className="mt-0.5 w-4 h-4 accent-teal-700 rounded cursor-pointer"
                  />
                  <div>
                    <div className="text-xs font-semibold text-slate-900">
                      {item.title}
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      {item.desc}
                    </div>
                  </div>
                </label>
              );
            })}
          </div>

          <div className="space-y-3 pt-2 border-t border-slate-100">
            <div className="text-xs font-semibold text-slate-700">
              ลุ่มน้ำที่เฝ้าระวัง ({prefs.selectedBasins.length} พื้นที่)
            </div>
            <div className="grid grid-cols-2 gap-2">
              {ALL_BASINS.map((basin) => {
                const active = prefs.selectedBasins.includes(basin);
                return (
                  <button
                    key={basin}
                    type="button"
                    onClick={() => toggleBasin(basin)}
                    className={`px-3 py-2 text-xs font-medium rounded-lg border text-left transition-colors cursor-pointer ${
                      active
                        ? "bg-teal-50 border-teal-700 text-teal-900 font-semibold"
                        : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {basin}
                  </button>
                );
              })}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
