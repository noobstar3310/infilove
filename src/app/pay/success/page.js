"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, Suspense } from "react";

function SuccessContent() {
  const router = useRouter();
  const params = useSearchParams();
  const amount = params.get("amount") || "0.00";
  const vendorName = params.get("vendor_name") || "Vendor";
  const newBalance = params.get("new_balance") || "0.00";

  useEffect(() => {
    const timer = setTimeout(() => router.push("/home"), 5000);
    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="min-h-dvh bg-white flex flex-col items-center justify-center px-6">
      {/* Animated checkmark */}
      <div className="mb-8">
        <svg width="120" height="120" viewBox="0 0 120 120">
          <circle
            cx="60"
            cy="60"
            r="50"
            fill="none"
            stroke="#16A34A"
            strokeWidth="4"
            strokeDasharray="314"
            strokeDashoffset="0"
            style={{ animation: "checkmark-circle 0.6s ease forwards" }}
          />
          <path
            d="M38 62 L52 76 L82 46"
            fill="none"
            stroke="#16A34A"
            strokeWidth="5"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray="60"
            strokeDashoffset="0"
            style={{ animation: "checkmark-check 0.4s 0.4s ease forwards" }}
          />
        </svg>
      </div>

      <h1 className="text-2xl font-bold text-[--color-success] mb-2">Payment Successful!</h1>
      <p className="text-4xl font-bold text-[--color-text] mb-1">RM {amount}</p>
      <p className="text-[--color-text-secondary] mb-6">to {vendorName}</p>

      <div className="bg-[--color-bg] rounded-xl px-6 py-3 mb-8">
        <p className="text-sm text-[--color-text-secondary]">Remaining Balance</p>
        <p className="text-lg font-bold text-[--color-text]">
          RM {parseFloat(newBalance).toFixed(2)}
        </p>
      </div>

      <button
        onClick={() => router.push("/home")}
        className="w-full max-w-xs h-12 rounded-xl font-semibold text-white"
        style={{ backgroundColor: "var(--color-primary)" }}
      >
        Done
      </button>

      <p className="text-xs text-[--color-text-secondary] mt-3">
        Redirecting to home in 5 seconds...
      </p>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-dvh flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-[--color-primary] border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <SuccessContent />
    </Suspense>
  );
}
