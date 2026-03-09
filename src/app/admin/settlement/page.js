"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check, Loader2, Building } from "lucide-react";

export default function SettlementPage() {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(null);
  const [bankRef, setBankRef] = useState("");
  const [processing, setProcessing] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetchVendors();
  }, []);

  const fetchVendors = async () => {
    try {
      const res = await fetch("/api/settlement/vendors");
      if (res.status === 401 || res.status === 403) {
        router.push("/login");
        return;
      }
      if (res.ok) {
        const data = await res.json();
        setVendors(data.vendors);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  const handleMarkPaid = async () => {
    if (!bankRef.trim()) return;
    setProcessing(true);
    try {
      const res = await fetch("/api/settlement/mark-paid", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vendor_id: showModal.user_id,
          bank_ref: bankRef,
        }),
      });
      if (res.ok) {
        setVendors((prev) =>
          prev.map((v) =>
            v.user_id === showModal.user_id
              ? { ...v, settlement_status: "paid" }
              : v
          )
        );
        setShowModal(null);
        setBankRef("");
      }
    } catch {
      // silent
    } finally {
      setProcessing(false);
    }
  };

  const paidCount = vendors.filter((v) => v.settlement_status === "paid").length;
  const totalEarnings = vendors.reduce((s, v) => s + parseFloat(v.total_earnings || 0), 0);
  const paidAmount = vendors
    .filter((v) => v.settlement_status === "paid")
    .reduce((s, v) => s + parseFloat(v.total_earnings || 0), 0);

  if (loading) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-[--color-bg]">
        <Loader2 className="w-8 h-8 animate-spin text-[--color-primary]" />
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-[--color-bg] pb-6">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-12 pb-4 bg-white border-b border-[--color-border]">
        <button onClick={() => router.push("/admin")} className="p-1">
          <ArrowLeft className="w-6 h-6 text-[--color-text]" />
        </button>
        <h1 className="font-bold text-lg text-[--color-text]">Vendor Settlement</h1>
      </div>

      {/* Progress */}
      <div className="px-5 py-4">
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-[--color-text]">Settlement Progress</span>
            <span className="text-sm font-bold text-[--color-primary]">
              {paidCount} / {vendors.length}
            </span>
          </div>
          <div className="w-full h-3 bg-[--color-bg] rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${vendors.length ? (paidCount / vendors.length) * 100 : 0}%`,
                backgroundColor: "var(--color-primary)",
              }}
            />
          </div>
          <div className="flex justify-between mt-3 text-xs text-[--color-text-secondary]">
            <span>Remaining: RM {(totalEarnings - paidAmount).toFixed(2)}</span>
            <span>Total: RM {totalEarnings.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Vendor list */}
      <div className="px-5 space-y-2">
        {vendors.map((v) => (
          <div key={v.user_id} className="bg-white rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-[--color-text] truncate">
                  {v.stall_name || v.name}
                </p>
                <p className="text-xs text-[--color-text-secondary]">{v.name}</p>
                <p className="text-xs text-[--color-text-secondary]">
                  {v.bank_name} — {v.bank_account || "No bank info"}
                </p>
                <p className="text-sm font-bold text-[--color-primary] mt-1">
                  RM {parseFloat(v.total_earnings).toFixed(2)}
                </p>
              </div>
              <div className="ml-3">
                {v.settlement_status === "paid" ? (
                  <span className="flex items-center gap-1 text-xs font-semibold text-[--color-success] bg-green-50 px-3 py-1.5 rounded-full">
                    <Check className="w-3 h-3" /> Paid
                  </span>
                ) : (
                  <button
                    onClick={() => setShowModal(v)}
                    className="text-xs font-semibold text-white px-3 py-1.5 rounded-full"
                    style={{ backgroundColor: "var(--color-primary)" }}
                  >
                    Mark Paid
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Mark as paid modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-6">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm animate-scale-in">
            <h3 className="text-lg font-bold mb-1">Mark as Paid</h3>
            <p className="text-sm text-[--color-text-secondary] mb-4">
              {showModal.stall_name || showModal.name} — RM{" "}
              {parseFloat(showModal.total_earnings).toFixed(2)}
            </p>
            <input
              type="text"
              value={bankRef}
              onChange={(e) => setBankRef(e.target.value)}
              placeholder="Bank transfer reference number"
              className="w-full h-12 px-4 rounded-xl border border-[--color-border] focus:border-[--color-primary] focus:outline-none text-sm mb-4"
              autoFocus
            />
            <div className="flex gap-3">
              <button
                onClick={() => { setShowModal(null); setBankRef(""); }}
                className="flex-1 h-12 rounded-xl border border-[--color-border] font-semibold text-[--color-text-secondary]"
              >
                Cancel
              </button>
              <button
                onClick={handleMarkPaid}
                disabled={!bankRef.trim() || processing}
                className="flex-1 h-12 rounded-xl font-semibold text-white disabled:opacity-40 flex items-center justify-center gap-2"
                style={{ backgroundColor: "var(--color-primary)" }}
              >
                {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
