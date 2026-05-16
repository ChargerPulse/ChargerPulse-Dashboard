'use client'

const plans = [
  {
    name: 'Pro', price: '$5', period: '/mo', desc: 'Monitor 1 charger', color: '#00d4ff',
    features: ['Monitor 1 charger', 'Real-time alerts', 'Basic analytics', 'Email support'],
    link: 'https://chargerpulse.lemonsqueezy.com/checkout/buy/44db6a87-af91-43ff-96db-613d1db2f061',
  },
  {
    name: 'Plus', price: '$15', period: '/mo', desc: 'Monitor 5 chargers', color: '#a855f7',
    features: ['Monitor up to 5 chargers', 'Real-time alerts', 'Advanced analytics', 'Priority support'],
    link: 'https://chargerpulse.lemonsqueezy.com/checkout/buy/b0df42fc-f1a6-4fc8-b7d3-ed43878790ec',
    popular: true,
  },
  {
    name: 'Enterprise', price: '$50', period: '/mo', desc: 'Unlimited chargers', color: '#00ff88',
    features: ['Unlimited chargers', 'Real-time alerts', 'Custom analytics', 'Dedicated support'],
    link: 'https://chargerpulse.lemonsqueezy.com/checkout/buy/1a1cc852-4a6c-4b99-9d14-caaeba115d17',
  },
]

export default function PricingPage() {
  return (
    <div className="space-bg" style={{ padding: '32px', minHeight: '100vh' }}>
      <div style={{ maxWidth: 1000, margin: '0 auto' }}>

        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <h1 style={{ fontSize: 32, fontWeight: 800, color: '#e2e8f0', marginBottom: 12 }}>
            ChargerPulse Pricing
          </h1>
          <p style={{ color: '#64748b', fontSize: 16 }}>Simple, transparent pricing for EV charger monitoring</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24, marginBottom: 32 }}>
          {plans.map(plan => (
            <div key={plan.name} className="card" style={{
              padding: 32, position: 'relative', overflow: 'hidden',
              border: plan.popular ? `1px solid ${plan.color}50` : '1px solid rgba(255,255,255,0.08)',
              boxShadow: plan.popular ? `0 0 40px ${plan.color}15` : 'none',
            }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, transparent, ${plan.color}, transparent)` }} />
              {plan.popular && (
                <div style={{ position: 'absolute', top: 14, right: 14, background: `${plan.color}20`, border: `1px solid ${plan.color}40`, borderRadius: 6, padding: '3px 10px', fontSize: 10, fontWeight: 700, color: plan.color, letterSpacing: 1 }}>POPULAR</div>
              )}

              <h2 style={{ fontSize: 20, fontWeight: 800, color: '#e2e8f0', marginBottom: 8 }}>{plan.name}</h2>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 2, marginBottom: 6 }}>
                <span style={{ fontSize: 44, fontWeight: 800, color: plan.color }}>{plan.price}</span>
                <span style={{ color: '#64748b', fontSize: 14 }}>{plan.period}</span>
              </div>
              <p style={{ color: '#64748b', fontSize: 13, marginBottom: 24 }}>{plan.desc}</p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 28 }}>
                {plan.features.map(f => (
                  <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ color: plan.color, fontWeight: 700 }}>+</span>
                    <span style={{ color: '#94a3b8', fontSize: 13 }}>{f}</span>
                  </div>
                ))}
              </div>

              <a href={plan.link} style={{
                display: 'block', textAlign: 'center', padding: 12, borderRadius: 10,
                fontWeight: 800, fontSize: 14, textDecoration: 'none',
                background: plan.popular ? `linear-gradient(135deg, ${plan.color}, #00d4ff)` : `${plan.color}18`,
                color: plan.popular ? 'white' : plan.color,
                border: `1px solid ${plan.color}40`,
              }}>Get Started</a>
            </div>
          ))}
        </div>

        <p style={{ textAlign: 'center', color: '#475569', fontSize: 13, marginBottom: 16 }}>
          All plans include 7-day free trial. Cancel anytime.
        </p>
        <div style={{ textAlign: 'center' }}>
          <a href="/" style={{ color: '#00d4ff', fontSize: 13, textDecoration: 'none' }}>Back to Dashboard</a>
        </div>

      </div>
    </div>
  )
}