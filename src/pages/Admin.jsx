import React, { useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import StatsOverview from '@/components/admin/StatsOverview';
import PrizeManager from '@/components/admin/PrizeManager';
import CustomerManager from '@/components/admin/CustomerManager';
import CampaignManager from '@/components/admin/CampaignManager';
import RuleManager from '@/components/admin/RuleManager';
import SpinHistory from '@/components/admin/SpinHistory';
import { LayoutDashboard, Gift, Users, Megaphone, Gavel, RotateCw, LogOut, ExternalLink, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

const NAV = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'prizes', label: 'Prizes', icon: Gift },
  { id: 'customers', label: 'Customers', icon: Users },
  { id: 'spins', label: 'Spins', icon: RotateCw },
  { id: 'rules', label: 'Rules', icon: Gavel },
  { id: 'campaign', label: 'Campaign', icon: Megaphone },
];

const TITLES = {
  dashboard: { title: 'Dashboard', desc: 'Performance overview of the Spin & Win campaign.' },
  prizes: { title: 'Prize management', desc: 'Configure prizes, probabilities and inventory.' },
  customers: { title: 'Customers & coupons', desc: 'Track participation and coupon redemption.' },
  spins: { title: 'Spin history', desc: 'Every spin logged across the campaign.' },
  rules: { title: 'Game rules', desc: 'Spin limits, scheduling and terms.' },
  campaign: { title: 'Campaign content', desc: 'Brand colours and copy for the live experience.' },
};

export default function Admin() {
  const [section, setSection] = useState('dashboard');
  const { user, logout } = useAuth();
  const t = TITLES[section];

  const NavButton = ({ n, mobile }) => {
    const active = section === n.id;
    return (
      <button
        onClick={() => setSection(n.id)}
        className={`relative flex items-center gap-3 rounded-lg ${mobile ? 'whitespace-nowrap px-3 py-1.5 text-xs' : 'w-full px-3 py-2.5 text-sm'} transition ${active ? 'text-white' : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'}`}
        style={active ? { backgroundColor: '#8C193C' } : undefined}
      >
        {!mobile && active && <span className="absolute left-0 top-1/2 h-5 -translate-y-1/2 rounded-r" style={{ width: 3, backgroundColor: '#E8B84B' }} />}
        <n.icon className={mobile ? 'h-3.5 w-3.5' : 'h-4 w-4'} /> {n.label}
      </button>
    );
  };

  return (
    <div className="dark flex min-h-[100svh] bg-background text-foreground">
      {/* Sidebar */}
      <aside className="hidden w-64 flex-col border-r border-zinc-800 bg-zinc-950 text-zinc-300 sm:flex">
        <div className="border-b border-zinc-800 p-5">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" style={{ color: '#E8B84B' }} />
            <p className="font-heading text-lg font-semibold text-white">CoutureChance</p>
          </div>
          <p className="mt-1 text-xs text-zinc-500">Admin console</p>
        </div>
        <nav className="flex-1 space-y-1 p-3">
          {NAV.map((n) => <NavButton key={n.id} n={n} />)}
        </nav>
        <div className="border-t border-zinc-800 p-3">
          <Link to="/" className="mb-1 flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200">
            <ExternalLink className="h-4 w-4" /> View live site
          </Link>
          <button onClick={() => logout()} className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200">
            <LogOut className="h-4 w-4" /> Sign out
          </button>
          <p className="mt-2 truncate px-3 text-xs text-zinc-600">{user?.email}</p>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="fixed inset-x-0 top-0 z-30 border-b border-zinc-800 bg-zinc-950 sm:hidden">
        <div className="flex items-center gap-2 px-4 py-3">
          <Sparkles className="h-4 w-4" style={{ color: '#E8B84B' }} />
          <p className="font-heading text-sm font-semibold text-white">CoutureChance</p>
        </div>
        <div className="flex gap-1 overflow-x-auto px-2 pb-2">
          {NAV.map((n) => <NavButton key={n.id} n={n} mobile />)}
        </div>
      </div>

      {/* Main */}
      <main className="flex-1 overflow-y-auto p-6 pb-20 pt-28 sm:p-8 sm:pt-8">
        <div className="mx-auto max-w-5xl">
          <div className="mb-6">
            <h1 className="font-heading text-2xl font-semibold text-white">{t.title}</h1>
            <p className="mt-1 text-sm text-zinc-400">{t.desc}</p>
          </div>

          {section === 'dashboard' && <StatsOverview />}
          {section === 'prizes' && <PrizeManager />}
          {section === 'customers' && <CustomerManager />}
          {section === 'spins' && <SpinHistory />}
          {section === 'rules' && <RuleManager />}
          {section === 'campaign' && <CampaignManager />}
        </div>
      </main>
    </div>
  );
}