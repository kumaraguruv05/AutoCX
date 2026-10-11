// Web Audio API engine throttle rev sound synthesizer (zero external dependencies)
let audioCtx: AudioContext | null = null;

export const playRevSound = () => {
  try {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;

    if (!audioCtx || audioCtx.state === 'closed') {
      audioCtx = new AudioContextClass();
    }

    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }

    const now = audioCtx.currentTime;

    // 1. Primary engine cylinder pulses (Sawtooth wave for rich mechanical harmonics)
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    const filter = audioCtx.createBiquadFilter();

    osc.type = 'sawtooth';

    // Pitch sweep: idle (~95Hz) -> throttle burst to redline (~440Hz / high RPM) -> deceleration (~110Hz)
    osc.frequency.setValueAtTime(95, now);
    osc.frequency.exponentialRampToValueAtTime(450, now + 0.32);
    osc.frequency.exponentialRampToValueAtTime(390, now + 0.55);
    osc.frequency.exponentialRampToValueAtTime(120, now + 1.15);

    // Filter to simulate exhaust manifold resonance
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(450, now);
    filter.frequency.linearRampToValueAtTime(1600, now + 0.32);
    filter.frequency.exponentialRampToValueAtTime(500, now + 1.15);
    filter.Q.setValueAtTime(3, now);

    // Volume envelope
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.15, now + 0.08);
    gain.gain.linearRampToValueAtTime(0.18, now + 0.32);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 1.15);
    gain.gain.linearRampToValueAtTime(0.0, now + 1.25);

    // 2. Secondary sub-bass rumble (Sine oscillator) for physical exhaust punch
    const subOsc = audioCtx.createOscillator();
    const subGain = audioCtx.createGain();

    subOsc.type = 'triangle';
    subOsc.frequency.setValueAtTime(50, now);
    subOsc.frequency.linearRampToValueAtTime(140, now + 0.32);
    subOsc.frequency.linearRampToValueAtTime(55, now + 1.15);

    subGain.gain.setValueAtTime(0.001, now);
    subGain.gain.linearRampToValueAtTime(0.2, now + 0.1);
    subGain.gain.exponentialRampToValueAtTime(0.01, now + 1.1);
    subGain.gain.linearRampToValueAtTime(0.0, now + 1.25);

    // Connect nodes
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(audioCtx.destination);

    subOsc.connect(subGain);
    subGain.connect(audioCtx.destination);

    // Start & stop oscillators
    osc.start(now);
    subOsc.start(now);

    osc.stop(now + 1.25);
    subOsc.stop(now + 1.25);
  } catch (e) {
    // Graceful fallback if Web Audio is blocked or not supported
    console.debug('AudioContext throttle sound skipped:', e);
  }
};
