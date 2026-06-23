'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Store, ShieldCheck, TrendingUp, Receipt, Clock, ArrowRight, RefreshCw } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import styles from './admin.module.css';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [growth, setGrowth] = useState([]);
  const [revenue, setRevenue] = useState([]);
  const [topShops, setTopShops] = useState([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const [s, g, r, t] = await Promise.all([
      fetch('/api/admin/analytics?type=stats').then(x => x.json()),
      fetch('/api/admin/analytics?type=growth').then(x => x.json()),
      fetch('/api/admin/analytics?type=revenue').then(x => x.json()),
      fetch('/api/admin/analytics?type=top_shops').then(x => x.json()),
    ]);
    setStats(s); setGrowth(Array.isArray(g) ? g : []);
    setRevenue(Array.isArray(r) ? r : []);
    setTopShops(Array.isArray(t) ? t : []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  if (loading) return <div className="loading-center" style={{ minHeight: '60vh' }}><div className="spinner" /></div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Admin Overview</h1>
          <p className="page-subtitle">Platform-wide statistics and health</p>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={load}><RefreshCw size={15} /> Refresh</button>
      </div>

      {/* Stats */}
      <div className="stat-grid" style={{ marginBottom: 28 }}>
        {[
          { label: 'Total Pharmacies', value: stats?.totalShops || 0, icon: Store, color: 'var(--cyan)', href: '/admin/shops' },
          { label: 'Pending Approval', value: stats?.pendingShops || 0, icon: Clock, color: 'var(--amber)', href: '/admin/verifications' },
          { label: 'Active Shops', value: stats?.approvedShops || 0, icon: ShieldCheck, color: 'var(--green)', href: '/admin/shops' },
          { label: 'Platform Revenue', value: `₹${Number(stats?.platformRevenue || 0).toLocaleString()}`, icon: TrendingUp, color: 'var(--purple)' },
          { label: 'Total Bills', value: stats?.totalBills || 0, icon: Receipt, color: 'var(--blue)' },
        ].map(({ label, value, icon: Icon, color, href }) => {
          const card = (
            <div className="stat-card" style={{ cursor: href ? 'pointer' : 'default' }}>
              <div className="stat-icon" style={{ background: `${color}20`, color }}><Icon size={20} /></div>
              <div className="stat-label">{label}</div>
              <div className="stat-value">{value}</div>
            </div>
          );
          return href ? <Link key={label} href={href}>{card}</Link> : <div key={label}>{card}</div>;
        })}
      </div>

      <div className={styles.grid2}>
        {/* Platform revenue chart */}
        <div className="card">
          <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>Platform Revenue — Last 30 Days</h2>
          {revenue.length === 0 ? (
            <div className="empty-state" style={{ padding: '40px 0' }}><p>No revenue data yet.</p></div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={revenue} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="adminGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={v => v.slice(5)} />
                <YAxis hide />
                <Tooltip 
                  contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }} 
                  itemStyle={{ color: '#fff' }}
                  labelStyle={{ color: '#fff' }}
                />
                <Area type="monotone" dataKey="revenue" stroke="#8b5cf6" strokeWidth={2} fill="url(#adminGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Shop growth chart */}
        <div className="card">
          <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>New Registrations — Last 30 Days</h2>
          {growth.length === 0 ? (
            <div className="empty-state" style={{ padding: '40px 0' }}><p>No registrations in last 30 days.</p></div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={growth} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="growGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={v => v.slice(5)} />
                <YAxis hide />
                <Tooltip 
                  contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }} 
                  itemStyle={{ color: '#fff' }}
                  labelStyle={{ color: '#fff' }}
                />
                <Area type="monotone" dataKey="new_shops" stroke="#06b6d4" strokeWidth={2} fill="url(#growGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Top shops */}
      <div className="card" style={{ marginTop: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <h2 style={{ fontSize: 15, fontWeight: 700 }}>Top Performing Shops</h2>
          <Link href="/admin/shops" className="btn btn-ghost btn-sm">All Shops <ArrowRight size={14} /></Link>
        </div>
        {topShops.length === 0 ? (
          <div className="empty-state" style={{ padding: '20px 0' }}><p>No shop data yet.</p></div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>#</th><th>Shop Name</th><th>Status</th><th>Bills</th><th>Revenue</th></tr>
              </thead>
              <tbody>
                {topShops.map((s, i) => (
                  <tr key={i}>
                    <td style={{ color: 'var(--text-muted)' }}>{i + 1}</td>
                    <td><strong>{s.name}</strong></td>
                    <td>
                      <span className={`badge ${s.status === 'approved' ? 'badge-green' : s.status === 'pending' ? 'badge-amber' : 'badge-red'}`}>
                        {s.status}
                      </span>
                    </td>
                    <td>{s.total_bills}</td>
                    <td style={{ fontWeight: 700, color: 'var(--cyan)' }}>₹{Number(s.revenue).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
