import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const [customers, spins, coupons, prizes, campaigns] = await Promise.all([
      base44.asServiceRole.entities.Customer.list('-created_date', 1000),
      base44.asServiceRole.entities.Spin.list('-created_date', 1000),
      base44.asServiceRole.entities.Coupon.list('-created_date', 1000),
      base44.asServiceRole.entities.Prize.list('-created_date', 200),
      base44.asServiceRole.entities.Campaign.list('-created_date', 50)
    ]);

    const phones = new Set(customers.map(c => c.phone_normalized).filter(Boolean));
    const winners = spins.filter(s => s.result_type === 'won');
    const claimed = coupons.filter(c => c.claimed);

    // daily participation last 14 days
    const days = {};
    const now = Date.now();
    for (let i = 0; i < 14; i++) {
      const d = new Date(now - i * 86400000).toISOString().slice(0, 10);
      days[d] = 0;
    }
    for (const s of spins) {
      const d = (s.created_date || '').slice(0, 10);
      if (days[d] !== undefined) days[d]++;
    }
    const daily = Object.entries(days).map(([date, count]) => ({ date, count })).reverse();

    // weekly / monthly
    const weekAgo = now - 7 * 86400000;
    const monthAgo = now - 30 * 86400000;
    const weekly = spins.filter(s => new Date(s.created_date).getTime() >= weekAgo).length;
    const monthly = spins.filter(s => new Date(s.created_date).getTime() >= monthAgo).length;

    const prizePerf = prizes.map(p => {
      const wonCount = winners.filter(s => s.prize_id === p.id).length;
      return { id: p.id, name: p.name, inventory: p.inventory, won: wonCount, active: p.active };
    });

    return Response.json({
      stats: {
        totalCustomers: customers.length,
        uniquePhones: phones.size,
        totalSpins: spins.length,
        totalWinners: winners.length,
        totalPrizesIssued: coupons.length,
        claimedPrizes: claimed.length,
        unclaimedPrizes: coupons.length - claimed.length,
        weekly, monthly
      },
      daily,
      prizePerf,
      campaigns
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}