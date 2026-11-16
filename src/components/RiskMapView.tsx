import { useMemo, useState } from "react";
import { Layers, LocateFixed, ZoomIn, ZoomOut } from "lucide-react";
import type { CitizenReport, MonitoringStation } from "../types/river";
import { StatusBadge } from "./StatusBadge";

interface RiskMapViewProps {
  stations: MonitoringStation[];
  reports: CitizenReport[];
  focusedStationId: string | null;
  onSelectStation: (stationId: string) => void;
  onGoToReport: () => void;
}

export function RiskMapView({
  stations,
  reports,
  focusedStationId,
  onSelectStation,
  onGoToReport,
}: RiskMapViewProps) {
  const [zoom, setZoom] = useState(1);
  const [showPlumes, setShowPlumes] = useState(true);
  const [showReports, setShowReports] = useState(true);
  const [showNoFishingZones, setShowNoFishingZones] = useState(true);
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [cursorCoords, setCursorCoords] = useState<{ lat: string; lng: string }>({
    lat: "14.8520",
    lng: "100.4120",
  });

  const activeStation = useMemo(() => {
    if (selectedReportId) return null;
    return (
      stations.find((s) => s.id === focusedStationId) || stations[0] || null
    );
  }, [stations, focusedStationId, selectedReportId]);

  const activeReport = useMemo(() => {
    if (!selectedReportId) return null;
    return reports.find((r) => r.id === selectedReportId) || null;
  }, [reports, selectedReportId]);

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const relX = (e.clientX - rect.left) / rect.width;
    const relY = (e.clientY - rect.top) / rect.height;
    // Map Thailand basin region approx 20.8N..12.5N, 97.5E..105.5E
    const lat = (20.8 - relY * 8.3).toFixed(4);
    const lng = (97.5 + relX * 8.0).toFixed(4);
    setCursorCoords({ lat, lng });
  };

  return (
    <div className="space-y-6">
      <div className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="text-xs text-slate-500 font-medium">
            แผนที่ภูมิสารสนเทศคุณภาพน้ำ · จุดตรวจวัดโลหะหนักและรายงานประชาชน
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 mt-1">
            แผนที่พื้นที่เสี่ยงสารปนเปื้อนในแม่น้ำ
          </h1>
        </div>

        {/* Layer Toggles */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 mr-1">
            <Layers className="w-3.5 h-3.5" />
            <span>ชั้นข้อมูล:</span>
          </span>
          <button
            type="button"
            onClick={() => setShowPlumes((v) => !v)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors cursor-pointer ${
              showPlumes
                ? "bg-teal-50 border-teal-700 text-teal-900"
                : "bg-white border-slate-200 text-slate-600"
            }`}
          >
            รัศมีการปนเปื้อน
          </button>
          <button
            type="button"
            onClick={() => setShowNoFishingZones((v) => !v)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors cursor-pointer ${
              showNoFishingZones
                ? "bg-teal-50 border-teal-700 text-teal-900"
                : "bg-white border-slate-200 text-slate-600"
            }`}
          >
            เขตรัศมีห้ามจับปลา
          </button>
          <button
            type="button"
            onClick={() => setShowReports((v) => !v)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors cursor-pointer ${
              showReports
                ? "bg-teal-50 border-teal-700 text-teal-900"
                : "bg-white border-slate-200 text-slate-600"
            }`}
          >
            รายงานประชาชน ({reports.length})
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* Interactive Map Canvas */}
        <div className="xl:col-span-8 bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-700">
              <span className="inline-flex items-center gap-1.5 font-medium">
                <span className="w-3 h-3 rounded-full bg-rose-600 inline-block" />
                <span>เกินมาตรฐานวิกฤต</span>
              </span>
              <span className="inline-flex items-center gap-1.5 font-medium">
                <span className="w-3 h-3 rounded-full bg-amber-500 inline-block" />
                <span>เฝ้าระวัง</span>
              </span>
              <span className="inline-flex items-center gap-1.5 font-medium">
                <span className="w-3 h-3 rounded-full bg-emerald-600 inline-block" />
                <span>ปกติปลอดภัย</span>
              </span>
              <span className="inline-flex items-center gap-1.5 font-medium">
                <span className="w-2.5 h-2.5 rotate-45 bg-indigo-600 inline-block" />
                <span>จุดแจ้งเหตุชุมชน</span>
              </span>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                aria-label="ซูมออก"
                onClick={() => setZoom((z) => Math.max(0.85, Number((z - 0.15).toFixed(2))))}
                className="p-1.5 bg-white border border-slate-200 rounded-md hover:bg-slate-100 cursor-pointer"
              >
                <ZoomOut className="w-4 h-4 text-slate-700" />
              </button>
              <span className="px-2 text-xs font-mono tabular-nums text-slate-600">
                {Math.round(zoom * 100)}%
              </span>
              <button
                type="button"
                aria-label="ซูมเข้า"
                onClick={() => setZoom((z) => Math.min(1.6, Number((z + 0.15).toFixed(2))))}
                className="p-1.5 bg-white border border-slate-200 rounded-md hover:bg-slate-100 cursor-pointer"
              >
                <ZoomIn className="w-4 h-4 text-slate-700" />
              </button>
              <button
                type="button"
                aria-label="รีเซ็ตมุมมอง"
                onClick={() => setZoom(1)}
                className="p-1.5 bg-white border border-slate-200 rounded-md hover:bg-slate-100 ml-1 cursor-pointer"
              >
                <LocateFixed className="w-4 h-4 text-slate-700" />
              </button>
            </div>
          </div>

          <div className="relative bg-slate-100 overflow-auto">
            <div
              style={{
                transform: `scale(${zoom})`,
                transformOrigin: "center center",
              }}
              className="transition-transform duration-150"
            >
              <svg
                viewBox="0 0 1000 620"
                onMouseMove={handleMouseMove}
                className="w-full h-auto cursor-crosshair select-none bg-[#eef4f6]"
                role="img"
                aria-label="แผนที่ลุ่มน้ำและตำแหน่งจุดเสี่ยงสารปนเปื้อน"
              >
                <defs>
                  <pattern
                    id="hydro-grid"
                    width="50"
                    height="50"
                    patternUnits="userSpaceOnUse"
                  >
                    <path
                      d="M 50 0 L 0 0 0 50"
                      fill="none"
                      stroke="#dce7eb"
                      strokeWidth="1"
                    />
                  </pattern>
                </defs>

                {/* Hydrographic Grid */}
                <rect width="1000" height="620" fill="url(#hydro-grid)" />

                {/* Simplified Thailand River Basin Topographic Silhouette */}
                <path
                  d="M220,75 L350,60 L485,82 L595,120 L740,145 L845,215 L835,345 L710,375 L590,415 L565,480 L470,485 L370,475 L245,445 L195,315 L205,180 Z"
                  fill="#ffffff"
                  stroke="#cbd5e1"
                  strokeWidth="2"
                />

                {/* River Corridors */}
                {/* Mekong North */}
                <path
                  d="M360,72 Q435,112 520,118 Q620,122 765,162"
                  fill="none"
                  stroke="#38bdf8"
                  strokeWidth="7"
                  strokeLinecap="round"
                  opacity="0.7"
                />
                {/* Ping -> Chao Phraya */}
                <path
                  d="M275,135 Q300,195 365,255 Q445,320 512,380 Q526,415 530,472"
                  fill="none"
                  stroke="#0ea5e9"
                  strokeWidth="8"
                  strokeLinecap="round"
                  opacity="0.75"
                />
                {/* Tha Chin */}
                <path
                  d="M375,275 Q388,335 390,395 Q394,435 402,470"
                  fill="none"
                  stroke="#0284c7"
                  strokeWidth="6"
                  strokeLinecap="round"
                  opacity="0.7"
                />
                {/* Mae Klong */}
                <path
                  d="M225,295 Q248,350 262,400 Q285,435 312,462"
                  fill="none"
                  stroke="#0284c7"
                  strokeWidth="6"
                  strokeLinecap="round"
                  opacity="0.7"
                />
                {/* Chi River */}
                <path
                  d="M625,220 Q685,255 735,265 Q785,280 822,310"
                  fill="none"
                  stroke="#0ea5e9"
                  strokeWidth="6.5"
                  strokeLinecap="round"
                  opacity="0.7"
                />

                {/* River Basin Labels */}
                <text x="455" y="96" className="fill-slate-500 text-[13px] font-semibold">
                  แม่น้ำโขง
                </text>
                <text x="235" y="172" className="fill-slate-500 text-[13px] font-semibold">
                  แม่น้ำปิง
                </text>
                <text x="538" y="348" className="fill-slate-500 text-[13px] font-semibold">
                  แม่น้ำเจ้าพระยา
                </text>
                <text x="310" y="346" className="fill-slate-500 text-[13px] font-semibold">
                  แม่น้ำท่าจีน
                </text>
                <text x="195" y="425" className="fill-slate-500 text-[13px] font-semibold">
                  แม่น้ำแม่กลอง
                </text>
                <text x="720" y="236" className="fill-slate-500 text-[13px] font-semibold">
                  แม่น้ำชี
                </text>

                {/* Plume & No-Fishing Exclusion Zones */}
                {stations.map((st) => {
                  if (st.status === "normal") return null;
                  const color =
                    st.status === "critical" ? "#e11d48" : "#d97706";
                  return (
                    <g key={`zone-${st.id}`}>
                      {showPlumes && (
                        <circle
                          cx={st.mapX}
                          cy={st.mapY}
                          r={st.status === "critical" ? 46 : 32}
                          fill={color}
                          fillOpacity={st.status === "critical" ? 0.14 : 0.1}
                        />
                      )}
                      {showNoFishingZones && st.status === "critical" && (
                        <circle
                          cx={st.mapX}
                          cy={st.mapY}
                          r={30}
                          fill="none"
                          stroke="#be123c"
                          strokeWidth="1.5"
                          strokeDasharray="5 4"
                        />
                      )}
                    </g>
                  );
                })}

                {/* Station Markers */}
                {stations.map((st) => {
                  const isSelected = activeStation?.id === st.id;
                  const fill =
                    st.status === "critical"
                      ? "#dc2626"
                      : st.status === "warning"
                      ? "#d97706"
                      : "#059669";

                  return (
                    <g
                      key={st.id}
                      onClick={() => {
                        setSelectedReportId(null);
                        onSelectStation(st.id);
                      }}
                      className="cursor-pointer"
                    >
                      {isSelected && (
                        <circle
                          cx={st.mapX}
                          cy={st.mapY}
                          r={18}
                          fill="none"
                          stroke="#0f766e"
                          strokeWidth="2.5"
                        />
                      )}
                      <circle
                        cx={st.mapX}
                        cy={st.mapY}
                        r={10}
                        fill={fill}
                        stroke="#ffffff"
                        strokeWidth="2.5"
                      />
                      <text
                        x={st.mapX + 14}
                        y={st.mapY + 4}
                        className="fill-slate-800 text-[12px] font-semibold"
                      >
                        {st.provinceTh} ({st.code})
                      </text>
                    </g>
                  );
                })}

                {/* Citizen Report Pins */}
                {showReports &&
                  reports.map((rep) => {
                    const isSelected = activeReport?.id === rep.id;
                    return (
                      <g
                        key={rep.id}
                        transform={`translate(${rep.mapX}, ${rep.mapY})`}
                        onClick={() => setSelectedReportId(rep.id)}
                        className="cursor-pointer"
                      >
                        {isSelected && (
                          <circle
                            cx={0}
                            cy={0}
                            r={15}
                            fill="none"
                            stroke="#4338ca"
                            strokeWidth="2"
                          />
                        )}
                        <polygon
                          points="0,-9 9,0 0,9 -9,0"
                          fill="#4f46e5"
                          stroke="#ffffff"
                          strokeWidth="2"
                        />
                      </g>
                    );
                  })}
              </svg>
            </div>

            {/* Bottom Coordinate Readout Bar */}
            <div className="px-4 py-2 bg-white border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
              <span>คลิกที่จุดตรวจวัดหรือเพชรสีน้ำเงินเพื่อดูรายละเอียดสารปนเปื้อน</span>
              <span className="font-mono tabular-nums">
                พิกัดเคอร์เซอร์: {cursorCoords.lat}°N, {cursorCoords.lng}°E
              </span>
            </div>
          </div>
        </div>

        {/* Right Inspection Panel */}
        <aside className="xl:col-span-4 bg-white border border-slate-200 rounded-xl p-6 space-y-5">
          {activeStation && (
            <>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-xs text-slate-500 font-mono">
                    {activeStation.code} · {activeStation.lat.toFixed(4)}°N,{" "}
                    {activeStation.lng.toFixed(4)}°E
                  </div>
                  <h2 className="text-lg font-bold text-slate-900 mt-1">
                    {activeStation.nameTh}
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {activeStation.riverNameTh} · จ.{activeStation.provinceTh}
                  </p>
                </div>
                <StatusBadge status={activeStation.status} />
              </div>

              <div className="grid grid-cols-2 gap-3 py-3 border-y border-slate-100 text-xs">
                <div>
                  <div className="text-slate-500">สารปรอท (Hg)</div>
                  <div
                    className={`text-base font-mono font-bold tabular-nums mt-0.5 ${
                      activeStation.mercuryMgL > 0.002
                        ? "text-rose-700"
                        : "text-slate-900"
                    }`}
                  >
                    {activeStation.mercuryMgL.toFixed(4)} mg/L
                  </div>
                </div>
                <div>
                  <div className="text-slate-500">สารตะกั่ว (Pb)</div>
                  <div
                    className={`text-base font-mono font-bold tabular-nums mt-0.5 ${
                      activeStation.leadMgL > 0.05
                        ? "text-rose-700"
                        : "text-slate-900"
                    }`}
                  >
                    {activeStation.leadMgL.toFixed(3)} mg/L
                  </div>
                </div>
                <div>
                  <div className="text-slate-500">สารหนู (As)</div>
                  <div className="text-base font-mono font-bold tabular-nums text-slate-900 mt-0.5">
                    {activeStation.arsenicMgL.toFixed(3)} mg/L
                  </div>
                </div>
                <div>
                  <div className="text-slate-500">ออกซิเจน (DO)</div>
                  <div className="text-base font-mono font-bold tabular-nums text-slate-900 mt-0.5">
                    {activeStation.dissolvedOxygenMgL.toFixed(1)} mg/L
                  </div>
                </div>
              </div>

              <div className="space-y-3 text-sm">
                <div>
                  <div className="text-xs font-semibold text-slate-800">
                    ประเมินสถานการณ์พื้นที่
                  </div>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    {activeStation.summaryTh}
                  </p>
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5">
                  <div className="text-xs font-semibold text-slate-900">
                    คำแนะนำด้านสัตว์น้ำและประมง
                  </div>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    {activeStation.fishAdvisoryTh}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={onGoToReport}
                className="w-full py-2.5 px-4 text-xs font-semibold text-white bg-teal-700 rounded-lg hover:bg-teal-800 transition-colors cursor-pointer"
              >
                แจ้งพบความผิดปกติเพิ่มเติมในพื้นที่นี้
              </button>
            </>
          )}

          {activeReport && (
            <>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-xs text-indigo-700 font-semibold">
                    รายงานภาคประชาชน · {activeReport.riverNameTh}
                  </div>
                  <h2 className="text-lg font-bold text-slate-900 mt-1">
                    {activeReport.issueLabelTh}
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {activeReport.locationDetail}
                  </p>
                </div>
                <StatusBadge status={activeReport.severity} />
              </div>

              {activeReport.photoDataUrl && (
                <div className="rounded-lg overflow-hidden border border-slate-200">
                  <img
                    src={activeReport.photoDataUrl}
                    alt={activeReport.issueLabelTh}
                    referrerPolicy="no-referrer"
                    className="w-full h-44 object-cover"
                  />
                </div>
              )}

              <p className="text-sm text-slate-700 leading-relaxed">
                {activeReport.description}
              </p>

              <div className="pt-3 border-t border-slate-100 text-xs text-slate-500 space-y-1">
                <div>ผู้แจ้งเหตุ: {activeReport.reporterName}</div>
                <div>เวลาที่แจ้ง: {activeReport.createdAt}</div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedReportId(null)}
                className="w-full py-2 px-4 text-xs font-semibold text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 cursor-pointer"
              >
                กลับไปดูข้อมูลสถานีตรวจวัด
              </button>
            </>
          )}
        </aside>
      </div>
    </div>
  );
}
