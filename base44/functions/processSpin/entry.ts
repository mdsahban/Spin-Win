import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { genCouponCode } from '../../shared/phone.ts';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const customerId = body.customerId;
    if (!customerId) return Response.json({ error: 'Missing customer.' }, { status: 400 });

    const customer = await base44.asServiceRole.entities.Customer.get(customerId);
    if (!customer) return Response.json({ error: 'Customer not found.' }, { status: 404 });

    const campaigns = await base44.asServiceRole.entities.Campaign.filter({ active: true }, '-created_date', 5);
    const campaign = campaigns && campaigns[0];
    if (!campaign) return Response.json({ error: 'No active campaign.' }, { status: 404 });

    const now = Date.now();
    const nowISO = new Date(now).toISOString();
    const start = campaign.start_date ? new Date(campaign.start_date).getTime() : null;
    const end = campaign.end_date ? new Date(campaign.end_date).getTime() : null;
    if ((start && start > now) || (end && end < now)) {
      return Response.json({ error: 'This campaign is not active.' }, { status: 403 });
    }

    const resetMs = (campaign.reset_days || 7) * 86400000;
    const max = campaign.max_spins || 2;
    const cutoffISO = new Date(now - resetMs).toISOString();

    // 1) Atomically reset an expired (or never-started) cycle. The $or matches a
    //    cycle_start_date older than the reset window OR a null/unset one.
    await base44.asServiceRole.entities.Customer.updateMany(
      { id: customerId, $or: [ { cycle_start_date: { $lt: cutoffISO } }, { cycle_start_date: null } ] },
      { $set: { spins_in_cycle: 0, cycle_start_date: nowISO } }
    );

    // 1b) Once a customer has won in this cycle, no further spins are allowed —
    //     only a "try again" outcome grants the second spin.
    const cycleCust = await base44.asServiceRole.entities.Customer.get(customerId);
    const cycleStartISO = (cycleCust && cycleCust.cycle_start_date) || nowISO;
    const priorSpins = await base44.asServiceRole.entities.Spin.filter(
      { customer_id: customerId, created_date: { $gte: cycleStartISO } },
      '-created_date', 50
    );
    if ((priorSpins || []).some((s) => s.result_type === 'won')) {
      return Response.json({
        status: 'limit_reached',
        reason: 'already_won',
        resetAt: new Date(new Date(cycleStartISO).getTime() + resetMs).toISOString(),
        remainingSpins: 0,
        maxSpins: max
      });
    }

    // 2) Atomic claim of a spin slot: only increments while spins_in_cycle < max.
    //    `updated` tells us whether THIS request won the slot — concurrent
    //    requests that already filled the window get updated=0 and are rejected.
    const claim = await base44.asServiceRole.entities.Customer.updateMany(
      { id: customerId, spins_in_cycle: { $lt: max } },
      { $inc: { spins_in_cycle: 1, total_spins: 1 }, $set: { last_spin_date: nowISO } }
    );
    if (!claim || claim.updated !== 1) {
      const fresh = await base44.asServiceRole.entities.Customer.get(customerId);
      const cs = fresh && fresh.cycle_start_date ? new Date(fresh.cycle_start_date).getTime() : now;
      return Response.json({
        status: 'limit_reached',
        resetAt: new Date(cs + resetMs).toISOString(),
        remainingSpins: 0,
        maxSpins: max
      });
    }

    const updatedCustomer = await base44.asServiceRole.entities.Customer.get(customerId);
    const cycleStart = updatedCustomer.cycle_start_date ? new Date(updatedCustomer.cycle_start_date).getTime() : now;

    // 3) Weighted prize selection (server-side only). Try-Again is part of the
    //    same weighted pool, so the no-win rate is fully configurable.
    const prizes = await base44.asServiceRole.entities.Prize.filter({ active: true }, 'sort_order', 100);
    const pool = prizes.filter(p => p.is_try_again || (p.inventory || 0) > 0);
    const totalProb = pool.reduce((s, p) => s + (p.probability || 0), 0);
    let prize = null;
    if (totalProb > 0) {
      const roll = Math.random() * totalProb;
      let acc = 0;
      for (const p of pool) { acc += (p.probability || 0); if (roll < acc) { prize = p; break; } }
    }
    let won = !!prize && !prize.is_try_again;

    // 4) Atomically reserve one unit of inventory for a real win. If the prize
    //    just sold out (updated=0), fall back to a Try-Again outcome instead.
    if (won) {
      const inv = await base44.asServiceRole.entities.Prize.updateMany(
        { id: prize.id, inventory: { $gt: 0 } },
        { $inc: { inventory: -1 } }
      );
      if (!inv || inv.updated !== 1) { won = false; prize = pool.find(p => p.is_try_again) || null; }
    }
    const resultType = won ? 'won' : 'try_again';

    // 5) Record the spin for history / analytics.
    const spin = await base44.asServiceRole.entities.Spin.create({
      customer_id: customerId,
      phone_normalized: customer.phone_normalized,
      prize_id: prize && !prize.is_try_again ? prize.id : null,
      prize_name: prize ? prize.name : null,
      prize_name_hi: prize ? (prize.name_hi || null) : null,
      result_type: resultType,
      coupon_code: null
    });

    let coupon = null;
    if (won) {
      const expDays = prize.expiration_days || 30;
      const expDate = new Date(now + expDays * 86400000).toISOString().slice(0, 10);
      let code = '';
      for (let i = 0; i < 12; i++) {
        code = genCouponCode('DC');
        const exist = await base44.asServiceRole.entities.Coupon.filter({ code }, '-created_date', 1);
        if (!exist || !exist.length) break;
      }
      coupon = await base44.asServiceRole.entities.Coupon.create({
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
      });
      await base44.asServiceRole.entities.Spin.update(spin.id, { coupon_code: code });
    }

    const remaining = won ? 0 : Math.max(0, max - (updatedCustomer.spins_in_cycle || 0));
    return Response.json({
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
      resetAt: new Date(cycleStart + resetMs).toISOString(),
      winMessage: campaign.win_message,
      loseMessage: campaign.lose_message,
      redemptionInstructions: campaign.redemption_instructions,
      claimUrl: campaign.claim_url
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}