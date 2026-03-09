"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, DollarSign, ShoppingBag, Heart, Wallet, Users, Loader2 } from "lucide-react";

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch("/api/dashboard/stats");
      if (res.status === 401 || res.status === 403) {
        router.push("/login");
        return;
      }
      if (res.ok) {
        setStats(await res.json());
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, [fetchStats]);

  if (loading) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-[--color-bg]">
        <Loader2 className="w-8 h-8 animate-spin text-[--color-primary]" />
      </div>
    );
  }

  const cards = [
    {
      icon: DollarSign,
      label: "Total Collected",
      value: `RM ${stats?.total_collected || "0.00"}`,
      color: "#1D4ED8",
      bg: "#DBEAFE",
    },
    {
      icon: ShoppingBag,
      label: "Total Spent",
      value: `RM ${stats?.total_spent || "0.00"}`,
      color: "#059669",
      bg: "#D1FAE5",
    },
    {
      icon: Heart,
      label: "Total Donated",
      value: `RM ${stats?.total_donated || "0.00"}`,
      color: "#DB2777",
      bg: "#FCE7F3",
    },
    {
      icon: Wallet,
      label: "Remaining in Wallets",
      value: `RM ${stats?.remaining || "0.00"}`,
      color: "#D97706",
      bg: "#FEF3C7",
    },
    {
      icon: Users,
      label: "Active Users Today",
      value: stats?.active_users || 0,
      color: "#7C3AED",
      bg: "#EDE9FE",
    },
  ];

  return (
    <div className="min-h-dvh bg-[--color-bg] pb-6">
      <div className="flex items-center gap-3 px-4 pt-12 pb-4 bg-white border-b border-[--color-border]">
        <button onClick={() => router.push("/admin")} className="p-1">
          <ArrowLeft className="w-6 h-6 text-[--color-text]" />
        </button>
        <h1 className="font-bold text-lg text-[--color-text]">Live Dashboard</h1>
      </div>

      <div className="px-5 py-4 space-y-3">
        {cards.map((card) => (
          <div key={card.label} className="bg-white rounded-2xl p-5 shadow-sm flex items-center gap-4">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: card.bg }}
            >
              <card.icon className="w-6 h-6" style={{ color: card.color }} />
            </div>
            <div>
              <p className="text-sm text-[--color-text-secondary]">{card.label}</p>
              <p className="text-xl font-bold text-[--color-text]">{card.value}</p>
            </div>
          </div>
        ))}

        {/* Top vendors */}
        {stats?.top_vendors?.length > 0 && (
          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <h3 className="font-semibold text-[--color-text] mb-3">Top 5 Vendors</h3>
            <div className="space-y-3">
              {stats.top_vendors.map((v, i) => {
                const maxEarnings = stats.top_vendors[0]?.earnings || 1;
                return (
                  <div key={v.user_id} className="flex items-center gap-3">
                    <span className="w-6 text-sm font-bold text-[--color-text-secondary]">
                      #{i + 1}
                    </span>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-[--color-text] truncate">
                        {v.stall_name || v.name}
                      </p>
                      <div className="w-full h-2 bg-[--color-bg] rounded-full mt-1 overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${(v.earnings / maxEarnings) * 100}%`,
                            backgroundColor: "var(--color-primary)",
                          }}
                        />
                      </div>
                    </div>
                    <span className="text-sm font-bold text-[--color-text]">
                      RM {v.earnings.toFixed(2)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <p className="text-xs text-center text-[--color-text-secondary]">
          Auto-refreshes every 30 seconds
        </p>
      </div>
    </div>
  );
}
