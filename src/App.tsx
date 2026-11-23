import { useEffect, useMemo, useState } from "react";
import { AlertSystemView } from "./components/AlertSystemView";
import { FishSafetyView } from "./components/FishSafetyView";
import { ReportAndMediaView } from "./components/ReportAndMediaView";
import { RiverLogo } from "./components/RiverLogo";
import { RiskMapView } from "./components/RiskMapView";
import { TopBar, type AppSection } from "./components/TopBar";
import { WaterCheckView } from "./components/WaterCheckView";
import type {
  CitizenReport,
  MonitoringStation,
  RiverAlertItem,
} from "./types/river";

export default function App() {
  const [activeSection, setActiveSection] = useState<AppSection>("water-check");
  const [stations, setStations] = useState<MonitoringStation[]>([]);
  const [alerts, setAlerts] = useState<RiverAlertItem[]>([]);
  const [reports, setReports] = useState<CitizenReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [focusedStationId, setFocusedStationId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function fetchAll() {
      setLoading(true);
      setLoadError(null);
      try {
        const [stationsRes, alertsRes, reportsRes] = await Promise.all([
          fetch("/api/stations"),
          fetch("/api/alerts"),
          fetch("/api/reports"),
        ]);

        if (!stationsRes.ok || !alertsRes.ok || !reportsRes.ok) {
          throw new Error("ไม่สามารถโหลดข้อมูลคุณภาพน้ำจากเซิร์ฟเวอร์ได้");
        }

        const [stationsJson, alertsJson, reportsJson] = await Promise.all([
          stationsRes.json(),
          alertsRes.json(),
          reportsRes.json(),
        ]);

        if (!cancelled) {
          setStations(stationsJson.stations ?? []);
          setAlerts(alertsJson.alerts ?? []);
          setReports(reportsJson.reports ?? []);
        }
      } catch (err) {
        if (!cancelled) {
          setLoadError(
            err instanceof Error
              ? err.message
              : "เกิดข้อผิดพลาดในการเชื่อมต่อระบบข้อมูล"
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }
    fetchAll();
    return () => {
      cancelled = true;
    };
  }, []);

  const criticalAlertCount = useMemo(
    () => alerts.filter((a) => a.severity === "critical").length,
    [alerts]
  );

  const handleInspectOnMap = (stationId: string) => {
    setFocusedStationId(stationId);
    setActiveSection("risk-map");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleNavigate = (section: AppSection) => {
    setActiveSection(section);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#f4f8f6] text-slate-900">
      <TopBar
        activeSection={activeSection}
        onNavigate={handleNavigate}
        criticalAlertCount={criticalAlertCount}
      />

      <main className="mx-auto w-full max-w-[1440px] flex-1 px-4 py-7 sm:px-6 sm:py-9 lg:px-8">
        {loadError && (
          <div role="alert" className="mb-6 flex items-center justify-between gap-4 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
            <span>{loadError}</span>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="px-3 py-1.5 text-xs font-semibold bg-white border border-rose-200 rounded-lg hover:bg-rose-100 cursor-pointer"
            >
              โหลดใหม่
            </button>
          </div>
        )}

        {activeSection === "water-check" && (
          <WaterCheckView
            stations={stations}
            loading={loading}
            onNavigate={handleNavigate}
            onInspectOnMap={handleInspectOnMap}
          />
        )}

        {activeSection === "alerts" && (
          <AlertSystemView
            alerts={alerts}
            loading={loading}
            onInspectStationOnMap={handleInspectOnMap}
          />
        )}

        {activeSection === "risk-map" && (
          <RiskMapView
            stations={stations}
            reports={reports}
            focusedStationId={focusedStationId}
            onSelectStation={(id) => setFocusedStationId(id)}
            onGoToReport={() => handleNavigate("report")}
          />
        )}

        {activeSection === "fish-safety" && (
          <FishSafetyView stations={stations} />
        )}

        {activeSection === "report" && (
          <ReportAndMediaView
            reports={reports}
            onReportCreated={(newRep) => setReports((prev) => [newRep, ...prev])}
            onReportStatusUpdated={(updated) =>
              setReports((prev) =>
                prev.map((r) => (r.id === updated.id ? updated : r))
              )
            }
          />
        )}
      </main>

      <footer className="mt-8 border-t border-teal-900/70 bg-[#103c39] text-white">
        <div className="mx-auto grid max-w-[1440px] gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center lg:px-8">
          <div className="flex items-start gap-3">
            <RiverLogo className="size-10 shrink-0" />
            <div>
              <p className="font-display text-sm font-bold tracking-tight">River Alert</p>
              <p className="mt-1 max-w-xl text-xs leading-relaxed text-teal-100/80">
                แผนที่ผลตรวจจากหน่วยงานพร้อมแหล่งอ้างอิงและวันที่เก็บตัวอย่าง แยกจากข้อสังเกตของชุมชนที่ยังไม่ยืนยัน
              </p>
            </div>
          </div>
          <nav aria-label="ลิงก์ด่วน" className="flex flex-wrap gap-x-5 gap-y-3 text-xs font-medium text-teal-50/90">
            <button
              type="button"
              onClick={() => handleNavigate("water-check")}
              className="rounded-sm transition-colors hover:text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-teal-200"
            >
              ตรวจคุณภาพน้ำ
            </button>
            <button
              type="button"
              onClick={() => handleNavigate("alerts")}
              className="rounded-sm transition-colors hover:text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-teal-200"
            >
              แจ้งเตือนภัย
            </button>
            <button
              type="button"
              onClick={() => handleNavigate("risk-map")}
              className="rounded-sm transition-colors hover:text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-teal-200"
            >
              แผนที่รายงานคุณภาพน้ำ
            </button>
            <button
              type="button"
              onClick={() => handleNavigate("fish-safety")}
              className="rounded-sm transition-colors hover:text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-teal-200"
            >
              ความปลอดภัยปลา
            </button>
            <button
              type="button"
              onClick={() => handleNavigate("report")}
              className="rounded-sm transition-colors hover:text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-teal-200"
            >
              แจ้งปัญหา
            </button>
          </nav>
        </div>
      </footer>
    </div>
  );
}
