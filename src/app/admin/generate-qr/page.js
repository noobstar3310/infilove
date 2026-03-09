"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Download, Loader2, QrCode } from "lucide-react";

export default function GenerateQRPage() {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [appUrl, setAppUrl] = useState("");
  const router = useRouter();

  useEffect(() => { setAppUrl(window.location.origin); fetchVendors(); }, []);

  const fetchVendors = async () => {
    try {
      const res = await fetch("/api/settlement/vendors");
      if (res.status === 401 || res.status === 403) { router.push("/login"); return; }
      if (res.ok) { const d = await res.json(); setVendors(d.vendors); }
    } catch {} finally { setLoading(false); }
  };

  const generateQR = async (vendor) => {
    const QRCode = (await import("qrcode")).default;
    const url = `${appUrl}/pay?vendor=${vendor.user_id}`;
    const canvas = document.createElement("canvas");
    canvas.width = 800; canvas.height = 1000;
    const ctx = canvas.getContext("2d");

    // Background
    ctx.fillStyle = "#FFFFFF"; ctx.fillRect(0, 0, 800, 1000);
    // Blue header
    const grd = ctx.createLinearGradient(0, 0, 800, 120);
    grd.addColorStop(0, "#2563EB"); grd.addColorStop(1, "#06B6D4");
    ctx.fillStyle = grd; ctx.beginPath(); ctx.roundRect(0, 0, 800, 130, [0, 0, 20, 20]); ctx.fill();
    ctx.fillStyle = "#FFFFFF"; ctx.font = "bold 36px -apple-system, sans-serif"; ctx.textAlign = "center";
    ctx.fillText("InfiLove E-Coupon", 400, 55);
    ctx.font = "24px -apple-system, sans-serif"; ctx.fillText("Scan to Pay", 400, 95);
    // Stall name
    ctx.fillStyle = "#111827"; ctx.font = "bold 38px -apple-system, sans-serif";
    ctx.fillText(vendor.stall_name || vendor.name, 400, 190);

    const qrDataUrl = await QRCode.toDataURL(url, { width: 480, margin: 2, color: { dark: "#2563EB", light: "#FFFFFF" } });
    const img = new Image();
    img.onload = () => {
      ctx.drawImage(img, 160, 220, 480, 480);
      ctx.fillStyle = "#6B7280"; ctx.font = "600 26px monospace"; ctx.textAlign = "center";
      ctx.fillText(`Code: ${vendor.stall_code || "V-" + vendor.user_id.slice(0, 4).toUpperCase()}`, 400, 750);
      ctx.fillStyle = "#9CA3AF"; ctx.font = "20px -apple-system, sans-serif";
      ctx.fillText("Present this QR code at your stall", 400, 800);
      // Border
      ctx.strokeStyle = "#E5E7EB"; ctx.lineWidth = 3; ctx.beginPath(); ctx.roundRect(2, 2, 796, 996, 16); ctx.stroke();
      const link = document.createElement("a");
      link.download = `QR-${(vendor.stall_name || vendor.name).replace(/\s+/g, "-")}.png`;
      link.href = canvas.toDataURL("image/png"); link.click();
    };
    img.src = qrDataUrl;
  };

  const generateAll = async () => {
    setGenerating(true);
    for (const v of vendors) { await generateQR(v); await new Promise((r) => setTimeout(r, 300)); }
    setGenerating(false);
  };

  if (loading) return <div className="min-h-dvh flex items-center justify-center bg-[--color-bg]"><Loader2 className="w-7 h-7 animate-spin text-[--color-primary]" /></div>;

  return (
    <div className="min-h-dvh bg-[--color-bg] pb-6">
      <div className="bg-white px-4 pt-14 pb-4 flex items-center gap-3" style={{ boxShadow: "0 1px 3px var(--color-card-shadow)" }}>
        <button onClick={() => router.push("/admin")} className="w-10 h-10 rounded-xl bg-[--color-bg] flex items-center justify-center"><ArrowLeft className="w-5 h-5 text-[--color-text]" /></button>
        <h1 className="font-bold text-[18px] text-[--color-text] flex-1">Vendor QR Codes</h1>
        <button onClick={generateAll} disabled={generating} className="flex items-center gap-1.5 text-[13px] font-semibold text-[--color-primary] bg-[--color-primary-light] px-3.5 py-2 rounded-xl">
          {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />} Download All
        </button>
      </div>

      <div className="px-5 py-4 space-y-2">
        {vendors.length === 0 ? (
          <div className="card p-10 text-center"><p className="text-[14px] text-[--color-text-secondary]">No vendors found</p></div>
        ) : (
          vendors.map((v) => (
            <div key={v.user_id} className="card p-4 flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "var(--color-primary-light)" }}>
                  <QrCode className="w-5 h-5 text-[--color-primary]" />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-[14px] text-[--color-text] truncate">{v.stall_name || v.name}</p>
                  <p className="text-[12px] text-[--color-text-tertiary] font-mono">{v.stall_code || "V-" + v.user_id.slice(0, 4).toUpperCase()}</p>
                </div>
              </div>
              <button onClick={() => generateQR(v)} className="flex items-center gap-1.5 text-[13px] font-semibold text-[--color-primary] bg-[--color-primary-light] px-3 py-2 rounded-xl flex-shrink-0">
                <Download className="w-4 h-4" /> PNG
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
