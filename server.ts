import "dotenv/config";
import express from "express";
import type { Request, Response } from "express";
import type { CitizenReport, MonitoringStation } from "./src/types/river";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenAI } from "@google/genai";
import { createServer as createViteServer } from "vite";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;
const REPORTS_STORE_PATH = "/tmp/river_alert_reports.json";

function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured in the server environment.");
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

// PCD Thailand & WHO surface water thresholds
const STANDARDS = {
  mercuryMax: 0.002, // mg/L
  leadMax: 0.05, // mg/L
  arsenicMax: 0.01, // mg/L
  cadmiumMax: 0.005, // mg/L
  doMin: 4.0, // mg/L
  phMin: 6.5,
  phMax: 8.5,
};

const STATIONS: MonitoringStation[] = [];
const INITIAL_REPORTS: CitizenReport[] = [];

function loadReports(): CitizenReport[] {
  try {
    if (fs.existsSync(REPORTS_STORE_PATH)) {
      const raw = fs.readFileSync(REPORTS_STORE_PATH, "utf-8");
      const parsed: unknown = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        const retiredSampleIds = new Set(["rep-101", "rep-102", "rep-103"]);
        return parsed.filter((report): report is CitizenReport => {
          if (!report || typeof report !== "object") return false;
          const id = (report as { id?: unknown }).id;
          return typeof id === "string" && !retiredSampleIds.has(id);
        });
      }
    }
  } catch {
    // Ignore invalid persisted report data.
  }
  return INITIAL_REPORTS;
}

function saveReports(reports: CitizenReport[]): void {
  try {
    fs.writeFileSync(REPORTS_STORE_PATH, JSON.stringify(reports, null, 2), "utf-8");
  } catch (err) {
    console.error("Failed to persist reports:", err);
  }
}

let citizenReports: CitizenReport[] = loadReports();

function buildAlertsFromStations() {
  return [];
}

function getIssueLabel(issueType: string): string {
  switch (issueType) {
    case "dead_fish":
      return "ปลาตายจำนวนมาก";
    case "discolored_water":
      return "น้ำเปลี่ยนสี / คราบน้ำมัน";
    case "chemical_odor":
      return "กลิ่นสารเคมีรุนแรง";
    case "illegal_discharge":
      return "ลักลอบปล่อยน้ำเสีย";
    default:
      return "แจ้งเหตุความผิดปกติทางน้ำ";
  }
}

function formatGeminiError(error: unknown): { status: number; message: string } {
  const errObj = error as { status?: number; message?: string };
  const rawMessage = errObj?.message || "เกิดข้อผิดพลาดในการเรียกใช้บริการสร้างภาพ";
  const status = errObj?.status || 500;

  if (
    status === 403 ||
    status === 400 ||
    rawMessage.includes("PERMISSION_DENIED") ||
    rawMessage.includes("API_KEY_INVALID") ||
    rawMessage.includes("API key")
  ) {
    return {
      status: 403,
      message:
        "โมเดลสร้างและแก้ไขภาพความละเอียดสูง (gemini-nano-banana-2.1 / gemini-3-pro-image-preview) ต้องใช้ Paid API Key ที่เปิดใช้งาน Billing ใน Settings > Secrets ของโปรเจกต์",
    };
  }
  if (status === 429 || rawMessage.includes("RESOURCE_EXHAUSTED")) {
    return {
      status: 429,
      message:
        "โควตาการใช้งาน API เต็มหรือโมเดลนี้ต้องใช้ Paid API Key กรุณาตรวจสอบแพ็กเกจ Billing ใน Settings > Secrets",
    };
  }
  return { status: 500, message: rawMessage };
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: "15mb" }));

  app.get("/api/health", (_req: Request, res: Response) => {
    res.json({ ok: true, service: "river-alert-api" });
  });

  app.get("/api/stations", (_req: Request, res: Response) => {
    res.json({
      standards: STANDARDS,
      stations: STATIONS,
    });
  });

  app.get("/api/alerts", (_req: Request, res: Response) => {
    res.json({
      alerts: buildAlertsFromStations(),
    });
  });

  app.get("/api/reports", (_req: Request, res: Response) => {
    res.json({ reports: citizenReports });
  });

  app.post("/api/reports", (req: Request, res: Response) => {
    const {
      reporterName,
      riverNameTh,
      locationDetail,
      issueType,
      severity,
      description,
      photoDataUrl,
    } = req.body ?? {};

    if (!riverNameTh || !locationDetail || !description) {
      res.status(400).json({
        error: "กรุณาระบุแม่น้ำ พื้นที่โดยประมาณ และรายละเอียดการสังเกตให้ครบถ้วน",
      });
      return;
    }

    const validIssueTypes: CitizenReport["issueType"][] = [
      "dead_fish",
      "discolored_water",
      "chemical_odor",
      "illegal_discharge",
    ];
    const normalizedIssueType = validIssueTypes.includes(issueType)
      ? (issueType as CitizenReport["issueType"])
      : "discolored_water";

    const newReport: CitizenReport = {
      id: `rep-${Date.now()}`,
      reporterName: String(reporterName || "ประชาชนผู้แจ้งเหตุ").trim(),
      riverNameTh: String(riverNameTh),
      locationDetail: String(locationDetail).trim(),
      issueType: normalizedIssueType,
      issueLabelTh: getIssueLabel(normalizedIssueType),
      severity:
        severity === "critical" || severity === "warning" || severity === "normal"
          ? severity
          : "warning",
      description: String(description).trim(),
      photoDataUrl:
        typeof photoDataUrl === "string" && photoDataUrl.startsWith("data:image/")
          ? photoDataUrl
          : undefined,
      status: "pending",
      createdAt: new Date().toISOString(),
    };

    citizenReports = [newReport, ...citizenReports];
    saveReports(citizenReports);
    res.status(201).json({ report: newReport });
  });

  app.patch("/api/reports/:id/status", (req: Request, res: Response) => {
    const { id } = req.params;
    const { status } = req.body ?? {};
    if (status !== "pending" && status !== "investigating" && status !== "resolved") {
      res.status(400).json({ error: "สถานะไม่ถูกต้อง" });
      return;
    }

    const index = citizenReports.findIndex((r: { id: string }) => r.id === id);
    if (index === -1) {
      res.status(404).json({ error: "ไม่พบรายงานที่ระบุ" });
      return;
    }

    citizenReports[index] = { ...citizenReports[index], status };
    saveReports(citizenReports);
    res.json({ report: citizenReports[index] });
  });

  app.post("/api/water-check/evaluate", (req: Request, res: Response) => {
    const mercury = Number(req.body?.mercuryMgL ?? 0);
    const lead = Number(req.body?.leadMgL ?? 0);
    const arsenic = Number(req.body?.arsenicMgL ?? 0);
    const cadmium = Number(req.body?.cadmiumMgL ?? 0);
    const doVal = Number(req.body?.dissolvedOxygenMgL ?? 6);
    const ph = Number(req.body?.ph ?? 7);

    const exceeded: Array<{
      parameterTh: string;
      measured: string;
      limit: string;
      severity: "warning" | "critical";
    }> = [];

    if (mercury > STANDARDS.mercuryMax) {
      exceeded.push({
        parameterTh: "สารปรอท (Hg)",
        measured: `${mercury.toFixed(4)} mg/L`,
        limit: `≤ ${STANDARDS.mercuryMax.toFixed(3)} mg/L`,
        severity: mercury > STANDARDS.mercuryMax * 1.3 ? "critical" : "warning",
      });
    } else if (mercury >= STANDARDS.mercuryMax * 0.8) {
      exceeded.push({
        parameterTh: "สารปรอท (Hg) ใกล้เกณฑ์",
        measured: `${mercury.toFixed(4)} mg/L`,
        limit: `≤ ${STANDARDS.mercuryMax.toFixed(3)} mg/L`,
        severity: "warning",
      });
    }

    if (lead > STANDARDS.leadMax) {
      exceeded.push({
        parameterTh: "สารตะกั่ว (Pb)",
        measured: `${lead.toFixed(3)} mg/L`,
        limit: `≤ ${STANDARDS.leadMax.toFixed(2)} mg/L`,
        severity: lead > STANDARDS.leadMax * 1.2 ? "critical" : "warning",
      });
    } else if (lead >= STANDARDS.leadMax * 0.8) {
      exceeded.push({
        parameterTh: "สารตะกั่ว (Pb) ใกล้เกณฑ์",
        measured: `${lead.toFixed(3)} mg/L`,
        limit: `≤ ${STANDARDS.leadMax.toFixed(2)} mg/L`,
        severity: "warning",
      });
    }

    if (arsenic > STANDARDS.arsenicMax) {
      exceeded.push({
        parameterTh: "สารหนู (As)",
        measured: `${arsenic.toFixed(3)} mg/L`,
        limit: `≤ ${STANDARDS.arsenicMax.toFixed(2)} mg/L`,
        severity: arsenic > STANDARDS.arsenicMax * 1.2 ? "critical" : "warning",
      });
    }

    if (cadmium > STANDARDS.cadmiumMax) {
      exceeded.push({
        parameterTh: "แคดเมียม (Cd)",
        measured: `${cadmium.toFixed(4)} mg/L`,
        limit: `≤ ${STANDARDS.cadmiumMax.toFixed(3)} mg/L`,
        severity: "critical",
      });
    }

    if (doVal < STANDARDS.doMin) {
      exceeded.push({
        parameterTh: "ออกซิเจนละลายน้ำ (DO)",
        measured: `${doVal.toFixed(1)} mg/L`,
        limit: `≥ ${STANDARDS.doMin.toFixed(1)} mg/L`,
        severity: doVal < 3.0 ? "critical" : "warning",
      });
    }

    if (ph < STANDARDS.phMin || ph > STANDARDS.phMax) {
      exceeded.push({
        parameterTh: "ความเป็นกรด-ด่าง (pH)",
        measured: ph.toFixed(1),
        limit: `${STANDARDS.phMin} – ${STANDARDS.phMax}`,
        severity: ph < 5.5 || ph > 9.0 ? "critical" : "warning",
      });
    }

    const hasCritical = exceeded.some((e) => e.severity === "critical");
    const overallStatus = hasCritical
      ? "critical"
      : exceeded.length > 0
      ? "warning"
      : "normal";

    const hasHeavyMetalHazard =
      mercury > STANDARDS.mercuryMax ||
      lead > STANDARDS.leadMax ||
      arsenic > STANDARDS.arsenicMax ||
      cadmium > STANDARDS.cadmiumMax;

    res.json({
      overallStatus,
      headlineTh:
        overallStatus === "critical"
          ? "อันตรายเกินค่ามาตรฐาน — ห้ามใช้อุปโภคบริโภคและจับสัตว์น้ำ"
          : overallStatus === "warning"
          ? "ระดับเฝ้าระวัง — ควรบำบัดเบื้องต้นและหลีกเลี่ยงการใช้โดยตรง"
          : "ผ่านเกณฑ์มาตรฐานคุณภาพน้ำผิวดิน — อยู่ในระดับปลอดภัย",
      exceededParameters: exceeded,
      usageGuidance: {
        drinkingTh: hasHeavyMetalHazard
          ? "ห้ามใช้ทำน้ำดื่มเด็ดขาด แม้ต้มเดือดก็ไม่ช่วยกำจัดปรอทหรือตะกั่ว"
          : overallStatus === "warning"
          ? "ต้องผ่านระบบกรอง RO และต้มฆ่าเชื้อก่อนบริโภค"
          : "สามารถใช้ผลิตน้ำประปาตามขั้นตอนมาตรฐานได้",
        bathingTh: hasCritical
          ? "งดลงเล่นน้ำหรืออาบน้ำโดยตรง อาจระคายเคืองผิวหนังและสะสมสารพิษ"
          : "ใช้งานได้ปกติ ควรล้างตัวด้วยน้ำสะอาดซ้ำหลังสัมผัสน้ำแม่น้ำ",
        aquacultureTh:
          doVal < 4.0 || hasHeavyMetalHazard
            ? "ห้ามสูบน้ำเข้าบ่อเลี้ยงปลา ป้องกันปลาตายและสารพิษสะสมในเนื้อปลา"
            : "เหมาะสมต่อการเพาะเลี้ยงสัตว์น้ำ",
        agricultureTh: hasHeavyMetalHazard
          ? "หลีกเลี่ยงการรดพืชผักกินใบโดยตรง ให้ใช้น้ำบาดาลหรือน้ำพักสำรอง"
          : "สามารถใช้เพื่อการเกษตรได้ตามปกติ",
      },
    });
  });

  // High-quality image generation (gemini-3-pro-image-preview) with 1K / 2K / 4K support
  app.post("/api/images/generate", async (req: Request, res: Response) => {
    try {
      const prompt = String(req.body?.prompt || "").trim();
      const imageSize = req.body?.imageSize;
      const aspectRatio = req.body?.aspectRatio;

      if (!prompt) {
        res.status(400).json({ error: "กรุณาระบุคำอธิบายภาพ (Prompt)" });
        return;
      }

      const validSizes = ["1K", "2K", "4K"];
      const validRatios = ["1:1", "3:4", "4:3", "9:16", "16:9"];
      const resolvedSize = validSizes.includes(imageSize) ? imageSize : "1K";
      const resolvedRatio = validRatios.includes(aspectRatio) ? aspectRatio : "16:9";

      const ai = getGeminiClient();
      const response = await ai.models.generateContent({
        model: "gemini-3-pro-image-preview",
        contents: {
          parts: [{ text: prompt }],
        },
        config: {
          imageConfig: {
            aspectRatio: resolvedRatio,
            imageSize: resolvedSize,
          },
        },
      });

      let imageUrl = "";
      let captionText = "";
      for (const part of response.candidates?.[0]?.content?.parts ?? []) {
        if (part.inlineData?.data) {
          const mime = part.inlineData.mimeType ?? "image/png";
          imageUrl = `data:${mime};base64,${part.inlineData.data}`;
        } else if (part.text) {
          captionText += part.text;
        }
      }

      if (!imageUrl) {
        res.status(502).json({
          error: "โมเดลไม่ได้ส่งคืนข้อมูลรูปภาพ กรุณาลองปรับคำอธิบายภาพใหม่",
        });
        return;
      }

      res.json({
        imageUrl,
        captionText,
        model: "gemini-3-pro-image-preview",
        imageSize: resolvedSize,
        aspectRatio: resolvedRatio,
      });
    } catch (error) {
      const mapped = formatGeminiError(error);
      res.status(mapped.status).json({ error: mapped.message });
    }
  });

  // Create & edit images (gemini-nano-banana-2.1)
  app.post("/api/images/edit", async (req: Request, res: Response) => {
    try {
      const prompt = String(req.body?.prompt || "").trim();
      const sourceImageDataUrl = req.body?.sourceImageDataUrl;
      const aspectRatio = req.body?.aspectRatio;

      if (!prompt) {
        res.status(400).json({ error: "กรุณาระบุคำสั่งสร้างหรือแก้ไขภาพ" });
        return;
      }

      const parts: Array<
        { text: string } | { inlineData: { data: string; mimeType: string } }
      > = [];

      if (
        typeof sourceImageDataUrl === "string" &&
        sourceImageDataUrl.startsWith("data:image/")
      ) {
        const match = sourceImageDataUrl.match(/^data:(image\/[a-zA-Z0-9+.-]+);base64,(.+)$/);
        if (match) {
          parts.push({
            inlineData: {
              mimeType: match[1],
              data: match[2],
            },
          });
        }
      }

      parts.push({ text: prompt });

      const validRatios = ["1:1", "3:4", "4:3", "9:16", "16:9"];
      const resolvedRatio = validRatios.includes(aspectRatio) ? aspectRatio : "4:3";

      const ai = getGeminiClient();
      const response = await ai.models.generateContent({
        model: "gemini-nano-banana-2.1",
        contents: { parts },
        config: {
          imageConfig: {
            aspectRatio: resolvedRatio,
            imageSize: "1K",
          },
        },
      });

      let imageUrl = "";
      let captionText = "";
      for (const part of response.candidates?.[0]?.content?.parts ?? []) {
        if (part.inlineData?.data) {
          const mime = part.inlineData.mimeType ?? "image/png";
          imageUrl = `data:${mime};base64,${part.inlineData.data}`;
        } else if (part.text) {
          captionText += part.text;
        }
      }

      if (!imageUrl) {
        res.status(502).json({
          error: "โมเดลไม่ได้ส่งคืนรูปภาพที่สร้างหรือแก้ไข กรุณาลองใหม่อีกครั้ง",
        });
        return;
      }

      res.json({
        imageUrl,
        captionText,
        model: "gemini-nano-banana-2.1",
      });
    } catch (error) {
      const mapped = formatGeminiError(error);
      res.status(mapped.status).json({ error: mapped.message });
    }
  });

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, "dist");
    app.use(express.static(distDir));
    app.get("*", (_req: Request, res: Response) => {
      res.sendFile(path.join(distDir, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`River Alert server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
