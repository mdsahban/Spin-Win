import React from 'react';
import { useLang } from '@/lib/i18n';
import { Languages } from 'lucide-react';

// Top-left language switch: English by default, Hindi on click.
export default function LangToggle({ ink = '#FAF7F0', accent = '#E8B84B' }) {
  const { t, toggle } = useLang();
  return (
    <button
      onClick={toggle}
      className="flex items-center gap-1.5 rounded-full border border-white/20 px-3 py-1.5 text-[10px] uppercase tracking-[0.25em] backdrop-blur-sm transition hover:bg-white/10"
      style={{ color: ink }}
    >
      <Languages className="h-3.5 w-3.5" style={{ color: accent }} />
      {t('lang.toggle')}
    </button>
  );
}