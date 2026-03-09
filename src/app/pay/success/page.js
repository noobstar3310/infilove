"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, Suspense } from "react";
import { Check } from "lucide-react";

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
      {/* Success circle */}
      <div className="relative mb-8">
        <div className="w-24 h-24 rounded-full flex items-center justify-center animate-scale-bounce" style={{ background: "linear-gradient(135deg, #10B981, #34D399)", boxShadow: "0 8px 32px rgba(16, 185, 129, 0.35)" }}>
          <Check className="w-12 h-12 text-white" strokeWidth={3} />
        </div>
        {/* Pulse rings */}
        <div className="absolute inset-0 rounded-full border-2 border-[--color-success] opacity-30" style={{ animation: "pulse-ring 1.5s ease-out infinite" }} />
        <div className="absolute inset-0 rounded-full border-2 border-[--color-success] opacity-20" style={{ animation: "pulse-ring 1.5s 0.3s ease-out infinite" }} />
      </div>

      <h1 className="text-[24px] font-bold text-[--color-text] mb-1 animate-fade-in-up">Payment Successful</h1>
      <p className="text-[--color-text-secondary] text-[14px] mb-5 animate-fade-in-up" style={{ animationDelay: "100ms" }}>Your payment has been processed</p>

      <div className="animate-fade-in-up" style={{ animationDelay: "150ms" }}>
        <p className="text-[44px] font-bold text-[--color-text] text-center leading-none">RM {amount}</p>
        <p className="text-[15px] text-[--color-text-secondary] text-center mt-2">to {vendorName}</p>
      </div>

      <div className="card p-4 mt-8 w-full max-w-[280px] text-center animate-fade-in-up" style={{ animationDelay: "250ms", background: "var(--color-bg)" }}>
        <p className="text-[12px] text-[--color-text-tertiary] mb-0.5">Remaining Balance</p>
        <p className="text-[20px] font-bold text-[--color-text]">RM {parseFloat(newBalance).toFixed(2)}</p>
      </div>

      <button onClick={() => router.push("/home")} className="btn-primary mt-8 max-w-[280px] animate-fade-in-up" style={{ animationDelay: "350ms" }}>
        Done
      </button>

      <p className="text-[12px] text-[--color-text-tertiary] mt-3 animate-fade-in" style={{ animationDelay: "400ms" }}>
        Redirecting in 5 seconds...
      </p>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={<div className="min-h-dvh flex items-center justify-center"><div className="w-7 h-7 border-3 border-[--color-primary] border-t-transparent rounded-full animate-spin" /></div>}>
      <SuccessContent />
    </Suspense>
  );
}
