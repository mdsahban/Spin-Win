import React, { useState, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import SpinWheel from './SpinWheel';
import { processSpin } from '@/api/spinApi';
import { Loader2, Volume2, VolumeX } from 'lucide-react';
import { useLang } from '@/lib/i18n';

// Drives the wheel animation and talks to the secure spin endpoint. The
// server decides the outcome; we only animate to the matching segment.
export default function WheelStage({ campaign, customer, onComplete, sound }) {
  const { t, lang } = useLang();
  const accent = campaign?.accent_color || '#E8B84B';
  const ink = campaign?.ink_color || '#FAF7F0';
  const primary = campaign?.primary_color || '#8C193C';
  const prizes = campaign?.prizes || [];
  const pick = (hi, en) => (lang === 'hi' ? (hi || en) : en);

  const [rotation, setRotation] = useState(0);
  const [transitionMs, setTransitionMs] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [error, setError] = useState('');
  const [remaining, setRemaining] = useState(customer?.remainingSpins ?? 0);
  const rotationRef = useRef(0);

  const seg = prizes.length ? 360 / prizes.length : 360;

  const spin = useCallback(async () => {
    if (spinning || remaining <= 0) return;
    setError('');
    setSpinning(true);
    try {
      const res = await processSpin(customer.customerId);
      if (res.status === 'limit_reached') {
        setRemaining(0);
        setError(res.reason === 'already_won' ? t('wheel.errWon') : t('wheel.errLimit'));
        setSpinning(false);
        return;
      }
      let targetIndex = 0;
      if (res.won && res.prize) {
        targetIndex = Math.max(0, prizes.findIndex((p) => p.id === res.prize.id));
      } else {
        const ti = prizes.findIndex((p) => p.is_try_again);
        targetIndex = ti >= 0 ? ti : 0;
      }
      const center = targetIndex * seg + seg / 2;
      const base = rotationRef.current;
      const target = base - (base % 360) + 360 * 5 + (360 - center);
      rotationRef.current = target;
      setTransitionMs(5200);
      setRotation(target);

      const ticks = 26;
      for (let i = 0; i < ticks; i++) {
        const ease = 1 - Math.pow(1 - i / ticks, 2);
        setTimeout(() => sound.tick(), 120 + ease * 5000);
      }

      setTimeout(() => {
        if (res.won) sound.win(); else sound.thud();
        setSpinning(false);
        setRemaining(res.remainingSpins ?? 0);
        onComplete(res);
      }, 5300);
    } catch (err) {
      setError(err?.message || t('wheel.errSpin'));
      setSpinning(false);
    }
  }, [spinning, remaining, customer, prizes, seg, onComplete, sound, t]);

  return (
    <motion.div
      key="wheel"
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.5 }}
      className="relative z-10 flex min-h-[100svh] flex-col items-center justify-center px-6 py-16"
    >
      <p className="mb-2 text-center text-xs uppercase tracking-[0.4em]" style={{ color: accent }}>
        {pick(campaign?.name_hi, campaign?.name) || t('brand.tagline')}
      </p>
      <h2 className="mb-8 text-center font-heading text-3xl sm:text-4xl" style={{ color: ink }}>
        {remaining > 0 ? t('wheel.spin') : t('wheel.noSpins')}
      </h2>

      <SpinWheel
        prizes={prizes}
        rotation={rotation}
        transitionMs={transitionMs}
        primaryColor={primary}
        accentColor={accent}
        inkColor={ink}
        lang={lang}
      />

      <div className="mt-10 flex items-center gap-4">
        <button
          onClick={spin}
          disabled={spinning || remaining <= 0}
          className="rounded-full px-12 py-4 text-sm font-medium uppercase tracking-[0.3em] transition-transform hover:scale-[1.03] active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
          style={{ backgroundColor: accent, color: '#1a1a1a' }}
        >
          {spinning ? <Loader2 className="mx-auto h-5 w-5 animate-spin" /> : remaining > 0 ? t('wheel.button') : t('wheel.comeBack')}
        </button>
        <button
          onClick={sound.toggleMute}
          className="rounded-full p-3 ring-1 ring-white/15 transition hover:ring-white/40"
          style={{ color: ink }}
          aria-label={sound.muted ? t('wheel.muteOff') : t('wheel.muteOn')}
        >
          {sound.muted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
        </button>
      </div>

      <p className="mt-5 text-sm" style={{ color: ink, opacity: 0.7 }}>
        {t('wheel.remaining', { n: remaining })}
      </p>
      {error && <p className="mt-3 text-sm" style={{ color: '#FCA5A5' }}>{error}</p>}
    </motion.div>
  );
}