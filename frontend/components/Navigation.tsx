'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, PlusCircle, LayoutDashboard, Radio } from 'lucide-react';

const navItems: Array<{ href: string; label: string; icon: any }> = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/create', label: 'Create Merchant', icon: PlusCircle },
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/console', label: 'AI Console', icon: Radio },
];

export function Navigation() {
  const pathname = usePathname();

  return (
    <nav className="mb-6 rounded-2xl border border-borderLight bg-surface/95 backdrop-blur-md shadow-luxury">
      <div className="flex items-center gap-2 p-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href as any}
              className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all ${
                isActive
                  ? 'bg-primary/20 text-primary shadow-sm'
                  : 'text-textMuted hover:bg-surfaceLight hover:text-textPrimary'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span className="hidden sm:inline">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
