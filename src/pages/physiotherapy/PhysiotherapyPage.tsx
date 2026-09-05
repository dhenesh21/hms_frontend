import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { physiotherapyService, patientService } from '../../services/api'
import { Activity, Plus, Check } from 'lucide-react'
import toast from 'react-hot-toast'
import { cleanPayload } from '../../utils/form'

const inputCls = "w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-violet-500 outline-none"

export default function PhysiotherapyPage() {
  const qc = useQueryClient()
  const [selectedPlan, setSelectedPlan] = useState<any>(null)
  const planForm = useForm<any>()
  const sessionForm = useForm<any>()

  const { data: patients } = useQuery({ queryKey: ['patients-all'], queryFn: () => patientService.list({ limit: 200 }).then(r => r.data) })
  const { data: plans } = useQuery({ queryKey: ['physio-plans'], queryFn: () => physiotherapyService.listPlans().then(r => r.data) })
  const { data: sessions } = useQuery({
    queryKey: ['physio-sessions', selectedPlan?.id], queryFn: () => physiotherapyService.listSessions(selectedPlan.id).then(r => r.data), enabled: !!selectedPlan,
  })

  const createPlan = useMutation({
    mutationFn: (d: any) => physiotherapyService.createPlan(cleanPayload({ ...d, patient_id: parseInt(d.patient_id), frequency_per_week: parseInt(d.frequency_per_week) || 3 })),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['physio-plans'] }); planForm.reset(); toast.success('Rehab plan created') },
  })
  const scheduleSession = useMutation({
    mutationFn: (d: any) => physiotherapyService.scheduleSession(cleanPayload({ ...d, plan_id: selectedPlan.id })),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['physio-sessions'] }); sessionForm.reset(); toast.success('Session scheduled') },
  })
  const completeSession = useMutation({
    mutationFn: (id: number) => physiotherapyService.completeSession(id, { activities_performed: 'Completed as planned' }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['physio-sessions'] }); toast.success('Session marked complete') },
  })

  return (
    <div>
      <h1 className="page-title" style={{ marginBottom: 4 }}>Physiotherapy / Rehabilitation</h1>
      <p style={{ color: '#8B5CF6', fontSize: 13, marginBottom: 20 }}>Rehab plans and individually tracked sessions</p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <div className="card" style={{ padding: 16 }}>
          <h3 style={{ fontSize: 13, fontWeight: 700, color: '#1E1B4B', marginBottom: 10 }}><Plus size={14} style={{ marginRight: 6, display: 'inline' }} />New Rehab Plan</h3>
          <form onSubmit={planForm.handleSubmit(d => createPlan.mutate(d))} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <select {...planForm.register('patient_id', { required: true })} className={inputCls}>
              <option value="">— Patient —</option>
              {patients?.map((p: any) => <option key={p.id} value={p.id}>{p.uhid} — {p.first_name} {p.last_name}</option>)}
            </select>
            <input {...planForm.register('diagnosis', { required: true })} className={inputCls} placeholder="Diagnosis" />
            <textarea {...planForm.register('plan_details')} className={inputCls} rows={2} placeholder="Plan details / exercises" />
            <input {...planForm.register('frequency_per_week')} className={inputCls} placeholder="Sessions per week" />
            <button type="submit" className="btn-primary">Create Plan</button>
          </form>

          <h3 style={{ fontSize: 13, fontWeight: 700, color: '#1E1B4B', margin: '18px 0 10px' }}>Plans</h3>
          {plans?.map((p: any) => (
            <div key={p.id} onClick={() => setSelectedPlan(p)}
              style={{ padding: 10, borderBottom: '1px solid #F3F4F6', cursor: 'pointer', background: selectedPlan?.id === p.id ? '#F5F3FF' : 'transparent' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                <span style={{ fontWeight: 600 }}>{p.diagnosis}</span>
                <span style={{ color: '#8B5CF6' }}>{p.status}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="card" style={{ padding: 16 }}>
          <h3 style={{ fontSize: 13, fontWeight: 700, color: '#1E1B4B', marginBottom: 10 }}><Activity size={14} style={{ marginRight: 6, display: 'inline' }} />Sessions</h3>
          {!selectedPlan && <p style={{ color: '#9CA3AF', fontSize: 12 }}>Select a plan to schedule and view sessions.</p>}
          {selectedPlan && (
            <>
              <form onSubmit={sessionForm.handleSubmit(d => scheduleSession.mutate(d))} style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
                <input type="datetime-local" {...sessionForm.register('scheduled_at', { required: true })} className={inputCls} />
                <button type="submit" className="btn-primary" style={{ whiteSpace: 'nowrap' }}>Schedule</button>
              </form>
              {sessions?.map((s: any) => (
                <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #F3F4F6', fontSize: 12 }}>
                  <span>{new Date(s.scheduled_at).toLocaleString()} — {s.status}</span>
                  {s.status === 'scheduled' && <button onClick={() => completeSession.mutate(s.id)} style={{ color: '#059669' }}><Check size={16} /></button>}
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
