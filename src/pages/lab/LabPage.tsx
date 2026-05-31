import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { labService } from '../../services/api'
import { FlaskConical, CheckCircle, Clock, Plus, AlertCircle, Search } from 'lucide-react'
import toast from 'react-hot-toast'
import { format } from 'date-fns'

const STATUS_CONFIG: Record<string, { label: string; cls: string }> = {
  ordered:          { label: 'Ordered',          cls: 'badge-gray' },
  sample_collected: { label: 'Sample Collected', cls: 'badge-blue' },
  sample_received:  { label: 'Sample Received',  cls: 'badge-indigo' },
  processing:       { label: 'Processing',        cls: 'badge-amber' },
  result_entered:   { label: 'Result Entered',   cls: 'badge-purple' },
  approved:         { label: 'Approved',          cls: 'badge-teal' },
  reported:         { label: 'Reported',          cls: 'badge-green' },
  rejected:         { label: 'Rejected',          cls: 'badge-red' },
}

const RESULT_COLORS: Record<string, string> = {
  normal: '#16A34A', high: '#DC2626', low: '#2563EB', critical: '#DC2626'
}

export default function LabPage() {
  const qc = useQueryClient()
  const [activeTab, setActiveTab] = useState<'worklist' | 'orders' | 'results'>('worklist')
  const [selectedItems, setSelectedItems] = useState<number[]>([])
  const [search, setSearch] = useState('')

  const { data: stats } = useQuery({ queryKey: ['lab-stats'], queryFn: () => labService.getDashboard().then(r => r.data) })
  const { data: pending } = useQuery({ queryKey: ['lab-pending'], queryFn: () => labService.getPending().then(r => r.data) })
  const { data: orders } = useQuery({ queryKey: ['lab-orders'], queryFn: () => labService.listOrders().then(r => r.data) })

  const collectMutation = useMutation({
    mutationFn: () => labService.collectSamples({ order_item_ids: selectedItems }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['lab-pending'] }); setSelectedItems([]); toast.success('Samples marked as collected') }
  })

  const toggleItem = (id: number) => {
    setSelectedItems(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Laboratory</h1>
          <p className="page-subtitle">Test orders, samples & results</p>
        </div>
        <Link to="/lab/new" className="btn-primary"><Plus size={15} /> New Lab Order</Link>
      </div>

      {/* Stats */}
      <div className="grid-4" style={{ marginBottom: 24 }}>
        {[
          { label: 'Pending Samples', value: stats?.pending_samples ?? 0, icon: Clock, cls: 'stat-icon-amber' },
          { label: 'Processing', value: stats?.processing ?? 0, icon: FlaskConical, cls: 'stat-icon-blue' },
          { label: 'Completed Today', value: stats?.completed_today ?? 0, icon: CheckCircle, cls: 'stat-icon-green' },
          { label: 'Critical Results', value: stats?.critical_results ?? 0, icon: AlertCircle, cls: 'stat-icon-red' },
        ].map(({ label, value, icon: Icon, cls }) => (
          <div key={label} className="stat-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
              <p style={{ fontSize: 12, color: '#8B5CF6', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</p>
              <div className={`stat-icon ${cls}`}><Icon size={18} /></div>
            </div>
            <p style={{ fontSize: 28, fontWeight: 800, color: '#1E1B4B' }}>{value}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="tabs" style={{ marginBottom: 20 }}>
        {(['worklist', 'orders', 'results'] as const).map(t => (
          <button key={t} className={`tab ${activeTab === t ? 'active' : ''}`} onClick={() => setActiveTab(t)}>
            {t === 'worklist' ? 'Worklist' : t === 'orders' ? 'All Orders' : 'Results'}
          </button>
        ))}
      </div>

      {activeTab === 'worklist' && (
        <div>
          {selectedItems.length > 0 && (
            <div style={{
              background: '#EDE9FE', borderRadius: 12, padding: '12px 16px',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              marginBottom: 16
            }}>
              <span style={{ fontSize: 13, color: '#4C1D95', fontWeight: 600 }}>
                {selectedItems.length} item(s) selected
              </span>
              <button className="btn-primary" style={{ padding: '7px 14px' }}
                onClick={() => collectMutation.mutate()}>
                Mark as Collected
              </button>
            </div>
          )}
          <div className="table-wrapper">
            <table>
              <thead><tr>
                <th style={{ width: 40 }}></th><th>Patient</th><th>Test</th>
                <th>Doctor</th><th>Priority</th><th>Status</th><th>Ordered</th>
              </tr></thead>
              <tbody>
                {(pending || []).map((item: any) => (
                  <tr key={item.id}>
                    <td>
                      <input type="checkbox" checked={selectedItems.includes(item.id)}
                        onChange={() => toggleItem(item.id)}
                        style={{ width: 16, height: 16, accentColor: '#7C3AED', cursor: 'pointer' }}
                      />
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div className="avatar avatar-sm avatar-teal">{item.patient_name?.[0] || 'P'}</div>
                        <div>
                          <p style={{ fontWeight: 600, color: '#1E1B4B', fontSize: 13 }}>{item.patient_name}</p>
                          <p style={{ fontSize: 11, color: '#A78BFA', fontFamily: 'monospace' }}>{item.patient_uhid}</p>
                        </div>
                      </div>
                    </td>
                    <td style={{ fontWeight: 600, color: '#4C1D95', fontSize: 13 }}>{item.test_name}</td>
                    <td style={{ color: '#374151', fontSize: 13 }}>{item.doctor_name || '—'}</td>
                    <td>
                      <span className={`badge ${item.is_urgent ? 'badge-red' : 'badge-gray'}`}>
                        {item.is_urgent ? 'Urgent' : 'Routine'}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${STATUS_CONFIG[item.status]?.cls || 'badge-gray'}`}>
                        {STATUS_CONFIG[item.status]?.label || item.status}
                      </span>
                    </td>
                    <td style={{ color: '#6B7280', fontSize: 12 }}>
                      {item.created_at ? format(new Date(item.created_at), 'dd MMM HH:mm') : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'orders' && (
        <div>
          <div style={{ position: 'relative', marginBottom: 16 }}>
            <Search size={15} color="#A78BFA" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} />
            <input placeholder="Search by patient, test name..." value={search}
              onChange={e => setSearch(e.target.value)}
              className="input" style={{ paddingLeft: 40 }} />
          </div>
          <div className="table-wrapper">
            <table>
              <thead><tr>
                <th>Order ID</th><th>Patient</th><th>Tests</th>
                <th>Status</th><th>Date</th>
              </tr></thead>
              <tbody>
                {(orders || []).filter((o: any) =>
                  !search || o.patient_name?.toLowerCase().includes(search.toLowerCase())
                ).map((o: any) => (
                  <tr key={o.id}>
                    <td><span style={{ fontFamily: 'monospace', color: '#7C3AED', fontWeight: 600, fontSize: 12 }}>LAB-{o.id}</span></td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div className="avatar avatar-sm avatar-purple">{o.patient_name?.[0] || 'P'}</div>
                        <span style={{ fontWeight: 600, color: '#1E1B4B', fontSize: 13 }}>{o.patient_name}</span>
                      </div>
                    </td>
                    <td style={{ color: '#374151', fontSize: 13 }}>{o.items?.length || 0} test(s)</td>
                    <td><span className={`badge ${STATUS_CONFIG[o.status]?.cls || 'badge-gray'}`}>{STATUS_CONFIG[o.status]?.label || o.status}</span></td>
                    <td style={{ color: '#6B7280', fontSize: 12 }}>{o.created_at ? format(new Date(o.created_at), 'dd MMM yy') : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'results' && (
        <div className="table-wrapper">
          <table>
            <thead><tr>
              <th>Patient</th><th>Test</th><th>Result</th>
              <th>Reference Range</th><th>Status</th><th>Reported</th>
            </tr></thead>
            <tbody>
              {(orders || []).flatMap((o: any) =>
                (o.items || []).filter((i: any) => i.status === 'reported').map((item: any) => (
                  <tr key={item.id}>
                    <td style={{ fontWeight: 600, color: '#1E1B4B', fontSize: 13 }}>{o.patient_name}</td>
                    <td style={{ color: '#4C1D95', fontWeight: 600, fontSize: 13 }}>{item.test_name}</td>
                    <td>
                      <span style={{ fontWeight: 700, color: RESULT_COLORS[item.result_status] || '#374151', fontSize: 13 }}>
                        {item.result_value} {item.unit}
                      </span>
                    </td>
                    <td style={{ color: '#6B7280', fontSize: 12 }}>{item.reference_range || '—'}</td>
                    <td>
                      <span className={`badge ${item.result_status === 'normal' ? 'badge-green' : item.result_status === 'critical' ? 'badge-red' : 'badge-amber'}`}>
                        {item.result_status}
                      </span>
                    </td>
                    <td style={{ color: '#6B7280', fontSize: 12 }}>
                      {item.reported_at ? format(new Date(item.reported_at), 'dd MMM HH:mm') : '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
