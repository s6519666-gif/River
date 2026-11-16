import { useMemo, useState } from "react";
import { CheckCircle2, Fish, Info, ShieldAlert } from "lucide-react";
import { FISH_SAFETY_LIST } from "../data/fishSafetyData";
import type { MonitoringStation } from "../types/river";
import { StatusBadge } from "./StatusBadge";

interface FishSafetyViewProps {
  stations: MonitoringStation[];
}

export function FishSafetyView({ stations }: FishSafetyViewProps) {
  const [selectedSpeciesId, setSelectedSpeciesId] = useState<string>(
    FISH_SAFETY_LIST[0].id
  );
  const [selectedStationId, setSelectedStationId] = useState<string>(
    stations[0]?.id || "st-cp-01"
  );
  const [riskFilter, setRiskFilter] = useState<"all" | "low" | "moderate" | "high">(
    "all"
  );
  const [imgFailed, setImgFailed] = useState(false);

  const selectedSpecies = useMemo(
    () =>
      FISH_SAFETY_LIST.find((f) => f.id === selectedSpeciesId) ||
      FISH_SAFETY_LIST[0],
    [selectedSpeciesId]
  );

  const selectedStation = useMemo(
    () =>
      stations.find((s) => s.id === selectedStationId) || stations[0] || null,
    [stations, selectedStationId]
  );

  // Combined safety verdict for species + river station
  const combinedVerdict = useMemo(() => {
    if (!selectedStation) {
      return {
        level: "normal" as const,
        headline: "ตรวจสอบความปลอดภัยพื้นฐานตามชนิดปลา",
        detail: selectedSpecies.summaryTh,
      };
    }

    if (
      selectedStation.status === "critical" &&
      selectedSpecies.bioaccumulationRisk === "high"
    ) {
      return {
        level: "critical" as const,
        headline: `งดจับและงดบริโภค${selectedSpecies.nameTh}จาก${selectedStation.riverNameTh} (${selectedStation.provinceTh})`,
        detail: `สถานีตรวจพบสารปรอท ${selectedStation.mercuryMgL.toFixed(
          4
        )} mg/L และตะกั่ว ${selectedStation.leadMgL.toFixed(
          3
        )} mg/L เกินค่ามาตรฐาน ขณะที่${selectedSpecies.nameTh}เป็นปลาหน้าดิน/ไขมันสูงที่สะสมโลหะหนักได้มาก`,
      };
    }

    if (
      selectedStation.status === "critical" ||
      (selectedStation.status === "warning" &&
        selectedSpecies.bioaccumulationRisk !== "low")
    ) {
      return {
        level: "warning" as const,
        headline: `ควรหลีกเลี่ยงหรือจำกัดปริมาณ${selectedSpecies.nameTh}จากบริเวณนี้`,
        detail: `พื้นที่${selectedStation.nameTh}อยู่ในระดับเฝ้าระวัง/เกินเกณฑ์ ควรจำกัดปริมาณบริโภคไม่เกิน ${selectedSpecies.weeklyLimitSensitiveGrams}–${selectedSpecies.weeklyLimitAdultGrams} กรัม/สัปดาห์ และตัดส่วนไขมันหน้าท้องกับเครื่องในออกทั้งหมด`,
      };
    }

    return {
      level: "normal" as const,
      headline: `บริโภค${selectedSpecies.nameTh}จากเขต${selectedStation.provinceTh}ได้อย่างปลอดภัย`,
      detail: `คุณภาพน้ำในพื้นที่นี้อยู่ในเกณฑ์มาตรฐาน แนะนำปริมาณไม่เกิน ${selectedSpecies.weeklyLimitAdultGrams} กรัม/สัปดาห์สำหรับผู้ใหญ่ทั่วไป`,
    };
  }, [selectedSpecies, selectedStation]);

  const filteredSpecies = useMemo(() => {
    if (riskFilter === "all") return FISH_SAFETY_LIST;
    return FISH_SAFETY_LIST.filter((f) => f.bioaccumulationRisk === riskFilter);
  }, [riskFilter]);

  return (
    <div className="space-y-8">
      {/* Header Split with Reference Photography + Interactive Fish Checker */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <div className="lg:col-span-5 rounded-xl overflow-hidden border border-slate-200 bg-slate-900 relative min-h-[260px]">
          {!imgFailed ? (
            <img
              src="/src/assets/images/fish_safety_reference_1794815671870.jpg"
              alt="ปลานิลและปลาช่อนน้ำจืดสำหรับตรวจสอบความปลอดภัยในการบริโภค"
              referrerPolicy="no-referrer"
              onError={() => setImgFailed(true)}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center p-6 text-slate-300 bg-slate-800">
              <Fish className="w-10 h-10 mb-2 text-teal-400" />
              <span className="text-sm">คู่มือความปลอดภัยสัตว์น้ำจืด</span>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/35 to-transparent flex flex-col justify-end p-6">
            <div className="text-xs text-slate-200 font-medium">
              คู่มือโภชนาการปลอดภัย · สัตว์น้ำจืด 8 ชนิดหลัก
            </div>
            <h1 className="font-display text-2xl font-bold text-white mt-1">
              ความปลอดภัยในการบริโภคปลาและสัตว์น้ำ
            </h1>
          </div>
        </div>

        {/* Interactive Checker */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-6 sm:p-8 flex flex-col justify-between space-y-5">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              ตรวจสอบความเสี่ยงก่อนจับหรือเลือกซื้อปลา
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              เลือกชนิดปลาและแหล่งน้ำเพื่อประเมินความเสี่ยงการสะสมปรอทและตะกั่วในเนื้อปลา
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="block">
              <span className="text-xs font-semibold text-slate-700">
                1. เลือกชนิดปลาที่ต้องการตรวจสอบ
              </span>
              <select
                value={selectedSpeciesId}
                onChange={(e) => setSelectedSpeciesId(e.target.value)}
                className="mt-1.5 w-full px-3 py-2.5 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-teal-700"
              >
                {FISH_SAFETY_LIST.map((fish) => (
                  <option key={fish.id} value={fish.id}>
                    {fish.nameTh} ({fish.habitatLayerTh})
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="text-xs font-semibold text-slate-700">
                2. เลือกแม่น้ำ / สถานีใกล้จุดจับปลา
              </span>
              <select
                value={selectedStationId}
                onChange={(e) => setSelectedStationId(e.target.value)}
                className="mt-1.5 w-full px-3 py-2.5 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-teal-700"
              >
                {stations.map((st) => (
                  <option key={st.id} value={st.id}>
                    {st.riverNameTh} — {st.provinceTh} ({st.code})
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="text-sm font-bold text-slate-900">
                {combinedVerdict.headline}
              </div>
              <StatusBadge status={combinedVerdict.level} />
            </div>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              {combinedVerdict.detail}
            </p>
            <div className="pt-2 border-t border-slate-200 flex flex-wrap gap-6 text-xs">
              <div>
                <span className="text-slate-500">ผู้ใหญ่ทั่วไป: </span>
                <span className="font-mono font-bold tabular-nums text-slate-900">
                  {combinedVerdict.level === "critical"
                    ? "0"
                    : selectedSpecies.weeklyLimitAdultGrams}{" "}
                  กรัม/สัปดาห์
                </span>
              </div>
              <div>
                <span className="text-slate-500">หญิงตั้งครรภ์และเด็กเล็ก: </span>
                <span className="font-mono font-bold tabular-nums text-slate-900">
                  {combinedVerdict.level === "critical"
                    ? "0"
                    : selectedSpecies.weeklyLimitSensitiveGrams}{" "}
                  กรัม/สัปดาห์
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Species Directory */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              ฐานข้อมูลการสะสมสารปนเปื้อนรายชนิดปลา
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              ข้อมูลจำแนกตามพฤติกรรมการหากินและอัตราการสะสมโลหะหนักในห่วงโซ่อาหาร
            </p>
          </div>

          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg self-start">
            {(
              [
                { id: "all", label: "ทุกชนิด" },
                { id: "low", label: "ความเสี่ยงต่ำ" },
                { id: "moderate", label: "ปานกลาง" },
                { id: "high", label: "สะสมสูง" },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setRiskFilter(tab.id)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  riskFilter === tab.id
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredSpecies.map((fish) => {
            const riskLevel =
              fish.bioaccumulationRisk === "high"
                ? "critical"
                : fish.bioaccumulationRisk === "moderate"
                ? "warning"
                : "normal";
            const riskText =
              fish.bioaccumulationRisk === "high"
                ? "สะสมโลหะหนักสูง"
                : fish.bioaccumulationRisk === "moderate"
                ? "สะสมปานกลาง"
                : "ความเสี่ยงต่ำ";

            return (
              <article
                key={fish.id}
                className="bg-white border border-slate-200 rounded-xl p-6 space-y-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-xs text-slate-500 flex items-center gap-1.5">
                      <span className="italic">{fish.scientificName}</span>
                      <span aria-hidden="true">·</span>
                      <span>{fish.habitatLayerTh}</span>
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 mt-1">
                      {fish.nameTh}
                    </h3>
                  </div>
                  <StatusBadge status={riskLevel} customLabel={riskText} />
                </div>

                <p className="text-sm text-slate-600 leading-relaxed">
                  {fish.summaryTh}
                </p>

                <div className="grid grid-cols-2 gap-3 py-3 border-y border-slate-100 text-xs">
                  <div>
                    <div className="text-slate-500">เกณฑ์ผู้ใหญ่ทั่วไป</div>
                    <div className="font-mono font-bold tabular-nums text-slate-900 mt-0.5">
                      ≤ {fish.weeklyLimitAdultGrams} กรัม/สัปดาห์
                    </div>
                  </div>
                  <div>
                    <div className="text-slate-500">หญิงตั้งครรภ์ / เด็ก</div>
                    <div className="font-mono font-bold tabular-nums text-slate-900 mt-0.5">
                      {fish.weeklyLimitSensitiveGrams === 0
                        ? "งดจากเขตเสี่ยง"
                        : `≤ ${fish.weeklyLimitSensitiveGrams} กรัม/สัปดาห์`}
                    </div>
                  </div>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex items-start gap-2 text-rose-700">
                    <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>
                      <strong>พื้นที่ควรหลีกเลี่ยง:</strong>{" "}
                      {fish.avoidZonesTh.join(" · ")}
                    </span>
                  </div>
                  <div className="flex items-start gap-2 text-emerald-700">
                    <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>
                      <strong>แหล่งน้ำแนะนำ:</strong> {fish.safeZonesTh.join(" · ")}
                    </span>
                  </div>
                  <div className="flex items-start gap-2 text-slate-600">
                    <Info className="w-4 h-4 shrink-0 mt-0.5 text-slate-400" />
                    <span>
                      <strong>วิธีเตรียมอาหารปลอดภัย:</strong>{" "}
                      {fish.preparationTipsTh.join(" / ")}
                    </span>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}
