'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Pill, Store, User, Mail, Lock, Phone, MapPin, FileText, ChevronRight, ChevronLeft, Check } from 'lucide-react';
import styles from './auth.module.css';

const STEPS = ['Pharmacy Info', 'Owner Details', 'Review'];

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    shopName: '', address: '', phone: '',
    drugLicenseNo: '', gstNo: '',
    ownerName: '', email: '', password: '', confirmPassword: '',
  });

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function submit() {
    if (form.password !== form.confirmPassword) { setError('Passwords do not match'); return; }
    setLoading(true); setError('');
    try {
      const res = await fetch('/api/shops', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shopName: form.shopName, ownerName: form.ownerName,
          email: form.email, password: form.password,
          phone: form.phone, address: form.address,
          drugLicenseNo: form.drugLicenseNo, gstNo: form.gstNo,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Registration failed'); }
      else { setSuccess(true); }
    } catch { setError('Network error. Please try again.'); }
    setLoading(false);
  }

  if (success) return (
    <div className={styles.page}>
      <div className={styles.bgGlow} />
      <div className={styles.card} style={{ textAlign: 'center' }}>
        <div className={styles.successIcon}><Check size={32} /></div>
        <h1 className={styles.title}>Registration Submitted!</h1>
        <p className={styles.sub}>Your pharmacy application is under review. The admin will verify your documents and approve your account within 24 hours.</p>
        <Link href="/login" className="btn btn-primary" style={{ marginTop: 24, display: 'inline-flex' }}>Back to Sign In</Link>
      </div>
    </div>
  );

  return (
    <div className={styles.page}>
      <div className={styles.bgGlow} />
      <div className={styles.card}>
        <div className={styles.logoRow}>
          <div className={styles.logoIcon}><Pill size={22} /></div>
          <span className={styles.logoText}>Stock<strong>Easy</strong></span>
        </div>

        <h1 className={styles.title}>Register Pharmacy</h1>
        <p className={styles.sub}>Step {step + 1} of {STEPS.length} — {STEPS[step]}</p>

        {/* Step indicator */}
        <div className={styles.stepInd}>
          {STEPS.map((s, i) => (
            <div key={s} className={`${styles.stepDot} ${i < step ? styles.dotDone : i === step ? styles.dotActive : ''}`}>
              {i < step ? <Check size={12} /> : i + 1}
            </div>
          ))}
        </div>

        {error && <div className="alert alert-error" style={{ marginBottom: 16 }}>{error}</div>}

        {step === 0 && (
          <div className={styles.form}>
            <div className="form-group">
              <label className="form-label">Pharmacy Name *</label>
              <div className={styles.inputWrap}>
                <Store size={16} className={styles.inputIcon} />
                <input className={`form-input ${styles.paddedInput}`} placeholder="City Pharmacy" value={form.shopName} onChange={set('shopName')} required id="reg-shopname"/>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Address</label>
              <div className={styles.inputWrap}>
                <MapPin size={16} className={styles.inputIcon} />
                <input className={`form-input ${styles.paddedInput}`} placeholder="123 Main St, City" value={form.address} onChange={set('address')} id="reg-address"/>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Phone</label>
              <div className={styles.inputWrap}>
                <Phone size={16} className={styles.inputIcon} />
                <input className={`form-input ${styles.paddedInput}`} placeholder="+91 98765 43210" value={form.phone} onChange={set('phone')} id="reg-phone"/>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Drug License No.</label>
              <div className={styles.inputWrap}>
                <FileText size={16} className={styles.inputIcon} />
                <input className={`form-input ${styles.paddedInput}`} placeholder="DL-MH-2024-XXXX" value={form.drugLicenseNo} onChange={set('drugLicenseNo')} id="reg-druglicense"/>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">GST Number</label>
              <div className={styles.inputWrap}>
                <FileText size={16} className={styles.inputIcon} />
                <input className={`form-input ${styles.paddedInput}`} placeholder="27XXXXX0000X1Z5" value={form.gstNo} onChange={set('gstNo')} id="reg-gst"/>
              </div>
            </div>
            <button className="btn btn-primary" style={{ width: '100%' }} onClick={() => { if (!form.shopName) { setError('Pharmacy name required'); return; } setError(''); setStep(1); }} id="reg-next-1">
              Next <ChevronRight size={16} />
            </button>
          </div>
        )}

        {step === 1 && (
          <div className={styles.form}>
            <div className="form-group">
              <label className="form-label">Owner Name *</label>
              <div className={styles.inputWrap}>
                <User size={16} className={styles.inputIcon} />
                <input className={`form-input ${styles.paddedInput}`} placeholder="Full Name" value={form.ownerName} onChange={set('ownerName')} required id="reg-ownername"/>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Email *</label>
              <div className={styles.inputWrap}>
                <Mail size={16} className={styles.inputIcon} />
                <input type="email" className={`form-input ${styles.paddedInput}`} placeholder="owner@pharmacy.com" value={form.email} onChange={set('email')} required id="reg-email"/>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Password *</label>
              <div className={styles.inputWrap}>
                <Lock size={16} className={styles.inputIcon} />
                <input type="password" className={`form-input ${styles.paddedInput}`} placeholder="Min. 6 characters" value={form.password} onChange={set('password')} required id="reg-password"/>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Confirm Password *</label>
              <div className={styles.inputWrap}>
                <Lock size={16} className={styles.inputIcon} />
                <input type="password" className={`form-input ${styles.paddedInput}`} placeholder="Repeat password" value={form.confirmPassword} onChange={set('confirmPassword')} required id="reg-confirm-password"/>
              </div>
            </div>
            <div className={styles.btnRow}>
              <button className="btn btn-ghost" onClick={() => setStep(0)} id="reg-back-1"><ChevronLeft size={16}/> Back</button>
              <button className="btn btn-primary" onClick={() => { if (!form.ownerName||!form.email||!form.password) { setError('All fields required'); return; } setError(''); setStep(2); }} id="reg-next-2">
                Review <ChevronRight size={16}/>
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className={styles.form}>
            <div className={styles.reviewGrid}>
              {[
                ['Pharmacy', form.shopName], ['Address', form.address || '-'],
                ['Phone', form.phone || '-'], ['Drug License', form.drugLicenseNo || '-'],
                ['GST', form.gstNo || '-'], ['Owner', form.ownerName],
                ['Email', form.email],
              ].map(([k, v]) => (
                <div key={k} className={styles.reviewRow}>
                  <span className={styles.reviewKey}>{k}</span>
                  <span className={styles.reviewVal}>{v}</span>
                </div>
              ))}
            </div>
            <div className={styles.btnRow}>
              <button className="btn btn-ghost" onClick={() => setStep(1)} id="reg-back-2"><ChevronLeft size={16}/> Back</button>
              <button className="btn btn-primary" onClick={submit} disabled={loading} id="reg-submit">
                {loading ? 'Submitting…' : 'Submit Registration'}
              </button>
            </div>
          </div>
        )}

        <p className={styles.switchText}>Already registered? <Link href="/login">Sign in →</Link></p>
      </div>
    </div>
  );
}
