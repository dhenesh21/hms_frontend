import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { mentalHealthService, patientService, doctorService } from '../../services/api'
import { Brain, Plus, AlertTriangle } from 'lucide-react'
import toast from 'react-hot-toast'
import { cleanPayload } from '../../utils/form'

const inputCls = "w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-violet-500 outline-none"
const RISK_LEVELS = ['none', 'low', 'moderate', 'high', 'imminent']

export default function MentalHealthPage() {
  const qc = useQueryClient()
  const [patientId, setPatientId] = useState('')
  const form = useForm<any>({ defaultValues: { risk_self_harm: 'none', risk_to_others: 'none' } })

  const { data: patients } = useQuery({ queryKey: ['patients-all'], queryFn: () => patientService.list({ limit: 200 }).then(r => r.data) })
  const { data: doctors } = useQuery({ queryKey: ['doctors-all'], queryFn: () => doctorService.list({ limit: 200 }).then(r => r.data) })
  const { data: highRisk } = useQuery({ queryKey: ['mh-high-risk'], queryFn: () => mentalHealthService.highRisk().then(r => r.data) })
  const { data: assessments } = useQuery({
    queryKey: ['mh-assessments', patientId], queryFn: () => mentalHealthService.listAssessments(parseInt(patientId)).then(r => r.data), enabled: !!patientId,
  })

  const createAssessment = useMutation({
    mutationFn: (d: any) => mentalHealthService.createAssessment(cleanPayload({ ...d, patient_id: parseInt(patientId), psychiatrist_id: parseInt(d.psychiatrist_id) })),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['mh-assessments', 'mh-high-risk'] }); form.reset({ risk_self_harm: 'none', risk_to_others: 'none' }); toast.success('Assessment recorded') },
  })

  const riskColor = (r: string) => r === 'imminent' || r === 'high' ? '#DC2626' : r === 'moderate' ? '#D97706' : '#059669'

  return (
    <div>
      <h1 className="page-title" style={{ marginBottom: 4 }}>Mental Health / Psychiatry</h1>
      <p style={{ color: '#8B5CF6', fontSize: 13, marginBottom: 6 }}>Psychiatric assessments, risk screening & therapy tracking</p>
      <p style={{ color: '#9CA3AF', fontSize: 11, marginBottom: 20 }}>Access to this module should be restricted per your hospital's confidentiality policy via role assignment.</p>

      {highRisk?.length > 0 && (
        <div className="card" style={{ padding: 14, marginBottom: 20, border: '1px solid #FCA5A5', background: '#FEF2F2' }}>
          <h3 style={{ fontSize: 13, fontWeight: 700, color: '#DC2626', marginBottom: 8 }}>
            <AlertTriangle size={14} style={{ marginRight: 6, display: 'inline' }} />High-Risk Patients ({highRisk.length})
          </h3>
          {highRisk.map((a: any) => (
            <div key={a.id} style={{ fontSize: 12, padding: '4px 0' }}>Patient #{a.patient_id} — self-harm risk: <b>{a.risk_self_harm}</b></div>
          ))}
        </div>
      )}

      <select value={patientId} onChange={e => setPatientId(e.target.value)} className={inputCls} style={{ maxWidth: 400, marginBottom: 20 }}>
        <option value="">— Select patient —</option>
        {patients?.map((p: any) => <option key={p.id} value={p.id}>{p.uhid} — {p.first_name} {p.last_name}</option>)}
      </select>

      {patientId && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <div className="card" style={{ padding: 16 }}>
            <h3 style={{ fontSize: 13, fontWeight: 700, color: '#1E1B4B', marginBottom: 10 }}><Plus size={14} style={{ marginRight: 6, display: 'inline' }} />New Assessment</h3>
            <form onSubmit={form.handleSubmit(d => createAssessment.mutate(d))} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <select {...form.register('psychiatrist_id', { required: true })} className={inputCls}>
                <option value="">— Psychiatrist —</option>
                {doctors?.map((d: any) => <option key={d.id} value={d.id}>{d.full_name}</option>)}
              </select>
              <textarea {...form.register('presenting_complaint', { required: true })} className={inputCls} rows={2} placeholder="Presenting complaint" />
              <textarea {...form.register('mental_status_exam')} className={inputCls} rows={2} placeholder="Mental status exam" />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <select {...form.register('risk_self_harm')} className={inputCls}>
                  {RISK_LEVELS.map(r => <option key={r} value={r}>Self-harm: {r}</option>)}
                </select>
                <select {...form.register('risk_to_others')} className={inputCls}>
                  {RISK_LEVELS.map(r => <option key={r} value={r}>To others: {r}</option>)}
                </select>
              </div>
              <input {...form.register('provisional_diagnosis')} className={inputCls} placeholder="Provisional diagnosis" />
              <label style={{ display: 'flex', gap: 6, fontSize: 12 }}><input type="checkbox" {...form.register('safety_plan_created')} /> Safety plan created</label>
              <button type="submit" className="btn-primary">Save Assessment</button>
            </form>
          </div>

          <div className="card" style={{ padding: 16 }}>
            <h3 style={{ fontSize: 13, fontWeight: 700, color: '#1E1B4B', marginBottom: 10 }}><Brain size={14} style={{ marginRight: 6, display: 'inline' }} />Assessment History</h3>
            {assessments?.map((a: any) => (
              <div key={a.id} style={{ padding: 10, borderBottom: '1px solid #F3F4F6', fontSize: 12 }}>
                <p style={{ margin: 0, fontWeight: 600 }}>{a.provisional_diagnosis || 'No diagnosis yet'}</p>
                <p style={{ margin: '2px 0', color: '#6B7280' }}>{a.presenting_complaint}</p>
                <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                  <span style={{ color: riskColor(a.risk_self_harm), fontWeight: 600 }}>Self-harm: {a.risk_self_harm}</span>
                  <span style={{ color: riskColor(a.risk_to_others), fontWeight: 600 }}>Others: {a.risk_to_others}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
