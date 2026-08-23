import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Plus, Trash2, Save } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

// CRUD for prizes. Each prize has English + Hindi text, an emoji icon and an
// optional image (shown on the wheel). Probabilities should sum to ~100.
export default function PrizeManager() {
  const [prizes, setPrizes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(null);

  const load = async () => {
    setLoading(true);
    const list = await base44.entities.Prize.list('-sort_order', 100);
    setPrizes(list || []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const update = (id, field, value) => {
    setPrizes((p) => p.map((x) => (x.id === id ? { ...x, [field]: value } : x)));
  };

  const save = async (p) => {
    setSaving(p.id);
    try {
      await base44.entities.Prize.update(p.id, {
        name: p.name, name_hi: p.name_hi,
        description: p.description, description_hi: p.description_hi,
        discount_value: p.discount_value, discount_value_hi: p.discount_value_hi,
        icon: p.icon, image_url: p.image_url,
        probability: Number(p.probability) || 0,
        inventory: Number(p.inventory) || 0,
        sort_order: Number(p.sort_order) || 0,
        active: !!p.active, is_try_again: !!p.is_try_again,
      });
      toast({ title: 'Prize saved', description: p.name || 'Untitled' });
    } catch (e) {
      toast({ title: 'Save failed', description: e.message, variant: 'destructive' });
    } finally { setSaving(null); }
  };

  const add = async () => {
    try {
      await base44.entities.Prize.create({ name: 'New Prize', probability: 0, inventory: 0, sort_order: prizes.length, active: true });
      toast({ title: 'Prize added' });
      load();
    } catch (e) {
      toast({ title: 'Add failed', description: e.message, variant: 'destructive' });
    }
  };

  const remove = async (id) => {
    if (!confirm('Delete this prize?')) return;
    try {
      await base44.entities.Prize.delete(id);
      toast({ title: 'Prize deleted' });
      load();
    } catch (e) {
      toast({ title: 'Delete failed', description: e.message, variant: 'destructive' });
    }
  };

  const totalProb = prizes.reduce((s, p) => s + (Number(p.probability) || 0), 0);

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Probability total: <span className={Math.abs(totalProb - 100) < 1 ? 'text-green-600 font-medium' : 'text-amber-600 font-medium'}>{totalProb}%</span></p>
        <Button onClick={add} size="sm"><Plus className="mr-1 h-4 w-4" /> Add prize</Button>
      </div>

      {prizes.map((p) => (
        <Card key={p.id}>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{p.icon || '🎁'}</span>
              <CardTitle className="text-base">{p.name || 'Untitled'}</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div><Label className="text-xs">Name (EN)</Label><Input value={p.name || ''} onChange={(e) => update(p.id, 'name', e.target.value)} /></div>
            <div><Label className="text-xs">Name (HI)</Label><Input value={p.name_hi || ''} onChange={(e) => update(p.id, 'name_hi', e.target.value)} /></div>
            <div><Label className="text-xs">Icon (emoji)</Label><Input value={p.icon || ''} onChange={(e) => update(p.id, 'icon', e.target.value)} placeholder="👕" /></div>
            <div><Label className="text-xs">Discount value (EN)</Label><Input value={p.discount_value || ''} onChange={(e) => update(p.id, 'discount_value', e.target.value)} placeholder="Free T-Shirt" /></div>
            <div><Label className="text-xs">Discount value (HI)</Label><Input value={p.discount_value_hi || ''} onChange={(e) => update(p.id, 'discount_value_hi', e.target.value)} /></div>
            <div><Label className="text-xs">Image URL (optional)</Label><Input value={p.image_url || ''} onChange={(e) => update(p.id, 'image_url', e.target.value)} placeholder="https://…" /></div>
            <div><Label className="text-xs">Description (EN)</Label><Input value={p.description || ''} onChange={(e) => update(p.id, 'description', e.target.value)} /></div>
            <div><Label className="text-xs">Description (HI)</Label><Input value={p.description_hi || ''} onChange={(e) => update(p.id, 'description_hi', e.target.value)} /></div>
            <div><Label className="text-xs">Probability (%)</Label><Input type="number" value={p.probability ?? 0} onChange={(e) => update(p.id, 'probability', e.target.value)} /></div>
            <div><Label className="text-xs">Inventory</Label><Input type="number" value={p.inventory ?? 0} onChange={(e) => update(p.id, 'inventory', e.target.value)} /></div>
            <div><Label className="text-xs">Sort order</Label><Input type="number" value={p.sort_order ?? 0} onChange={(e) => update(p.id, 'sort_order', e.target.value)} /></div>
            <div className="flex items-center gap-2 pt-6"><Switch checked={!!p.active} onCheckedChange={(v) => update(p.id, 'active', v)} /><Label className="text-xs">Active</Label></div>
            <div className="flex items-center gap-2 pt-6"><Switch checked={!!p.is_try_again} onCheckedChange={(v) => update(p.id, 'is_try_again', v)} /><Label className="text-xs">Try-again</Label></div>
            <div className="flex items-end gap-2">
              <Button onClick={() => save(p)} disabled={saving === p.id} size="sm">{saving === p.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save</Button>
              <Button onClick={() => remove(p.id)} variant="outline" size="sm"><Trash2 className="h-4 w-4" /></Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}