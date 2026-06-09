'use client';

import { useSession } from 'next-auth/react';
import { Settings, User, Store } from 'lucide-react';

export default function SettingsPage() {
  const { data: session } = useSession();

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Settings</h1>
          <p className="page-subtitle">Manage your pharmacy profile and account</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, maxWidth: 900 }}>
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <div style={{ width: 36, height: 36, background: 'var(--cyan-glow)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--cyan)' }}>
              <User size={18} />
            </div>
            <h2 style={{ fontSize: 16, fontWeight: 700 }}>My Account</h2>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              ['Name', session?.user?.name],
              ['Email', session?.user?.email],
              ['Role', session?.user?.role?.replace('_', ' ')],
            ].map(([k, v]) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', background: 'var(--bg-hover)', borderRadius: 8, fontSize: 13 }}>
                <span style={{ color: 'var(--text-secondary)' }}>{k}</span>
                <span style={{ fontWeight: 600, textTransform: 'capitalize' }}>{v || '—'}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <div style={{ width: 36, height: 36, background: 'var(--purple-glow)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--purple)' }}>
              <Store size={18} />
            </div>
            <h2 style={{ fontSize: 16, fontWeight: 700 }}>Pharmacy Info</h2>
          </div>
          <div style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.7 }}>
            <p>To update pharmacy details, drug license, or GST number, please contact the central admin.</p>
            <div style={{ marginTop: 16, padding: '12px 16px', background: 'var(--bg-hover)', borderRadius: 8, border: '1px solid var(--border)' }}>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>Admin Contact</div>
              <div style={{ fontWeight: 600 }}>admin@stockeasy.com</div>
            </div>
          </div>
        </div>

        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <div style={{ width: 36, height: 36, background: 'var(--green-bg)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--green)' }}>
              <Settings size={18} />
            </div>
            <h2 style={{ fontSize: 16, fontWeight: 700 }}>Quick Tips</h2>
          </div>
          <ul style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13, color: 'var(--text-secondary)', listStyle: 'none' }}>
            {[
              '🔑 Default admin login: admin@stockeasy.com / admin123',
              '📦 Add medicines first, then add batches with expiry dates',
              '🧾 FEFO billing auto-selects the nearest-expiry batch',
              '🤖 Use AI Assistant to query your data in plain English',
              '📊 Check Analytics daily to monitor near-expiry stock',
            ].map((t, i) => (
              <li key={i} style={{ padding: '8px 12px', background: 'var(--bg-hover)', borderRadius: 8, lineHeight: 1.5 }}>{t}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
