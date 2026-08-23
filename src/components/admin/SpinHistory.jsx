import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, RefreshCw } from 'lucide-react';

// Full spin log across the campaign — extends admin visibility beyond the
// aggregate dashboard. Reads via the admin user's token (Spin RLS = admin).
export default function SpinHistory() {
  const [spins, setSpins] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const list = await base44.entities.Spin.list('-created_date', 100);
      setSpins(list || []);
    } catch (e) {
      setSpins([]);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base">Recent spins</CardTitle>
        <Button onClick={load} variant="outline" size="sm" disabled={loading}>
          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />} Refresh
        </Button>
      </CardHeader>
      <CardContent>
        {loading && spins.length === 0 ? (
          <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin" /></div>
        ) : spins.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">No spins yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="pb-2 pr-4">Date</th>
                  <th className="pb-2 pr-4">Phone</th>
                  <th className="pb-2 pr-4">Result</th>
                  <th className="pb-2 pr-4">Prize</th>
                  <th className="pb-2">Coupon</th>
                </tr>
              </thead>
              <tbody>
                {spins.map(s => (
                  <tr key={s.id} className="border-t border-border/60">
                    <td className="py-2.5 pr-4 text-muted-foreground">{new Date(s.created_date).toLocaleString()}</td>
                    <td className="py-2.5 pr-4">{s.phone_normalized || '—'}</td>
                    <td className="py-2.5 pr-4">
                      {s.result_type === 'won' ? <Badge className="bg-emerald-600 text-white">Won</Badge> : <Badge variant="secondary">Try again</Badge>}
                    </td>
                    <td className="py-2.5 pr-4">{s.prize_name || '—'}</td>
                    <td className="py-2.5 font-mono text-xs">{s.coupon_code || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}