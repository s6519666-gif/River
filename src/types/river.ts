export type RiskLevel = "normal" | "warning" | "critical";

export type ReportStatus = "pending" | "investigating" | "resolved";

export interface HistoricalReading {
  date: string;
  mercuryMgL: number;
  leadMgL: number;
  dissolvedOxygenMgL: number;
}

export interface MonitoringStation {
  id: string;
  code: string;
  nameTh: string;
  riverNameTh: string;
  provinceTh: string;
  lat: number;
  lng: number;
  status: RiskLevel;
  updatedAt: string;
  mercuryMgL: number; // PCD limit: 0.002 mg/L
  leadMgL: number; // PCD limit: 0.05 mg/L
  arsenicMgL: number; // PCD limit: 0.01 mg/L
  cadmiumMgL: number; // PCD limit: 0.005 mg/L
  dissolvedOxygenMgL: number; // Min healthy: 4.0 mg/L
  ph: number; // Healthy: 6.5 - 8.5
  turbidityNtu: number;
  waterTempC: number;
  summaryTh: string;
  fishAdvisoryTh: string;
  history: HistoricalReading[];
}

export interface RiverAlertItem {
  id: string;
  stationId: string;
  stationNameTh: string;
  riverNameTh: string;
  provinceTh: string;
  severity: RiskLevel;
  contaminantTh: string;
  measuredValue: string;
  standardLimit: string;
  exceedRatio: string;
  detectedAt: string;
  headlineTh: string;
  advisoryVillagersTh: string;
  advisoryFishermenTh: string;
  advisoryFarmersTh: string;
}

export interface CitizenReport {
  id: string;
  reporterName: string;
  riverNameTh: string;
  locationDetail: string;
  issueType:
    | "dead_fish"
    | "discolored_water"
    | "chemical_odor"
    | "illegal_discharge";
  issueLabelTh: string;
  severity: RiskLevel;
  description: string;
  photoDataUrl?: string;
  status: ReportStatus;
  createdAt: string;
}

export interface FieldSampleEvaluation {
  overallStatus: RiskLevel;
  headlineTh: string;
  exceededParameters: Array<{
    parameterTh: string;
    measured: string;
    limit: string;
    severity: RiskLevel;
  }>;
  usageGuidance: {
    drinkingTh: string;
    bathingTh: string;
    aquacultureTh: string;
    agricultureTh: string;
  };
}

export interface FishSpeciesSafety {
  id: string;
  nameTh: string;
  scientificName: string;
  habitatLayerTh: string;
  bioaccumulationRisk: "low" | "moderate" | "high";
  mercurySensitivityTh: string;
  weeklyLimitAdultGrams: number;
  weeklyLimitSensitiveGrams: number;
  avoidZonesTh: string[];
  safeZonesTh: string[];
  preparationTipsTh: string[];
  summaryTh: string;
}

export type ImageSizeOption = "1K" | "2K" | "4K";
export type AspectRatioOption = "1:1" | "16:9" | "4:3" | "3:4";
