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
        const [vendorRes, walletRes] = await Promise.all([
          fetch(`/api/vendor/${vendor_id}`),
          fetch("/api/wallet/balance"),
        ]);

        if (walletRes.status === 401) {
          router.push("/login");
          return;
        }

        if (!vendorRes.ok) {
          setError("This vendor was not found. Please check the QR code.");
          setLoading(false);
          return;
        }

        const vendorData = await vendorRes.json();
        const walletData = await walletRes.json();
        setVendor(vendorData);
        setBalance(parseFloat(walletData.balance));
      } catch {
        setError("Network error. Please try again.");
      } finally {
        setLoading(false);
      }
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
      const newVal = prev + digit;
      if (parseFloat(newVal) > 99999) return prev;
      return newVal;
    });
  };

  const handleDelete = () => {
    setAmount((prev) => (prev.length <= 1 ? "0" : prev.slice(0, -1)));
  };

  const handleQuickAmount = (val) => {
    setAmount(val.toString());
  };

  const handlePay = async () => {
    setProcessing(true);
    const idempotencyKey = crypto.randomUUID();

    try {
      const res = await fetch("/api/payment/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vendor_id: vendor.vendor_id,
          amount: numAmount.toFixed(2),
          idempotency_key: idempotencyKey,
        }),
      });

      const data = await res.json();

      if (data.success) {
        // Navigate to success page with params
        const params = new URLSearchParams({
          amount: numAmount.toFixed(2),
          vendor_name: vendor.stall_name,
          new_balance: data.new_balance,
        });
        router.push(`/pay/success?${params.toString()}`);
      } else {
        setError(data.message || "Payment failed");
        setShowConfirm(false);
        setProcessing(false);
      }
    } catch {
      setError("Payment may have been processed. Please check your balance.");
      setShowConfirm(false);
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

  if (error && !vendor) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center bg-[--color-bg] px-6">
        <p className="text-[--color-error] text-center mb-4">{error}</p>
        <button
          onClick={() => router.push("/scan")}
          className="text-[--color-primary] font-semibold"
        >
          Back to Scanner
        </button>
      </div>
    );
  }

  const quickAmounts = [5, 10, 15, 20];
  const keys = ["1", "2", "3", "4", "5", "6", "7", "8", "9", ".", "0", "del"];

  return (
    <div className="min-h-dvh bg-[--color-bg] flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-12 pb-4 bg-white">
        <button onClick={() => router.push("/scan")} className="p-1">
          <ArrowLeft className="w-6 h-6 text-[--color-text]" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="font-bold text-[--color-text]">{vendor?.stall_name}</h1>
            <ShieldCheck className="w-4 h-4 text-[--color-primary]" />
          </div>
          <p className="text-xs text-[--color-text-secondary]">Verified Vendor</p>
        </div>
      </div>

      {/* Amount display */}
      <div className="flex-1 flex flex-col items-center justify-start bg-white px-6 pt-8">
        <p className="text-5xl font-bold text-[--color-text]">
          RM <span>{amount}</span>
        </p>
        <p
          className="text-sm mt-2"
          style={{ color: isInsufficient ? "var(--color-error)" : "var(--color-text-secondary)" }}
        >
          {isInsufficient
            ? "Insufficient balance"
            : `Your balance: RM ${balance.toFixed(2)}`}
        </p>

        {error && vendor && (
          <p className="text-sm text-[--color-error] mt-2">{error}</p>
        )}

        {/* Quick amounts */}
        <div className="flex gap-2 mt-4">
          {quickAmounts.map((val) => (
            <button
              key={val}
              onClick={() => handleQuickAmount(val)}
              className="px-4 py-2 rounded-full border border-[--color-primary] text-[--color-primary] text-sm font-medium active:bg-[--color-primary-light]"
            >
              RM {val}
            </button>
          ))}
        </div>

        {/* Keypad */}
        <div className="grid grid-cols-3 gap-2 mt-6 w-full max-w-xs">
          {keys.map((key) => (
            <button
              key={key}
              onClick={() => (key === "del" ? handleDelete() : handleDigit(key))}
              className="h-14 rounded-xl text-xl font-semibold flex items-center justify-center active:bg-gray-100 transition-colors"
            >
              {key === "del" ? <Delete className="w-6 h-6 text-[--color-text-secondary]" /> : key}
            </button>
          ))}
        </div>
      </div>

      {/* Pay button */}
      <div className="p-4 bg-white border-t border-[--color-border] pb-[calc(env(safe-area-inset-bottom,8px)+16px)]">
        <button
          onClick={() => setShowConfirm(true)}
          disabled={!isValid}
          className="w-full h-14 rounded-xl font-bold text-white text-lg disabled:opacity-40 transition-all"
          style={{ backgroundColor: "var(--color-primary)" }}
        >
          Pay RM {numAmount.toFixed(2)}
        </button>
      </div>

      {/* Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-6">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm animate-scale-in">
            <h3 className="text-lg font-bold text-center text-[--color-text] mb-4">
              Confirm Payment
            </h3>
            <p className="text-center text-[--color-text-secondary] mb-2">
              {vendor?.stall_name}
            </p>
            <p className="text-center text-3xl font-bold text-[--color-primary] mb-6">
              RM {numAmount.toFixed(2)}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                disabled={processing}
                className="flex-1 h-12 rounded-xl border border-[--color-border] font-semibold text-[--color-text-secondary]"
              >
                Cancel
              </button>
              <button
                onClick={handlePay}
                disabled={processing}
                className="flex-1 h-12 rounded-xl font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-60"
                style={{ backgroundColor: "var(--color-primary)" }}
              >
                {processing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  "Confirm & Pay"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
