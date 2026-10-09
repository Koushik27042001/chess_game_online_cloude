let audioCtx;

function context() {
  if (!audioCtx) audioCtx = new AudioContext();
  if (audioCtx.state === "suspended") audioCtx.resume();
  return audioCtx;
}

function tone(freq, duration, type = "sine", volume = 0.06) {
  const ctx = context();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(volume, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + duration);
}

export function playMoveSound(move) {
  if (!move) return;
  const san = move.san || "";
  if (san.includes("#")) {
    tone(196, 0.18, "square", 0.07);
    setTimeout(() => tone(146, 0.28, "triangle", 0.06), 90);
    return;
  }
  if (san.includes("+")) {
    tone(620, 0.1, "triangle", 0.055);
    return;
  }
  if (move.captured || san.includes("x")) {
    tone(160, 0.09, "sawtooth", 0.045);
    return;
  }
  if (san === "O-O" || san === "O-O-O") {
    tone(360, 0.07, "sine", 0.05);
    setTimeout(() => tone(480, 0.08, "sine", 0.04), 70);
    return;
  }
  tone(440, 0.06, "sine", 0.045);
}
