"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Search, CreditCard, ClipboardList, BarChart3, Landmark, QrCode,
  LogOut, Loader2, User, ChevronRight,
} from "lucide-react";

export default function AdminPanel() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchEmail, setSearchEmail] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [customAmount, setCustomAmount] = useState("");
  const [topUpLoading, setTopUpLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [showConfirm, setShowConfirm] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const fetchUser = async () => {
      const res = await fetch("/api/wallet/balance");
      if (res.status === 401) { router.push("/login"); return; }
      if (res.ok) { const d = await res.json(); if (d.user.role !== "admin") { router.push("/home"); return; } setUser(d.user); }
      setLoading(false);
    };
    fetchUser();
  }, [router]);

  const searchUsers = async (query) => {
    setSearchEmail(query);
    if (query.length < 2) { setSearchResults([]); return; }
    setSearching(true);
    try {
      const res = await fetch(`/api/admin/search-user?q=${encodeURIComponent(query)}`);
      if (res.ok) { const d = await res.json(); setSearchResults(d.users || []); }
    } catch {} finally { setSearching(false); }
  };

  const selectUser = (u) => { setSelectedUser(u); setSearchEmail(""); setSearchResults([]); };

  const handleTopUp = (amount) => setShowConfirm({ amount, userName: selectedUser.name });

  const confirmTopUp = async () => {
    const amount = showConfirm.amount;
    setTopUpLoading(true); setShowConfirm(null);
    try {
      const res = await fetch("/api/wallet/topup", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ user_id: selectedUser.user_id, amount: amount.toFixed(2) }) });
      const data = await res.json();
      if (data.success) {
        setSelectedUser((p) => ({ ...p, balance: data.new_balance }));
        setToast({ type: "success", message: `RM ${amount.toFixed(2)} credited to ${selectedUser.name}` });
      } else { setToast({ type: "error", message: data.message }); }
    } catch { setToast({ type: "error", message: "Network error" }); } finally { setTopUpLoading(false); setCustomAmount(""); }
    setTimeout(() => setToast(null), 3000);
  };

  const handleLogout = async () => { await fetch("/api/auth/logout", { method: "POST" }); router.push("/login"); };

  if (loading) return <div className="min-h-dvh flex items-center justify-center bg-[--color-bg]"><Loader2 className="w-7 h-7 animate-spin text-[--color-primary]" /></div>;

  const quickAmounts = [
    { value: 10, label: "RM 10", gradient: "linear-gradient(135deg, #93C5FD, #60A5FA)" },
    { value: 20, label: "RM 20", gradient: "linear-gradient(135deg, #3B82F6, #2563EB)" },
    { value: 50, label: "RM 50", gradient: "linear-gradient(135deg, #2563EB, #1D4ED8)" },
    { value: 100, label: "RM 100", gradient: "linear-gradient(135deg, #1D4ED8, #1E3A5F)" },
  ];

  const navItems = [
    { icon: ClipboardList, label: "Transactions", href: "/admin/transactions" },
    { icon: Landmark, label: "Settlement", href: "/admin/settlement" },
    { icon: BarChart3, label: "Dashboard", href: "/admin/dashboard" },
    { icon: QrCode, label: "QR Codes", href: "/admin/generate-qr" },
  ];

  return (
    <div className="min-h-dvh bg-[--color-bg] pb-8">
      {/* Toast */}
      {toast && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[60] px-5 py-3 rounded-2xl text-white text-[14px] font-semibold shadow-xl animate-fade-in-up max-w-[90%]"
          style={{ backgroundColor: toast.type === "success" ? "var(--color-success)" : "var(--color-error)" }}>{toast.message}</div>
      )}

      {/* Header */}
      <div className="gradient-primary relative overflow-hidden" style={{ borderRadius: "0 0 28px 28px" }}>
        <div className="absolute -top-12 -right-12 w-40 h-40 rounded-full bg-white/5" />
        <div className="relative px-5 pt-14 pb-6">
          <div className="flex items-center justify-between mb-5">
            <div><p className="text-white/60 text-[13px]">Admin Panel</p><h1 className="text-white text-[20px] font-bold">{user?.name || "Admin"}</h1></div>
            <button onClick={handleLogout} className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center"><LogOut className="w-[18px] h-[18px] text-white/80" /></button>
          </div>
          {/* Quick nav */}
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
            {navItems.map((item) => (
              <button key={item.href} onClick={() => router.push(item.href)}
                className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-xl px-3.5 py-2.5 text-white text-[12px] font-semibold flex-shrink-0 border border-white/5">
                <item.icon className="w-4 h-4" />{item.label}<ChevronRight className="w-3 h-3 text-white/40" />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="px-5 -mt-4 relative z-10">
        <div className="card p-4">
          <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 w-9 h-9 rounded-xl bg-[--color-primary-light] flex items-center justify-center">
              <Search className="w-[16px] h-[16px] text-[--color-primary]" />
            </div>
            <input type="text" value={searchEmail} onChange={(e) => searchUsers(e.target.value)} placeholder="Search user by email or name..." className="input-base pl-15 text-[14px]" style={{ paddingLeft: "56px" }} />
          </div>
          {searchResults.length > 0 && (
            <div className="mt-2 rounded-xl border border-[--color-border-light] overflow-hidden">
              {searchResults.map((u) => (
                <button key={u.user_id} onClick={() => selectUser(u)} className="w-full flex items-center gap-3 px-3 py-3 text-left border-b border-[--color-border-light] last:border-b-0 active:bg-[--color-bg]">
                  <div className="w-9 h-9 rounded-xl bg-[--color-primary-light] flex items-center justify-center"><User className="w-4 h-4 text-[--color-primary]" /></div>
                  <div className="flex-1 min-w-0"><p className="text-[14px] font-semibold text-[--color-text] truncate">{u.name}</p><p className="text-[12px] text-[--color-text-tertiary] truncate">{u.email}</p></div>
                  <span className="text-[13px] font-bold text-[--color-primary] tabular-nums">RM {parseFloat(u.balance || 0).toFixed(2)}</span>
                </button>
              ))}
            </div>
          )}
          {searching && <div className="flex justify-center py-3"><Loader2 className="w-5 h-5 animate-spin text-[--color-primary]" /></div>}
        </div>
      </div>

      {/* Selected user + top-up */}
      {selectedUser && (
        <div className="px-5 mt-4 animate-fade-in-up">
          <div className="card p-5 mb-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl gradient-primary flex items-center justify-center"><User className="w-6 h-6 text-white" /></div>
              <div className="flex-1 min-w-0"><p className="font-bold text-[16px] text-[--color-text] truncate">{selectedUser.name}</p><p className="text-[12px] text-[--color-text-tertiary] truncate">{selectedUser.email}</p></div>
            </div>
            <div className="bg-[--color-bg] rounded-xl p-4 flex items-center justify-between">
              <span className="text-[13px] text-[--color-text-secondary] font-medium">Current Balance</span>
              <span className="text-[20px] font-bold text-[--color-primary] tabular-nums">RM {parseFloat(selectedUser.balance || 0).toFixed(2)}</span>
            </div>
          </div>

          <div className="card p-5">
            <h3 className="font-bold text-[16px] text-[--color-text] mb-3 flex items-center gap-2"><CreditCard className="w-5 h-5 text-[--color-primary]" />Quick Top-Up</h3>
            <div className="grid grid-cols-2 gap-2.5 mb-4">
              {quickAmounts.map((qa) => (
                <button key={qa.value} onClick={() => handleTopUp(qa.value)} disabled={topUpLoading}
                  className="h-[64px] rounded-2xl text-white font-bold text-[18px] transition-transform active:scale-95 disabled:opacity-50"
                  style={{ background: qa.gradient, boxShadow: "0 4px 12px rgba(37, 99, 235, 0.2)" }}>{qa.label}</button>
              ))}
            </div>
            <div className="flex gap-2">
              <input type="number" value={customAmount} onChange={(e) => setCustomAmount(e.target.value)} placeholder="Custom amount" step="1" min="1" className="input-base flex-1 text-[14px]" />
              <button onClick={() => { const v = parseFloat(customAmount); if (v >= 1) handleTopUp(v); }}
                disabled={!customAmount || parseFloat(customAmount) < 1 || topUpLoading} className="btn-primary" style={{ width: "auto", padding: "0 24px" }}>
                {topUpLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Top Up"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation modal */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 animate-fade-in" onClick={() => setShowConfirm(null)}>
          <div className="bg-white rounded-t-[28px] w-full max-w-[430px] p-6 pt-8 animate-slide-up" onClick={(e) => e.stopPropagation()}>
            <div className="w-10 h-1 rounded-full bg-[--color-border] mx-auto mb-6" />
            <h3 className="text-[18px] font-bold text-center mb-5">Confirm Top-Up</h3>
            <div className="rounded-2xl p-4 mb-5 text-center" style={{ background: "var(--color-bg)" }}>
              <p className="text-[14px] text-[--color-text-secondary] mb-1">Credit to {showConfirm.userName}</p>
              <p className="text-[36px] font-bold text-[--color-primary]">RM {showConfirm.amount.toFixed(2)}</p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowConfirm(null)} className="btn-secondary flex-1">Cancel</button>
              <button onClick={confirmTopUp} className="btn-primary flex-1" style={{ width: "auto" }}>Confirm</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
