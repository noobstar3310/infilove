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
      if (res.status === 401) {
        router.push("/login");
        return;
      }
      if (res.ok) {
        const data = await res.json();
        setTransactions((prev) =>
          append ? [...prev, ...data.transactions] : data.transactions
        );
        setHasMore(data.transactions.length === 20);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [router]);

  useEffect(() => {
    fetchTransactions(1);
  }, [fetchTransactions]);

  const loadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    setLoadingMore(true);
    fetchTransactions(nextPage, true);
  };

  const getDisplay = (tx) => {
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

  // Group by date
  const grouped = {};
  transactions.forEach((tx) => {
    const date = new Date(tx.created_at).toLocaleDateString("en-MY", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
    if (!grouped[date]) grouped[date] = [];
    grouped[date].push(tx);
  });

  if (loading) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-[--color-bg]">
        <Loader2 className="w-8 h-8 animate-spin text-[--color-primary]" />
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-[--color-bg] pb-24">
      <div
        className="px-5 pt-12 pb-5"
        style={{ background: "linear-gradient(135deg, #1A56DB 0%, #0EA5E9 100%)" }}
      >
        <h1 className="text-xl font-bold text-white">Transaction History</h1>
      </div>

      <div className="px-5 mt-4">
        {Object.keys(grouped).length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center">
            <p className="text-[--color-text-secondary]">No transactions yet</p>
          </div>
        ) : (
          Object.entries(grouped).map(([date, txs]) => (
            <div key={date} className="mb-4">
              <p className="text-xs font-semibold text-[--color-text-secondary] mb-2 uppercase">
                {date}
              </p>
              <div className="bg-white rounded-2xl overflow-hidden shadow-sm">
                {txs.map((tx, i) => {
                  const d = getDisplay(tx);
                  return (
                    <div
                      key={tx.tx_id}
                      className={`flex items-center gap-3 px-4 py-3 ${
                        i < txs.length - 1 ? "border-b border-[--color-border]" : ""
                      }`}
                    >
                      <div className="w-10 h-10 rounded-full bg-[--color-bg] flex items-center justify-center flex-shrink-0">
                        {d.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[--color-text] truncate">
                          {d.label}
                        </p>
                        <p className="text-xs text-[--color-text-secondary]">
                          {new Date(tx.created_at).toLocaleTimeString("en-MY", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                      <span className="text-sm font-semibold" style={{ color: d.color }}>
                        {d.amount}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}

        {hasMore && transactions.length > 0 && (
          <button
            onClick={loadMore}
            disabled={loadingMore}
            className="w-full py-3 text-[--color-primary] font-medium text-sm"
          >
            {loadingMore ? "Loading..." : "Load More"}
          </button>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
