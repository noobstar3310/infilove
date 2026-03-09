"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { Check, LogOut, Loader2, Volume2, Banknote } from "lucide-react";

export default function VendorDashboard() {
  const [vendor, setVendor] = useState(null);
  const [totalEarnings, setTotalEarnings] = useState("0.00");
  const [latestPayment, setLatestPayment] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const lastTxIdRef = useRef(null);
  const router = useRouter();

  const fetchData = useCallback(async () => {
    try {
      const [walletRes, txRes] = await Promise.all([fetch("/api/wallet/balance"), fetch("/api/transactions/mine?page=1&limit=50")]);
      if (walletRes.status === 401) { router.push("/login"); return; }
      if (walletRes.ok) {
        const d = await walletRes.json();
        if (d.user.role !== "vendor") { router.push("/home"); return; }
        setVendor(d.user); setTotalEarnings(d.total_received);
      }
      if (txRes.ok) {
        const d = await txRes.json();
        const received = d.transactions.filter((tx) => tx.type === "payment" && tx.direction === "credit");
        setTransactions(received);
        if (received.length > 0 && lastTxIdRef.current && received[0].tx_id !== lastTxIdRef.current) {
          setLatestPayment(received[0]); playSound();
        }
        if (received.length > 0) lastTxIdRef.current = received[0].tx_id;
      }
    } catch {} finally { setLoading(false); }
  }, [router]);

  useEffect(() => { fetchData(); const i = setInterval(fetchData, 3000); return () => clearInterval(i); }, [fetchData]);

  const playSound = () => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator(); const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      osc.frequency.setValueAtTime(1200, ctx.currentTime + 0.1);
      osc.frequency.setValueAtTime(1600, ctx.currentTime + 0.2);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
      osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.5);
    } catch {}
  };

  const handleLogout = async () => { await fetch("/api/auth/logout", { method: "POST" }); router.push("/login"); };

  if (loading) return <div className="min-h-dvh flex items-center justify-center bg-[--color-bg]"><Loader2 className="w-7 h-7 animate-spin text-[--color-primary]" /></div>;

  return (
    <div className="min-h-dvh bg-[--color-bg]">
      {/* Header */}
      <div className="gradient-primary relative overflow-hidden" style={{ borderRadius: "0 0 28px 28px" }}>
        <div className="absolute -top-12 -right-12 w-40 h-40 rounded-full bg-white/5" />
        <div className="relative px-5 pt-14 pb-8">
          <div className="flex items-center justify-between mb-5">
            <h1 className="text-[20px] font-bold text-white">{vendor?.stall_name || vendor?.name}</h1>
            <button onClick={handleLogout} className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center"><LogOut className="w-[18px] h-[18px] text-white/80" /></button>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/10">
            <div className="flex items-center gap-2 mb-2"><Banknote className="w-4 h-4 text-white/60" /><span className="text-white/60 text-[13px] font-medium">Total Earned Today</span></div>
            <p className="text-white text-[36px] font-bold tracking-tight leading-none">RM {parseFloat(totalEarnings).toFixed(2)}</p>
          </div>
        </div>
      </div>

      {/* Latest payment notification */}
      {latestPayment ? (
        <div className="px-5 -mt-4 relative z-10">
          <div className="rounded-2xl p-6 text-center text-white animate-scale-in" style={{ background: "linear-gradient(135deg, #10B981, #34D399)", boxShadow: "0 8px 32px rgba(16, 185, 129, 0.35)" }}>
            <div className="w-18 h-18 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-3 w-[72px] h-[72px]">
              <Check className="w-10 h-10 text-white" strokeWidth={3} />
            </div>
            <p className="text-[18px] font-bold mb-1">Payment Received!</p>
            <p className="text-[48px] font-bold leading-tight">RM {parseFloat(latestPayment.amount).toFixed(2)}</p>
            <p className="text-white/80 text-[14px] mt-1">From: {latestPayment.from_user?.name || "Customer"}</p>
            <p className="text-white/50 text-[12px] mt-1">{new Date(latestPayment.created_at).toLocaleTimeString("en-MY")}</p>
            <button onClick={() => setLatestPayment(null)} className="mt-5 px-10 py-3 bg-white text-[--color-success] rounded-xl font-bold text-[16px]">OK</button>
          </div>
        </div>
      ) : (
        <div className="px-5 mt-5">
          <div className="card p-8 text-center">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-3 animate-float" style={{ background: "var(--color-primary-light)" }}>
              <Volume2 className="w-7 h-7 text-[--color-primary]" />
            </div>
            <p className="font-semibold text-[16px] text-[--color-text] mb-1">Waiting for payment...</p>
            <p className="text-[13px] text-[--color-text-tertiary]">You'll hear a sound when a customer pays</p>
          </div>
        </div>
      )}

      {/* Transaction list */}
      <div className="px-5 mt-5 pb-6">
        <h2 className="text-[16px] font-bold text-[--color-text] mb-3 px-1">Today's Payments</h2>
        {transactions.length === 0 ? (
          <div className="card p-8 text-center"><p className="text-[13px] text-[--color-text-tertiary]">No payments received yet</p></div>
        ) : (
          <div className="card overflow-hidden">
            {transactions.map((tx, i) => (
              <div key={tx.tx_id} className={`flex items-center justify-between px-4 py-3.5 ${i < transactions.length - 1 ? "border-b border-[--color-border-light]" : ""}`}>
                <div>
                  <p className="text-[14px] font-semibold text-[--color-text]">{tx.from_user?.name?.split(" ")[0] || "Customer"}</p>
                  <p className="text-[12px] text-[--color-text-tertiary]">{new Date(tx.created_at).toLocaleTimeString("en-MY", { hour: "2-digit", minute: "2-digit" })}</p>
                </div>
                <span className="text-[14px] font-bold text-[--color-success] tabular-nums">+RM {parseFloat(tx.amount).toFixed(2)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
