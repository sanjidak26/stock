'use client';
import { SessionProvider } from 'next-auth/react';
import AdminSidebar from '@/components/layout/AdminSidebar';
import styles from './ShopLayout.module.css';

export default function AdminLayout({ children }) {
  return (
    <SessionProvider>
      <div className={styles.shell}>
        <AdminSidebar />
        <main className={styles.main}>
          <div className={styles.content}>{children}</div>
        </main>
      </div>
    </SessionProvider>
  );
}
