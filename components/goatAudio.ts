// Web Audio API synthesizer for adorable & realistic goat bleats ("Bêêêê !")

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === "suspended") {
    audioCtx.resume();
  }
  return audioCtx;
}

export function playGoatBleat(category?: string) {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    // Pitch settings based on goat breed category
    let baseFreq = 260; // Alpine standard
    let bleatDuration = 0.9;
    let vibratoSpeed = 14;

    if (category === "Miniature") {
      baseFreq = 380; // higher-pitched baby/mini goat
      bleatDuration = 0.65;
      vibratoSpeed = 16;
    } else if (category === "Grimpeuse & Sauvage" || category === "Rustique") {
      baseFreq = 190; // deeper wild mountain ibex / markhor bleat
      bleatDuration = 1.1;
      vibratoSpeed = 11;
    }

    // Carrier Oscillator (sawtooth provides rich vocal harmonics for goat throat sound)
    const carrier = ctx.createOscillator();
    carrier.type = "sawtooth";
    carrier.frequency.setValueAtTime(baseFreq, now);
    carrier.frequency.exponentialRampToValueAtTime(baseFreq * 0.92, now + bleatDuration);

    // Vibrato LFO (gives the characteristic tremolo/fluttering "b-e-e-e-e-h" of goats)
    const vibrato = ctx.createOscillator();
    vibrato.type = "sine";
    vibrato.frequency.setValueAtTime(vibratoSpeed, now);

    const vibratoGain = ctx.createGain();
    vibratoGain.gain.setValueAtTime(baseFreq * 0.12, now);
    vibrato.connect(vibratoGain);
    vibratoGain.connect(carrier.frequency);

    // Formant BPF Filters (simulates goat vocal tract resonance)
    const formantFilter1 = ctx.createBiquadFilter();
    formantFilter1.type = "bandpass";
    formantFilter1.frequency.setValueAtTime(750, now);
    formantFilter1.Q.setValueAtTime(3.5, now);

    const formantFilter2 = ctx.createBiquadFilter();
    formantFilter2.type = "bandpass";
    formantFilter2.frequency.setValueAtTime(1450, now);
    formantFilter2.Q.setValueAtTime(2.8, now);

    // Master Envelope
    const gainNode = ctx.createGain();
    gainNode.gain.setValueAtTime(0.001, now);
    gainNode.gain.linearRampToValueAtTime(0.35, now + 0.08); // quick attack "B-"
    gainNode.gain.setValueAtTime(0.3, now + bleatDuration * 0.6);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + bleatDuration); // soft release

    // Connect nodes
    carrier.connect(formantFilter1);
    carrier.connect(formantFilter2);

    formantFilter1.connect(gainNode);
    formantFilter2.connect(gainNode);

    gainNode.connect(ctx.destination);

    // Trigger sound
    vibrato.start(now);
    carrier.start(now);

    vibrato.stop(now + bleatDuration);
    carrier.stop(now + bleatDuration);
  } catch (err) {
    console.warn("Audio playback not supported or blocked by autoplay policy", err);
  }
}
