'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import {
  LayoutDashboard, ShieldCheck, Store, BarChart3,
  LogOut, Pill, ChevronRight, X, Menu
} from 'lucide-react';
import { useState } from 'react';
import styles from './Sidebar.module.css';

const adminNav = [
  { href: '/admin',                label: 'Overview',      icon: LayoutDashboard },
  { href: '/admin/verifications',  label: 'Verifications', icon: ShieldCheck },
  { href: '/admin/shops',          label: 'Shops',         icon: Store },
  { href: '/admin/analytics',      label: 'Analytics',     icon: BarChart3 },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);

  const isActive = (href) =>
    href === '/admin' ? pathname === '/admin' : pathname.startsWith(href);

  return (
    <>
      <button className={styles.mobileToggle} onClick={() => setOpen(true)} aria-label="Open menu">
        <Menu size={22} />
      </button>

      {open && <div className={styles.overlay} onClick={() => setOpen(false)} />}

      <aside className={`${styles.sidebar} ${open ? styles.open : ''}`}>
        <div className={styles.logo}>
          <div className={styles.logoIcon}><Pill size={20} /></div>
          <span className={styles.logoText}>Stock<span className={styles.logoBold}>Easy</span></span>
          <span style={{ marginLeft: 'auto', fontSize: 10, background: 'var(--purple-glow)', color: 'var(--purple)', padding: '2px 6px', borderRadius: 4, fontWeight: 600 }}>ADMIN</span>
          <button className={styles.closeBtn} onClick={() => setOpen(false)}><X size={18}/></button>
        </div>

        {session && (
          <div className={styles.shopBadge}>
            <div className={styles.shopAvatar} style={{ background: 'linear-gradient(135deg,#8b5cf6,#06b6d4)' }}>
              {(session.user.name || 'A')[0].toUpperCase()}
            </div>
            <div>
              <div className={styles.shopName}>{session.user.name}</div>
              <div className={styles.shopRole} style={{ color: 'var(--purple)' }}>Central Admin</div>
            </div>
          </div>
        )}

        <div className={styles.divider} />

        <nav className={styles.nav}>
          {adminNav.map(({ href, label, icon: Icon }) => (
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

        <div className={styles.bottom}>
          <button className={styles.logoutBtn} onClick={() => signOut({ callbackUrl: '/login' })}>
            <LogOut size={16} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
}
