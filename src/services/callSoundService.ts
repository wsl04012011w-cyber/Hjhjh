// Web Audio API synthesizer for phone/Discord-style calling and ringtone sounds
class CallSoundManager {
  private ctx: AudioContext | null = null;
  private ringInterval: any = null;
  private currentSource: AudioNode | null = null;

  private getContext(): AudioContext {
    if (!this.ctx || this.ctx.state === 'closed') {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  // Play outgoing ringing tone (gentle dual harmonic phone pulses)
  playOutgoingRing() {
    this.stopAllSounds();
    const playPulse = () => {
      try {
        const ctx = this.getContext();
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();

        osc1.type = 'sine';
        osc2.type = 'sine';
        osc1.frequency.value = 440; // A4
        osc2.frequency.value = 480; // Standard ringback tone

        const now = ctx.currentTime;
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.08, now + 0.1);
        gain.gain.setValueAtTime(0.08, now + 1.2);
        gain.gain.linearRampToValueAtTime(0, now + 1.4);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(ctx.destination);

        osc1.start(now);
        osc2.start(now);
        osc1.stop(now + 1.5);
        osc2.stop(now + 1.5);
      } catch (err) {
        console.warn('Could not play outgoing ring:', err);
      }
    };

    playPulse();
    this.ringInterval = setInterval(playPulse, 3500);
  }

  // Play incoming ringtone (upbeat melodic chime)
  playIncomingRing() {
    this.stopAllSounds();
    const playMelody = () => {
      try {
        const ctx = this.getContext();
        const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
        notes.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.value = freq;

          const startTime = ctx.currentTime + idx * 0.12;
          gain.gain.setValueAtTime(0, startTime);
          gain.gain.linearRampToValueAtTime(0.12, startTime + 0.04);
          gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.35);

          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(startTime);
          osc.stop(startTime + 0.4);
        });
      } catch (err) {
        console.warn('Could not play incoming ring:', err);
      }
    };

    playMelody();
    this.ringInterval = setInterval(playMelody, 2200);
  }

  // Short pleasant ascending connect chime
  playConnectedChime() {
    this.stopAllSounds();
    try {
      const ctx = this.getContext();
      const freqs = [440, 554.37, 659.25]; // A4, C#5, E5
      freqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = freq;

        const startTime = ctx.currentTime + idx * 0.09;
        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(0.1, startTime + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.3);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(startTime);
        osc.stop(startTime + 0.35);
      });
    } catch (err) {
      console.warn('Could not play connect chime:', err);
    }
  }

  // Short descending disconnect chime
  playEndChime() {
    this.stopAllSounds();
    try {
      const ctx = this.getContext();
      const freqs = [587.33, 440, 329.63]; // D5, A4, E4
      freqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = freq;

        const startTime = ctx.currentTime + idx * 0.09;
        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(0.08, startTime + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.25);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(startTime);
        osc.stop(startTime + 0.3);
      });
    } catch (err) {
      console.warn('Could not play end chime:', err);
    }
  }

  stopAllSounds() {
    if (this.ringInterval) {
      clearInterval(this.ringInterval);
      this.ringInterval = null;
    }
  }
}

export const callSoundService = new CallSoundManager();
