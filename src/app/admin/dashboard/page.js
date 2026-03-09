"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, DollarSign, ShoppingBag, Heart, Wallet, Users, Loader2, TrendingUp } from "lucide-react";

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch("/api/dashboard/stats");
      if (res.status === 401 || res.status === 403) { router.push("/login"); return; }
      if (res.ok) setStats(await res.json());
    } catch {} finally { setLoading(false); }
  }, [router]);

  useEffect(() => { fetchStats(); const i = setInterval(fetchStats, 30000); return () => clearInterval(i); }, [fetchStats]);

  if (loading) return <div className="min-h-dvh flex items-center justify-center bg-[--color-bg]"><Loader2 className="w-7 h-7 animate-spin text-[--color-primary]" /></div>;

  const cards = [
    { icon: DollarSign, label: "Total Collected", value: `RM ${stats?.total_collected || "0.00"}`, gradient: "linear-gradient(135deg, #2563EB, #3B82F6)", shadow: "rgba(37,99,235,0.2)" },
    { icon: ShoppingBag, label: "Total Spent", value: `RM ${stats?.total_spent || "0.00"}`, gradient: "linear-gradient(135deg, #10B981, #34D399)", shadow: "rgba(16,185,129,0.2)" },
    { icon: Heart, label: "Total Donated", value: `RM ${stats?.total_donated || "0.00"}`, gradient: "linear-gradient(135deg, #EC4899, #F472B6)", shadow: "rgba(236,72,153,0.2)" },
    { icon: Wallet, label: "Remaining in Wallets", value: `RM ${stats?.remaining || "0.00"}`, gradient: "linear-gradient(135deg, #F59E0B, #FBBF24)", shadow: "rgba(245,158,11,0.2)" },
    { icon: Users, label: "Active Users Today", value: stats?.active_users || 0, gradient: "linear-gradient(135deg, #8B5CF6, #A78BFA)", shadow: "rgba(139,92,246,0.2)" },
  ];

  return (
    <div className="min-h-dvh bg-[--color-bg] pb-6">
      <div className="bg-white px-4 pt-14 pb-4 flex items-center gap-3" style={{ boxShadow: "0 1px 3px var(--color-card-shadow)" }}>
        <button onClick={() => router.push("/admin")} className="w-10 h-10 rounded-xl bg-[--color-bg] flex items-center justify-center"><ArrowLeft className="w-5 h-5 text-[--color-text]" /></button>
        <h1 className="font-bold text-[18px] text-[--color-text]">Live Dashboard</h1>
      </div>

      <div className="px-5 py-4 stagger">
        {cards.map((card) => (
          <div key={card.label} className="card p-4 mb-3 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: card.gradient, boxShadow: `0 4px 12px ${card.shadow}` }}>
              <card.icon className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-[12px] text-[--color-text-tertiary] font-medium">{card.label}</p>
              <p className="text-[22px] font-bold text-[--color-text] tabular-nums leading-tight">{card.value}</p>
            </div>
          </div>
        ))}

        {stats?.top_vendors?.length > 0 && (
          <div className="card p-5 mt-1">
            <h3 className="font-bold text-[16px] text-[--color-text] mb-4 flex items-center gap-2"><TrendingUp className="w-5 h-5 text-[--color-primary]" />Top 5 Vendors</h3>
            <div className="space-y-3.5">
              {stats.top_vendors.map((v, i) => {
                const maxE = stats.top_vendors[0]?.earnings || 1;
                const colors = ["#2563EB", "#6366F1", "#8B5CF6", "#EC4899", "#F59E0B"];
                return (
                  <div key={v.user_id} className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center text-[12px] font-bold text-white flex-shrink-0" style={{ background: colors[i] }}>
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1.5">
                        <p className="text-[13px] font-semibold text-[--color-text] truncate">{v.stall_name || v.name}</p>
                        <span className="text-[13px] font-bold text-[--color-text] tabular-nums ml-2">RM {v.earnings.toFixed(2)}</span>
                      </div>
                      <div className="w-full h-2 bg-[--color-bg] rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${(v.earnings / maxE) * 100}%`, background: colors[i] }} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <p className="text-[11px] text-center text-[--color-text-tertiary] mt-4">Auto-refreshes every 30 seconds</p>
      </div>
    </div>
  );
}
