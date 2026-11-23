import { useState } from "react";
import { AlertTriangle, ArrowUpRight, Info, MapPinned } from "lucide-react";
import type { CitizenReport, MonitoringStation } from "../types/river";
import { PCD_REPORT } from "../data/publicWaterReports";
import { LeafletWaterMap } from "./LeafletWaterMap";

interface RiskMapViewProps {
  stations: MonitoringStation[];
  reports: CitizenReport[];
  focusedStationId: string | null;
  onSelectStation: (stationId: string) => void;
  onGoToReport: () => void;
}

export function RiskMapView({ reports, onGoToReport }: RiskMapViewProps) {
  const [selectedReportId, setSelectedReportId] = useState(PCD_REPORT.reports[0].id);
  const selectedReport =
    PCD_REPORT.reports.find((report) => report.id === selectedReportId) ??
    PCD_REPORT.reports[0];

  return (
    <div className="space-y-6">
      <header className="space-y-3">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-teal-800">
          <MapPinned className="h-4 w-4" aria-hidden="true" />
          <span>แผนที่รายงานคุณภาพน้ำจากหน่วยงาน</span>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold leading-tight text-slate-950 sm:text-3xl">
              ผลตรวจคุณภาพน้ำภาคเหนือ
            </h1>
            <p className="mt-1 max-w-3xl text-sm leading-relaxed text-slate-600">
              ผลตรวจสารหนูที่กรมควบคุมมลพิษรายงานจากตัวอย่างน้ำช่วง {PCD_REPORT.samplingDateTh}
              {" "}เป็นข้อมูลย้อนหลัง ไม่ใช่สถานะคุณภาพน้ำปัจจุบัน
            </p>
          </div>
          <a
            href={PCD_REPORT.sourceUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-teal-900 transition-colors hover:bg-teal-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-700"
          >
            เปิดรายงานต้นทาง <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
          </a>
        </div>
      </header>

      <section
        aria-label="ข้อมูลแหล่งที่มาและข้อจำกัด"
        className="grid gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 sm:grid-cols-[auto_1fr] sm:items-start"
      >
        <Info className="mt-0.5 h-5 w-5 text-amber-800" aria-hidden="true" />
        <div>
          <h2 className="text-sm font-bold text-amber-950">
            ผลตรวจที่หน่วยงานรายงาน ไม่ใช่ข้อมูลสด
          </h2>
          <p className="mt-1 text-xs leading-relaxed text-amber-950/85">
            แหล่งข้อมูล: {PCD_REPORT.agencyTh} · วันเก็บตัวอย่าง {PCD_REPORT.samplingDateTh} ·
            เกณฑ์สารหนูในน้ำผิวดิน {PCD_REPORT.standardMgL.toFixed(3)} mg/L
            {" "}หน้ารายงานระบุพื้นที่และชื่อสถานี แต่ไม่ได้เผยแพร่พิกัดสถานีในเนื้อหาที่อ้างอิง
            วงกลมบนแผนที่จึงเป็นเพียงตัวระบุพื้นที่โดยประมาณ ไม่ใช่จุดตรวจวัด
          </p>
        </div>
      </section>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.45fr)_minmax(330px,0.85fr)]">
        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <div className="flex flex-col gap-3 border-b border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-950">แม่น้ำที่มีผลรายงาน</h2>
              <p className="mt-0.5 text-xs text-slate-500">
                เลือกพื้นที่เพื่อเลื่อนแผนที่และดูผลที่รายงาน
              </p>
            </div>
            <div className="flex flex-wrap gap-2" aria-label="เลือกพื้นที่รายงาน">
              {PCD_REPORT.reports.map((report) => (
                <button
                  key={report.id}
                  type="button"
                  aria-pressed={selectedReport.id === report.id}
                  onClick={() => setSelectedReportId(report.id)}
                  className={`min-h-9 rounded-lg px-3 py-2 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-700 ${
                    selectedReport.id === report.id
                      ? "bg-teal-800 text-white"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  {report.riverNameTh}
                </button>
              ))}
            </div>
          </div>
          <LeafletWaterMap
            reports={PCD_REPORT.reports}
            selectedReportId={selectedReport.id}
            onSelectReport={setSelectedReportId}
          />
          <div className="flex items-start gap-2 border-t border-slate-200 bg-slate-50 px-4 py-3 text-xs leading-relaxed text-slate-600">
            <MapPinned className="mt-0.5 h-4 w-4 shrink-0 text-teal-800" aria-hidden="true" />
            <p>
              วงกลมระบุตำแหน่งพื้นที่รายงานโดยประมาณเท่านั้น —
              ไม่ใช่พิกัดเก็บตัวอย่างหรือขอบเขตการปนเปื้อน
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-slate-100 px-4 py-2 text-[11px] text-slate-500">
            <span>แผนที่ฐาน: © OpenStreetMap contributors</span>
            <a
              href="https://www.openstreetmap.org/copyright"
              target="_blank"
              rel="noreferrer"
              className="underline decoration-slate-400 underline-offset-2 hover:text-slate-800"
            >
              ข้อมูลลิขสิทธิ์แผนที่
            </a>
          </div>
        </section>

        <aside className="space-y-4">
          <section className="rounded-xl border border-slate-200 bg-white p-5">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="text-xs font-semibold text-slate-500">รายงานผลอย่างเป็นทางการ</p>
                <h2 className="mt-1 text-xl font-bold text-slate-950">
                  {selectedReport.riverNameTh}
                </h2>
                <p className="mt-0.5 text-xs text-slate-500">{selectedReport.approximateAreaTh}</p>
              </div>
              <span className="rounded-full bg-rose-50 px-2.5 py-1 text-xs font-bold text-rose-800">
                As &gt; 0.010 mg/L
              </span>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-slate-50 p-3">
                <div className="text-xs text-slate-500">จุดที่เกินเกณฑ์</div>
                <div className="mt-1 font-mono text-2xl font-bold tabular-nums text-rose-800">
                  {selectedReport.exceedanceCount}/{selectedReport.sampleCount}
                </div>
                <div className="text-[11px] text-slate-500">ตามรายงาน คพ.</div>
              </div>
              <div className="rounded-lg bg-slate-50 p-3">
                <div className="text-xs text-slate-500">สารที่ตรวจ</div>
                <div className="mt-1 text-lg font-bold text-slate-900">สารหนู (As)</div>
                <div className="font-mono text-[11px] text-slate-500">mg/L · เกณฑ์ 0.010</div>
              </div>
            </div>

            <div className="mt-5">
              <div className="mb-2 flex items-center justify-between gap-3">
                <h3 className="text-sm font-bold text-slate-900">ค่าที่รายงานตามสถานี</h3>
                <span className="text-[11px] text-slate-500">เก็บ {PCD_REPORT.samplingDateTh}</span>
              </div>
              <ul className="max-h-[350px] divide-y divide-slate-100 overflow-y-auto rounded-lg border border-slate-100">
                {selectedReport.samples.map((sample) => (
                  <li key={sample.code} className="flex items-start justify-between gap-3 px-3 py-2.5">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="font-mono text-xs font-bold text-slate-800">{sample.code}</span>
                        {sample.arsenicMgL !== null && sample.arsenicMgL > PCD_REPORT.standardMgL && (
                          <span className="rounded bg-rose-50 px-1.5 py-0.5 text-[10px] font-semibold text-rose-800">
                            เกินเกณฑ์ตามรายงาน
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 text-[11px] leading-relaxed text-slate-500">{sample.localityTh}</p>
                    </div>
                    <span className={`shrink-0 font-mono text-xs font-semibold tabular-nums ${sample.arsenicMgL !== null && sample.arsenicMgL > PCD_REPORT.standardMgL ? "text-rose-800" : "text-slate-700"}`}>
                      {sample.arsenicMgL === null ? "< 0.010" : sample.arsenicMgL.toFixed(3)}
                    </span>
                  </li>
                ))}
              </ul>
              <p className="mt-2 text-[11px] leading-relaxed text-slate-500">
                ค่า “&lt; 0.010” หมายถึงรายงานระบุว่าต่ำกว่าเกณฑ์ โดยไม่ได้ให้ค่าตัวเลขที่แน่นอน
              </p>
            </div>

            <div className="mt-5 border-t border-slate-100 pt-4">
              <p className="text-xs font-semibold text-slate-700">แหล่งข้อมูลและวันที่</p>
              <p className="mt-1 text-xs leading-relaxed text-slate-600">
                {PCD_REPORT.agencyTh} · {PCD_REPORT.titleTh} · เก็บตัวอย่าง {PCD_REPORT.samplingDateTh}
              </p>
              <a
                href={PCD_REPORT.sourceUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-teal-800 underline decoration-teal-700/40 underline-offset-2 hover:text-teal-950"
              >
                อ่านผลตรวจฉบับเต็ม <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
              </a>
            </div>
          </section>
        </aside>
      </div>

      <section className="grid gap-4 rounded-xl border border-amber-200 bg-amber-50 p-4 sm:grid-cols-[auto_1fr_auto] sm:items-center">
        <AlertTriangle className="h-5 w-5 text-amber-800" aria-hidden="true" />
        <div>
          <h2 className="text-sm font-bold text-amber-950">
            รายงานจากชุมชนเป็นข้อสังเกตที่ยังไม่ยืนยัน
          </h2>
          <p className="mt-1 text-xs leading-relaxed text-amber-950/85">
            มี {reports.length} รายการในระบบ รายงานเหล่านี้ไม่ใช่ผลตรวจจากห้องปฏิบัติการและไม่ถูกปักเป็นตำแหน่งจริง
            เพราะแบบฟอร์มไม่ได้เก็บพิกัดที่ตรวจสอบได้
          </p>
        </div>
        <button
          type="button"
          onClick={onGoToReport}
          className="inline-flex min-h-10 items-center justify-center rounded-lg border border-amber-300 bg-white px-4 py-2 text-xs font-semibold text-amber-950 transition-colors hover:bg-amber-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-800"
        >
          ดู/ส่งรายงานจากชุมชน
        </button>
      </section>
    </div>
  );
}
