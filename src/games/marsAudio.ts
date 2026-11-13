/**
 * Game sound, generated live with the Web Audio API (no audio files): Martian wind from
 * filtered noise, and an electric motor hum that rises with the rover's speed.
 * Browsers only allow audio after the player interacts, so call `start()` from a key or tap.
 */
export interface MarsAudio {
  start(): void;
  setDrive(speed01: number): void;
  setStorm(storm01: number): void;
  setMuted(muted: boolean): void;
  dispose(): void;
}

export function createMarsAudio(): MarsAudio {
  const AC =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AC) {
    const noop = () => {};
    return { start: noop, setDrive: noop, setStorm: noop, setMuted: noop, dispose: noop };
  }
  let ctx: AudioContext | null = null;
  let master: GainNode;
  let windGain: GainNode;
  let windFilter: BiquadFilterNode;
  let motorGain: GainNode;
  let motorOsc: OscillatorNode;
  let muted = false;
  let storm = 0;

  const build = () => {
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = muted ? 0 : 0.6;
    master.connect(ctx.destination);

    // Wind: looping brown-ish noise through a slowly wandering band-pass filter.
    const length = ctx.sampleRate * 3;
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let last = 0;
    for (let i = 0; i < length; i++) {
      last = (last + 0.02 * (Math.random() * 2 - 1)) / 1.02;
      data[i] = last * 3.5;
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;
    windFilter = ctx.createBiquadFilter();
    windFilter.type = 'bandpass';
    windFilter.frequency.value = 400;
    windFilter.Q.value = 0.7;
    windGain = ctx.createGain();
    windGain.gain.value = 0.25;
    noise.connect(windFilter).connect(windGain).connect(master);
    noise.start();
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.08;
    const lfoDepth = ctx.createGain();
    lfoDepth.gain.value = 180;
    lfo.connect(lfoDepth).connect(windFilter.frequency);
    lfo.start();

    // Motor: low saw wave, softened, louder and higher with speed.
    motorOsc = ctx.createOscillator();
    motorOsc.type = 'sawtooth';
    motorOsc.frequency.value = 55;
    const motorFilter = ctx.createBiquadFilter();
    motorFilter.type = 'lowpass';
    motorFilter.frequency.value = 380;
    motorGain = ctx.createGain();
    motorGain.gain.value = 0;
    motorOsc.connect(motorFilter).connect(motorGain).connect(master);
    motorOsc.start();
  };

  return {
    start() {
      if (!ctx) build();
      if (ctx?.state === 'suspended') void ctx.resume();
    },
    setDrive(speed01) {
      if (!ctx) return;
      const now = ctx.currentTime;
      motorGain.gain.setTargetAtTime(speed01 * 0.07, now, 0.15);
      motorOsc.frequency.setTargetAtTime(55 + speed01 * 45, now, 0.2);
    },
    setStorm(storm01) {
      if (!ctx || Math.abs(storm01 - storm) < 0.02) return;
      storm = storm01;
      const now = ctx.currentTime;
      windGain.gain.setTargetAtTime(0.25 + storm01 * 0.6, now, 0.5);
      windFilter.Q.setTargetAtTime(0.7 - storm01 * 0.4, now, 0.5);
    },
    setMuted(m) {
      muted = m;
      if (ctx) master.gain.setTargetAtTime(m ? 0 : 0.6, ctx.currentTime, 0.05);
    },
    dispose() {
      void ctx?.close();
      ctx = null;
    },
  };
}
