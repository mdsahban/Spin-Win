import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getCustomerHistory } from '@/api/spinApi';
import { X, Loader2, Ticket, History, LogIn, Phone } from 'lucide-react';
import { useLang } from '@/lib/i18n';

// Phone-based "login" so a returning customer can view their own past coupons
// and spins without a full account. Scoped server-side to their number only.
export default function HistoryModal({ open, onClose, campaign }) {
  const { t, lang } = useLang();
  const accent = campaign?.accent_color || '#E8B84B';
  const ink = campaign?.ink_color || '#FAF7F0';
  const pick = (hi, en) => (lang === 'hi' ? (hi || en) : en);
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [data, setData] = useState(null);

  const handlePhone = (e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10));

  const submit = async (e) => {
    e.preventDefault();
    if (phone.length !== 10) { setError(t('history.errPhone')); return; }
    setLoading(true); setError(''); setData(null);
    try {
      const res = await getCustomerHistory('+91' + phone);
      setData(res);
    } catch (err) {
      setError(err?.message || t('history.err'));
    } finally { setLoading(false); }
  };

  const close = () => { setData(null); setError(''); setPhone(''); onClose(); };

  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <div className="absolute inset-0 bg-black/70" onClick={close} />
          <motion.div
            initial={{ y: 20, opacity: 0, scale: 0.97 }} animate={{ y: 0, opacity: 1, scale: 1 }} exit={{ y: 20, opacity: 0 }}
            className="relative z-10 max-h-[85vh] w-full max-w-md overflow-y-auto rounded-2xl border p-6 shadow-2xl"
            style={{ backgroundColor: '#14080C', borderColor: 'rgba(255,255,255,0.1)', color: ink }}
          >
            <button onClick={close} className="absolute right-4 top-4 opacity-60 hover:opacity-100"><X className="h-5 w-5" /></button>
            <div className="mb-4 flex items-center gap-2">
              <History className="h-5 w-5" style={{ color: accent }} />
              <h2 className="font-heading text-xl font-semibold">{t('history.title')}</h2>
            </div>

            {!data && (
              <form onSubmit={submit} className="space-y-3">
                <p className="text-sm opacity-75">{t('history.subtitle')}</p>
                <div className="relative flex items-center">
                  <Phone className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 opacity-50" />
                  <span className="pointer-events-none absolute left-11 top-1/2 -translate-y-1/2 text-sm font-medium opacity-85">+91</span>
                  <input
                    value={phone} onChange={handlePhone} type="tel" inputMode="numeric" maxLength={10} placeholder={t('verify.phonePlaceholder')}
                    className="w-full rounded-lg border bg-white/5 px-4 py-3 pl-20 text-sm tracking-[0.05em] outline-none focus:border-current"
                    style={{ borderColor: 'rgba(255,255,255,0.15)' }}
                  />
                </div>
                {error && <p className="text-sm" style={{ color: '#F87171' }}>{error}</p>}
                <button type="submit" disabled={loading || phone.length !== 10} className="flex w-full items-center justify-center gap-2 rounded-full py-3 text-sm font-medium uppercase tracking-[0.2em] disabled:opacity-60" style={{ backgroundColor: accent, color: '#1a1a1a' }}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><LogIn className="h-4 w-4" /> {t('history.view')}</>}
                </button>
              </form>
            )}

            {data && (
              <div className="space-y-5">
                <div>
                  <p className="text-sm opacity-75">{t('history.welcome')}</p>
                  <p className="font-heading text-lg">{data.customer.name}</p>
                  <p className="text-xs opacity-60">{data.customer.total_spins} {t('history.totalSpins')}</p>
                </div>

                <div>
                  <p className="mb-2 text-xs uppercase tracking-[0.2em]" style={{ color: accent }}>{t('history.coupons')}</p>
                  {data.coupons.length === 0 ? (
                    <p className="text-sm opacity-60">{t('history.noCoupons')}</p>
                  ) : (
                    <div className="space-y-2">
                      {data.coupons.map(c => (
                        <div key={c.id} className="flex items-center justify-between rounded-lg border p-3" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
                          <div>
                            <p className="font-mono text-sm font-semibold">{c.code}</p>
                            <p className="text-xs opacity-70">{pick(c.prize_name_hi, c.prize_name)}{c.discount_value ? ` · ${pick(c.discount_value_hi, c.discount_value)}` : ''}</p>
                            <p className="text-[11px] opacity-50">{t('history.expires')} {c.expiration_date}{c.claimed ? ` · ${t('history.claimed')}` : ''}</p>
                          </div>
                          <Ticket className="h-5 w-5" style={{ color: accent }} />
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <p className="mb-2 text-xs uppercase tracking-[0.2em]" style={{ color: accent }}>{t('history.recent')}</p>
                  {data.spins.length === 0 ? (
                    <p className="text-sm opacity-60">{t('history.noSpins')}</p>
                  ) : (
                    <div className="space-y-1.5">
                      {data.spins.map(s => (
                        <div key={s.id} className="flex items-center justify-between text-sm">
                          <span>{s.result_type === 'won' ? (pick(s.prize_name_hi, s.prize_name) || t('history.prizeWon')) : t('history.tryAgain')}</span>
                          <span className="text-xs opacity-50">{new Date(s.date).toLocaleDateString()}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}