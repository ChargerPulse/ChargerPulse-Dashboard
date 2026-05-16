export default function TermsPage() {
  return (
    <div className="space-bg" style={{ padding: '48px 32px' }}>
      <div style={{ maxWidth: 800, margin: '0 auto' }}>

        <div style={{ marginBottom: 40 }}>
          <h1 style={{ fontSize: 36, fontWeight: 800, color: '#e2e8f0', marginBottom: 8 }}>Terms of Service</h1>
          <p style={{ color: '#64748b' }}>Last updated: May 16, 2026</p>
        </div>

        {[
          {
            title: '1. Acceptance of Terms',
            content: 'By accessing or using ChargerPulse ("the Service"), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our Service. ChargerPulse is operated by ChargerPulse (Pty) Ltd, based in South Africa.'
          },
          {
            title: '2. Description of Service',
            content: 'ChargerPulse provides real-time monitoring, uptime analytics, and alert notifications for Electric Vehicle (EV) charging stations. The Service connects to your charging hardware via the OCPP 1.6 protocol and displays data through a web-based dashboard.'
          },
          {
            title: '3. Subscription and Payment',
            content: 'ChargerPulse offers paid subscription plans (Pro, Plus, Enterprise) billed monthly. Payments are processed securely through Lemon Squeezy. All prices are displayed in USD. You may cancel your subscription at any time. Refunds are handled on a case-by-case basis within 7 days of purchase.'
          },
          {
            title: '4. Free Trial',
            content: 'New subscribers receive a 7-day free trial. No charges will be made during the trial period. You may cancel before the trial ends without being charged.'
          },
          {
            title: '5. User Responsibilities',
            content: 'You are responsible for maintaining the security of your account credentials, ensuring your charging hardware is compatible with OCPP 1.6, providing accurate information when registering chargers, and complying with all applicable local laws and regulations regarding EV charging infrastructure.'
          },
          {
            title: '6. Service Availability',
            content: 'We strive for 99.9% uptime but do not guarantee uninterrupted access to the Service. Scheduled maintenance will be communicated in advance where possible. ChargerPulse is not liable for losses resulting from service interruptions.'
          },
          {
            title: '7. Data and Privacy',
            content: 'We collect and process data as described in our Privacy Policy. Charger status data transmitted to our servers is stored securely in our database. You retain ownership of your data and may request deletion at any time.'
          },
          {
            title: '8. Intellectual Property',
            content: 'All software, designs, and content within ChargerPulse are owned by ChargerPulse (Pty) Ltd. You may not copy, modify, or distribute our software without written permission.'
          },
          {
            title: '9. Limitation of Liability',
            content: 'ChargerPulse is provided "as is" without warranties of any kind. We are not liable for any indirect, incidental, or consequential damages arising from the use of our Service, including but not limited to lost revenue, data loss, or equipment damage.'
          },
          {
            title: '10. Termination',
            content: 'We reserve the right to suspend or terminate your account if you violate these Terms of Service. You may terminate your account at any time by contacting support@chargerpulse.io.'
          },
          {
            title: '11. Changes to Terms',
            content: 'We may update these Terms at any time. Continued use of the Service after changes constitutes acceptance of the new Terms. We will notify users of significant changes via email.'
          },
          {
            title: '12. Contact',
            content: 'For questions about these Terms, contact us at: support@chargerpulse.io'
          },
        ].map((section, i) => (
          <div key={i} className="card" style={{ padding: 28, marginBottom: 16 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: '#00d4ff', marginBottom: 12 }}>{section.title}</h2>
            <p style={{ color: '#94a3b8', lineHeight: 1.8, fontSize: 14 }}>{section.content}</p>
          </div>
        ))}

        <div style={{ textAlign: 'center', marginTop: 32 }}>
          <a href="/" style={{ color: '#00d4ff', fontSize: 13, textDecoration: 'none' }}>Back to Dashboard</a>
          <span style={{ color: '#334155', margin: '0 16px' }}>|</span>
          <a href="/privacy" style={{ color: '#00d4ff', fontSize: 13, textDecoration: 'none' }}>Privacy Policy</a>
        </div>

      </div>
    </div>
  )
}