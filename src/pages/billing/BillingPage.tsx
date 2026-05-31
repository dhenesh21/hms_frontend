import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { billingService } from '../../services/api'
import { IndianRupee, Plus, FileText, TrendingUp, Clock, CheckCircle, Search } from 'lucide-react'
import toast from 'react-hot-toast'
import { format } from 'date-fns'

const STATUS_CONFIG: Record<string, { label: string; cls: string }> = {
  draft:     { label: 'Draft',     cls: 'badge-gray' },
  pending:   { label: 'Pending',   cls: 'badge-amber' },
  partial:   { label: 'Partial',   cls: 'badge-blue' },
  paid:      { label: 'Paid',      cls: 'badge-green' },
  cancelled: { label: 'Cancelled', cls: 'badge-red' },
  refunded:  { label: 'Refunded',  cls: 'badge-purple' },
}

export default function BillingPage() {
  const qc = useQueryClient()
  const [activeTab, setActiveTab] = useState<'dashboard' | 'bills' | 'new-bill'>('dashboard')
  const [search, setSearch] = useState('')
  const { register, handleSubmit, reset } = useForm()
  const payForm = useForm()

  const { data: stats } = useQuery({ queryKey: ['billing-stats'], queryFn: () => billingService.getDashboard().then(r => r.data) })
  const { data: bills } = useQuery({ queryKey: ['bills'], queryFn: () => billingService.listBills().then(r => r.data) })

  const createBill = useMutation({
    mutationFn: (d: any) => billingService.createBill(d),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['bills'] })
      toast.success(`Bill created: ${res.data.bill_number}`)
      reset(); setActiveTab('bills')
    }
  })

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Billing & Accounts</h1>
          <p className="page-subtitle">OPD · IPD · Collections · Reports</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn-secondary" onClick={() => setActiveTab('bills')}>
            <FileText size={15} /> Bills
          </button>
          <button className="btn-primary" onClick={() => setActiveTab('new-bill')}>
            <Plus size={15} /> New Bill
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs" style={{ marginBottom: 24 }}>
        {(['dashboard', 'bills', 'new-bill'] as const).map(t => (
          <button key={t} className={`tab ${activeTab === t ? 'active' : ''}`} onClick={() => setActiveTab(t)}>
            {t === 'dashboard' ? 'Overview' : t === 'bills' ? 'All Bills' : 'New Bill'}
          </button>
        ))}
      </div>

      {activeTab === 'dashboard' && (
        <div>
          {/* Stats */}
          <div className="grid-4" style={{ marginBottom: 24 }}>
            {[
              { label: "Today's Bills", value: stats?.today_bills ?? 0, icon: FileText, cls: 'stat-icon-blue', },
              { label: "Today's Collection", value: `₹${(stats?.today_collection || 0).toLocaleString()}`, icon: IndianRupee, cls: 'stat-icon-green' },
              { label: 'Outstanding', value: `₹${(stats?.pending_amount || 0).toLocaleString()}`, icon: Clock, cls: 'stat-icon-orange' },
              { label: 'Total Revenue', value: `₹${(stats?.total_revenue || 0).toLocaleString()}`, icon: TrendingUp, cls: 'stat-icon-purple' },
            ].map(({ label, value, icon: Icon, cls }) => (
              <div key={label} className="stat-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <p style={{ fontSize: 12, color: '#8B5CF6', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</p>
                  <div className={`stat-icon ${cls}`}><Icon size={18} /></div>
                </div>
                <p style={{ fontSize: 24, fontWeight: 800, color: '#1E1B4B' }}>{value}</p>
              </div>
            ))}
          </div>

          {/* Recent Bills */}
          <div className="table-wrapper">
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #F3F0FF' }}>
              <p className="section-title">Recent Bills</p>
            </div>
            <table>
              <thead><tr>
                <th>Bill #</th><th>Patient</th><th>Date</th>
                <th>Amount</th><th>Status</th>
              </tr></thead>
              <tbody>
                {bills?.slice(0, 8).map((b: any) => (
                  <tr key={b.id}>
                    <td><span style={{ fontFamily: 'monospace', color: '#7C3AED', fontWeight: 600, fontSize: 13 }}>{b.bill_number}</span></td>
                    <td style={{ fontWeight: 600, color: '#1E1B4B', fontSize: 13 }}>{b.patient_name || '—'}</td>
                    <td style={{ color: '#6B7280', fontSize: 13 }}>{b.bill_date ? format(new Date(b.bill_date), 'dd MMM yyyy') : '—'}</td>
                    <td style={{ fontWeight: 700, color: '#4C1D95', fontSize: 13 }}>₹{b.total_amount?.toLocaleString()}</td>
                    <td><span className={`badge ${STATUS_CONFIG[b.status]?.cls || 'badge-gray'}`}>{STATUS_CONFIG[b.status]?.label || b.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'bills' && (
        <div>
          <div style={{ position: 'relative', marginBottom: 16 }}>
            <Search size={15} color="#A78BFA" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} />
            <input placeholder="Search bills by patient, bill number..."
              value={search} onChange={e => setSearch(e.target.value)}
              className="input" style={{ paddingLeft: 40 }} />
          </div>
          <div className="table-wrapper">
            <table>
              <thead><tr>
                <th>Bill #</th><th>Patient</th><th>Type</th><th>Date</th>
                <th>Total</th><th>Paid</th><th>Balance</th><th>Status</th>
              </tr></thead>
              <tbody>
                {bills?.filter((b: any) =>
                  !search || b.patient_name?.toLowerCase().includes(search.toLowerCase())
                    || b.bill_number?.includes(search)
                ).map((b: any) => (
                  <tr key={b.id}>
                    <td><span style={{ fontFamily: 'monospace', color: '#7C3AED', fontWeight: 600, fontSize: 12 }}>{b.bill_number}</span></td>
                    <td style={{ fontWeight: 600, color: '#1E1B4B', fontSize: 13 }}>{b.patient_name}</td>
                    <td><span className={`badge ${b.visit_type === 'opd' ? 'badge-blue' : 'badge-purple'}`} style={{ textTransform: 'uppercase', fontSize: 10 }}>{b.visit_type || 'OPD'}</span></td>
                    <td style={{ color: '#6B7280', fontSize: 12 }}>{b.bill_date ? format(new Date(b.bill_date), 'dd MMM yy') : '—'}</td>
                    <td style={{ fontWeight: 700, color: '#1E1B4B', fontSize: 13 }}>₹{b.total_amount?.toLocaleString()}</td>
                    <td style={{ color: '#16A34A', fontWeight: 600, fontSize: 13 }}>₹{b.paid_amount?.toLocaleString()}</td>
                    <td style={{ color: (b.total_amount - b.paid_amount) > 0 ? '#DC2626' : '#16A34A', fontWeight: 600, fontSize: 13 }}>
                      ₹{(b.total_amount - b.paid_amount)?.toLocaleString()}
                    </td>
                    <td><span className={`badge ${STATUS_CONFIG[b.status]?.cls || 'badge-gray'}`}>{STATUS_CONFIG[b.status]?.label}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'new-bill' && (
        <div className="card" style={{ maxWidth: 600 }}>
          <p className="section-title" style={{ marginBottom: 20 }}>Create New Bill</p>
          <form onSubmit={handleSubmit(d => createBill.mutate(d))}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#4C1D95', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 6 }}>Patient ID</label>
                <input {...register('patient_id')} className="input" placeholder="Enter patient ID" />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#4C1D95', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 6 }}>Visit Type</label>
                <select {...register('visit_type')} className="select" style={{ width: '100%' }}>
                  <option value="opd">OPD</option>
                  <option value="ipd">IPD</option>
                  <option value="emergency">Emergency</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#4C1D95', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 6 }}>Notes</label>
                <textarea {...register('notes')} className="input" rows={3} placeholder="Additional notes..." style={{ resize: 'vertical' }} />
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                <button type="submit" className="btn-primary" disabled={createBill.isPending}>
                  {createBill.isPending ? 'Creating...' : 'Create Bill'}
                </button>
                <button type="button" className="btn-secondary" onClick={() => setActiveTab('bills')}>Cancel</button>
              </div>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
