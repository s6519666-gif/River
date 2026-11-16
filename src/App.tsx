import { useEffect, useMemo, useState } from "react";
import { AlertSystemView } from "./components/AlertSystemView";
import { FishSafetyView } from "./components/FishSafetyView";
import { ReportAndMediaView } from "./components/ReportAndMediaView";
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
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <TopBar
        activeSection={activeSection}
        onNavigate={handleNavigate}
        criticalAlertCount={criticalAlertCount}
      />

      <main className="flex-1 max-w-[1280px] w-full mx-auto px-4 sm:px-6 py-8">
        {loadError && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-xl text-sm text-rose-800 flex items-center justify-between gap-4">
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

      <footer className="border-t border-slate-200 bg-white mt-12">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 py-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-slate-500">
          <div>
            <span className="font-semibold text-slate-800">River Alert</span>
            <span className="mx-2" aria-hidden="true">·</span>
            <span>
              ระบบเฝ้าระวังคุณภาพน้ำและเตือนภัยสารปนเปื้อนสำหรับชุมชนริมแม่น้ำ ชาวประมง และเกษตรกร
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <button
              type="button"
              onClick={() => handleNavigate("water-check")}
              className="hover:text-slate-800 cursor-pointer"
            >
              ตรวจคุณภาพน้ำ
            </button>
            <button
              type="button"
              onClick={() => handleNavigate("risk-map")}
              className="hover:text-slate-800 cursor-pointer"
            >
              แผนที่ความเสี่ยง
            </button>
            <button
              type="button"
              onClick={() => handleNavigate("fish-safety")}
              className="hover:text-slate-800 cursor-pointer"
            >
              ความปลอดภัยปลา
            </button>
            <button
              type="button"
              onClick={() => handleNavigate("report")}
              className="hover:text-slate-800 cursor-pointer"
            >
              แจ้งปัญหาน้ำเสีย
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
