"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { X, Flashlight, FlashlightOff, Keyboard } from "lucide-react";

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

  useEffect(() => {
    // Check URL params for vendor redirect
    const params = new URLSearchParams(window.location.search);
    const vendor = params.get("vendor");
    if (vendor) {
      router.push(`/pay/${vendor}`);
      return;
    }

    if (!manualMode) startCamera();
    return () => stopCamera();
  }, [manualMode]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        scanQR();
      }
    } catch {
      setHasCamera(false);
      setManualMode(true);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    scanningRef.current = false;
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
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

        // Use BarcodeDetector API if available
        if ("BarcodeDetector" in window) {
          const detector = new BarcodeDetector({ formats: ["qr_code"] });
          detector
            .detect(video)
            .then((barcodes) => {
              if (barcodes.length > 0) {
                handleQRResult(barcodes[0].rawValue);
                return;
              }
              if (scanningRef.current) requestAnimationFrame(checkQR);
            })
            .catch(() => {
              if (scanningRef.current) requestAnimationFrame(checkQR);
            });
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
      if (vendor) {
        router.push(`/pay/${vendor}`);
        return;
      }
      // Try path-based vendor ID
      if (url.pathname.startsWith("/pay/")) {
        router.push(url.pathname);
        return;
      }
    } catch {
      // Not a URL — try as vendor code directly
      if (result.match(/^V-\d+$/i) || result.match(/^[a-f0-9-]{36}$/i)) {
        router.push(`/pay/${result}`);
        return;
      }
    }

    setError("Invalid QR code. Please scan a vendor stall QR code.");
    setTimeout(() => {
      setError("");
      startCamera();
    }, 2000);
  };

  const handleManualSubmit = async () => {
    if (!vendorCode.trim()) return;
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`/api/vendor/${vendorCode.trim()}`);
      if (res.ok) {
        const data = await res.json();
        router.push(`/pay/${data.vendor_id}`);
      } else {
        setError("Vendor not found. Please check the code.");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-dvh bg-black relative flex flex-col">
      <canvas ref={canvasRef} className="hidden" />

      {/* Back button */}
      <button
        onClick={() => router.push("/home")}
        className="absolute top-12 left-4 z-20 w-10 h-10 rounded-full bg-black/50 flex items-center justify-center"
      >
        <X className="w-5 h-5 text-white" />
      </button>

      {!manualMode ? (
        <>
          {/* Camera view */}
          <div className="flex-1 relative">
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              playsInline
              muted
              autoPlay
            />

            {/* Scan overlay */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <p className="text-white text-sm font-medium mb-6 drop-shadow-lg">
                Scan vendor QR code to pay
              </p>
              <div className="w-64 h-64 relative">
                {/* Corner borders */}
                <div className="absolute top-0 left-0 w-12 h-12 border-t-4 border-l-4 border-[--color-primary] rounded-tl-lg" />
                <div className="absolute top-0 right-0 w-12 h-12 border-t-4 border-r-4 border-[--color-primary] rounded-tr-lg" />
                <div className="absolute bottom-0 left-0 w-12 h-12 border-b-4 border-l-4 border-[--color-primary] rounded-bl-lg" />
                <div className="absolute bottom-0 right-0 w-12 h-12 border-b-4 border-r-4 border-[--color-primary] rounded-br-lg" />
              </div>

              {error && (
                <div className="mt-4 bg-[--color-error] text-white px-4 py-2 rounded-lg text-sm">
                  {error}
                </div>
              )}
            </div>
          </div>

          {/* Bottom bar */}
          <div className="bg-black/80 px-6 py-6 pb-[calc(env(safe-area-inset-bottom,8px)+16px)]">
            <button
              onClick={() => setManualMode(true)}
              className="flex items-center justify-center gap-2 w-full text-white/70 text-sm"
            >
              <Keyboard className="w-4 h-4" />
              Camera not working? Enter vendor code manually
            </button>
          </div>
        </>
      ) : (
        /* Manual entry mode */
        <div className="flex-1 flex flex-col bg-[--color-bg] pt-20 px-6">
          <h2 className="text-xl font-bold text-[--color-text] mb-2">Enter Vendor Code</h2>
          <p className="text-sm text-[--color-text-secondary] mb-6">
            Enter the code shown on the vendor's QR poster (e.g., V-001)
          </p>

          <input
            type="text"
            value={vendorCode}
            onChange={(e) => setVendorCode(e.target.value.toUpperCase())}
            onKeyDown={(e) => e.key === "Enter" && handleManualSubmit()}
            placeholder="V-001"
            className="w-full h-14 px-4 rounded-xl border-2 border-[--color-border] focus:border-[--color-primary] focus:outline-none text-center text-2xl font-bold tracking-widest"
            autoFocus
          />

          {error && <p className="text-sm text-[--color-error] text-center mt-3">{error}</p>}

          <button
            onClick={handleManualSubmit}
            disabled={!vendorCode.trim() || loading}
            className="w-full h-12 mt-4 rounded-xl font-semibold text-white disabled:opacity-50"
            style={{ backgroundColor: "var(--color-primary)" }}
          >
            {loading ? "Looking up..." : "Find Vendor"}
          </button>

          {hasCamera && (
            <button
              onClick={() => {
                setManualMode(false);
                setError("");
              }}
              className="mt-4 text-[--color-primary] text-sm font-medium text-center"
            >
              Back to camera scanner
            </button>
          )}
        </div>
      )}
    </div>
  );
}
