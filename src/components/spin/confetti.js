import confetti from 'canvas-confetti';

// A refined, brand-coloured burst — burgundy, gold and cream — rather than the
// default rainbow. Fires from both sides for a fuller celebration.
export function celebrateWin() {
  const colors = ['#8C193C', '#E8B84B', '#FAF7F0', '#6E1228'];
  const opts = { colors, spread: 70, startVelocity: 45, scalar: 1.1, ticks: 180, gravity: 0.9 };
  confetti({ ...opts, particleCount: 80, origin: { x: 0.15, y: 0.65 }, angle: 60 });
  confetti({ ...opts, particleCount: 80, origin: { x: 0.85, y: 0.65 }, angle: 120 });
  setTimeout(() => confetti({ ...opts, particleCount: 50, origin: { x: 0.5, y: 0.5 }, angle: 90 }), 180);
}