/**
 * Audio Tones and Web Audio DSP
 * Implements real DTMF telephony tones, hold music synthesis, and Voice Focus DSP
 */

// DTMF standard frequencies
const DTMF_FREQS: Record<string, [number, number]> = {
  '1': [697, 1209],
  '2': [697, 1336],
  '3': [697, 1477],
  '4': [770, 1209],
  '5': [770, 1336],
  '6': [770, 1477],
  '7': [852, 1209],
  '8': [852, 1336],
  '9': [852, 1477],
  '*': [941, 1209],
  '0': [941, 1336],
  '#': [941, 1477],
};

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    audioCtx = new AudioContextClass();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

/**
 * Play a standard dual-tone multi-frequency (DTMF) dial tone
 */
export function playDTMFTone(digit: string, durationMs = 180): void {
  const freqs = DTMF_FREQS[digit];
  if (!freqs) return;

  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    const durSec = durationMs / 1000;

    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(freqs[0], now);

    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(freqs[1], now);

    // Smooth envelope to prevent audio clicking
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(0.15, now + 0.015);
    gainNode.gain.setValueAtTime(0.15, now + durSec - 0.02);
    gainNode.gain.linearRampToValueAtTime(0, now + durSec);

    osc1.connect(gainNode);
    osc2.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + durSec);
    osc2.stop(now + durSec);
  } catch (err) {
    console.warn('Web Audio DTMF unavailable:', err);
  }
}

/**
 * Play a gentle ringback tone (North American standard: 440Hz + 480Hz)
 */
export function playRingbackBeep(): void {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(440, now);
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(480, now);

    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(0.08, now + 0.05);
    gainNode.gain.setValueAtTime(0.08, now + 0.8);
    gainNode.gain.linearRampToValueAtTime(0, now + 0.9);

    osc1.connect(gainNode);
    osc2.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.9);
    osc2.stop(now + 0.9);
  } catch (err) {
    console.warn('Ringback tone failed', err);
  }
}

/**
 * Enterprise Banking Hold Music Generator
 * Synthesizes a soothing, professional harmonic chime progression
 */
let holdMusicInterval: number | null = null;

export function startHoldMusic(): void {
  stopHoldMusic();
  const chords: number[][] = [
    [523.25, 659.25, 783.99], // C Major (C5, E5, G5)
    [440.0, 523.25, 659.25],  // A Minor (A4, C5, E5)
    [349.23, 440.0, 523.25],  // F Major (F4, A4, C5)
    [392.0, 493.88, 587.33],  // G Major (G4, B4, D5)
  ];
  let step = 0;

  const playChordStep = () => {
    try {
      const ctx = getAudioContext();
      const now = ctx.currentTime;
      const notes = chords[step % chords.length];
      step++;

      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.15);

        gain.gain.setValueAtTime(0, now + idx * 0.15);
        gain.gain.linearRampToValueAtTime(0.04, now + idx * 0.15 + 0.08);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.15 + 1.8);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + idx * 0.15);
        osc.stop(now + idx * 0.15 + 2.0);
      });
    } catch {
      // Audio might be blocked
    }
  };

  playChordStep();
  holdMusicInterval = window.setInterval(playChordStep, 2400);
}

export function stopHoldMusic(): void {
  if (holdMusicInterval) {
    clearInterval(holdMusicInterval);
    holdMusicInterval = null;
  }
}

/**
 * Microphone Audio Visualizer / Level Meter
 */
export function createMicrophoneMeter(
  stream: MediaStream,
  onLevel: (level: number) => void
): { stop: () => void } {
  try {
    const ctx = getAudioContext();
    const source = ctx.createMediaStreamSource(stream);
    const analyzer = ctx.createAnalyser();
    analyzer.fftSize = 256;
    source.connect(analyzer);

    const dataArray = new Uint8Array(analyzer.frequencyBinCount);
    let animId: number;

    const tick = () => {
      analyzer.getByteFrequencyData(dataArray);
      let sum = 0;
      for (let i = 0; i < dataArray.length; i++) {
        sum += dataArray[i];
      }
      const average = sum / dataArray.length;
      // Normalize to 0-100 range with sensitivity boost
      const level = Math.min(100, Math.round((average / 128) * 100));
      onLevel(level);
      animId = requestAnimationFrame(tick);
    };

    tick();

    return {
      stop: () => {
        cancelAnimationFrame(animId);
        source.disconnect();
      },
    };
  } catch (err) {
    console.warn('Microphone analyzer error:', err);
    return { stop: () => {} };
  }
}
