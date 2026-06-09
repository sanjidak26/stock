'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  TrendingUp, Package, ShoppingCart, AlertTriangle,
  XCircle, Receipt, RefreshCw, ArrowRight
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import styles from './dashboard.module.css';

function StatCard({ label, value, sub, icon: Icon, color, href }) {
  const card = (
    <div className="stat-card" style={{ cursor: href ? 'pointer' : 'default' }}>
      <div className="stat-icon" style={{ background: `${color}20`, color }}><Icon size={20} /></div>
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
      {sub && <div className="stat-sub">{sub}</div>}
    </div>
  );
  return href ? <Link href={href}>{card}</Link> : card;
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className={styles.tooltip}>
      <div className={styles.tooltipDate}>{label}</div>
      <div className={styles.tooltipVal}>₹{Number(payload[0].value).toLocaleString()}</div>
      <div className={styles.tooltipSub}>{payload[1]?.value} bills</div>
    </div>
  );
};

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [chart, setChart] = useState([]);
  const [nearExpiry, setNearExpiry] = useState([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const [s, c, ne] = await Promise.all([
      fetch('/api/analytics?type=dashboard').then(r => r.json()),
      fetch('/api/analytics?type=revenue&days=14').then(r => r.json()),
      fetch('/api/batches?filter=near_expiry').then(r => r.json()),
    ]);
    setStats(s); setChart(c); setNearExpiry(ne.slice(0, 5));
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  function daysUntil(date) {
    const d = Math.ceil((new Date(date) - new Date()) / 86400000);
    return d;
  }

  if (loading) return (
    <div className="loading-center" style={{ minHeight: '60vh' }}>
      <div className="spinner" />
    </div>
  );

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Overview of your pharmacy today</p>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={load}>
          <RefreshCw size={15} /> Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="stat-grid" style={{ marginBottom: 28 }}>
        <StatCard label="Today's Revenue" value={`₹${Number(stats?.todayRevenue||0).toLocaleString()}`}
          sub="Sales today" icon={TrendingUp} color="var(--cyan)" />
        <StatCard label="Monthly Revenue" value={`₹${Number(stats?.monthRevenue||0).toLocaleString()}`}
          sub="This month" icon={TrendingUp} color="var(--purple)" />
        <StatCard label="Total Bills" value={stats?.totalBills || 0}
          sub="All time" icon={Receipt} color="var(--blue)" href="/bills" />
        <StatCard label="Near Expiry" value={stats?.nearExpiryCount || 0}
          sub="Next 30 days" icon={AlertTriangle} color="var(--amber)" href="/stock?filter=near_expiry" />
        <StatCard label="Low Stock" value={stats?.lowStockCount || 0}
          sub="≤10 units" icon={Package} color="var(--red)" href="/stock?filter=low_stock" />
        <StatCard label="Out of Stock" value={stats?.outOfStockCount || 0}
          sub="Zero stock" icon={XCircle} color="var(--red)" href="/stock" />
      </div>

      <div className={styles.grid2}>
        {/* Revenue chart */}
        <div className="card">
          <div className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>Revenue — Last 14 Days</h2>
            <Link href="/analytics" className="btn btn-ghost btn-sm">Full Analytics <ArrowRight size={14}/></Link>
          </div>
          {chart.length === 0 ? (
            <div className="empty-state" style={{ padding: '40px 0' }}>
              <ShoppingCart size={36} style={{ opacity: 0.3, marginBottom: 8 }} />
              <p>No sales yet. <Link href="/billing" style={{ color: 'var(--cyan)' }}>Create first bill →</Link></p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={chart} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--cyan)" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="var(--cyan)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} tickLine={false} axisLine={false}
                  tickFormatter={v => v.slice(5)} />
                <YAxis hide />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="revenue" stroke="var(--cyan)" strokeWidth={2} fill="url(#revGrad)" />
                <Area type="monotone" dataKey="bills" stroke="var(--purple)" strokeWidth={1.5} fill="none" strokeDasharray="4 2" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Near expiry */}
        <div className="card">
          <div className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>⚠️ Near Expiry Batches</h2>
            <Link href="/stock?filter=near_expiry" className="btn btn-ghost btn-sm">View all <ArrowRight size={14}/></Link>
          </div>
          {nearExpiry.length === 0 ? (
            <div className="empty-state" style={{ padding: '40px 0' }}>
              <p style={{ color: 'var(--green)' }}>✓ No batches expiring in 30 days</p>
            </div>
          ) : (
            <div className={styles.expiryList}>
              {nearExpiry.map((b) => {
                const days = daysUntil(b.expiry_date);
                const urgency = days <= 7 ? 'red' : days <= 15 ? 'amber' : 'blue';
                return (
                  <div key={b.id} className={styles.expiryRow}>
                    <div>
                      <div className={styles.medName}>{b.medicine_name}</div>
                      <div className={styles.medMeta}>Batch: {b.batch_no} · Qty: {b.quantity_remaining} {b.unit}</div>
                    </div>
                    <span className={`badge badge-${urgency}`}>
                      {days <= 0 ? 'EXPIRED' : `${days}d`}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Quick actions */}
      <div className={styles.quickActions}>
        {[
          { href: '/billing', label: 'New Bill', icon: ShoppingCart, color: 'var(--cyan)' },
          { href: '/stock/add', label: 'Add Stock', icon: Package, color: 'var(--purple)' },
          { href: '/analytics', label: 'Analytics', icon: TrendingUp, color: 'var(--green)' },
          { href: '/ai', label: 'Ask AI', icon: '🤖', color: 'var(--amber)' },
        ].map((a) => (
          <Link key={a.href} href={a.href} className={styles.qaCard}>
            <span style={{ fontSize: 22 }}>{typeof a.icon === 'string' ? a.icon : <a.icon size={22} color={a.color}/>}</span>
            <span>{a.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
