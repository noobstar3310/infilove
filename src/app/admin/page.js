"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  CreditCard,
  ClipboardList,
  BarChart3,
  Landmark,
  QrCode,
  LogOut,
  Loader2,
  Check,
  User,
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
      if (res.status === 401) {
        router.push("/login");
        return;
      }
      if (res.ok) {
        const data = await res.json();
        if (data.user.role !== "admin") {
          router.push("/home");
          return;
        }
        setUser(data.user);
      }
      setLoading(false);
    };
    fetchUser();
  }, [router]);

  const searchUsers = async (query) => {
    setSearchEmail(query);
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    try {
      // Use the transactions API to search — or we need a user search endpoint
      // For now, search using a custom approach
      const res = await fetch(`/api/admin/search-user?q=${encodeURIComponent(query)}`);
      if (res.ok) {
        const data = await res.json();
        setSearchResults(data.users || []);
      }
    } catch {
      // silent
    } finally {
      setSearching(false);
    }
  };

  const selectUser = async (u) => {
    setSelectedUser(u);
    setSearchEmail("");
    setSearchResults([]);
  };

  const handleTopUp = async (amount) => {
    setShowConfirm({ amount, userName: selectedUser.name });
  };

  const confirmTopUp = async () => {
    const amount = showConfirm.amount;
    setTopUpLoading(true);
    setShowConfirm(null);

    try {
      const res = await fetch("/api/wallet/topup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: selectedUser.user_id,
          amount: amount.toFixed(2),
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSelectedUser((prev) => ({
          ...prev,
          balance: data.new_balance,
        }));
        setToast({ type: "success", message: `RM ${amount.toFixed(2)} credited to ${selectedUser.name}` });
        setTimeout(() => setToast(null), 3000);
      } else {
        setToast({ type: "error", message: data.message });
        setTimeout(() => setToast(null), 3000);
      }
    } catch {
      setToast({ type: "error", message: "Network error" });
      setTimeout(() => setToast(null), 3000);
    } finally {
      setTopUpLoading(false);
      setCustomAmount("");
    }
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  };

  if (loading) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-[--color-bg]">
        <Loader2 className="w-8 h-8 animate-spin text-[--color-primary]" />
      </div>
    );
  }

  const quickAmounts = [
    { value: 10, label: "RM 10", color: "#93C5FD" },
    { value: 20, label: "RM 20", color: "#3B82F6" },
    { value: 50, label: "RM 50", color: "#1D4ED8" },
    { value: 100, label: "RM 100", color: "#1E3A5F" },
  ];

  const navItems = [
    { icon: ClipboardList, label: "Transactions", href: "/admin/transactions" },
    { icon: Landmark, label: "Settlement", href: "/admin/settlement" },
    { icon: BarChart3, label: "Dashboard", href: "/admin/dashboard" },
    { icon: QrCode, label: "QR Codes", href: "/admin/generate-qr" },
  ];

  return (
    <div className="min-h-dvh bg-[--color-bg] pb-6">
      {/* Toast */}
      {toast && (
        <div
          className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-3 rounded-xl text-white text-sm font-medium shadow-lg animate-fade-in-up max-w-[90%]"
          style={{
            backgroundColor: toast.type === "success" ? "var(--color-success)" : "var(--color-error)",
          }}
        >
          {toast.message}
        </div>
      )}

      {/* Header */}
      <div
        className="px-5 pt-12 pb-5"
        style={{ background: "linear-gradient(135deg, #1A56DB 0%, #0EA5E9 100%)" }}
      >
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-lg font-bold text-white">Admin Panel</h1>
          <button onClick={handleLogout} className="text-white/70 active:text-white">
            <LogOut className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Nav */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {navItems.map((item) => (
            <button
              key={item.href}
              onClick={() => router.push(item.href)}
              className="flex items-center gap-2 bg-white/15 rounded-xl px-3 py-2 text-white text-xs font-medium flex-shrink-0"
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Search */}
      <div className="px-5 -mt-3">
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[--color-text-secondary]" />
            <input
              type="text"
              value={searchEmail}
              onChange={(e) => searchUsers(e.target.value)}
              placeholder="Search user by email..."
              className="w-full h-12 pl-11 pr-4 rounded-xl border border-[--color-border] focus:border-[--color-primary] focus:outline-none text-sm"
            />
          </div>

          {/* Search results dropdown */}
          {searchResults.length > 0 && (
            <div className="mt-2 border border-[--color-border] rounded-xl overflow-hidden">
              {searchResults.map((u) => (
                <button
                  key={u.user_id}
                  onClick={() => selectUser(u)}
                  className="w-full flex items-center gap-3 px-3 py-3 hover:bg-[--color-bg] text-left border-b border-[--color-border] last:border-b-0"
                >
                  <div className="w-8 h-8 rounded-full bg-[--color-primary-light] flex items-center justify-center">
                    <User className="w-4 h-4 text-[--color-primary]" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[--color-text]">{u.name}</p>
                    <p className="text-xs text-[--color-text-secondary]">{u.email}</p>
                  </div>
                  <span className="ml-auto text-xs font-medium text-[--color-primary]">
                    RM {parseFloat(u.balance || 0).toFixed(2)}
                  </span>
                </button>
              ))}
            </div>
          )}

          {searching && (
            <div className="flex justify-center py-3">
              <Loader2 className="w-5 h-5 animate-spin text-[--color-primary]" />
            </div>
          )}
        </div>
      </div>

      {/* Selected user card + top-up */}
      {selectedUser && (
        <div className="px-5 mt-4 animate-fade-in-up">
          {/* User profile card */}
          <div className="bg-white rounded-2xl p-5 shadow-sm mb-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-full bg-[--color-primary-light] flex items-center justify-center">
                <User className="w-6 h-6 text-[--color-primary]" />
              </div>
              <div>
                <p className="font-bold text-[--color-text]">{selectedUser.name}</p>
                <p className="text-xs text-[--color-text-secondary]">{selectedUser.email}</p>
              </div>
            </div>
            <div className="bg-[--color-bg] rounded-xl p-3 flex items-center justify-between">
              <span className="text-sm text-[--color-text-secondary]">Current Balance</span>
              <span className="text-lg font-bold text-[--color-primary]">
                RM {parseFloat(selectedUser.balance || 0).toFixed(2)}
              </span>
            </div>
          </div>

          {/* Quick top-up buttons */}
          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <h3 className="font-semibold text-[--color-text] mb-3 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-[--color-primary]" />
              Quick Top-Up
            </h3>
            <div className="grid grid-cols-2 gap-3 mb-4">
              {quickAmounts.map((qa) => (
                <button
                  key={qa.value}
                  onClick={() => handleTopUp(qa.value)}
                  disabled={topUpLoading}
                  className="h-16 rounded-xl text-white font-bold text-lg active:scale-95 transition-transform disabled:opacity-60"
                  style={{ backgroundColor: qa.color }}
                >
                  {qa.label}
                </button>
              ))}
            </div>

            {/* Custom amount */}
            <div className="flex gap-2">
              <input
                type="number"
                value={customAmount}
                onChange={(e) => setCustomAmount(e.target.value)}
                placeholder="Custom amount"
                step="1"
                min="1"
                className="flex-1 h-12 px-4 rounded-xl border border-[--color-border] focus:border-[--color-primary] focus:outline-none text-sm"
              />
              <button
                onClick={() => {
                  const val = parseFloat(customAmount);
                  if (val >= 1) handleTopUp(val);
                }}
                disabled={!customAmount || parseFloat(customAmount) < 1 || topUpLoading}
                className="h-12 px-6 rounded-xl text-white font-semibold disabled:opacity-40"
                style={{ backgroundColor: "var(--color-primary)" }}
              >
                {topUpLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Top Up"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation modal */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-6">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm animate-scale-in">
            <h3 className="text-lg font-bold text-center mb-4">Confirm Top-Up</h3>
            <p className="text-center text-[--color-text-secondary] mb-2">
              Credit to {showConfirm.userName}
            </p>
            <p className="text-center text-3xl font-bold text-[--color-primary] mb-6">
              RM {showConfirm.amount.toFixed(2)}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirm(null)}
                className="flex-1 h-12 rounded-xl border border-[--color-border] font-semibold text-[--color-text-secondary]"
              >
                Cancel
              </button>
              <button
                onClick={confirmTopUp}
                className="flex-1 h-12 rounded-xl font-semibold text-white"
                style={{ backgroundColor: "var(--color-primary)" }}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
