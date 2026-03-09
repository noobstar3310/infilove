"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Download, Filter, Loader2 } from "lucide-react";

export default function AdminTransactions() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [filterType, setFilterType] = useState("");
  const [filterEmail, setFilterEmail] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const router = useRouter();

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: "50" });
      if (filterType) params.set("type", filterType);
      if (filterEmail) params.set("email", filterEmail);

      const res = await fetch(`/api/transactions/all?${params}`);
      if (res.status === 401 || res.status === 403) {
        router.push("/login");
        return;
      }
      if (res.ok) {
        const data = await res.json();
        setTransactions(data.transactions);
        setTotalCount(data.total_count);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [page, filterType, filterEmail, router]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const handleExport = () => {
    const params = new URLSearchParams();
    if (filterType) params.set("type", filterType);
    window.open(`/api/transactions/export?${params}`, "_blank");
  };

  const typeColors = {
    topup: { bg: "#DBEAFE", text: "#1D4ED8" },
    payment: { bg: "#D1FAE5", text: "#059669" },
    donation: { bg: "#FCE7F3", text: "#DB2777" },
  };

  const totalPages = Math.ceil(totalCount / 50);

  return (
    <div className="min-h-dvh bg-[--color-bg]">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-12 pb-4 bg-white border-b border-[--color-border]">
        <button onClick={() => router.push("/admin")} className="p-1">
          <ArrowLeft className="w-6 h-6 text-[--color-text]" />
        </button>
        <h1 className="font-bold text-lg text-[--color-text] flex-1">Transaction Log</h1>
        <button onClick={() => setShowFilters((v) => !v)} className="p-2">
          <Filter className="w-5 h-5 text-[--color-text-secondary]" />
        </button>
        <button onClick={handleExport} className="p-2">
          <Download className="w-5 h-5 text-[--color-primary]" />
        </button>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="bg-white px-4 py-3 border-b border-[--color-border] flex gap-2 animate-fade-in-up">
          <select
            value={filterType}
            onChange={(e) => { setFilterType(e.target.value); setPage(1); }}
            className="h-10 px-3 rounded-lg border border-[--color-border] text-sm flex-1"
          >
            <option value="">All Types</option>
            <option value="topup">Top-up</option>
            <option value="payment">Payment</option>
            <option value="donation">Donation</option>
          </select>
          <input
            type="text"
            value={filterEmail}
            onChange={(e) => { setFilterEmail(e.target.value); setPage(1); }}
            placeholder="Filter by email"
            className="h-10 px-3 rounded-lg border border-[--color-border] text-sm flex-1"
          />
        </div>
      )}

      {/* Transactions list */}
      <div className="px-4 py-3">
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-[--color-primary]" />
          </div>
        ) : transactions.length === 0 ? (
          <div className="text-center py-12 text-[--color-text-secondary]">
            No transactions found
          </div>
        ) : (
          <div className="space-y-2">
            {transactions.map((tx) => {
              const colors = typeColors[tx.type] || typeColors.payment;
              return (
                <div key={tx.tx_id} className="bg-white rounded-xl p-3 shadow-sm">
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className="text-xs font-semibold px-2 py-0.5 rounded-full"
                      style={{ backgroundColor: colors.bg, color: colors.text }}
                    >
                      {tx.type}
                    </span>
                    <span className="text-xs text-[--color-text-secondary]">
                      {new Date(tx.created_at).toLocaleString("en-MY", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-[--color-text-secondary]">
                      <span>{tx.from_user?.name || tx.from_user?.email || "-"}</span>
                      <span className="mx-1">&rarr;</span>
                      <span>{tx.to_user?.stall_name || tx.to_user?.name || tx.to_user?.email || "-"}</span>
                    </div>
                    <span className="font-bold text-[--color-text]">
                      RM {parseFloat(tx.amount).toFixed(2)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-4 mt-4">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="px-4 py-2 rounded-lg bg-white border border-[--color-border] text-sm disabled:opacity-40"
            >
              Previous
            </button>
            <span className="text-sm text-[--color-text-secondary]">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="px-4 py-2 rounded-lg bg-white border border-[--color-border] text-sm disabled:opacity-40"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
