import { useEffect } from "react";
import {
  CircleMarker,
  MapContainer,
  Popup,
  TileLayer,
  ZoomControl,
  useMap,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import type { OfficialRiverReport } from "../data/publicWaterReports";

interface LeafletWaterMapProps {
  reports: readonly OfficialRiverReport[];
  selectedReportId: string;
  onSelectReport: (reportId: string) => void;
}

function FocusSelectedArea({ report }: { report: OfficialRiverReport }) {
  const map = useMap();

  useEffect(() => {
    map.flyTo(report.locator, 8, { duration: 0.6 });
  }, [map, report.locator]);

  return null;
}

export function LeafletWaterMap({
  reports,
  selectedReportId,
  onSelectReport,
}: LeafletWaterMapProps) {
  const selectedReport = reports.find((report) => report.id === selectedReportId) ?? reports[0];

  if (!selectedReport) return null;

  return (
    <div
      className="h-[420px] w-full overflow-hidden rounded-xl sm:h-[500px]"
      role="region"
      aria-label="แผนที่แสดงพื้นที่รายงานผลตรวจคุณภาพน้ำจากกรมควบคุมมลพิษ"
    >
      <MapContainer
        center={selectedReport.locator}
        zoom={8}
        scrollWheelZoom={false}
        zoomControl={false}
        className="h-full w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <ZoomControl position="bottomright" />
        <FocusSelectedArea report={selectedReport} />
        {reports.map((report) => (
          <CircleMarker
            key={report.id}
            center={report.locator}
            radius={report.id === selectedReport.id ? 12 : 9}
            pathOptions={{
              color: "#0f766e",
              fillColor: "#14b8a6",
              fillOpacity: report.id === selectedReport.id ? 0.9 : 0.65,
              weight: 3,
            }}
            eventHandlers={{ click: () => onSelectReport(report.id) }}
          >
            <Popup>
              <div className="space-y-1 text-sm">
                <strong>{report.riverNameTh}</strong>
                <div>{report.exceedanceCount} จาก {report.sampleCount} จุด เกินเกณฑ์สารหนูที่ PCD รายงาน</div>
                <div>เก็บตัวอย่าง {"12–16 พฤษภาคม 2568 (2025)"}</div>
                <div className="font-medium text-amber-800">หมุดนี้เป็นตัวระบุพื้นที่โดยประมาณ ไม่ใช่พิกัดจุดเก็บตัวอย่าง</div>
                <a
                  href="https://www.pcd.go.th/pcd_news/35672/"
                  target="_blank"
                  rel="noreferrer"
                  className="font-medium text-teal-800 underline"
                >
                  อ่านรายงานกรมควบคุมมลพิษ
                </a>
              </div>
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>
    </div>
  );
}
