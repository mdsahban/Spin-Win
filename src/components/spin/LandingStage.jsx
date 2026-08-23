import React from 'react';
import { motion } from 'framer-motion';
import { Image } from '@/components/ui/image';
import { History } from 'lucide-react';
import SocialLinks from './SocialLinks';
import { useLang } from '@/lib/i18n';

// The opening hero: brand mark, headline and the single call to action that
// moves the visitor into verification. Copy follows the active language.
export default function LandingStage({ campaign, onEnter, onHistory, loading }) {
  const { t, lang } = useLang();
  const accent = campaign?.accent_color || '#E8B84B';
  const ink = campaign?.ink_color || '#FAF7F0';
  const pick = (hi, en) => (lang === 'hi' ? (hi || en) : en);
  const name = pick(campaign?.name_hi, campaign?.name) || t('brand.tagline');
  const headline = pick(campaign?.headline_hi, campaign?.headline) || t('landing.headline');
  const subheadline = pick(campaign?.subheadline_hi, campaign?.subheadline) || t('landing.subheadline');
  const cta = pick(campaign?.cta_text_hi, campaign?.cta_text) || t('landing.cta');

  return (
    <motion.div
      key="landing"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="relative z-10 flex min-h-[100svh] flex-col items-center justify-center px-6 py-16 text-center"
    >
      <motion.div
        initial={{ y: 16, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.7, ease: 'easeOut' }}
        className="flex flex-col items-center"
      >
        <div className="mb-6 h-28 w-28 overflow-hidden rounded-2xl ring-1 ring-white/20 sm:h-36 sm:w-36">
          <Image
            src={campaign?.logo_url || 'https://media.base44.com/images/public/6a8b514d6fd65d0c16a62dfc/795eddbbc_10.png'}
            alt={name}
            className="h-full w-full object-contain"
          />
        </div>

        <p className="mb-3 text-xs uppercase tracking-[0.4em]" style={{ color: accent, letterSpacing: '0.4em' }}>
          {name}
        </p>
        <h1 className="max-w-2xl font-heading text-4xl font-semibold leading-[1.1] sm:text-5xl md:text-6xl" style={{ color: ink }}>
          {headline}
        </h1>
        <p className="mt-5 max-w-md font-body text-base leading-relaxed sm:text-lg" style={{ color: ink, opacity: 0.82 }}>
          {subheadline}
        </p>

        {/* Brand identity */}
        <div className="mt-6 space-y-1.5 text-sm" style={{ color: ink, opacity: 0.9 }}>
          <p>{t('brand.line1')}</p>
          <p>{t('brand.line2')}</p>
          <p>{t('brand.line3')}</p>
          <p>{t('brand.line4')}</p>
        </div>

        <button
          onClick={onEnter}
          disabled={loading}
          className="group relative mt-8 overflow-hidden rounded-full px-10 py-4 text-sm font-medium uppercase tracking-[0.25em] transition-transform duration-300 hover:scale-[1.03] active:scale-95 disabled:opacity-60"
          style={{ backgroundColor: accent, color: '#1a1a1a' }}
        >
          {loading ? t('landing.preparing') : cta}
        </button>

        <button
          onClick={onHistory}
          className="mt-6 flex items-center gap-1.5 text-[11px] uppercase tracking-[0.3em] underline-offset-4 transition hover:opacity-100"
          style={{ color: ink, opacity: 0.6 }}
        >
          <History className="h-3.5 w-3.5" /> {t('landing.history')}
        </button>

        <p className="mt-4 text-[11px] uppercase tracking-[0.3em]" style={{ color: ink, opacity: 0.5 }}>
          {t('landing.disclaimer')}
        </p>

        <div className="mt-6">
          <SocialLinks accent={accent} ink={ink} />
        </div>
      </motion.div>
    </motion.div>
  );
}