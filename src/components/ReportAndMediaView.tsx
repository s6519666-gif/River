import { useState } from "react";
import {
  Camera,
  CheckCircle2,
  Download,
  Image as ImageIcon,
  Send,
  Sparkles,
  Upload,
  Wand2,
} from "lucide-react";
import type {
  AspectRatioOption,
  CitizenReport,
  ImageSizeOption,
  ReportStatus,
  RiskLevel,
} from "../types/river";
import { StatusBadge } from "./StatusBadge";

interface ReportAndMediaViewProps {
  reports: CitizenReport[];
  onReportCreated: (report: CitizenReport) => void;
  onReportStatusUpdated: (report: CitizenReport) => void;
}

const RIVER_OPTIONS = [
  "แม่น้ำเจ้าพระยา",
  "แม่น้ำท่าจีน",
  "แม่น้ำแม่กลอง",
  "แม่น้ำโขง",
  "แม่น้ำปิง",
  "แม่น้ำชี",
];

const POSTER_PROMPT_PRESETS = [
  "Infographic poster in clean modern documentary style showing Thai riverside village water safety tips against mercury and lead contamination, clear river water vs warning signs, crisp editorial layout, no gibberish text",
  "Photorealistic documentary photograph of community volunteers testing river water quality along a lush Thai river bank at morning light, scientific testing kit, clean environmental journalism style",
];

const EDIT_PROMPT_PRESETS = [
  "Add subtle scientific environmental inspection markers and clean water clarity enhancement showing restored healthy river ecosystem",
  "Transform the water scene to highlight surface oil slick and warning buoy markers for community water safety education",
];

function statusLabelTh(status: ReportStatus): string {
  if (status === "resolved") return "ปิดการติดตามในแอป (ไม่ได้ยืนยันผลตรวจ)";
  if (status === "investigating") return "กำลังติดตามในแอป (ยังไม่ยืนยัน)";
  return "รอการติดตามในแอป";
}

export function ReportAndMediaView({
  reports,
  onReportCreated,
  onReportStatusUpdated,
}: ReportAndMediaViewProps) {
  const [activeTab, setActiveTab] = useState<"report" | "studio">("report");

  // Citizen Report Form state
  const [reporterName, setReporterName] = useState("");
  const [riverNameTh, setRiverNameTh] = useState("แม่น้ำเจ้าพระยา");
  const [locationDetail, setLocationDetail] = useState("");
  const [issueType, setIssueType] = useState<CitizenReport["issueType"]>("dead_fish");
  const [severity, setSeverity] = useState<RiskLevel>("warning");
  const [description, setDescription] = useState("");
  const [photoDataUrl, setPhotoDataUrl] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [guideImgFailed, setGuideImgFailed] = useState(false);

  // High-quality image generation state (gemini-3-pro-image-preview)
  const [genPrompt, setGenPrompt] = useState(POSTER_PROMPT_PRESETS[0]);
  const [imageSize, setImageSize] = useState<ImageSizeOption>("1K");
  const [aspectRatio, setAspectRatio] = useState<AspectRatioOption>("16:9");
  const [genLoading, setGenLoading] = useState(false);
  const [genResultUrl, setGenResultUrl] = useState<string | null>(null);
  const [genError, setGenError] = useState<string | null>(null);

  // Create & Edit image state (gemini-nano-banana-2.1)
  const [editPrompt, setEditPrompt] = useState(EDIT_PROMPT_PRESETS[0]);
  const [editSourceUrl, setEditSourceUrl] = useState<string>("");
  const [editAspectRatio, setEditAspectRatio] = useState<AspectRatioOption>("4:3");
  const [editLoading, setEditLoading] = useState(false);
  const [editResultUrl, setEditResultUrl] = useState<string | null>(null);
  const [editError, setEditError] = useState<string | null>(null);

  const handleFileUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: (val: string) => void
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setter(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError(null);
    setSubmitMessage(null);

    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reporterName,
          riverNameTh,
          locationDetail,
          issueType,
          severity,
          description,
          photoDataUrl: photoDataUrl || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "ไม่สามารถส่งรายงานได้");
      }
      onReportCreated(data.report);
      setSubmitMessage("บันทึกข้อสังเกตแล้ว รายการนี้ยังไม่ผ่านการยืนยันและไม่มีพิกัดที่ตรวจสอบได้");
      setLocationDetail("");
      setDescription("");
      setPhotoDataUrl("");
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : "เกิดข้อผิดพลาดในการส่งรายงาน"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateStatus = async (reportId: string, nextStatus: ReportStatus) => {
    try {
      const res = await fetch(`/api/reports/${reportId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      const data = await res.json();
      if (res.ok && data.report) {
        onReportStatusUpdated(data.report);
      }
    } catch {
      // Ignore silent failure
    }
  };

  const handleGenerateHighRes = async (e: React.FormEvent) => {
    e.preventDefault();
    setGenLoading(true);
    setGenError(null);
    try {
      const res = await fetch("/api/images/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: genPrompt,
          imageSize,
          aspectRatio,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "ไม่สามารถสร้างภาพได้");
      }
      setGenResultUrl(data.imageUrl);
    } catch (err) {
      setGenError(
        err instanceof Error ? err.message : "เกิดข้อผิดพลาดระหว่างสร้างภาพ"
      );
    } finally {
      setGenLoading(false);
    }
  };

  const handleEditOrCreateImage = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditLoading(true);
    setEditError(null);
    try {
      const res = await fetch("/api/images/edit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: editPrompt,
          sourceImageDataUrl: editSourceUrl || undefined,
          aspectRatio: editAspectRatio,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "ไม่สามารถสร้างหรือแก้ไขภาพได้");
      }
      setEditResultUrl(data.imageUrl);
    } catch (err) {
      setEditError(
        err instanceof Error ? err.message : "เกิดข้อผิดพลาดระหว่างประมวลผลภาพ"
      );
    } finally {
      setEditLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header & Mode Switcher */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <div className="text-xs text-slate-500 font-medium">
            ข้อสังเกตจากชุมชน · ยังไม่ใช่ผลตรวจจากหน่วยงาน
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 mt-1">
            บันทึกข้อสังเกตริมแม่น้ำ
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            ระบบนี้เก็บข้อมูลที่ผู้ใช้ส่งไว้ในแอปเท่านั้น ไม่ได้ส่งต่อให้หน่วยงานหรือยืนยันเหตุการณ์
            ส่วนเครื่องมือสร้างภาพมีไว้ทำสื่อประกอบ ไม่ใช่ภาพหลักฐาน
          </p>
        </div>

        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg self-start">
          <button
            type="button"
            onClick={() => setActiveTab("report")}
            className={`px-4 py-2 text-xs sm:text-sm font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              activeTab === "report"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            แจ้งปัญหาน้ำเสีย / ปลาตาย
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("studio")}
            className={`px-4 py-2 text-xs sm:text-sm font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              activeTab === "studio"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            สร้างและแก้ไขภาพรณรงค์
          </button>
        </div>
      </div>

      {activeTab === "report" ? (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
          {/* Left: Report Form */}
          <div className="xl:col-span-6 bg-white border border-slate-200 rounded-xl p-6 sm:p-8 space-y-5">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                แบบฟอร์มแจ้งเหตุน้ำเสียหรือพบสัตว์น้ำตาย
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                ข้อสังเกตจากผู้ใช้ยังไม่ผ่านการตรวจยืนยัน และจะไม่แสดงเป็นหมุดบนแผนที่
              </p>
            </div>

            {submitMessage && (
              <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-lg text-xs font-medium text-emerald-800 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{submitMessage}</span>
              </div>
            )}

            {submitError && (
              <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-lg text-xs font-medium text-rose-800">
                {submitError}
              </div>
            )}

            <form onSubmit={handleSubmitReport} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <label className="block">
                  <span className="text-xs font-semibold text-slate-700">
                    ชื่อผู้แจ้ง (หรือระบุชุมชน)
                  </span>
                  <input
                    type="text"
                    value={reporterName}
                    onChange={(e) => setReporterName(e.target.value)}
                    placeholder="เช่น สมชาย ชุมชนบางน้ำผึ้ง"
                    className="mt-1 w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-teal-700"
                  />
                </label>

                <label className="block">
                  <span className="text-xs font-semibold text-slate-700">
                    แม่น้ำ / ลุ่มน้ำที่พบเหตุ *
                  </span>
                  <select
                    value={riverNameTh}
                    onChange={(e) => setRiverNameTh(e.target.value)}
                    className="mt-1 w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-teal-700"
                  >
                    {RIVER_OPTIONS.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <label className="block">
                <span className="text-xs font-semibold text-slate-700">
                    คำบรรยายสถานที่ / ท่าน้ำ / จุดสังเกตใกล้เคียง *
                </span>
                <input
                  type="text"
                  required
                  value={locationDetail}
                  onChange={(e) => setLocationDetail(e.target.value)}
                  placeholder="เช่น ใต้สะพานพระราม 5 หรือ หน้าวัดปากคลอง"
                  className="mt-1 w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-teal-700"
                />
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <label className="block">
                  <span className="text-xs font-semibold text-slate-700">
                    ลักษณะปัญหาที่พบ
                  </span>
                  <select
                    value={issueType}
                    onChange={(e) =>
                      setIssueType(e.target.value as CitizenReport["issueType"])
                    }
                    className="mt-1 w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-teal-700"
                  >
                    <option value="dead_fish">ปลาตายจำนวนมาก</option>
                    <option value="discolored_water">น้ำเปลี่ยนสี / คราบน้ำมัน</option>
                    <option value="chemical_odor">กลิ่นสารเคมีรุนแรง</option>
                    <option value="illegal_discharge">ลักลอบปล่อยน้ำเสีย</option>
                  </select>
                </label>

                <label className="block">
                  <span className="text-xs font-semibold text-slate-700">
                    ระดับความเร่งด่วนที่ผู้แจ้งประเมิน
                  </span>
                  <select
                    value={severity}
                    onChange={(e) => setSeverity(e.target.value as RiskLevel)}
                    className="mt-1 w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-teal-700"
                  >
                    <option value="critical">ผู้แจ้งระบุว่าต้องติดตามเร่งด่วน</option>
                    <option value="warning">ผู้แจ้งระบุว่าควรติดตาม</option>
                  </select>
                </label>
              </div>

              <label className="block">
                <span className="text-xs font-semibold text-slate-700">
                  รายละเอียดเหตุการณ์ *
                </span>
                <textarea
                  required
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="อธิบายสีของน้ำ กลิ่น จำนวนปลาที่ลอยตาย หรือช่วงเวลาที่เริ่มพบ..."
                  className="mt-1 w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-teal-700"
                />
              </label>

              <div>
                <span className="text-xs font-semibold text-slate-700 block mb-1.5">
                  แนบภาพถ่ายประกอบจากผู้แจ้ง (ถ้ามี)
                </span>
                <label className="flex flex-col items-center justify-center border border-dashed border-slate-300 rounded-xl p-4 bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer">
                  <Camera className="w-5 h-5 text-slate-500 mb-1.5" />
                  <span className="text-xs font-medium text-slate-700">
                    เลือกภาพถ่ายประกอบเหตุการณ์จากอุปกรณ์
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileUpload(e, setPhotoDataUrl)}
                    className="sr-only"
                  />
                </label>
                {photoDataUrl && (
                  <div className="mt-3 relative rounded-lg overflow-hidden border border-slate-200">
                    <img
                      src={photoDataUrl}
                      alt="ตัวอย่างภาพถ่ายแนบรายงาน"
                      className="w-full h-44 object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => setPhotoDataUrl("")}
                      className="absolute top-2 right-2 px-2.5 py-1 text-xs font-medium bg-slate-900/80 text-white rounded-md cursor-pointer"
                    >
                      ลบรูปภาพ
                    </button>
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2.5 px-5 text-sm font-semibold text-white bg-teal-700 rounded-lg hover:bg-teal-800 disabled:opacity-60 inline-flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>{submitting ? "กำลังส่งรายงาน..." : "ส่งรายงานปัญหาเข้าสู่ระบบ"}</span>
              </button>
            </form>
          </div>

          {/* Right: Field Inspection Guide + Live Community Reports */}
          <div className="xl:col-span-6 space-y-6">
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden grid grid-cols-1 sm:grid-cols-12">
              <div className="sm:col-span-5 bg-slate-100 min-h-[170px]">
                {!guideImgFailed ? (
                  <img
                    src="/src/assets/images/water_sampling_field_1794815672517.jpg"
                    alt="ภาพประกอบการเก็บตัวอย่างน้ำ ไม่ใช่ภาพจากรายงานที่ผู้ใช้ส่ง"
                    referrerPolicy="no-referrer"
                    onError={() => setGuideImgFailed(true)}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center p-4 text-slate-400">
                    <ImageIcon className="w-8 h-8" />
                  </div>
                )}
              </div>
              <div className="sm:col-span-7 p-5 flex flex-col justify-center space-y-2">
                <div className="text-xs font-semibold text-teal-800">
                  ข้อควรรู้เกี่ยวกับรายงานจากชุมชน
                </div>
                <h3 className="text-base font-bold text-slate-900">
                  รายงานนี้ไม่ได้ตรวจสอบหรือส่งต่อหน่วยงาน
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  ข้อความและภาพที่ส่งเป็นข้อมูลจากผู้ใช้เท่านั้น แอปนี้ไม่ได้ตรวจสอบ ไม่ได้ส่งต่อหน่วยงาน และไม่รับรองเวลาการตรวจวัด
                  ภาพที่สร้างด้วยเครื่องมือในแอปเป็นสื่อประกอบ ไม่ใช่หลักฐานเหตุการณ์จริง
                </p>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-slate-900">
                  รายการแจ้งเหตุจากชุมชนล่าสุด ({reports.length})
                </h3>
                <span className="text-xs text-slate-500">
                  สถานะในแอป · ไม่ใช่การยืนยันผลตรวจ
                </span>
              </div>

              {reports.length === 0 ? (
                <p className="rounded-lg bg-slate-50 p-4 text-xs leading-relaxed text-slate-600">
                  ยังไม่มีข้อสังเกตจากชุมชนในระบบ การไม่มีรายงานไม่ได้ยืนยันว่าพื้นที่ปลอดภัยหรือมีปัญหา
                </p>
              ) : (
              <div className="divide-y divide-slate-100">
                {reports.map((rep) => (
                  <div key={rep.id} className="py-4 first:pt-0 last:pb-0 space-y-2.5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-xs text-slate-500 flex flex-wrap items-center gap-1.5">
                          <span className="font-semibold text-slate-700">
                            {rep.riverNameTh}
                          </span>
                          <span aria-hidden="true">·</span>
                          <span>{rep.locationDetail}</span>
                          <span aria-hidden="true">·</span>
                          <span>{rep.createdAt}</span>
                        </div>
                        <h4 className="text-sm font-bold text-slate-900 mt-1">
                          {rep.issueLabelTh}
                        </h4>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className="text-[10px] font-medium text-slate-500">ระดับที่ผู้แจ้งประเมิน</span>
                        <StatusBadge
                          status={rep.severity}
                          customLabel={`ผู้แจ้งระบุ: ${rep.severity === "critical" ? "เร่งด่วน" : rep.severity === "warning" ? "ควรติดตาม" : "ปกติ"}`}
                        />
                      </div>
                    </div>

                    {rep.photoDataUrl && (
                      <img
                        src={rep.photoDataUrl}
                        alt={rep.issueLabelTh}
                        className="w-full max-h-48 object-cover rounded-lg border border-slate-200"
                      />
                    )}

                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                      {rep.description}
                    </p>

                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                      <span className="text-xs text-slate-500">
                        ผู้แจ้ง: {rep.reporterName} · สถานะ:{" "}
                        <strong className="text-slate-800">
                          {statusLabelTh(rep.status)}
                        </strong>
                      </span>

                      <div className="flex items-center gap-1.5">
                        {(
                          [
                            { id: "pending", label: "รอติดตาม" },
                            { id: "investigating", label: "กำลังติดตามในแอป" },
                            { id: "resolved", label: "ปิดการติดตามในแอป" }
                          ] as const
                        ).map((st) => (
                          <button
                            key={st.id}
                            type="button"
                            onClick={() => handleUpdateStatus(rep.id, st.id)}
                            className={`px-2.5 py-1 text-[11px] font-medium rounded border transition-colors cursor-pointer ${
                              rep.status === st.id
                                ? "bg-teal-50 border-teal-700 text-teal-900 font-semibold"
                                : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                            }`}
                          >
                            {st.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* AI Image Generation & Editing Studio */
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
          {/* Panel 1: High-Quality Image Generation (gemini-3-pro-image-preview with 1K/2K/4K) */}
          <section className="xl:col-span-6 bg-white border border-slate-200 rounded-xl p-6 sm:p-8 space-y-5">
            <div>
              <div className="text-xs text-slate-500 font-medium flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-teal-700" />
                <span>สร้างภาพสื่อรณรงค์คุณภาพสูง · โมเดล gemini-3-pro-image-preview</span>
              </div>
              <h2 className="text-lg font-bold text-slate-900 mt-1">
                สร้างโปสเตอร์และภาพเตือนภัยความละเอียดสูง (1K / 2K / 4K)
              </h2>
              <p className="text-xs text-slate-600 mt-1">
                กำหนดความละเอียดที่ต้องการ (1K, 2K หรือ 4K) และสัดส่วนภาพสำหรับพิมพ์ติดป้ายประกาศริมท่าน้ำหรือแชร์ในชุมชน
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {POSTER_PROMPT_PRESETS.map((preset, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setGenPrompt(preset)}
                  className="px-3 py-1.5 text-xs font-medium bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 cursor-pointer"
                >
                  ตัวอย่างคำสั่ง #{i + 1}
                </button>
              ))}
            </div>

            <form onSubmit={handleGenerateHighRes} className="space-y-4">
              <label className="block">
                <span className="text-xs font-semibold text-slate-700">
                  คำอธิบายภาพที่ต้องการสร้าง (Prompt)
                </span>
                <textarea
                  rows={3}
                  required
                  value={genPrompt}
                  onChange={(e) => setGenPrompt(e.target.value)}
                  placeholder="อธิบายภาพสื่อรณรงค์คุณภาพน้ำหรือสถานการณ์แม่น้ำ..."
                  className="mt-1 w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-teal-700"
                />
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <span className="text-xs font-semibold text-slate-700 block mb-1.5">
                    ความละเอียดภาพ (Image Size)
                  </span>
                  <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
                    {(["1K", "2K", "4K"] as const).map((sz) => (
                      <button
                        key={sz}
                        type="button"
                        onClick={() => setImageSize(sz)}
                        className={`flex-1 py-1.5 text-xs font-mono font-semibold rounded-md transition-colors cursor-pointer ${
                          imageSize === sz
                            ? "bg-white text-slate-900 shadow-sm"
                            : "text-slate-600 hover:text-slate-900"
                        }`}
                      >
                        {sz}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <span className="text-xs font-semibold text-slate-700 block mb-1.5">
                    สัดส่วนภาพ (Aspect Ratio)
                  </span>
                  <select
                    value={aspectRatio}
                    onChange={(e) =>
                      setAspectRatio(e.target.value as AspectRatioOption)
                    }
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-teal-700"
                  >
                    <option value="16:9">16:9 (แบนเนอร์แนวนอน)</option>
                    <option value="4:3">4:3 (ป้ายประกาศมาตรฐาน)</option>
                    <option value="1:1">1:1 (สี่เหลี่ยมจัตุรัส)</option>
                    <option value="3:4">3:4 (โปสเตอร์แนวตั้ง)</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={genLoading}
                className="w-full py-2.5 px-4 text-sm font-semibold text-white bg-teal-700 rounded-lg hover:bg-teal-800 disabled:opacity-60 inline-flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                <span>
                  {genLoading
                    ? `กำลังสร้างภาพความละเอียด ${imageSize}...`
                    : `สร้างภาพความละเอียด ${imageSize}`}
                </span>
              </button>
            </form>

            {genError && (
              <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900 leading-relaxed">
                {genError}
              </div>
            )}

            {genResultUrl && (
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <img
                  src={genResultUrl}
                  alt="ภาพรณรงค์ที่สร้างขึ้น"
                  className="w-full rounded-lg border border-slate-200"
                />
                <a
                  href={genResultUrl}
                  download={`river-alert-poster-${imageSize}.png`}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>ดาวน์โหลดภาพ ({imageSize})</span>
                </a>
              </div>
            )}
          </section>

          {/* Panel 2: Create & Edit Images (gemini-nano-banana-2.1) */}
          <section className="xl:col-span-6 bg-white border border-slate-200 rounded-xl p-6 sm:p-8 space-y-5">
            <div>
              <div className="text-xs text-slate-500 font-medium flex items-center gap-1.5">
                <Wand2 className="w-3.5 h-3.5 text-teal-700" />
                <span>สร้างและแก้ไขภาพด้วยข้อความ · โมเดล gemini-nano-banana-2.1</span>
              </div>
              <h2 className="text-lg font-bold text-slate-900 mt-1">
                สร้างหรือแก้ไขภาพหลักฐานคุณภาพน้ำด้วยคำสั่งข้อความ
              </h2>
              <p className="text-xs text-slate-600 mt-1">
                อัปโหลดภาพถ่ายแม่น้ำเพื่อปรับแต่งและทำเครื่องหมายจุดเสี่ยง
                หรือพิมพ์ข้อความเพื่อสร้างภาพจำลองสถานการณ์ได้โดยตรง
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {EDIT_PROMPT_PRESETS.map((preset, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setEditPrompt(preset)}
                  className="px-3 py-1.5 text-xs font-medium bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 cursor-pointer"
                >
                  คำสั่งแก้ไข #{i + 1}
                </button>
              ))}
            </div>

            <form onSubmit={handleEditOrCreateImage} className="space-y-4">
              <div>
                <span className="text-xs font-semibold text-slate-700 block mb-1.5">
                  ภาพต้นฉบับสำหรับแก้ไข (ไม่บังคับ — เว้นว่างหากต้องการสร้างใหม่จากข้อความ)
                </span>
                <label className="flex items-center justify-center gap-2 border border-dashed border-slate-300 rounded-xl p-3.5 bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer">
                  <Upload className="w-4 h-4 text-slate-500" />
                  <span className="text-xs font-medium text-slate-700">
                    {editSourceUrl
                      ? "เปลี่ยนภาพต้นฉบับ"
                      : "อัปโหลดภาพแม่น้ำหรือหลักฐานที่ต้องการแก้ไข"}
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileUpload(e, setEditSourceUrl)}
                    className="sr-only"
                  />
                </label>

                {editSourceUrl && (
                  <div className="mt-3 relative rounded-lg overflow-hidden border border-slate-200">
                    <img
                      src={editSourceUrl}
                      alt="ภาพต้นฉบับ"
                      className="w-full h-40 object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => setEditSourceUrl("")}
                      className="absolute top-2 right-2 px-2.5 py-1 text-xs font-medium bg-slate-900/80 text-white rounded-md cursor-pointer"
                    >
                      ลบภาพต้นฉบับ
                    </button>
                  </div>
                )}
              </div>

              <label className="block">
                <span className="text-xs font-semibold text-slate-700">
                  คำสั่งสร้างหรือแก้ไขภาพ (Text Prompt)
                </span>
                <textarea
                  rows={3}
                  required
                  value={editPrompt}
                  onChange={(e) => setEditPrompt(e.target.value)}
                  placeholder="ระบุสิ่งที่ต้องการสร้างหรือแก้ไขในภาพ..."
                  className="mt-1 w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-teal-700"
                />
              </label>

              <label className="block">
                <span className="text-xs font-semibold text-slate-700">
                  สัดส่วนภาพผลลัพธ์
                </span>
                <select
                  value={editAspectRatio}
                  onChange={(e) =>
                    setEditAspectRatio(e.target.value as AspectRatioOption)
                  }
                  className="mt-1 w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-teal-700"
                >
                  <option value="4:3">4:3 (มาตรฐาน)</option>
                  <option value="16:9">16:9 (แนวนอนกว้าง)</option>
                  <option value="1:1">1:1 (สี่เหลี่ยมจัตุรัส)</option>
                  <option value="3:4">3:4 (แนวตั้ง)</option>
                </select>
              </label>

              <button
                type="submit"
                disabled={editLoading}
                className="w-full py-2.5 px-4 text-sm font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 disabled:opacity-60 inline-flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <Wand2 className="w-4 h-4" />
                <span>
                  {editLoading
                    ? "กำลังประมวลผลภาพ..."
                    : editSourceUrl
                    ? "แก้ไขภาพด้วยคำสั่งข้อความ"
                    : "สร้างภาพใหม่จากข้อความ"}
                </span>
              </button>
            </form>

            {editError && (
              <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900 leading-relaxed">
                {editError}
              </div>
            )}

            {editResultUrl && (
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <img
                  src={editResultUrl}
                  alt="ผลลัพธ์ภาพที่สร้างหรือแก้ไข"
                  className="w-full rounded-lg border border-slate-200"
                />
                <a
                  href={editResultUrl}
                  download="river-alert-edited.png"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>ดาวน์โหลดผลลัพธ์</span>
                </a>
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
