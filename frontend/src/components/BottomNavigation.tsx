"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, BarChart2, ArrowUpDown, Newspaper, CalendarDays } from "lucide-react";

const NAV_ITEMS = [
  { label: "김프",      href: "/",             icon: Home },
  { label: "지표",      href: "/indicators",   icon: BarChart2 },
  { label: "롱숏",      href: "/long-short",   icon: ArrowUpDown },
  { label: "뉴스",      href: "/news",         icon: Newspaper },
  { label: "캘린더",    href: "/calendar",     icon: CalendarDays },
];

export default function BottomNavigation() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-neutral-950/95 backdrop-blur-md border-t border-neutral-800 safe-area-inset-bottom">
      <div className="flex items-center justify-around h-14 px-1">
        {NAV_ITEMS.map(({ label, href, icon: Icon }) => {
          const isActive =
            href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-colors ${
                isActive ? "text-indigo-400" : "text-neutral-500 hover:text-neutral-300"
              }`}
            >
              <Icon
                size={20}
                strokeWidth={isActive ? 2.5 : 1.8}
                className={isActive ? "drop-shadow-[0_0_6px_rgba(99,102,241,0.7)]" : ""}
              />
              <span className={`text-xs font-bold leading-none tracking-wide ${isActive ? "text-indigo-400" : ""}`}>
                {label}
              </span>
              {isActive && (
                <span className="absolute bottom-0 h-0.5 w-6 rounded-full bg-indigo-400 mb-0" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
