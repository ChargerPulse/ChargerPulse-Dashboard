export default function PrivacyPage() {
  return (
    <div className="space-bg" style={{ padding: '48px 32px' }}>
      <div style={{ maxWidth: 800, margin: '0 auto' }}>

        <div style={{ marginBottom: 40 }}>
          <h1 style={{ fontSize: 36, fontWeight: 800, color: '#e2e8f0', marginBottom: 8 }}>Privacy Policy</h1>
          <p style={{ color: '#64748b' }}>Last updated: May 16, 2026</p>
        </div>

        {[
          {
            title: '1. Introduction',
            content: 'ChargerPulse ("we", "our", "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, and safeguard your information when you use our EV charger monitoring platform.'
          },
          {
            title: '2. Information We Collect',
            content: 'We collect the following information: Account information (email address, password hash), Charger data (charger ID, nickname, location, connection status), Event data (status notifications sent by your charging hardware via OCPP), Alert data (downtime events and resolutions), Payment information (processed by Lemon Squeezy — we never store card details), and Usage data (pages visited, features used).'
          },
          {
            title: '3. How We Use Your Information',
            content: 'We use your information to: provide and maintain the ChargerPulse Service, send real-time alert notifications to your registered email, calculate uptime analytics for your chargers, process subscription payments, improve our Service, and communicate important updates.'
          },
          {
            title: '4. Data Storage and Security',
            content: 'Your data is stored in Supabase (PostgreSQL) hosted on AWS in the EU West region. We implement industry-standard security measures including encrypted connections (SSL/TLS), row-level security on all database tables, and secure API authentication. We retain your data for as long as your account is active.'
          },
          {
            title: '5. Third-Party Services',
            content: 'We use the following third-party services: Supabase (database and authentication), Render.com (hosting), Lemon Squeezy (payment processing), SendGrid (email notifications). Each of these services has their own privacy policy and data handling practices.'
          },
          {
            title: '6. Email Communications',
            content: 'We send transactional emails including: alert notifications when your chargers go offline, recovery notifications when chargers come back online, and account-related communications. You can contact us to opt out of non-essential communications.'
          },
          {
            title: '7. Your Rights',
            content: 'You have the right to: access the personal data we hold about you, request correction of inaccurate data, request deletion of your data, export your charger and event data (CSV export feature), and withdraw consent at any time. To exercise these rights, contact support@chargerpulse.io.'
          },
          {
            title: '8. Cookies',
            content: 'ChargerPulse uses essential cookies for authentication and session management. We do not use tracking cookies or serve advertisements. We do not sell your data to third parties.'
          },
          {
            title: '9. POPIA Compliance',
            content: 'ChargerPulse complies with the Protection of Personal Information Act (POPIA) of South Africa. We process personal information lawfully, fairly, and transparently. Your information is collected for specific, explicit, and legitimate purposes.'
          },
          {
            title: '10. GDPR Compliance',
            content: 'For users in the European Union, we comply with the General Data Protection Regulation (GDPR). Our legal basis for processing your data is the performance of a contract (providing the Service you subscribed to). Data is stored in EU West region.'
          },
          {
            title: '11. Children\'s Privacy',
            content: 'ChargerPulse is not directed at children under 18 years of age. We do not knowingly collect personal information from children.'
          },
          {
            title: '12. Changes to This Policy',
            content: 'We may update this Privacy Policy from time to time. We will notify you of significant changes via email. Continued use of the Service after changes constitutes acceptance of the new policy.'
          },
          {
            title: '13. Contact Us',
            content: 'For privacy-related questions or to exercise your rights, contact us at: support@chargerpulse.io | ChargerPulse (Pty) Ltd | Johannesburg, South Africa'
          },
        ].map((section, i) => (
          <div key={i} className="card" style={{ padding: 28, marginBottom: 16 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: '#a855f7', marginBottom: 12 }}>{section.title}</h2>
            <p style={{ color: '#94a3b8', lineHeight: 1.8, fontSize: 14 }}>{section.content}</p>
          </div>
        ))}

        <div style={{ textAlign: 'center', marginTop: 32 }}>
          <a href="/" style={{ color: '#00d4ff', fontSize: 13, textDecoration: 'none' }}>Back to Dashboard</a>
          <span style={{ color: '#334155', margin: '0 16px' }}>|</span>
          <a href="/terms" style={{ color: '#00d4ff', fontSize: 13, textDecoration: 'none' }}>Terms of Service</a>
        </div>

      </div>
    </div>
  )
}