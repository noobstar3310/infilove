"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Download, Loader2, QrCode } from "lucide-react";

export default function GenerateQRPage() {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [appUrl, setAppUrl] = useState("");
  const router = useRouter();

  useEffect(() => {
    setAppUrl(window.location.origin);
    fetchVendors();
  }, []);

  const fetchVendors = async () => {
    try {
      const res = await fetch("/api/settlement/vendors");
      if (res.status === 401 || res.status === 403) {
        router.push("/login");
        return;
      }
      if (res.ok) {
        const data = await res.json();
        setVendors(data.vendors);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  const generateQR = async (vendor) => {
    const QRCode = (await import("qrcode")).default;
    const url = `${appUrl}/pay?vendor=${vendor.user_id}`;

    const canvas = document.createElement("canvas");
    canvas.width = 800;
    canvas.height = 1000;
    const ctx = canvas.getContext("2d");

    // White background
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, 800, 1000);

    // Blue header
    ctx.fillStyle = "#1A56DB";
    ctx.fillRect(0, 0, 800, 120);
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "bold 36px -apple-system, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("InfiLove E-Coupon", 400, 50);
    ctx.font = "24px -apple-system, sans-serif";
    ctx.fillText("Scan to Pay", 400, 90);

    // Stall name
    ctx.fillStyle = "#1F2937";
    ctx.font = "bold 40px -apple-system, sans-serif";
    ctx.fillText(vendor.stall_name || vendor.name, 400, 180);

    // Generate QR code as data URL
    const qrDataUrl = await QRCode.toDataURL(url, {
      width: 500,
      margin: 2,
      color: { dark: "#1A56DB", light: "#FFFFFF" },
    });

    const img = new Image();
    img.onload = () => {
      ctx.drawImage(img, 150, 210, 500, 500);

      // Vendor code
      ctx.fillStyle = "#6B7280";
      ctx.font = "28px -apple-system, monospace";
      ctx.fillText(`Code: ${vendor.stall_code || "V-" + vendor.user_id.slice(0, 4).toUpperCase()}`, 400, 760);

      // Footer
      ctx.fillStyle = "#9CA3AF";
      ctx.font = "20px -apple-system, sans-serif";
      ctx.fillText("Present this QR code at your stall", 400, 820);

      // Border
      ctx.strokeStyle = "#E5E7EB";
      ctx.lineWidth = 4;
      ctx.strokeRect(2, 2, 796, 996);

      // Download
      const link = document.createElement("a");
      link.download = `QR-${(vendor.stall_name || vendor.name).replace(/\s+/g, "-")}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    };
    img.src = qrDataUrl;
  };

  const generateAll = async () => {
    setGenerating(true);
    for (const vendor of vendors) {
      await generateQR(vendor);
      await new Promise((r) => setTimeout(r, 300));
    }
    setGenerating(false);
  };

  if (loading) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-[--color-bg]">
        <Loader2 className="w-8 h-8 animate-spin text-[--color-primary]" />
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-[--color-bg] pb-6">
      <div className="flex items-center gap-3 px-4 pt-12 pb-4 bg-white border-b border-[--color-border]">
        <button onClick={() => router.push("/admin")} className="p-1">
          <ArrowLeft className="w-6 h-6 text-[--color-text]" />
        </button>
        <h1 className="font-bold text-lg text-[--color-text] flex-1">Vendor QR Codes</h1>
        <button
          onClick={generateAll}
          disabled={generating}
          className="flex items-center gap-1 text-sm font-semibold text-[--color-primary]"
        >
          {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
          All
        </button>
      </div>

      <div className="px-5 py-4 space-y-2">
        {vendors.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center shadow-sm">
            <p className="text-[--color-text-secondary]">No vendors found</p>
          </div>
        ) : (
          vendors.map((v) => (
            <div
              key={v.user_id}
              className="bg-white rounded-xl p-4 shadow-sm flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[--color-primary-light] flex items-center justify-center">
                  <QrCode className="w-5 h-5 text-[--color-primary]" />
                </div>
                <div>
                  <p className="font-medium text-sm text-[--color-text]">
                    {v.stall_name || v.name}
                  </p>
                  <p className="text-xs text-[--color-text-secondary]">
                    {v.stall_code || "V-" + v.user_id.slice(0, 4).toUpperCase()}
                  </p>
                </div>
              </div>
              <button
                onClick={() => generateQR(v)}
                className="flex items-center gap-1 text-sm font-medium text-[--color-primary] px-3 py-1.5 rounded-lg bg-[--color-primary-light]"
              >
                <Download className="w-4 h-4" />
                PNG
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
