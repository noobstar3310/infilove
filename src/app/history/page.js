"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ArrowUpRight, ArrowDownLeft, Heart, Loader2 } from "lucide-react";
import BottomNav from "@/components/BottomNav";

export default function HistoryPage() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const router = useRouter();

  const fetchTransactions = useCallback(async (pageNum, append = false) => {
    try {
      const res = await fetch(`/api/transactions/mine?page=${pageNum}&limit=20`);
      if (res.status === 401) { router.push("/login"); return; }
      if (res.ok) {
        const data = await res.json();
        setTransactions((prev) => append ? [...prev, ...data.transactions] : data.transactions);
        setHasMore(data.transactions.length === 20);
      }
    } catch {} finally { setLoading(false); setLoadingMore(false); }
  }, [router]);

  useEffect(() => { fetchTransactions(1); }, [fetchTransactions]);

  const loadMore = () => { const next = page + 1; setPage(next); setLoadingMore(true); fetchTransactions(next, true); };

  const getDisplay = (tx) => {
    if (tx.type === "topup") return { icon: <ArrowDownLeft className="w-[18px] h-[18px]" />, label: "Top-up from Admin", amount: `+RM ${parseFloat(tx.amount).toFixed(2)}`, color: "#10B981", bg: "#D1FAE5" };
    if (tx.type === "donation") return { icon: <Heart className="w-[18px] h-[18px]" />, label: "Donation to Charity", amount: `-RM ${parseFloat(tx.amount).toFixed(2)}`, color: "#EC4899", bg: "#FCE7F3" };
    if (tx.direction === "debit") return { icon: <ArrowUpRight className="w-[18px] h-[18px]" />, label: `Payment to ${tx.to_user?.stall_name || tx.to_user?.name || "Vendor"}`, amount: `-RM ${parseFloat(tx.amount).toFixed(2)}`, color: "#EF4444", bg: "#FEE2E2" };
    return { icon: <ArrowDownLeft className="w-[18px] h-[18px]" />, label: `Received from ${tx.from_user?.name || "User"}`, amount: `+RM ${parseFloat(tx.amount).toFixed(2)}`, color: "#10B981", bg: "#D1FAE5" };
  };

  const grouped = {};
  transactions.forEach((tx) => {
    const date = new Date(tx.created_at).toLocaleDateString("en-MY", { day: "numeric", month: "long", year: "numeric" });
    if (!grouped[date]) grouped[date] = [];
    grouped[date].push(tx);
  });

  if (loading) return <div className="min-h-dvh flex items-center justify-center bg-[--color-bg]"><Loader2 className="w-7 h-7 animate-spin text-[--color-primary]" /></div>;

  return (
    <div className="min-h-dvh bg-[--color-bg] pb-28">
      <div className="gradient-primary px-5 pt-14 pb-6" style={{ borderRadius: "0 0 28px 28px" }}>
        <h1 className="text-[22px] font-bold text-white">Transaction History</h1>
        <p className="text-white/60 text-[13px] mt-1">All your transactions in one place</p>
      </div>

      <div className="px-5 mt-5">
        {Object.keys(grouped).length === 0 ? (
          <div className="card p-10 text-center">
            <div className="w-14 h-14 rounded-2xl bg-[--color-bg] flex items-center justify-center mx-auto mb-3">
              <ArrowUpRight className="w-6 h-6 text-[--color-text-tertiary]" />
            </div>
            <p className="text-[14px] text-[--color-text-secondary] font-medium">No transactions yet</p>
          </div>
        ) : (
          Object.entries(grouped).map(([date, txs]) => (
            <div key={date} className="mb-5">
              <p className="text-[12px] font-semibold text-[--color-text-tertiary] mb-2 px-1 uppercase tracking-wide">{date}</p>
              <div className="card overflow-hidden">
                {txs.map((tx, i) => {
                  const d = getDisplay(tx);
                  return (
                    <div key={tx.tx_id} className={`flex items-center gap-3 px-4 py-3.5 ${i < txs.length - 1 ? "border-b border-[--color-border-light]" : ""}`}>
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: d.bg, color: d.color }}>{d.icon}</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[14px] font-semibold text-[--color-text] truncate">{d.label}</p>
                        <p className="text-[12px] text-[--color-text-tertiary]">{new Date(tx.created_at).toLocaleTimeString("en-MY", { hour: "2-digit", minute: "2-digit" })}</p>
                      </div>
                      <span className="text-[14px] font-bold tabular-nums" style={{ color: d.color }}>{d.amount}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
        {hasMore && transactions.length > 0 && (
          <button onClick={loadMore} disabled={loadingMore} className="w-full py-3 text-[14px] text-[--color-primary] font-semibold">
            {loadingMore ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : "Load More"}
          </button>
        )}
      </div>
      <BottomNav />
    </div>
  );
}
