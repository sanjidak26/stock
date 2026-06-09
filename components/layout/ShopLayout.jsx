'use client';
import { SessionProvider } from 'next-auth/react';
import Sidebar from '@/components/layout/Sidebar';
import styles from './ShopLayout.module.css';

export default function ShopLayout({ children }) {
  return (
    <SessionProvider>
      <div className={styles.shell}>
        <Sidebar />
        <main className={styles.main}>
          <div className={styles.content}>{children}</div>
        </main>
      </div>
    </SessionProvider>
  );
}
