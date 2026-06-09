'use client';

import { Suspense } from 'react';
import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Package, Search, Plus, AlertTriangle, XCircle, Clock } from 'lucide-react';
import styles from './stock.module.css';

const FILTERS = [
  { key: 'all',         label: 'All Stock',   icon: Package },
  { key: 'near_expiry', label: 'Near Expiry', icon: AlertTriangle },
  { key: 'low_stock',   label: 'Low Stock',   icon: Clock },
  { key: 'expired',     label: 'Dead Stock',  icon: XCircle },
];

function daysUntil(d) { return Math.ceil((new Date(d) - new Date()) / 86400000); }
function expiryBadge(d) {
  const days = daysUntil(d);
  if (days < 0)  return { label: 'Expired', cls: 'badge-red' };
  if (days <= 7) return { label: `${days}d`,  cls: 'badge-red' };
  if (days <= 30) return { label: `${days}d`, cls: 'badge-amber' };
  if (days <= 90) return { label: `${days}d`, cls: 'badge-blue' };
  return { label: `${days}d`, cls: 'badge-green' };
}

function StockContent() {
  const searchParams = useSearchParams();
  const [filter, setFilter] = useState(searchParams.get('filter') || 'all');
  const [search, setSearch]   = useState('');
  const [data, setData]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView]       = useState('medicines');

  const load = useCallback(async () => {
    setLoading(true);
    if (filter === 'all') {
      const res  = await fetch(`/api/medicines?search=${encodeURIComponent(search)}`);
      const rows = await res.json();
      setData(Array.isArray(rows) ? rows : []);
      setView('medicines');
    } else {
      const res  = await fetch(`/api/batches?filter=${filter}`);
      const rows = await res.json();
      setData(Array.isArray(rows) ? rows : []);
      setView('batches');
    }
    setLoading(false);
  }, [filter, search]);

  useEffect(() => { load(); }, [load]);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Inventory</h1>
          <p className="page-subtitle">Medicines, batches and stock levels</p>
        </div>
        <Link href="/stock/add" className="btn btn-primary" id="add-stock-btn">
          <Plus size={16} /> Add Stock
        </Link>
      </div>

      <div className={styles.filters}>
        {FILTERS.map(({ key, label, icon: Icon }) => (
          <button key={key}
            className={`${styles.filterBtn} ${filter === key ? styles.filterActive : ''}`}
            onClick={() => setFilter(key)}>
            <Icon size={14} /> {label}
          </button>
        ))}
      </div>

      {filter === 'all' && (
        <div className={styles.searchBar}>
          <Search size={16} className={styles.searchIcon} />
          <input className={`form-input ${styles.searchInput}`}
            placeholder="Search by name or generic…"
            value={search} onChange={e => setSearch(e.target.value)}
            id="stock-search" />
        </div>
      )}

      {loading ? (
        <div className="loading-center"><div className="spinner" /></div>
      ) : data.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <Package size={40} style={{ opacity: 0.3, marginBottom: 12 }} />
            <h3>No items found</h3>
            <p>{filter === 'all' ? 'Add your first medicine.' : 'No items match this filter.'}</p>
            {filter === 'all' && <Link href="/stock/add" className="btn btn-primary" style={{ marginTop: 16 }}>Add Medicine</Link>}
          </div>
        </div>
      ) : view === 'medicines' ? (
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Medicine</th><th>Generic</th><th>Category</th><th>Unit</th><th>In Stock</th><th>Nearest Expiry</th><th>Action</th></tr>
            </thead>
            <tbody>
              {data.map(m => {
                const badge = m.nearest_expiry ? expiryBadge(m.nearest_expiry) : null;
                const stock = Number(m.stock || 0);
                return (
                  <tr key={m.id}>
                    <td><strong>{m.name}</strong></td>
                    <td style={{ color: 'var(--text-secondary)' }}>{m.generic_name || '—'}</td>
                    <td>{m.category || '—'}</td>
                    <td><span className="badge badge-gray">{m.unit}</span></td>
                    <td>
                      <span className={`badge ${stock === 0 ? 'badge-red' : stock <= 10 ? 'badge-amber' : 'badge-green'}`}>
                        {stock === 0 ? 'Out of Stock' : `${stock} ${m.unit}`}
                      </span>
                    </td>
                    <td>{badge ? <span className={`badge ${badge.cls}`}>{badge.label}</span> : '—'}</td>
                    <td>
                      <Link href={`/stock/add?medicineId=${m.id}&medicineName=${encodeURIComponent(m.name)}`} className="btn btn-ghost btn-sm">
                        + Batch
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Medicine</th><th>Batch No.</th><th>Expiry</th>
                <th>Remaining</th><th>Sell Price</th><th>Dealer</th>
                {filter === 'expired' && <th>Loss Value</th>}
              </tr>
            </thead>
            <tbody>
              {data.map(b => {
                const badge = expiryBadge(b.expiry_date);
                return (
                  <tr key={b.id}>
                    <td><strong>{b.medicine_name}</strong></td>
                    <td style={{ fontFamily: 'monospace', color: 'var(--text-secondary)' }}>{b.batch_no}</td>
                    <td>
                      <div style={{ fontSize: 13 }}>{b.expiry_date}</div>
                      <span className={`badge ${badge.cls}`} style={{ marginTop: 4 }}>{badge.label}</span>
                    </td>
                    <td>{b.quantity_remaining} {b.unit}</td>
                    <td>₹{Number(b.selling_price).toLocaleString()}</td>
                    <td style={{ color: 'var(--text-secondary)' }}>{b.dealer_name || '—'}</td>
                    {filter === 'expired' && (
                      <td style={{ color: 'var(--red)', fontWeight: 600 }}>
                        ₹{Number(b.quantity_remaining * b.purchase_price).toLocaleString()}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default function StockPage() {
  return (
    <Suspense fallback={<div className="loading-center"><div className="spinner" /></div>}>
      <StockContent />
    </Suspense>
  );
}
