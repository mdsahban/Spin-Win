import { supabase } from '../supabase.js';

export const adminStatsHandler = async (req, res) => {
  try {
    const [
      { data: customers },
      { data: spins },
      { data: coupons },
      { data: prizes },
      { data: campaigns }
    ] = await Promise.all([
      supabase.from('customer').select('*').order('created_at', { ascending: false }).limit(1000),
      supabase.from('spin').select('*').order('created_at', { ascending: false }).limit(1000),
      supabase.from('coupon').select('*').order('created_at', { ascending: false }).limit(1000),
      supabase.from('prize').select('*').order('created_at', { ascending: false }).limit(200),
      supabase.from('campaign').select('*').order('created_at', { ascending: false }).limit(50)
    ]);

    const phones = new Set((customers || []).map(c => c.phone_normalized).filter(Boolean));
    const winners = (spins || []).filter(s => s.result_type === 'won');
    const claimed = (coupons || []).filter(c => c.claimed);

    // daily participation last 14 days
    const days = {};
    const now = Date.now();
    for (let i = 0; i < 14; i++) {
      const d = new Date(now - i * 86400000).toISOString().slice(0, 10);
      days[d] = 0;
    }
    for (const s of (spins || [])) {
      const d = (s.created_at || '').slice(0, 10);
      if (days[d] !== undefined) days[d]++;
    }
    const daily = Object.entries(days).map(([date, count]) => ({ date, count })).reverse();

    // weekly / monthly
    const weekAgo = now - 7 * 86400000;
    const monthAgo = now - 30 * 86400000;
    const weekly = (spins || []).filter(s => new Date(s.created_at).getTime() >= weekAgo).length;
    const monthly = (spins || []).filter(s => new Date(s.created_at).getTime() >= monthAgo).length;

    const prizePerf = (prizes || []).map(p => {
      const wonCount = winners.filter(s => s.prize_id === p.id).length;
      return { id: p.id, name: p.name, inventory: p.inventory, won: wonCount, active: p.active };
    });

    res.json({
      stats: {
        totalCustomers: (customers || []).length,
        uniquePhones: phones.size,
        totalSpins: (spins || []).length,
        totalWinners: winners.length,
        totalPrizesIssued: (coupons || []).length,
        claimedPrizes: claimed.length,
        unclaimedPrizes: (coupons || []).length - claimed.length,
        weekly, monthly
      },
      daily,
      prizePerf,
      campaigns
    });
  } catch (error) {
    console.error('adminStats error:', error);
    res.status(500).json({ error: error.message });
  }
};
