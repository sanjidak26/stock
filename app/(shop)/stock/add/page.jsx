'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { ChevronLeft, Plus, Package, Save } from 'lucide-react';
import Link from 'next/link';
import styles from './add.module.css';

const CATEGORIES = ['Antibiotic', 'Analgesic', 'Antacid', 'Antifungal', 'Antiviral', 'Vitamin', 'Cardiac', 'Diabetic', 'Dermatology', 'Other'];
const UNITS = ['tablet', 'capsule', 'strip', 'syrup', 'injection', 'cream', 'drops', 'inhaler', 'powder', 'ml'];

function AddStockContent() {
  const router = useRouter();
  const sp = useSearchParams();
  const prefillMedId = sp.get('medicineId');
  const prefillMedName = sp.get('medicineName');

  const [tab, setTab] = useState(() => (prefillMedId ? 'batch' : 'medicine'));
  const [medicines, setMedicines] = useState([]);
  const [dealers, setDealers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const timeoutRef = useRef();

  // Medicine form
  const [medForm, setMedForm] = useState({ name: '', genericName: '', category: '', unit: 'tablet' });
  // Batch form
  const [batchForm, setBatchForm] = useState({
    medicineId: prefillMedId || '',
    dealerId: '',
    batchNo: '',
    expiryDate: '',
    quantity: '',
    purchasePrice: '',
    sellingPrice: '',
  });

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const [medRes, dealerRes] = await Promise.all([
          fetch('/api/medicines'),
          fetch('/api/dealers'),
        ]);
        const medData = await medRes.json();
        const dealerData = await dealerRes.json();
        if (!active) return;
        setMedicines(Array.isArray(medData) ? medData : []);
        setDealers(Array.isArray(dealerData) ? dealerData : []);
      } catch (err) {
        if (!active) return;
        setError('Unable to load medicines or dealers.');
      }
    }
    load();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    return () => clearTimeout(timeoutRef.current);
  }, []);

  async function saveMedicine(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetch('/api/medicines', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(medForm),
      });

      const data = await res.json();
      setLoading(false);

      if (!res.ok) {
        setError(data?.error || 'Failed to save medicine.');
        return;
      }

      setSuccess('Medicine added! Now add a batch.');
      const updated = await fetch('/api/medicines');
      const updatedData = await updated.json();
      setMedicines(Array.isArray(updatedData) ? updatedData : []);
      setBatchForm((f) => ({ ...f, medicineId: String(data.id) }));
      setMedForm({ name: '', genericName: '', category: '', unit: 'tablet' });
      setTab('batch');
    } catch (err) {
      setLoading(false);
      setError('Unable to save medicine. Please try again.');
    }
  }

  async function saveBatch(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetch('/api/batches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          medicineId: batchForm.medicineId,
          dealerId: batchForm.dealerId || null,
          batchNo: batchForm.batchNo,
          expiryDate: batchForm.expiryDate,
          quantity: Number(batchForm.quantity),
          purchasePrice: Number(batchForm.purchasePrice),
          sellingPrice: Number(batchForm.sellingPrice),
        }),
      });

      const data = await res.json();
      setLoading(false);

      if (!res.ok) {
        setError(data?.error || 'Failed to save batch.');
        return;
      }

      setSuccess('✓ Batch added successfully!');
      setBatchForm((f) => ({
        ...f,
        batchNo: '',
        expiryDate: '',
        quantity: '',
        purchasePrice: '',
        sellingPrice: '',
      }));
      clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => router.push('/stock'), 1200);
    } catch (err) {
      setLoading(false);
      setError('Unable to save batch. Please try again.');
    }
  }

  const setM = k => e => setMedForm(f => ({ ...f, [k]: e.target.value }));
  const setB = k => e => setBatchForm(f => ({ ...f, [k]: e.target.value }));

  return (
    <div>
      <div className="page-header">
        <div>
          <Link href="/stock" className="btn btn-ghost btn-sm" style={{ marginBottom: 8 }}>
            <ChevronLeft size={15} /> Back to Inventory
          </Link>
          <h1 className="page-title">Add Stock</h1>
          <p className="page-subtitle">Add a new medicine and/or stock batch</p>
        </div>
      </div>

      {/* Tabs */}
      <div className={styles.tabs}>
        <button className={`${styles.tab} ${tab === 'medicine' ? styles.tabActive : ''}`} onClick={() => setTab('medicine')} id="tab-medicine">
          <Package size={15} /> New Medicine
        </button>
        <button className={`${styles.tab} ${tab === 'batch' ? styles.tabActive : ''}`} onClick={() => setTab('batch')} id="tab-batch">
          <Plus size={15} /> Add Batch
        </button>
      </div>

      {error && <div className="alert alert-error" style={{ marginBottom: 16 }}>{error}</div>}
      {success && <div className="alert alert-success" style={{ marginBottom: 16 }}>{success}</div>}

      {/* Medicine form */}
      {tab === 'medicine' && (
        <div className="card" style={{ maxWidth: 560 }}>
          <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 20 }}>Add New Medicine</h2>
          <form onSubmit={saveMedicine} className={styles.form}>
            <div className="form-group">
              <label className="form-label">Medicine Name *</label>
              <input className="form-input" placeholder="e.g. Paracetamol 500mg" value={medForm.name} onChange={setM('name')} required id="med-name" />
            </div>
            <div className="form-group">
              <label className="form-label">Generic Name</label>
              <input className="form-input" placeholder="e.g. Acetaminophen" value={medForm.genericName} onChange={setM('genericName')} id="med-generic" />
            </div>
            <div className={styles.row2}>
              <div className="form-group">
                <label className="form-label">Category</label>
                <select className="form-select" value={medForm.category} onChange={setM('category')} id="med-category">
                  <option value="">Select…</option>
                  {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Unit *</label>
                <select className="form-select" value={medForm.unit} onChange={setM('unit')} required id="med-unit">
                  {UNITS.map(u => <option key={u}>{u}</option>)}
                </select>
              </div>
            </div>
            <button type="submit" className="btn btn-primary" disabled={loading} id="save-medicine-btn">
              <Save size={15} /> {loading ? 'Saving…' : 'Save Medicine & Add Batch'}
            </button>
          </form>
        </div>
      )}

      {/* Batch form */}
      {tab === 'batch' && (
        <div className="card" style={{ maxWidth: 600 }}>
          <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 20 }}>Add Batch</h2>
          {prefillMedName && tab === 'batch' && (
            <div className="alert alert-info" style={{ marginBottom: 16 }}>
              Adding batch for: <strong>{prefillMedName}</strong>
            </div>
          )}
          <form onSubmit={saveBatch} className={styles.form}>
            <div className="form-group">
              <label className="form-label">Medicine *</label>
              <select className="form-select" value={batchForm.medicineId} onChange={setB('medicineId')} required id="batch-medicine">
                <option value="">Select medicine…</option>
                {medicines.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Dealer / Supplier</label>
              <select className="form-select" value={batchForm.dealerId} onChange={setB('dealerId')} id="batch-dealer">
                <option value="">None</option>
                {dealers.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
            <div className={styles.row2}>
              <div className="form-group">
                <label className="form-label">Batch Number *</label>
                <input className="form-input" placeholder="e.g. BT-2024-001" value={batchForm.batchNo} onChange={setB('batchNo')} required id="batch-no" />
              </div>
              <div className="form-group">
                <label className="form-label">Expiry Date *</label>
                <input type="date" className="form-input" value={batchForm.expiryDate} onChange={setB('expiryDate')} required id="batch-expiry" />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Quantity *</label>
              <input type="number" min="1" className="form-input" placeholder="e.g. 100" value={batchForm.quantity} onChange={setB('quantity')} required id="batch-qty" />
            </div>
            <div className={styles.row2}>
              <div className="form-group">
                <label className="form-label">Purchase Price (₹) *</label>
                <input type="number" min="0" step="0.01" className="form-input" placeholder="0.00" value={batchForm.purchasePrice} onChange={setB('purchasePrice')} required id="batch-purchase" />
              </div>
              <div className="form-group">
                <label className="form-label">Selling Price (₹) *</label>
                <input type="number" min="0" step="0.01" className="form-input" placeholder="0.00" value={batchForm.sellingPrice} onChange={setB('sellingPrice')} required id="batch-sell" />
              </div>
            </div>
            <button type="submit" className="btn btn-primary" disabled={loading} id="save-batch-btn">
              <Save size={15} /> {loading ? 'Saving…' : 'Save Batch'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
export default function AddStockPage() {
  return (
    <Suspense
      fallback={
        <div className="loading-center">
          <div className="spinner" />
        </div>
      }
    >
      <AddStockContent />
    </Suspense>
  );
}
