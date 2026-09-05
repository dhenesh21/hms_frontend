import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { palliativeCareService, patientService, doctorService } from '../../services/api'
import { HeartHandshake, Plus } from 'lucide-react'
import toast from 'react-hot-toast'
import { cleanPayload } from '../../utils/form'

const inputCls = "w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-violet-500 outline-none"
const SYMPTOMS = ['pain', 'nausea', 'fatigue', 'appetite', 'breathlessness', 'anxiety']

export default function PalliativeCarePage() {
  const qc = useQueryClient()
  const [selectedPlan, setSelectedPlan] = useState<any>(null)
  const planForm = useForm<any>({ defaultValues: { care_setting: 'inpatient' } })
  const [symptomScores, setSymptomScores] = useState<Record<string, string>>({})

  const { data: patients } = useQuery({ queryKey: ['patients-all'], queryFn: () => patientService.list({ limit: 200 }).then(r => r.data) })
  const { data: doctors } = useQuery({ queryKey: ['doctors-all'], queryFn: () => doctorService.list({ limit: 200 }).then(r => r.data) })
  const { data: plans } = useQuery({ queryKey: ['palliative-plans'], queryFn: () => palliativeCareService.listPlans().then(r => r.data) })
  const { data: symptomLogs } = useQuery({
    queryKey: ['symptom-assessments', selectedPlan?.id], queryFn: () => palliativeCareService.listSymptomAssessments(selectedPlan.id).then(r => r.data), enabled: !!selectedPlan,
  })

  const createPlan = useMutation({
    mutationFn: (d: any) => palliativeCareService.createPlan(cleanPayload({ ...d, patient_id: parseInt(d.patient_id), primary_doctor_id: parseInt(d.primary_doctor_id) })),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['palliative-plans'] }); planForm.reset({ care_setting: 'inpatient' }); toast.success('Palliative care plan created') },
  })
  const addSymptomAssessment = useMutation({
    mutationFn: () => palliativeCareService.addSymptomAssessment({
      care_plan_id: selectedPlan.id, symptom_scores: Object.fromEntries(Object.entries(symptomScores).map(([k, v]) => [k, parseInt(v) || 0])),
    }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['symptom-assessments'] }); setSymptomScores({}); toast.success('Symptoms recorded') },
  })

  return (
    <div>
      <h1 className="page-title" style={{ marginBottom: 4 }}>Palliative / Hospice Care</h1>
      <p style={{ color: '#8B5CF6', fontSize: 13, marginBottom: 20 }}>Comfort-focused care plans with multi-symptom (ESAS-style) tracking</p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <div className="card" style={{ padding: 16 }}>
          <h3 style={{ fontSize: 13, fontWeight: 700, color: '#1E1B4B', marginBottom: 10 }}><Plus size={14} style={{ marginRight: 6, display: 'inline' }} />New Care Plan</h3>
          <form onSubmit={planForm.handleSubmit(d => createPlan.mutate(d))} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <select {...planForm.register('patient_id', { required: true })} className={inputCls}>
              <option value="">— Patient —</option>
              {patients?.map((p: any) => <option key={p.id} value={p.id}>{p.uhid} — {p.first_name} {p.last_name}</option>)}
            </select>
            <select {...planForm.register('primary_doctor_id', { required: true })} className={inputCls}>
              <option value="">— Primary doctor —</option>
              {doctors?.map((d: any) => <option key={d.id} value={d.id}>{d.full_name}</option>)}
            </select>
            <input {...planForm.register('primary_diagnosis', { required: true })} className={inputCls} placeholder="Primary diagnosis" />
            <select {...planForm.register('care_setting')} className={inputCls}>
              <option value="inpatient">Inpatient</option><option value="home_based">Home-based</option><option value="outpatient_clinic">Outpatient clinic</option>
            </select>
            <textarea {...planForm.register('goals_of_care')} className={inputCls} rows={2} placeholder="Goals of care" />
            <input {...planForm.register('code_status')} className={inputCls} placeholder="Code status (e.g. DNR)" />
            <button type="submit" className="btn-primary">Create Plan</button>
          </form>

          <h3 style={{ fontSize: 13, fontWeight: 700, color: '#1E1B4B', margin: '18px 0 10px' }}>Active Plans</h3>
          {plans?.map((p: any) => (
            <div key={p.id} onClick={() => setSelectedPlan(p)}
              style={{ padding: 10, borderBottom: '1px solid #F3F4F6', cursor: 'pointer', background: selectedPlan?.id === p.id ? '#F5F3FF' : 'transparent' }}>
              <span style={{ fontSize: 12, fontWeight: 600 }}>{p.primary_diagnosis}</span>
              <span style={{ fontSize: 11, color: '#8B5CF6', marginLeft: 8 }}>{p.care_setting}</span>
            </div>
          ))}
        </div>

        <div className="card" style={{ padding: 16 }}>
          <h3 style={{ fontSize: 13, fontWeight: 700, color: '#1E1B4B', marginBottom: 10 }}><HeartHandshake size={14} style={{ marginRight: 6, display: 'inline' }} />Symptom Assessment</h3>
          {!selectedPlan && <p style={{ color: '#9CA3AF', fontSize: 12 }}>Select a plan to record symptom scores.</p>}
          {selectedPlan && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 10 }}>
                {SYMPTOMS.map(s => (
                  <input key={s} value={symptomScores[s] || ''} onChange={e => setSymptomScores(sc => ({ ...sc, [s]: e.target.value }))}
                    className={inputCls} placeholder={`${s} (0-10)`} />
                ))}
              </div>
              <button className="btn-primary" onClick={() => addSymptomAssessment.mutate()}>Record Symptoms</button>
              <div style={{ marginTop: 12 }}>
                {symptomLogs?.map((s: any) => (
                  <div key={s.id} style={{ fontSize: 11, color: '#6B7280', padding: '4px 0', borderBottom: '1px solid #F3F4F6' }}>
                    {new Date(s.assessed_at).toLocaleString()} — {Object.entries(s.symptom_scores || {}).map(([k, v]) => `${k}:${v}`).join(' · ')}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
