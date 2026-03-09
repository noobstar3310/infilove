"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Delete, Loader2, ShieldCheck } from "lucide-react";

export default function PaymentPage({ params }) {
  const { vendor_id } = use(params);
  const [vendor, setVendor] = useState(null);
  const [amount, setAmount] = useState("0");
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showConfirm, setShowConfirm] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [vendorRes, walletRes] = await Promise.all([fetch(`/api/vendor/${vendor_id}`), fetch("/api/wallet/balance")]);
        if (walletRes.status === 401) { router.push("/login"); return; }
        if (!vendorRes.ok) { setError("This vendor was not found."); setLoading(false); return; }
        setVendor(await vendorRes.json());
        const w = await walletRes.json();
        setBalance(parseFloat(w.balance));
      } catch { setError("Network error."); } finally { setLoading(false); }
    };
    fetchData();
  }, [vendor_id, router]);

  const numAmount = parseFloat(amount) || 0;
  const isValid = numAmount >= 0.5 && numAmount <= balance;
  const isInsufficient = numAmount > balance && numAmount > 0;

  const handleDigit = (digit) => {
    setAmount((prev) => {
      if (digit === "." && prev.includes(".")) return prev;
      if (prev.includes(".") && prev.split(".")[1]?.length >= 2) return prev;
      if (prev === "0" && digit !== ".") return digit;
      if (parseFloat(prev + digit) > 99999) return prev;
      return prev + digit;
    });
  };

  const handleDelete = () => setAmount((prev) => (prev.length <= 1 ? "0" : prev.slice(0, -1)));

  const handlePay = async () => {
    setProcessing(true);
    const idempotencyKey = crypto.randomUUID();
    try {
      const res = await fetch("/api/payment/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vendor_id: vendor.vendor_id, amount: numAmount.toFixed(2), idempotency_key: idempotencyKey }),
      });
      const data = await res.json();
      if (data.success) {
        const p = new URLSearchParams({ amount: numAmount.toFixed(2), vendor_name: vendor.stall_name, new_balance: data.new_balance });
        router.push(`/pay/success?${p}`);
      } else { setError(data.message || "Payment failed"); setShowConfirm(false); setProcessing(false); }
    } catch { setError("Payment may have been processed. Please check your balance."); setShowConfirm(false); setProcessing(false); }
  };

  if (loading) return <div className="min-h-dvh flex items-center justify-center bg-[--color-bg]"><Loader2 className="w-7 h-7 animate-spin text-[--color-primary]" /></div>;

  if (error && !vendor) return (
    <div className="min-h-dvh flex flex-col items-center justify-center bg-[--color-bg] px-6">
      <p className="text-[--color-error] text-center mb-4">{error}</p>
      <button onClick={() => router.push("/scan")} className="text-[--color-primary] font-semibold">Back to Scanner</button>
    </div>
  );

  const keys = ["1", "2", "3", "4", "5", "6", "7", "8", "9", ".", "0", "del"];

  return (
    <div className="min-h-dvh bg-white flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-14 pb-4">
        <button onClick={() => router.push("/scan")} className="w-10 h-10 rounded-xl bg-[--color-bg] flex items-center justify-center">
          <ArrowLeft className="w-5 h-5 text-[--color-text]" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-1.5">
            <h1 className="font-bold text-[16px] text-[--color-text]">{vendor?.stall_name}</h1>
            <ShieldCheck className="w-4 h-4 text-[--color-primary]" />
          </div>
          <p className="text-[12px] text-[--color-text-tertiary]">Verified Vendor</p>
        </div>
      </div>

      {/* Amount display */}
      <div className="flex-1 flex flex-col items-center justify-center px-6">
        <p className="text-[13px] text-[--color-text-tertiary] mb-2">Enter Amount</p>
        <p className="text-[48px] font-bold text-[--color-text] leading-none tracking-tight">
          <span className="text-[28px] text-[--color-text-secondary] mr-1">RM</span>{amount}
        </p>
        <p className="text-[13px] mt-3 font-medium" style={{ color: isInsufficient ? "var(--color-error)" : "var(--color-text-tertiary)" }}>
          {isInsufficient ? "Insufficient balance" : `Balance: RM ${balance.toFixed(2)}`}
        </p>
        {error && vendor && <p className="text-[13px] text-[--color-error] mt-2">{error}</p>}

        {/* Quick amounts */}
        <div className="flex gap-2 mt-5">
          {[5, 10, 15, 20].map((val) => (
            <button key={val} onClick={() => setAmount(val.toString())}
              className="px-4 py-2 rounded-full text-[13px] font-semibold transition-all"
              style={{ backgroundColor: parseFloat(amount) === val ? "var(--color-primary)" : "var(--color-primary-light)", color: parseFloat(amount) === val ? "white" : "var(--color-primary)" }}
            >RM {val}</button>
          ))}
        </div>
      </div>

      {/* Keypad */}
      <div className="px-6 pb-2">
        <div className="grid grid-cols-3 gap-1.5 max-w-[320px] mx-auto">
          {keys.map((key) => (
            <button key={key} onClick={() => (key === "del" ? handleDelete() : handleDigit(key))}
              className="h-[56px] rounded-2xl text-[22px] font-semibold flex items-center justify-center transition-colors active:bg-[--color-bg]"
            >
              {key === "del" ? <Delete className="w-6 h-6 text-[--color-text-secondary]" /> : key}
            </button>
          ))}
        </div>
      </div>

      {/* Pay button */}
      <div className="px-5 pb-[calc(env(safe-area-inset-bottom,8px)+16px)] pt-2">
        <button onClick={() => setShowConfirm(true)} disabled={!isValid} className="btn-primary h-[56px] text-[17px]">
          Pay RM {numAmount.toFixed(2)}
        </button>
      </div>

      {/* Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 animate-fade-in" onClick={() => !processing && setShowConfirm(false)}>
          <div className="bg-white rounded-t-[28px] w-full max-w-[430px] p-6 pt-8 animate-slide-up" onClick={(e) => e.stopPropagation()}>
            <div className="w-10 h-1 rounded-full bg-[--color-border] mx-auto mb-6" />
            <h3 className="text-[18px] font-bold text-center text-[--color-text] mb-5">Confirm Payment</h3>
            <div className="card p-4 mb-5 text-center" style={{ background: "var(--color-bg)" }}>
              <p className="text-[14px] text-[--color-text-secondary] mb-1">{vendor?.stall_name}</p>
              <p className="text-[36px] font-bold text-[--color-primary] leading-tight">RM {numAmount.toFixed(2)}</p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowConfirm(false)} disabled={processing} className="btn-secondary flex-1">Cancel</button>
              <button onClick={handlePay} disabled={processing} className="btn-primary flex-1" style={{ width: "auto" }}>
                {processing ? <><Loader2 className="w-4 h-4 animate-spin" />Processing...</> : "Confirm & Pay"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
