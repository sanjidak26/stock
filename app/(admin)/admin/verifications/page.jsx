'use client';

import { useEffect, useState } from 'react';
import { ShieldCheck, X, Check, Clock, ChevronDown } from 'lucide-react';
import styles from './verifications.module.css';

export default function VerificationsPage() {
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [showReject, setShowReject] = useState(null);
  const [filter, setFilter] = useState('pending');

  async function load() {
    setLoading(true);
    const res = await fetch(`/api/shops?status=${filter}`);
    const data = await res.json();
    setShops(Array.isArray(data) ? data : []);
    setLoading(false);
  }

  useEffect(() => { load(); }, [filter]);

  async function approve(shopId) {
    setActionId(shopId);
    await fetch('/api/admin/verify', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ shopId, action: 'approve' }),
    });
    setActionId(null);
    load();
  }

  async function reject(shopId) {
    setActionId(shopId);
    await fetch('/api/admin/verify', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ shopId, action: 'reject', reason: rejectReason || 'Not approved by admin' }),
    });
    setActionId(null); setShowReject(null); setRejectReason('');
    load();
  }

  function formatDate(d) {
    return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Verification Queue</h1>
          <p className="page-subtitle">Review and approve pharmacy registrations</p>
        </div>
      </div>

      {/* Filter */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {['pending', 'approved', 'rejected'].map(s => (
          <button key={s} className={`btn btn-sm ${filter === s ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setFilter(s)} style={{ textTransform: 'capitalize' }}>
            {s === 'pending' && <Clock size={13} />}
            {s === 'approved' && <Check size={13} />}
            {s === 'rejected' && <X size={13} />}
            {s}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="loading-center"><div className="spinner" /></div>
      ) : shops.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <ShieldCheck size={40} style={{ opacity: 0.2, marginBottom: 12 }} />
            <h3>No {filter} applications</h3>
            <p>{filter === 'pending' ? 'All caught up! No pharmacies waiting for review.' : `No ${filter} pharmacies found.`}</p>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {shops.map(shop => (
            <div key={shop.id} className="card">
              <div className={styles.shopRow}>
                <div className={styles.shopAvatar}>{shop.name[0].toUpperCase()}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                    <h3 style={{ fontSize: 16, fontWeight: 700 }}>{shop.name}</h3>
                    <span className={`badge ${shop.status === 'approved' ? 'badge-green' : shop.status === 'pending' ? 'badge-amber' : 'badge-red'}`}>
                      {shop.status}
                    </span>
                  </div>
                  <div className={styles.shopMeta}>
                    <span>👤 {shop.owner_name}</span>
                    <span>✉️ {shop.email}</span>
                    {shop.phone && <span>📞 {shop.phone}</span>}
                    {shop.drug_license_no && <span>📋 {shop.drug_license_no}</span>}
                    {shop.gst_no && <span>🏛️ {shop.gst_no}</span>}
                    <span>📅 Registered: {formatDate(shop.created_at)}</span>
                  </div>
                  {shop.address && (
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>📍 {shop.address}</div>
                  )}
                  {shop.rejection_reason && (
                    <div style={{ marginTop: 8 }} className="alert alert-error">
                      Rejected: {shop.rejection_reason}
                    </div>
                  )}
                </div>

                {/* Actions */}
                {filter === 'pending' && (
                  <div className={styles.actions}>
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => approve(shop.id)}
                      disabled={actionId === shop.id}
                      id={`approve-${shop.id}`}
                    >
                      <Check size={14} /> {actionId === shop.id ? '…' : 'Approve'}
                    </button>
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => setShowReject(shop.id)}
                      disabled={actionId === shop.id}
                      id={`reject-${shop.id}`}
                    >
                      <X size={14} /> Reject
                    </button>
                  </div>
                )}
                {filter === 'rejected' && (
                  <button className="btn btn-ghost btn-sm" onClick={() => approve(shop.id)} disabled={actionId === shop.id}>
                    <Check size={14} /> Re-approve
                  </button>
                )}
              </div>

              {/* Reject reason input */}
              {showReject === shop.id && (
                <div className={styles.rejectBox}>
                  <input
                    className="form-input"
                    placeholder="Reason for rejection (optional)…"
                    value={rejectReason}
                    onChange={e => setRejectReason(e.target.value)}
                    id={`reject-reason-${shop.id}`}
                  />
                  <button className="btn btn-danger btn-sm" onClick={() => reject(shop.id)} id={`confirm-reject-${shop.id}`}>
                    Confirm Reject
                  </button>
                  <button className="btn btn-ghost btn-sm" onClick={() => setShowReject(null)}>Cancel</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
