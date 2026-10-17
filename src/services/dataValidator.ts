import { RawSensorRow, ValidatedSensorRow, DataHealthMetrics } from '../types';

export class DataValidator {
  private lastTimestampMs: number | null = null;
  private lastValidTemp = 70.0;
  private lastValidVib = 1.05;
  private lastValidPress = 500.0;

  public metrics: DataHealthMetrics = {
    totalRowsReceived: 0,
    validRows: 0,
    flaggedRows: 0,
    missingValuesSanitized: 0,
    timestampAnomalies: 0,
    healthPercentage: 100,
    ingestRatePerSec: 1.0,
    avgLatencyMs: 0.8,
    minLatencyMs: 0.4,
    maxLatencyMs: 1.9,
    lastAnomalyType: null,
  };

  public reset(): void {
    this.lastTimestampMs = null;
    this.lastValidTemp = 70.0;
    this.lastValidVib = 1.05;
    this.lastValidPress = 500.0;
    this.metrics = {
      totalRowsReceived: 0,
      validRows: 0,
      flaggedRows: 0,
      missingValuesSanitized: 0,
      timestampAnomalies: 0,
      healthPercentage: 100,
      ingestRatePerSec: 1.0,
      avgLatencyMs: 0.8,
      minLatencyMs: 0.4,
      maxLatencyMs: 1.9,
      lastAnomalyType: null,
    };
  }

  public validateRow(raw: RawSensorRow, index: number): ValidatedSensorRow {
    const ingestStart = performance.now();
    const warnings: string[] = [];
    const sanitizedFields: string[] = [];
    let isValid = true;

    // 1. Validate Timestamp
    let timestampMs = Date.parse(raw.timestamp);
    let normalizedTimestamp = raw.timestamp;

    if (isNaN(timestampMs)) {
      warnings.push(`Malformed timestamp '${raw.timestamp}'`);
      isValid = false;
      this.metrics.timestampAnomalies++;
      // Auto-recover timestamp using previous + 1000ms
      timestampMs = (this.lastTimestampMs ?? Date.now()) + 1000;
      normalizedTimestamp = new Date(timestampMs).toISOString();
      sanitizedFields.push('timestamp');
    } else {
      if (this.lastTimestampMs !== null) {
        const delta = timestampMs - this.lastTimestampMs;
        if (delta <= 0) {
          warnings.push(`Non-monotonic timestamp delta (${delta}ms)`);
          this.metrics.timestampAnomalies++;
          isValid = false;
        } else if (delta > 10000) {
          warnings.push(`Timestamp gap detected (${Math.round(delta / 1000)}s)`);
          this.metrics.timestampAnomalies++;
          isValid = false;
        }
      }
      this.lastTimestampMs = timestampMs;
    }

    // 2. Validate Source ID
    const source_id = raw.source_id && String(raw.source_id).trim() ? String(raw.source_id).trim() : 'DEFAULT-UNIT';
    if (!raw.source_id) {
      warnings.push('Missing source_id, defaulted to DEFAULT-UNIT');
      sanitizedFields.push('source_id');
      isValid = false;
    }

    // 3. Validate Temperature
    let tempNum: number;
    if (raw.temperature_c === null || raw.temperature_c === undefined || raw.temperature_c === '') {
      warnings.push('Missing temperature_c, forward-filled from baseline');
      tempNum = this.lastValidTemp;
      sanitizedFields.push('temperature_c');
      this.metrics.missingValuesSanitized++;
      isValid = false;
    } else {
      tempNum = typeof raw.temperature_c === 'number' ? raw.temperature_c : parseFloat(String(raw.temperature_c));
      if (isNaN(tempNum)) {
        warnings.push(`Invalid temperature format: ${raw.temperature_c}`);
        tempNum = this.lastValidTemp;
        sanitizedFields.push('temperature_c');
        this.metrics.missingValuesSanitized++;
        isValid = false;
      } else if (tempNum < -40 || tempNum > 200) {
        warnings.push(`Out-of-range physical temperature (${tempNum}°C)`);
        isValid = false;
      } else {
        this.lastValidTemp = tempNum;
      }
    }

    // 4. Validate Vibration
    let vibNum: number;
    if (raw.vibration_g === null || raw.vibration_g === undefined || raw.vibration_g === '') {
      warnings.push('Missing vibration_g, forward-filled from baseline');
      vibNum = this.lastValidVib;
      sanitizedFields.push('vibration_g');
      this.metrics.missingValuesSanitized++;
      isValid = false;
    } else {
      vibNum = typeof raw.vibration_g === 'number' ? raw.vibration_g : parseFloat(String(raw.vibration_g));
      if (isNaN(vibNum)) {
        warnings.push(`Invalid vibration format: ${raw.vibration_g}`);
        vibNum = this.lastValidVib;
        sanitizedFields.push('vibration_g');
        this.metrics.missingValuesSanitized++;
        isValid = false;
      } else if (vibNum < 0 || vibNum > 25) {
        warnings.push(`Out-of-range physical vibration (${vibNum}g)`);
        isValid = false;
      } else {
        this.lastValidVib = vibNum;
      }
    }

    // 5. Validate Pressure
    let pressNum: number;
    if (raw.pressure_kpa === null || raw.pressure_kpa === undefined || raw.pressure_kpa === '') {
      warnings.push('Missing pressure_kpa, forward-filled from baseline');
      pressNum = this.lastValidPress;
      sanitizedFields.push('pressure_kpa');
      this.metrics.missingValuesSanitized++;
      isValid = false;
    } else {
      pressNum = typeof raw.pressure_kpa === 'number' ? raw.pressure_kpa : parseFloat(String(raw.pressure_kpa));
      if (isNaN(pressNum)) {
        warnings.push(`Invalid pressure format: ${raw.pressure_kpa}`);
        pressNum = this.lastValidPress;
        sanitizedFields.push('pressure_kpa');
        this.metrics.missingValuesSanitized++;
        isValid = false;
      } else if (pressNum < 0 || pressNum > 1500) {
        warnings.push(`Out-of-range physical pressure (${pressNum} kPa)`);
        isValid = false;
      } else {
        this.lastValidPress = pressNum;
      }
    }

    // Compute ingest latency
    const rowIngestLatencyMs = Math.max(0.1, performance.now() - ingestStart);

    // Update metrics
    this.metrics.totalRowsReceived++;
    if (isValid && warnings.length === 0) {
      this.metrics.validRows++;
    } else {
      this.metrics.flaggedRows++;
    }

    this.metrics.healthPercentage = Math.round(
      (this.metrics.validRows / Math.max(1, this.metrics.totalRowsReceived)) * 1000
    ) / 10;

    return {
      index,
      timestamp: normalizedTimestamp,
      timestampMs,
      source_id,
      temperature_c: Math.round(tempNum * 100) / 100,
      vibration_g: Math.round(vibNum * 100) / 100,
      pressure_kpa: Math.round(pressNum * 100) / 100,
      label: raw.label || 'normal',
      isValid: isValid && warnings.length === 0,
      warnings,
      sanitizedFields,
      rowIngestLatencyMs,
    };
  }

  /**
   * Universal CSV parser for sensor data
   */
  public static parseCsvString(csvText: string): RawSensorRow[] {
    const lines = csvText.trim().split(/\r?\n/);
    if (lines.length < 2) return [];

    const header = lines[0].split(',').map((h) => h.trim().toLowerCase());
    const tsIdx = header.findIndex((h) => h.includes('time'));
    const srcIdx = header.findIndex((h) => h.includes('source') || h.includes('id') || h.includes('unit'));
    const tempIdx = header.findIndex((h) => h.includes('temp'));
    const vibIdx = header.findIndex((h) => h.includes('vib'));
    const pressIdx = header.findIndex((h) => h.includes('press'));
    const labelIdx = header.findIndex((h) => h.includes('label') || h.includes('status') || h.includes('target'));

    const parsed: RawSensorRow[] = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      const cols = line.split(',').map((c) => c.trim());

      const rawRow: RawSensorRow = {
        timestamp: tsIdx >= 0 && cols[tsIdx] ? cols[tsIdx] : new Date(Date.now() + i * 1000).toISOString(),
        source_id: srcIdx >= 0 && cols[srcIdx] ? cols[srcIdx] : 'UNIT-01',
        temperature_c: tempIdx >= 0 && cols[tempIdx] !== '' ? cols[tempIdx] : null,
        vibration_g: vibIdx >= 0 && cols[vibIdx] !== '' ? cols[vibIdx] : null,
        pressure_kpa: pressIdx >= 0 && cols[pressIdx] !== '' ? cols[pressIdx] : null,
        label: labelIdx >= 0 && cols[labelIdx] ? cols[labelIdx] : 'normal',
      };

      parsed.push(rawRow);
    }

    return parsed;
  }
}
