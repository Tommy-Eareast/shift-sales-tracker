import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabaseClient";
import { Card } from "../../components/ui/Card";

type DashboardStats = {
  totalShifts: number;
  totalUnits: number;
  totalRevenue: number;
  activePromoters: number;
};

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      setLoading(true);
      try {
        // Get total shifts
        const { count: shiftCount } = await supabase
          .from("shifts")
          .select("*", { count: "exact", head: true });

        // Get total units + revenue
        const { data: salesData } = await supabase
          .from("shift_sales")
          .select("sell_count, price_at_submit");
        const totalUnits = (salesData || []).reduce(
          (sum, s) => sum + s.sell_count,
          0,
        );
        const totalRevenue = (salesData || []).reduce(
          (sum, s) => sum + s.sell_count * s.price_at_submit,
          0,
        );

        // Count active promoters
        const { count: promoterCount } = await supabase
          .from("profiles")
          .select("*", { count: "exact", head: true })
          .eq("role", "promoter");

        setStats({
          totalShifts: shiftCount || 0,
          totalUnits,
          totalRevenue,
          activePromoters: promoterCount || 0,
        });
      } catch (err) {
        console.warn("Failed to load dashboard stats:", err);
      } finally {
        setLoading(false);
      }
    };
    loadStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-stone-400 text-sm">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Stats cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card>
          <p className="text-xs font-medium text-stone-400 uppercase tracking-wider">
            Total Shifts
          </p>
          <p className="text-2xl font-bold text-stone-900 mt-1 tracking-tight">
            {stats?.totalShifts || 0}
          </p>
        </Card>
        <Card>
          <p className="text-xs font-medium text-stone-400 uppercase tracking-wider">
            Units Sold
          </p>
          <p className="text-2xl font-bold text-stone-900 mt-1 tracking-tight">
            {stats?.totalUnits || 0}
          </p>
        </Card>
        <Card>
          <p className="text-xs font-medium text-stone-400 uppercase tracking-wider">
            Revenue
          </p>
          <p className="text-2xl font-bold text-emerald-600 mt-1 tracking-tight">
            ${(stats?.totalRevenue || 0).toFixed(2)}
          </p>
        </Card>
        <Card>
          <p className="text-xs font-medium text-stone-400 uppercase tracking-wider">
            Promoters
          </p>
          <p className="text-2xl font-bold text-stone-900 mt-1 tracking-tight">
            {stats?.activePromoters || 0}
          </p>
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
