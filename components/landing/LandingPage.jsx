'use client';

import Link from 'next/link';
import styles from './LandingPage.module.css';
import { Pill, TrendingUp, Bot, Shield, Zap, Users, ArrowRight, Check } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className={styles.page}>
      {/* Animated background */}
      <div className={styles.bgGlow} />
      <div className={styles.bgGlow2} />

      {/* Navbar */}
      <nav className={styles.nav}>
        <div className={styles.navInner}>
          <div className={styles.logo}>
            <div className={styles.logoIcon}><Pill size={20} /></div>
            <span>Stock<strong>Easy</strong></span>
          </div>
          <div className={styles.navLinks}>
            <a href="#features">Features</a>
            <a href="#how">How It Works</a>
          </div>
          <div className={styles.navCta}>
            <Link href="/login" className="btn btn-ghost btn-sm">Sign In</Link>
            <Link href="/register" className="btn btn-primary btn-sm">Get Started</Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className={styles.hero}>
        <div className={styles.heroBadge}>
          <Zap size={12} /> FEFO-Powered Pharmacy SaaS
        </div>
        <h1 className={styles.heroTitle}>
          Stop Losing Money to<br />
          <span className="gradient-text">Medicine Expiry</span>
        </h1>
        <p className={styles.heroSub}>
          Stock Easy ensures the oldest batch sells first — automatically.<br />
          Cut expiry waste, streamline billing, and get AI-powered insights.
        </p>
        <div className={styles.heroCtas}>
          <Link href="/register" className="btn btn-primary btn-lg">
            Register Your Pharmacy <ArrowRight size={18} />
          </Link>
          <Link href="/login" className="btn btn-ghost btn-lg">
            Sign In →
          </Link>
        </div>

        {/* Stat pills */}
        <div className={styles.statPills}>
          {[
            { label: 'Expiry Waste Reduced', value: '↓ 80%' },
            { label: 'Billing Time', value: '< 30s' },
            { label: 'Pharmacies Trust Us', value: '500+' },
          ].map((s) => (
            <div key={s.label} className={styles.statPill}>
              <span className={styles.statVal}>{s.value}</span>
              <span className={styles.statLabel}>{s.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Problem / Solution */}
      <section className={styles.section} id="features">
        <div className={styles.sectionHead}>
          <h2>The <span className="gradient-text">Problem</span> We Solve</h2>
          <p>Small pharmacies lose 15-25% of revenue to expired medicines every year.</p>
        </div>
        <div className={styles.psGrid}>
          <div className={styles.problemCard}>
            <h3>❌ The Problem</h3>
            <ul>
              <li>Staff sell newer stock while older batches expire unseen</li>
              <li>No system to track which batch expires first</li>
              <li>Expired medicines = direct financial loss</li>
              <li>Manual billing prone to errors</li>
            </ul>
          </div>
          <div className={styles.solutionCard}>
            <h3>✅ FEFO Solution</h3>
            <ul>
              <li>System automatically selects the nearest-expiry batch</li>
              <li>Real-time expiry alerts before it's too late</li>
              <li>One-click FEFO billing with stock auto-decrement</li>
              <li>AI answers inventory questions in plain English</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className={styles.section} id="how">
        <div className={styles.sectionHead}>
          <h2>Everything You <span className="gradient-text">Need</span></h2>
          <p>Built for small pharmacies. Enterprise-grade features.</p>
        </div>
        <div className={styles.featureGrid}>
          {[
            { icon: Zap, title: 'FEFO Billing', color: 'var(--cyan)', desc: 'Auto-selects the nearest-expiry batch on every sale. Stock decrements in the same transaction.' },
            { icon: TrendingUp, title: 'Analytics Dashboard', color: 'var(--purple)', desc: 'Revenue trends, top medicines, expiry-loss analysis and dealer performance — all in one view.' },
            { icon: Bot, title: 'AI Assistant', color: 'var(--green)', desc: 'Ask "Which medicines expire next month?" in plain English and get instant database answers.' },
            { icon: Shield, title: 'Admin Verification', color: 'var(--amber)', desc: 'Central admin reviews drug licenses before a pharmacy can start operations.' },
            { icon: Users, title: 'Multi-Role Access', color: 'var(--blue)', desc: 'Separate dashboards for Central Admin, Shop Owner and Staff — each sees only what they need.' },
            { icon: Pill, title: 'Inventory Alerts', color: 'var(--red)', desc: 'Near-expiry, low-stock and out-of-stock alerts keep you ahead of shortages.' },
          ].map(({ icon: Icon, title, color, desc }) => (
            <div key={title} className={styles.featureCard}>
              <div className={styles.featureIcon} style={{ background: `${color}20`, color }}>
                <Icon size={22} />
              </div>
              <h3>{title}</h3>
              <p>{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className={styles.section}>
        <div className={styles.sectionHead}>
          <h2>How It <span className="gradient-text">Works</span></h2>
        </div>
        <div className={styles.steps}>
          {[
            { n: '01', title: 'Register & Verify', desc: 'Submit your pharmacy details and drug license. Admin approves within 24 hours.' },
            { n: '02', title: 'Add Stock', desc: 'Enter medicines, dealers, batches with expiry dates and prices.' },
            { n: '03', title: 'FEFO Billing', desc: 'Search medicine → nearest-expiry batch auto-highlighted → bill created, stock decremented.' },
            { n: '04', title: 'Insights & AI', desc: 'Analytics dashboards and AI assistant keep you informed every day.' },
          ].map((s) => (
            <div key={s.n} className={styles.step}>
              <div className={styles.stepNum}>{s.n}</div>
              <h3>{s.title}</h3>
              <p>{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className={styles.ctaSection}>
        <div className={styles.ctaBox}>
          <h2>Ready to eliminate expiry waste?</h2>
          <p>Join 500+ pharmacies already using Stock Easy.</p>
          <Link href="/register" className="btn btn-primary btn-lg">
            Register Free <ArrowRight size={18} />
          </Link>
          <div className={styles.ctaTrust}>
            {['No credit card', 'Free setup', 'Data isolated per pharmacy'].map((t) => (
              <span key={t}><Check size={13} /> {t}</span>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className={styles.footer}>
        <div className={styles.logo}>
          <div className={styles.logoIcon}><Pill size={16} /></div>
          <span>Stock<strong>Easy</strong></span>
        </div>
        <p>© 2024 Stock Easy. Built for small pharmacies.</p>
        <div className={styles.footerLinks}>
          <Link href="/login">Sign In</Link>
          <Link href="/register">Register</Link>
        </div>
      </footer>
    </div>
  );
}
