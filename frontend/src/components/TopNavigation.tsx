"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Settings, User } from "lucide-react";

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
            KIMP
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

        <div className="flex items-center gap-4 text-neutral-400">
          <button className="hover:text-white transition-colors">
            <Settings size={18} />
          </button>
          <button className="hover:text-white transition-colors">
            <User size={18} />
          </button>
        </div>
      </div>
    </nav>
  );
}
