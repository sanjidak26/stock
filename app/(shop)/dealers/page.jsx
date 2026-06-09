'use client';

import { useEffect, useState } from 'react';
import { Plus, Truck, Trash2, X, Save } from 'lucide-react';
import styles from './dealers.module.css';

export default function DealersPage() {
  const [dealers, setDealers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', contactName: '', phone: '', email: '', address: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function load() {
    setLoading(true);
    const res = await fetch('/api/dealers');
    const data = await res.json();
    setDealers(Array.isArray(data) ? data : []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function save(e) {
    e.preventDefault();
    setSaving(true); setError('');
    const res = await fetch('/api/dealers', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) { setError(data.error); return; }
    setShowModal(false);
    setForm({ name: '', contactName: '', phone: '', email: '', address: '' });
    load();
  }

  async function remove(id) {
    if (!confirm('Delete this dealer?')) return;
    await fetch(`/api/dealers?id=${id}`, { method: 'DELETE' });
    load();
  }

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Dealers / Suppliers</h1>
          <p className="page-subtitle">{dealers.length} suppliers registered</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)} id="add-dealer-btn">
          <Plus size={16} /> Add Dealer
        </button>
      </div>

      {loading ? (
        <div className="loading-center"><div className="spinner" /></div>
      ) : dealers.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <Truck size={40} style={{ opacity: 0.2, marginBottom: 12 }} />
            <h3>No dealers yet</h3>
            <p>Add suppliers to track stock sources and performance.</p>
            <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => setShowModal(true)}>Add First Dealer</button>
          </div>
        </div>
      ) : (
        <div className={styles.dealerGrid}>
          {dealers.map(d => (
            <div key={d.id} className="card" style={{ position: 'relative' }}>
              <div className={styles.dealerHeader}>
                <div className={styles.dealerAvatar}>{d.name[0].toUpperCase()}</div>
                <div>
                  <div className={styles.dealerName}>{d.name}</div>
                  {d.contact_name && <div className={styles.dealerSub}>{d.contact_name}</div>}
                </div>
                <button className={styles.deleteBtn} onClick={() => remove(d.id)} id={`del-dealer-${d.id}`}>
                  <Trash2 size={14} />
                </button>
              </div>
              <div className={styles.dealerInfo}>
                {d.phone && <div><span>📞</span> {d.phone}</div>}
                {d.email && <div><span>✉️</span> {d.email}</div>}
                {d.address && <div><span>📍</span> {d.address}</div>}
                {!d.phone && !d.email && !d.address && <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>No contact details</div>}
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2 className="modal-title">Add Dealer</h2>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowModal(false)}><X size={18}/></button>
            </div>
            {error && <div className="alert alert-error" style={{ marginBottom: 14 }}>{error}</div>}
            <form onSubmit={save} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="form-group">
                <label className="form-label">Dealer / Company Name *</label>
                <input className="form-input" placeholder="e.g. MedSupply Co." value={form.name} onChange={set('name')} required id="dealer-name" />
              </div>
              <div className="form-group">
                <label className="form-label">Contact Person</label>
                <input className="form-input" placeholder="e.g. Rajesh Kumar" value={form.contactName} onChange={set('contactName')} id="dealer-contact" />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group">
                  <label className="form-label">Phone</label>
                  <input className="form-input" placeholder="+91 98765 43210" value={form.phone} onChange={set('phone')} id="dealer-phone" />
                </div>
                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input type="email" className="form-input" placeholder="dealer@mail.com" value={form.email} onChange={set('email')} id="dealer-email" />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Address</label>
                <input className="form-input" placeholder="City, State" value={form.address} onChange={set('address')} id="dealer-address" />
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 4 }}>
                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving} id="save-dealer-btn">
                  <Save size={15} /> {saving ? 'Saving…' : 'Save Dealer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
