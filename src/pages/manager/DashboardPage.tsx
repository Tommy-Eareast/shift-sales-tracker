import { useState, useEffect } from 'react';
import { getSupabase } from '../../lib/supabaseClient';
import { Card } from '../../components/ui/Card';
import { Skeleton } from '../../components/ui/Skeleton';

const supabase = getSupabase();

type DashboardStats = { totalShifts: number; totalUnits: number; totalRevenue: number; activePromoters: number };

export default function DashboardPage() {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadStats = async () => {
            setLoading(true);
            try {
                const { count: shiftCount } = await supabase.from('shifts').select('*', { count: 'exact', head: true });

                const { data: salesData } = await supabase.from('shift_sales').select('sell_count, price_at_submit');

                const totalUnits = (salesData || []).reduce(
                    (sum: number, s: { sell_count: number }) => sum + s.sell_count,
                    0
                );
                const totalRevenue = (salesData || []).reduce(
                    (sum: number, s: { sell_count: number; price_at_submit: number }) =>
                        sum + s.sell_count * s.price_at_submit,
                    0
                );

                const { count: promoterCount } = await supabase
                    .from('profiles')
                    .select('*', { count: 'exact', head: true })
                    .eq('role', 'promoter');

                setStats({
                    totalShifts: shiftCount || 0,
                    totalUnits,
                    totalRevenue,
                    activePromoters: promoterCount || 0,
                });
            } catch (err) {
                console.warn('Failed to load dashboard stats:', err);
            } finally {
                setLoading(false);
            }
        };
        loadStats();
    }, []);

    return (
        <div className="space-y-4">
            {/* Stats cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <Card>
                    <p className="text-xs font-medium text-stone-400 uppercase tracking-wider">Total Shifts</p>
                    {loading ? (
                        <Skeleton rows={1} height="h-8" className="mt-1" />
                    ) : (
                        <p className="text-2xl font-bold text-stone-900 mt-1 tracking-tight">
                            {stats?.totalShifts || 0}
                        </p>
                    )}
                </Card>
                <Card>
                    <p className="text-xs font-medium text-stone-400 uppercase tracking-wider">Units Sold</p>
                    {loading ? (
                        <Skeleton rows={1} height="h-8" className="mt-1" />
                    ) : (
                        <p className="text-2xl font-bold text-stone-900 mt-1 tracking-tight">
                            {stats?.totalUnits || 0}
                        </p>
                    )}
                </Card>
                <Card>
                    <p className="text-xs font-medium text-stone-400 uppercase tracking-wider">Revenue</p>
                    {loading ? (
                        <Skeleton rows={1} height="h-8" className="mt-1" />
                    ) : (
                        <p className="text-2xl font-bold text-emerald-600 mt-1 tracking-tight">
                            ${(stats?.totalRevenue || 0).toFixed(2)}
                        </p>
                    )}
                </Card>
                <Card>
                    <p className="text-xs font-medium text-stone-400 uppercase tracking-wider">Promoters</p>
                    {loading ? (
                        <Skeleton rows={1} height="h-8" className="mt-1" />
                    ) : (
                        <p className="text-2xl font-bold text-stone-900 mt-1 tracking-tight">
                            {stats?.activePromoters || 0}
                        </p>
                    )}
                </Card>
            </div>

            {/* Placeholder for charts */}
            <Card className="p-8 text-center">
                <h3 className="font-semibold text-stone-900 mb-2">Analytics</h3>
                <p className="text-stone-400 text-sm">
                    Charts and trends will be added here.
                    <br />
                    Showing basic stats for now.
                </p>
            </Card>
        </div>
    );
}
