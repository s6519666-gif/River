import { useMemo, useState } from "react";
import {
  ArrowRight,
  Droplets,
  FlaskConical,
  Search,
  ShieldAlert,
} from "lucide-react";
import type {
  FieldSampleEvaluation,
  MonitoringStation,
  RiskLevel,
} from "../types/river";
import { StatusBadge } from "./StatusBadge";
import type { AppSection } from "./TopBar";

interface WaterCheckViewProps {
  stations: MonitoringStation[];
  loading: boolean;
  onNavigate: (section: AppSection) => void;
  onInspectOnMap: (stationId: string) => void;
}

const SAMPLE_PRESETS = [
  {
    label: "กรณีจำลอง: ค่าตัวอย่างต่ำ",
    values: {
      mercuryMgL: "0.0006",
      leadMgL: "0.015",
      arsenicMgL: "0.003",
      cadmiumMgL: "0.0012",
      dissolvedOxygenMgL: "6.4",
      ph: "7.2",
    },
  },
  {
    label: "กรณีจำลอง: ปรอทสูง",
    values: {
      mercuryMgL: "0.0045",
      leadMgL: "0.042",
      arsenicMgL: "0.008",
      cadmiumMgL: "0.003",
      dissolvedOxygenMgL: "3.4",
      ph: "6.4",
    },
  },
  {
    label: "กรณีจำลอง: ตะกั่วสูง",
    values: {
      mercuryMgL: "0.0019",
      leadMgL: "0.085",
      arsenicMgL: "0.013",
      cadmiumMgL: "0.006",
      dissolvedOxygenMgL: "3.1",
      ph: "6.2",
    },
  },
];

export function WaterCheckView({
  stations,
  loading,
  onNavigate,
  onInspectOnMap,
}: WaterCheckViewProps) {
  const [statusFilter, setStatusFilter] = useState<"all" | RiskLevel>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStationId, setSelectedStationId] = useState<string>(stations[0]?.id ?? "");
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [heroImgFailed, setHeroImgFailed] = useState(false);

  // Field sample evaluator state
  const [sampleForm, setSampleForm] = useState({
    mercuryMgL: "",
    leadMgL: "",
    arsenicMgL: "",
    cadmiumMgL: "",
    dissolvedOxygenMgL: "",
    ph: "",
  });
  const [evaluating, setEvaluating] = useState(false);
  const [evaluationResult, setEvaluationResult] =
    useState<FieldSampleEvaluation | null>(null);
  const [evalError, setEvalError] = useState<string | null>(null);

  const updateSampleForm = (field: keyof typeof sampleForm, value: string) => {
    setSampleForm((current) => ({ ...current, [field]: value }));
    setEvaluationResult(null);
    setEvalError(null);
  };

  const filteredStations = useMemo(() => {
    return stations.filter((st) => {
      const matchesStatus = statusFilter === "all" || st.status === statusFilter;
      const q = searchQuery.trim().toLowerCase();
      const matchesQuery =
        !q ||
        st.nameTh.toLowerCase().includes(q) ||
        st.riverNameTh.toLowerCase().includes(q) ||
        st.provinceTh.toLowerCase().includes(q) ||
        st.code.toLowerCase().includes(q);
      return matchesStatus && matchesQuery;
    });
  }, [stations, statusFilter, searchQuery]);

  const activeStation = useMemo(() => {
    return (
      stations.find((s) => s.id === selectedStationId) ||
      filteredStations[0] ||
      stations[0]
    );
  }, [stations, filteredStations, selectedStationId]);

  const kpis = useMemo(() => {
    const criticalCount = stations.filter((s) => s.status === "critical").length;
    const warningCount = stations.filter((s) => s.status === "warning").length;
    const maxHg =
      stations.length > 0
        ? Math.max(...stations.map((s) => s.mercuryMgL))
        : 0;
    const maxPb =
      stations.length > 0 ? Math.max(...stations.map((s) => s.leadMgL)) : 0;
    return {
      total: stations.length,
      flagged: criticalCount + warningCount,
      criticalCount,
      maxHg,
      maxPb,
    };
  }, [stations]);

  const handleEvaluateSample = async (e: React.FormEvent) => {
    e.preventDefault();
    const values = Object.values(sampleForm);
    if (values.some((value) => value.trim() === "" || !Number.isFinite(Number(value)))) {
      setEvaluationResult(null);
      setEvalError("กรุณากรอกค่าจากผลตรวจให้ครบทุกช่องก่อนเปรียบเทียบ");
      return;
    }
    setEvaluating(true);
    setEvalError(null);
    setEvaluationResult(null);
    try {
      const res = await fetch("/api/water-check/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mercuryMgL: Number(sampleForm.mercuryMgL),
          leadMgL: Number(sampleForm.leadMgL),
          arsenicMgL: Number(sampleForm.arsenicMgL),
          cadmiumMgL: Number(sampleForm.cadmiumMgL),
          dissolvedOxygenMgL: Number(sampleForm.dissolvedOxygenMgL),
          ph: Number(sampleForm.ph),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "ไม่สามารถประเมินผลตัวอย่างน้ำได้");
      }
      setEvaluationResult(data);
    } catch (err) {
      setEvalError(
        err instanceof Error ? err.message : "เกิดข้อผิดพลาดในการเชื่อมต่อ"
      );
    } finally {
      setEvaluating(false);
    }
  };

  // Chart calculations for activeStation
  const chartData = activeStation?.history ?? [];
  const chartWidth = 680;
  const chartHeight = 230;
  const padLeft = 56;
  const padRight = 24;
  const padTop = 24;
  const padBottom = 34;
  const innerW = chartWidth - padLeft - padRight;
  const innerH = chartHeight - padTop - padBottom;

  const maxHgChart = Math.max(
    0.0055,
    ...chartData.map((d) => d.mercuryMgL * 1.15)
  );
  const hgLimitY =
    padTop + innerH - (0.002 / maxHgChart) * innerH;

  const hgPoints = chartData.map((d, idx) => {
    const x =
      chartData.length > 1
        ? padLeft + (idx / (chartData.length - 1)) * innerW
        : padLeft + innerW / 2;
    const y = padTop + innerH - (d.mercuryMgL / maxHgChart) * innerH;
    return { x, y, ...d };
  });

  const hgPolyline = hgPoints.map((p) => `${p.x},${p.y}`).join(" ");

  return (
    <div className="space-y-8">
      {/* Editorial Hero Split */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-6 sm:p-8 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 font-medium">
              <span>รายงานจากแหล่งข้อมูลสาธารณะที่ตรวจสอบได้</span>
              <span aria-hidden="true">·</span>
              <span>ไม่มีข้อมูลสถานีแบบเรียลไทม์ที่เชื่อมต่อ</span>
            </div>

            <h1 className="font-display text-3xl sm:text-4xl font-bold text-slate-900 leading-tight [text-wrap:balance] max-w-2xl">
              ดูรายงานคุณภาพน้ำพร้อมแหล่งอ้างอิงและวันที่เก็บตัวอย่าง
            </h1>

            <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-xl">
              แสดงเฉพาะผลตรวจที่มีหน่วยงานและวันที่อ้างอิงชัดเจน ขณะนี้ไม่มี feed ผลตรวจสถานีล่าสุด
              การไม่มีข้อมูลไม่ใช่หลักฐานว่าน้ำปลอดภัยหรือปนเปื้อน
            </p>
          </div>

          <div className="pt-6 mt-6 border-t border-slate-100 flex flex-wrap items-center gap-4">
            <a
              href="#field-evaluator"
              className="px-5 py-2.5 text-sm font-semibold text-white bg-teal-700 rounded-lg hover:bg-teal-800 transition-colors inline-flex items-center gap-2 whitespace-nowrap shrink-0"
            >
              <FlaskConical className="w-4 h-4" />
              <span>ตรวจผลตัวอย่างน้ำภาคสนาม</span>
            </a>

            <button
              type="button"
              onClick={() => onNavigate("risk-map")}
              className="px-4 py-2.5 text-sm font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors inline-flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <span>เปิดแผนที่รายงานคุณภาพน้ำ</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="lg:col-span-5 relative rounded-xl overflow-hidden border border-slate-200 bg-slate-900 min-h-[260px]">
          {!heroImgFailed ? (
            <img
              src="/src/assets/images/river_monitoring_hero_1794815670593.jpg"
              alt="ภาพประกอบการตรวจวัดคุณภาพน้ำ ไม่ใช่ภาพจากสถานีที่เชื่อมต่อกับระบบ"
              referrerPolicy="no-referrer"
              onError={() => setHeroImgFailed(true)}
              className="w-full h-full lg:h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center p-6 text-slate-300 bg-gradient-to-br from-slate-800 to-teal-950">
              <Droplets className="w-10 h-10 mb-2 text-teal-400" />
              <span className="text-sm font-medium">ตัวอย่างการติดตามคุณภาพน้ำ</span>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/35 to-transparent flex flex-col justify-end p-6">
            <div className="text-xs text-slate-200 font-medium flex items-center gap-2">
              <span>ภาพประกอบ</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono tabular-nums">ไม่ใช่ข้อมูลสด</span>
            </div>
            <p className="text-sm sm:text-base font-semibold text-white mt-1">
              ดูผลตรวจที่มีแหล่งข้อมูลและวันที่ระบุไว้ชัดเจน
            </p>
          </div>
        </div>
      </section>

      {/* 4-column KPI Strip directly below hero */}
      <section
        aria-label="สรุปสถานการณ์คุณภาพน้ำ"
        className="grid grid-cols-2 lg:grid-cols-4 gap-4"
      >
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="text-xs text-slate-500 font-medium">สถานีตรวจวัดทั้งหมด</div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-mono font-bold tabular-nums text-slate-900">
              {kpis.total === 0 ? "—" : kpis.total}
            </span>
            <span className="text-xs text-slate-500">สถานีที่เชื่อมต่อ</span>
          </div>
          <div className="mt-1.5 text-xs text-slate-500">
            {kpis.total === 0 ? "ยังไม่มี feed ข้อมูลสถานีที่ยืนยัน" : "จำนวนสถานีในข้อมูลที่เชื่อมต่อ"}
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="text-xs text-slate-500 font-medium">จุดเกินเกณฑ์ / เฝ้าระวัง</div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-mono font-bold tabular-nums text-rose-700">
              {kpis.total === 0 ? "—" : kpis.flagged}
            </span>
            <span className="text-xs text-slate-500 font-medium">
              {kpis.total === 0 ? "ไม่มีข้อมูล" : `(${kpis.criticalCount} ระดับวิกฤต)`}
            </span>
          </div>
          <div className="mt-1.5 text-xs text-slate-500">
            {kpis.total === 0 ? "ไม่สามารถสรุปสถานะความปลอดภัยได้" : "ตามข้อมูลสถานีที่เชื่อมต่อ"}
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="text-xs text-slate-500 font-medium">ค่าปรอทสูงสุด (Hg)</div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-3xl font-mono font-bold tabular-nums text-slate-900">
              {kpis.total === 0 ? "—" : kpis.maxHg.toFixed(4)}
            </span>
            <span className="text-xs font-mono text-slate-500">mg/L</span>
          </div>
          <div className="mt-1.5 text-xs text-slate-500 font-medium">
            {kpis.total === 0 ? "ยังไม่มีข้อมูลตรวจวัด" : "ค่าสูงสุดจากข้อมูลสถานีที่เชื่อมต่อ"}
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="text-xs text-slate-500 font-medium">ค่าตะกั่วสูงสุด (Pb)</div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-3xl font-mono font-bold tabular-nums text-slate-900">
              {kpis.total === 0 ? "—" : kpis.maxPb.toFixed(3)}
            </span>
            <span className="text-xs font-mono text-slate-500">mg/L</span>
          </div>
          <div className="mt-1.5 text-xs text-slate-500 font-medium">
            {kpis.total === 0 ? "ยังไม่มีข้อมูลตรวจวัด" : "ค่าสูงสุดจากข้อมูลสถานีที่เชื่อมต่อ"}
          </div>
        </div>
      </section>

      {/* Station Water Check Table + Trend Chart */}
      <section className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        <div className="xl:col-span-7 bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                ตารางตรวจวัดคุณภาพน้ำรายสถานี
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                แสดงเฉพาะสถานีที่มีแหล่งข้อมูลอ้างอิงและวันที่ตรวจวัด
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
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
                    onClick={() => setStatusFilter(tab.id)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      statusFilter === tab.id
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

          <div className="px-5 py-3 bg-slate-50 border-b border-slate-200">
            <div className="relative max-w-sm">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ค้นหาชื่อสถานี แม่น้ำ หรือจังหวัด..."
                className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-teal-700"
              />
            </div>
          </div>

          {loading ? (
            <div className="p-6 space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="h-11 bg-slate-100 rounded-md animate-pulse"
                />
              ))}
            </div>
          ) : filteredStations.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-sm font-medium text-slate-700">
                ยังไม่มีผลตรวจจากสถานีที่มีแหล่งอ้างอิงเชื่อมต่อ
              </p>
              <p className="mx-auto mt-2 max-w-md text-xs leading-relaxed text-slate-500">
                การไม่มีข้อมูลไม่ใช่ผลยืนยันความปลอดภัยหรือการปนเปื้อนของน้ำ
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/70 text-xs font-semibold text-slate-500">
                    <th className="py-3 px-4">สถานี / แม่น้ำ</th>
                    <th className="py-3 px-3 text-right">ปรอท (Hg)</th>
                    <th className="py-3 px-3 text-right">ตะกั่ว (Pb)</th>
                    <th className="py-3 px-3 text-right">DO</th>
                    <th className="py-3 px-4">สถานะ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {filteredStations.map((st) => {
                    const isSelected = activeStation?.id === st.id;
                    return (
                      <tr
                        key={st.id}
                        onClick={() => setSelectedStationId(st.id)}
                        className={`cursor-pointer transition-colors ${
                          isSelected
                            ? "bg-teal-50/70"
                            : "hover:bg-slate-50"
                        }`}
                      >
                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-900">
                            {st.nameTh}
                          </div>
                          <div className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                            <span>{st.riverNameTh}</span>
                            <span aria-hidden="true">·</span>
                            <span>{st.provinceTh}</span>
                            <span aria-hidden="true">·</span>
                            <span className="font-mono">{st.code}</span>
                          </div>
                        </td>
                        <td
                          className={`py-3 px-3 text-right font-mono tabular-nums font-medium ${
                            st.mercuryMgL > 0.002
                              ? "text-rose-700 font-semibold"
                              : "text-slate-800"
                          }`}
                        >
                          {st.mercuryMgL.toFixed(4)}
                        </td>
                        <td
                          className={`py-3 px-3 text-right font-mono tabular-nums font-medium ${
                            st.leadMgL > 0.05
                              ? "text-rose-700 font-semibold"
                              : "text-slate-800"
                          }`}
                        >
                          {st.leadMgL.toFixed(3)}
                        </td>
                        <td
                          className={`py-3 px-3 text-right font-mono tabular-nums ${
                            st.dissolvedOxygenMgL < 4.0
                              ? "text-amber-700 font-semibold"
                              : "text-slate-700"
                          }`}
                        >
                          {st.dissolvedOxygenMgL.toFixed(1)}
                        </td>
                        <td className="py-3 px-4">
                          <StatusBadge status={st.status} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right Column: Selected Station Telemetry & 14-day Trend */}
        {activeStation && (
          <div className="xl:col-span-5 bg-white border border-slate-200 rounded-xl p-6 space-y-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-xs text-slate-500 font-medium flex items-center gap-1.5">
                  <span className="font-mono">{activeStation.code}</span>
                  <span aria-hidden="true">·</span>
                  <span>{activeStation.riverNameTh}</span>
                </div>
                <h3 className="text-lg font-bold text-slate-900 mt-1">
                  {activeStation.nameTh}
                </h3>
              </div>
              <StatusBadge status={activeStation.status} />
            </div>

            <p className="text-sm text-slate-600 leading-relaxed">
              {activeStation.summaryTh}
            </p>

            {/* Precision 6-Parameter Telemetry Strip */}
            <div className="grid grid-cols-3 gap-3 pt-2 pb-2 border-y border-slate-100">
              <div>
                <div className="text-xs text-slate-500">สารปรอท (Hg)</div>
                <div className="text-base font-mono font-bold tabular-nums text-slate-900 mt-0.5">
                  {activeStation.mercuryMgL.toFixed(4)}
                  <span className="text-[11px] font-normal text-slate-500 ml-1">
                    mg/L
                  </span>
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-500">สารตะกั่ว (Pb)</div>
                <div className="text-base font-mono font-bold tabular-nums text-slate-900 mt-0.5">
                  {activeStation.leadMgL.toFixed(3)}
                  <span className="text-[11px] font-normal text-slate-500 ml-1">
                    mg/L
                  </span>
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-500">สารหนู (As)</div>
                <div className="text-base font-mono font-bold tabular-nums text-slate-900 mt-0.5">
                  {activeStation.arsenicMgL.toFixed(3)}
                  <span className="text-[11px] font-normal text-slate-500 ml-1">
                    mg/L
                  </span>
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-500">แคดเมียม (Cd)</div>
                <div className="text-base font-mono font-bold tabular-nums text-slate-900 mt-0.5">
                  {activeStation.cadmiumMgL.toFixed(4)}
                  <span className="text-[11px] font-normal text-slate-500 ml-1">
                    mg/L
                  </span>
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-500">ความเป็นกรด-ด่าง</div>
                <div className="text-base font-mono font-bold tabular-nums text-slate-900 mt-0.5">
                  {activeStation.ph.toFixed(1)}
                  <span className="text-[11px] font-normal text-slate-500 ml-1">
                    pH
                  </span>
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-500">ความขุ่น</div>
                <div className="text-base font-mono font-bold tabular-nums text-slate-900 mt-0.5">
                  {activeStation.turbidityNtu}
                  <span className="text-[11px] font-normal text-slate-500 ml-1">
                    NTU
                  </span>
                </div>
              </div>
            </div>

            {/* Interactive 14-day Mercury Trend SVG Chart */}
            <div>
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="font-semibold text-slate-800">
                  แนวโน้มค่าสารปรอท (Hg) ย้อนหลัง 14 วัน
                </span>
                <span className="text-rose-700 font-mono">
                  เส้นประ = เกณฑ์สูงสุด 0.0020 mg/L
                </span>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-lg p-2">
                <svg
                  viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                  className="w-full h-auto overflow-visible"
                  role="img"
                  aria-label="กราฟแนวโน้มค่าปรอทย้อนหลัง 14 วัน"
                >
                  {/* Grid Lines */}
                  {[0, 0.25, 0.5, 0.75, 1].map((t) => {
                    const y = padTop + innerH * t;
                    const val = maxHgChart * (1 - t);
                    return (
                      <g key={t}>
                        <line
                          x1={padLeft}
                          y1={y}
                          x2={chartWidth - padRight}
                          y2={y}
                          stroke="#e2e8f0"
                          strokeWidth="1"
                        />
                        <text
                          x={padLeft - 8}
                          y={y + 4}
                          textAnchor="end"
                          className="fill-slate-400 font-mono text-[11px]"
                        >
                          {val.toFixed(4)}
                        </text>
                      </g>
                    );
                  })}

                  {/* Safety Threshold Line (0.0020 mg/L) */}
                  <line
                    x1={padLeft}
                    y1={hgLimitY}
                    x2={chartWidth - padRight}
                    y2={hgLimitY}
                    stroke="#dc2626"
                    strokeWidth="1.5"
                    strokeDasharray="6 4"
                  />

                  {/* Mercury Line */}
                  {hgPoints.length > 1 && (
                    <polyline
                      fill="none"
                      stroke="#0f766e"
                      strokeWidth="2.5"
                      points={hgPolyline}
                    />
                  )}

                  {/* Data Points & Crosshair Targets */}
                  {hgPoints.map((pt, idx) => {
                    const isOver = pt.mercuryMgL > 0.002;
                    const isHovered = hoveredIndex === idx;
                    return (
                      <g key={pt.date}>
                        {isHovered && (
                          <line
                            x1={pt.x}
                            y1={padTop}
                            x2={pt.x}
                            y2={padTop + innerH}
                            stroke="#94a3b8"
                            strokeWidth="1"
                            strokeDasharray="3 3"
                          />
                        )}
                        <circle
                          cx={pt.x}
                          cy={pt.y}
                          r={isHovered ? 6 : 4.5}
                          fill={isOver ? "#dc2626" : "#0f766e"}
                          stroke="#ffffff"
                          strokeWidth="1.5"
                        />
                        <text
                          x={pt.x}
                          y={chartHeight - 10}
                          textAnchor="middle"
                          className="fill-slate-500 font-sans text-[11px]"
                        >
                          {pt.date}
                        </text>
                        <rect
                          x={pt.x - 28}
                          y={padTop}
                          width={56}
                          height={innerH + 20}
                          fill="transparent"
                          className="cursor-crosshair"
                          onMouseEnter={() => setHoveredIndex(idx)}
                          onMouseLeave={() => setHoveredIndex(null)}
                        />
                      </g>
                    );
                  })}
                </svg>

                {/* Live Crosshair Readout */}
                <div className="mt-2 pt-2 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600 px-1">
                  {hoveredIndex !== null && hgPoints[hoveredIndex] ? (
                    <>
                      <span className="font-semibold text-slate-900">
                        วันที่ {hgPoints[hoveredIndex].date}
                      </span>
                      <span className="font-mono tabular-nums">
                        Hg {hgPoints[hoveredIndex].mercuryMgL.toFixed(4)} mg/L · Pb{" "}
                        {hgPoints[hoveredIndex].leadMgL.toFixed(3)} mg/L · DO{" "}
                        {hgPoints[hoveredIndex].dissolvedOxygenMgL.toFixed(1)} mg/L
                      </span>
                    </>
                  ) : (
                    <>
                      <span>เลื่อนเมาส์บนจุดข้อมูลเพื่อดูค่าตรวจวัดรายวัน</span>
                      <span className="font-mono tabular-nums">
                        ล่าสุด {activeStation.mercuryMgL.toFixed(4)} mg/L
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="text-xs text-slate-700 leading-relaxed">
                <span className="font-semibold text-slate-900">
                  คำแนะนำการบริโภคสัตว์น้ำ:{" "}
                </span>
                {activeStation.fishAdvisoryTh}
              </div>
              <button
                type="button"
                onClick={() => onInspectOnMap(activeStation.id)}
                className="px-3.5 py-2 text-xs font-semibold text-teal-800 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 whitespace-nowrap shrink-0 cursor-pointer"
              >
                ดูตำแหน่งบนแผนที่
              </button>
            </div>
          </div>
        )}
      </section>

      {/* Interactive Field Sample Evaluator */}
      <section
        id="field-evaluator"
        className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8"
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-6 space-y-5">
            <div>
              <div className="text-xs text-slate-500 font-medium">
                เครื่องมือเปรียบเทียบค่าที่ป้อน · ไม่ใช่ผลประเมินจากหน่วยงาน
              </div>
              <h2 className="text-xl font-bold text-slate-900 mt-1">
                เปรียบเทียบค่าตรวจวัดกับค่าอ้างอิงตัวอย่าง
              </h2>
              <p className="text-sm text-slate-600 mt-1">
                กรอกค่าจากผลตรวจจริงเพื่อเปรียบเทียบกับค่าอ้างอิงตัวอย่างในระบบ
                เครื่องมือนี้ไม่เชื่อมต่อสถานีหรือประกาศมาตรฐานล่าสุด และผลเปรียบเทียบไม่ใช่การรับรองความปลอดภัยของน้ำ
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-slate-500 mr-1">กรณีจำลองเท่านั้น:</span>
              {SAMPLE_PRESETS.map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => {
                    setSampleForm(preset.values);
                    setEvaluationResult(null);
                    setEvalError(null);
                  }}
                  className="px-3 py-1.5 text-xs font-medium bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors cursor-pointer"
                >
                  {preset.label}
                </button>
              ))}
              <p className="basis-full text-xs leading-relaxed text-slate-500">
                ทุกช่องเริ่มต้นว่าง กรณีจำลองจะเติมตัวเลขสมมุติเท่านั้น ไม่ใช่ผลตรวจจากแม่น้ำจริง
              </p>
            </div>

            <form onSubmit={handleEvaluateSample} className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <label className="block">
                  <span className="text-xs font-medium text-slate-700">
                    ปรอท Hg (mg/L)
                  </span>
                  <input
                    type="number"
                    step="0.0001"
                    min="0"
                    value={sampleForm.mercuryMgL}
                    onChange={(e) => updateSampleForm("mercuryMgL", e.target.value)}
                    className="mt-1 w-full px-3 py-2 text-sm font-mono tabular-nums border border-slate-200 rounded-lg focus:outline-none focus:border-teal-700"
                  />
                </label>

                <label className="block">
                  <span className="text-xs font-medium text-slate-700">
                    ตะกั่ว Pb (mg/L)
                  </span>
                  <input
                    type="number"
                    step="0.001"
                    min="0"
                    value={sampleForm.leadMgL}
                    onChange={(e) => updateSampleForm("leadMgL", e.target.value)}
                    className="mt-1 w-full px-3 py-2 text-sm font-mono tabular-nums border border-slate-200 rounded-lg focus:outline-none focus:border-teal-700"
                  />
                </label>

                <label className="block">
                  <span className="text-xs font-medium text-slate-700">
                    สารหนู As (mg/L)
                  </span>
                  <input
                    type="number"
                    step="0.001"
                    min="0"
                    value={sampleForm.arsenicMgL}
                    onChange={(e) => updateSampleForm("arsenicMgL", e.target.value)}
                    className="mt-1 w-full px-3 py-2 text-sm font-mono tabular-nums border border-slate-200 rounded-lg focus:outline-none focus:border-teal-700"
                  />
                </label>

                <label className="block">
                  <span className="text-xs font-medium text-slate-700">
                    แคดเมียม Cd (mg/L)
                  </span>
                  <input
                    type="number"
                    step="0.0005"
                    min="0"
                    value={sampleForm.cadmiumMgL}
                    onChange={(e) => updateSampleForm("cadmiumMgL", e.target.value)}
                    className="mt-1 w-full px-3 py-2 text-sm font-mono tabular-nums border border-slate-200 rounded-lg focus:outline-none focus:border-teal-700"
                  />
                </label>

                <label className="block">
                  <span className="text-xs font-medium text-slate-700">
                    ออกซิเจน DO (mg/L)
                  </span>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={sampleForm.dissolvedOxygenMgL}
                    onChange={(e) => updateSampleForm("dissolvedOxygenMgL", e.target.value)}
                    className="mt-1 w-full px-3 py-2 text-sm font-mono tabular-nums border border-slate-200 rounded-lg focus:outline-none focus:border-teal-700"
                  />
                </label>

                <label className="block">
                  <span className="text-xs font-medium text-slate-700">
                    ค่ากรด-ด่าง (pH)
                  </span>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="14"
                    value={sampleForm.ph}
                    onChange={(e) => updateSampleForm("ph", e.target.value)}
                    className="mt-1 w-full px-3 py-2 text-sm font-mono tabular-nums border border-slate-200 rounded-lg focus:outline-none focus:border-teal-700"
                  />
                </label>
              </div>

              <button
                type="submit"
                disabled={evaluating}
                className="px-5 py-2.5 text-sm font-semibold text-white bg-teal-700 rounded-lg hover:bg-teal-800 disabled:opacity-60 transition-colors cursor-pointer"
              >
                {evaluating ? "กำลังเปรียบเทียบ..." : "เปรียบเทียบค่ากับค่าอ้างอิงตัวอย่าง"}
              </button>
            </form>
          </div>

          <div className="lg:col-span-6 bg-slate-50 border border-slate-200 rounded-xl p-6 min-h-[300px] flex flex-col justify-center">
            {evalError && (
              <div className="p-4 bg-rose-50 border border-rose-200 rounded-lg text-sm text-rose-800">
                {evalError}
              </div>
            )}

            {!evaluationResult && !evalError && (
              <div className="text-center space-y-2 py-8">
                <ShieldAlert className="w-9 h-9 text-slate-400 mx-auto" />
                <p className="text-sm font-semibold text-slate-700">
                  รอค่าตรวจวัดจากผู้ใช้
                </p>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  กรอกผลตรวจจริงหรือเลือกกรณีจำลอง แล้วกดเปรียบเทียบ ค่าที่แสดงไม่ใช่ผลตรวจจากหน่วยงาน
                </p>
              </div>
            )}

            {evaluationResult && (
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-4 pb-3 border-b border-slate-200">
                  <div>
                    <div className="text-xs text-slate-500 font-medium">
                      ผลเปรียบเทียบจากค่าที่คุณป้อน · ไม่ใช่ผลตรวจยืนยัน
                    </div>
                    <h3 className="text-base font-bold text-slate-900 mt-1">
                      {evaluationResult.overallStatus === "normal"
                        ? "ค่าที่ป้อนอยู่ในช่วงค่าอ้างอิงที่ตั้งไว้"
                        : "มีค่าที่ป้อนบางรายการอยู่นอกค่าอ้างอิงที่ตั้งไว้"}
                    </h3>
                  </div>
                  <span className="shrink-0 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-600">
                    ค่าที่ป้อนเท่านั้น
                  </span>
                </div>

                <p className="rounded-lg border border-amber-200 bg-amber-50 px-3.5 py-3 text-xs leading-relaxed text-amber-900">
                  ผลนี้คำนวณจากค่าที่คุณป้อนและค่าอ้างอิงตัวอย่างในระบบเท่านั้น ไม่ได้ยืนยันแหล่งที่มา การปนเปื้อน หรือความปลอดภัยของน้ำ และไม่ควรใช้ตัดสินใจเรื่องดื่ม อาบน้ำ หรือใช้น้ำเพื่อเกษตรและเพาะเลี้ยงสัตว์น้ำ
                </p>

                {evaluationResult.exceededParameters.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-xs font-semibold text-slate-700">
                      ค่าที่ป้อนอยู่นอกหรือใกล้ค่าอ้างอิงในระบบ
                    </div>
                    <div className="divide-y divide-slate-200 border border-slate-200 rounded-lg bg-white">
                      {evaluationResult.exceededParameters.map((item) => (
                        <div
                          key={item.parameterTh}
                          className="px-3.5 py-2.5 flex items-center justify-between text-xs gap-2"
                        >
                          <span className="font-medium text-slate-900">
                            {item.parameterTh}
                          </span>
                          <div className="font-mono tabular-nums text-right">
                            <span
                              className={
                                item.severity === "critical"
                                  ? "text-rose-700 font-semibold"
                                  : "text-amber-700 font-semibold"
                              }
                            >
                              {item.measured}
                            </span>
                            <span className="text-slate-400 ml-2">
                              (ค่าอ้างอิงในระบบ {item.limit})
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="rounded-lg border border-slate-200 bg-white px-3.5 py-3 text-xs leading-relaxed text-slate-700">
                  เครื่องมือนี้ไม่สามารถให้คำแนะนำการใช้น้ำหรือยืนยันผลกระทบต่อสุขภาพได้ หากต้องตัดสินใจจากคุณภาพน้ำ ให้ใช้ผลตรวจจากห้องปฏิบัติการที่เชื่อถือได้และคำแนะนำปัจจุบันจากหน่วยงานที่รับผิดชอบ
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
