import { useEffect, useRef, useState, useCallback } from 'react';

// Lightweight Web Audio sound effects — no asset files, all synthesized.
// Keeps the bundle tiny and works offline. Sound is ON by default; a user can
// mute via the toggle. The tick is a crisp click, the thud a deep bass stop,
// and win() a bright major-chord arpeggio for a premium reward cue.
export function useSpinSound() {
  const ctxRef = useRef(null);
  const [muted, setMuted] = useState(false);

  const ctx = useCallback(() => {
    if (typeof window === 'undefined') return null;
    if (!ctxRef.current) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (AC) ctxRef.current = new AC();
    }
    if (ctxRef.current && ctxRef.current.state === 'suspended') {
      ctxRef.current.resume().catch(() => {});
    }
    return ctxRef.current;
  }, []);

  const tick = useCallback(() => {
    if (muted) return;
    const ac = ctx();
    if (!ac) return;
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(1400, ac.currentTime);
    osc.frequency.exponentialRampToValueAtTime(900, ac.currentTime + 0.04);
    gain.gain.setValueAtTime(0.05, ac.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + 0.05);
    osc.connect(gain).connect(ac.destination);
    osc.start();
    osc.stop(ac.currentTime + 0.06);
  }, [ctx, muted]);

  const thud = useCallback(() => {
    if (muted) return;
    const ac = ctx();
    if (!ac) return;
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(180, ac.currentTime);
    osc.frequency.exponentialRampToValueAtTime(70, ac.currentTime + 0.28);
    gain.gain.setValueAtTime(0.2, ac.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + 0.32);
    osc.connect(gain).connect(ac.destination);
    osc.start();
    osc.stop(ac.currentTime + 0.34);
  }, [ctx, muted]);

  const win = useCallback(() => {
    if (muted) return;
    const ac = ctx();
    if (!ac) return;
    const notes = [523.25, 659.25, 783.99, 1046.5, 1318.5];
    notes.forEach((f, i) => {
      const osc = ac.createOscillator();
      const gain = ac.createGain();
      osc.type = 'triangle';
      osc.frequency.value = f;
      const t = ac.currentTime + i * 0.1;
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(0.2, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.6);
      osc.connect(gain).connect(ac.destination);
      osc.start(t);
      osc.stop(t + 0.65);
    });
  }, [ctx, muted]);

  // Backwards-compatible alias.
  const chime = win;

  useEffect(() => () => { if (ctxRef.current) ctxRef.current.close().catch(() => {}); }, []);

  return { tick, chime, thud, win, muted, setMuted, toggleMute: () => setMuted((m) => !m) };
}