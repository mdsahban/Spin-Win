import React, { useEffect, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { getPublicCampaign, verifyCustomer } from '@/api/spinApi';
import { useSpinSound } from '@/components/spin/useSpinSound';
import { useLang } from '@/lib/i18n';
import LandingStage from '@/components/spin/LandingStage';
import VerifyStage from '@/components/spin/VerifyStage';
import WheelStage from '@/components/spin/WheelStage';
import ResultStage from '@/components/spin/ResultStage';
import HistoryModal from '@/components/spin/HistoryModal';
import LangToggle from '@/components/spin/LangToggle';
import { Link } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

// Public, no-login spin experience. Stages flow: landing → verify → wheel →
// result. English by default; a Hindi toggle sits in the top-left corner.
export default function SpinHome() {
  const { t } = useLang();
  const [campaign, setCampaign] = useState(null);
  const [loadingCampaign, setLoadingCampaign] = useState(true);
  const [stage, setStage] = useState('landing');
  const [customer, setCustomer] = useState(null);
  const [result, setResult] = useState(null);
  const [verifying, setVerifying] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const sound = useSpinSound();

  useEffect(() => {
    getPublicCampaign()
      .then((c) => setCampaign({ ...(c.campaign || c), prizes: c.prizes || [] }))
      .catch(() => setCampaign(null))
      .finally(() => setLoadingCampaign(false));
  }, []);

  const bg = campaign?.background_url || 'https://media.base44.com/images/public/6a8b514d6fd65d0c16a62dfc/e7ac07006_91f5f9cdd_DelhiCollectionDesignBag4.png';
  const primary = campaign?.primary_color || '#8C193C';
  const ink = campaign?.ink_color || '#FAF7F0';
  const accent = campaign?.accent_color || '#E8B84B';

  const handleVerify = async (name, phone) => {
    setVerifying(true);
    const res = await verifyCustomer(name, phone);
    setCustomer(res);
    setVerifying(false);
    setStage('wheel');
  };

  const handleComplete = (res) => { setResult(res); setStage('result'); };

  const reset = () => { setResult(null); setCustomer(null); setStage('landing'); };

  if (loadingCampaign) {
    return (
      <div className="flex min-h-[100svh] items-center justify-center" style={{ backgroundColor: primary }}>
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: ink }} />
      </div>
    );
  }

  return (
    <div className="relative min-h-[100svh] w-full overflow-hidden" style={{ backgroundColor: primary, color: ink }}>
      {bg && <div className="absolute inset-0 z-0 bg-cover bg-center opacity-70" style={{ backgroundImage: `url(${bg})` }} />}
      <div className="absolute inset-0 z-0 bg-gradient-to-b from-black/10 via-transparent to-black/20" />

      <div className="absolute left-4 top-4 z-20">
        <LangToggle ink={ink} accent={accent} />
      </div>
      <Link
        to="/admin"
        className="absolute right-4 top-4 z-20 rounded-full border border-white/20 px-4 py-1.5 text-[10px] uppercase tracking-[0.25em] backdrop-blur-sm transition hover:bg-white/10"
        style={{ color: ink }}
      >
        {t('admin.link')}
      </Link>

      <AnimatePresence mode="wait">
        {stage === 'landing' && (
          <LandingStage key="landing" campaign={campaign} loading={false} onEnter={() => setStage('verify')} onHistory={() => setHistoryOpen(true)} />
        )}
        {stage === 'verify' && (
          <VerifyStage key="verify" campaign={campaign} loading={verifying} onSubmit={handleVerify} />
        )}
        {stage === 'wheel' && customer && (
          <WheelStage key="wheel" campaign={campaign} customer={customer} sound={sound} onComplete={handleComplete} />
        )}
        {stage === 'result' && result && (
          <ResultStage
            key="result"
            result={result}
            campaign={campaign}
            onSpinAgain={() => { setResult(null); setStage('wheel'); }}
            onDone={reset}
          />
        )}
      </AnimatePresence>

      <HistoryModal open={historyOpen} onClose={() => setHistoryOpen(false)} campaign={campaign} />
    </div>
  );
}