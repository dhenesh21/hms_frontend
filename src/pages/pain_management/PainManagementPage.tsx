import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { painManagementService, patientService, doctorService } from '../../services/api'
import { Activity, Plus } from 'lucide-react'
import toast from 'react-hot-toast'
import { cleanPayload } from '../../utils/form'

const inputCls = "w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-violet-500 outline-none"
const PAIN_TYPES = ['acute', 'chronic', 'cancer_related', 'post_surgical', 'neuropathic']

export default function PainManagementPage() {
  const qc = useQueryClient()
  const [selectedPlan, setSelectedPlan] = useState<any>(null)
  const planForm = useForm<any>({ defaultValues: { pain_type: 'acute', target_pain_score: 3 } })
  const assessForm = useForm<any>()

  const { data: patients } = useQuery({ queryKey: ['patients-all'], queryFn: () => patientService.list({ limit: 200 }).then(r => r.data) })
  const { data: doctors } = useQuery({ queryKey: ['doctors-all'], queryFn: () => doctorService.list({ limit: 200 }).then(r => r.data) })
  const { data: plans } = useQuery({ queryKey: ['pain-plans'], queryFn: () => painManagementService.listPlans().then(r => r.data) })
  const { data: assessments } = useQuery({
    queryKey: ['pain-assessments', selectedPlan?.id], queryFn: () => painManagementService.listAssessments(selectedPlan.id).then(r => r.data), enabled: !!selectedPlan,
  })

  const createPlan = useMutation({
    mutationFn: (d: any) => painManagementService.createPlan(cleanPayload({ ...d, patient_id: parseInt(d.patient_id), managing_doctor_id: parseInt(d.managing_doctor_id) })),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['pain-plans'] }); planForm.reset({ pain_type: 'acute', target_pain_score: 3 }); toast.success('Pain plan created') },
  })
  const addAssessment = useMutation({
    mutationFn: (d: any) => painManagementService.addAssessment(cleanPayload({ ...d, plan_id: selectedPlan.id, pain_score: parseInt(d.pain_score) })),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['pain-assessments'] }); assessForm.reset(); toast.success('Assessment recorded') },
  })

  return (
    <div>
      <h1 className="page-title" style={{ marginBottom: 4 }}>Pain Management</h1>
      <p style={{ color: '#8B5CF6', fontSize: 13, marginBottom: 20 }}>Pain plans with periodic score & intervention tracking</p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <div className="card" style={{ padding: 16 }}>
          <h3 style={{ fontSize: 13, fontWeight: 700, color: '#1E1B4B', marginBottom: 10 }}><Plus size={14} style={{ marginRight: 6, display: 'inline' }} />New Pain Plan</h3>
          <form onSubmit={planForm.handleSubmit(d => createPlan.mutate(d))} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <select {...planForm.register('patient_id', { required: true })} className={inputCls}>
              <option value="">— Patient —</option>
              {patients?.map((p: any) => <option key={p.id} value={p.id}>{p.uhid} — {p.first_name} {p.last_name}</option>)}
            </select>
            <select {...planForm.register('managing_doctor_id', { required: true })} className={inputCls}>
              <option value="">— Managing doctor —</option>
              {doctors?.map((d: any) => <option key={d.id} value={d.id}>{d.full_name}</option>)}
            </select>
            <select {...planForm.register('pain_type')} className={inputCls}>
              {PAIN_TYPES.map(t => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
            </select>
            <input {...planForm.register('pain_location')} className={inputCls} placeholder="Pain location" />
            <textarea {...planForm.register('treatment_plan')} className={inputCls} rows={2} placeholder="Treatment plan" />
            <button type="submit" className="btn-primary">Create Plan</button>
          </form>

          <h3 style={{ fontSize: 13, fontWeight: 700, color: '#1E1B4B', margin: '18px 0 10px' }}>Active Plans</h3>
          {plans?.map((p: any) => (
            <div key={p.id} onClick={() => setSelectedPlan(p)}
              style={{ padding: 10, borderBottom: '1px solid #F3F4F6', cursor: 'pointer', background: selectedPlan?.id === p.id ? '#F5F3FF' : 'transparent' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                <span style={{ fontWeight: 600 }}>{p.pain_type} — {p.pain_location || 'unspecified'}</span>
                <span style={{ color: '#8B5CF6' }}>baseline {p.baseline_pain_score ?? '—'}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="card" style={{ padding: 16 }}>
          <h3 style={{ fontSize: 13, fontWeight: 700, color: '#1E1B4B', marginBottom: 10 }}><Activity size={14} style={{ marginRight: 6, display: 'inline' }} />Pain Score Trend</h3>
          {!selectedPlan && <p style={{ color: '#9CA3AF', fontSize: 12 }}>Select a plan to record assessments.</p>}
          {selectedPlan && (
            <>
              <form onSubmit={assessForm.handleSubmit(d => addAssessment.mutate(d))} style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
                <input {...assessForm.register('pain_score', { required: true })} className={inputCls} placeholder="Score (0-10)" />
                <input {...assessForm.register('pain_character')} className={inputCls} placeholder="Character" />
                <button type="submit" className="btn-primary" style={{ whiteSpace: 'nowrap' }}>Record</button>
              </form>
              {assessments?.map((a: any) => (
                <div key={a.id} style={{ fontSize: 12, padding: '6px 0', borderBottom: '1px solid #F3F4F6' }}>
                  {new Date(a.assessed_at).toLocaleString()} — Score <b>{a.pain_score}</b> {a.pain_character ? `(${a.pain_character})` : ''}
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
