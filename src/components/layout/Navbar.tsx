"use client";

import React from "react";
import Link from "next/link";
import { Film, Sparkles } from "lucide-react";

export function Navbar() {
  return (
    <nav className="sticky top-0 z-50 border-b border-[var(--border)] bg-[var(--background)]/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[var(--primary)] to-[var(--accent)] flex items-center justify-center shadow-lg shadow-purple-500/20 group-hover:shadow-purple-500/40 transition-shadow">
              <Film size={20} className="text-white" />
            </div>
            <span className="text-lg font-bold text-[var(--foreground)]">
              AI<span className="text-[var(--primary)]">视界</span>
            </span>
          </Link>

          <div className="flex items-center gap-6">
            <Link
              href="/create"
              className="flex items-center gap-1.5 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
            >
              <Sparkles size={16} />
              创建项目
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
