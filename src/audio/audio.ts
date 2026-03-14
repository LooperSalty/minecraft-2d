export class AudioManager {
  private ctx: AudioContext | null;
  private masterVolume: GainNode | null;
  private musicVolume: GainNode | null;
  private sfxVolume: GainNode | null;
  private musicPlaying: boolean;
  private initialized: boolean;
  private musicInterval: ReturnType<typeof setInterval> | null;
  private noiseBuffer: AudioBuffer | null;

  constructor() {
    this.ctx = null;
    this.masterVolume = null;
    this.musicVolume = null;
    this.sfxVolume = null;
    this.musicPlaying = false;
    this.initialized = false;
    this.musicInterval = null;
    this.noiseBuffer = null;
  }

  init(): void {
    if (this.initialized) return;

    this.ctx = new AudioContext();
    this.masterVolume = this.ctx.createGain();
    this.masterVolume.gain.value = 1.0;
    this.masterVolume.connect(this.ctx.destination);

    this.musicVolume = this.ctx.createGain();
    this.musicVolume.gain.value = 0.3;
    this.musicVolume.connect(this.masterVolume);

    this.sfxVolume = this.ctx.createGain();
    this.sfxVolume.gain.value = 0.5;
    this.sfxVolume.connect(this.masterVolume);

    this.noiseBuffer = this.createNoiseBuffer();
    this.initialized = true;
  }

  private createNoiseBuffer(): AudioBuffer {
    const ctx = this.ctx!;
    const sampleRate = ctx.sampleRate;
    const length = sampleRate * 2;
    const buffer = ctx.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    return buffer;
  }

  private playTone(
    freq: number,
    duration: number,
    type: OscillatorType,
    volume: number = 0.3,
    attack: number = 0.01,
    decay: number = 0.1
  ): OscillatorNode | null {
    if (!this.ctx || !this.sfxVolume) return null;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);

    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(volume, now + attack);
    gain.gain.linearRampToValueAtTime(volume * 0.7, now + attack + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration - decay + decay);

    osc.connect(gain);
    gain.connect(this.sfxVolume);

    osc.start(now);
    osc.stop(now + duration);

    return osc;
  }

  private playNoise(
    duration: number,
    volume: number = 0.3,
    filterFreq: number = 1000
  ): void {
    if (!this.ctx || !this.sfxVolume || !this.noiseBuffer) return;

    const now = this.ctx.currentTime;
    const source = this.ctx.createBufferSource();
    source.buffer = this.noiseBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(filterFreq, now);
    filter.Q.setValueAtTime(1.0, now);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxVolume);

    source.start(now);
    source.stop(now + duration);
  }

  private scheduleNote(
    freq: number,
    time: number,
    duration: number,
    type: OscillatorType,
    gainNode: GainNode
  ): void {
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const noteGain = this.ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, time);

    noteGain.gain.setValueAtTime(0, time);
    noteGain.gain.linearRampToValueAtTime(0.08, time + 0.02);
    noteGain.gain.exponentialRampToValueAtTime(0.001, time + duration);

    osc.connect(noteGain);
    noteGain.connect(gainNode);

    osc.start(time);
    osc.stop(time + duration);
  }

  playBlockBreak(): void {
    if (!this.ctx || !this.sfxVolume) return;

    this.playNoise(0.15, 0.4, 800);

    const pitchVariation = 150 + Math.random() * 200;
    this.playTone(pitchVariation, 0.08, 'square', 0.1, 0.005, 0.07);
  }

  playBlockPlace(): void {
    if (!this.ctx || !this.sfxVolume) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(200, now);
    osc.frequency.exponentialRampToValueAtTime(120, now + 0.08);

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    osc.connect(gain);
    gain.connect(this.sfxVolume);

    osc.start(now);
    osc.stop(now + 0.08);
  }

  playHit(): void {
    if (!this.ctx || !this.sfxVolume) return;

    this.playNoise(0.1, 0.4, 600);
    this.playTone(150, 0.1, 'sawtooth', 0.2, 0.005, 0.08);
  }

  playHurt(): void {
    if (!this.ctx || !this.sfxVolume) return;

    const now = this.ctx.currentTime;

    this.playNoise(0.12, 0.35, 500);
    this.playTone(140, 0.15, 'sawtooth', 0.2, 0.005, 0.12);

    const osc2 = this.ctx.createOscillator();
    const gain2 = this.ctx.createGain();

    osc2.type = 'sawtooth';
    osc2.frequency.setValueAtTime(147, now);
    osc2.frequency.exponentialRampToValueAtTime(80, now + 0.15);
    osc2.detune.setValueAtTime(25, now);

    gain2.gain.setValueAtTime(0.15, now);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

    osc2.connect(gain2);
    gain2.connect(this.sfxVolume);

    osc2.start(now);
    osc2.stop(now + 0.2);

    const delayCopy = this.ctx.createOscillator();
    const delayGain = this.ctx.createGain();

    delayCopy.type = 'sawtooth';
    delayCopy.frequency.setValueAtTime(135, now + 0.05);
    delayCopy.frequency.exponentialRampToValueAtTime(75, now + 0.2);

    delayGain.gain.setValueAtTime(0, now);
    delayGain.gain.setValueAtTime(0.08, now + 0.05);
    delayGain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

    delayCopy.connect(delayGain);
    delayGain.connect(this.sfxVolume);

    delayCopy.start(now + 0.05);
    delayCopy.stop(now + 0.25);
  }

  playEat(): void {
    if (!this.ctx || !this.sfxVolume || !this.noiseBuffer) return;

    const now = this.ctx.currentTime;

    for (let i = 0; i < 4; i++) {
      const time = now + i * 0.08;
      const source = this.ctx.createBufferSource();
      source.buffer = this.noiseBuffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1200 + Math.random() * 400, time);
      filter.Q.setValueAtTime(2.0, time);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0, time);
      gain.gain.linearRampToValueAtTime(0.3, time + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.04);

      source.connect(filter);
      filter.connect(gain);
      gain.connect(this.sfxVolume);

      source.start(time);
      source.stop(time + 0.04);
    }
  }

  playPickup(): void {
    if (!this.ctx || !this.sfxVolume) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, now);
    osc.frequency.exponentialRampToValueAtTime(1200, now + 0.15);

    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

    osc.connect(gain);
    gain.connect(this.sfxVolume);

    osc.start(now);
    osc.stop(now + 0.15);
  }

  playExplosion(): void {
    if (!this.ctx || !this.sfxVolume || !this.noiseBuffer) return;

    const now = this.ctx.currentTime;
    const source = this.ctx.createBufferSource();
    source.buffer = this.noiseBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(200, now);
    filter.frequency.exponentialRampToValueAtTime(50, now + 0.5);
    filter.Q.setValueAtTime(1.5, now);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.8, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxVolume);

    source.start(now);
    source.stop(now + 0.5);

    const subOsc = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();

    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(60, now);
    subOsc.frequency.exponentialRampToValueAtTime(20, now + 0.5);

    subGain.gain.setValueAtTime(0.6, now);
    subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

    subOsc.connect(subGain);
    subGain.connect(this.sfxVolume);

    subOsc.start(now);
    subOsc.stop(now + 0.5);
  }

  playBow(): void {
    if (!this.ctx || !this.sfxVolume) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.exponentialRampToValueAtTime(300, now + 0.12);

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    osc.connect(gain);
    gain.connect(this.sfxVolume);

    osc.start(now);
    osc.stop(now + 0.12);

    this.playNoise(0.06, 0.15, 2000);
  }

  playPortal(): void {
    if (!this.ctx || !this.sfxVolume) return;

    const now = this.ctx.currentTime;

    const carrier = this.ctx.createOscillator();
    const modulator = this.ctx.createOscillator();
    const modGain = this.ctx.createGain();
    const carrierGain = this.ctx.createGain();

    carrier.type = 'sine';
    carrier.frequency.setValueAtTime(440, now);
    carrier.frequency.linearRampToValueAtTime(880, now + 0.5);
    carrier.frequency.linearRampToValueAtTime(440, now + 1.0);

    modulator.type = 'sine';
    modulator.frequency.setValueAtTime(6, now);
    modGain.gain.setValueAtTime(30, now);

    modulator.connect(modGain);
    modGain.connect(carrier.frequency);

    carrierGain.gain.setValueAtTime(0, now);
    carrierGain.gain.linearRampToValueAtTime(0.2, now + 0.15);
    carrierGain.gain.setValueAtTime(0.2, now + 0.6);
    carrierGain.gain.exponentialRampToValueAtTime(0.001, now + 1.0);

    carrier.connect(carrierGain);
    carrierGain.connect(this.sfxVolume);

    carrier.start(now);
    modulator.start(now);
    carrier.stop(now + 1.0);
    modulator.stop(now + 1.0);

    const high = this.ctx.createOscillator();
    const highGain = this.ctx.createGain();

    high.type = 'sine';
    high.frequency.setValueAtTime(1760, now);
    high.frequency.linearRampToValueAtTime(2200, now + 1.0);

    highGain.gain.setValueAtTime(0, now);
    highGain.gain.linearRampToValueAtTime(0.05, now + 0.3);
    highGain.gain.exponentialRampToValueAtTime(0.001, now + 1.0);

    high.connect(highGain);
    highGain.connect(this.sfxVolume);

    high.start(now);
    high.stop(now + 1.0);
  }

  playLevelUp(): void {
    if (!this.ctx || !this.sfxVolume) return;

    const now = this.ctx.currentTime;
    const notes = [523.25, 659.25, 783.99]; // C5, E5, G5

    notes.forEach((freq, i) => {
      const time = now + i * 0.15;
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, time);

      gain.gain.setValueAtTime(0, time);
      gain.gain.linearRampToValueAtTime(0.3, time + 0.02);
      gain.gain.setValueAtTime(0.3, time + 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.15);

      osc.connect(gain);
      gain.connect(this.sfxVolume!);

      osc.start(time);
      osc.stop(time + 0.15);
    });
  }

  playClick(): void {
    if (!this.ctx || !this.sfxVolume) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(1000, now);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);

    osc.connect(gain);
    gain.connect(this.sfxVolume);

    osc.start(now);
    osc.stop(now + 0.03);
  }

  playDragonRoar(): void {
    if (!this.ctx || !this.sfxVolume || !this.noiseBuffer) return;

    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const oscGain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(50, now);
    osc.frequency.linearRampToValueAtTime(70, now + 0.5);
    osc.frequency.linearRampToValueAtTime(40, now + 2.0);

    oscGain.gain.setValueAtTime(0, now);
    oscGain.gain.linearRampToValueAtTime(0.4, now + 0.2);
    oscGain.gain.setValueAtTime(0.4, now + 1.0);
    oscGain.gain.exponentialRampToValueAtTime(0.001, now + 2.0);

    osc.connect(oscGain);
    oscGain.connect(this.sfxVolume);

    osc.start(now);
    osc.stop(now + 2.0);

    const source = this.ctx.createBufferSource();
    source.buffer = this.noiseBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(300, now);
    filter.Q.setValueAtTime(2.0, now);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0, now);
    noiseGain.gain.linearRampToValueAtTime(0.25, now + 0.3);
    noiseGain.gain.setValueAtTime(0.25, now + 1.0);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 2.0);

    source.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(this.sfxVolume);

    source.start(now);
    source.stop(now + 2.0);

    const delayOsc = this.ctx.createOscillator();
    const delayGain = this.ctx.createGain();

    delayOsc.type = 'sawtooth';
    delayOsc.frequency.setValueAtTime(48, now + 0.1);
    delayOsc.frequency.linearRampToValueAtTime(65, now + 0.6);
    delayOsc.frequency.linearRampToValueAtTime(38, now + 2.1);

    delayGain.gain.setValueAtTime(0, now);
    delayGain.gain.setValueAtTime(0, now + 0.1);
    delayGain.gain.linearRampToValueAtTime(0.15, now + 0.3);
    delayGain.gain.exponentialRampToValueAtTime(0.001, now + 2.1);

    delayOsc.connect(delayGain);
    delayGain.connect(this.sfxVolume);

    delayOsc.start(now + 0.1);
    delayOsc.stop(now + 2.1);
  }

  playDragonDeath(): void {
    if (!this.ctx || !this.sfxVolume || !this.noiseBuffer) return;

    const now = this.ctx.currentTime;

    const drone = this.ctx.createOscillator();
    const droneGain = this.ctx.createGain();

    drone.type = 'sawtooth';
    drone.frequency.setValueAtTime(200, now);
    drone.frequency.exponentialRampToValueAtTime(50, now + 3.0);

    droneGain.gain.setValueAtTime(0, now);
    droneGain.gain.linearRampToValueAtTime(0.4, now + 0.3);
    droneGain.gain.setValueAtTime(0.35, now + 2.0);
    droneGain.gain.exponentialRampToValueAtTime(0.001, now + 3.0);

    drone.connect(droneGain);
    droneGain.connect(this.sfxVolume);

    drone.start(now);
    drone.stop(now + 3.0);

    const sub = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();

    sub.type = 'sine';
    sub.frequency.setValueAtTime(100, now);
    sub.frequency.exponentialRampToValueAtTime(25, now + 3.0);

    subGain.gain.setValueAtTime(0, now);
    subGain.gain.linearRampToValueAtTime(0.3, now + 0.2);
    subGain.gain.exponentialRampToValueAtTime(0.001, now + 3.0);

    sub.connect(subGain);
    subGain.connect(this.sfxVolume);

    sub.start(now);
    sub.stop(now + 3.0);

    const shimmerFreqs = [2000, 2500, 3000, 3500, 4000];
    shimmerFreqs.forEach((freq) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);
      osc.frequency.linearRampToValueAtTime(freq * 1.5, now + 3.0);

      const lfo = this.ctx!.createOscillator();
      const lfoGain = this.ctx!.createGain();
      lfo.type = 'sine';
      lfo.frequency.setValueAtTime(3 + Math.random() * 4, now);
      lfoGain.gain.setValueAtTime(0.03, now);
      lfo.connect(lfoGain);
      lfoGain.connect(gain.gain);

      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.04, now + 0.5);
      gain.gain.setValueAtTime(0.04, now + 1.5);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 3.0);

      osc.connect(gain);
      gain.connect(this.sfxVolume!);

      osc.start(now);
      lfo.start(now);
      osc.stop(now + 3.0);
      lfo.stop(now + 3.0);
    });

    const source = this.ctx.createBufferSource();
    source.buffer = this.noiseBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(150, now);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0, now);
    noiseGain.gain.linearRampToValueAtTime(0.2, now + 0.5);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 3.0);

    source.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(this.sfxVolume);

    source.start(now);
    source.stop(now + 3.0);
  }

  startMusic(dimension: 'overworld' | 'nether' | 'end' | 'menu'): void {
    if (!this.ctx || !this.musicVolume) return;

    this.stopMusic();
    this.musicPlaying = true;

    const scales: Record<string, number[]> = {
      overworld: [261.63, 293.66, 329.63, 392.00, 440.00],    // C4 pentatonic
      nether:   [130.81, 155.56, 174.61, 196.00, 233.08],     // C3 minor
      end:      [1046.5, 1174.7, 1318.5, 1480.0, 1661.2, 1864.7], // Whole tone, high
      menu:     [261.63, 293.66, 329.63, 349.23, 392.00, 440.00, 493.88], // C4 major
    };

    const waveTypes: Record<string, OscillatorType> = {
      overworld: 'sine',
      nether: 'sawtooth',
      end: 'triangle',
      menu: 'sine',
    };

    const intervals: Record<string, [number, number]> = {
      overworld: [2000, 4000],
      nether: [1000, 2500],
      end: [3000, 6000],
      menu: [1500, 3000],
    };

    const durations: Record<string, number> = {
      overworld: 1.5,
      nether: 1.0,
      end: 2.0,
      menu: 1.2,
    };

    const volumes: Record<string, number> = {
      overworld: 0.07,
      nether: 0.06,
      end: 0.05,
      menu: 0.08,
    };

    const scale = scales[dimension];
    const waveType = waveTypes[dimension];
    const [minInterval, maxInterval] = intervals[dimension];
    const noteDuration = durations[dimension];
    const volume = volumes[dimension];

    const playRandomNote = (): void => {
      if (!this.ctx || !this.musicVolume || !this.musicPlaying) return;

      const freq = scale[Math.floor(Math.random() * scale.length)];
      this.scheduleNote(freq, this.ctx.currentTime, noteDuration, waveType, this.musicVolume);

      if (Math.random() > 0.6) {
        const secondFreq = scale[Math.floor(Math.random() * scale.length)];
        this.scheduleNote(
          secondFreq,
          this.ctx.currentTime + 0.1,
          noteDuration * 0.8,
          waveType,
          this.musicVolume
        );
      }
    };

    playRandomNote();

    const scheduleNext = (): void => {
      if (!this.musicPlaying) return;
      const delay = minInterval + Math.random() * (maxInterval - minInterval);
      this.musicInterval = setTimeout(() => {
        playRandomNote();
        scheduleNext();
      }, delay);
    };

    scheduleNext();
  }

  stopMusic(): void {
    this.musicPlaying = false;
    if (this.musicInterval !== null) {
      clearTimeout(this.musicInterval);
      this.musicInterval = null;
    }
  }

  setMasterVolume(v: number): void {
    const clamped = Math.max(0, Math.min(1, v));
    if (this.masterVolume) {
      this.masterVolume.gain.setValueAtTime(clamped, this.ctx?.currentTime ?? 0);
    }
  }

  setSfxVolume(v: number): void {
    const clamped = Math.max(0, Math.min(1, v));
    if (this.sfxVolume) {
      this.sfxVolume.gain.setValueAtTime(clamped, this.ctx?.currentTime ?? 0);
    }
  }

  setMusicVolume(v: number): void {
    const clamped = Math.max(0, Math.min(1, v));
    if (this.musicVolume) {
      this.musicVolume.gain.setValueAtTime(clamped, this.ctx?.currentTime ?? 0);
    }
  }
}
