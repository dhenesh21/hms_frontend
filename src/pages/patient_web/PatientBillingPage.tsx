import { useQuery } from '@tanstack/react-query'
import { patientDataService } from '../../services/patientApi'

export default function PatientBillingPage() {
  const { data: bills } = useQuery({ queryKey: ['pw-bills'], queryFn: () => patientDataService.bills().then(r => r.data) })

  const totalBilled = bills?.reduce((s: number, b: any) => s + (b.gross_total || 0), 0) ?? 0
  const totalPaid = bills?.reduce((s: number, b: any) => s + (b.paid_amount || 0), 0) ?? 0

  const statusColor = (s: string) => s === 'paid' ? '#059669' : s === 'partial' ? '#F59E0B' : '#DC2626'

  return (
    <div>
      <h1 className="page-title" style={{ marginBottom: 16 }}>My Bills</h1>

      {bills && bills.length > 0 && (
        <div style={{ background: 'linear-gradient(135deg, #059669, #34D399)', borderRadius: 14, padding: 20, marginBottom: 20, display: 'flex', justifyContent: 'space-around', color: '#fff' }}>
          <div style={{ textAlign: 'center' }}><p style={{ fontSize: 18, fontWeight: 800, margin: 0 }}>₹{totalBilled.toFixed(0)}</p><p style={{ fontSize: 11, opacity: 0.85 }}>Total billed</p></div>
          <div style={{ textAlign: 'center' }}><p style={{ fontSize: 18, fontWeight: 800, margin: 0 }}>₹{totalPaid.toFixed(0)}</p><p style={{ fontSize: 11, opacity: 0.85 }}>Total paid</p></div>
          <div style={{ textAlign: 'center' }}><p style={{ fontSize: 18, fontWeight: 800, margin: 0 }}>₹{(totalBilled - totalPaid).toFixed(0)}</p><p style={{ fontSize: 11, opacity: 0.85 }}>Balance</p></div>
        </div>
      )}

      {bills?.length === 0 && <p style={{ color: '#9CA3AF' }}>No bills on record.</p>}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {bills?.map((b: any) => (
          <div key={b.id} className="card" style={{ padding: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontWeight: 700 }}>{b.bill_number}</span>
              <span style={{ padding: '2px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, color: statusColor(b.status), background: `${statusColor(b.status)}1A` }}>{b.status?.toUpperCase()}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
              <span style={{ color: '#6B7280' }}>{b.bill_type}</span>
              <span>Total: ₹{b.gross_total} · Paid: ₹{b.paid_amount}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
