"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check, Loader2 } from "lucide-react";

export default function SettlementPage() {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(null);
  const [bankRef, setBankRef] = useState("");
  const [processing, setProcessing] = useState(false);
  const router = useRouter();

  useEffect(() => { fetchVendors(); }, []);

  const fetchVendors = async () => {
    try {
      const res = await fetch("/api/settlement/vendors");
      if (res.status === 401 || res.status === 403) { router.push("/login"); return; }
      if (res.ok) { const d = await res.json(); setVendors(d.vendors); }
    } catch {} finally { setLoading(false); }
  };

  const handleMarkPaid = async () => {
    if (!bankRef.trim()) return;
    setProcessing(true);
    try {
      const res = await fetch("/api/settlement/mark-paid", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ vendor_id: showModal.user_id, bank_ref: bankRef }) });
      if (res.ok) { setVendors((p) => p.map((v) => v.user_id === showModal.user_id ? { ...v, settlement_status: "paid" } : v)); setShowModal(null); setBankRef(""); }
    } catch {} finally { setProcessing(false); }
  };

  const paidCount = vendors.filter((v) => v.settlement_status === "paid").length;
  const totalEarnings = vendors.reduce((s, v) => s + parseFloat(v.total_earnings || 0), 0);
  const paidAmount = vendors.filter((v) => v.settlement_status === "paid").reduce((s, v) => s + parseFloat(v.total_earnings || 0), 0);
  const progress = vendors.length ? (paidCount / vendors.length) * 100 : 0;

  if (loading) return <div className="min-h-dvh flex items-center justify-center bg-[--color-bg]"><Loader2 className="w-7 h-7 animate-spin text-[--color-primary]" /></div>;

  return (
    <div className="min-h-dvh bg-[--color-bg] pb-6">
      <div className="bg-white px-4 pt-14 pb-4 flex items-center gap-3" style={{ boxShadow: "0 1px 3px var(--color-card-shadow)" }}>
        <button onClick={() => router.push("/admin")} className="w-10 h-10 rounded-xl bg-[--color-bg] flex items-center justify-center"><ArrowLeft className="w-5 h-5 text-[--color-text]" /></button>
        <h1 className="font-bold text-[18px] text-[--color-text]">Vendor Settlement</h1>
      </div>

      <div className="px-5 py-4">
        <div className="card p-5 mb-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[14px] font-semibold text-[--color-text]">Settlement Progress</span>
            <span className="badge" style={{ backgroundColor: "var(--color-primary-light)", color: "var(--color-primary)" }}>{paidCount} / {vendors.length}</span>
          </div>
          <div className="w-full h-3 bg-[--color-bg] rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all duration-500" style={{ width: `${progress}%`, background: "linear-gradient(90deg, #2563EB, #06B6D4)" }} />
          </div>
          <div className="flex justify-between mt-3 text-[12px] text-[--color-text-tertiary]">
            <span>Remaining: RM {(totalEarnings - paidAmount).toFixed(2)}</span>
            <span>Total: RM {totalEarnings.toFixed(2)}</span>
          </div>
        </div>

        <div className="space-y-2">
          {vendors.map((v) => (
            <div key={v.user_id} className="card p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0 mr-3">
                  <p className="font-bold text-[14px] text-[--color-text] truncate">{v.stall_name || v.name}</p>
                  <p className="text-[12px] text-[--color-text-tertiary]">{v.name}</p>
                  <p className="text-[11px] text-[--color-text-tertiary]">{v.bank_name ? `${v.bank_name} — ${v.bank_account}` : "No bank info"}</p>
                  <p className="text-[15px] font-bold text-[--color-primary] mt-1.5 tabular-nums">RM {parseFloat(v.total_earnings).toFixed(2)}</p>
                </div>
                {v.settlement_status === "paid" ? (
                  <span className="badge" style={{ backgroundColor: "var(--color-success-light)", color: "var(--color-success)" }}><Check className="w-3 h-3" />Paid</span>
                ) : (
                  <button onClick={() => setShowModal(v)} className="badge text-white" style={{ backgroundColor: "var(--color-primary)" }}>Mark Paid</button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 animate-fade-in" onClick={() => { setShowModal(null); setBankRef(""); }}>
          <div className="bg-white rounded-t-[28px] w-full max-w-[430px] p-6 pt-8 animate-slide-up" onClick={(e) => e.stopPropagation()}>
            <div className="w-10 h-1 rounded-full bg-[--color-border] mx-auto mb-6" />
            <h3 className="text-[18px] font-bold mb-1">Mark as Paid</h3>
            <p className="text-[14px] text-[--color-text-secondary] mb-5">{showModal.stall_name || showModal.name} — RM {parseFloat(showModal.total_earnings).toFixed(2)}</p>
            <input type="text" value={bankRef} onChange={(e) => setBankRef(e.target.value)} placeholder="Bank transfer reference number" className="input-base text-[14px] mb-4" autoFocus />
            <div className="flex gap-3">
              <button onClick={() => { setShowModal(null); setBankRef(""); }} className="btn-secondary flex-1">Cancel</button>
              <button onClick={handleMarkPaid} disabled={!bankRef.trim() || processing} className="btn-primary flex-1" style={{ width: "auto" }}>
                {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
