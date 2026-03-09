"use client";

import { usePathname, useRouter } from "next/navigation";
import { Home, QrCode, Clock } from "lucide-react";

const tabs = [
  { href: "/home", icon: Home, label: "Home" },
  { href: "/scan", icon: QrCode, label: "Scan & Pay", center: true },
  { href: "/history", icon: Clock, label: "History" },
];

export default function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[428px] bg-white border-t border-[--color-border] flex items-end justify-around px-2 pb-[env(safe-area-inset-bottom,8px)] pt-1 z-50">
      {tabs.map((tab) => {
        const isActive = pathname === tab.href;
        const Icon = tab.icon;

        if (tab.center) {
          return (
            <button
              key={tab.href}
              onClick={() => router.push(tab.href)}
              className="flex flex-col items-center -mt-5"
            >
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center shadow-lg"
                style={{ backgroundColor: "var(--color-primary)" }}
              >
                <Icon className="w-6 h-6 text-white" />
              </div>
              <span className="text-[10px] mt-1 font-medium" style={{ color: "var(--color-primary)" }}>
                {tab.label}
              </span>
            </button>
          );
        }

        return (
          <button
            key={tab.href}
            onClick={() => router.push(tab.href)}
            className="flex flex-col items-center py-2 px-3"
          >
            <Icon
              className="w-6 h-6"
              style={{ color: isActive ? "var(--color-primary)" : "var(--color-text-secondary)" }}
            />
            <span
              className="text-[10px] mt-1 font-medium"
              style={{ color: isActive ? "var(--color-primary)" : "var(--color-text-secondary)" }}
            >
              {tab.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
