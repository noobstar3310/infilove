"use client";

import { usePathname, useRouter } from "next/navigation";
import { Home, ScanLine, Clock } from "lucide-react";

const tabs = [
  { href: "/home", icon: Home, label: "Home" },
  { href: "/scan", icon: ScanLine, label: "Scan" },
  { href: "/history", icon: Clock, label: "History" },
];

export default function BottomNav({ dark = false }) {
  const pathname = usePathname();
  const router = useRouter();

  const barBg = dark
    ? "rgba(20, 25, 55, 0.9)"
    : "rgba(255,255,255,0.85)";
  const barShadow = dark
    ? "0 -1px 20px rgba(0,0,0,0.3), 0 0 1px rgba(0,0,0,0.2)"
    : "0 -1px 20px rgba(0,0,0,0.06), 0 0 1px rgba(0,0,0,0.1)";
  const activeColor = dark ? "#818CF8" : "var(--color-primary)";
  const inactiveColor = dark ? "rgba(255,255,255,0.35)" : "var(--color-muted-foreground)";
  const activeBg = dark ? "rgba(129,140,248,0.12)" : "var(--color-primary-light)";
  const centerGradient = dark
    ? "linear-gradient(135deg, #7C3AED 0%, #2563EB 100%)"
    : "linear-gradient(135deg, #2563EB 0%, #06B6D4 100%)";
  const centerShadow = dark
    ? "0 4px 20px rgba(124, 58, 237, 0.4)"
    : "0 4px 20px rgba(37, 99, 235, 0.4)";
  const centerLabel = dark ? "#818CF8" : "var(--color-primary)";

  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] z-50">
      <div
        className="mx-3 mb-[env(safe-area-inset-bottom,6px)] rounded-2xl flex items-center justify-around py-2 px-2"
        style={{ background: barBg, backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", boxShadow: barShadow }}
      >
        {tabs.map((tab) => {
          const isActive = pathname === tab.href;
          const Icon = tab.icon;

          if (tab.center) {
            return (
              <button
                key={tab.href}
                onClick={() => router.push(tab.href)}
                className="flex flex-col items-center -mt-7 relative"
              >
                <div
                  className="w-[56px] h-[56px] rounded-2xl flex items-center justify-center transition-transform duration-200"
                  style={{ background: centerGradient, boxShadow: centerShadow }}
                >
                  <Icon className="w-6 h-6 text-white" strokeWidth={2.5} />
                </div>
                <span className="text-[10px] mt-1.5 font-semibold" style={{ color: centerLabel }}>
                  {tab.label}
                </span>
              </button>
            );
          }

          return (
            <button
              key={tab.href}
              onClick={() => router.push(tab.href)}
              className="flex flex-col items-center py-1.5 px-5 rounded-xl transition-all duration-200"
              style={isActive ? { background: activeBg } : {}}
            >
              <Icon
                className="w-[22px] h-[22px] transition-colors duration-200"
                style={{ color: isActive ? activeColor : inactiveColor }}
                strokeWidth={isActive ? 2.5 : 2}
              />
              <span
                className="text-[10px] mt-1 font-semibold transition-colors duration-200"
                style={{ color: isActive ? activeColor : inactiveColor }}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
