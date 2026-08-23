import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { normalizePhone } from '../../shared/phone.ts';

// Public, phone-based "soft login": a returning customer enters the phone they
// spun with to retrieve their own coupons and spin history. Scoped strictly to
// the normalized phone so no other customer's data is exposed.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const phone = normalizePhone(body.phone);
    if (!phone) return Response.json({ error: 'Enter a valid phone number.' }, { status: 400 });

    const customers = await base44.asServiceRole.entities.Customer.filter({ phone_normalized: phone }, '-created_date', 1);
    const customer = customers && customers[0];
    if (!customer) return Response.json({ error: 'No spins found for this number.' }, { status: 404 });

    const spins = await base44.asServiceRole.entities.Spin.filter({ phone_normalized: phone }, '-created_date', 50);
    const coupons = await base44.asServiceRole.entities.Coupon.filter({ customer_id: customer.id }, '-created_date', 50);

    return Response.json({
      customer: { name: customer.name, phone: customer.phone_normalized, total_spins: customer.total_spins || 0 },
      spins: spins.map(s => ({
        id: s.id,
        prize_name: s.prize_name,
        result_type: s.result_type,
        coupon_code: s.coupon_code,
        date: s.created_date
      })),
      coupons: coupons.map(c => ({
        id: c.id,
        code: c.code,
        prize_name: c.prize_name,
        discount_value: c.discount_value,
        expiration_date: c.expiration_date,
        claimed: c.claimed
      }))
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}