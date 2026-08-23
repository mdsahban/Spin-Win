import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Loader2 } from 'lucide-react';

// Two tables: customers (participation) and issued coupons (redemption).
// Toggling a coupon's "claimed" flag persists immediately.
export default function CustomerManager() {
  const [customers, setCustomers] = useState([]);
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const [c, cp] = await Promise.all([
      base44.entities.Customer.list('-created_date', 200),
      base44.entities.Coupon.list('-created_date', 200),
    ]);
    setCustomers(c || []);
    setCoupons(cp || []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const toggleClaimed = async (coupon) => {
    setCoupons((list) => list.map((x) => (x.id === coupon.id ? { ...x, claimed: !x.claimed } : x)));
    await base44.entities.Coupon.update(coupon.id, { claimed: !coupon.claimed, claimed_date: !coupon.claimed ? new Date().toISOString() : null });
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader><CardTitle className="text-base">Customers ({customers.length})</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b text-left text-muted-foreground">
                <th className="py-2 pr-4">Name</th><th className="py-2 pr-4">Phone</th><th className="py-2 pr-4">Spins (cycle)</th><th className="py-2 pr-4">Total</th><th className="py-2">Last spin</th>
              </tr></thead>
              <tbody>
                {customers.map((c) => (
                  <tr key={c.id} className="border-b last:border-0">
                    <td className="py-2 pr-4 font-medium">{c.name}</td>
                    <td className="py-2 pr-4">{c.phone_raw || c.phone_normalized}</td>
                    <td className="py-2 pr-4">{c.spins_in_cycle}</td>
                    <td className="py-2 pr-4">{c.total_spins}</td>
                    <td className="py-2">{c.last_spin_date ? new Date(c.last_spin_date).toLocaleDateString() : '—'}</td>
                  </tr>
                ))}
                {customers.length === 0 && <tr><td className="py-6 text-muted-foreground">No customers yet.</td></tr>}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Coupons ({coupons.length})</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b text-left text-muted-foreground">
                <th className="py-2 pr-4">Code</th><th className="py-2 pr-4">Customer</th><th className="py-2 pr-4">Prize</th><th className="py-2 pr-4">Expires</th><th className="py-2">Claimed</th>
              </tr></thead>
              <tbody>
                {coupons.map((c) => (
                  <tr key={c.id} className="border-b last:border-0">
                    <td className="py-2 pr-4 font-mono">{c.code}</td>
                    <td className="py-2 pr-4">{c.customer_name}</td>
                    <td className="py-2 pr-4">{c.prize_name}</td>
                    <td className="py-2 pr-4">{c.expiration_date}</td>
                    <td className="py-2"><Switch checked={!!c.claimed} onCheckedChange={() => toggleClaimed(c)} /></td>
                  </tr>
                ))}
                {coupons.length === 0 && <tr><td className="py-6 text-muted-foreground">No coupons issued yet.</td></tr>}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}