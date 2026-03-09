"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  QrCode,
  Clock,
  Heart,
  ArrowUpRight,
  ArrowDownLeft,
  Bell,
  LogOut,
  Loader2,
  RefreshCw,
} from "lucide-react";
import BottomNav from "@/components/BottomNav";

export default function HomePage() {
  const [user, setUser] = useState(null);
  const [balance, setBalance] = useState("0.00");
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  const fetchData = useCallback(async () => {
    try {
      const [walletRes, txRes] = await Promise.all([
        fetch("/api/wallet/balance"),
        fetch("/api/transactions/mine?page=1&limit=5"),
      ]);

      if (walletRes.status === 401) {
        router.push("/login");
        return;
      }

      if (walletRes.ok) {
        const walletData = await walletRes.json();
        setUser(walletData.user);
        setBalance(walletData.balance);
      }

      if (txRes.ok) {
        const txData = await txRes.json();
        setTransactions(txData.transactions);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [router]);

  useEffect(() => {
    fetchData();
    // Poll balance every 10 seconds
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  };

  if (loading) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-[--color-bg]">
        <Loader2 className="w-8 h-8 animate-spin text-[--color-primary]" />
      </div>
    );
  }

  const quickActions = [
    { icon: QrCode, label: "Scan & Pay", href: "/scan", color: "#1A56DB" },
    { icon: Clock, label: "History", href: "/history", color: "#6B7280" },
    { icon: Heart, label: "Donate", href: "/donate", color: "#EC4899" },
  ];

  const getTransactionDisplay = (tx) => {
    if (tx.type === "topup") {
      return {
        icon: <ArrowDownLeft className="w-5 h-5 text-[--color-success]" />,
        label: "Top-up from Admin",
        amount: `+RM ${parseFloat(tx.amount).toFixed(2)}`,
        color: "var(--color-success)",
      };
    }
    if (tx.type === "donation") {
      return {
        icon: <Heart className="w-5 h-5 text-pink-500" />,
        label: "Donation to Charity",
        amount: `-RM ${parseFloat(tx.amount).toFixed(2)}`,
        color: "var(--color-error)",
      };
    }
    if (tx.direction === "debit") {
      return {
        icon: <ArrowUpRight className="w-5 h-5 text-[--color-error]" />,
        label: `Payment to ${tx.to_user?.stall_name || tx.to_user?.name || "Vendor"}`,
        amount: `-RM ${parseFloat(tx.amount).toFixed(2)}`,
        color: "var(--color-error)",
      };
    }
    return {
      icon: <ArrowDownLeft className="w-5 h-5 text-[--color-success]" />,
      label: `Received from ${tx.from_user?.name || "User"}`,
      amount: `+RM ${parseFloat(tx.amount).toFixed(2)}`,
      color: "var(--color-success)",
    };
  };

  return (
    <div className="min-h-dvh bg-[--color-bg] pb-24">
      {/* Top header */}
      <div
        className="px-5 pt-12 pb-6"
        style={{ background: "linear-gradient(135deg, #1A56DB 0%, #0EA5E9 100%)" }}
      >
        <div className="flex items-center justify-between mb-5">
          <h1 className="text-white text-lg font-semibold">
            Hi, {user?.name || "User"}
          </h1>
          <div className="flex items-center gap-3">
            <button onClick={handleRefresh} className="text-white/70 active:text-white">
              <RefreshCw className={`w-5 h-5 ${refreshing ? "animate-spin" : ""}`} />
            </button>
            <button onClick={handleLogout} className="text-white/70 active:text-white">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Balance card */}
        <div className="bg-white/15 backdrop-blur-sm rounded-2xl p-5 text-center">
          <p className="text-white/70 text-sm mb-1">E-Coupon Balance</p>
          <p className="text-white text-4xl font-bold">
            RM {parseFloat(balance).toFixed(2)}
          </p>
        </div>
      </div>

      {/* Quick actions */}
      <div className="px-5 -mt-4">
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <div className="flex justify-around">
            {quickActions.map((action) => (
              <button
                key={action.label}
                onClick={() => router.push(action.href)}
                className="flex flex-col items-center gap-2"
              >
                <div
                  className="w-14 h-14 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: "var(--color-primary-light)" }}
                >
                  <action.icon className="w-6 h-6" style={{ color: action.color }} />
                </div>
                <span className="text-xs font-medium text-[--color-text]">{action.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Recent transactions */}
      <div className="px-5 mt-4">
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-[--color-text]">Recent Activity</h2>
            <button
              onClick={() => router.push("/history")}
              className="text-sm text-[--color-primary] font-medium"
            >
              See All
            </button>
          </div>

          {transactions.length === 0 ? (
            <p className="text-sm text-[--color-text-secondary] text-center py-6">
              No transactions yet
            </p>
          ) : (
            <div className="space-y-3">
              {transactions.map((tx) => {
                const display = getTransactionDisplay(tx);
                return (
                  <div key={tx.tx_id} className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[--color-bg] flex items-center justify-center flex-shrink-0">
                      {display.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[--color-text] truncate">
                        {display.label}
                      </p>
                      <p className="text-xs text-[--color-text-secondary]">
                        {new Date(tx.created_at).toLocaleString("en-MY", {
                          hour: "2-digit",
                          minute: "2-digit",
                          day: "numeric",
                          month: "short",
                        })}
                      </p>
                    </div>
                    <span className="text-sm font-semibold" style={{ color: display.color }}>
                      {display.amount}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
