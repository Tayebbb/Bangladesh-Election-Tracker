'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import ThemeToggle from './ThemeToggle';

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 dark:border-slate-700 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md supports-[backdrop-filter]:bg-white/60 dark:supports-[backdrop-filter]:bg-slate-900/60">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        {/* Logo / Title */}
        <Link href="/" className="flex items-center gap-2.5 font-bold text-bd-green dark:text-emerald-400 transition-colors group">
          <Image 
            src="/logo.png" 
            alt="BD Election Logo" 
            width={32} 
            height={32} 
            className="group-hover:scale-110 transition-transform"
            priority
          />
          <span className="hidden sm:inline text-lg">BD Election Tracker</span>
          <span className="sm:hidden">BD Election</span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden items-center gap-1 md:flex">
          <NavLink href="/">Dashboard</NavLink>
          <NavLink href="/map">Map</NavLink>
          <div className="ml-2">
            <ThemeToggle />
          </div>
        </nav>

        {/* Live indicator + Theme toggle (mobile) */}
        <div className="flex items-center gap-2">
          <div className="hidden items-center gap-2 sm:flex">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-500" />
            </span>
            <span className="text-xs font-semibold text-red-600 dark:text-red-400">LIVE</span>
          </div>
          
          <div className="md:hidden">
            <ThemeToggle />
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="rounded-lg p-2 text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-slate-800 md:hidden transition-colors"
            aria-label="Toggle menu"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {menuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile nav dropdown */}
      {menuOpen && (
        <nav className="border-t border-gray-100 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-3 md:hidden">
          <NavLink href="/" onClick={() => setMenuOpen(false)} mobile>Dashboard</NavLink>
          <NavLink href="/map" onClick={() => setMenuOpen(false)} mobile>Map</NavLink>
        </nav>
      )}
    </header>
  );
}

function NavLink({
  href, children, onClick, mobile,
}: {
  href: string; children: React.ReactNode; onClick?: () => void; mobile?: boolean;
}) {
  const base = mobile
    ? 'block py-2.5 text-sm font-medium text-gray-700 dark:text-gray-200 hover:text-bd-green dark:hover:text-emerald-400 transition-colors'
    : 'rounded-lg px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-800 hover:text-bd-green dark:hover:text-emerald-400 transition-all duration-200';
  return (
    <Link href={href} className={base} onClick={onClick}>
      {children}
    </Link>
  );
}
