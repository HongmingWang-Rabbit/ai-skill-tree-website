'use client';

import { useSession, signOut } from 'next-auth/react';
import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';

export function UserMenu() {
  const { data: session } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!session?.user) return null;

  const displayName = session.user.name || session.user.email || 'User';
  const avatarUrl = session.user.image;

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 p-1 rounded-full hover:bg-slate-800 transition-colors"
      >
        {avatarUrl ? (
          <Image
            src={avatarUrl}
            alt={displayName}
            width={32}
            height={32}
            className="rounded-full"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center text-slate-900 font-bold text-sm">
            {displayName.charAt(0).toUpperCase()}
          </div>
        )}
        <svg
          className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-slate-800 border border-slate-700 rounded-lg shadow-xl overflow-hidden">
          {/* User info */}
          <div className="px-4 py-3 border-b border-slate-700">
            <p className="text-sm font-medium text-white truncate">{displayName}</p>
            {session.user.email && (
              <p className="text-xs text-slate-400 truncate">{session.user.email}</p>
            )}
            {session.user.walletAddress && (
              <p className="text-xs text-amber-400 truncate mt-1">
                {session.user.walletAddress.slice(0, 6)}...{session.user.walletAddress.slice(-4)}
              </p>
            )}
          </div>

          {/* Menu items */}
          <div className="py-1">
            <Link
              href="/dashboard"
              onClick={() => setIsOpen(false)}
              className="block px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
            >
              Dashboard
            </Link>
            <Link
              href="/profile"
              onClick={() => setIsOpen(false)}
              className="block px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
            >
              Profile
            </Link>
          </div>

          {/* Sign out */}
          <div className="py-1 border-t border-slate-700">
            <button
              onClick={() => signOut({ callbackUrl: '/' })}
              className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-slate-700 hover:text-red-300 transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
