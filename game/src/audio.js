// Tiny synthesised sound for Night Wren — no audio files, everything is made
// with the Web Audio API at run time: soft footsteps, a pebble tick, a pickup
// chime, an alarm sting and a getaway arpeggio. Silent until the first input.

export function createAudio() {
  let ctx = null;
  let muted = false;
  let drone = null;

  function ensure() {
    if (!ctx) {
      try {
        const AC = window.AudioContext || window.webkitAudioContext;
        ctx = new AC();
      } catch (err) {
        ctx = null;
      }
    }
    if (ctx && ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  function tone(freq, dur, type, vol, when = 0, slideTo = null) {
    const ac = ensure();
    if (!ac || muted) return;
    const t0 = ac.currentTime + when;
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(vol, t0 + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(gain);
    gain.connect(ac.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.05);
  }

  return {
    unlock() {
      ensure();
    },
    toggleMute() {
      muted = !muted;
      return muted;
    },
    isMuted() {
      return muted;
    },
    footstep(run) {
      tone(run ? 140 : 110, 0.07, 'triangle', run ? 0.10 : 0.05);
    },
    pebble() {
      tone(1250, 0.06, 'square', 0.06);
      tone(900, 0.08, 'square', 0.05, 0.07);
    },
    pickup() {
      tone(660, 0.12, 'sine', 0.12);
      tone(990, 0.16, 'sine', 0.12, 0.09);
    },
    opal() {
      [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.22, 'sine', 0.12, i * 0.09));
    },
    suspicious() {
      tone(330, 0.18, 'sawtooth', 0.07, 0, 262);
    },
    alarm() {
      tone(196, 0.22, 'sawtooth', 0.14, 0, 392);
      tone(392, 0.22, 'sawtooth', 0.14, 0.22, 196);
      tone(196, 0.3, 'sawtooth', 0.14, 0.44, 392);
    },
    caught() {
      tone(220, 0.5, 'sawtooth', 0.16, 0, 55);
    },
    victory() {
      [523, 659, 784, 1047, 1319].forEach((f, i) => tone(f, 0.3, 'triangle', 0.12, i * 0.11));
    },
    locked() {
      tone(180, 0.1, 'square', 0.08);
      tone(140, 0.12, 'square', 0.08, 0.11);
    },
    startDrone() {
      const ac = ensure();
      if (!ac || muted || drone) return;
      const osc = ac.createOscillator();
      const gain = ac.createGain();
      osc.type = 'sine';
      osc.frequency.value = 55;
      gain.gain.value = 0.035;
      const lfo = ac.createOscillator();
      const lfoGain = ac.createGain();
      lfo.frequency.value = 0.11;
      lfoGain.gain.value = 0.015;
      lfo.connect(lfoGain);
      lfoGain.connect(gain.gain);
      osc.connect(gain);
      gain.connect(ac.destination);
      osc.start();
      lfo.start();
      drone = { osc, lfo };
    },
  };
}
