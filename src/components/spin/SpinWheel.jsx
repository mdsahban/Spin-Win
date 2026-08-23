import React, { useMemo } from 'react';

// Pure presentational SVG wheel with a premium look: gold double rim, outer
// glow, a clearly-visible icon (uploaded image or emoji) per segment and a
// short label. The parent owns `rotation` and drives the transition.
const R = 160;
const CX = 180;
const CY = 180;

function polar(cx, cy, r, angleDeg) {
  const a = ((angleDeg - 90) * Math.PI) / 180; // -90 so 0deg = top
  return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
}

function wedgePath(i, seg) {
  const a0 = i * seg;
  const a1 = (i + 1) * seg;
  const p0 = polar(CX, CY, R, a0);
  const p1 = polar(CX, CY, R, a1);
  const large = seg > 180 ? 1 : 0;
  return `M ${CX} ${CY} L ${p0.x} ${p0.y} A ${R} ${R} 0 ${large} 1 ${p1.x} ${p1.y} Z`;
}

export default function SpinWheel({ prizes, rotation, transitionMs, primaryColor, accentColor, inkColor, lang }) {
  const seg = prizes.length ? 360 / prizes.length : 360;

  const segments = useMemo(() => {
    return prizes.map((p, i) => {
      const center = i * seg + seg / 2;
      const iconPos = polar(CX, CY, R * 0.46, center);
      const labelPos = polar(CX, CY, R * 0.75, center);
      const isTry = p.is_try_again;
      const fill = isTry ? '#0E0E0E' : i % 2 === 0 ? primaryColor : '#1A0A12';
      return {
        path: wedgePath(i, seg),
        center,
        iconPos,
        labelPos,
        fill,
        label: lang === 'hi' ? (p.name_hi || p.name) : p.name,
        icon: p.icon,
        image: p.image_url,
        isTry
      };
    });
  }, [prizes, seg, primaryColor, lang]);

  return (
    <div className="relative" style={{ width: 'min(360px, 82vw)', height: 'min(360px, 82vw)' }}>
      {/* Outer glow */}
      <div
        className="absolute -inset-3 rounded-full"
        style={{ background: `radial-gradient(circle, ${accentColor}40, transparent 70%)`, filter: 'blur(6px)' }}
      />
      {/* Pointer */}
      <div
        className="absolute left-1/2 top-[-10px] z-20 -translate-x-1/2"
        style={{ width: 0, height: 0, borderLeft: '14px solid transparent', borderRight: '14px solid transparent', borderTop: `26px solid ${accentColor}`, filter: 'drop-shadow(0 3px 4px rgba(0,0,0,0.5))' }}
      />
      <svg viewBox="0 0 360 360" className="relative h-full w-full" style={{ filter: 'drop-shadow(0 18px 40px rgba(0,0,0,0.5))' }}>
        <g
          style={{
            transform: `rotate(${rotation}deg)`,
            transformOrigin: '180px 180px',
            transition: `transform ${transitionMs}ms cubic-bezier(0.22, 1, 0.36, 1)`
          }}
        >
          <defs>
            {segments.map((s, i) => s.image ? (
              <clipPath key={`clip${i}`} id={`clip${i}`}><circle cx={s.iconPos.x} cy={s.iconPos.y} r={18} /></clipPath>
            ) : null)}
          </defs>
          <circle cx={CX} cy={CY} r={R + 8} fill="#0A0A0A" />
          <circle cx={CX} cy={CY} r={R + 4} fill="none" stroke={accentColor} strokeWidth={2.5} opacity={0.9} />
          {segments.map((s, i) => (
            <g key={i}>
              <path d={s.path} fill={s.fill} stroke={accentColor} strokeWidth={1.2} />
              {s.image ? (
                <image href={s.image} x={s.iconPos.x - 18} y={s.iconPos.y - 18} width={36} height={36} clipPath={`url(#clip${i})`} preserveAspectRatio="xMidYMid slice" />
              ) : s.icon ? (
                <text
                  x={s.iconPos.x}
                  y={s.iconPos.y}
                  fontSize={30}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  transform={`rotate(${s.center} ${s.iconPos.x} ${s.iconPos.y})`}
                >
                  {s.icon}
                </text>
              ) : null}
              <text
                x={s.labelPos.x}
                y={s.labelPos.y}
                fill={inkColor}
                fontSize={s.label && s.label.length > 6 ? 11 : 13}
                fontWeight={600}
                fontFamily="'Inter', sans-serif"
                textAnchor="middle"
                dominantBaseline="middle"
                transform={`rotate(${s.center} ${s.labelPos.x} ${s.labelPos.y})`}
                style={{ letterSpacing: '0.04em' }}
              >
                {s.label}
              </text>
            </g>
          ))}
          {/* Gold radial separators */}
          {segments.map((s, i) => {
            const p = polar(CX, CY, R, i * seg);
            return <line key={`l${i}`} x1={CX} y1={CY} x2={p.x} y2={p.y} stroke={accentColor} strokeWidth={1.5} opacity={0.7} />;
          })}
        </g>
        {/* Hub */}
        <circle cx={CX} cy={CY} r={24} fill="#0A0A0A" stroke={accentColor} strokeWidth={2.5} />
        <circle cx={CX} cy={CY} r={7} fill={accentColor} />
      </svg>
    </div>
  );
}