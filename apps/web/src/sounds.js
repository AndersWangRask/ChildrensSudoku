// Web Audio API sound effects — no audio files needed
let audioCtx = null;

function getAudioContext() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  return audioCtx;
}

function playTone(frequency, duration, type = 'sine', volume = 0.3) {
  const ctx = getAudioContext();
  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();

  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);
  gain.gain.setValueAtTime(volume, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);

  oscillator.connect(gain);
  gain.connect(ctx.destination);
  oscillator.start();
  oscillator.stop(ctx.currentTime + duration);
}

export function playCorrectSound() {
  // Cheerful ascending two-note chime
  playTone(523, 0.15, 'sine', 0.25); // C5
  setTimeout(() => playTone(659, 0.2, 'sine', 0.25), 100); // E5
}

export function playWrongSound() {
  // Low buzz
  playTone(200, 0.3, 'square', 0.15);
}

export function playSectionCompleteSound() {
  // Quick ascending arpeggio
  playTone(523, 0.12, 'sine', 0.2);  // C5
  setTimeout(() => playTone(659, 0.12, 'sine', 0.2), 80);  // E5
  setTimeout(() => playTone(784, 0.2, 'sine', 0.2), 160);   // G5
}

export function playPuzzleCompleteSound() {
  // Triumphant fanfare
  const notes = [523, 659, 784, 880, 1047]; // C5 E5 G5 A5 C6
  notes.forEach((freq, i) => {
    setTimeout(() => playTone(freq, 0.25, 'sine', 0.25), i * 120);
  });
}
