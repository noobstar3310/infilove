"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Download, Filter, Loader2, X } from "lucide-react";

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
      const params = new URLSearchParams({ page: String(page), limit: "50" });
      if (filterType) params.set("type", filterType);
      if (filterEmail) params.set("email", filterEmail);
      const res = await fetch(`/api/transactions/all?${params}`);
      if (res.status === 401 || res.status === 403) { router.push("/login"); return; }
      if (res.ok) { const d = await res.json(); setTransactions(d.transactions); setTotalCount(d.total_count); }
    } catch {} finally { setLoading(false); }
  }, [page, filterType, filterEmail, router]);

  useEffect(() => { fetchTransactions(); }, [fetchTransactions]);

  const handleExport = () => {
    const params = new URLSearchParams();
    if (filterType) params.set("type", filterType);
    window.open(`/api/transactions/export?${params}`, "_blank");
  };

  const typeStyles = {
    topup: { bg: "#DBEAFE", text: "#1D4ED8", label: "Top-up" },
    payment: { bg: "#D1FAE5", text: "#059669", label: "Payment" },
    donation: { bg: "#FCE7F3", text: "#DB2777", label: "Donation" },
  };

  const totalPages = Math.ceil(totalCount / 50);

  return (
    <div className="min-h-dvh bg-[--color-bg]">
      <div className="bg-white px-4 pt-14 pb-4 flex items-center gap-3" style={{ boxShadow: "0 1px 3px var(--color-card-shadow)" }}>
        <button onClick={() => router.push("/admin")} className="w-10 h-10 rounded-xl bg-[--color-bg] flex items-center justify-center"><ArrowLeft className="w-5 h-5 text-[--color-text]" /></button>
        <h1 className="font-bold text-[18px] text-[--color-text] flex-1">Transaction Log</h1>
        <button onClick={() => setShowFilters((v) => !v)} className="w-10 h-10 rounded-xl bg-[--color-bg] flex items-center justify-center">
          <Filter className="w-[18px] h-[18px] text-[--color-text-secondary]" />
        </button>
        <button onClick={handleExport} className="w-10 h-10 rounded-xl bg-[--color-primary-light] flex items-center justify-center">
          <Download className="w-[18px] h-[18px] text-[--color-primary]" />
        </button>
      </div>

      {showFilters && (
        <div className="bg-white px-4 py-3 flex gap-2 animate-fade-in-up" style={{ boxShadow: "0 1px 3px var(--color-card-shadow)" }}>
          <select value={filterType} onChange={(e) => { setFilterType(e.target.value); setPage(1); }} className="input-base flex-1 text-[13px] h-10">
            <option value="">All Types</option>
            <option value="topup">Top-up</option>
            <option value="payment">Payment</option>
            <option value="donation">Donation</option>
          </select>
          <input type="text" value={filterEmail} onChange={(e) => { setFilterEmail(e.target.value); setPage(1); }} placeholder="Filter email" className="input-base flex-1 text-[13px] h-10" />
          {(filterType || filterEmail) && (
            <button onClick={() => { setFilterType(""); setFilterEmail(""); setPage(1); }} className="w-10 h-10 rounded-xl bg-[--color-error-light] flex items-center justify-center flex-shrink-0">
              <X className="w-4 h-4 text-[--color-error]" />
            </button>
          )}
        </div>
      )}

      <div className="px-4 py-4">
        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="w-7 h-7 animate-spin text-[--color-primary]" /></div>
        ) : transactions.length === 0 ? (
          <div className="card p-10 text-center"><p className="text-[14px] text-[--color-text-secondary]">No transactions found</p></div>
        ) : (
          <div className="space-y-2">
            {transactions.map((tx) => {
              const style = typeStyles[tx.type] || typeStyles.payment;
              return (
                <div key={tx.tx_id} className="card p-3.5">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="badge" style={{ backgroundColor: style.bg, color: style.text }}>{style.label}</span>
                    <span className="text-[11px] text-[--color-text-tertiary] tabular-nums">
                      {new Date(tx.created_at).toLocaleString("en-MY", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-[12px] text-[--color-text-secondary] truncate flex-1 mr-3">
                      {tx.from_user?.name || tx.from_user?.email || "—"} → {tx.to_user?.stall_name || tx.to_user?.name || tx.to_user?.email || "—"}
                    </p>
                    <span className="font-bold text-[15px] text-[--color-text] tabular-nums">RM {parseFloat(tx.amount).toFixed(2)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-4 mt-5">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1} className="btn-secondary h-10 text-[13px]" style={{ width: "auto", padding: "0 16px" }}>Previous</button>
            <span className="text-[13px] text-[--color-text-secondary] tabular-nums">{page} / {totalPages}</span>
            <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="btn-secondary h-10 text-[13px]" style={{ width: "auto", padding: "0 16px" }}>Next</button>
          </div>
        )}
      </div>
    </div>
  );
}
