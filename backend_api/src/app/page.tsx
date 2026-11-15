import { getRecentPayouts } from '@/lib/db/ledger';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const recentPayouts = await getRecentPayouts(10);
  const environment = process.env.DARAJA_ENVIRONMENT || 'sandbox';
  const shortcode = process.env.DARAJA_SHORTCODE || '600999';

  return (
    <main className="container">
      <header className="header">
        <h1>KALRO Sericulture B2C Backend API</h1>
        <p>
          Secure Cloud Counterpart for Offline M-PESA B2C Payouts • Safaricom Daraja 2.0 Integration
        </p>
      </header>

      <section className="card">
        <h2 className="card-title">System Status & Configuration</h2>
        <table className="table">
          <tbody>
            <tr>
              <td>Runtime Architecture</td>
              <td>Next.js 15 App Router (Vercel Serverless)</td>
            </tr>
            <tr>
              <td>Daraja Environment</td>
              <td>
                <span className="badge">{environment}</span>
              </td>
            </tr>
            <tr>
              <td>B2C Shortcode (PartyA)</td>
              <td>
                <span className="badge">{shortcode}</span>
              </td>
            </tr>
            <tr>
              <td>Reference Protocol</td>
              <td>
                <code>KALRO-B2C-YYYYMMDD-XXXX</code>
              </td>
            </tr>
            <tr>
              <td>Ledger Persistence</td>
              <td>MongoDB Atlas (Collection: <code>b2c_payouts</code>)</td>
            </tr>
          </tbody>
        </table>
      </section>

      <section className="card">
        <h2 className="card-title">API Endpoints</h2>
        <div style={{ marginBottom: '1rem' }}>
          <div>
            <span className="badge" style={{ fontWeight: 700, marginRight: '0.5rem' }}>
              POST
            </span>
            <code>/api/payout/disburse</code>
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-subtle)', marginTop: '0.25rem' }}>
            Accepts queued offline transactions from the Flutter mobile app, generates cryptographic references, and executes Daraja B2C payment requests.
          </p>
        </div>

        <div>
          <div>
            <span className="badge" style={{ fontWeight: 700, marginRight: '0.5rem' }}>
              POST
            </span>
            <code>/api/payout/callback</code>
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-subtle)', marginTop: '0.25rem' }}>
            Safaricom Daraja B2C Webhook Callback endpoint. Verifies M-PESA transaction receipts and updates the MongoDB Atlas ledger.
          </p>
        </div>
      </section>

      <section className="card">
        <h2 className="card-title">Recent Disbursements ({recentPayouts.length})</h2>
        {recentPayouts.length === 0 ? (
          <p style={{ fontSize: '0.85rem', color: 'var(--text-subtle)' }}>
            No disbursements recorded in the ledger yet. Ready to accept incoming transactions from Flutter.
          </p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Reference</th>
                <th>Farmer</th>
                <th>Phone</th>
                <th>Amount (KES)</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {recentPayouts.map((p) => (
                <tr key={p.reference}>
                  <td>
                    <code>{p.reference}</code>
                  </td>
                  <td>{p.farmerName}</td>
                  <td>{p.phoneNumber}</td>
                  <td>KES {p.amountKes.toLocaleString()}</td>
                  <td>
                    <span className="badge">{p.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </main>
  );
}
