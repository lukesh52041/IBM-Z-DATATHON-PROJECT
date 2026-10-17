import React, { useState, useEffect, useRef, useCallback } from 'react';
import { RawSensorRow, ValidatedSensorRow, DetectionResult, SystemAlert, RiskTier } from './types';
import { DEFAULT_SENSOR_DATA } from './data/defaultDataset';
import { DataValidator } from './services/dataValidator';
import { AnomalyEngine } from './services/anomalyEngine';
import { RecommendationService } from './services/recommendationService';
import { soundAlerts } from './services/audioAlert';

import { Header } from './components/Header';
import { ControlToolbar } from './components/ControlToolbar';
import { RiskGauge } from './components/RiskGauge';
import { TelemetryCards } from './components/TelemetryCards';
import { SignalCharts } from './components/SignalCharts';
import { PrioritizedAlertList } from './components/PrioritizedAlertList';
import { TrendForecastPanel } from './components/TrendForecastPanel';
import { SystemHealthPanel } from './components/SystemHealthPanel';
import { ModelEvaluationModal } from './components/ModelEvaluationModal';
import { AuditLogModal } from './components/AuditLogModal';
import { DisclaimerBanner } from './components/DisclaimerBanner';

export default function App() {
  // Dataset state
  const [dataset, setDataset] = useState<RawSensorRow[]>(DEFAULT_SENSOR_DATA);
  const [isCustomData, setIsCustomData] = useState<boolean>(false);

  // Playback state
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [speed, setSpeed] = useState<number>(1);
  const [isMuted, setIsMuted] = useState<boolean>(false);

  // Processing engines
  const validatorRef = useRef<DataValidator>(new DataValidator());
  const anomalyEngineRef = useRef<AnomalyEngine>(new AnomalyEngine(20));

  // Current detection & history
  const [latestDetection, setLatestDetection] = useState<DetectionResult | null>(null);
  const [history, setHistory] = useState<DetectionResult[]>([]);
  const [alerts, setAlerts] = useState<SystemAlert[]>([]);

  // Health and evaluation
  const [healthMetrics, setHealthMetrics] = useState(validatorRef.current.metrics);
  const [evaluationMetrics, setEvaluationMetrics] = useState(anomalyEngineRef.current.evaluation);

  // Modals
  const [isEvaluationOpen, setIsEvaluationOpen] = useState<boolean>(false);
  const [isAuditLogOpen, setIsAuditLogOpen] = useState<boolean>(false);

  // AI Advisor status
  const [aiEngineStatus, setAiEngineStatus] = useState<'gemini-active' | 'rule-engine-fallback'>('rule-engine-fallback');

  // Check if Gemini backend endpoint is accessible
  useEffect(() => {
    fetch('/api/health')
      .then((res) => res.json())
      .then((data) => {
        if (data.geminiAvailable) {
          setAiEngineStatus('gemini-active');
        }
      })
      .catch(() => {
        setAiEngineStatus('rule-engine-fallback');
      });
  }, []);

  // Process a row at the given index
  const processIndex = useCallback(async (index: number, currentDataset: RawSensorRow[]) => {
    if (index < 0 || index >= currentDataset.length) return;

    const raw = currentDataset[index];
    const validated = validatorRef.current.validateRow(raw, index);
    const detection = anomalyEngineRef.current.processRow(validated);

    setLatestDetection(detection);
    setHistory((prev) => {
      const next = [...prev, detection];
      // Keep up to 80 rows in state for charts and trends
      return next.slice(-80);
    });

    setHealthMetrics({ ...validatorRef.current.metrics });
    setEvaluationMetrics({ ...anomalyEngineRef.current.evaluation });

    // Alert triggering condition:
    // When risk is HIGH or CRITICAL, or an anomaly episode is detected
    if (detection.isAnomaly || detection.riskTier === 'HIGH' || detection.riskTier === 'CRITICAL') {
      // Play sound cue if audio unmuted
      if (detection.riskTier === 'CRITICAL' || detection.riskTier === 'HIGH') {
        soundAlerts.playAlertSound(detection.riskTier);
      }

      // Check if this anomaly episode already has an active alert in the last 15 rows
      setAlerts((prevAlerts) => {
        const recentSameEvent = prevAlerts.find(
          (a) =>
            a.status === 'active' &&
            Math.abs(a.rowIndex - index) < 15 &&
            (a.primaryEvent === validated.label || a.riskTier === detection.riskTier)
        );

        if (recentSameEvent) {
          // Update the existing alert with latest score & metrics
          return prevAlerts.map((a) =>
            a.id === recentSameEvent.id
              ? {
                  ...a,
                  riskScore: Math.max(a.riskScore, detection.riskScore),
                  riskTier: detection.riskTier,
                  detectionLatencyMs: detection.detectionLatencyMs,
                  topContributingSignals: detection.topContributingSignals,
                }
              : a
          );
        }

        // Generate brand new alert
        const alertId = `ALT-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
        const primaryEventName =
          validated.label !== 'normal'
            ? validated.label
            : detection.topContributingSignals[0]?.signal === 'temperature'
            ? 'thermal_overheat'
            : detection.topContributingSignals[0]?.signal === 'vibration'
            ? 'vibration_spike'
            : 'pressure_instability';

        // Synchronous initial fallback action to ensure zero delay
        const initialAction = RecommendationService.getRuleBasedRecommendation({
          riskTier: detection.riskTier,
          riskScore: detection.riskScore,
          primaryEvent: primaryEventName,
          topSignals: detection.topContributingSignals,
          currentValues: {
            temperature_c: validated.temperature_c,
            vibration_g: validated.vibration_g,
            pressure_kpa: validated.pressure_kpa,
          },
        });

        const newAlert: SystemAlert = {
          id: alertId,
          rowIndex: index,
          timestamp: validated.timestamp,
          sourceId: validated.source_id,
          riskTier: detection.riskTier,
          riskScore: detection.riskScore,
          primaryEvent: primaryEventName,
          topContributingSignals: detection.topContributingSignals,
          recommendedAction: initialAction,
          recommendationSource: 'rule-engine',
          detectionLatencyMs: detection.detectionLatencyMs,
          status: 'active',
          history: [
            {
              timestamp: new Date().toISOString(),
              action: 'active',
              operator: 'SYSTEM-AI',
              note: `Risk score ${detection.riskScore}/100 detected. Top driver: ${detection.topContributingSignals[0]?.name}`,
            },
          ],
        };

        // Asynchronously request Gemini 3.8 Flash refinement if available
        RecommendationService.getRecommendation({
          riskTier: detection.riskTier,
          riskScore: detection.riskScore,
          primaryEvent: primaryEventName,
          topSignals: detection.topContributingSignals,
          currentValues: {
            temperature_c: validated.temperature_c,
            vibration_g: validated.vibration_g,
            pressure_kpa: validated.pressure_kpa,
          },
        }).then((res) => {
          if (res.source === 'gemini-3.8-flash') {
            setAlerts((curr) =>
              curr.map((a) =>
                a.id === alertId
                  ? {
                      ...a,
                      recommendedAction: res.text,
                      recommendationSource: 'gemini-3.8-flash',
                    }
                  : a
              )
            );
          }
        });

        return [newAlert, ...prevAlerts];
      });
    }
  }, []);

  // Main streaming timer loop
  useEffect(() => {
    if (!isPlaying) return;

    const intervalMs = Math.max(50, Math.round(1000 / speed));
    const timer = setInterval(() => {
      setCurrentIndex((prev) => {
        const next = prev + 1;
        if (next >= dataset.length) {
          setIsPlaying(false);
          return prev;
        }
        processIndex(next, dataset);
        return next;
      });
    }, intervalMs);

    return () => clearInterval(timer);
  }, [isPlaying, speed, dataset, processIndex]);

  // Initial startup: process row 0
  useEffect(() => {
    processIndex(0, dataset);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Reset stream to beginning
  const handleReset = useCallback(() => {
    setIsPlaying(false);
    validatorRef.current.reset();
    anomalyEngineRef.current.reset();
    setHistory([]);
    setAlerts([]);
    setCurrentIndex(0);
    processIndex(0, dataset);
  }, [dataset, processIndex]);

  // Step 1 second
  const handleStep = useCallback(() => {
    if (currentIndex < dataset.length - 1) {
      const next = currentIndex + 1;
      setCurrentIndex(next);
      processIndex(next, dataset);
    }
  }, [currentIndex, dataset, processIndex]);

  // Seek / Scrub directly to index
  const handleSeek = useCallback(
    (targetIndex: number) => {
      setIsPlaying(false);
      // Re-run window up to target index
      validatorRef.current.reset();
      anomalyEngineRef.current.reset();

      const start = Math.max(0, targetIndex - 25);
      const newHistory: DetectionResult[] = [];

      for (let i = start; i <= targetIndex; i++) {
        const val = validatorRef.current.validateRow(dataset[i], i);
        const det = anomalyEngineRef.current.processRow(val);
        newHistory.push(det);
        if (i === targetIndex) {
          setLatestDetection(det);
        }
      }

      setHistory(newHistory.slice(-80));
      setCurrentIndex(targetIndex);
      setHealthMetrics({ ...validatorRef.current.metrics });
      setEvaluationMetrics({ ...anomalyEngineRef.current.evaluation });
    },
    [dataset]
  );

  // Jump to specific scenario event
  const handleJumpToEvent = useCallback(
    (targetIndex: number) => {
      handleSeek(targetIndex);
      setIsPlaying(true);
    },
    [handleSeek]
  );

  // Handle custom CSV file upload (Extensible Connector)
  const handleUploadCsv = useCallback(
    (file: File) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        if (!text) return;
        const parsedRows = DataValidator.parseCsvString(text);
        if (parsedRows.length > 0) {
          setDataset(parsedRows);
          setIsCustomData(true);
          validatorRef.current.reset();
          anomalyEngineRef.current.reset();
          setHistory([]);
          setAlerts([]);
          setCurrentIndex(0);
          processIndex(0, parsedRows);
          setIsPlaying(true);
        }
      };
      reader.readAsText(file);
    },
    [processIndex]
  );

  // Restore default dataset
  const handleRestoreDefaultData = useCallback(() => {
    setDataset(DEFAULT_SENSOR_DATA);
    setIsCustomData(false);
    validatorRef.current.reset();
    anomalyEngineRef.current.reset();
    setHistory([]);
    setAlerts([]);
    setCurrentIndex(0);
    processIndex(0, DEFAULT_SENSOR_DATA);
    setIsPlaying(true);
  }, [processIndex]);

  // Alert Actions
  const handleAcknowledgeAlert = useCallback((alertId: string) => {
    setAlerts((prev) =>
      prev.map((a) =>
        a.id === alertId
          ? {
              ...a,
              status: 'acknowledged',
              acknowledgedAt: new Date().toISOString(),
              history: [
                ...a.history,
                {
                  timestamp: new Date().toISOString(),
                  action: 'acknowledged',
                  operator: 'OPERATOR-01',
                  note: 'Operator acknowledged advisory directive.',
                },
              ],
            }
          : a
      )
    );
  }, []);

  const handleDismissAlert = useCallback((alertId: string, note?: string) => {
    setAlerts((prev) =>
      prev.map((a) =>
        a.id === alertId
          ? {
              ...a,
              status: 'dismissed',
              dismissedAt: new Date().toISOString(),
              history: [
                ...a.history,
                {
                  timestamp: new Date().toISOString(),
                  action: 'dismissed',
                  operator: 'OPERATOR-01',
                  note: note || 'Dismissed as non-actionable or transient fluctuation.',
                },
              ],
            }
          : a
      )
    );
  }, []);

  const handleEscalateAlert = useCallback((alertId: string, note?: string) => {
    setAlerts((prev) =>
      prev.map((a) =>
        a.id === alertId
          ? {
              ...a,
              status: 'escalated',
              escalatedAt: new Date().toISOString(),
              history: [
                ...a.history,
                {
                  timestamp: new Date().toISOString(),
                  action: 'escalated',
                  operator: 'OPERATOR-01',
                  note: note || 'Escalated to facility engineering supervisor.',
                },
              ],
            }
          : a
      )
    );
  }, []);

  const toggleMute = () => {
    soundAlerts.isMuted = !soundAlerts.isMuted;
    setIsMuted(soundAlerts.isMuted);
  };

  const activeAlertCount = alerts.filter((a) => a.status === 'active').length;
  const currentTier: RiskTier = latestDetection?.riskTier || 'LOW';
  const currentScore = latestDetection?.riskScore ?? 0;

  return (
    <div className="min-h-screen bg-[#07080a] text-white flex flex-col selection:bg-blue-500 selection:text-white">
      {/* 1. Apple macOS Header */}
      <Header
        currentTier={currentTier}
        riskScore={currentScore}
        healthMetrics={healthMetrics}
        isMuted={isMuted}
        onToggleMute={toggleMute}
        onOpenEvaluation={() => setIsEvaluationOpen(true)}
        onOpenAuditLog={() => setIsAuditLogOpen(true)}
        onReset={handleReset}
        activeAlertCount={activeAlertCount}
        aiEngineStatus={aiEngineStatus}
      />

      {/* 2. Control Toolbar with Apple spring segmented controls */}
      <ControlToolbar
        isPlaying={isPlaying}
        onTogglePlay={() => setIsPlaying(!isPlaying)}
        onStep={handleStep}
        onReset={handleReset}
        speed={speed}
        onChangeSpeed={setSpeed}
        currentIndex={currentIndex}
        totalRows={dataset.length}
        onSeek={handleSeek}
        onJumpToEvent={handleJumpToEvent}
        onUploadCsv={handleUploadCsv}
        onRestoreDefaultData={handleRestoreDefaultData}
        isCustomData={isCustomData}
        currentTimestamp={latestDetection?.row.timestamp || ''}
      />

      {/* 3. Main Dashboard Grid Layout */}
      <main className="flex-1 p-4 max-w-[1720px] w-full mx-auto space-y-4">
        {/* Top Operational Row: Telemetry Cards & Risk Gauge */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
          {/* Telemetry Cards & Charts (Left: 8 cols) */}
          <div className="xl:col-span-8 space-y-4">
            {latestDetection && (
              <TelemetryCards
                currentRow={latestDetection.row}
                contributions={latestDetection.topContributingSignals}
              />
            )}

            {/* Signal Charts (Apple Stocks style) */}
            <SignalCharts history={history} />
          </div>

          {/* Risk Gauge & Predictive Horizon (Right: 4 cols) */}
          <div className="xl:col-span-4 space-y-4 flex flex-col">
            <RiskGauge
              score={currentScore}
              tier={currentTier}
              topSignals={latestDetection?.topContributingSignals || []}
              trendSlope={latestDetection?.trend.temperatureSlopePerSec || 0}
            />

            {latestDetection && (
              <TrendForecastPanel
                trend={latestDetection.trend}
                currentValues={{
                  temp: latestDetection.row.temperature_c,
                  vib: latestDetection.row.vibration_g,
                  press: latestDetection.row.pressure_kpa,
                }}
              />
            )}
          </div>
        </div>

        {/* Lower Row: Prioritized Alert Queue & System Health Panel */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
          {/* Prioritized Alert Queue (7 cols) */}
          <div className="xl:col-span-7">
            <PrioritizedAlertList
              alerts={alerts}
              onAcknowledge={handleAcknowledgeAlert}
              onDismiss={handleDismissAlert}
              onEscalate={handleEscalateAlert}
            />
          </div>

          {/* System Ingestion & Health Panel (5 cols) */}
          <div className="xl:col-span-5 flex flex-col justify-between gap-4">
            <SystemHealthPanel
              metrics={healthMetrics}
              isPlaying={isPlaying}
              totalRowsProcessed={currentIndex + 1}
            />

            {/* Quick Ground Truth Summary Box */}
            <div className="apple-glass-card rounded-2xl p-4 shadow-lg">
              <div className="flex items-center justify-between text-xs mb-3">
                <span className="text-white/80 font-semibold tracking-tight">
                  Ground Truth Verification Summary
                </span>
                <button
                  onClick={() => setIsEvaluationOpen(true)}
                  className="text-blue-400 hover:text-blue-300 text-[11px] font-medium transition-colors"
                >
                  View Details &rarr;
                </button>
              </div>
              <div className="grid grid-cols-4 gap-2 text-center text-xs">
                <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                  <span className="text-[10px] text-white/40 block mb-0.5">Precision</span>
                  <span className="font-bold font-mono text-emerald-400">{evaluationMetrics.precision}%</span>
                </div>
                <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                  <span className="text-[10px] text-white/40 block mb-0.5">Recall</span>
                  <span className="font-bold font-mono text-blue-400">{evaluationMetrics.recall}%</span>
                </div>
                <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                  <span className="text-[10px] text-white/40 block mb-0.5">F1 Score</span>
                  <span className="font-bold font-mono text-indigo-400">{evaluationMetrics.f1Score}%</span>
                </div>
                <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                  <span className="text-[10px] text-white/40 block mb-0.5">False Alarm</span>
                  <span className="font-bold font-mono text-amber-400">{evaluationMetrics.falseAlarmRate}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* 4. Human Authority & Safety Disclaimer Banner */}
      <DisclaimerBanner />

      {/* 5. Modals */}
      {isEvaluationOpen && (
        <ModelEvaluationModal
          metrics={evaluationMetrics}
          onClose={() => setIsEvaluationOpen(false)}
          currentRowIndex={currentIndex}
        />
      )}

      {isAuditLogOpen && (
        <AuditLogModal alerts={alerts} onClose={() => setIsAuditLogOpen(false)} />
      )}
    </div>
  );
}
