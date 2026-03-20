"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function TopNavigation() {
  const pathname = usePathname();

  const navLinks = [
    { name: "김프", href: "/" },
    { name: "지표", href: "/indicators" },
    { name: "롱·숏", href: "/long-short" },
    { name: "뉴스", href: "/news" },
    { name: "경제 캘린더", href: "/calendar" },
  ];

  return (
    <nav className="bg-neutral-950 border-b border-neutral-800 sticky top-0 z-50">
      <div className="max-w-[1600px] mx-auto px-4 md:px-8 flex items-center justify-between h-14">
        <div className="flex items-center gap-8">
          <Link href="/" className="text-xl font-black tracking-tight text-white hover:text-indigo-400 transition-colors">
            kimpre
          </Link>
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const isActive = pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href));
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors ${
                    isActive
                      ? "bg-neutral-800 text-white"
                      : "text-neutral-400 hover:text-white hover:bg-neutral-800/50"
                  }`}
                >
                  {link.name}
                </Link>
              );
            })}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[10px] font-bold text-neutral-600 uppercase tracking-widest hidden md:block">LIVE</span>
        </div>
      </div>
    </nav>
  );
}
