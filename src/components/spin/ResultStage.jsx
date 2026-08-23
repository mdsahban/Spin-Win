import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Copy, Check, Sparkles, RefreshCw, Ticket, ArrowRight } from 'lucide-react';
import { celebrateWin } from './confetti';
import { useLang } from '@/lib/i18n';

// Shows the outcome: a coupon for a win, a gracious "try again" for a loss.
// Confetti fires once on mount for wins. The "spin again" CTA re-enters the
// wheel only if spins remain.
export default function ResultStage({ result, campaign, onSpinAgain, onDone }) {
  const { t, lang } = useLang();
  const accent = campaign?.accent_color || '#E8B84B';
  const ink = campaign?.ink_color || '#FAF7F0';
  const pick = (hi, en) => (lang === 'hi' ? (hi || en) : en);
  const [copied, setCopied] = React.useState(false);

  useEffect(() => {
    if (result?.won) celebrateWin();
  }, [result?.won]);

  const copyCode = async () => {
    if (!result?.coupon?.code) return;
    try {
      await navigator.clipboard.writeText(result.coupon.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  const prizeTitle = pick(result?.prize?.discount_value_hi, result?.prize?.discount_value) || pick(result?.prize?.name_hi, result?.prize?.name);
  const prizeDesc = pick(result?.prize?.description_hi, result?.prize?.description);
  const loseMsg = pick(campaign?.lose_message_hi, campaign?.lose_message) || t('result.loseDefault');
  const redeemMsg = pick(campaign?.redemption_instructions_hi, campaign?.redemption_instructions);

  return (
    <motion.div
      key="result"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5 }}
      className="relative z-10 flex min-h-[100svh] flex-col items-center justify-center px-6 py-16 text-center"
    >
      {result?.won ? (
        <div className="w-full max-w-md">
          <motion.div
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.15, type: 'spring', stiffness: 200 }}
            className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full"
            style={{ backgroundColor: accent, color: '#1a1a1a' }}
          >
            <Sparkles className="h-8 w-8" />
          </motion.div>
          <p className="mb-2 text-xs uppercase tracking-[0.4em]" style={{ color: accent }}>{t('result.won')}</p>
          <h2 className="mb-1 font-heading text-4xl sm:text-5xl" style={{ color: ink }}>{prizeTitle}</h2>
          {prizeDesc && <p className="mb-6 text-sm" style={{ color: ink, opacity: 0.7 }}>{prizeDesc}</p>}

          <div className="my-8 rounded-2xl border border-dashed p-5" style={{ borderColor: accent, backgroundColor: 'rgba(255,255,255,0.05)' }}>
            <p className="mb-2 text-[11px] uppercase tracking-[0.3em]" style={{ color: ink, opacity: 0.6 }}>{t('result.code')}</p>
            <div className="flex items-center justify-center gap-3">
              <span className="font-mono text-2xl tracking-[0.2em]" style={{ color: accent }}>{result.coupon?.code}</span>
              <button onClick={copyCode} className="rounded-lg p-2 ring-1 ring-white/15 transition hover:ring-white/40" style={{ color: ink }} aria-label="Copy code">
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </button>
            </div>
            <p className="mt-3 text-xs" style={{ color: ink, opacity: 0.6 }}>{t('result.validUntil')} {result.coupon?.expiration_date}</p>
          </div>

          {redeemMsg && <p className="mb-6 text-sm leading-relaxed" style={{ color: ink, opacity: 0.75 }}>{redeemMsg}</p>}

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            {result.remainingSpins > 0 ? (
              <Button onClick={onSpinAgain} className="rounded-full px-8 py-6 text-sm uppercase tracking-[0.25em]" style={{ backgroundColor: accent, color: '#1a1a1a' }}>
                <RefreshCw className="mr-2 h-4 w-4" /> {t('result.spinAgain')}
              </Button>
            ) : result.claimUrl && result.claimUrl !== '#' ? (
              <a href={result.claimUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center rounded-full px-8 py-6 text-sm font-medium uppercase tracking-[0.25em] transition-transform hover:scale-[1.03]" style={{ backgroundColor: accent, color: '#1a1a1a' }}>
                {t('result.claim')} <ArrowRight className="ml-2 inline h-4 w-4" />
              </a>
            ) : (
              <Button onClick={onDone} className="rounded-full px-8 py-6 text-sm uppercase tracking-[0.25em]" style={{ backgroundColor: accent, color: '#1a1a1a' }}>
                {t('result.back')}
              </Button>
            )}
          </div>
        </div>
      ) : (
        <div className="w-full max-w-md">
          <motion.div
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.15, type: 'spring', stiffness: 200 }}
            className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full ring-1 ring-white/20"
            style={{ color: ink }}
          >
            <Ticket className="h-8 w-8" />
          </motion.div>
          <h2 className="mb-3 font-heading text-3xl sm:text-4xl" style={{ color: ink }}>{loseMsg}</h2>
          <p className="mb-8 text-sm" style={{ color: ink, opacity: 0.7 }}>
            {result?.remainingSpins > 0 ? t('result.loseSubTry') : t('result.loseSubDone')}
          </p>
          {result?.remainingSpins > 0 ? (
            <Button onClick={onSpinAgain} className="rounded-full px-8 py-6 text-sm uppercase tracking-[0.25em]" style={{ backgroundColor: accent, color: '#1a1a1a' }}>
              <RefreshCw className="mr-2 h-4 w-4" /> {t('result.spinAgain')}
            </Button>
          ) : (
            <Button onClick={onDone} className="rounded-full px-8 py-6 text-sm uppercase tracking-[0.25em]" style={{ backgroundColor: accent, color: '#1a1a1a' }}>
              {t('result.back')}
            </Button>
          )}
        </div>
      )}
    </motion.div>
  );
}