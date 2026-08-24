import { supabase } from '../supabase.js';

export const getCustomerHistoryHandler = async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone) return res.status(400).json({ error: 'Enter a valid phone number.' });

    const { data: customers } = await supabase
      .from('customer')
      .select('*')
      .eq('phone_normalized', phone)
      .order('created_at', { ascending: false })
      .limit(1);

    const customer = customers && customers[0];
    if (!customer) return res.status(404).json({ error: 'No spins found for this number.' });

    const { data: spins } = await supabase
      .from('spin')
      .select('*')
      .eq('phone_normalized', phone)
      .order('created_at', { ascending: false })
      .limit(50);

    const { data: coupons } = await supabase
      .from('coupon')
      .select('*')
      .eq('customer_id', customer.id)
      .order('created_at', { ascending: false })
      .limit(50);

    res.json({
      customer: { name: customer.name, phone: customer.phone_normalized, total_spins: customer.total_spins || 0 },
      spins: (spins || []).map(s => ({
        id: s.id,
        prize_name: s.prize_name,
        result_type: s.result_type,
        coupon_code: s.coupon_code,
        date: s.created_at
      })),
      coupons: (coupons || []).map(c => ({
        id: c.id,
        code: c.code,
        prize_name: c.prize_name,
        discount_value: c.discount_value,
        expiration_date: c.expiration_date,
        claimed: c.claimed
      }))
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
