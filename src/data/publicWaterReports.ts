export interface ReportedSample {
  code: string;
  localityTh: string;
  arsenicMgL: number | null;
}

export interface OfficialRiverReport {
  id: string;
  riverNameTh: string;
  riverNameEn: string;
  approximateAreaTh: string;
  locator: [number, number];
  sampleCount: number;
  exceedanceCount: number;
  samples: ReportedSample[];
}

export const PCD_REPORT = {
  agencyTh: "กรมควบคุมมลพิษ (คพ.)",
  agencyEn: "Pollution Control Department (PCD), Thailand",
  titleTh: "รายงานผลการตรวจคุณภาพน้ำแม่น้ำกก ครั้งที่ 3",
  sourceUrl: "https://www.pcd.go.th/pcd_news/35672/",
  samplingDateTh: "12–16 พฤษภาคม 2568 (2025)",
  parameterTh: "สารหนู (As)",
  parameterEn: "Arsenic (As)",
  unit: "mg/L",
  standardMgL: 0.01,
  reports: [
    {
      id: "kok",
      riverNameTh: "แม่น้ำกก",
      riverNameEn: "Kok River",
      approximateAreaTh: "บริเวณจังหวัดเชียงใหม่–เชียงราย",
      locator: [20.05, 99.63],
      sampleCount: 15,
      exceedanceCount: 11,
      samples: [
        { code: "KK01", localityTh: "ชายแดนไทย–เมียนมา ต.ท่าตอน อ.แม่อาย จ.เชียงใหม่", arsenicMgL: 0.03 },
        { code: "KK02", localityTh: "สะพานมิตรภาพแม่นาวาง–ท่าตอน ต.ท่าตอน อ.แม่อาย", arsenicMgL: 0.026 },
        { code: "KK03", localityTh: "สะพานสองดินแดนบ้านแม่สลัก อ.แม่อาย จ.เชียงใหม่", arsenicMgL: 0.018 },
        { code: "KK04", localityTh: "บ้านจะเด้อ หมู่ 6 ต.ดอยฮาง อ.เมือง จ.เชียงราย", arsenicMgL: 0.016 },
        { code: "KK05", localityTh: "สะพานมิตรภาพแม่ยาว–ดอยฮาง อ.เมือง จ.เชียงราย", arsenicMgL: 0.017 },
        { code: "KK06", localityTh: "บ้านโป่งนาคำ ต.ดอยฮาง อ.เมือง จ.เชียงราย", arsenicMgL: 0.016 },
        { code: "KK07", localityTh: "สะพานข้ามแม่น้ำกก ต.ดอยฮาง อ.เมือง จ.เชียงราย", arsenicMgL: 0.018 },
        { code: "KK08", localityTh: "สะพานแม่ฟ้าหลวง ต.รอบเวียง อ.เมือง จ.เชียงราย", arsenicMgL: 0.014 },
        { code: "KK09", localityTh: "สะพานเฉลิมพระเกียรติ1 ต.รอบเวียง อ.เมือง จ.เชียงราย", arsenicMgL: 0.014 },
        { code: "KK10", localityTh: "ฝายเชียงราย ต.รอบเวียง อ.เมือง จ.เชียงราย", arsenicMgL: 0.011 },
        { code: "KK11", localityTh: "สะพานริมกก–เวียงเหนือรวมใจ อ.เวียงชัย จ.เชียงราย", arsenicMgL: 0.018 },
        { code: "KK12", localityTh: "สะพานโยนกนาคนคร ต.แม่ข้าวต้ม อ.เมือง", arsenicMgL: null },
        { code: "KK013", localityTh: "ต.ท่าข้าวเปลือก อ.แม่จัน", arsenicMgL: null },
        { code: "KK014", localityTh: "ต.หนองป่าก่อ อ.ดอยหลวง", arsenicMgL: null },
        { code: "KK015", localityTh: "ต.บ้านแซว อ.เชียงแสน", arsenicMgL: null }
      ],
    },
    {
      id: "sai",
      riverNameTh: "แม่น้ำสาย",
      riverNameEn: "Sai River",
      approximateAreaTh: "อำเภอแม่สาย จังหวัดเชียงราย",
      locator: [20.43, 99.88],
      sampleCount: 3,
      exceedanceCount: 3,
      samples: [
        { code: "SA01", localityTh: "บ้านหัวฝาย ต.แม่สาย อ.แม่สาย จ.เชียงราย", arsenicMgL: 0.023 },
        { code: "SA02", localityTh: "สะพานมิตรภาพแม่น้ำสายแห่งที่ 2 อ.แม่สาย จ.เชียงราย", arsenicMgL: 0.024 },
        { code: "SA03", localityTh: "บ้านป่าซางงาม ต.เกาะช้าง อ.แม่สาย จ.เชียงราย", arsenicMgL: 0.017 },
      ],
    },
    {
      id: "mekong",
      riverNameTh: "แม่น้ำโขง",
      riverNameEn: "Mekong River",
      approximateAreaTh: "อำเภอเชียงแสน จังหวัดเชียงราย",
      locator: [20.27, 100.08],
      sampleCount: 2,
      exceedanceCount: 2,
      samples: [
        { code: "NK01", localityTh: "ต.เวียง อ.เชียงแสน จ.เชียงราย", arsenicMgL: 0.026 },
        { code: "NK02", localityTh: "ต.บ้านแซว อ.เชียงแสน จ.เชียงราย", arsenicMgL: 0.025 },
      ],
    },
  ] satisfies OfficialRiverReport[],
};
