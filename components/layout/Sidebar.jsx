'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import {
  LayoutDashboard, Package, ShoppingCart, Receipt,
  Truck, BarChart3, Bot, Settings, LogOut, Pill,
  ChevronRight, X, Menu
} from 'lucide-react';
import { useState } from 'react';
import styles from './Sidebar.module.css';

const navItems = [
  { href: '/dashboard',  label: 'Dashboard',   icon: LayoutDashboard },
  { href: '/stock',      label: 'Inventory',    icon: Package },
  { href: '/billing',    label: 'Billing',      icon: ShoppingCart },
  { href: '/bills',      label: 'Sales History',icon: Receipt },
  { href: '/dealers',    label: 'Dealers',      icon: Truck },
  { href: '/analytics',  label: 'Analytics',    icon: BarChart3 },
  { href: '/ai',         label: 'AI Assistant', icon: Bot },
  { href: '/settings',   label: 'Settings',     icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);

  const isActive = (href) => pathname === href || pathname.startsWith(href + '/');

  return (
    <>
      {/* Mobile toggle */}
      <button className={styles.mobileToggle} onClick={() => setOpen(true)} aria-label="Open menu">
        <Menu size={22} />
      </button>

      {/* Overlay */}
      {open && <div className={styles.overlay} onClick={() => setOpen(false)} />}

      <aside className={`${styles.sidebar} ${open ? styles.open : ''}`}>
        {/* Logo */}
        <div className={styles.logo}>
          <div className={styles.logoIcon}><Pill size={20} /></div>
          <span className={styles.logoText}>Stock<span className={styles.logoBold}>Easy</span></span>
          <button className={styles.closeBtn} onClick={() => setOpen(false)}><X size={18}/></button>
        </div>

        {/* Shop info */}
        {session && (
          <div className={styles.shopBadge}>
            <div className={styles.shopAvatar}>
              {(session.user.name || 'S')[0].toUpperCase()}
            </div>
            <div>
              <div className={styles.shopName}>{session.user.name}</div>
              <div className={styles.shopRole}>
                {session.user.role === 'shop_owner' ? 'Owner' : 'Staff'}
              </div>
            </div>
          </div>
        )}

        <div className={styles.divider} />

        {/* Nav */}
        <nav className={styles.nav}>
          {navItems.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={`${styles.navItem} ${isActive(href) ? styles.active : ''}`}
              onClick={() => setOpen(false)}
            >
              <Icon size={18} />
              <span>{label}</span>
              {isActive(href) && <ChevronRight size={14} className={styles.chevron} />}
            </Link>
          ))}
        </nav>

        {/* Logout */}
        <div className={styles.bottom}>
          <button
            className={styles.logoutBtn}
            onClick={() => signOut({ callbackUrl: '/login' })}
          >
            <LogOut size={16} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
}
