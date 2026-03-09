"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Heart, Mail, ArrowLeft, Loader2, Shield } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [step, setStep] = useState("email");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resendTimer, setResendTimer] = useState(0);
  const [shake, setShake] = useState(false);
  const [devOtp, setDevOtp] = useState("");
  const otpRefs = useRef([]);
  const router = useRouter();

  useEffect(() => {
    if (resendTimer <= 0) return;
    const t = setTimeout(() => setResendTimer((v) => v - 1), 1000);
    return () => clearTimeout(t);
  }, [resendTimer]);

  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const requestOtp = async () => {
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/request-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.message); return; }
      if (data.dev_otp) setDevOtp(data.dev_otp);
      setStep("otp");
      setResendTimer(60);
      setTimeout(() => otpRefs.current[0]?.focus(), 150);
    } catch {
      setError("No internet connection. Please check your network.");
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = useCallback(
    async (otpString) => {
      setError("");
      setLoading(true);
      try {
        const res = await fetch("/api/auth/verify-otp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, otp_code: otpString }),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.message);
          setShake(true);
          setTimeout(() => setShake(false), 400);
          setOtp(["", "", "", "", "", ""]);
          setTimeout(() => otpRefs.current[0]?.focus(), 150);
          return;
        }
        const role = data.user.role;
        if (role === "admin") router.push("/admin");
        else if (role === "vendor") router.push("/vendor");
        else router.push("/home");
      } catch {
        setError("No internet connection. Please check your network.");
      } finally {
        setLoading(false);
      }
    },
    [email, router]
  );

  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    if (value && index < 5) otpRefs.current[index + 1]?.focus();
    const otpString = newOtp.join("");
    if (otpString.length === 6) verifyOtp(otpString);
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 6) {
      setOtp(pasted.split(""));
      verifyOtp(pasted);
    }
  };

  return (
    <div className="min-h-dvh flex flex-col justify-center bg-white relative overflow-hidden">
      {/* Decorative background blobs */}
      <div className="absolute -top-32 -right-32 w-80 h-80 rounded-full opacity-20" style={{ background: "radial-gradient(circle, #2563EB, transparent)" }} />
      <div className="absolute -top-16 -left-16 w-48 h-48 rounded-full opacity-10" style={{ background: "radial-gradient(circle, #06B6D4, transparent)" }} />

      {/* Top hero */}
      <div className="relative flex flex-col items-center pb-12 px-6">
        {/* Animated logo */}
        <div className="relative mb-5">
          <div className="w-20 h-20 rounded-[22px] gradient-primary flex items-center justify-center shadow-lg" style={{ boxShadow: "0 8px 32px rgba(37, 99, 235, 0.35)" }}>
            <Heart className="w-9 h-9 text-white" fill="white" strokeWidth={0} />
          </div>
          {/* Pulse ring */}
          <div className="absolute inset-0 rounded-[22px] border-2 border-[--color-primary] opacity-30" style={{ animation: "pulse-ring 2s ease-out infinite" }} />
        </div>

        <h1 className="text-[28px] font-bold text-[--color-text] tracking-tight">InfiLove</h1>
        <p className="text-[--color-text-secondary] text-[15px] mt-1">Support OKU Entrepreneurs</p>
      </div>

      {/* Form area */}
      <div className="px-6 pb-8">
        {step === "email" ? (
          <div className="animate-fade-in-up">
            {/* Email label */}
            <div className="mb-6">
              <h2 className="text-[22px] font-bold text-[--color-text] mb-1">Get Started</h2>
              <p className="text-[--color-text-secondary] text-[14px]">
                Enter your email to sign in or create an account
              </p>
            </div>

            {/* Email input */}
            <div className="relative mb-3">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-xl bg-[--color-primary-light] flex items-center justify-center">
                <Mail className="w-[18px] h-[18px] text-[--color-primary]" />
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(""); }}
                onKeyDown={(e) => e.key === "Enter" && isValidEmail && requestOtp()}
                placeholder="your@email.com"
                className="input-base !pl-[60px]"
                style={error ? { borderColor: "var(--color-error)", boxShadow: "0 0 0 3px var(--color-error-light)" } : {}}
                autoFocus
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 mb-3 px-1 animate-fade-in">
                <div className="w-1.5 h-1.5 rounded-full bg-[--color-error] flex-shrink-0" />
                <p className="text-[13px] text-[--color-error]">{error}</p>
              </div>
            )}

            <button onClick={requestOtp} disabled={!isValidEmail || loading} className="btn-primary mt-2">
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Continue"}
            </button>

            {/* Trust indicators */}
            <div className="flex items-center justify-center gap-2 mt-6 text-[--color-text-tertiary]">
              <Shield className="w-3.5 h-3.5" />
              <p className="text-[12px]">
                New users are registered automatically
              </p>
            </div>

            {devOtp && (
              <div className="mt-3 mx-auto px-4 py-2 rounded-xl bg-amber-50 border border-amber-200 w-fit">
                <p className="text-[12px] text-amber-700 font-mono font-semibold text-center">DEV OTP: {devOtp}</p>
              </div>
            )}
          </div>
        ) : (
          <div className={shake ? "animate-shake" : "animate-fade-in-up"}>
            {/* Back button */}
            <button
              onClick={() => { setStep("email"); setOtp(["", "", "", "", "", ""]); setError(""); }}
              className="flex items-center gap-1.5 text-[--color-primary] text-[14px] font-semibold mb-5 -ml-1"
            >
              <ArrowLeft className="w-[18px] h-[18px]" /> Change email
            </button>

            <h2 className="text-[22px] font-bold text-[--color-text] mb-1">Verify your email</h2>
            <p className="text-[14px] text-[--color-text-secondary] mb-8">
              Enter the 6-digit code sent to{" "}
              <span className="font-semibold text-[--color-text]">{email}</span>
            </p>

            {/* OTP boxes */}
            <div className="flex gap-2.5 justify-center mb-5" onPaste={handleOtpPaste}>
              {otp.map((digit, i) => (
                <input
                  key={i}
                  ref={(el) => (otpRefs.current[i] = el)}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(i, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(i, e)}
                  className="w-[50px] h-[58px] text-center text-[22px] font-bold rounded-2xl border-2 transition-all duration-200"
                  style={{
                    borderColor: error ? "var(--color-error)" : digit ? "var(--color-primary)" : "hsl(210 15% 70%)",
                    backgroundColor: digit ? "var(--color-primary-light)" : "hsl(210 20% 95%)",
                    boxShadow: digit ? "0 0 0 3px var(--color-primary-glow)" : "inset 0 2px 4px rgba(0,0,0,0.08)",
                    color: "var(--color-text)",
                  }}
                />
              ))}
            </div>

            {error && (
              <div className="flex items-center justify-center gap-2 mb-4 animate-fade-in">
                <div className="w-1.5 h-1.5 rounded-full bg-[--color-error] flex-shrink-0" />
                <p className="text-[13px] text-[--color-error]">{error}</p>
              </div>
            )}

            {loading && (
              <div className="flex items-center justify-center gap-2 mb-4">
                <Loader2 className="w-5 h-5 animate-spin text-[--color-primary]" />
                <span className="text-[14px] text-[--color-text-secondary]">Verifying...</span>
              </div>
            )}

            <div className="text-center">
              {resendTimer > 0 ? (
                <p className="text-[14px] text-[--color-text-tertiary]">
                  Resend code in <span className="font-semibold text-[--color-text-secondary] tabular-nums">{resendTimer}s</span>
                </p>
              ) : (
                <button onClick={requestOtp} className="text-[14px] text-[--color-primary] font-semibold">
                  Resend code
                </button>
              )}
            </div>

            {devOtp && (
              <div className="mt-4 mx-auto px-4 py-2 rounded-xl bg-amber-50 border border-amber-200 w-fit">
                <p className="text-[12px] text-amber-700 font-mono font-semibold text-center">DEV OTP: {devOtp}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
