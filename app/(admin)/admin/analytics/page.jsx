'use client';

import { useEffect, useState } from 'react';
import { TrendingUp, Store, BarChart3 } from 'lucide-react';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const COLORS = ['#06b6d4', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#ec4899', '#14b8a6'];

export default function AdminAnalyticsPage() {
  const [revenue, setRevenue] = useState([]);
  const [growth, setGrowth] = useState([]);
  const [topShops, setTopShops] = useState([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const [r, g, t] = await Promise.all([
      fetch('/api/admin/analytics?type=revenue').then(x => x.json()),
      fetch('/api/admin/analytics?type=growth').then(x => x.json()),
      fetch('/api/admin/analytics?type=top_shops').then(x => x.json()),
    ]);
    setRevenue(Array.isArray(r) ? r : []);
    setGrowth(Array.isArray(g) ? g : []);
    setTopShops(Array.isArray(t) ? t : []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  const totalRevenue = revenue.reduce((s, r) => s + Number(r.revenue), 0);
  const totalBills = revenue.reduce((s, r) => s + Number(r.bills), 0);
  const totalNew = growth.reduce((s, g) => s + Number(g.new_shops), 0);

  if (loading) return <div className="loading-center" style={{ minHeight: '60vh' }}><div className="spinner" /></div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Platform Analytics</h1>
          <p className="page-subtitle">30-day platform growth and revenue overview</p>
        </div>
      </div>

      <div className="stat-grid" style={{ marginBottom: 28 }}>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'var(--purple-glow)', color: 'var(--purple)' }}><TrendingUp size={20}/></div>
          <div className="stat-label">Platform Revenue (30d)</div>
          <div className="stat-value">₹{totalRevenue.toLocaleString()}</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'var(--blue-bg)', color: 'var(--blue)' }}><BarChart3 size={20}/></div>
          <div className="stat-label">Total Bills (30d)</div>
          <div className="stat-value">{totalBills}</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'var(--green-bg)', color: 'var(--green)' }}><Store size={20}/></div>
          <div className="stat-label">New Registrations (30d)</div>
          <div className="stat-value">{totalNew}</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'var(--cyan-glow)', color: 'var(--cyan)' }}><TrendingUp size={20}/></div>
          <div className="stat-label">Avg. Bills/Day</div>
          <div className="stat-value">{revenue.length > 0 ? Math.round(totalBills / revenue.length) : 0}</div>
        </div>
      </div>

      {/* Revenue trend */}
      <div className="card" style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>Platform Revenue Trend</h2>
        {revenue.length === 0 ? (
          <div className="empty-state" style={{ padding: '40px 0' }}><p>No revenue data yet.</p></div>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={revenue} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="platGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="date" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={v => v.slice(5)} />
              <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} tickLine={false} axisLine={false}
                tickFormatter={v => `₹${v >= 1000 ? (v/1000).toFixed(0)+'k' : v}`} width={52} />
              <Tooltip 
                contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }} 
                itemStyle={{ color: '#fff' }}
                labelStyle={{ color: '#fff' }}
              />
              <Area type="monotone" dataKey="revenue" stroke="#8b5cf6" strokeWidth={2} fill="url(#platGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Top shops revenue bar chart */}
      <div className="card">
        <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>Top Shops by Revenue</h2>
        {topShops.length === 0 ? (
          <div className="empty-state" style={{ padding: '30px 0' }}><p>No shop revenue data yet.</p></div>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={topShops} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <XAxis dataKey="name" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} tickLine={false} axisLine={false}
                tickFormatter={v => `₹${v >= 1000 ? (v/1000).toFixed(0)+'k' : v}`} width={52} />
              <Tooltip 
                contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }} 
                itemStyle={{ color: '#fff' }}
                labelStyle={{ color: '#fff' }}
              />
              <Bar dataKey="revenue" radius={[6, 6, 0, 0]}>
                {topShops.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
