import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getAdminStats } from '@/api/spinApi';
import { Users, Repeat, Trophy, Ticket, Percent, Loader2, RefreshCw } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';

// At-a-glance metrics + a daily-spins chart + prize performance. Read-only.
export default function StatsOverview() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = () => {
    setRefreshing(true);
    getAdminStats()
      .then(setData)
      .catch(() => setData(null))
      .finally(() => { setLoading(false); setRefreshing(false); });
  };

  useEffect(() => { load(); }, []);

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  if (!data) return <p className="py-10 text-sm text-muted-foreground">Unable to load stats.</p>;

  const s = data.stats || {};
  const cards = [
    { label: 'Customers', value: s.totalCustomers, icon: Users },
    { label: 'Total spins', value: s.totalSpins, icon: Repeat },
    { label: 'Winners', value: s.totalWinners, icon: Trophy },
    { label: 'Prizes issued', value: s.totalPrizesIssued, icon: Ticket },
    { label: 'Claimed', value: s.claimedPrizes, icon: Percent },
    { label: 'This week', value: s.weekly, icon: Repeat },
  ];

  const chartData = (data.daily || []).filter((d) => d.count > 0).slice(-14);

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button onClick={load} variant="outline" size="sm" disabled={refreshing}>
          {refreshing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
          Refresh
        </Button>
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {cards.map((c) => (
          <Card key={c.label}>
            <CardContent className="p-4">
              <c.icon className="mb-2 h-4 w-4 text-muted-foreground" />
              <p className="text-2xl font-semibold">{c.value}</p>
              <p className="text-xs text-muted-foreground">{c.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Spins over time</CardTitle></CardHeader>
        <CardContent>
          {chartData.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No spins yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#a1a1aa' }} stroke="#3f3f46" />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#a1a1aa' }} stroke="#3f3f46" />
                <Tooltip contentStyle={{ background: '#18181b', border: '1px solid #3f3f46', borderRadius: 8, color: '#fafafa' }} />
                <Bar dataKey="count" fill="#8C193C" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Prize performance</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b text-left text-muted-foreground">
                <th className="py-2 pr-4">Prize</th><th className="py-2 pr-4">Won</th><th className="py-2 pr-4">Inventory</th><th className="py-2">Status</th>
              </tr></thead>
              <tbody>
                {(data.prizePerf || []).map((p) => (
                  <tr key={p.id} className="border-b last:border-0">
                    <td className="py-2 pr-4 font-medium">{p.name}</td>
                    <td className="py-2 pr-4">{p.won}</td>
                    <td className="py-2 pr-4">{p.inventory}</td>
                    <td className="py-2">{p.active ? 'Active' : 'Inactive'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}