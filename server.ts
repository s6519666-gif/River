import "dotenv/config";
import express from "express";
import type { Request, Response } from "express";
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

interface StationRecord {
  id: string;
  code: string;
  nameTh: string;
  riverNameTh: string;
  provinceTh: string;
  lat: number;
  lng: number;
  mapX: number;
  mapY: number;
  status: "normal" | "warning" | "critical";
  updatedAt: string;
  mercuryMgL: number;
  leadMgL: number;
  arsenicMgL: number;
  cadmiumMgL: number;
  dissolvedOxygenMgL: number;
  ph: number;
  turbidityNtu: number;
  waterTempC: number;
  summaryTh: string;
  fishAdvisoryTh: string;
  history: Array<{
    date: string;
    mercuryMgL: number;
    leadMgL: number;
    dissolvedOxygenMgL: number;
  }>;
}

const STATIONS: StationRecord[] = [
  {
    id: "st-cp-01",
    code: "CP-SM-04",
    nameTh: "สถานีคุ้งบางกระเจ้า — ท้ายนิคมฯ",
    riverNameTh: "แม่น้ำเจ้าพระยา",
    provinceTh: "สมุทรปราการ",
    lat: 13.6812,
    lng: 100.5625,
    mapX: 525,
    mapY: 425,
    status: "critical",
    updatedAt: "15 พ.ย. 2569 · 14:30 น.",
    mercuryMgL: 0.0048,
    leadMgL: 0.068,
    arsenicMgL: 0.009,
    cadmiumMgL: 0.0042,
    dissolvedOxygenMgL: 2.9,
    ph: 6.3,
    turbidityNtu: 64,
    waterTempC: 30.4,
    summaryTh:
      "พบค่าปรอทและตะกั่วสูงกว่าเกณฑ์มาตรฐานน้ำผิวดิน ร่วมกับค่าออกซิเจนละลายน้ำต่ำกว่า 3.0 mg/L",
    fishAdvisoryTh:
      "งดจับและงดบริโภคปลาหน้าดิน (ปลาดุก ปลาสวาย) ในรัศมี 5 กม. ชั่วคราว",
    history: [
      { date: "02 พ.ย.", mercuryMgL: 0.0018, leadMgL: 0.032, dissolvedOxygenMgL: 4.5 },
      { date: "04 พ.ย.", mercuryMgL: 0.0021, leadMgL: 0.039, dissolvedOxygenMgL: 4.1 },
      { date: "06 พ.ย.", mercuryMgL: 0.0024, leadMgL: 0.044, dissolvedOxygenMgL: 3.9 },
      { date: "08 พ.ย.", mercuryMgL: 0.0029, leadMgL: 0.051, dissolvedOxygenMgL: 3.5 },
      { date: "10 พ.ย.", mercuryMgL: 0.0036, leadMgL: 0.056, dissolvedOxygenMgL: 3.2 },
      { date: "12 พ.ย.", mercuryMgL: 0.0042, leadMgL: 0.062, dissolvedOxygenMgL: 3.0 },
      { date: "15 พ.ย.", mercuryMgL: 0.0048, leadMgL: 0.068, dissolvedOxygenMgL: 2.9 },
    ],
  },
  {
    id: "st-tc-02",
    code: "TC-NK-02",
    nameTh: "สถานีท่าน้ำนครชัยศรี",
    riverNameTh: "แม่น้ำท่าจีน",
    provinceTh: "นครปฐม",
    lat: 13.8024,
    lng: 100.1864,
    mapX: 390,
    mapY: 365,
    status: "critical",
    updatedAt: "15 พ.ย. 2569 · 14:15 น.",
    mercuryMgL: 0.0031,
    leadMgL: 0.082,
    arsenicMgL: 0.014,
    cadmiumMgL: 0.0061,
    dissolvedOxygenMgL: 3.1,
    ph: 6.4,
    turbidityNtu: 78,
    waterTempC: 29.8,
    summaryTh:
      "ตรวจพบสารตะกั่วและแคดเมียมเกินค่ามาตรฐานหลังฝนตกหนักและน้ำไหลหลากจากเขตเกษตร-อุตสาหกรรม",
    fishAdvisoryTh:
      "หลีกเลี่ยงการบริโภคสัตว์น้ำหน้าดิน และงดสูบน้ำเข้าระบบบ่อเลี้ยงปลา",
    history: [
      { date: "02 พ.ย.", mercuryMgL: 0.0014, leadMgL: 0.042, dissolvedOxygenMgL: 4.3 },
      { date: "04 พ.ย.", mercuryMgL: 0.0017, leadMgL: 0.048, dissolvedOxygenMgL: 4.0 },
      { date: "06 พ.ย.", mercuryMgL: 0.0021, leadMgL: 0.055, dissolvedOxygenMgL: 3.8 },
      { date: "08 พ.ย.", mercuryMgL: 0.0025, leadMgL: 0.064, dissolvedOxygenMgL: 3.5 },
      { date: "10 พ.ย.", mercuryMgL: 0.0027, leadMgL: 0.071, dissolvedOxygenMgL: 3.3 },
      { date: "12 พ.ย.", mercuryMgL: 0.0029, leadMgL: 0.077, dissolvedOxygenMgL: 3.2 },
      { date: "15 พ.ย.", mercuryMgL: 0.0031, leadMgL: 0.082, dissolvedOxygenMgL: 3.1 },
    ],
  },
  {
    id: "st-mk-03",
    code: "MK-RB-01",
    nameTh: "สถานีบ้านโป่ง — คลองสายรอง",
    riverNameTh: "แม่น้ำแม่กลอง",
    provinceTh: "ราชบุรี",
    lat: 13.8165,
    lng: 99.8722,
    mapX: 255,
    mapY: 390,
    status: "warning",
    updatedAt: "15 พ.ย. 2569 · 13:50 น.",
    mercuryMgL: 0.0018,
    leadMgL: 0.045,
    arsenicMgL: 0.008,
    cadmiumMgL: 0.0034,
    dissolvedOxygenMgL: 3.9,
    ph: 6.9,
    turbidityNtu: 42,
    waterTempC: 29.1,
    summaryTh:
      "ค่าตะกั่วและปรอทใกล้แตะเพดานเฝ้าระวังระดับ 90% และออกซิเจนละลายน้ำลดลงเล็กน้อย",
    fishAdvisoryTh:
      "จำกัดการบริโภคปลานักล่าขนาดใหญ่ (ปลาช่อน ปลากราย) ไม่เกิน 150 กรัม/สัปดาห์",
    history: [
      { date: "02 พ.ย.", mercuryMgL: 0.0011, leadMgL: 0.028, dissolvedOxygenMgL: 5.1 },
      { date: "04 พ.ย.", mercuryMgL: 0.0012, leadMgL: 0.031, dissolvedOxygenMgL: 4.8 },
      { date: "06 พ.ย.", mercuryMgL: 0.0014, leadMgL: 0.035, dissolvedOxygenMgL: 4.5 },
      { date: "08 พ.ย.", mercuryMgL: 0.0015, leadMgL: 0.039, dissolvedOxygenMgL: 4.3 },
      { date: "10 พ.ย.", mercuryMgL: 0.0016, leadMgL: 0.041, dissolvedOxygenMgL: 4.1 },
      { date: "12 พ.ย.", mercuryMgL: 0.0017, leadMgL: 0.043, dissolvedOxygenMgL: 4.0 },
      { date: "15 พ.ย.", mercuryMgL: 0.0018, leadMgL: 0.045, dissolvedOxygenMgL: 3.9 },
    ],
  },
  {
    id: "st-mg-04",
    code: "MG-CR-07",
    nameTh: "สถานีเชียงแสน — ปากน้ำกก",
    riverNameTh: "แม่น้ำโขง",
    provinceTh: "เชียงราย",
    lat: 20.2735,
    lng: 100.0882,
    mapX: 435,
    mapY: 115,
    status: "warning",
    updatedAt: "15 พ.ย. 2569 · 14:00 น.",
    mercuryMgL: 0.0019,
    leadMgL: 0.038,
    arsenicMgL: 0.011,
    cadmiumMgL: 0.0029,
    dissolvedOxygenMgL: 5.6,
    ph: 7.4,
    turbidityNtu: 58,
    waterTempC: 24.5,
    summaryTh:
      "พบตะกอนแขวนลอยและสารหนูสูงขึ้นเล็กน้อยตามกระแสน้ำเหนือ แนะนำกรองน้ำก่อนใช้อุปโภค",
    fishAdvisoryTh:
      "ปลาขนาดเล็กและปลากินพืชบริโภคได้ปกติ ควรตัดส่วนหัวและเครื่องในออกก่อนปรุงสุก",
    history: [
      { date: "02 พ.ย.", mercuryMgL: 0.0013, leadMgL: 0.025, dissolvedOxygenMgL: 6.1 },
      { date: "04 พ.ย.", mercuryMgL: 0.0015, leadMgL: 0.029, dissolvedOxygenMgL: 5.9 },
      { date: "06 พ.ย.", mercuryMgL: 0.0016, leadMgL: 0.031, dissolvedOxygenMgL: 5.8 },
      { date: "08 พ.ย.", mercuryMgL: 0.0017, leadMgL: 0.034, dissolvedOxygenMgL: 5.7 },
      { date: "10 พ.ย.", mercuryMgL: 0.0018, leadMgL: 0.036, dissolvedOxygenMgL: 5.7 },
      { date: "12 พ.ย.", mercuryMgL: 0.0018, leadMgL: 0.037, dissolvedOxygenMgL: 5.6 },
      { date: "15 พ.ย.", mercuryMgL: 0.0019, leadMgL: 0.038, dissolvedOxygenMgL: 5.6 },
    ],
  },
  {
    id: "st-pg-05",
    code: "PG-CM-03",
    nameTh: "สถานีสะพานนวรัฐ",
    riverNameTh: "แม่น้ำปิง",
    provinceTh: "เชียงใหม่",
    lat: 18.7877,
    lng: 99.0044,
    mapX: 295,
    mapY: 180,
    status: "normal",
    updatedAt: "15 พ.ย. 2569 · 14:20 น.",
    mercuryMgL: 0.0005,
    leadMgL: 0.012,
    arsenicMgL: 0.003,
    cadmiumMgL: 0.0011,
    dissolvedOxygenMgL: 6.8,
    ph: 7.2,
    turbidityNtu: 18,
    waterTempC: 25.6,
    summaryTh:
      "คุณภาพน้ำอยู่ในเกณฑ์ดีมาก สารโลหะหนักต่ำกว่าเกณฑ์ปลอดภัยอย่างมีนัยสำคัญ",
    fishAdvisoryTh:
      "สามารถจับและบริโภคสัตว์น้ำได้ตามปกติ โดยปรุงสุกสะอาด",
    history: [
      { date: "02 พ.ย.", mercuryMgL: 0.0006, leadMgL: 0.014, dissolvedOxygenMgL: 6.5 },
      { date: "04 พ.ย.", mercuryMgL: 0.0006, leadMgL: 0.013, dissolvedOxygenMgL: 6.6 },
      { date: "06 พ.ย.", mercuryMgL: 0.0005, leadMgL: 0.013, dissolvedOxygenMgL: 6.6 },
      { date: "08 พ.ย.", mercuryMgL: 0.0005, leadMgL: 0.012, dissolvedOxygenMgL: 6.7 },
      { date: "10 พ.ย.", mercuryMgL: 0.0005, leadMgL: 0.012, dissolvedOxygenMgL: 6.7 },
      { date: "12 พ.ย.", mercuryMgL: 0.0005, leadMgL: 0.012, dissolvedOxygenMgL: 6.8 },
      { date: "15 พ.ย.", mercuryMgL: 0.0005, leadMgL: 0.012, dissolvedOxygenMgL: 6.8 },
    ],
  },
  {
    id: "st-ch-06",
    code: "CH-KK-05",
    nameTh: "สถานีบ้านท่าพระ",
    riverNameTh: "แม่น้ำชี",
    provinceTh: "ขอนแก่น",
    lat: 16.3348,
    lng: 102.8112,
    mapX: 730,
    mapY: 260,
    status: "normal",
    updatedAt: "15 พ.ย. 2569 · 14:10 น.",
    mercuryMgL: 0.0007,
    leadMgL: 0.016,
    arsenicMgL: 0.004,
    cadmiumMgL: 0.0014,
    dissolvedOxygenMgL: 6.1,
    ph: 7.5,
    turbidityNtu: 22,
    waterTempC: 27.9,
    summaryTh:
      "คุณภาพน้ำอยู่ในเกณฑ์มาตรฐานปกติ เหมาะสมต่อการเกษตรและการประมงพื้นบ้าน",
    fishAdvisoryTh:
      "สัตว์น้ำในพื้นที่ปลอดภัยต่อการบริโภคตามเกณฑ์มาตรฐานอาหาร",
    history: [
      { date: "02 พ.ย.", mercuryMgL: 0.0008, leadMgL: 0.018, dissolvedOxygenMgL: 5.8 },
      { date: "04 พ.ย.", mercuryMgL: 0.0008, leadMgL: 0.018, dissolvedOxygenMgL: 5.9 },
      { date: "06 พ.ย.", mercuryMgL: 0.0007, leadMgL: 0.017, dissolvedOxygenMgL: 6.0 },
      { date: "08 พ.ย.", mercuryMgL: 0.0007, leadMgL: 0.017, dissolvedOxygenMgL: 6.0 },
      { date: "10 พ.ย.", mercuryMgL: 0.0007, leadMgL: 0.016, dissolvedOxygenMgL: 6.1 },
      { date: "12 พ.ย.", mercuryMgL: 0.0007, leadMgL: 0.016, dissolvedOxygenMgL: 6.1 },
      { date: "15 พ.ย.", mercuryMgL: 0.0007, leadMgL: 0.016, dissolvedOxygenMgL: 6.1 },
    ],
  },
];

const INITIAL_REPORTS = [
  {
    id: "rep-101",
    reporterName: "วิชัย ชาวประมงคุ้งบางกระเจ้า",
    riverNameTh: "แม่น้ำเจ้าพระยา",
    locationDetail: "ท่าเรือวัดบางน้ำผึ้งนอก อ.พระประแดง",
    issueType: "dead_fish",
    issueLabelTh: "ปลาตายจำนวนมาก",
    severity: "critical",
    description:
      "พบปลาสวายและปลากดลอยตายริมตลิ่งกว่า 30 ตัวตั้งแต่ช่วงเช้า น้ำมีสีคล้ำและมีฟองผิดปกติ",
    mapX: 540,
    mapY: 438,
    status: "investigating",
    createdAt: "15 พ.ย. 2569 · 08:40 น.",
  },
  {
    id: "rep-102",
    reporterName: "สมพร เกษตรกรสวนส้มโอ",
    riverNameTh: "แม่น้ำท่าจีน",
    locationDetail: "ปากคลองต้นตาล อ.นครชัยศรี",
    issueType: "chemical_odor",
    issueLabelTh: "กลิ่นสารเคมีรุนแรง",
    severity: "critical",
    description:
      "น้ำในคลองส่งกลิ่นฉุนคล้ายตัวทำละลายตั้งแต่เมื่อคืน ไม่กล้าสูบน้ำเข้าร่องสวน",
    mapX: 372,
    mapY: 378,
    status: "pending",
    createdAt: "15 พ.ย. 2569 · 10:15 น.",
  },
  {
    id: "rep-103",
    reporterName: "กัญญา อาสาสมัครสิ่งแวดล้อม",
    riverNameTh: "แม่น้ำแม่กลอง",
    locationDetail: "ช่วงใต้สะพานบ้านโป่ง",
    issueType: "discolored_water",
    issueLabelTh: "น้ำเปลี่ยนสี / คราบน้ำมัน",
    severity: "warning",
    description:
      "สังเกตเห็นคราบน้ำมันบางๆ ลอยเป็นทางยาวประมาณ 200 เมตร ใกล้จุดจอดเรือบรรทุก",
    mapX: 268,
    mapY: 405,
    status: "resolved",
    createdAt: "14 พ.ย. 2569 · 16:20 น.",
  },
];

function loadReports() {
  try {
    if (fs.existsSync(REPORTS_STORE_PATH)) {
      const raw = fs.readFileSync(REPORTS_STORE_PATH, "utf-8");
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch {
    // Fallback to seed reports
  }
  return INITIAL_REPORTS;
}

function saveReports(reports: unknown[]): void {
  try {
    fs.writeFileSync(REPORTS_STORE_PATH, JSON.stringify(reports, null, 2), "utf-8");
  } catch (err) {
    console.error("Failed to persist reports:", err);
  }
}

let citizenReports = loadReports();

function buildAlertsFromStations() {
  return [
    {
      id: "alt-hg-cp01",
      stationId: "st-cp-01",
      stationNameTh: "สถานีคุ้งบางกระเจ้า — ท้ายนิคมฯ",
      riverNameTh: "แม่น้ำเจ้าพระยา",
      provinceTh: "สมุทรปราการ",
      severity: "critical",
      contaminantTh: "สารปรอท (Hg) และตะกั่ว (Pb)",
      measuredValue: "Hg 0.0048 mg/L · Pb 0.068 mg/L",
      standardLimit: "Hg ≤ 0.002 mg/L · Pb ≤ 0.05 mg/L",
      exceedRatio: "ปรอทเกินมาตรฐาน 2.4 เท่า",
      detectedAt: "15 พ.ย. 2569 · 14:30 น.",
      headlineTh: "เตือนภัยระดับวิกฤต: ตรวจพบสารปรอทและตะกั่วเกินค่ามาตรฐานในเจ้าพระยาตอนล่าง",
      advisoryVillagersTh:
        "งดใช้น้ำจากแม่น้ำโดยตรงในการอุปโภคบริโภคหรืออาบน้ำ หากสัมผัสน้ำควรล้างด้วยน้ำประปาสะอาดทันที",
      advisoryFishermenTh:
        "งดจับปลาหน้าดินและหอยในรัศมี 5 กิโลเมตรรอบคุ้งบางกระเจ้า จนกว่ากรมควบคุมมลพิษจะประกาศปลดล็อก",
      advisoryFarmersTh:
        "ปิดประตูระบายน้ำเข้าบ่อเลี้ยงปลาและแปลงผักริมตลิ่งชั่วคราว ใช้น้ำสำรองจากบ่อพักแทน",
    },
    {
      id: "alt-pb-tc02",
      stationId: "st-tc-02",
      stationNameTh: "สถานีท่าน้ำนครชัยศรี",
      riverNameTh: "แม่น้ำท่าจีน",
      provinceTh: "นครปฐม",
      severity: "critical",
      contaminantTh: "สารตะกั่ว (Pb) และแคดเมียม (Cd)",
      measuredValue: "Pb 0.082 mg/L · Cd 0.0061 mg/L",
      standardLimit: "Pb ≤ 0.05 mg/L · Cd ≤ 0.005 mg/L",
      exceedRatio: "ตะกั่วเกินมาตรฐาน 1.64 เท่า",
      detectedAt: "15 พ.ย. 2569 · 14:15 น.",
      headlineTh: "เตือนภัยระดับวิกฤต: ตะกั่วและแคดเมียมสูงเกินเกณฑ์ในแม่น้ำท่าจีน อ.นครชัยศรี",
      advisoryVillagersTh:
        "หลีกเลี่ยงการนำน้ำดิบมาต้มดื่ม (การต้มไม่สามารถกำจัดโลหะหนักได้) ใช้ระบบประปาหรือน้ำบรรจุขวด",
      advisoryFishermenTh:
        "ระงับการจับสัตว์น้ำในพื้นที่คลองสาขาและบริเวณใกล้ท่อระบายน้ำสาธารณะ",
      advisoryFarmersTh:
        "ผู้เลี้ยงปลากระชังควรเพิ่มเครื่องตีน้ำและตรวจค่า DO ทุก 4 ชั่วโมง งดเปลี่ยนถ่ายน้ำจากแม่น้ำหลัก",
    },
    {
      id: "alt-as-mg04",
      stationId: "st-mg-04",
      stationNameTh: "สถานีเชียงแสน — ปากน้ำกก",
      riverNameTh: "แม่น้ำโขง",
      provinceTh: "เชียงราย",
      severity: "warning",
      contaminantTh: "สารหนู (As) และความขุ่นสูง",
      measuredValue: "As 0.011 mg/L · ความขุ่น 58 NTU",
      standardLimit: "As ≤ 0.010 mg/L",
      exceedRatio: "สารหนูเกินมาตรฐาน 1.1 เท่า",
      detectedAt: "15 พ.ย. 2569 · 14:00 น.",
      headlineTh: "เฝ้าระวัง: สารหนูและตะกอนแขวนลอยเพิ่มขึ้นจากมวลน้ำเหนือ",
      advisoryVillagersTh:
        "ต้องผ่านระบบตกตะกอนและกรองแบบ Reverse Osmosis (RO) หรือเรซินก่อนใช้อุปโภค",
      advisoryFishermenTh:
        "ปลาผิวน้ำบริโภคได้ปกติ แต่ควรตัดส่วนหัว เหงือก และเครื่องในทิ้งก่อนประกอบอาหาร",
      advisoryFarmersTh:
        "เฝ้าระวังตะกอนอุดตันระบบน้ำหยด และตรวจวัดคุณภาพน้ำในบ่อพักก่อนสูบเข้าพื้นที่เพาะปลูก",
    },
    {
      id: "alt-do-mk03",
      stationId: "st-mk-03",
      stationNameTh: "สถานีบ้านโป่ง — คลองสายรอง",
      riverNameTh: "แม่น้ำแม่กลอง",
      provinceTh: "ราชบุรี",
      severity: "warning",
      contaminantTh: "ออกซิเจนละลายน้ำต่ำ (DO) และตะกั่วใกล้เกณฑ์",
      measuredValue: "DO 3.9 mg/L · Pb 0.045 mg/L",
      standardLimit: "DO ≥ 4.0 mg/L · Pb ≤ 0.05 mg/L",
      exceedRatio: "แตะระดับเฝ้าระวัง 90%",
      detectedAt: "15 พ.ย. 2569 · 13:50 น.",
      headlineTh: "เฝ้าระวัง: ค่าออกซิเจนละลายน้ำลดต่ำกว่าเกณฑ์ปกติ 4.0 mg/L",
      advisoryVillagersTh:
        "สังเกตสีและกลิ่นน้ำผิดปกติ หากพบปลาลอยหัวหรือตายให้แจ้งผ่านระบบ Report Problem ทันที",
      advisoryFishermenTh:
        "จำกัดการบริโภคปลานักล่าขนาดใหญ่ไม่เกิน 150 กรัม/สัปดาห์ สำหรับหญิงตั้งครรภ์และเด็กเล็ก",
      advisoryFarmersTh:
        "ลดการให้อาหารปลาในกระชังลง 20% เพื่อลดภาระออกซิเจนในน้ำช่วงกลางคืน",
    },
    {
      id: "alt-ok-pg05",
      stationId: "st-pg-05",
      stationNameTh: "สถานีสะพานนวรัฐ และสถานีบ้านท่าพระ",
      riverNameTh: "แม่น้ำปิง · แม่น้ำชี",
      provinceTh: "เชียงใหม่ · ขอนแก่น",
      severity: "normal",
      contaminantTh: "โลหะหนักทุกชนิดอยู่ในเกณฑ์ปลอดภัย",
      measuredValue: "Hg 0.0005–0.0007 mg/L · DO > 6.0 mg/L",
      standardLimit: "Hg ≤ 0.002 mg/L · DO ≥ 4.0 mg/L",
      exceedRatio: "ต่ำกว่ามาตรฐาน 65–75%",
      detectedAt: "15 พ.ย. 2569 · 14:20 น.",
      headlineTh: "สถานะปกติ: คุณภาพน้ำแม่น้ำปิงและแม่น้ำชีอยู่ในเกณฑ์มาตรฐานปลอดภัย",
      advisoryVillagersTh: "สามารถใช้น้ำเพื่อการอุปโภคและกิจกรรมชุมชนได้ตามปกติ",
      advisoryFishermenTh: "จับสัตว์น้ำได้ตามปกติ ควรปรุงอาหารให้สุกสะอาด",
      advisoryFarmersTh: "สามารถสูบน้ำเพื่อการเกษตรและเพาะเลี้ยงสัตว์น้ำได้ตามปกติ",
    },
  ];
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
        error: "กรุณากรอกข้อมูลแม่น้ำ พิกัดสถานที่ และรายละเอียดปัญหาให้ครบถ้วน",
      });
      return;
    }

    const riverCoordinates: Record<string, { x: number; y: number }> = {
      "แม่น้ำเจ้าพระยา": { x: 520, y: 412 },
      "แม่น้ำท่าจีน": { x: 382, y: 370 },
      "แม่น้ำแม่กลอง": { x: 262, y: 398 },
      "แม่น้ำโขง": { x: 455, y: 124 },
      "แม่น้ำปิง": { x: 302, y: 192 },
      "แม่น้ำชี": { x: 722, y: 274 },
    };
    const baseCoord = riverCoordinates[String(riverNameTh)] ?? { x: 500, y: 310 };
    const jitterX = Math.round((Math.random() - 0.5) * 32);
    const jitterY = Math.round((Math.random() - 0.5) * 24);

    const newReport = {
      id: `rep-${Date.now()}`,
      reporterName: String(reporterName || "ประชาชนผู้แจ้งเหตุ").trim(),
      riverNameTh: String(riverNameTh),
      locationDetail: String(locationDetail).trim(),
      issueType: String(issueType || "discolored_water"),
      issueLabelTh: getIssueLabel(String(issueType || "discolored_water")),
      severity:
        severity === "critical" || severity === "warning" || severity === "normal"
          ? severity
          : "warning",
      description: String(description).trim(),
      photoDataUrl:
        typeof photoDataUrl === "string" && photoDataUrl.startsWith("data:image/")
          ? photoDataUrl
          : undefined,
      mapX: baseCoord.x + jitterX,
      mapY: baseCoord.y + jitterY,
      status: "pending",
      createdAt: "เมื่อสักครู่ · รายงานใหม่",
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
