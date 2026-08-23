import React from "react";

export default function AuthLayout({ icon: Icon, title, subtitle, footer, children }) {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10" style={{ backgroundColor: '#8C193C' }}>
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4" style={{ backgroundColor: '#E8B84B' }}>
            <Icon className="w-7 h-7" style={{ color: '#1a1a1a' }} aria-hidden="true" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight" style={{ color: '#FAF7F0' }}>{title}</h1>
          {subtitle && <p className="mt-2" style={{ color: '#FAF7F0', opacity: 0.8 }}>{subtitle}</p>}
        </div>
        <div className="rounded-2xl shadow-xl border bg-white p-8" style={{ borderColor: 'rgba(0,0,0,0.08)' }}>
          {children}
        </div>
        {footer && (
          <p className="text-center text-sm mt-6" style={{ color: '#FAF7F0', opacity: 0.85 }}>{footer}</p>
        )}
      </div>
    </div>
  );
}