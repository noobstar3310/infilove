"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { Check, LogOut, Loader2, Volume2 } from "lucide-react";

export default function VendorDashboard() {
  const [vendor, setVendor] = useState(null);
  const [totalEarnings, setTotalEarnings] = useState("0.00");
  const [latestPayment, setLatestPayment] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const lastTxIdRef = useRef(null);
  const audioRef = useRef(null);
  const router = useRouter();

  const fetchData = useCallback(async () => {
    try {
      const [walletRes, txRes] = await Promise.all([
        fetch("/api/wallet/balance"),
        fetch("/api/transactions/mine?page=1&limit=50"),
      ]);

      if (walletRes.status === 401) {
        router.push("/login");
        return;
      }

      if (walletRes.ok) {
        const walletData = await walletRes.json();
        if (walletData.user.role !== "vendor") {
          router.push("/home");
          return;
        }
        setVendor(walletData.user);
        setTotalEarnings(walletData.total_received);
      }

      if (txRes.ok) {
        const txData = await txRes.json();
        const received = txData.transactions.filter(
          (tx) => tx.type === "payment" && tx.direction === "credit"
        );
        setTransactions(received);

        // Check for new payment
        if (received.length > 0 && lastTxIdRef.current && received[0].tx_id !== lastTxIdRef.current) {
          // New payment received!
          setLatestPayment(received[0]);
          playSound();
        }
        if (received.length > 0) {
          lastTxIdRef.current = received[0].tx_id;
        }
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchData();
    // Poll every 3 seconds for new payments
    const interval = setInterval(fetchData, 3000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const playSound = () => {
    try {
      // Create a simple "ka-ching" sound using Web Audio API
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      osc.frequency.setValueAtTime(1200, ctx.currentTime + 0.1);
      osc.frequency.setValueAtTime(1600, ctx.currentTime + 0.2);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.5);
    } catch {
      // Audio not supported
    }
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  };

  if (loading) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-[--color-bg]">
        <Loader2 className="w-8 h-8 animate-spin text-[--color-primary]" />
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-[--color-bg]">
      {/* Header */}
      <div
        className="px-5 pt-12 pb-6"
        style={{ background: "linear-gradient(135deg, #1A56DB 0%, #0EA5E9 100%)" }}
      >
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-lg font-bold text-white">
            {vendor?.stall_name || vendor?.name}
          </h1>
          <button onClick={handleLogout} className="text-white/70 active:text-white">
            <LogOut className="w-5 h-5" />
          </button>
        </div>
        <div className="bg-white/15 backdrop-blur-sm rounded-2xl p-4 text-center">
          <p className="text-white/70 text-sm">Total Earned</p>
          <p className="text-white text-3xl font-bold">
            RM {parseFloat(totalEarnings).toFixed(2)}
          </p>
        </div>
      </div>

      {/* Latest payment notification */}
      {latestPayment && (
        <div className="px-5 -mt-3">
          <div className="bg-[#16A34A] rounded-2xl p-6 text-center text-white shadow-lg animate-scale-in">
            <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-3">
              <Check className="w-10 h-10 text-white" strokeWidth={3} />
            </div>
            <p className="text-lg font-bold mb-1">Payment Received!</p>
            <p className="text-5xl font-bold mb-2">
              RM {parseFloat(latestPayment.amount).toFixed(2)}
            </p>
            <p className="text-white/80 text-sm">
              From: {latestPayment.from_user?.name || "Customer"}
            </p>
            <p className="text-white/60 text-xs mt-1">
              {new Date(latestPayment.created_at).toLocaleTimeString("en-MY")}
            </p>
            <button
              onClick={() => setLatestPayment(null)}
              className="mt-4 px-8 py-3 bg-white text-[--color-success] rounded-xl font-bold text-lg"
            >
              OK
            </button>
          </div>
        </div>
      )}

      {/* Waiting indicator */}
      {!latestPayment && (
        <div className="px-5 mt-4">
          <div className="bg-white rounded-2xl p-8 text-center shadow-sm">
            <div className="w-16 h-16 rounded-full bg-[--color-primary-light] flex items-center justify-center mx-auto mb-3">
              <Volume2 className="w-8 h-8 text-[--color-primary]" />
            </div>
            <p className="font-semibold text-[--color-text] mb-1">Waiting for payment...</p>
            <p className="text-sm text-[--color-text-secondary]">
              You'll hear a sound when a customer pays
            </p>
          </div>
        </div>
      )}

      {/* Transaction list */}
      <div className="px-5 mt-4 pb-6">
        <h2 className="font-semibold text-[--color-text] mb-3">Today's Payments</h2>
        {transactions.length === 0 ? (
          <div className="bg-white rounded-2xl p-6 text-center shadow-sm">
            <p className="text-sm text-[--color-text-secondary]">No payments received yet</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl overflow-hidden shadow-sm">
            {transactions.map((tx, i) => (
              <div
                key={tx.tx_id}
                className={`flex items-center justify-between px-4 py-3 ${
                  i < transactions.length - 1 ? "border-b border-[--color-border]" : ""
                }`}
              >
                <div>
                  <p className="text-sm font-medium text-[--color-text]">
                    {tx.from_user?.name?.split(" ")[0] || "Customer"}
                  </p>
                  <p className="text-xs text-[--color-text-secondary]">
                    {new Date(tx.created_at).toLocaleTimeString("en-MY", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
                <span className="text-sm font-bold text-[--color-success]">
                  +RM {parseFloat(tx.amount).toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
