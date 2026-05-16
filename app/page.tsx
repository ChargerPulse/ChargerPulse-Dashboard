'use client'

import { useState, useEffect } from 'react'
import { createClient } from '../lib/supabase'
export default function LandingPage() {
  const [time, setTime] = useState('')

  useEffect(() => {
    const tick = () => setTime(new Date().toLocaleTimeString())
    tick()
    const i = setInterval(tick, 1000)
    return () => clearInterval(i)
  }, [])

  const features = [
    { icon: '⚡', title: 'Real-Time Monitoring', desc: 'Know the status of every charger the moment it changes. Available, Faulted, Occupied — updated live.' },
    { icon: '🚨', title: 'Instant Alerts', desc: 'Get email notifications the moment a charger goes down. Never let a driver arrive at a dead charger again.' },
    { icon: '📊', title: 'Uptime Analytics', desc: 'Track 24h, 7-day and 30-day uptime percentages per charger. Export reports as CSV for compliance.' },
    { icon: '🔌', title: 'Universal OCPP Support', desc: 'Works with any EV charger that supports OCPP 1.6 — regardless of brand or manufacturer.' },
    { icon: '📋', title: 'Event History', desc: 'Full log of every status change. Prove uptime to insurers, fleet managers and financiers.' },
    { icon: '🛡️', title: 'Secure & Private', desc: 'Your data belongs to you. Each account is isolated. Secured by Supabase Auth.' },
  ]

  const stats = [
    { value: '20%', label: 'of chargers fail silently every week' },
    { value: '60s', label: 'to detect a charger fault' },
    { value: '24/7', label: 'uptime monitoring' },
    { value: '100%', label: 'OCPP 1.6 compatible' },
  ]

  const plans = [
    { name: 'Pro', price: '', desc: 'Monitor 1 charger', color: '#00d4ff', link: 'https://chargerpulse.lemonsqueezy.com/checkout/buy/44db6a87-af91-43ff-96db-613d1db2f061', features: ['1 charger', 'Real-time alerts', 'Basic analytics', 'Email support'] },
    { name: 'Plus', price: '', desc: 'Monitor 5 chargers', color: '#a855f7', link: 'https://chargerpulse.lemonsqueezy.com/checkout/buy/b0df42fc-f1a6-4fc8-b7d3-ed43878790ec', features: ['5 chargers', 'Real-time alerts', 'Advanced analytics', 'Priority support'], popular: true },
    { name: 'Enterprise', price: '', desc: 'Unlimited chargers', color: '#00ff88', link: 'https://chargerpulse.lemonsqueezy.com/checkout/buy/1a1cc852-4a6c-4b99-9d14-caaeba115d17', features: ['Unlimited chargers', 'Real-time alerts', 'Custom analytics', 'Dedicated support'] },
  ]

  return (
    <div className="space-bg" style={{ minHeight: '100vh' }}>

      {/* NAV */}
      <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 48px', borderBottom: '1px solid rgba(255,255,255,0.06)', position: 'sticky', top: 0, zIndex: 100, background: 'rgba(2,8,23,0.8)', backdropFilter: 'blur(20px)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, #00d4ff, #a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>⚡</div>
          <span style={{ fontSize: 18, fontWeight: 800, color: '#e2e8f0' }}>ChargerPulse</span>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <a href="/login" style={{ color: '#64748b', textDecoration: 'none', fontSize: 14, fontWeight: 600 }}>Sign In</a>
          <a href="/login" style={{ background: 'linear-gradient(135deg, #00d4ff, #a855f7)', color: 'white', padding: '9px 20px', borderRadius: 8, textDecoration: 'none', fontSize: 14, fontWeight: 700 }}>Get Started Free</a>
        </div>
      </nav>

      {/* HERO */}
      <section style={{ textAlign: 'center', padding: '100px 48px 80px', maxWidth: 800, margin: '0 auto' }}>
        <div style={{ display: 'inline-block', background: 'rgba(0,212,255,0.1)', border: '1px solid rgba(0,212,255,0.3)', borderRadius: 20, padding: '6px 16px', fontSize: 12, color: '#00d4ff', fontWeight: 700, letterSpacing: 1, marginBottom: 24 }}>
          LIVE MONITORING — {time}
        </div>
        <h1 style={{ fontSize: 56, fontWeight: 900, color: '#e2e8f0', lineHeight: 1.1, marginBottom: 24 }}>
          Know when your EV chargers go down{' '}
          <span style={{ background: 'linear-gradient(135deg, #00d4ff, #a855f7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            before your drivers do
          </span>
        </h1>
        <p style={{ fontSize: 18, color: '#64748b', lineHeight: 1.7, marginBottom: 40, maxWidth: 600, margin: '0 auto 40px' }}>
          ChargerPulse monitors your EV charging infrastructure 24/7. Get instant alerts when chargers fault, track uptime analytics, and never lose a delivery to a dead charger again.
        </p>
        <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
          <a href="/login" style={{ background: 'linear-gradient(135deg, #00d4ff, #a855f7)', color: 'white', padding: '16px 36px', borderRadius: 12, textDecoration: 'none', fontSize: 16, fontWeight: 800, boxShadow: '0 0 30px rgba(0,212,255,0.3)' }}>
            Start Monitoring Free →
          </a>
          <a href="#pricing" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#e2e8f0', padding: '16px 36px', borderRadius: 12, textDecoration: 'none', fontSize: 16, fontWeight: 700 }}>
            View Pricing
          </a>
        </div>
      </section>

      {/* STATS */}
      <section style={{ padding: '60px 48px', maxWidth: 1000, margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20 }}>
          {stats.map((s, i) => (
            <div key={i} className="card" style={{ padding: '28px 20px', textAlign: 'center' }}>
              <p style={{ fontSize: 40, fontWeight: 900, color: '#00d4ff', marginBottom: 8 }}>{s.value}</p>
              <p style={{ color: '#64748b', fontSize: 13 }}>{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <section style={{ padding: '80px 48px', maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 60 }}>
          <h2 style={{ fontSize: 36, fontWeight: 800, color: '#e2e8f0', marginBottom: 12 }}>Everything you need to run a reliable EV fleet</h2>
          <p style={{ color: '#64748b', fontSize: 16 }}>Built specifically for fleet operators, depot managers and charging network providers</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
          {features.map((f, i) => (
            <div key={i} className="card" style={{ padding: 28 }}>
              <div style={{ fontSize: 32, marginBottom: 16 }}>{f.icon}</div>
              <h3 style={{ fontSize: 17, fontWeight: 700, color: '#e2e8f0', marginBottom: 10 }}>{f.title}</h3>
              <p style={{ color: '#64748b', fontSize: 14, lineHeight: 1.6 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section style={{ padding: '80px 48px', maxWidth: 900, margin: '0 auto', textAlign: 'center' }}>
        <h2 style={{ fontSize: 36, fontWeight: 800, color: '#e2e8f0', marginBottom: 12 }}>Up and running in 60 seconds</h2>
        <p style={{ color: '#64748b', fontSize: 16, marginBottom: 60 }}>No hardware required. No complex setup. Just point your charger at our server.</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 32 }}>
          {[
            { step: '1', title: 'Create your account', desc: 'Sign up free. No credit card required to get started.' },
            { step: '2', title: 'Register your charger', desc: 'Add your charger ID and point it to our OCPP endpoint.' },
            { step: '3', title: 'Monitor everything', desc: 'Your dashboard goes live instantly. Alerts start immediately.' },
          ].map((s, i) => (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
              <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'linear-gradient(135deg, #00d4ff, #a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 900, color: 'white' }}>{s.step}</div>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: '#e2e8f0' }}>{s.title}</h3>
              <p style={{ color: '#64748b', fontSize: 14, lineHeight: 1.6 }}>{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" style={{ padding: '80px 48px', maxWidth: 1000, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 60 }}>
          <h2 style={{ fontSize: 36, fontWeight: 800, color: '#e2e8f0', marginBottom: 12 }}>Simple, transparent pricing</h2>
          <p style={{ color: '#64748b', fontSize: 16 }}>Start free. Upgrade when you need more chargers.</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
          {plans.map(plan => (
            <div key={plan.name} className="card" style={{ padding: 32, position: 'relative', overflow: 'hidden', border: plan.popular ? '1px solid rgba(168,85,247,0.4)' : '1px solid rgba(255,255,255,0.08)', boxShadow: plan.popular ? '0 0 40px rgba(168,85,247,0.1)' : 'none' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg, transparent,' + plan.color + ',transparent)' }} />
              {plan.popular && <div style={{ position: 'absolute', top: 14, right: 14, background: 'rgba(168,85,247,0.2)', border: '1px solid rgba(168,85,247,0.4)', borderRadius: 6, padding: '3px 10px', fontSize: 10, fontWeight: 700, color: '#a855f7', letterSpacing: 1 }}>POPULAR</div>}
              <h3 style={{ fontSize: 20, fontWeight: 800, color: '#e2e8f0', marginBottom: 8 }}>{plan.name}</h3>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 2, marginBottom: 6 }}>
                <span style={{ fontSize: 44, fontWeight: 900, color: plan.color }}>{plan.price}</span>
                <span style={{ color: '#64748b', fontSize: 14 }}>/mo</span>
              </div>
              <p style={{ color: '#64748b', fontSize: 13, marginBottom: 24 }}>{plan.desc}</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 28 }}>
                {plan.features.map(f => (
                  <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ color: plan.color }}>✓</span>
                    <span style={{ color: '#94a3b8', fontSize: 13 }}>{f}</span>
                  </div>
                ))}
              </div>
              <a href={plan.link} style={{ display: 'block', textAlign: 'center', padding: 12, borderRadius: 10, fontWeight: 800, fontSize: 14, textDecoration: 'none', background: plan.popular ? 'linear-gradient(135deg, #a855f7, #00d4ff)' : 'rgba(255,255,255,0.05)', color: plan.popular ? 'white' : plan.color, border: '1px solid ' + plan.color + '40' }}>
                Get Started →
              </a>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: '80px 48px', textAlign: 'center', maxWidth: 700, margin: '0 auto' }}>
        <div className="card" style={{ padding: '60px 48px' }}>
          <h2 style={{ fontSize: 36, fontWeight: 800, color: '#e2e8f0', marginBottom: 16 }}>Ready to protect your fleet?</h2>
          <p style={{ color: '#64748b', fontSize: 16, marginBottom: 36 }}>Join fleet operators who trust ChargerPulse to keep their EV infrastructure running.</p>
          <a href="/login" style={{ background: 'linear-gradient(135deg, #00d4ff, #a855f7)', color: 'white', padding: '16px 40px', borderRadius: 12, textDecoration: 'none', fontSize: 16, fontWeight: 800, boxShadow: '0 0 30px rgba(0,212,255,0.3)', display: 'inline-block' }}>
            Start Monitoring Free →
          </a>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '32px 48px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: 'linear-gradient(135deg, #00d4ff, #a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>⚡</div>
          <span style={{ color: '#64748b', fontSize: 13 }}>ChargerPulse — EV Intelligence Platform</span>
        </div>
        <div style={{ display: 'flex', gap: 24 }}>
          <a href="/pricing" style={{ color: '#64748b', textDecoration: 'none', fontSize: 13 }}>Pricing</a>
          <a href="/login" style={{ color: '#64748b', textDecoration: 'none', fontSize: 13 }}>Login</a>
          <a href="/dashboard" style={{ color: '#64748b', textDecoration: 'none', fontSize: 13 }}>Dashboard</a>
        </div>
      </footer>

    </div>
  )
}
