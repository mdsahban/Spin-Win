import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Save } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

// Dedicated game-rules configuration: spin limits, reset window, campaign
// scheduling, active toggle and terms. Saves ONLY these fields so it never
// clobbers the branding/copy edited in CampaignManager.
export default function RuleManager() {
  const [campaign, setCampaign] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const list = await base44.entities.Campaign.list('-created_date', 1);
    setCampaign(list && list[0] ? list[0] : null);
  };
  useEffect(() => { load(); }, []);

  const set = (field, value) => setCampaign((c) => ({ ...c, [field]: value }));

  const save = async () => {
    setSaving(true);
    try {
      await base44.entities.Campaign.update(campaign.id, {
        max_spins: Number(campaign.max_spins) || 2,
        reset_days: Number(campaign.reset_days) || 7,
        start_date: campaign.start_date || null,
        end_date: campaign.end_date || null,
        active: !!campaign.active,
        terms: campaign.terms || '',
      });
      toast({ title: 'Rules saved' });
    } catch (e) {
      toast({ title: 'Save failed', description: e.message, variant: 'destructive' });
    } finally { setSaving(false); }
  };

  if (!campaign) return <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin" /></div>;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader><CardTitle className="text-base">Spin limits</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <Label className="text-xs">Max spins per cycle</Label>
            <Input type="number" value={campaign.max_spins ?? 2} onChange={(e) => set('max_spins', e.target.value)} />
          </div>
          <div>
            <Label className="text-xs">Reset window (days)</Label>
            <Input type="number" value={campaign.reset_days ?? 7} onChange={(e) => set('reset_days', e.target.value)} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Campaign schedule</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <Label className="text-xs">Start date</Label>
            <Input type="datetime-local" value={campaign.start_date ? campaign.start_date.slice(0, 16) : ''} onChange={(e) => set('start_date', e.target.value ? new Date(e.target.value).toISOString() : null)} />
          </div>
          <div>
            <Label className="text-xs">End date</Label>
            <Input type="datetime-local" value={campaign.end_date ? campaign.end_date.slice(0, 16) : ''} onChange={(e) => set('end_date', e.target.value ? new Date(e.target.value).toISOString() : null)} />
          </div>
          <div className="flex items-center gap-2 sm:col-span-2">
            <Switch checked={!!campaign.active} onCheckedChange={(v) => set('active', v)} />
            <Label className="text-xs">Campaign active</Label>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Terms & conditions</CardTitle></CardHeader>
        <CardContent>
          <Textarea value={campaign.terms || ''} onChange={(e) => set('terms', e.target.value)} rows={6} />
        </CardContent>
      </Card>

      <Button onClick={save} disabled={saving}>{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save rules</Button>
    </div>
  );
}