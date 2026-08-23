import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const campaigns = await base44.asServiceRole.entities.Campaign.filter({ active: true }, '-created_date', 10);
    const campaign = campaigns && campaigns[0];
    if (!campaign) return Response.json({ error: 'No active campaign' }, { status: 404 });

    const now = Date.now();
    const start = campaign.start_date ? new Date(campaign.start_date).getTime() : null;
    const end = campaign.end_date ? new Date(campaign.end_date).getTime() : null;
    const inRange = (!start || start <= now) && (!end || end >= now);

    const prizes = await base44.asServiceRole.entities.Prize.filter({ active: true }, 'sort_order', 60);
    return Response.json({
      campaign: {
        id: campaign.id,
        name: campaign.name,
        logo_url: campaign.logo_url,
        background_url: campaign.background_url,
        headline: campaign.headline,
        subheadline: campaign.subheadline,
        cta_text: campaign.cta_text,
        primary_color: campaign.primary_color,
        accent_color: campaign.accent_color,
        ink_color: campaign.ink_color,
        max_spins: campaign.max_spins,
        reset_days: campaign.reset_days,
        redemption_instructions: campaign.redemption_instructions,
        terms: campaign.terms,
        win_message: campaign.win_message,
        lose_message: campaign.lose_message,
        claim_url: campaign.claim_url,
        active: inRange
      },
      prizes: prizes.map(p => ({
        id: p.id,
        name: p.name,
        image_url: p.image_url,
        discount_value: p.discount_value,
        sort_order: p.sort_order,
        is_try_again: p.is_try_again
      }))
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}