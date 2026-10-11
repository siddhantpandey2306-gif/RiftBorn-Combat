// RIFTBORN Sound Engine
// Procedural Web Audio API sound synthesizer - zero external asset dependencies, zero 404s, works offline

class SoundEngine {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.sfxGain = null;
    this.musicGain = null;
    
    this.sfxVolume = 0.8;
    this.musicVolume = 0.5;
    this.isMuted = false;

    this.musicInterval = null;
    this.currentTrack = null;
    this.musicNodes = [];
    this.isInitialized = false;
  }

  init() {
    if (this.isInitialized) return;
    try {
      if (typeof window === 'undefined') return;
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      this.ctx = new AudioContext();

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(1.0, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.setValueAtTime(this.sfxVolume, this.ctx.currentTime);
      this.sfxGain.connect(this.masterGain);

      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.setValueAtTime(this.musicVolume, this.ctx.currentTime);
      this.musicGain.connect(this.masterGain);

      this.isInitialized = true;
    } catch (e) {
      console.warn('Web Audio not supported or blocked:', e);
    }
  }

  ensureContext() {
    if (!this.isInitialized) this.init();
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  setSfxVolume(v) {
    this.sfxVolume = Math.max(0, Math.min(1, v));
    if (this.sfxGain && this.ctx) {
      this.sfxGain.gain.setValueAtTime(this.isMuted ? 0 : this.sfxVolume, this.ctx.currentTime);
    }
  }

  setMusicVolume(v) {
    this.musicVolume = Math.max(0, Math.min(1, v));
    if (this.musicGain && this.ctx) {
      this.musicGain.gain.setValueAtTime(this.isMuted ? 0 : this.musicVolume, this.ctx.currentTime);
    }
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 1.0, this.ctx.currentTime);
    }
    return this.isMuted;
  }

  // --- UI SOUNDS ---
  playUiHover() {
    this.ensureContext();
    if (!this.ctx || this.isMuted) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const now = this.ctx.currentTime;

    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.exponentialRampToValueAtTime(1200, now + 0.04);

    gain.gain.setValueAtTime(0.04, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.04);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.05);
  }

  playUiClick() {
    this.ensureContext();
    if (!this.ctx || this.isMuted) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const now = this.ctx.currentTime;

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(450, now);
    osc.frequency.exponentialRampToValueAtTime(900, now + 0.06);

    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.09);
  }

  // --- COMBAT IMPACTS & ATTACKS ---
  playAttackLight(charId = 'vex') {
    if (charId === 'solaris') {
      this.playBluntImpact(false);
    } else {
      this.playSlash(false, 0);
    }
  }

  playAttackHeavy(charId = 'vex') {
    if (charId === 'solaris') {
      this.playBluntImpact(true);
    } else {
      this.playSlash(true, 1);
    }
  }

  playSlash(isHeavy = false, comboIndex = 0) {
    this.ensureContext();
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;
    const duration = isHeavy ? 0.22 : 0.12;
    const pitchMod = 1.0 + Math.min(0.35, comboIndex * 0.07);

    // Filtered noise swoosh
    const bufferSize = Math.floor(this.ctx.sampleRate * duration);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime((isHeavy ? 1200 : 2200) * pitchMod, now);
    filter.frequency.exponentialRampToValueAtTime((isHeavy ? 300 : 700) * pitchMod, now + duration);
    filter.Q.setValueAtTime(3, now);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(isHeavy ? 0.25 : 0.16, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    noise.start(now);
    noise.stop(now + duration);

    // Resonant blade chime
    const tone = this.ctx.createOscillator();
    const toneGain = this.ctx.createGain();
    tone.type = 'sawtooth';
    tone.frequency.setValueAtTime((isHeavy ? 280 : 540) * pitchMod, now);
    tone.frequency.exponentialRampToValueAtTime((isHeavy ? 80 : 160) * pitchMod, now + duration);

    toneGain.gain.setValueAtTime(isHeavy ? 0.15 : 0.08, now);
    toneGain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    tone.connect(toneGain);
    toneGain.connect(this.sfxGain);

    tone.start(now);
    tone.stop(now + duration);
  }

  playBluntImpact(isHeavy = false) {
    this.ensureContext();
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;
    const duration = isHeavy ? 0.35 : 0.18;

    // Sub thump
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(isHeavy ? 130 : 180, now);
    osc.frequency.exponentialRampToValueAtTime(35, now + duration);

    gain.gain.setValueAtTime(isHeavy ? 0.45 : 0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + duration);

    // Crunch transient
    const bufferSize = Math.floor(this.ctx.sampleRate * 0.06);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.2));
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    const nGain = this.ctx.createGain();
    nGain.gain.setValueAtTime(isHeavy ? 0.35 : 0.2, now);
    noise.connect(nGain);
    nGain.connect(this.sfxGain);
    noise.start(now);
  }

  playBlock() {
    this.ensureContext();
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;

    // 1. High metallic impact click transient
    const click = this.ctx.createOscillator();
    const clickGain = this.ctx.createGain();
    click.type = 'triangle';
    click.frequency.setValueAtTime(2600, now);
    click.frequency.exponentialRampToValueAtTime(800, now + 0.04);
    clickGain.gain.setValueAtTime(0.28, now);
    clickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
    click.connect(clickGain);
    clickGain.connect(this.sfxGain);
    click.start(now);
    click.stop(now + 0.05);

    // 2. Resonant metallic barrier chime
    const ring = this.ctx.createOscillator();
    const ringFilter = this.ctx.createBiquadFilter();
    const ringGain = this.ctx.createGain();
    ring.type = 'sawtooth';
    ring.frequency.setValueAtTime(920, now);
    ringFilter.type = 'bandpass';
    ringFilter.frequency.setValueAtTime(1600, now);
    ringFilter.Q.setValueAtTime(8, now);
    ringGain.gain.setValueAtTime(0.22, now);
    ringGain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
    ring.connect(ringFilter);
    ringFilter.connect(ringGain);
    ringGain.connect(this.sfxGain);
    ring.start(now);
    ring.stop(now + 0.18);

    // 3. Low energy barrier thud
    const sub = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();
    sub.type = 'sine';
    sub.frequency.setValueAtTime(170, now);
    sub.frequency.exponentialRampToValueAtTime(55, now + 0.12);
    subGain.gain.setValueAtTime(0.25, now);
    subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.13);
    sub.connect(subGain);
    subGain.connect(this.sfxGain);
    sub.start(now);
    sub.stop(now + 0.14);
  }

  playComboHit(count = 1) {
    this.ensureContext();
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const pitch = 380 + Math.min(600, count * 35);
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(pitch, now);
    osc.frequency.exponentialRampToValueAtTime(pitch * 1.25, now + 0.05);
    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.07);
  }

  playCancelFlash() {
    this.ensureContext();
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1100, now);
    osc.frequency.exponentialRampToValueAtTime(1760, now + 0.05);
    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.06);
  }

  playParry() {
    this.ensureContext();
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;

    // High crystal chime
    [1200, 1800, 2400].forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.02);

      gain.gain.setValueAtTime(0.2, now + idx * 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(now + idx * 0.02);
      osc.stop(now + 0.45);
    });
  }

  playCritHit() {
    this.ensureContext();
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;

    // Crunchy impact thud
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(320, now);
    osc.frequency.exponentialRampToValueAtTime(45, now + 0.16);
    gain.gain.setValueAtTime(0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.2);

    // Golden sparkle ping
    const ping = this.ctx.createOscillator();
    const pingGain = this.ctx.createGain();
    ping.type = 'sine';
    ping.frequency.setValueAtTime(1600, now);
    ping.frequency.exponentialRampToValueAtTime(2400, now + 0.14);
    pingGain.gain.setValueAtTime(0.18, now);
    pingGain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
    ping.connect(pingGain);
    pingGain.connect(this.sfxGain);
    ping.start(now);
    ping.stop(now + 0.16);
  }

  playVictoryFanfare() {
    this.ensureContext();
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6 triumphant chord arpeggio
    notes.forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + i * 0.08);
      gain.gain.setValueAtTime(0.18, now + i * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.5);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now + i * 0.08);
      osc.stop(now + i * 0.08 + 0.55);
    });
  }

  playPerfectDodge() {
    this.ensureContext();
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;

    // Matrix slow-down time warp sweep
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(1400, now);
    osc.frequency.exponentialRampToValueAtTime(120, now + 0.45);

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.55);

    // Resonant pulse
    const sub = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();
    sub.type = 'triangle';
    sub.frequency.setValueAtTime(90, now);
    sub.frequency.exponentialRampToValueAtTime(40, now + 0.5);
    subGain.gain.setValueAtTime(0.25, now);
    subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

    sub.connect(subGain);
    subGain.connect(this.sfxGain);
    sub.start(now);
    sub.stop(now + 0.55);
  }

  playSpecial(charId, abilityIdx) {
    this.ensureContext();
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;

    // Character unique audio signatures
    switch (charId) {
      case 'vex': {
        // High plasma surge + sharp blade release
        this.playSlash(true);
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.linearRampToValueAtTime(880, now + 0.2);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(now);
        osc.stop(now + 0.26);
        break;
      }
      case 'solaris': {
        // Massive seismic ground blast
        this.playBluntImpact(true);
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(90, now);
        osc.frequency.exponentialRampToValueAtTime(25, now + 0.6);
        gain.gain.setValueAtTime(0.4, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(now);
        osc.stop(now + 0.65);
        break;
      }
      case 'lyra': {
        // High speed phantom warp + blade shimmer
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1600, now);
        osc.frequency.exponentialRampToValueAtTime(320, now + 0.15);
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(now);
        osc.stop(now + 0.2);
        setTimeout(() => this.playSlash(false), 80);
        break;
      }
      case 'aeron': {
        // Kinetic hum + staff twirl
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(300, now);
        osc.frequency.linearRampToValueAtTime(650, now + 0.15);
        osc.frequency.linearRampToValueAtTime(220, now + 0.3);
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(now);
        osc.stop(now + 0.36);
        break;
      }
      case 'kairo': {
        // Chain whip snap
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(800, now);
        osc.frequency.exponentialRampToValueAtTime(150, now + 0.18);
        gain.gain.setValueAtTime(0.22, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(now);
        osc.stop(now + 0.22);
        break;
      }
      case 'nox': {
        // Void portal tear (eerie pitch drop)
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, now);
        osc.frequency.exponentialRampToValueAtTime(80, now + 0.35);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(now);
        osc.stop(now + 0.45);
        break;
      }
      default:
        this.playSlash(true);
    }
  }

  playUltimate(charId) {
    this.ensureContext();
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;

    // Siren / Power Surge Riser
    const riser = this.ctx.createOscillator();
    const rGain = this.ctx.createGain();
    riser.type = 'sawtooth';
    riser.frequency.setValueAtTime(150, now);
    riser.frequency.exponentialRampToValueAtTime(900, now + 0.6);

    rGain.gain.setValueAtTime(0.3, now);
    rGain.gain.exponentialRampToValueAtTime(0.01, now + 0.6);

    riser.connect(rGain);
    rGain.connect(this.sfxGain);
    riser.start(now);
    riser.stop(now + 0.65);

    // Massive Sub Impact at 0.6s
    setTimeout(() => {
      if (!this.ctx || this.isMuted) return;
      const subNow = this.ctx.currentTime;
      const sub = this.ctx.createOscillator();
      const sGain = this.ctx.createGain();
      sub.type = 'sine';
      sub.frequency.setValueAtTime(110, subNow);
      sub.frequency.exponentialRampToValueAtTime(25, subNow + 1.0);

      sGain.gain.setValueAtTime(0.6, subNow);
      sGain.gain.exponentialRampToValueAtTime(0.0001, subNow + 1.2);

      sub.connect(sGain);
      sGain.connect(this.sfxGain);
      sub.start(subNow);
      sub.stop(subNow + 1.3);
    }, 550);
  }

  playFinisherKO() {
    this.ensureContext();
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;

    // Colossal bass drop
    const sub = this.ctx.createOscillator();
    const sGain = this.ctx.createGain();
    sub.type = 'sine';
    sub.frequency.setValueAtTime(140, now);
    sub.frequency.exponentialRampToValueAtTime(20, now + 1.6);
    sGain.gain.setValueAtTime(0.7, now);
    sGain.gain.exponentialRampToValueAtTime(0.0001, now + 1.8);
    sub.connect(sGain);
    sGain.connect(this.sfxGain);
    sub.start(now);
    sub.stop(now + 1.9);

    // Triumphant chord fanfare
    [220, 277, 330, 440].forEach((freq, idx) => {
      const chord = this.ctx.createOscillator();
      const cGain = this.ctx.createGain();
      chord.type = 'sawtooth';
      chord.frequency.setValueAtTime(freq, now + 0.1);
      cGain.gain.setValueAtTime(0.12, now + 0.1);
      cGain.gain.exponentialRampToValueAtTime(0.001, now + 2.0);

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(2000, now);

      chord.connect(filter);
      filter.connect(cGain);
      cGain.connect(this.sfxGain);
      chord.start(now + 0.1);
      chord.stop(now + 2.1);
    });
  }

  // --- PROCEDURAL BGM ENGINE ---
  startArenaMusic(arenaId) {
    this.stopMusic();
    this.ensureContext();
    if (!this.ctx) return;
    this.currentTrack = arenaId;

    // Track tempos and chords
    const trackConfigs = {
      neon_metro: { bpm: 124, bassNotes: [55, 55, 65, 73, 55, 55, 65, 82], rootFreq: 110 },
      ancient_rift: { bpm: 116, bassNotes: [44, 44, 52, 58, 44, 44, 52, 65], rootFreq: 87.3 },
      solar_temple: { bpm: 128, bassNotes: [65, 65, 82, 98, 65, 65, 82, 110], rootFreq: 130.8 },
      frozen_core: { bpm: 112, bassNotes: [49, 49, 58, 73, 49, 49, 58, 65], rootFreq: 98 },
      void_arena: { bpm: 120, bassNotes: [41, 41, 49, 55, 41, 41, 49, 61], rootFreq: 82.4 },
      rooftop_city: { bpm: 122, bassNotes: [55, 55, 69, 82, 55, 55, 69, 92], rootFreq: 110 }
    };

    const config = trackConfigs[arenaId] || trackConfigs.neon_metro;
    const beatInterval = (60 / config.bpm) * 1000;
    let step = 0;

    this.musicInterval = setInterval(() => {
      if (this.isMuted || !this.ctx || this.ctx.state !== 'running') return;
      const now = this.ctx.currentTime;
      const noteIdx = step % config.bassNotes.length;
      const baseFreq = config.bassNotes[noteIdx];

      // Kick on beats 0, 4 (or every 2 steps in 8-step loop)
      if (step % 2 === 0) {
        const kickOsc = this.ctx.createOscillator();
        const kickGain = this.ctx.createGain();
        kickOsc.type = 'sine';
        kickOsc.frequency.setValueAtTime(110, now);
        kickOsc.frequency.exponentialRampToValueAtTime(35, now + 0.12);
        kickGain.gain.setValueAtTime(0.3, now);
        kickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
        kickOsc.connect(kickGain);
        kickGain.connect(this.musicGain);
        kickOsc.start(now);
        kickOsc.stop(now + 0.15);
      }

      // Hi-hat on offbeats
      if (step % 2 === 1) {
        const buf = this.ctx.createBuffer(1, Math.floor(this.ctx.sampleRate * 0.04), this.ctx.sampleRate);
        const data = buf.getChannelData(0);
        for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
        const hat = this.ctx.createBufferSource();
        hat.buffer = buf;
        const hFilter = this.ctx.createBiquadFilter();
        hFilter.type = 'highpass';
        hFilter.frequency.setValueAtTime(7000, now);
        const hGain = this.ctx.createGain();
        hGain.gain.setValueAtTime(0.06, now);
        hGain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
        hat.connect(hFilter);
        hFilter.connect(hGain);
        hGain.connect(this.musicGain);
        hat.start(now);
      }

      // Synth Bassline Pulse
      const bassOsc = this.ctx.createOscillator();
      const bFilter = this.ctx.createBiquadFilter();
      const bGain = this.ctx.createGain();

      bassOsc.type = 'sawtooth';
      bassOsc.frequency.setValueAtTime(baseFreq * 1.5, now);

      bFilter.type = 'lowpass';
      bFilter.frequency.setValueAtTime(650, now);
      bFilter.frequency.exponentialRampToValueAtTime(180, now + 0.2);

      bGain.gain.setValueAtTime(0.18, now);
      bGain.gain.exponentialRampToValueAtTime(0.001, now + (beatInterval / 1000) * 0.85);

      bassOsc.connect(bFilter);
      bFilter.connect(bGain);
      bGain.connect(this.musicGain);

      bassOsc.start(now);
      bassOsc.stop(now + (beatInterval / 1000) * 0.9);

      // Atmospheric melodic arp on every 4th step
      if (step % 4 === 2) {
        const arpOsc = this.ctx.createOscillator();
        const aGain = this.ctx.createGain();
        arpOsc.type = 'sine';
        arpOsc.frequency.setValueAtTime(config.rootFreq * 4, now);
        arpOsc.frequency.exponentialRampToValueAtTime(config.rootFreq * 6, now + 0.25);
        aGain.gain.setValueAtTime(0.08, now);
        aGain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
        arpOsc.connect(aGain);
        aGain.connect(this.musicGain);
        arpOsc.start(now);
        arpOsc.stop(now + 0.32);
      }

      step++;
    }, beatInterval / 2);
  }

  stopMusic() {
    if (this.musicInterval) {
      clearInterval(this.musicInterval);
      this.musicInterval = null;
    }
    this.currentTrack = null;
  }
}

export const soundEngine = new SoundEngine();
