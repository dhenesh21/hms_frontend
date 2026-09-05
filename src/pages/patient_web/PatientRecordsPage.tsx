import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { patientDataService } from '../../services/patientApi'

const TABS = ['OPD Visits', 'Admissions', 'Lab Orders'] as const

export default function PatientRecordsPage() {
  const [tab, setTab] = useState<typeof TABS[number]>('OPD Visits')

  const { data: opd } = useQuery({ queryKey: ['pw-opd'], queryFn: () => patientDataService.opdVisits().then(r => r.data), enabled: tab === 'OPD Visits' })
  const { data: ipd } = useQuery({ queryKey: ['pw-ipd'], queryFn: () => patientDataService.ipdAdmissions().then(r => r.data), enabled: tab === 'Admissions' })
  const { data: lab } = useQuery({ queryKey: ['pw-lab'], queryFn: () => patientDataService.labOrders().then(r => r.data), enabled: tab === 'Lab Orders' })

  return (
    <div>
      <h1 className="page-title" style={{ marginBottom: 16 }}>Health Records</h1>
      <div style={{ display: 'flex', gap: 4, marginBottom: 16, borderBottom: '1px solid #E5E7EB' }}>
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)}
            style={{
              padding: '10px 16px', border: 'none', background: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600,
              color: tab === t ? '#7C3AED' : '#6B7280', borderBottom: tab === t ? '2px solid #7C3AED' : '2px solid transparent',
            }}>{t}</button>
        ))}
      </div>

      {tab === 'OPD Visits' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {opd?.length === 0 && <p style={{ color: '#9CA3AF' }}>No OPD visits on record.</p>}
          {opd?.map((v: any) => (
            <div key={v.id} className="card" style={{ padding: 16 }}>
              <p style={{ margin: 0, fontWeight: 700 }}>{v.visit_number || `Visit #${v.id}`}</p>
              <p style={{ margin: '2px 0 0', fontSize: 13, color: '#6B7280' }}>Doctor #{v.doctor_id}</p>
            </div>
          ))}
        </div>
      )}

      {tab === 'Admissions' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {ipd?.length === 0 && <p style={{ color: '#9CA3AF' }}>No admissions on record.</p>}
          {ipd?.map((a: any) => (
            <div key={a.id} className="card" style={{ padding: 16 }}>
              <p style={{ margin: 0, fontWeight: 700 }}>{a.admission_number || `Admission #${a.id}`}</p>
              <p style={{ margin: '2px 0 0', fontSize: 13, color: '#6B7280' }}>{a.diagnosis_at_admission || a.status}</p>
            </div>
          ))}
        </div>
      )}

      {tab === 'Lab Orders' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {lab?.length === 0 && <p style={{ color: '#9CA3AF' }}>No lab orders on record.</p>}
          {lab?.map((o: any) => (
            <div key={o.id} className="card" style={{ padding: 16 }}>
              <p style={{ margin: 0, fontWeight: 700 }}>{o.order_number || `Order #${o.id}`}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
