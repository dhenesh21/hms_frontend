import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { carePlanService, patientService } from '../../services/api'
import { ListChecks, Plus, Check } from 'lucide-react'
import toast from 'react-hot-toast'

const inputCls = "w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-violet-500 outline-none"

export default function CarePlansPage() {
  const qc = useQueryClient()
  const [patientId, setPatientId] = useState('')
  const [selectedPlan, setSelectedPlan] = useState<any>(null)
  const startForm = useForm<any>()

  const { data: patients } = useQuery({ queryKey: ['patients-all'], queryFn: () => patientService.list({ limit: 200 }).then(r => r.data) })
  const { data: templates } = useQuery({ queryKey: ['pathway-templates'], queryFn: () => carePlanService.listTemplates().then(r => r.data) })
  const { data: plans } = useQuery({
    queryKey: ['care-plans', patientId], queryFn: () => carePlanService.listForPatient(parseInt(patientId)).then(r => r.data), enabled: !!patientId,
  })
  const { data: tasks } = useQuery({
    queryKey: ['care-plan-tasks', selectedPlan?.id], queryFn: () => carePlanService.listTasks(selectedPlan.id).then(r => r.data), enabled: !!selectedPlan,
  })

  const startFromTemplate = useMutation({
    mutationFn: (d: any) => carePlanService.startFromTemplate({ ...d, patient_id: parseInt(patientId), template_id: parseInt(d.template_id) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['care-plans'] }); toast.success('Care plan started') },
  })
  const completeTask = useMutation({
    mutationFn: (taskId: number) => carePlanService.updateTask(taskId, { status: 'done' }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['care-plan-tasks'] }); toast.success('Task marked done') },
  })

  return (
    <div>
      <h1 className="page-title" style={{ marginBottom: 4 }}>Clinical Pathways / Care Plans</h1>
      <p style={{ color: '#8B5CF6', fontSize: 13, marginBottom: 20 }}>Standardized pathways applied to a patient episode, with tracked tasks</p>

      <select value={patientId} onChange={e => setPatientId(e.target.value)} className={inputCls} style={{ maxWidth: 400, marginBottom: 20 }}>
        <option value="">— Select patient —</option>
        {patients?.map((p: any) => <option key={p.id} value={p.id}>{p.uhid} — {p.first_name} {p.last_name}</option>)}
      </select>

      {patientId && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <div className="card" style={{ padding: 16 }}>
            <h3 style={{ fontSize: 13, fontWeight: 700, color: '#1E1B4B', marginBottom: 10 }}><Plus size={14} style={{ marginRight: 6, display: 'inline' }} />Start Pathway</h3>
            <form onSubmit={startForm.handleSubmit(d => startFromTemplate.mutate(d))} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <select {...startForm.register('template_id', { required: true })} className={inputCls}>
                <option value="">— Pathway template —</option>
                {templates?.map((t: any) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
              <button type="submit" className="btn-primary">Start Care Plan</button>
            </form>

            <h3 style={{ fontSize: 13, fontWeight: 700, color: '#1E1B4B', margin: '18px 0 10px' }}><ListChecks size={14} style={{ marginRight: 6, display: 'inline' }} />Active Plans</h3>
            {plans?.map((p: any) => (
              <div key={p.id} onClick={() => setSelectedPlan(p)}
                style={{ padding: 10, borderBottom: '1px solid #F3F4F6', cursor: 'pointer', background: selectedPlan?.id === p.id ? '#F5F3FF' : 'transparent' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                  <span style={{ fontWeight: 600 }}>{p.title}</span>
                  <span style={{ color: '#8B5CF6' }}>{p.status}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="card" style={{ padding: 16 }}>
            <h3 style={{ fontSize: 13, fontWeight: 700, color: '#1E1B4B', marginBottom: 10 }}>Tasks</h3>
            {!selectedPlan && <p style={{ color: '#9CA3AF', fontSize: 12 }}>Select a plan to see its tasks.</p>}
            {tasks?.map((t: any) => (
              <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #F3F4F6', fontSize: 12 }}>
                <div>
                  <p style={{ margin: 0, fontWeight: 600, textDecoration: t.status === 'done' ? 'line-through' : 'none', color: t.status === 'done' ? '#9CA3AF' : '#1E1B4B' }}>{t.task_description}</p>
                  <p style={{ margin: 0, color: '#9CA3AF', fontSize: 11 }}>{t.task_type} {t.due_at ? `· due ${new Date(t.due_at).toLocaleDateString()}` : ''}</p>
                </div>
                {t.status !== 'done' && (
                  <button onClick={() => completeTask.mutate(t.id)} style={{ color: '#059669' }}><Check size={16} /></button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
