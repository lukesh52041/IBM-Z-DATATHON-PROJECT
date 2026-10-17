import { RiskTier, SignalContribution } from '../types';

export interface AlertContext {
  riskTier: RiskTier;
  riskScore: number;
  primaryEvent: string;
  topSignals: SignalContribution[];
  currentValues: {
    temperature_c: number;
    vibration_g: number;
    pressure_kpa: number;
  };
}

export class RecommendationService {
  /**
   * Deterministic rule-based expert recommendation generator
   */
  public static getRuleBasedRecommendation(ctx: AlertContext): string {
    const { primaryEvent, riskTier, currentValues } = ctx;

    if (primaryEvent === 'overheat' || currentValues.temperature_c > 82) {
      if (riskTier === 'CRITICAL' || currentValues.temperature_c > 95) {
        return `Emergency thermal intervention: Throttle turbine output by 40%, engage secondary chiller pump loop B, and alert safety crew for possible heat exchanger fouling.`;
      }
      return `Elevated thermal gradient: Ramp up coolant recirculator to 85% duty cycle and inspect thermocouple TC-02 calibration.`;
    }

    if (primaryEvent === 'vibration_spike' || currentValues.vibration_g > 2.8) {
      if (riskTier === 'CRITICAL' || currentValues.vibration_g > 4.5) {
        return `High harmonic excursion: Reduce rotational speed to safe sub-critical band (1,200 RPM), engage active magnetic damper, and inspect bearing B-04 coupling.`;
      }
      return `Vibration flutter detected: Adjust blade pitch angle by -1.5° and monitor shaft frequency spectrum for harmonic resonance.`;
    }

    if (primaryEvent === 'pressure_drop' || currentValues.pressure_kpa < 400) {
      if (riskTier === 'CRITICAL' || currentValues.pressure_kpa < 280) {
        return `Hydraulic pressure loss: Switch feed immediately to accumulator backup bank, isolate section valve V-12, and inspect for manifold seal breach.`;
      }
      return `Pressure drop in intake manifold: Verify boost pump intake strainer differential pressure and prepare redundant valve circuit.`;
    }

    if (riskTier === 'CRITICAL') {
      return `Multi-signal risk convergence: Initiate orderly unit derating, notify watch supervisor, and review cross-coupling telemetry.`;
    }

    return `Monitor telemetry trend closely. Verify automated control loop setpoints and log baseline variance.`;
  }

  /**
   * Request recommendation from Gemini 3.8 Flash via server endpoint with instant fallback
   */
  public static async getRecommendation(
    ctx: AlertContext
  ): Promise<{ text: string; source: 'gemini-3.8-flash' | 'rule-engine' }> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1800);

      const response = await fetch('/api/recommendation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(ctx),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        if (data.recommendation && typeof data.recommendation === 'string' && data.recommendation.trim().length > 5) {
          return {
            text: data.recommendation.trim(),
            source: 'gemini-3.8-flash',
          };
        }
      }
    } catch {
      // Graceful fallback on network error or offline mode
    }

    return {
      text: this.getRuleBasedRecommendation(ctx),
      source: 'rule-engine',
    };
  }
}
