import { RawSensorRow } from '../types';

/**
 * 300 synthetic sensor stream rows (1 second interval)
 * Columns: timestamp, source_id, temperature_c, vibration_g, pressure_kpa, label
 * Contains 3 labeled critical anomaly episodes:
 * 1. Rows 65-95: 'overheat' (temperature rises from 70°C up to 104°C)
 * 2. Rows 155-185: 'vibration_spike' (vibration spikes from 1.0g up to 7.2g)
 * 3. Rows 225-260: 'pressure_drop' (pressure collapses from 500 kPa down to 190 kPa)
 * Includes realistic edge cases (dirty rows with missing pressure, malformed timestamp, jitter) for data health validation.
 */

function generate300Rows(): { rawRows: RawSensorRow[]; csvString: string } {
  const rows: RawSensorRow[] = [];
  const baseTime = new Date('2026-10-17T08:00:00.000Z').getTime();

  for (let i = 0; i < 300; i++) {
    const timeMs = baseTime + i * 1000;
    const timeIso = new Date(timeMs).toISOString();
    const sourceId = 'TURBINE-04';

    let temp = 70.0 + (Math.sin(i * 0.15) * 1.4) + ((Math.random() - 0.5) * 0.8);
    let vib = 1.05 + (Math.cos(i * 0.2) * 0.12) + ((Math.random() - 0.5) * 0.1);
    let press = 502.0 + (Math.sin(i * 0.08) * 4.0) + ((Math.random() - 0.5) * 2.5);
    let label = 'normal';

    // 1. Overheat Event: Rows 65 to 95
    if (i >= 65 && i <= 95) {
      label = 'overheat';
      const progress = (i - 65) / 30; // 0 to 1
      const heatProfile = Math.sin(progress * Math.PI); // 0 -> 1 -> 0 peak
      temp = 70.0 + (heatProfile * 34.5) + ((Math.random() - 0.5) * 1.5); // Peak ~104.5°C
      vib = 1.05 + (heatProfile * 0.9) + ((Math.random() - 0.5) * 0.2); // slight expansion
      press = 500.0 - (heatProfile * 15.0) + ((Math.random() - 0.5) * 3.0);
    }

    // 2. Vibration Spike Event: Rows 155 to 185
    else if (i >= 155 && i <= 185) {
      label = 'vibration_spike';
      const progress = (i - 155) / 30;
      const spikeProfile = Math.sin(progress * Math.PI);
      const flutter = Math.sin(i * 2.8) * 1.2;
      vib = 1.1 + (spikeProfile * 6.1) + flutter + ((Math.random() - 0.5) * 0.4); // Peak ~7.3g
      temp = 71.0 + (spikeProfile * 4.2) + ((Math.random() - 0.5) * 0.6);
      press = 498.0 + (flutter * 5.0) + ((Math.random() - 0.5) * 2.0);
    }

    // 3. Pressure Drop Event: Rows 225 to 260
    else if (i >= 225 && i <= 260) {
      label = 'pressure_drop';
      const progress = (i - 225) / 35;
      const dropProfile = Math.sin(progress * Math.PI);
      press = 502.0 - (dropProfile * 315.0) + ((Math.random() - 0.5) * 5.0); // Drops to ~187 kPa
      temp = 70.2 + (dropProfile * 2.0) + ((Math.random() - 0.5) * 0.8);
      vib = 1.08 + (dropProfile * 0.45) + ((Math.random() - 0.5) * 0.15);
    }

    // Insert intentional data-health test anomalies
    let tempVal: number | string | null = Math.round(temp * 100) / 100;
    let vibVal: number | string | null = Math.round(vib * 100) / 100;
    let pressVal: number | string | null = Math.round(press * 100) / 100;
    let timestampStr = timeIso;

    if (i === 34) {
      // Missing pressure value test
      pressVal = null;
    } else if (i === 114) {
      // Jittered non-standard timestamp format test
      timestampStr = timeIso.replace('T', ' ').slice(0, 19);
    } else if (i === 208) {
      // String encoded temperature value test
      tempVal = `${tempVal}`;
    }

    rows.push({
      timestamp: timestampStr,
      source_id: sourceId,
      temperature_c: tempVal,
      vibration_g: vibVal,
      pressure_kpa: pressVal,
      label,
    });
  }

  // Construct CSV String
  let csv = 'timestamp,source_id,temperature_c,vibration_g,pressure_kpa,label\n';
  for (const r of rows) {
    const t = r.temperature_c !== null ? r.temperature_c : '';
    const v = r.vibration_g !== null ? r.vibration_g : '';
    const p = r.pressure_kpa !== null ? r.pressure_kpa : '';
    csv += `${r.timestamp},${r.source_id},${t},${v},${p},${r.label}\n`;
  }

  return { rawRows: rows, csvString: csv };
}

export const { rawRows: DEFAULT_SENSOR_DATA, csvString: DEFAULT_CSV_STRING } = generate300Rows();
