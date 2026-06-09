'use client';

import { useEffect, useState } from 'react';
import { Search, Receipt, ChevronRight } from 'lucide-react';
import styles from './bills.module.css';

export default function BillsPage() {
  const [bills, setBills] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [billDetail, setBillDetail] = useState(null);

  async function load() {
    setLoading(true);
    const res = await fetch(`/api/bills?search=${encodeURIComponent(search)}`);
    const data = await res.json();
    setBills(Array.isArray(data) ? data : []);
    setLoading(false);
  }

  async function openBill(id) {
    setSelected(id);
    const res = await fetch(`/api/bills?id=${id}`);
    const data = await res.json();
    setBillDetail(data);
  }

  useEffect(() => { load(); }, [search]);

  function formatDate(d) {
    return new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Sales History</h1>
          <p className="page-subtitle">{bills.length} bills found</p>
        </div>
      </div>

      <div className={styles.searchBar}>
        <Search size={16} className={styles.searchIco} />
        <input className={`form-input ${styles.searchInput}`} placeholder="Search by bill no, customer name or phone…"
          value={search} onChange={e => setSearch(e.target.value)} id="bills-search" />
      </div>

      <div className={styles.grid}>
        {/* Bills list */}
        <div>
          {loading ? <div className="loading-center"><div className="spinner" /></div> :
           bills.length === 0 ? (
            <div className="card"><div className="empty-state"><Receipt size={36} style={{ opacity: 0.2 }} /><h3>No bills yet</h3><p>Bills will appear here after you generate them from the Billing page.</p></div></div>
           ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Bill No.</th>
                    <th>Customer</th>
                    <th>Amount</th>
                    <th>Date</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {bills.map(b => (
                    <tr key={b.id} style={{ cursor: 'pointer' }} onClick={() => openBill(b.id)}
                      className={selected === b.id ? styles.selectedRow : ''}>
                      <td><span style={{ fontFamily: 'monospace', color: 'var(--cyan)' }}>{b.bill_no}</span></td>
                      <td>
                        <div style={{ fontSize: 13, fontWeight: 600 }}>{b.customer_name || 'Walk-in'}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{b.customer_phone || ''}</div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 700 }}>₹{Number(b.net_amount).toLocaleString()}</div>
                        {b.discount > 0 && <div style={{ fontSize: 11, color: 'var(--green)' }}>−₹{b.discount} disc.</div>}
                      </td>
                      <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{formatDate(b.created_at)}</td>
                      <td><ChevronRight size={15} style={{ color: 'var(--text-muted)' }} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Bill detail */}
        {billDetail && (
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontSize: 16, fontWeight: 700 }}>Bill Details</h2>
              <button className="btn btn-ghost btn-sm" onClick={() => { setSelected(null); setBillDetail(null); }}>✕</button>
            </div>

            <div className={styles.detailMeta}>
              <div className={styles.metaRow}><span>Bill No.</span><span style={{ color: 'var(--cyan)', fontFamily: 'monospace' }}>{billDetail.bill?.bill_no}</span></div>
              <div className={styles.metaRow}><span>Customer</span><span>{billDetail.bill?.customer_name || 'Walk-in'}</span></div>
              <div className={styles.metaRow}><span>Phone</span><span>{billDetail.bill?.customer_phone || '—'}</span></div>
              <div className={styles.metaRow}><span>Date</span><span>{billDetail.bill?.created_at ? formatDate(billDetail.bill.created_at) : '—'}</span></div>
            </div>

            <div className="divider" style={{ margin: '14px 0' }} />

            <div className={styles.itemList}>
              {billDetail.items?.map(item => (
                <div key={item.id} className={styles.item}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{item.medicine_name}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Batch: {item.batch_no} · Exp: {item.expiry_date}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>₹{item.unit_price} × {item.quantity} {item.unit}</div>
                  </div>
                  <div style={{ fontWeight: 700, color: 'var(--cyan)' }}>₹{Number(item.subtotal).toFixed(2)}</div>
                </div>
              ))}
            </div>

            <div className="divider" style={{ margin: '14px 0' }} />

            <div className={styles.detailTotals}>
              <div className={styles.metaRow}><span>Subtotal</span><span>₹{Number(billDetail.bill?.total_amount).toFixed(2)}</span></div>
              {billDetail.bill?.discount > 0 && <div className={styles.metaRow}><span>Discount</span><span style={{ color: 'var(--green)' }}>−₹{billDetail.bill?.discount}</span></div>}
              <div className={`${styles.metaRow} ${styles.netTotal}`}><span>Net Amount</span><span>₹{Number(billDetail.bill?.net_amount).toFixed(2)}</span></div>
            </div>

            <button className="btn btn-ghost" style={{ width: '100%', justifyContent: 'center', marginTop: 16 }} onClick={() => window.print()}>
              🖨️ Print Bill
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
