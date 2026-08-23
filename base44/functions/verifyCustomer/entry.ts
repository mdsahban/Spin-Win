import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { normalizePhone } from '../../shared/phone.ts';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const name = (body.name || '').trim();
    const phoneRaw = (body.phone || '').trim();
    if (name.length < 2) return Response.json({ error: 'Please enter your full name.' }, { status: 400 });
    const phone = normalizePhone(phoneRaw);
    if (!phone) return Response.json({ error: 'Please enter a valid phone number including the country code.' }, { status: 400 });

    // find or create customer (service role — anonymous public endpoint)
    let found = await base44.asServiceRole.entities.Customer.filter({ phone_normalized: phone }, '-created_date', 5);
    let customer = found && found[0];
    if (!customer) {
      customer = await base44.asServiceRole.entities.Customer.create({
        name,
        phone_raw: phoneRaw,
        phone_normalized: phone,
        spins_in_cycle: 0,
        total_spins: 0
      });
    } else if (customer.name !== name) {
      await base44.asServiceRole.entities.Customer.update(customer.id, { name });
      customer.name = name;
    }

    const campaigns = await base44.asServiceRole.entities.Campaign.filter({ active: true }, '-created_date', 5);
    const campaign = campaigns && campaigns[0];
    if (!campaign) return Response.json({ error: 'No active campaign available right now.' }, { status: 404 });

    const now = Date.now();
    const resetMs = (campaign.reset_days || 7) * 86400000;
    const max = campaign.max_spins || 2;
    let cycleStart = customer.cycle_start_date ? new Date(customer.cycle_start_date).getTime() : null;
    let cycleStartISO = customer.cycle_start_date || null;
    let spinsInCycle = customer.spins_in_cycle || 0;
    if (cycleStart && (now - cycleStart) >= resetMs) { cycleStart = null; cycleStartISO = null; spinsInCycle = 0; }

    const start = campaign.start_date ? new Date(campaign.start_date).getTime() : null;
    const end = campaign.end_date ? new Date(campaign.end_date).getTime() : null;
    const inRange = (!start || start <= now) && (!end || end >= now);

    let alreadyWon = false;
    if (cycleStartISO) {
      const prior = await base44.asServiceRole.entities.Spin.filter(
        { customer_id: customer.id, created_date: { $gte: cycleStartISO } },
        '-created_date', 50
      );
      alreadyWon = (prior || []).some((s) => s.result_type === 'won');
    }

    let remaining, resetAt;
    if (!cycleStart) { remaining = max; resetAt = null; }
    else { remaining = alreadyWon ? 0 : Math.max(0, max - spinsInCycle); resetAt = new Date(cycleStart + resetMs).toISOString(); }
    const canSpin = inRange && remaining > 0 && !alreadyWon;

    return Response.json({
      customerId: customer.id,
      name: customer.name,
      remainingSpins: remaining,
      maxSpins: max,
      canSpin,
      campaignActive: inRange,
      resetAt
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}