'use client';

import { useEffect, useState, useRef } from 'react';
import { Search, Plus, Trash2, ShoppingCart, Printer, X, AlertCircle, Check } from 'lucide-react';
import styles from './billing.module.css';

export default function BillingPage() {
  const [medSearch, setMedSearch] = useState('');
  const [medicines, setMedicines] = useState([]);
  const [selectedMed, setSelectedMed] = useState(null);
  const [batches, setBatches] = useState([]);
  const [cart, setCart] = useState([]);
  const [customer, setCustomer] = useState({ name: '', phone: '' });
  const [discount, setDiscount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [billResult, setBillResult] = useState(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const printRef = useRef();

  // Search medicines
  useEffect(() => {
    if (medSearch.length < 1) { setMedicines([]); setSearchOpen(false); return; }
    const t = setTimeout(async () => {
      const res = await fetch(`/api/medicines?search=${encodeURIComponent(medSearch)}`);
      const data = await res.json();
      setMedicines(Array.isArray(data) ? data.filter(m => m.stock > 0) : []);
      setSearchOpen(true);
    }, 250);
    return () => clearTimeout(t);
  }, [medSearch]);

  // Load FEFO batches for a medicine
  async function selectMedicine(med) {
    setSelectedMed(med);
    setMedSearch(med.name);
    setSearchOpen(false);
    const res = await fetch(`/api/batches?medicineId=${med.id}`);
    const data = await res.json();
    setBatches(Array.isArray(data) ? data : []);
  }

  // Add batch to cart
  function addToCart(batch, qty = 1) {
    const existing = cart.find(i => i.batchId === batch.id);
    const maxQty = batch.quantity_remaining;
    if (existing) {
      if (existing.quantity + qty > maxQty) return;
      setCart(c => c.map(i => i.batchId === batch.id
        ? { ...i, quantity: i.quantity + qty, subtotal: (i.quantity + qty) * i.unitPrice }
        : i
      ));
    } else {
      setCart(c => [...c, {
        batchId: batch.id, medicineId: batch.medicine_id,
        medicineName: batch.medicine_name, batchNo: batch.batch_no,
        expiryDate: batch.expiry_date, unit: batch.unit,
        unitPrice: batch.selling_price, quantity: qty,
        subtotal: qty * batch.selling_price, maxQty,
      }]);
    }
    setSelectedMed(null); setBatches([]); setMedSearch('');
  }

  function updateQty(batchId, qty) {
    if (qty < 1) return;
    setCart(c => c.map(i => i.batchId === batchId
      ? { ...i, quantity: Math.min(qty, i.maxQty), subtotal: Math.min(qty, i.maxQty) * i.unitPrice }
      : i
    ));
  }

  function removeFromCart(batchId) {
    setCart(c => c.filter(i => i.batchId !== batchId));
  }

  const total = cart.reduce((s, i) => s + i.subtotal, 0);
  const net = Math.max(0, total - Number(discount));

  async function createBill() {
    if (cart.length === 0) return;
    setLoading(true);
    const res = await fetch('/api/billing/sell', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ customerName: customer.name, customerPhone: customer.phone, discount: Number(discount), items: cart.map(i => ({
        batchId: i.batchId, medicineId: i.medicineId, quantity: i.quantity, unitPrice: i.unitPrice, subtotal: i.subtotal,
      })) }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { alert(data.error); return; }
    setBillResult({ ...data, cart: [...cart], customer: { ...customer }, discount: Number(discount), total, net });
    setCart([]); setDiscount(0); setCustomer({ name: '', phone: '' });
  }

  function printBill() { window.print(); }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">FEFO Billing</h1>
          <p className="page-subtitle">Nearest-expiry batch is automatically selected first</p>
        </div>
      </div>

      {billResult && (
        <div className="alert alert-success" style={{ marginBottom: 20 }}>
          <Check size={16}/> Bill <strong>{billResult.billNo}</strong> created! Net: ₹{Number(billResult.net).toLocaleString()}
          <button className="btn btn-ghost btn-sm" onClick={() => setBillResult(null)} style={{ marginLeft: 'auto' }}>
            New Bill
          </button>
        </div>
      )}

      <div className={styles.billingGrid}>
        {/* Left — Search + Batches */}
        <div>
          <div className="card" style={{ marginBottom: 16 }}>
            <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>Search Medicine</h2>
            <div className={styles.searchWrap}>
              <Search size={16} className={styles.searchIco} />
              <input
                className={`form-input ${styles.searchInput}`}
                placeholder="Type medicine name…"
                value={medSearch}
                onChange={e => setMedSearch(e.target.value)}
                id="billing-search"
                autoComplete="off"
              />
              {searchOpen && medicines.length > 0 && (
                <div className={styles.dropdown}>
                  {medicines.map(m => (
                    <button key={m.id} className={styles.dropItem} onClick={() => selectMedicine(m)}>
                      <div>
                        <div className={styles.dropName}>{m.name}</div>
                        <div className={styles.dropMeta}>{m.generic_name} · {m.stock} in stock</div>
                      </div>
                      <span className="badge badge-green">{m.stock} {m.unit}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* FEFO Batches */}
          {batches.length > 0 && (
            <div className="card">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <AlertCircle size={15} style={{ color: 'var(--cyan)' }} />
                <h2 style={{ fontSize: 14, fontWeight: 700 }}>FEFO Batches — {selectedMed?.name}</h2>
                <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 4 }}>sorted by earliest expiry</span>
              </div>
              <div className={styles.batchList}>
                {batches.map((b, idx) => (
                  <div key={b.id} className={`${styles.batchRow} ${idx === 0 ? styles.fefoFirst : ''}`}>
                    <div>
                      {idx === 0 && <span className={styles.fefoTag}>FEFO ★</span>}
                      <div style={{ fontSize: 13, fontWeight: 600 }}>Batch: {b.batch_no}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                        Expires: {b.expiry_date} · Qty: {b.quantity_remaining} · ₹{b.selling_price}
                      </div>
                    </div>
                    <button className="btn btn-primary btn-sm" onClick={() => addToCart(b)}>
                      <Plus size={13} /> Add
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right — Cart + Bill */}
        <div className="card">
          <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>
            <ShoppingCart size={16} style={{ display: 'inline', marginRight: 8 }} />
            Bill Cart
          </h2>

          <div className={styles.customerRow}>
            <input className="form-input" placeholder="Customer name (optional)" value={customer.name}
              onChange={e => setCustomer(c => ({ ...c, name: e.target.value }))} id="cust-name" />
            <input className="form-input" placeholder="Phone (optional)" value={customer.phone}
              onChange={e => setCustomer(c => ({ ...c, phone: e.target.value }))} id="cust-phone" />
          </div>

          {cart.length === 0 ? (
            <div className="empty-state" style={{ padding: '30px 0' }}>
              <ShoppingCart size={32} style={{ opacity: 0.2, marginBottom: 8 }} />
              <p>Search and add medicines above</p>
            </div>
          ) : (
            <>
              <div className={styles.cartItems}>
                {cart.map(item => (
                  <div key={item.batchId} className={styles.cartRow}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{item.medicineName}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Batch: {item.batchNo} · Exp: {item.expiryDate}</div>
                      <div style={{ fontSize: 12, color: 'var(--cyan)', marginTop: 2 }}>₹{item.unitPrice} × {item.quantity}</div>
                    </div>
                    <div className={styles.cartQty}>
                      <button className={styles.qtyBtn} onClick={() => updateQty(item.batchId, item.quantity - 1)}>−</button>
                      <span>{item.quantity}</span>
                      <button className={styles.qtyBtn} onClick={() => updateQty(item.batchId, item.quantity + 1)}>+</button>
                    </div>
                    <div style={{ minWidth: 64, textAlign: 'right', fontWeight: 600 }}>₹{item.subtotal.toFixed(2)}</div>
                    <button className={styles.removeBtn} onClick={() => removeFromCart(item.batchId)}>
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>

              <div className="divider" />

              <div className={styles.totals}>
                <div className={styles.totalRow}><span>Subtotal</span><span>₹{total.toFixed(2)}</span></div>
                <div className={styles.totalRow}>
                  <span>Discount (₹)</span>
                  <input type="number" min="0" className={`form-input ${styles.discountInput}`}
                    value={discount} onChange={e => setDiscount(e.target.value)} id="bill-discount" />
                </div>
                <div className={`${styles.totalRow} ${styles.netRow}`}>
                  <span>Net Amount</span>
                  <span>₹{net.toFixed(2)}</span>
                </div>
              </div>

              <button className="btn btn-primary" style={{ width: '100%', marginTop: 16, justifyContent: 'center' }}
                onClick={createBill} disabled={loading} id="create-bill-btn">
                {loading ? 'Processing…' : <><ShoppingCart size={16} /> Generate Bill</>}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
