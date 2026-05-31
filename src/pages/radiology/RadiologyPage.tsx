import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { radiologyService } from '../../services/api'
import { ScanLine, Plus, Search, Clock, CheckCircle, Upload } from 'lucide-react'
import toast from 'react-hot-toast'
import { format } from 'date-fns'

const STATUS_CONFIG: Record<string, { label: string; cls: string }> = {
  ordered:         { label: 'Ordered',          cls: 'badge-gray' },
  scheduled:       { label: 'Scheduled',         cls: 'badge-blue' },
  in_progress:     { label: 'In Progress',       cls: 'badge-amber' },
  images_uploaded: { label: 'Images Uploaded',   cls: 'badge-indigo' },
  reported:        { label: 'Reported',           cls: 'badge-green' },
  approved:        { label: 'Approved',           cls: 'badge-teal' },
}

export default function RadiologyPage() {
  const qc = useQueryClient()
  const [activeTab, setActiveTab] = useState<'worklist' | 'orders'>('worklist')
  const [search, setSearch] = useState('')

  const { data: stats } = useQuery({ queryKey: ['radiology-stats'], queryFn: () => radiologyService.getDashboard().then(r => r.data) })
  const { data: orders } = useQuery({ queryKey: ['radiology-orders'], queryFn: () => radiologyService.listOrders().then(r => r.data) })

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Radiology</h1>
          <p className="page-subtitle">X-Ray, MRI, CT Scan & Ultrasound orders</p>
        </div>
        <button className="btn-primary"><Plus size={15} /> New Radiology Order</button>
      </div>

      <div className="grid-4" style={{ marginBottom: 24 }}>
        {[
          { label: 'Pending', value: stats?.pending ?? 0, cls: 'stat-icon-amber' },
          { label: 'In Progress', value: stats?.in_progress ?? 0, cls: 'stat-icon-blue' },
          { label: 'Reported Today', value: stats?.reported_today ?? 0, cls: 'stat-icon-green' },
          { label: 'Total Orders', value: stats?.total_orders ?? 0, cls: 'stat-icon-purple' },
        ].map(({ label, value, cls }) => (
          <div key={label} className="stat-card">
            <p style={{ fontSize: 12, color: '#8B5CF6', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>{label}</p>
            <p style={{ fontSize: 28, fontWeight: 800, color: '#1E1B4B' }}>{value}</p>
          </div>
        ))}
      </div>

      <div className="tabs" style={{ marginBottom: 20 }}>
        {(['worklist', 'orders'] as const).map(t => (
          <button key={t} className={`tab ${activeTab === t ? 'active' : ''}`} onClick={() => setActiveTab(t)}>
            {t === 'worklist' ? 'Worklist' : 'All Orders'}
          </button>
        ))}
      </div>

      <div style={{ position: 'relative', marginBottom: 16 }}>
        <Search size={15} color="#A78BFA" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} />
        <input placeholder="Search patient name, test type..." value={search}
          onChange={e => setSearch(e.target.value)}
          className="input" style={{ paddingLeft: 40 }} />
      </div>

      <div className="table-wrapper">
        <table>
          <thead><tr>
            <th>Order ID</th><th>Patient</th><th>Test Type</th>
            <th>Doctor</th><th>Priority</th><th>Status</th><th>Date</th><th>Action</th>
          </tr></thead>
          <tbody>
            {(orders || []).filter((o: any) =>
              !search || o.patient_name?.toLowerCase().includes(search.toLowerCase())
                || o.study_type?.toLowerCase().includes(search.toLowerCase())
            ).map((o: any) => (
              <tr key={o.id}>
                <td><span style={{ fontFamily: 'monospace', color: '#7C3AED', fontWeight: 600, fontSize: 12 }}>RAD-{o.id}</span></td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div className="avatar avatar-sm avatar-blue">{o.patient_name?.[0] || 'P'}</div>
                    <div>
                      <p style={{ fontWeight: 600, color: '#1E1B4B', fontSize: 13 }}>{o.patient_name}</p>
                      <p style={{ fontSize: 11, color: '#A78BFA', fontFamily: 'monospace' }}>{o.patient_uhid}</p>
                    </div>
                  </div>
                </td>
                <td>
                  <div>
                    <p style={{ fontWeight: 600, color: '#4C1D95', fontSize: 13 }}>{o.study_type}</p>
                    {o.body_part && <p style={{ fontSize: 11, color: '#A78BFA' }}>{o.body_part}</p>}
                  </div>
                </td>
                <td style={{ color: '#374151', fontSize: 13 }}>{o.doctor_name || '—'}</td>
                <td>
                  <span className={`badge ${o.is_urgent ? 'badge-red' : 'badge-gray'}`}>
                    {o.is_urgent ? 'Urgent' : 'Routine'}
                  </span>
                </td>
                <td>
                  <span className={`badge ${STATUS_CONFIG[o.status]?.cls || 'badge-gray'}`}>
                    {STATUS_CONFIG[o.status]?.label || o.status}
                  </span>
                </td>
                <td style={{ color: '#6B7280', fontSize: 12 }}>
                  {o.created_at ? format(new Date(o.created_at), 'dd MMM yy') : '—'}
                </td>
                <td>
                  {o.status === 'images_uploaded' && (
                    <button className="btn-primary" style={{ padding: '5px 12px', fontSize: 12 }}>
                      Write Report
                    </button>
                  )}
                  {(o.status === 'ordered' || o.status === 'scheduled') && (
                    <button className="btn-secondary" style={{ padding: '5px 12px', fontSize: 12 }}>
                      <Upload size={12} /> Upload
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
