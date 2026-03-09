"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Heart, ArrowLeft, Loader2 } from "lucide-react";

export default function DonatePage() {
  const [balance, setBalance] = useState(0);
  const [amount, setAmount] = useState("");
  const [mode, setMode] = useState("choose");
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [donatedAmount, setDonatedAmount] = useState(0);
  const [newBalance, setNewBalance] = useState(0);
  const router = useRouter();

  useEffect(() => {
    const fetchBalance = async () => {
      try {
        const res = await fetch("/api/wallet/balance");
        if (res.status === 401) { router.push("/login"); return; }
        if (res.ok) { const d = await res.json(); setBalance(parseFloat(d.balance)); }
      } catch {} finally { setLoading(false); }
    };
    fetchBalance();
  }, [router]);

  const handleDonate = async (donateAmount, type) => {
    setProcessing(true);
    try {
      const res = await fetch("/api/donation/send", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ amount: donateAmount.toFixed(2), donation_type: type }) });
      const data = await res.json();
      if (data.success) { setDonatedAmount(donateAmount); setNewBalance(parseFloat(data.new_balance)); setMode("success"); }
      else alert(data.message || "Donation failed");
    } catch { alert("Network error."); } finally { setProcessing(false); }
  };

  if (loading) return <div className="min-h-dvh flex items-center justify-center bg-[--color-bg]"><Loader2 className="w-7 h-7 animate-spin text-[--color-primary]" /></div>;

  if (mode === "success") {
    return (
      <div className="min-h-dvh bg-white flex flex-col items-center justify-center px-6 relative overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <div key={i} className="absolute w-3 h-3 rounded-full" style={{
            backgroundColor: ["#EC4899", "#8B5CF6", "#F59E0B", "#10B981", "#3B82F6"][i % 5],
            left: `${Math.random() * 100}%`, top: `-${Math.random() * 20}%`,
            animation: `confetti-fall ${2 + Math.random() * 2}s ${Math.random() * 0.5}s ease-out forwards`,
          }} />
        ))}
        <div className="relative z-10 flex flex-col items-center">
          <div className="w-24 h-24 rounded-full flex items-center justify-center mb-6 animate-scale-bounce" style={{ background: "linear-gradient(135deg, #EC4899, #F472B6)", boxShadow: "0 8px 32px rgba(236, 72, 153, 0.35)" }}>
            <Heart className="w-12 h-12 text-white" fill="white" strokeWidth={0} />
          </div>
          <h1 className="text-[24px] font-bold text-[--color-text] mb-1">Thank You!</h1>
          <p className="text-[14px] text-[--color-text-secondary] text-center mb-4">Your generous donation of</p>
          <p className="text-[40px] font-bold text-transparent bg-clip-text" style={{ backgroundImage: "linear-gradient(135deg, #EC4899, #8B5CF6)" }}>RM {donatedAmount.toFixed(2)}</p>
          <p className="text-[14px] text-[--color-text-secondary] text-center mt-2 mb-8">will make a real difference. Your balance is now RM {newBalance.toFixed(2)}.</p>
          <button onClick={() => router.push("/home")} className="btn-primary max-w-[280px]">Back to Home</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-[--color-bg]">
      <div className="flex items-center gap-3 px-4 pt-14 pb-4 bg-white">
        <button onClick={() => router.push("/home")} className="w-10 h-10 rounded-xl bg-[--color-bg] flex items-center justify-center"><ArrowLeft className="w-5 h-5 text-[--color-text]" /></button>
        <h1 className="font-bold text-[18px] text-[--color-text]">Donate</h1>
      </div>

      <div className="px-5 mt-5">
        <div className="card p-6 text-center mb-5">
          <div className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-float" style={{ background: "linear-gradient(135deg, #EC4899, #F472B6)", boxShadow: "0 8px 24px rgba(236, 72, 153, 0.25)" }}>
            <Heart className="w-9 h-9 text-white" fill="white" strokeWidth={0} />
          </div>
          <p className="text-[14px] text-[--color-text-secondary] leading-relaxed">
            Your remaining balance is <span className="font-bold text-[--color-text]">RM {balance.toFixed(2)}</span>.
            Since e-coupons are non-refundable, would you like to donate your remaining balance to charity?
          </p>
        </div>

        {balance <= 0 ? (
          <div className="card p-8 text-center"><p className="text-[14px] text-[--color-text-secondary]">Your balance is RM 0.00. Nothing to donate.</p></div>
        ) : mode === "choose" ? (
          <div className="space-y-3">
            <button onClick={() => handleDonate(balance, "full")} disabled={processing} className="btn-primary h-[56px] text-[16px]" style={{ background: "linear-gradient(135deg, #EC4899, #8B5CF6)", boxShadow: "0 4px 16px rgba(236, 72, 153, 0.3)" }}>
              {processing ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Heart className="w-5 h-5" /> Donate All RM {balance.toFixed(2)}</>}
            </button>
            <button onClick={() => setMode("custom")} className="btn-secondary h-[56px]">Donate Custom Amount</button>
          </div>
        ) : (
          <div className="card p-5">
            <label className="text-[13px] font-semibold text-[--color-text-secondary] mb-2 block">Enter amount (max RM {balance.toFixed(2)})</label>
            <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" step="0.01" min="0.01" max={balance} className="input-base text-center text-[24px] font-bold mb-3 h-[60px]" autoFocus />
            <button onClick={() => { const val = parseFloat(amount); if (val > 0 && val <= balance) handleDonate(val, "partial"); }}
              disabled={!amount || parseFloat(amount) <= 0 || parseFloat(amount) > balance || processing} className="btn-primary">
              {processing ? <Loader2 className="w-5 h-5 animate-spin" /> : "Donate"}
            </button>
            <button onClick={() => setMode("choose")} className="w-full mt-3 text-[14px] text-[--color-text-tertiary] font-medium">Cancel</button>
          </div>
        )}
      </div>
    </div>
  );
}
