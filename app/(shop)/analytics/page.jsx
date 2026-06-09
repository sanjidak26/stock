'use client';

import { useEffect, useState } from 'react';
import { BarChart3, TrendingUp, AlertTriangle } from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Cell, PieChart, Pie, Legend
} from 'recharts';
import styles from './analytics.module.css';

const COLORS = ['#06b6d4', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#ec4899', '#14b8a6', '#f97316', '#a855f7'];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: 8, padding: '10px 14px' }}>
      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>{label}</div>
      {payload.map(p => (
        <div key={p.name} style={{ fontSize: 13, fontWeight: 600, color: p.color }}>
          {p.name === 'revenue' ? `₹${Number(p.value).toLocaleString()}` : p.value}
        </div>
      ))}
    </div>
  );
};

export default function AnalyticsPage() {
  const [revenue, setRevenue] = useState([]);
  const [topMeds, setTopMeds] = useState([]);
  const [expiryLoss, setExpiryLoss] = useState([]);
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const [r, t, e] = await Promise.all([
      fetch(`/api/analytics?type=revenue&days=${days}`).then(x => x.json()),
      fetch('/api/analytics?type=top_medicines').then(x => x.json()),
      fetch('/api/analytics?type=expiry_loss').then(x => x.json()),
    ]);
    setRevenue(Array.isArray(r) ? r : []);
    setTopMeds(Array.isArray(t) ? t : []);
    setExpiryLoss(Array.isArray(e) ? e : []);
    setLoading(false);
  }

  useEffect(() => { load(); }, [days]);

  const totalRevenue = revenue.reduce((s, r) => s + Number(r.revenue), 0);
  const totalBills = revenue.reduce((s, r) => s + Number(r.bills), 0);
  const totalLoss = expiryLoss.reduce((s, r) => s + Number(r.loss_value), 0);

  if (loading) return <div className="loading-center" style={{ minHeight: '60vh' }}><div className="spinner" /></div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Analytics</h1>
          <p className="page-subtitle">Sales trends, top medicines, expiry loss analysis</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {[7, 30, 90].map(d => (
            <button key={d} className={`btn btn-sm ${days === d ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setDays(d)}>
              {d}d
            </button>
          ))}
        </div>
      </div>

      {/* Summary stats */}
      <div className="stat-grid" style={{ marginBottom: 28 }}>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'var(--cyan-glow)', color: 'var(--cyan)' }}>
            <TrendingUp size={20} />
          </div>
          <div className="stat-label">Revenue ({days}d)</div>
          <div className="stat-value">₹{totalRevenue.toLocaleString()}</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'var(--blue-bg)', color: 'var(--blue)' }}>
            <BarChart3 size={20} />
          </div>
          <div className="stat-label">Bills ({days}d)</div>
          <div className="stat-value">{totalBills}</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'var(--amber-bg)', color: 'var(--amber)' }}>
            <TrendingUp size={20} />
          </div>
          <div className="stat-label">Avg. Bill Value</div>
          <div className="stat-value">₹{totalBills > 0 ? Math.round(totalRevenue / totalBills).toLocaleString() : 0}</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'var(--red-bg)', color: 'var(--red)' }}>
            <AlertTriangle size={20} />
          </div>
          <div className="stat-label">Expiry Loss</div>
          <div className="stat-value" style={{ color: expiryLoss.length > 0 ? 'var(--red)' : 'var(--green)' }}>
            ₹{totalLoss.toLocaleString()}
          </div>
        </div>
      </div>

      {/* Revenue chart */}
      <div className="card" style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>Revenue Trend — Last {days} Days</h2>
        {revenue.length === 0 ? (
          <div className="empty-state" style={{ padding: '40px 0' }}><p>No sales data for this period.</p></div>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={revenue} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="grad1" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="date" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} tickLine={false} axisLine={false}
                tickFormatter={v => v.slice(5)} />
              <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} tickLine={false} axisLine={false}
                tickFormatter={v => `₹${v >= 1000 ? (v/1000).toFixed(0)+'k' : v}`} width={48} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="revenue" name="revenue" stroke="#06b6d4" strokeWidth={2} fill="url(#grad1)" />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className={styles.grid2}>
        {/* Top medicines */}
        <div className="card">
          <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>Top Selling Medicines</h2>
          {topMeds.length === 0 ? (
            <div className="empty-state" style={{ padding: '30px 0' }}><p>No sales data yet.</p></div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={topMeds.slice(0, 8)} layout="vertical" margin={{ left: 0, right: 16 }}>
                <XAxis type="number" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} tickLine={false} axisLine={false} />
                <YAxis type="category" dataKey="name" tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} tickLine={false} axisLine={false} width={120} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="sold" name="sold" radius={[0, 4, 4, 0]}>
                  {topMeds.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Expiry loss */}
        <div className="card">
          <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>
            💸 Expiry Loss (Expired Stock)
          </h2>
          {expiryLoss.length === 0 ? (
            <div className="empty-state" style={{ padding: '30px 0' }}>
              <p style={{ color: 'var(--green)' }}>✓ No expired stock with remaining quantity!</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {expiryLoss.slice(0, 8).map((r, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', background: 'var(--bg-hover)', borderRadius: 8, border: '1px solid var(--border)' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{r.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Batch: {r.batch_no} · Exp: {r.expiry_date} · Qty: {r.quantity_remaining}</div>
                  </div>
                  <span style={{ color: 'var(--red)', fontWeight: 700, fontSize: 14 }}>₹{Number(r.loss_value).toLocaleString()}</span>
                </div>
              ))}
              {expiryLoss.length > 8 && (
                <div style={{ textAlign: 'center', fontSize: 12, color: 'var(--text-muted)', padding: '4px 0' }}>
                  +{expiryLoss.length - 8} more items
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
