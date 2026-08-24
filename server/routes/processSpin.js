import { supabase } from '../supabase.js';

function genCouponCode(prefix) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = prefix || '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export const processSpinHandler = async (req, res) => {
  try {
    const { customerId } = req.body;
    if (!customerId) return res.status(400).json({ error: 'Missing customer.' });

    const { data: customer } = await supabase.from('customer').select('*').eq('id', customerId).single();
    if (!customer) return res.status(404).json({ error: 'Customer not found.' });

    const { data: campaigns } = await supabase.from('campaign').select('*').eq('active', true).order('created_at', { ascending: false }).limit(5);
    const campaign = campaigns && campaigns[0];
    if (!campaign) return res.status(404).json({ error: 'No active campaign.' });

    const now = Date.now();
    const nowISO = new Date(now).toISOString();
    const start = campaign.start_date ? new Date(campaign.start_date).getTime() : null;
    const end = campaign.end_date ? new Date(campaign.end_date).getTime() : null;
    if ((start && start > now) || (end && end < now)) {
      return res.status(403).json({ error: 'This campaign is not active.' });
    }

    const resetMs = (campaign.reset_days || 7) * 86400000;
    const max = campaign.max_spins || 2;
    const cutoffISO = new Date(now - resetMs).toISOString();

    // 1) Reset cycle if expired
    let currentCycleStart = customer.cycle_start_date;
    if (!currentCycleStart || new Date(currentCycleStart) < new Date(cutoffISO)) {
      await supabase.from('customer').update({ spins_in_cycle: 0, cycle_start_date: nowISO }).eq('id', customerId);
      currentCycleStart = nowISO;
    }

    // 1b) Check if already won
    const { data: priorSpins } = await supabase.from('spin').select('*').eq('customer_id', customerId).gte('created_at', currentCycleStart).limit(50);
    if ((priorSpins || []).some((s) => s.result_type === 'won')) {
      return res.json({
        status: 'limit_reached',
        reason: 'already_won',
        resetAt: new Date(new Date(currentCycleStart).getTime() + resetMs).toISOString(),
        remainingSpins: 0,
        maxSpins: max
      });
    }

    // 2) Claim spin slot
    // NOTE: In a high-concurrency production environment, this should use a Postgres atomic UPDATE returning *
    const { data: freshCust } = await supabase.from('customer').select('*').eq('id', customerId).single();
    if (freshCust.spins_in_cycle >= max) {
      return res.json({
        status: 'limit_reached',
        resetAt: new Date(new Date(freshCust.cycle_start_date).getTime() + resetMs).toISOString(),
        remainingSpins: 0,
        maxSpins: max
      });
    }
    
    await supabase.from('customer').update({
      spins_in_cycle: freshCust.spins_in_cycle + 1,
      total_spins: freshCust.total_spins + 1,
      last_spin_date: nowISO
    }).eq('id', customerId);

    // 3) Prize Selection
    const { data: prizes } = await supabase.from('prize').select('*').eq('active', true).order('sort_order', { ascending: true }).limit(100);
    const pool = prizes.filter(p => p.is_try_again || (p.inventory || 0) > 0);
    const totalProb = pool.reduce((s, p) => s + (Number(p.probability) || 0), 0);
    let prize = null;
    
    if (totalProb > 0) {
      const roll = Math.random() * totalProb;
      let acc = 0;
      for (const p of pool) { 
        acc += (Number(p.probability) || 0); 
        if (roll < acc) { prize = p; break; } 
      }
    }
    let won = !!prize && !prize.is_try_again;

    // 4) Claim Inventory
    if (won) {
      const { data: freshPrize } = await supabase.from('prize').select('*').eq('id', prize.id).single();
      if (freshPrize.inventory > 0) {
        await supabase.from('prize').update({ inventory: freshPrize.inventory - 1 }).eq('id', prize.id);
      } else {
        won = false;
        prize = pool.find(p => p.is_try_again) || null;
      }
    }
    const resultType = won ? 'won' : 'try_again';

    // 5) Record Spin
    const { data: spin } = await supabase.from('spin').insert({
      customer_id: customerId,
      phone_normalized: customer.phone_normalized,
      prize_id: prize && !prize.is_try_again ? prize.id : null,
      prize_name: prize ? prize.name : null,
      prize_name_hi: prize ? (prize.name_hi || null) : null,
      result_type: resultType,
      coupon_code: null
    }).select().single();

    let coupon = null;
    if (won) {
      const expDays = prize.expiration_days || 30;
      const expDate = new Date(now + expDays * 86400000).toISOString().slice(0, 10);
      let code = '';
      for (let i = 0; i < 12; i++) {
        code = genCouponCode('DC');
        const { data: exist } = await supabase.from('coupon').select('id').eq('code', code).limit(1);
        if (!exist || !exist.length) break;
      }
      const { data: newCoupon } = await supabase.from('coupon').insert({
        code,
        customer_id: customerId,
        customer_name: customer.name,
        customer_phone: customer.phone_normalized,
        prize_id: prize.id,
        prize_name: prize.name,
        prize_name_hi: prize.name_hi || null,
        spin_id: spin.id,
        discount_value: prize.discount_value,
        discount_value_hi: prize.discount_value_hi || null,
        claimed: false,
        expiration_date: expDate
      }).select().single();
      
      coupon = newCoupon;
      await supabase.from('spin').update({ coupon_code: code }).eq('id', spin.id);
    }

    const remaining = won ? 0 : Math.max(0, max - (freshCust.spins_in_cycle + 1));
    res.json({
      status: 'ok',
      resultType,
      won,
      prize: won ? {
        id: prize.id,
        name: prize.name,
        name_hi: prize.name_hi,
        description: prize.description,
        description_hi: prize.description_hi,
        image_url: prize.image_url,
        icon: prize.icon,
        discount_value: prize.discount_value,
        discount_value_hi: prize.discount_value_hi
      } : null,
      coupon: coupon ? { code: coupon.code, expiration_date: coupon.expiration_date } : null,
      remainingSpins: remaining,
      maxSpins: max,
      resetAt: new Date(new Date(currentCycleStart).getTime() + resetMs).toISOString(),
      winMessage: campaign.win_message,
      loseMessage: campaign.lose_message,
      redemptionInstructions: campaign.redemption_instructions,
      claimUrl: campaign.claim_url
    });
  } catch (error) {
    console.error('processSpin error:', error);
    res.status(500).json({ error: error.message });
  }
};
