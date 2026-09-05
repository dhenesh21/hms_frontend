import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { clinicalTimelineService, patientService } from '../../services/api'
import { History, AlertTriangle, BellRing } from 'lucide-react'
import toast from 'react-hot-toast'

const inputCls = "w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-violet-500 outline-none"

export default function ClinicalTimelinePage() {
  const qc = useQueryClient()
  const [patientId, setPatientId] = useState('')
  const { data: patients } = useQuery({ queryKey: ['patients-all'], queryFn: () => patientService.list({ limit: 200 }).then(r => r.data) })
  const { data: timeline } = useQuery({
    queryKey: ['clinical-timeline', patientId],
    queryFn: () => clinicalTimelineService.getPatientTimeline(parseInt(patientId)).then(r => r.data),
    enabled: !!patientId,
  })
  const { data: criticalResults } = useQuery({
    queryKey: ['critical-results'],
    queryFn: () => clinicalTimelineService.getCriticalResults().then(r => r.data),
    refetchInterval: 30000,
  })
  const notifyDoctor = useMutation({
    mutationFn: (id: number) => clinicalTimelineService.notifyDoctor(id),
    onSuccess: (res) => { qc.invalidateQueries({ queryKey: ['critical-results'] }); toast.success(`Notified ${res.data?.doctor || 'doctor'}`) },
    onError: (e: any) => toast.error(e.response?.data?.detail || 'Could not notify doctor'),
  })

  return (
    <div>
      <h1 className="page-title" style={{ marginBottom: 4 }}>Clinical Timeline</h1>
      <p style={{ color: '#8B5CF6', fontSize: 13, marginBottom: 20 }}>Diagnoses, orders, forms, consents & critical results — merged by time</p>

      {criticalResults?.length > 0 && (
        <div className="card" style={{ padding: 14, marginBottom: 20, border: '1px solid #FCA5A5', background: '#FEF2F2' }}>
          <h3 style={{ fontSize: 13, fontWeight: 700, color: '#DC2626', marginBottom: 8 }}>
            <AlertTriangle size={14} style={{ marginRight: 6, display: 'inline' }} />Open Critical Results ({criticalResults.length})
          </h3>
          {criticalResults.map((r: any) => (
            <div key={r.lab_order_item_id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, padding: '4px 0' }}>
              <span>Patient #{r.patient_id} — {r.test_name}: <b>{r.result_value}</b></span>
              <button onClick={() => notifyDoctor.mutate(r.lab_order_item_id)} style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#DC2626', fontSize: 11 }}>
                <BellRing size={12} /> Notify doctor
              </button>
            </div>
          ))}
        </div>
      )}

      <select value={patientId} onChange={e => setPatientId(e.target.value)} className={inputCls} style={{ maxWidth: 400, marginBottom: 20 }}>
        <option value="">— Select patient —</option>
        {patients?.map((p: any) => <option key={p.id} value={p.id}>{p.uhid} — {p.first_name} {p.last_name}</option>)}
      </select>

      <div className="card" style={{ padding: 16 }}>
        <h3 style={{ fontSize: 13, fontWeight: 700, color: '#1E1B4B', marginBottom: 10 }}><History size={14} style={{ marginRight: 6, display: 'inline' }} />Timeline</h3>
        {!patientId && <p style={{ color: '#9CA3AF', fontSize: 12 }}>Select a patient to view their clinical timeline.</p>}
        {timeline?.map((e: any, i: number) => (
          <div key={i} style={{ display: 'flex', gap: 12, padding: '10px 0', borderBottom: '1px solid #F3F4F6' }}>
            <div style={{ fontSize: 11, color: '#9CA3AF', width: 120, flexShrink: 0 }}>{new Date(e.event_time).toLocaleString()}</div>
            <div>
              <span style={{
                fontSize: 10, fontWeight: 700, textTransform: 'uppercase', padding: '2px 6px', borderRadius: 4,
                background: e.is_critical ? '#FEE2E2' : '#F5F3FF', color: e.is_critical ? '#DC2626' : '#7C3AED',
              }}>{e.event_type}</span>
              <p style={{ margin: '4px 0 0', fontSize: 13, fontWeight: 600, color: '#1E1B4B' }}>{e.title}</p>
              {e.detail && <p style={{ margin: 0, fontSize: 12, color: '#6B7280' }}>{e.detail}</p>}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
