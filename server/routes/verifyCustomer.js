import { supabase } from '../supabase.js';

export const verifyCustomerHandler = async (req, res) => {
  try {
    const { name: rawName, phone: rawPhone } = req.body;
    const name = (rawName || '').trim();
    const phoneRaw = (rawPhone || '').trim();
    
    if (name.length < 2) return res.status(400).json({ error: 'Please enter your full name.' });
    
    // Simplistic normalization (strip non-digits, optional + prefix). Adjust to original logic as needed.
    const phone = phoneRaw.replace(/[^\d+]/g, ''); 
    if (!phone) return res.status(400).json({ error: 'Please enter a valid phone number including the country code.' });

    let { data: found } = await supabase
      .from('customer')
      .select('*')
      .eq('phone_normalized', phone)
      .order('created_at', { ascending: false })
      .limit(5);

    let customer = found && found[0];
    if (!customer) {
      const { data: newCustomer } = await supabase
        .from('customer')
        .insert({
          name,
          phone_raw: phoneRaw,
          phone_normalized: phone,
          spins_in_cycle: 0,
          total_spins: 0
        })
        .select()
        .single();
      customer = newCustomer;
    } else if (customer.name !== name) {
      const { data: updatedCustomer } = await supabase
        .from('customer')
        .update({ name })
        .eq('id', customer.id)
        .select()
        .single();
      customer = updatedCustomer;
    }

    const { data: campaigns } = await supabase
      .from('campaign')
      .select('*')
      .eq('active', true)
      .order('created_at', { ascending: false })
      .limit(5);
      
    const campaign = campaigns && campaigns[0];
    if (!campaign) return res.status(404).json({ error: 'No active campaign available right now.' });

    const now = Date.now();
    const resetMs = (campaign.reset_days || 7) * 86400000;
    const max = campaign.max_spins || 2;
    let cycleStart = customer.cycle_start_date ? new Date(customer.cycle_start_date).getTime() : null;
    let cycleStartISO = customer.cycle_start_date || null;
    let spinsInCycle = customer.spins_in_cycle || 0;
    
    if (cycleStart && (now - cycleStart) >= resetMs) { 
      cycleStart = null; 
      cycleStartISO = null; 
      spinsInCycle = 0; 
    }

    const start = campaign.start_date ? new Date(campaign.start_date).getTime() : null;
    const end = campaign.end_date ? new Date(campaign.end_date).getTime() : null;
    const inRange = (!start || start <= now) && (!end || end >= now);

    let alreadyWon = false;
    if (cycleStartISO) {
      const { data: prior } = await supabase
        .from('spin')
        .select('*')
        .eq('customer_id', customer.id)
        .gte('created_at', cycleStartISO)
        .order('created_at', { ascending: false })
        .limit(50);
      alreadyWon = (prior || []).some((s) => s.result_type === 'won');
    }

    let remaining, resetAt;
    if (!cycleStart) { 
      remaining = max; 
      resetAt = null; 
    } else { 
      remaining = alreadyWon ? 0 : Math.max(0, max - spinsInCycle); 
      resetAt = new Date(cycleStart + resetMs).toISOString(); 
    }
    const canSpin = inRange && remaining > 0 && !alreadyWon;

    res.json({
      customerId: customer.id,
      name: customer.name,
      remainingSpins: remaining,
      maxSpins: max,
      canSpin,
      campaignActive: inRange,
      resetAt
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
