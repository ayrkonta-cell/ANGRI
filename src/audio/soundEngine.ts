import { BirdType, MaterialType } from '../types/game';

class SoundEngine {
  private ctx: AudioContext | null = null;
  private muted: boolean = false;
  private lastImpactTime = 0;

  private ensureCtx(): AudioContext | null {
    if (this.muted) return null;
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public setMuted(muted: boolean) {
    this.muted = muted;
  }

  public isMuted(): boolean {
    return this.muted;
  }

  public playStretch() {
    const ctx = this.ensureCtx();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.linearRampToValueAtTime(195, now + 0.08);
    gain.gain.setValueAtTime(0.06, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.09);
  }

  public playLaunch(bird: BirdType) {
    const ctx = this.ensureCtx();
    if (!ctx) return;
    const now = ctx.currentTime;

    // Slingshot rubber twang
    const twang = ctx.createOscillator();
    const twangGain = ctx.createGain();
    twang.type = 'sine';
    twang.frequency.setValueAtTime(160, now);
    twang.frequency.exponentialRampToValueAtTime(420, now + 0.12);
    twang.frequency.exponentialRampToValueAtTime(130, now + 0.25);
    twangGain.gain.setValueAtTime(0.18, now);
    twangGain.gain.exponentialRampToValueAtTime(0.001, now + 0.26);
    twang.connect(twangGain);
    twangGain.connect(ctx.destination);
    twang.start(now);
    twang.stop(now + 0.27);

    // Bird launch cry
    this.playBirdVoice(bird, now + 0.05);
  }

  public playBirdVoice(bird: BirdType, startAt?: number) {
    const ctx = this.ensureCtx();
    if (!ctx) return;
    const now = startAt ?? ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    switch (bird) {
      case 'red':
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(520, now);
        osc.frequency.exponentialRampToValueAtTime(780, now + 0.09);
        osc.frequency.exponentialRampToValueAtTime(440, now + 0.22);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.23);
        break;
      case 'blues':
        osc.type = 'sine';
        osc.frequency.setValueAtTime(920, now);
        osc.frequency.exponentialRampToValueAtTime(1380, now + 0.07);
        osc.frequency.exponentialRampToValueAtTime(1040, now + 0.14);
        gain.gain.setValueAtTime(0.11, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
        break;
      case 'chuck':
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(640, now);
        osc.frequency.exponentialRampToValueAtTime(1450, now + 0.14);
        gain.gain.setValueAtTime(0.14, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
        break;
      case 'bomb':
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(220, now);
        osc.frequency.exponentialRampToValueAtTime(140, now + 0.22);
        gain.gain.setValueAtTime(0.13, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.24);
        break;
      case 'matilda':
        osc.type = 'sine';
        osc.frequency.setValueAtTime(660, now);
        osc.frequency.linearRampToValueAtTime(880, now + 0.08);
        osc.frequency.linearRampToValueAtTime(620, now + 0.18);
        gain.gain.setValueAtTime(0.11, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
        break;
      case 'hal':
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(480, now);
        osc.frequency.exponentialRampToValueAtTime(760, now + 0.08);
        osc.frequency.exponentialRampToValueAtTime(360, now + 0.2);
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.21);
        break;
      case 'terence':
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(145, now);
        osc.frequency.linearRampToValueAtTime(110, now + 0.24);
        gain.gain.setValueAtTime(0.14, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.26);
        break;
      case 'bubbles':
        osc.type = 'sine';
        osc.frequency.setValueAtTime(840, now);
        osc.frequency.exponentialRampToValueAtTime(1260, now + 0.11);
        gain.gain.setValueAtTime(0.11, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.13);
        break;
      case 'stella':
        osc.type = 'sine';
        osc.frequency.setValueAtTime(780, now);
        osc.frequency.exponentialRampToValueAtTime(1180, now + 0.09);
        osc.frequency.exponentialRampToValueAtTime(980, now + 0.19);
        gain.gain.setValueAtTime(0.11, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
        break;
      case 'mighty_eagle':
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(1100, now);
        osc.frequency.exponentialRampToValueAtTime(520, now + 0.35);
        gain.gain.setValueAtTime(0.14, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.36);
        break;
    }

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.4);
  }

  public playAbility(bird: BirdType) {
    const ctx = this.ensureCtx();
    if (!ctx) return;
    const now = ctx.currentTime;

    if (bird === 'bomb') {
      this.playExplosion();
      return;
    }

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    if (bird === 'chuck') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(420, now);
      osc.frequency.exponentialRampToValueAtTime(1750, now + 0.18);
      gain.gain.setValueAtTime(0.13, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
    } else if (bird === 'blues') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(740, now);
      osc.frequency.setValueAtTime(980, now + 0.05);
      osc.frequency.setValueAtTime(1260, now + 0.1);
      gain.gain.setValueAtTime(0.13, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
    } else if (bird === 'matilda') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(520, now);
      osc.frequency.exponentialRampToValueAtTime(220, now + 0.14);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
    } else if (bird === 'bubbles') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(200, now);
      osc.frequency.exponentialRampToValueAtTime(650, now + 0.16);
      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
    } else if (bird === 'stella') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, now);
      osc.frequency.exponentialRampToValueAtTime(1100, now + 0.12);
      osc.frequency.exponentialRampToValueAtTime(840, now + 0.22);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.24);
    } else if (bird === 'hal') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(680, now);
      osc.frequency.exponentialRampToValueAtTime(320, now + 0.12);
      osc.frequency.exponentialRampToValueAtTime(780, now + 0.22);
      gain.gain.setValueAtTime(0.14, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.24);
    } else if (bird === 'terence') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(180, now);
      osc.frequency.exponentialRampToValueAtTime(65, now + 0.2);
      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
    } else {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(500, now);
      osc.frequency.exponentialRampToValueAtTime(920, now + 0.12);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
    }
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.26);
  }

  public playImpact(material: MaterialType, strength: number) {
    const ctx = this.ensureCtx();
    if (!ctx) return;
    const nowMs = performance.now();
    if (nowMs - this.lastImpactTime < 45) return;
    this.lastImpactTime = nowMs;

    const now = ctx.currentTime;
    const vol = Math.min(0.16, Math.max(0.03, strength * 0.015));
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    if (material === 'ice') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1500 + Math.random() * 500, now);
      osc.frequency.exponentialRampToValueAtTime(750, now + 0.08);
    } else if (material === 'stone' || material === 'boulder') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(130 + Math.random() * 40, now);
      osc.frequency.exponentialRampToValueAtTime(55, now + 0.1);
    } else {
      osc.type = 'square';
      osc.frequency.setValueAtTime(280 + Math.random() * 90, now);
      osc.frequency.exponentialRampToValueAtTime(110, now + 0.07);
    }

    gain.gain.setValueAtTime(vol, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.11);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.12);
  }

  public playBreak(material: MaterialType) {
    const ctx = this.ensureCtx();
    if (!ctx) return;
    const now = ctx.currentTime;
    if (material === 'tnt') {
      this.playExplosion();
      return;
    }
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    if (material === 'ice') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(2200, now);
      osc.frequency.exponentialRampToValueAtTime(900, now + 0.12);
    } else if (material === 'stone' || material === 'boulder') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(160, now);
      osc.frequency.exponentialRampToValueAtTime(48, now + 0.16);
    } else {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(360, now);
      osc.frequency.exponentialRampToValueAtTime(100, now + 0.12);
    }
    gain.gain.setValueAtTime(0.14, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.17);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.18);
  }

  public playPigPop() {
    const ctx = this.ensureCtx();
    if (!ctx) return;
    const now = ctx.currentTime;

    // Cartoon oink + pop
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(320, now);
    osc.frequency.exponentialRampToValueAtTime(760, now + 0.09);
    osc.frequency.exponentialRampToValueAtTime(180, now + 0.16);
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.19);
  }

  public playExplosion() {
    const ctx = this.ensureCtx();
    if (!ctx) return;
    const now = ctx.currentTime;

    // White noise burst through lowpass filter
    const bufferSize = ctx.sampleRate * 0.45;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.14));
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(520, now);
    filter.frequency.exponentialRampToValueAtTime(90, now + 0.42);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.44);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    noise.start(now);
  }

  public playVictory() {
    const ctx = this.ensureCtx();
    if (!ctx) return;
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((freq, idx) => {
      const now = ctx.currentTime + idx * 0.1;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now);
      gain.gain.setValueAtTime(0.14, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.3);
    });
  }

  public playDefeat() {
    const ctx = this.ensureCtx();
    if (!ctx) return;
    const notes = [360, 310, 260, 210];
    notes.forEach((freq, idx) => {
      const now = ctx.currentTime + idx * 0.13;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, now);
      gain.gain.setValueAtTime(0.09, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.24);
    });
  }
}

export const soundEngine = new SoundEngine();
