/**
 * "Sound of the universe" for the full-screen solar system, generated live with the Web Audio
 * API (no audio files). Real space is silent: sound needs air. This is an artistic soundscape in
 * the style of NASA "sonifications", where spacecraft data (like the plasma waves Voyager and
 * Pioneer measured) is turned into sound:
 *   - a deep, slowly breathing drone (the "hum" of space),
 *   - soft filtered noise like the solar wind,
 *   - now and then a rising whistle, like plasma-wave recordings,
 *   - faint high shimmer for the stars.
 * Browsers only allow audio after a click, so call `start()` from a click handler.
 */
export interface SpaceAudio {
  start(): void;
  stop(): void;
  setMuted(muted: boolean): void;
  dispose(): void;
}

const LEVEL = 0.55;

export function createSpaceAudio(): SpaceAudio {
  const AC =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AC) {
    const noop = () => {};
    return { start: noop, stop: noop, setMuted: noop, dispose: noop };
  }
  let ctx: AudioContext | null = null;
  let master: GainNode;
  let muted = false;
  let playing = false;
  let whistleTimer = 0;

  const build = () => {
    const c = new AC();
    ctx = c;
    master = c.createGain();
    master.gain.value = 0;
    const comp = c.createDynamicsCompressor();
    master.connect(comp).connect(c.destination);

    // Simple echo/space: a feedback delay gives everything a huge, empty feel.
    const delay = c.createDelay(2);
    delay.delayTime.value = 0.9;
    const feedback = c.createGain();
    feedback.gain.value = 0.45;
    const wet = c.createGain();
    wet.gain.value = 0.5;
    const toFx = c.createGain();
    toFx.connect(delay).connect(feedback).connect(delay);
    delay.connect(wet).connect(master);

    // 1) Deep drone: a few detuned low sines, slowly swelling.
    const droneBus = c.createGain();
    droneBus.gain.value = 0.22;
    droneBus.connect(master);
    for (const [freq, detune] of [
      [55, 0],
      [55, 7],
      [82.4, -5],
      [110, 3],
    ]) {
      const o = c.createOscillator();
      o.type = 'sine';
      o.frequency.value = freq;
      o.detune.value = detune;
      const g = c.createGain();
      g.gain.value = 0.25;
      const lfo = c.createOscillator();
      lfo.frequency.value = 0.04 + Math.random() * 0.06;
      const lfoDepth = c.createGain();
      lfoDepth.gain.value = 0.18;
      lfo.connect(lfoDepth).connect(g.gain);
      o.connect(g).connect(droneBus);
      o.start();
      lfo.start();
    }

    // 2) Solar wind: looping brown noise through a slowly sweeping band-pass.
    const length = c.sampleRate * 4;
    const buffer = c.createBuffer(1, length, c.sampleRate);
    const data = buffer.getChannelData(0);
    let last = 0;
    for (let i = 0; i < length; i++) {
      last = (last + 0.02 * (Math.random() * 2 - 1)) / 1.02;
      data[i] = last * 3.5;
    }
    const noise = c.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;
    const windFilter = c.createBiquadFilter();
    windFilter.type = 'bandpass';
    windFilter.frequency.value = 300;
    windFilter.Q.value = 1.2;
    const windGain = c.createGain();
    windGain.gain.value = 0.12;
    noise.connect(windFilter).connect(windGain).connect(master);
    windGain.connect(toFx);
    noise.start();
    const sweep = c.createOscillator();
    sweep.frequency.value = 0.05;
    const sweepDepth = c.createGain();
    sweepDepth.gain.value = 200;
    sweep.connect(sweepDepth).connect(windFilter.frequency);
    sweep.start();

    // 3) Star shimmer: two very quiet high tones that wobble.
    for (const freq of [1318.5, 1975.5]) {
      const o = c.createOscillator();
      o.type = 'sine';
      o.frequency.value = freq;
      const g = c.createGain();
      g.gain.value = 0;
      const lfo = c.createOscillator();
      lfo.frequency.value = 0.1 + Math.random() * 0.1;
      const depth = c.createGain();
      depth.gain.value = 0.006;
      lfo.connect(depth).connect(g.gain);
      o.connect(g).connect(toFx);
      o.start();
      lfo.start();
    }

    // 4) Plasma-wave whistles every few seconds, with the echo.
    const whistle = () => {
      if (!ctx || !playing) return;
      const now = c.currentTime;
      const o = c.createOscillator();
      o.type = 'sine';
      const from = 400 + Math.random() * 500;
      const up = Math.random() < 0.7;
      o.frequency.setValueAtTime(from, now);
      o.frequency.exponentialRampToValueAtTime(up ? from * 2.4 : from * 0.45, now + 2.5);
      const g = c.createGain();
      g.gain.setValueAtTime(0, now);
      g.gain.linearRampToValueAtTime(0.035, now + 0.6);
      g.gain.exponentialRampToValueAtTime(0.0001, now + 2.6);
      o.connect(g);
      g.connect(master);
      g.connect(toFx);
      o.start(now);
      o.stop(now + 2.7);
      whistleTimer = window.setTimeout(whistle, 3500 + Math.random() * 5000);
    };
    return whistle;
  };

  let whistle: (() => void) | null = null;

  return {
    start() {
      if (!ctx) whistle = build();
      if (!ctx) return;
      if (ctx.state === 'suspended') void ctx.resume();
      playing = true;
      master.gain.cancelScheduledValues(ctx.currentTime);
      master.gain.setTargetAtTime(muted ? 0 : LEVEL, ctx.currentTime, 0.8);
      window.clearTimeout(whistleTimer);
      whistleTimer = window.setTimeout(() => whistle?.(), 2000);
    },
    stop() {
      playing = false;
      window.clearTimeout(whistleTimer);
      if (ctx) master.gain.setTargetAtTime(0, ctx.currentTime, 0.4);
    },
    setMuted(m) {
      muted = m;
      if (ctx && playing) master.gain.setTargetAtTime(m ? 0 : LEVEL, ctx.currentTime, 0.1);
    },
    dispose() {
      playing = false;
      window.clearTimeout(whistleTimer);
      void ctx?.close();
      ctx = null;
    },
  };
}
