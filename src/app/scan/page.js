"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { X, Keyboard, Loader2, ScanLine, Search } from "lucide-react";

export default function ScanPage() {
  const [manualMode, setManualMode] = useState(false);
  const [vendorCode, setVendorCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [hasCamera, setHasCamera] = useState(true);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const scanningRef = useRef(false);
  const router = useRouter();

  const stopCamera = useCallback(() => {
    scanningRef.current = false;
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  const handleClose = useCallback(() => {
    stopCamera();
    router.push("/home");
  }, [stopCamera, router]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const vendor = params.get("vendor");
    if (vendor) { router.push(`/pay/${vendor}`); return; }

    if (!manualMode) {
      startCamera();
    } else {
      stopCamera();
    }

    return () => stopCamera();
  }, [manualMode]);

  // Also stop camera when page becomes hidden (tab switch, app minimize)
  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden) stopCamera();
      else if (!manualMode) startCamera();
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [manualMode, stopCamera]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        scanQR();
      }
    } catch {
      setHasCamera(false);
      setManualMode(true);
    }
  };

  const scanQR = () => {
    if (scanningRef.current) return;
    scanningRef.current = true;
    const checkQR = () => {
      if (!scanningRef.current || !videoRef.current || !canvasRef.current) return;
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      if (video.readyState === video.HAVE_ENOUGH_DATA) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0);
        if ("BarcodeDetector" in window) {
          const detector = new BarcodeDetector({ formats: ["qr_code"] });
          detector.detect(video).then((barcodes) => {
            if (barcodes.length > 0) { handleQRResult(barcodes[0].rawValue); return; }
            if (scanningRef.current) requestAnimationFrame(checkQR);
          }).catch(() => { if (scanningRef.current) requestAnimationFrame(checkQR); });
          return;
        }
      }
      if (scanningRef.current) requestAnimationFrame(checkQR);
    };
    requestAnimationFrame(checkQR);
  };

  const handleQRResult = (result) => {
    scanningRef.current = false;
    stopCamera();
    try {
      const url = new URL(result);
      const vendor = url.searchParams.get("vendor");
      if (vendor) { router.push(`/pay/${vendor}`); return; }
      if (url.pathname.startsWith("/pay/")) { router.push(url.pathname); return; }
    } catch {
      if (result.match(/^V-\d+$/i) || result.match(/^[a-f0-9-]{36}$/i)) { router.push(`/pay/${result}`); return; }
    }
    setError("Invalid QR code. Please scan a vendor stall QR code.");
    setTimeout(() => { setError(""); startCamera(); }, 2000);
  };

  const handleManualSubmit = async () => {
    if (!vendorCode.trim()) return;
    setLoading(true); setError("");
    try {
      const res = await fetch(`/api/vendor/${vendorCode.trim()}`);
      if (res.ok) { const data = await res.json(); stopCamera(); router.push(`/pay/${data.vendor_id}`); }
      else setError("Vendor not found. Please check the code.");
    } catch { setError("Network error."); } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 bg-black flex flex-col">
      <canvas ref={canvasRef} className="hidden" />
      {!manualMode ? (
        <>
          {/* Full-screen camera */}
          <video
            ref={videoRef}
            className="absolute inset-0 w-full h-full object-cover"
            playsInline
            muted
            autoPlay
          />

          {/* Overlay with scan window cutout */}
          <div className="absolute inset-0 flex flex-col items-center z-10">
            {/* Top overlay */}
            <div className="w-full flex-1" style={{ background: "rgba(0,0,0,0.55)" }} />

            {/* Middle row: left overlay + scan window + right overlay */}
            <div className="flex w-full items-center">
              <div className="flex-1 h-[260px]" style={{ background: "rgba(0,0,0,0.55)" }} />
              <div className="w-[260px] h-[260px] relative">
                {/* Corner brackets */}
                <div className="absolute -top-0.5 -left-0.5 w-14 h-14 border-t-[3px] border-l-[3px] border-white rounded-tl-2xl" />
                <div className="absolute -top-0.5 -right-0.5 w-14 h-14 border-t-[3px] border-r-[3px] border-white rounded-tr-2xl" />
                <div className="absolute -bottom-0.5 -left-0.5 w-14 h-14 border-b-[3px] border-l-[3px] border-white rounded-bl-2xl" />
                <div className="absolute -bottom-0.5 -right-0.5 w-14 h-14 border-b-[3px] border-r-[3px] border-white rounded-br-2xl" />
                {/* Scan line */}
                <div className="absolute left-4 right-4 h-[2px] bg-[--color-primary] rounded-full top-1/2" style={{ boxShadow: "0 0 12px var(--color-primary), 0 0 40px var(--color-primary)" }} />
              </div>
              <div className="flex-1 h-[260px]" style={{ background: "rgba(0,0,0,0.55)" }} />
            </div>

            {/* Bottom overlay */}
            <div className="w-full flex-1 flex flex-col items-center justify-start pt-8 gap-3" style={{ background: "rgba(0,0,0,0.55)" }}>
              <div className="flex items-center gap-2">
                <ScanLine className="w-4 h-4 text-white/60" />
                <p className="text-white/60 text-[14px] font-medium">Scan vendor QR code to pay</p>
              </div>
              {error && (
                <div className="px-4 py-2 rounded-xl bg-[--color-error] text-white text-[13px] font-medium animate-scale-in">{error}</div>
              )}
            </div>
          </div>

          {/* Close button */}
          <button
            onClick={handleClose}
            className="absolute top-14 left-5 w-10 h-10 rounded-xl flex items-center justify-center z-20"
            style={{ background: "rgba(0,0,0,0.4)", backdropFilter: "blur(10px)" }}
          >
            <X className="w-5 h-5 text-white" />
          </button>

          {/* Manual entry button */}
          <div className="absolute bottom-0 left-0 right-0 z-20 px-6 py-5 pb-[calc(env(safe-area-inset-bottom,8px)+20px)]">
            <button onClick={() => setManualMode(true)} className="flex items-center justify-center gap-2 w-full text-white/40 text-[13px] font-medium">
              <Keyboard className="w-4 h-4" /> Enter vendor code manually
            </button>
          </div>
        </>
      ) : (
        <div className="flex-1 flex flex-col bg-[--color-bg] pt-14 px-6">
          <button onClick={handleClose} className="absolute top-14 left-5 w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm">
            <X className="w-5 h-5 text-[--color-text]" />
          </button>
          <div className="mt-8">
            <h2 className="text-[22px] font-bold text-[--color-text] mb-1">Enter Vendor Code</h2>
            <p className="text-[14px] text-[--color-text-secondary] mb-6">Type the code shown on the vendor&apos;s QR poster</p>
            <div className="relative mb-3">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-xl bg-[--color-primary-light] flex items-center justify-center">
                <Search className="w-[18px] h-[18px] text-[--color-primary]" />
              </div>
              <input type="text" value={vendorCode} onChange={(e) => setVendorCode(e.target.value.toUpperCase())} onKeyDown={(e) => e.key === "Enter" && handleManualSubmit()} placeholder="e.g. V-001" className="input-base pl-16 text-center text-[20px] font-bold tracking-[0.15em]" autoFocus />
            </div>
            {error && (
              <div className="flex items-center gap-2 mb-3 px-1 animate-fade-in">
                <div className="w-1.5 h-1.5 rounded-full bg-[--color-error]" />
                <p className="text-[13px] text-[--color-error]">{error}</p>
              </div>
            )}
            <button onClick={handleManualSubmit} disabled={!vendorCode.trim() || loading} className="btn-primary">
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Find Vendor"}
            </button>
            {hasCamera && (
              <button onClick={() => { setManualMode(false); setError(""); }} className="w-full mt-4 text-[14px] text-[--color-primary] font-semibold text-center">
                Use camera scanner instead
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
