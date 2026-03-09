"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Heart, ArrowLeft, Loader2, Sparkles } from "lucide-react";

export default function DonatePage() {
  const [balance, setBalance] = useState(0);
  const [amount, setAmount] = useState("");
  const [mode, setMode] = useState("choose"); // choose | custom | success
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [donatedAmount, setDonatedAmount] = useState(0);
  const [newBalance, setNewBalance] = useState(0);
  const router = useRouter();

  useEffect(() => {
    const fetchBalance = async () => {
      try {
        const res = await fetch("/api/wallet/balance");
        if (res.status === 401) {
          router.push("/login");
          return;
        }
        if (res.ok) {
          const data = await res.json();
          setBalance(parseFloat(data.balance));
        }
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    };
    fetchBalance();
  }, [router]);

  const handleDonate = async (donateAmount, type) => {
    setProcessing(true);
    try {
      const res = await fetch("/api/donation/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: donateAmount.toFixed(2),
          donation_type: type,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setDonatedAmount(donateAmount);
        setNewBalance(parseFloat(data.new_balance));
        setMode("success");
      } else {
        alert(data.message || "Donation failed");
      }
    } catch {
      alert("Network error. Please try again.");
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-[--color-bg]">
        <Loader2 className="w-8 h-8 animate-spin text-[--color-primary]" />
      </div>
    );
  }

  if (mode === "success") {
    return (
      <div className="min-h-dvh bg-white flex flex-col items-center justify-center px-6 relative overflow-hidden">
        {/* Confetti particles */}
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-3 h-3 rounded-full"
            style={{
              backgroundColor: ["#EC4899", "#8B5CF6", "#F59E0B", "#10B981", "#3B82F6"][i % 5],
              left: `${Math.random() * 100}%`,
              top: `-${Math.random() * 20}%`,
              animation: `confetti ${2 + Math.random() * 2}s ${Math.random() * 0.5}s ease-out forwards`,
            }}
          />
        ))}

        <div className="relative z-10 flex flex-col items-center">
          <div className="w-24 h-24 rounded-full bg-pink-50 flex items-center justify-center mb-6 animate-scale-in">
            <Heart className="w-12 h-12 text-pink-500" fill="#EC4899" />
          </div>

          <h1 className="text-2xl font-bold text-[--color-text] mb-2">Thank You!</h1>
          <p className="text-[--color-text-secondary] text-center mb-4">
            Your generous donation of
          </p>
          <p className="text-3xl font-bold text-pink-500 mb-2">
            RM {donatedAmount.toFixed(2)}
          </p>
          <p className="text-[--color-text-secondary] text-center mb-6">
            will make a difference. Your balance is now RM {newBalance.toFixed(2)}.
          </p>

          <button
            onClick={() => router.push("/home")}
            className="w-full max-w-xs h-12 rounded-xl font-semibold text-white"
            style={{ backgroundColor: "var(--color-primary)" }}
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-[--color-bg]">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-12 pb-4 bg-white">
        <button onClick={() => router.push("/home")} className="p-1">
          <ArrowLeft className="w-6 h-6 text-[--color-text]" />
        </button>
        <h1 className="font-bold text-lg text-[--color-text]">Donate</h1>
      </div>

      <div className="px-5 mt-4">
        {/* Info card */}
        <div className="bg-white rounded-2xl p-6 text-center shadow-sm mb-4">
          <div className="w-16 h-16 rounded-full bg-pink-50 flex items-center justify-center mx-auto mb-4">
            <Heart className="w-8 h-8 text-pink-500" />
          </div>
          <p className="text-[--color-text-secondary] text-sm leading-relaxed">
            Your remaining balance is{" "}
            <span className="font-bold text-[--color-text]">RM {balance.toFixed(2)}</span>.
            Since e-coupons are non-refundable, would you like to donate your remaining
            balance to charity?
          </p>
        </div>

        {balance <= 0 ? (
          <div className="bg-white rounded-2xl p-6 text-center shadow-sm">
            <p className="text-[--color-text-secondary]">
              Your balance is RM 0.00. Nothing to donate.
            </p>
          </div>
        ) : mode === "choose" ? (
          <div className="space-y-3">
            <button
              onClick={() => handleDonate(balance, "full")}
              disabled={processing}
              className="w-full h-14 rounded-xl font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-60"
              style={{ backgroundColor: "var(--color-primary)" }}
            >
              {processing ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Heart className="w-5 h-5" />
                  Donate All RM {balance.toFixed(2)}
                </>
              )}
            </button>

            <button
              onClick={() => setMode("custom")}
              className="w-full h-14 rounded-xl font-semibold border-2 border-[--color-primary] text-[--color-primary]"
            >
              Donate Custom Amount
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <label className="text-sm font-medium text-[--color-text] mb-2 block">
              Enter amount (max RM {balance.toFixed(2)})
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              step="0.01"
              min="0.01"
              max={balance}
              className="w-full h-14 px-4 rounded-xl border-2 border-[--color-border] focus:border-[--color-primary] focus:outline-none text-2xl font-bold text-center mb-3"
              autoFocus
            />
            <button
              onClick={() => {
                const val = parseFloat(amount);
                if (val > 0 && val <= balance) {
                  handleDonate(val, "partial");
                }
              }}
              disabled={!amount || parseFloat(amount) <= 0 || parseFloat(amount) > balance || processing}
              className="w-full h-12 rounded-xl font-semibold text-white disabled:opacity-40 flex items-center justify-center gap-2"
              style={{ backgroundColor: "var(--color-primary)" }}
            >
              {processing ? <Loader2 className="w-5 h-5 animate-spin" /> : "Donate"}
            </button>
            <button
              onClick={() => setMode("choose")}
              className="w-full mt-2 text-sm text-[--color-text-secondary]"
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
