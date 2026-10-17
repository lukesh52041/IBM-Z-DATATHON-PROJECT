/**
 * Audio cue synthesizer for mission-critical alerts using the Web Audio API.
 * Non-intrusive, clean industrial tones with instant mute capability.
 */

class SoundAlertService {
  private audioCtx: AudioContext | null = null;
  public isMuted: boolean = false;
  private lastAlertSoundTime = 0;

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.audioCtx) {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioContextClass) {
        this.audioCtx = new AudioContextClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
    return this.audioCtx;
  }

  public playAlertSound(tier: 'CRITICAL' | 'HIGH' | 'MEDIUM') {
    if (this.isMuted) return;

    // Rate limit alert sounds to avoid audio clutter (at most once every 3 seconds)
    const now = performance.now();
    if (now - this.lastAlertSoundTime < 3000) return;
    this.lastAlertSoundTime = now;

    try {
      const ctx = this.getContext();
      if (!ctx) return;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      if (tier === 'CRITICAL') {
        // Urgent dual-tone pulse
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(880, ctx.currentTime);
        osc.frequency.setValueAtTime(660, ctx.currentTime + 0.1);
        osc.frequency.setValueAtTime(880, ctx.currentTime + 0.2);

        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);

        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.35);
      } else if (tier === 'HIGH') {
        // High alert single chime
        osc.type = 'sine';
        osc.frequency.setValueAtTime(740, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(520, ctx.currentTime + 0.25);

        gain.gain.setValueAtTime(0.06, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.28);

        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.28);
      }
    } catch {
      // Audio autoplay policy or device without audio
    }
  }
}

export const soundAlerts = new SoundAlertService();
