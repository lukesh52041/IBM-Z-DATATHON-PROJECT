import {
  ValidatedSensorRow,
  DetectionResult,
  RiskTier,
  SignalContribution,
  TrendForecast,
  ConfusionMatrixMetrics,
} from '../types';

export class AnomalyEngine {
  private windowSize: number = 20;
  private history: ValidatedSensorRow[] = [];

  // Ground truth evaluation metrics
  public evaluation: ConfusionMatrixMetrics = {
    totalProcessed: 0,
    truePositives: 0,
    falsePositives: 0,
    trueNegatives: 0,
    falseNegatives: 0,
    precision: 100,
    recall: 100,
    f1Score: 100,
    falseAlarmRate: 0,
  };

  constructor(windowSize: number = 20) {
    this.windowSize = windowSize;
  }

  public reset(): void {
    this.history = [];
    this.evaluation = {
      totalProcessed: 0,
      truePositives: 0,
      falsePositives: 0,
      trueNegatives: 0,
      falseNegatives: 0,
      precision: 100,
      recall: 100,
      f1Score: 100,
      falseAlarmRate: 0,
    };
  }

  public processRow(row: ValidatedSensorRow): DetectionResult {
    const startDetection = performance.now();
    this.history.push(row);

    // Keep window bounded for rolling baseline computation
    const baselineSlice =
      this.history.length <= this.windowSize
        ? this.history
        : this.history.slice(Math.max(0, this.history.length - this.windowSize - 1), this.history.length - 1);

    // Calculate baseline means and standard deviations
    const statsTemp = this.computeStats(baselineSlice.map((r) => r.temperature_c), 70.0, 1.2);
    const statsVib = this.computeStats(baselineSlice.map((r) => r.vibration_g), 1.05, 0.15);
    const statsPress = this.computeStats(baselineSlice.map((r) => r.pressure_kpa), 502.0, 4.0);

    // Calculate Z-Scores
    const tempZ = (row.temperature_c - statsTemp.mean) / (statsTemp.std || 1.0);
    const vibZ = (row.vibration_g - statsVib.mean) / (statsVib.std || 0.1);
    const pressZ = (row.pressure_kpa - statsPress.mean) / (statsPress.std || 2.0);

    // Physical Threshold excursions
    // Temperature: normal 65-75, warning 82+, critical 95+
    let tempPhysRisk = 0;
    if (row.temperature_c > 95) tempPhysRisk = 95;
    else if (row.temperature_c > 82) tempPhysRisk = 60 + ((row.temperature_c - 82) / 13) * 35;
    else if (row.temperature_c > 76) tempPhysRisk = 25 + ((row.temperature_c - 76) / 6) * 35;
    else tempPhysRisk = Math.max(0, (row.temperature_c - 68) * 2.5);

    // Vibration: normal 0.8-1.5g, warning 2.8g+, critical 4.5g+
    let vibPhysRisk = 0;
    if (row.vibration_g > 4.5) vibPhysRisk = 95;
    else if (row.vibration_g > 2.8) vibPhysRisk = 60 + ((row.vibration_g - 2.8) / 1.7) * 35;
    else if (row.vibration_g > 1.8) vibPhysRisk = 25 + ((row.vibration_g - 1.8) / 1.0) * 35;
    else vibPhysRisk = Math.max(0, (row.vibration_g - 1.0) * 8);

    // Pressure: normal 470-530 kPa, warning < 400 or > 560, critical < 280 or > 650
    let pressPhysRisk = 0;
    if (row.pressure_kpa < 280 || row.pressure_kpa > 650) pressPhysRisk = 95;
    else if (row.pressure_kpa < 400) pressPhysRisk = 60 + ((400 - row.pressure_kpa) / 120) * 35;
    else if (row.pressure_kpa > 560) pressPhysRisk = 50 + ((row.pressure_kpa - 560) / 90) * 35;
    else if (row.pressure_kpa < 470) pressPhysRisk = 20 + ((470 - row.pressure_kpa) / 70) * 35;
    else pressPhysRisk = Math.abs(row.pressure_kpa - 500) * 0.8;

    // Statistical Z-score risk
    const zScoreTempRisk = Math.min(100, Math.max(0, (Math.abs(tempZ) - 1.5) * 28));
    const zScoreVibRisk = Math.min(100, Math.max(0, (Math.abs(vibZ) - 1.5) * 28));
    const zScorePressRisk = Math.min(100, Math.max(0, (Math.abs(pressZ) - 1.5) * 28));

    // Combine statistical and physical bounds
    const tempCombined = Math.max(tempPhysRisk, zScoreTempRisk);
    const vibCombined = Math.max(vibPhysRisk, zScoreVibRisk);
    const pressCombined = Math.max(pressPhysRisk, zScorePressRisk);

    // Composite 0 - 100 Risk Score
    // Dominant signal + secondary cross-correlation boost
    const maxSignalRisk = Math.max(tempCombined, vibCombined, pressCombined);
    const secondaryRisks = [tempCombined, vibCombined, pressCombined].filter((r) => r !== maxSignalRisk);
    const secondaryBoost = (secondaryRisks[0] || 0) * 0.15 + (secondaryRisks[1] || 0) * 0.1;

    let totalRisk = Math.round(Math.min(100, Math.max(0, maxSignalRisk + secondaryBoost)));

    // Categorize Risk Tier
    let riskTier: RiskTier = 'LOW';
    if (totalRisk >= 85) riskTier = 'CRITICAL';
    else if (totalRisk >= 60) riskTier = 'HIGH';
    else if (totalRisk >= 30) riskTier = 'MEDIUM';
    else riskTier = 'LOW';

    const isAnomaly = totalRisk >= 60 || Math.abs(tempZ) >= 3.0 || Math.abs(vibZ) >= 3.0 || Math.abs(pressZ) >= 3.0;

    // Signal Contributions
    const sumRisks = tempCombined + vibCombined + pressCombined || 1;
    const tempContr = Math.round((tempCombined / sumRisks) * 100);
    const vibContr = Math.round((vibCombined / sumRisks) * 100);
    const pressContr = Math.max(0, 100 - tempContr - vibContr);

    const signalContributions: SignalContribution[] = [
      {
        signal: 'temperature',
        name: 'Thermal Core',
        unit: '°C',
        currentValue: row.temperature_c,
        baselineMean: Math.round(statsTemp.mean * 10) / 10,
        baselineStd: Math.round(statsTemp.std * 100) / 100,
        zScore: Math.round(tempZ * 100) / 100,
        contributionPct: tempContr,
        status: tempCombined > 80 ? 'critical' : tempCombined > 45 ? 'warning' : 'nominal',
      },
      {
        signal: 'vibration',
        name: 'Shaft Vibration',
        unit: 'g',
        currentValue: row.vibration_g,
        baselineMean: Math.round(statsVib.mean * 100) / 100,
        baselineStd: Math.round(statsVib.std * 100) / 100,
        zScore: Math.round(vibZ * 100) / 100,
        contributionPct: vibContr,
        status: vibCombined > 80 ? 'critical' : vibCombined > 45 ? 'warning' : 'nominal',
      },
      {
        signal: 'pressure',
        name: 'Intake Pressure',
        unit: 'kPa',
        currentValue: row.pressure_kpa,
        baselineMean: Math.round(statsPress.mean * 10) / 10,
        baselineStd: Math.round(statsPress.std * 100) / 100,
        zScore: Math.round(pressZ * 100) / 100,
        contributionPct: pressContr,
        status: pressCombined > 80 ? 'critical' : pressCombined > 45 ? 'warning' : 'nominal',
      },
    ];
    signalContributions.sort((a, b) => b.contributionPct - a.contributionPct);

    // Compute Trend and Forecast
    const trend = this.calculateTrend();

    // Calculate detection latency
    const endDetection = performance.now();
    const detectionLatencyMs = Math.round((endDetection - startDetection + row.rowIngestLatencyMs) * 10) / 10;

    // Update Confusion Matrix against CSV ground truth label
    this.updateEvaluation(row.label, isAnomaly || riskTier === 'HIGH' || riskTier === 'CRITICAL');

    return {
      row,
      temperature_z: Math.round(tempZ * 100) / 100,
      vibration_z: Math.round(vibZ * 100) / 100,
      pressure_z: Math.round(pressZ * 100) / 100,
      riskScore: totalRisk,
      riskTier,
      topContributingSignals: signalContributions,
      isAnomaly,
      detectionLatencyMs: Math.max(0.5, detectionLatencyMs),
      trend,
    };
  }

  private computeStats(values: number[], fallbackMean: number, fallbackStd: number) {
    if (values.length < 3) {
      return { mean: fallbackMean, std: fallbackStd };
    }
    const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
    const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
    const std = Math.max(0.01, Math.sqrt(variance));
    return { mean, std };
  }

  private calculateTrend(): TrendForecast {
    if (this.history.length < 4) {
      return {
        temperatureSlopePerSec: 0,
        vibrationSlopePerSec: 0,
        pressureSlopePerSec: 0,
        tempProjected5s: 70,
        vibProjected5s: 1.05,
        pressProjected5s: 500,
        summary: 'Baseline establishing. System parameters within nominal operating range.',
        urgencyLevel: 'stable',
      };
    }

    const recent = this.history.slice(-8);
    const n = recent.length;
    const current = recent[recent.length - 1];

    const tempSlope = this.linearSlope(recent.map((r) => r.temperature_c));
    const vibSlope = this.linearSlope(recent.map((r) => r.vibration_g));
    const pressSlope = this.linearSlope(recent.map((r) => r.pressure_kpa));

    const tempProjected5s = Math.round((current.temperature_c + tempSlope * 5) * 10) / 10;
    const vibProjected5s = Math.round((current.vibration_g + vibSlope * 5) * 100) / 100;
    const pressProjected5s = Math.round((current.pressure_kpa + pressSlope * 5) * 10) / 10;

    let summary = 'Parameters nominal and steady.';
    let urgencyLevel: TrendForecast['urgencyLevel'] = 'stable';

    if (tempSlope > 1.2 && current.temperature_c > 80) {
      urgencyLevel = 'hazardous';
      summary = `Thermal runaway trajectory: +${tempSlope.toFixed(1)}°C/s slope. Thermal safety limit (100°C) projected in ${(
        (100 - current.temperature_c) /
        tempSlope
      ).toFixed(1)}s.`;
    } else if (vibSlope > 0.4 && current.vibration_g > 3.0) {
      urgencyLevel = 'hazardous';
      summary = `Dynamic resonance escalation: +${vibSlope.toFixed(2)}g/s slope. Harmonic bearing distress likely within 5s.`;
    } else if (pressSlope < -8.0 && current.pressure_kpa < 420) {
      urgencyLevel = 'hazardous';
      summary = `Severe hydraulic decompression: ${pressSlope.toFixed(1)} kPa/s loss rate. Critical cavitation expected in 4s.`;
    } else if (Math.abs(tempSlope) > 0.6 || Math.abs(vibSlope) > 0.2 || Math.abs(pressSlope) > 4.0) {
      urgencyLevel = 'monitoring';
      summary = `Dynamic transition detected. Parameters shifting (ΔTemp: ${tempSlope > 0 ? '+' : ''}${tempSlope.toFixed(1)}°C/s, ΔPress: ${pressSlope.toFixed(1)} kPa/s).`;
    }

    return {
      temperatureSlopePerSec: Math.round(tempSlope * 100) / 100,
      vibrationSlopePerSec: Math.round(vibSlope * 100) / 100,
      pressureSlopePerSec: Math.round(pressSlope * 100) / 100,
      tempProjected5s,
      vibProjected5s,
      pressProjected5s,
      summary,
      urgencyLevel,
    };
  }

  private linearSlope(values: number[]): number {
    const n = values.length;
    if (n < 2) return 0;
    let sumX = 0;
    let sumY = 0;
    let sumXY = 0;
    let sumXX = 0;
    for (let i = 0; i < n; i++) {
      sumX += i;
      sumY += values[i];
      sumXY += i * values[i];
      sumXX += i * i;
    }
    const denominator = n * sumXX - sumX * sumX;
    if (denominator === 0) return 0;
    return (n * sumXY - sumX * sumY) / denominator;
  }

  private updateEvaluation(groundTruthLabel: string, modelDetectedAnomaly: boolean): void {
    const isGroundTruthAnomaly = groundTruthLabel !== 'normal';
    this.evaluation.totalProcessed++;

    if (modelDetectedAnomaly && isGroundTruthAnomaly) {
      this.evaluation.truePositives++;
    } else if (modelDetectedAnomaly && !isGroundTruthAnomaly) {
      this.evaluation.falsePositives++;
    } else if (!modelDetectedAnomaly && !isGroundTruthAnomaly) {
      this.evaluation.trueNegatives++;
    } else if (!modelDetectedAnomaly && isGroundTruthAnomaly) {
      this.evaluation.falseNegatives++;
    }

    const tp = this.evaluation.truePositives;
    const fp = this.evaluation.falsePositives;
    const fn = this.evaluation.falseNegatives;
    const tn = this.evaluation.trueNegatives;

    const precision = tp + fp > 0 ? (tp / (tp + fp)) * 100 : 100;
    const recall = tp + fn > 0 ? (tp / (tp + fn)) * 100 : 100;
    const f1 = precision + recall > 0 ? (2 * precision * recall) / (precision + recall) : 100;
    const falseAlarmRate = fp + tn > 0 ? (fp / (fp + tn)) * 100 : 0;

    this.evaluation.precision = Math.round(precision * 10) / 10;
    this.evaluation.recall = Math.round(recall * 10) / 10;
    this.evaluation.f1Score = Math.round(f1 * 10) / 10;
    this.evaluation.falseAlarmRate = Math.round(falseAlarmRate * 10) / 10;
  }
}
