export default function ContactPage() {
  return (
    <div className="space-bg" style={{ padding: '48px 32px' }}>
      <div style={{ maxWidth: 700, margin: '0 auto' }}>

        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <h1 style={{ fontSize: 36, fontWeight: 800, color: '#e2e8f0', marginBottom: 12 }}>
            Contact Us
          </h1>
          <p style={{ color: '#64748b', fontSize: 16 }}>
            We're here to help. Expect a reply within 24 hours.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 32 }}>
          {[
            { icon: '📧', title: 'Email Support', desc: 'For general questions and support', contact: 'support@chargerpulse.io', link: 'mailto:senzoradebe999@gmail.com' },
            { icon: '⚡', title: 'Technical Support', desc: 'For OCPP connection and setup help', contact: 'tech@chargerpulse.io', link: 'mailto:senzoradebe999@gmail.com' },
          ].map((item, i) => (
            <div key={i} className="card" style={{ padding: 28, textAlign: 'center' }}>
              <div style={{ fontSize: 36, marginBottom: 16 }}>{item.icon}</div>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: '#e2e8f0', marginBottom: 8 }}>{item.title}</h3>
              <p style={{ color: '#64748b', fontSize: 13, marginBottom: 16 }}>{item.desc}</p>
              <a href={item.link} style={{ color: '#00d4ff', fontSize: 13, textDecoration: 'none', fontWeight: 600 }}>{item.contact}</a>
            </div>
          ))}
        </div>

        <div className="card" style={{ padding: 32, marginBottom: 24 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: '#e2e8f0', marginBottom: 24 }}>Send us a message</h2>

          <form action={`mailto:senzoradebe999@gmail.com`} method="get">
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', color: '#94a3b8', fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 }}>Your Name</label>
              <input name="name" type="text" placeholder="John Smith" style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '12px 16px', color: '#e2e8f0', fontSize: 14, outline: 'none', boxSizing: 'border-box' as const }} />
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', color: '#94a3b8', fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 }}>Email Address</label>
              <input name="email" type="email" placeholder="you@company.com" style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '12px 16px', color: '#e2e8f0', fontSize: 14, outline: 'none', boxSizing: 'border-box' as const }} />
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', color: '#94a3b8', fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 }}>Subject</label>
              <input name="subject" type="text" placeholder="How can we help?" style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '12px 16px', color: '#e2e8f0', fontSize: 14, outline: 'none', boxSizing: 'border-box' as const }} />
            </div>

            <div style={{ marginBottom: 28 }}>
              <label style={{ display: 'block', color: '#94a3b8', fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 }}>Message</label>
              <textarea name="body" placeholder="Tell us what you need help with..." rows={5} style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '12px 16px', color: '#e2e8f0', fontSize: 14, outline: 'none', resize: 'vertical', boxSizing: 'border-box' as const }} />
            </div>

            <button type="submit" style={{ width: '100%', padding: 14, borderRadius: 10, fontSize: 15, fontWeight: 800, cursor: 'pointer', border: 'none', background: 'linear-gradient(135deg, #00d4ff, #a855f7)', color: 'white', boxShadow: '0 0 20px rgba(0,212,255,0.3)' }}>
              Send Message
            </button>
          </form>
        </div>

        <div className="card" style={{ padding: 28 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: '#e2e8f0', marginBottom: 20 }}>Frequently Asked Questions</h2>
          {[
            { q: 'What EV chargers does ChargerPulse support?', a: 'ChargerPulse works with any EV charger that supports OCPP 1.6 — regardless of brand or manufacturer.' },
            { q: 'How do I connect my charger?', a: 'Log into your dashboard, click + ADD to register your charger, then point your charger\'s OCPP Central System URL to wss://chargerpulse-1.onrender.com/YOUR_CHARGER_ID.' },
            { q: 'How quickly will I get alerted when a charger goes offline?', a: 'Alerts are sent within 60 seconds of detecting a charger fault or disconnection.' },
            { q: 'Can I cancel my subscription anytime?', a: 'Yes — you can cancel anytime from your Lemon Squeezy customer portal. No questions asked.' },
            { q: 'Is my data secure?', a: 'Yes — all data is encrypted in transit and stored securely in our Supabase database with row-level security enabled.' },
          ].map((item, i) => (
            <div key={i} style={{ marginBottom: 20, paddingBottom: 20, borderBottom: i < 4 ? '1px solid rgba(255,255,255,0.06)' : 'none' }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: '#00d4ff', marginBottom: 8 }}>{item.q}</h3>
              <p style={{ color: '#94a3b8', fontSize: 13, lineHeight: 1.7 }}>{item.a}</p>
            </div>
          ))}
        </div>

        <div style={{ textAlign: 'center', marginTop: 32 }}>
          <a href="/" style={{ color: '#00d4ff', fontSize: 13, textDecoration: 'none' }}>Back to Home</a>
          <span style={{ color: '#334155', margin: '0 16px' }}>|</span>
          <a href="/dashboard" style={{ color: '#00d4ff', fontSize: 13, textDecoration: 'none' }}>Dashboard</a>
        </div>

      </div>
    </div>
  )
}