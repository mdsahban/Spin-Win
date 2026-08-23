import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Loader2, Phone, ArrowRight } from 'lucide-react';
import { useLang } from '@/lib/i18n';

// Collects name + Indian mobile number. The +91 country code is fixed
// (non-editable); the user enters only the remaining 10 digits.
export default function VerifyStage({ campaign, onSubmit, loading }) {
  const { t } = useLang();
  const accent = campaign?.accent_color || '#E8B84B';
  const ink = campaign?.ink_color || '#FAF7F0';
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');

  const handlePhone = (e) => {
    const digits = e.target.value.replace(/\D/g, '').slice(0, 10);
    setPhone(digits);
  };

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (name.trim().length < 2) return setError(t('verify.errName'));
    if (phone.length !== 10) return setError(t('verify.errPhone'));
    try {
      await onSubmit(name.trim(), '+91' + phone);
    } catch (err) {
      setError(err?.message || t('verify.errGeneric'));
    }
  };

  return (
    <motion.div
      key="verify"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5 }}
      className="relative z-10 flex min-h-[100svh] flex-col items-center justify-center px-6 py-16"
    >
      <div className="w-full max-w-md">
        <p className="mb-2 text-center text-xs uppercase tracking-[0.4em]" style={{ color: accent }}>
          {t('verify.eyebrow')}
        </p>
        <h2 className="mb-3 text-center font-heading text-3xl sm:text-4xl" style={{ color: ink }}>
          {t('verify.title')}
        </h2>
        <p className="mb-8 text-center font-body text-sm" style={{ color: ink, opacity: 0.7 }}>
          {t('verify.subtitle')}
        </p>

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="mb-2 block text-xs uppercase tracking-[0.2em]" style={{ color: ink, opacity: 0.7 }}>
              {t('verify.name')}
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('verify.namePlaceholder')}
              autoComplete="name"
              className="w-full rounded-xl border-0 bg-white/10 px-4 py-3.5 font-body text-base outline-none ring-1 ring-white/15 backdrop-blur transition focus:ring-2"
              style={{ color: ink }}
            />
          </div>
          <div>
            <label className="mb-2 block text-xs uppercase tracking-[0.2em]" style={{ color: ink, opacity: 0.7 }}>
              {t('verify.phone')}
            </label>
            <div className="relative flex items-center">
              <Phone className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: ink, opacity: 0.5 }} />
              <span className="pointer-events-none absolute left-11 top-1/2 -translate-y-1/2 text-base font-medium" style={{ color: ink, opacity: 0.85 }}>+91</span>
              <input
                type="tel"
                value={phone}
                onChange={handlePhone}
                placeholder={t('verify.phonePlaceholder')}
                inputMode="numeric"
                maxLength={10}
                autoComplete="tel"
                className="w-full rounded-xl border-0 bg-white/10 px-4 py-3.5 pl-20 font-body text-base tracking-[0.05em] outline-none ring-1 ring-white/15 backdrop-blur transition focus:ring-2"
                style={{ color: ink }}
              />
            </div>
          </div>

          {error && <p className="text-sm" style={{ color: '#FCA5A5' }}>{error}</p>}

          <Button
            type="submit"
            disabled={loading}
            className="w-full rounded-full py-6 text-sm font-medium uppercase tracking-[0.25em] transition-transform hover:scale-[1.02] active:scale-95"
            style={{ backgroundColor: accent, color: '#1a1a1a' }}
          >
            {loading ? <Loader2 className="mx-auto h-5 w-5 animate-spin" /> : <>{t('verify.continue')} <ArrowRight className="ml-2 inline h-4 w-4" /></>}
          </Button>
        </form>
      </div>
    </motion.div>
  );
}