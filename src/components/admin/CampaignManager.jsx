import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Save } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

// Edits the most recent campaign. Text fields have English + Hindi variants;
// the public site shows the active language. Brand colours and assets are
// shared across both languages.
export default function CampaignManager() {
  const [campaign, setCampaign] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const load = async () => {
    const list = await base44.entities.Campaign.list('-created_date', 1);
    setCampaign(list && list[0] ? list[0] : null);
  };
  useEffect(() => { load(); }, []);

  const set = (field, value) => { setCampaign((c) => ({ ...c, [field]: value })); setSaved(false); };

  const save = async () => {
    setSaving(true);
    try {
      await base44.entities.Campaign.update(campaign.id, {
        name: campaign.name, name_hi: campaign.name_hi,
        headline: campaign.headline, headline_hi: campaign.headline_hi,
        subheadline: campaign.subheadline, subheadline_hi: campaign.subheadline_hi,
        cta_text: campaign.cta_text, cta_text_hi: campaign.cta_text_hi,
        logo_url: campaign.logo_url, background_url: campaign.background_url,
        primary_color: campaign.primary_color, accent_color: campaign.accent_color, ink_color: campaign.ink_color,
        claim_url: campaign.claim_url,
        win_message: campaign.win_message, win_message_hi: campaign.win_message_hi,
        lose_message: campaign.lose_message, lose_message_hi: campaign.lose_message_hi,
        redemption_instructions: campaign.redemption_instructions, redemption_instructions_hi: campaign.redemption_instructions_hi,
        terms: campaign.terms, terms_hi: campaign.terms_hi,
      });
      toast({ title: 'Campaign saved' });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (e) {
      toast({ title: 'Save failed', description: e.message, variant: 'destructive' });
    } finally { setSaving(false); }
  };

  if (!campaign) return <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin" /></div>;

  const pair = (key, label, hi = true) => (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
      <div>
        <Label className="text-xs">{label} (EN)</Label>
        <Input value={campaign[key] || ''} onChange={(e) => set(key, e.target.value)} />
      </div>
      {hi && (
        <div>
          <Label className="text-xs">{label} (HI)</Label>
          <Input value={campaign[key + '_hi'] || ''} onChange={(e) => set(key + '_hi', e.target.value)} />
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader><CardTitle className="text-base">Identity & visuals</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {pair('name', 'Campaign name')}
          <div><Label className="text-xs">Logo URL</Label><Input value={campaign.logo_url || ''} onChange={(e) => set('logo_url', e.target.value)} /></div>
          <div><Label className="text-xs">Background image URL</Label><Input value={campaign.background_url || ''} onChange={(e) => set('background_url', e.target.value)} /></div>
          <div><Label className="text-xs">Primary (brand) colour</Label><Input value={campaign.primary_color || ''} onChange={(e) => set('primary_color', e.target.value)} /></div>
          <div><Label className="text-xs">Accent (gold) colour</Label><Input value={campaign.accent_color || ''} onChange={(e) => set('accent_color', e.target.value)} /></div>
          <div><Label className="text-xs">Ink (text) colour</Label><Input value={campaign.ink_color || ''} onChange={(e) => set('ink_color', e.target.value)} /></div>
          <div><Label className="text-xs">Claim / shop URL</Label><Input value={campaign.claim_url || ''} onChange={(e) => set('claim_url', e.target.value)} /></div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Headline & CTA</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {pair('headline', 'Headline')}
          {pair('subheadline', 'Subheadline')}
          {pair('cta_text', 'CTA text')}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Messages</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div><Label className="text-xs">Win message (EN)</Label><Textarea value={campaign.win_message || ''} onChange={(e) => set('win_message', e.target.value)} rows={2} /></div>
          <div><Label className="text-xs">Win message (HI)</Label><Textarea value={campaign.win_message_hi || ''} onChange={(e) => set('win_message_hi', e.target.value)} rows={2} /></div>
          <div><Label className="text-xs">Lose message (EN)</Label><Textarea value={campaign.lose_message || ''} onChange={(e) => set('lose_message', e.target.value)} rows={2} /></div>
          <div><Label className="text-xs">Lose message (HI)</Label><Textarea value={campaign.lose_message_hi || ''} onChange={(e) => set('lose_message_hi', e.target.value)} rows={2} /></div>
          <div><Label className="text-xs">Redemption instructions (EN)</Label><Textarea value={campaign.redemption_instructions || ''} onChange={(e) => set('redemption_instructions', e.target.value)} rows={3} /></div>
          <div><Label className="text-xs">Redemption instructions (HI)</Label><Textarea value={campaign.redemption_instructions_hi || ''} onChange={(e) => set('redemption_instructions_hi', e.target.value)} rows={3} /></div>
          <div><Label className="text-xs">Terms (EN)</Label><Textarea value={campaign.terms || ''} onChange={(e) => set('terms', e.target.value)} rows={3} /></div>
          <div><Label className="text-xs">Terms (HI)</Label><Textarea value={campaign.terms_hi || ''} onChange={(e) => set('terms_hi', e.target.value)} rows={3} /></div>
        </CardContent>
      </Card>

      <div className="flex items-center gap-3">
        <Button onClick={save} disabled={saving}>{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save campaign</Button>
        {saved && <span className="text-sm text-green-600">Saved</span>}
      </div>
    </div>
  );
}