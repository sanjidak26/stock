'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Pill, Mail, Lock, Eye, EyeOff, LogIn } from 'lucide-react';
import styles from './auth.module.css';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    const res = await signIn('credentials', { email, password, redirect: false });
    setLoading(false);
    if (res?.error) { setError('Invalid email or password'); return; }
    router.push('/dashboard');
    router.refresh();
  }

  function fillDemo(role) {
    if (role === 'admin') { setEmail('admin@stockeasy.com'); setPassword('admin123'); }
  }

  return (
    <div className={styles.page}>
      <div className={styles.bgGlow} />
      <div className={styles.card}>
        <div className={styles.logoRow}>
          <div className={styles.logoIcon}><Pill size={22} /></div>
          <span className={styles.logoText}>Stock<strong>Easy</strong></span>
        </div>

        <h1 className={styles.title}>Welcome back</h1>
        <p className={styles.sub}>Sign in to your pharmacy account</p>

        {error && (
          <div className="alert alert-error" style={{ marginBottom: 16 }}>
            <Lock size={15} /> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className="form-group">
            <label className="form-label">Email address</label>
            <div className={styles.inputWrap}>
              <Mail size={16} className={styles.inputIcon} />
              <input
                type="email"
                className={`form-input ${styles.paddedInput}`}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@pharmacy.com"
                required
                id="login-email"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <div className={styles.inputWrap}>
              <Lock size={16} className={styles.inputIcon} />
              <input
                type={show ? 'text' : 'password'}
                className={`form-input ${styles.paddedInput}`}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                id="login-password"
              />
              <button type="button" className={styles.eyeBtn} onClick={() => setShow(!show)}>
                {show ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading} id="login-submit">
            {loading ? <><span className={styles.spinnerSm} /> Signing in…</> : <><LogIn size={16} /> Sign In</>}
          </button>
        </form>

        <div className={styles.divider}><span>or try demo</span></div>

        <button
          className="btn btn-ghost"
          style={{ width: '100%', justifyContent: 'center', fontSize: 13 }}
          onClick={() => fillDemo('admin')}
          id="demo-admin-btn"
        >
          🔑 Fill Admin Demo Credentials
        </button>

        <p className={styles.switchText}>
          New pharmacy? <Link href="/register">Register here →</Link>
        </p>
      </div>
    </div>
  );
}
