'use client';

import { useEffect, useState } from 'react';
import { Store, Search } from 'lucide-react';

export default function AdminShopsPage() {
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  async function load() {
    setLoading(true);
    const res = await fetch('/api/shops');
    const data = await res.json();
    setShops(Array.isArray(data) ? data : []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  const filtered = shops.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    (s.email || '').toLowerCase().includes(search.toLowerCase())
  );

  function formatDate(d) {
    return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">All Shops</h1>
          <p className="page-subtitle">{shops.length} pharmacies on the platform</p>
        </div>
      </div>

      <div style={{ position: 'relative', marginBottom: 16 }}>
        <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
        <input className="form-input" style={{ paddingLeft: 44 }} placeholder="Search by name or email…"
          value={search} onChange={e => setSearch(e.target.value)} id="admin-shops-search" />
      </div>

      {loading ? (
        <div className="loading-center"><div className="spinner" /></div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Pharmacy</th>
                <th>Owner</th>
                <th>Drug License</th>
                <th>GST</th>
                <th>Status</th>
                <th>Registered</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>No shops found</td></tr>
              ) : filtered.map(shop => (
                <tr key={shop.id}>
                  <td>
                    <div style={{ fontWeight: 700 }}>{shop.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{shop.address || '—'}</div>
                  </td>
                  <td>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{shop.owner_name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{shop.email}</div>
                  </td>
                  <td style={{ fontSize: 12, fontFamily: 'monospace', color: 'var(--text-secondary)' }}>
                    {shop.drug_license_no || '—'}
                  </td>
                  <td style={{ fontSize: 12, fontFamily: 'monospace', color: 'var(--text-secondary)' }}>
                    {shop.gst_no || '—'}
                  </td>
                  <td>
                    <span className={`badge ${shop.status === 'approved' ? 'badge-green' : shop.status === 'pending' ? 'badge-amber' : 'badge-red'}`}>
                      {shop.status}
                    </span>
                  </td>
                  <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{formatDate(shop.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
