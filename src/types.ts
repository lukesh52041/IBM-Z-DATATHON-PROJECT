export interface RawSensorRow {
  timestamp: string;
  source_id: string;
  temperature_c: number | string | null;
  vibration_g: number | string | null;
  pressure_kpa: number | string | null;
  label?: string;
}

export interface ValidatedSensorRow {
  index: number;
  timestamp: string;
  timestampMs: number;
  source_id: string;
  temperature_c: number;
  vibration_g: number;
  pressure_kpa: number;
  label: 'normal' | 'overheat' | 'vibration_spike' | 'pressure_drop' | string;
  isValid: boolean;
  warnings: string[];
  sanitizedFields: string[];
  rowIngestLatencyMs: number;
}

export type RiskTier = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface SignalContribution {
  signal: 'temperature' | 'vibration' | 'pressure';
  name: string;
  unit: string;
  currentValue: number;
  baselineMean: number;
  baselineStd: number;
  zScore: number;
  contributionPct: number;
  status: 'nominal' | 'warning' | 'critical';
}

export interface TrendForecast {
  temperatureSlopePerSec: number;
  vibrationSlopePerSec: number;
  pressureSlopePerSec: number;
  tempProjected5s: number;
  vibProjected5s: number;
  pressProjected5s: number;
  summary: string;
  urgencyLevel: 'stable' | 'monitoring' | 'escalating' | 'hazardous';
}

export interface DetectionResult {
  row: ValidatedSensorRow;
  temperature_z: number;
  vibration_z: number;
  pressure_z: number;
  riskScore: number; // 0 to 100
  riskTier: RiskTier;
  topContributingSignals: SignalContribution[];
  isAnomaly: boolean;
  detectionLatencyMs: number; // Ingest to alert calculation
  trend: TrendForecast;
}

export type AlertStatus = 'active' | 'acknowledged' | 'dismissed' | 'escalated';

export interface AlertAction {
  timestamp: string;
  action: AlertStatus;
  operator: string;
  note?: string;
}

export interface SystemAlert {
  id: string;
  rowIndex: number;
  timestamp: string;
  sourceId: string;
  riskTier: RiskTier;
  riskScore: number;
  primaryEvent: string;
  topContributingSignals: SignalContribution[];
  recommendedAction: string;
  recommendationSource: 'gemini-3.8-flash' | 'rule-engine';
  detectionLatencyMs: number;
  status: AlertStatus;
  history: AlertAction[];
  acknowledgedAt?: string;
  dismissedAt?: string;
  escalatedAt?: string;
}

export interface DataHealthMetrics {
  totalRowsReceived: number;
  validRows: number;
  flaggedRows: number;
  missingValuesSanitized: number;
  timestampAnomalies: number;
  healthPercentage: number;
  ingestRatePerSec: number;
  avgLatencyMs: number;
  minLatencyMs: number;
  maxLatencyMs: number;
  lastAnomalyType: string | null;
}

export interface ConfusionMatrixMetrics {
  totalProcessed: number;
  truePositives: number;
  falsePositives: number;
  trueNegatives: number;
  falseNegatives: number;
  precision: number;
  recall: number;
  f1Score: number;
  falseAlarmRate: number;
}
