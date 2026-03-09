"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Plus, ScanLine, Clock, Heart,
  ChevronRight, LogOut, Loader2, RefreshCw,
  Eye, EyeOff,
} from "lucide-react";
import BottomNav from "@/components/BottomNav";

export default function HomePage() {
  const [user, setUser] = useState(null);
  const [balance, setBalance] = useState("0.00");
  const [totalReceived, setTotalReceived] = useState("0.00");
  const [totalSpent, setTotalSpent] = useState("0.00");
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [balanceVisible, setBalanceVisible] = useState(true);
  const router = useRouter();

  const fetchData = useCallback(async () => {
    try {
      const [walletRes, txRes] = await Promise.all([
        fetch("/api/wallet/balance"),
        fetch("/api/transactions/mine?page=1&limit=5"),
      ]);
      if (walletRes.status === 401) { router.push("/login"); return; }
      if (walletRes.ok) {
        const d = await walletRes.json();
        setUser(d.user);
        setBalance(d.balance);
        setTotalReceived(d.total_received);
        setTotalSpent(d.total_spent);
      }
      if (txRes.ok) { const d = await txRes.json(); setTransactions(d.transactions); }
    } catch {} finally { setLoading(false); setRefreshing(false); }
  }, [router]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  };

  if (loading) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-[--color-background]">
        <Loader2 className="w-7 h-7 animate-spin text-[--color-primary]" />
      </div>
    );
  }

  const quickActions = [
    { icon: Plus, label: "Receive", href: "/home" },
    { icon: ScanLine, label: "Scan to Pay", href: "/scan" },
    { icon: Clock, label: "History", href: "/history" },
    { icon: Heart, label: "Donate", href: "/donate" },
  ];

  const getDisplay = (tx) => {
    if (tx.type === "topup") return { letter: "T", label: "Top-up", sub: "From Admin", amount: `+RM ${parseFloat(tx.amount).toFixed(2)}`, color: "#10B981", letterBg: "rgba(16,185,129,0.1)" };
    if (tx.type === "donation") return { letter: "D", label: "Donation", sub: "To Charity", amount: `-RM ${parseFloat(tx.amount).toFixed(2)}`, color: "#EC4899", letterBg: "rgba(236,72,153,0.1)" };
    if (tx.direction === "debit") return { letter: (tx.to_user?.stall_name || tx.to_user?.name || "V")[0].toUpperCase(), label: tx.to_user?.stall_name || tx.to_user?.name || "Vendor", sub: "Payment", amount: `-RM ${parseFloat(tx.amount).toFixed(2)}`, color: "#EF4444", letterBg: "rgba(239,68,68,0.1)" };
    return { letter: (tx.from_user?.name || "U")[0].toUpperCase(), label: tx.from_user?.name || "User", sub: "Received", amount: `+RM ${parseFloat(tx.amount).toFixed(2)}`, color: "#10B981", letterBg: "rgba(16,185,129,0.1)" };
  };

  const spent = parseFloat(totalSpent);
  const received = parseFloat(totalReceived);
  const total = spent + received;
  const receivedPct = total > 0 ? ((received / total) * 100).toFixed(1) : "0.0";

  return (
    <div className="h-dvh flex flex-col bg-[--color-background]">
      {/* ===== TOP SECTION — 70% ===== */}
      <div className="flex-[7] flex flex-col justify-between px-5 pt-14 pb-4">
        {/* Header nav */}
        <div className="flex items-center justify-between">
          <button onClick={() => { setRefreshing(true); fetchData(); }} className="w-9 h-9 flex items-center justify-center">
            <RefreshCw className={`w-[18px] h-[18px] text-[--color-text-tertiary] ${refreshing ? "animate-spin" : ""}`} />
          </button>

          {/* Profile avatar */}
          <div className="w-11 h-11 rounded-full flex items-center justify-center gradient-primary shadow-md">
            <span className="text-white font-bold text-[15px]">{(user?.name || "U")[0].toUpperCase()}</span>
          </div>

          <button onClick={handleLogout} className="w-9 h-9 flex items-center justify-center">
            <LogOut className="w-[18px] h-[18px] text-[--color-text-tertiary]" />
          </button>
        </div>

        {/* Balance card */}
        <div className="rounded-2xl p-6 text-white text-center" style={{ background: "linear-gradient(135deg, #2563EB 0%, #7C3AED 100%)", boxShadow: "0 8px 32px rgba(37, 99, 235, 0.3)" }}>
          <div className="flex items-center justify-center gap-2 mb-2">
            <span className="text-[13px] font-medium text-white/60">E-Coupon Balance</span>
            <button onClick={() => setBalanceVisible(!balanceVisible)} className="text-white/40">
              {balanceVisible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            </button>
          </div>

          <p className="text-[42px] font-bold tracking-tight leading-none mb-4">
            {balanceVisible ? <>RM {parseFloat(balance).toFixed(2)}</> : <>RM ••••••</>}
          </p>

          {/* Stats row */}
          <div className="flex justify-center gap-6 text-[12px] font-semibold text-white/70">
            <span>+ {receivedPct}% received</span>
            <span>+ RM {received.toFixed(2)}</span>
          </div>
        </div>

        {/* Quick action buttons */}
        <div className="flex justify-around px-3">
          {quickActions.map((a) => (
            <button key={a.label} onClick={() => router.push(a.href)} className="flex flex-col items-center gap-2 group">
              <div className="w-[52px] h-[52px] rounded-2xl flex items-center justify-center transition-transform group-active:scale-90 bg-[--color-primary-light] border border-[--color-border-light]">
                <a.icon className="w-[20px] h-[20px] text-[--color-primary]" strokeWidth={2.2} />
              </div>
              <span className="text-[11px] font-medium text-[--color-text-secondary]">{a.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ===== BOTTOM SECTION — 30% ===== */}
      <div className="flex-[3] flex flex-col min-h-0 px-5 pb-24">
        <div className="flex items-center justify-between mb-3 px-1 flex-shrink-0">
          <h2 className="text-[16px] font-bold text-[--color-text]">Past Transactions</h2>
          <button onClick={() => router.push("/history")} className="flex items-center gap-0.5 text-[13px] font-semibold text-[--color-primary]">
            See All <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar">
          {transactions.length === 0 ? (
            <div className="p-10 text-center rounded-2xl card">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3 bg-[--color-secondary]">
                <Clock className="w-6 h-6 text-[--color-text-tertiary]" />
              </div>
              <p className="text-[14px] font-medium text-[--color-text-secondary]">No transactions yet</p>
              <p className="text-[12px] mt-1 text-[--color-text-tertiary]">Your activity will appear here</p>
            </div>
          ) : (
            <div className="space-y-2.5 stagger">
              {transactions.map((tx) => {
                const d = getDisplay(tx);
                return (
                  <div
                    key={tx.tx_id}
                    className="flex items-center gap-3.5 px-4 py-3.5 rounded-2xl card"
                  >
                    <div
                      className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 text-[16px] font-bold"
                      style={{ backgroundColor: d.letterBg, color: d.color }}
                    >
                      {d.letter}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[14px] font-semibold text-[--color-text] truncate">{d.label}</p>
                      <p className="text-[12px] text-[--color-text-tertiary]">{d.sub}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-[14px] font-bold tabular-nums" style={{ color: d.color }}>{d.amount}</p>
                      <p className="text-[11px] tabular-nums text-[--color-text-tertiary]">
                        {new Date(tx.created_at).toLocaleString("en-MY", { hour: "2-digit", minute: "2-digit", day: "numeric", month: "short" })}
                      </p>
                    </div>
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
