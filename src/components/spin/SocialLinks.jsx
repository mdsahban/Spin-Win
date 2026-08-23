import React from 'react';
import { Instagram, Facebook, MessageCircle, MapPin } from 'lucide-react';

// Premium circular social buttons for the Delhi Collection / #bharwara brand.
const LINKS = [
  { icon: Instagram, href: 'https://www.instagram.com/delhi_collection_1/', label: 'Instagram' },
  { icon: Facebook, href: 'https://www.facebook.com/uniqueItems05/', label: 'Facebook' },
  {
    icon: MessageCircle,
    href: 'https://wa.me/919310581186?text=Hi%20Delhi%20Collection,%20I%20need%20to%20look%20classic%20and%20suggest%20me%20best%20outfit%20trending%20now?',
    label: 'WhatsApp'
  },
  { icon: MapPin, href: 'https://maps.app.goo.gl/2XtiDe9uBGQP8WGo8', label: 'Map' }
];

export default function SocialLinks({ accent = '#E8B84B', ink = '#FAF7F0' }) {
  return (
    <div className="flex items-center justify-center gap-3">
      {LINKS.map(({ icon: Icon, href, label }) => (
        <a
          key={label}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={label}
          title={label}
          className="flex h-11 w-11 items-center justify-center rounded-full ring-1 ring-white/20 backdrop-blur-sm transition hover:scale-110"
          style={{ color: ink, backgroundColor: 'rgba(255,255,255,0.06)', boxShadow: `0 0 0 0 ${accent}` }}
          onMouseEnter={(e) => (e.currentTarget.style.boxShadow = `0 0 0 2px ${accent}`)}
          onMouseLeave={(e) => (e.currentTarget.style.boxShadow = `0 0 0 0 ${accent}`)}
        >
          <Icon className="h-5 w-5" />
        </a>
      ))}
    </div>
  );
}