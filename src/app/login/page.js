"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Heart, Mail, ArrowLeft, Loader2, WifiOff } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [step, setStep] = useState("email"); // email | otp
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resendTimer, setResendTimer] = useState(0);
  const [shake, setShake] = useState(false);
  const [devOtp, setDevOtp] = useState("");
  const otpRefs = useRef([]);
  const router = useRouter();

  // Resend countdown timer
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
      if (!res.ok) {
        setError(data.message);
        return;
      }
      if (data.dev_otp) setDevOtp(data.dev_otp);
      setStep("otp");
      setResendTimer(60);
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
    } catch {
      setError("No internet connection. Please check your network and try again.");
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
          setTimeout(() => otpRefs.current[0]?.focus(), 100);
          return;
        }
        // Redirect based on role
        const role = data.user.role;
        if (role === "admin") router.push("/admin");
        else if (role === "vendor") router.push("/vendor");
        else router.push("/home");
      } catch {
        setError("No internet connection. Please check your network and try again.");
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

    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all filled
    const otpString = newOtp.join("");
    if (otpString.length === 6) {
      verifyOtp(otpString);
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 6) {
      const newOtp = pasted.split("");
      setOtp(newOtp);
      verifyOtp(pasted);
    }
  };

  return (
    <div className="min-h-dvh flex flex-col">
      {/* Blue gradient top */}
      <div
        className="flex-shrink-0 flex flex-col items-center justify-center px-6 pt-16 pb-24"
        style={{
          background: "linear-gradient(135deg, #1A56DB 0%, #0EA5E9 100%)",
          minHeight: "40dvh",
        }}
      >
        <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center mb-4">
          <Heart className="w-10 h-10 text-white" fill="white" />
        </div>
        <h1 className="text-2xl font-bold text-white">InfiLove</h1>
        <p className="text-white/80 text-sm mt-1">Support OKU Entrepreneurs</p>
      </div>

      {/* White card form */}
      <div className="flex-1 bg-white -mt-6 rounded-t-2xl px-6 pt-8 pb-6 relative">
        {step === "email" ? (
          <div className="animate-fade-in-up">
            <h2 className="text-xl font-bold text-[--color-text] mb-1">Welcome</h2>
            <p className="text-sm text-[--color-text-secondary] mb-6">
              Enter your email to get started
            </p>

            <div className="relative mb-4">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[--color-text-secondary]" />
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError("");
                }}
                onKeyDown={(e) => e.key === "Enter" && isValidEmail && requestOtp()}
                placeholder="Enter your email address"
                className="w-full h-12 pl-11 pr-4 rounded-xl border border-[--color-border] focus:border-[--color-primary] focus:outline-none focus:ring-2 focus:ring-[--color-primary]/20 text-base"
                style={error ? { borderColor: "var(--color-error)" } : {}}
                autoFocus
              />
            </div>

            {error && <p className="text-sm text-[--color-error] mb-4">{error}</p>}

            <button
              onClick={requestOtp}
              disabled={!isValidEmail || loading}
              className="w-full h-12 rounded-xl font-semibold text-white transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50"
              style={{ backgroundColor: "var(--color-primary)" }}
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Send OTP"}
            </button>

            <p className="text-xs text-center text-[--color-text-secondary] mt-4">
              New here? You will be registered automatically
            </p>

            {devOtp && (
              <p className="text-xs text-center text-[--color-warning] mt-2 font-mono">
                [DEV] OTP: {devOtp}
              </p>
            )}
          </div>
        ) : (
          <div className={`animate-fade-in-up ${shake ? "animate-shake" : ""}`}>
            <button
              onClick={() => {
                setStep("email");
                setOtp(["", "", "", "", "", ""]);
                setError("");
              }}
              className="flex items-center gap-1 text-[--color-primary] text-sm font-medium mb-4"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </button>

            <h2 className="text-xl font-bold text-[--color-text] mb-1">Enter OTP</h2>
            <p className="text-sm text-[--color-text-secondary] mb-6">
              We sent a 6-digit code to{" "}
              <span className="font-semibold text-[--color-text]">{email}</span>
            </p>

            {/* OTP inputs */}
            <div className="flex gap-3 justify-center mb-4" onPaste={handleOtpPaste}>
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
                  className="w-12 h-14 text-center text-xl font-bold rounded-xl border-2 border-[--color-border] focus:border-[--color-primary] focus:outline-none focus:ring-2 focus:ring-[--color-primary]/20"
                  style={error ? { borderColor: "var(--color-error)" } : {}}
                />
              ))}
            </div>

            {error && <p className="text-sm text-[--color-error] text-center mb-4">{error}</p>}

            {loading && (
              <div className="flex justify-center mb-4">
                <Loader2 className="w-6 h-6 animate-spin text-[--color-primary]" />
              </div>
            )}

            <p className="text-sm text-center text-[--color-text-secondary]">
              {resendTimer > 0 ? (
                <>Resend code in {resendTimer}s</>
              ) : (
                <button
                  onClick={requestOtp}
                  className="text-[--color-primary] font-semibold"
                >
                  Resend OTP
                </button>
              )}
            </p>

            {devOtp && (
              <p className="text-xs text-center text-[--color-warning] mt-2 font-mono">
                [DEV] OTP: {devOtp}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
