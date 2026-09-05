import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { oncologyService, patientService, doctorService } from '../../services/api'
import { Ribbon, Plus, Check } from 'lucide-react'
import toast from 'react-hot-toast'
import { cleanPayload } from '../../utils/form'

const inputCls = "w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-violet-500 outline-none"
const STAGES = ['stage_0', 'stage_i', 'stage_ii', 'stage_iii', 'stage_iv', 'unknown']

export default function OncologyPage() {
  const qc = useQueryClient()
  const [selectedCase, setSelectedCase] = useState<any>(null)
  const caseForm = useForm<any>({ defaultValues: { stage: 'unknown' } })
  const chemoForm = useForm<any>()

  const { data: patients } = useQuery({ queryKey: ['patients-all'], queryFn: () => patientService.list({ limit: 200 }).then(r => r.data) })
  const { data: doctors } = useQuery({ queryKey: ['doctors-all'], queryFn: () => doctorService.list({ limit: 200 }).then(r => r.data) })
  const { data: cases } = useQuery({ queryKey: ['onco-cases'], queryFn: () => oncologyService.listCases().then(r => r.data) })
  const { data: chemoCycles } = useQuery({
    queryKey: ['chemo-cycles', selectedCase?.id], queryFn: () => oncologyService.listChemoCycles(selectedCase.id).then(r => r.data), enabled: !!selectedCase,
  })

  const createCase = useMutation({
    mutationFn: (d: any) => oncologyService.createCase(cleanPayload({ ...d, patient_id: parseInt(d.patient_id), oncologist_id: parseInt(d.oncologist_id) })),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['onco-cases'] }); caseForm.reset({ stage: 'unknown' }); toast.success('Oncology case created') },
  })
  const markTumorBoardReviewed = useMutation({
    mutationFn: (id: number) => oncologyService.updateCase(id, { tumor_board_reviewed: true }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['onco-cases'] }); toast.success('Marked as tumor board reviewed') },
  })
  const scheduleChemo = useMutation({
    mutationFn: (d: any) => oncologyService.scheduleChemoCycle(cleanPayload({ ...d, case_id: selectedCase.id, cycle_number: parseInt(d.cycle_number) })),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['chemo-cycles'] }); chemoForm.reset(); toast.success('Chemo cycle scheduled') },
  })
  const markAdministered = useMutation({
    mutationFn: (id: number) => oncologyService.updateChemoCycle(id, { status: 'administered' }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['chemo-cycles'] }); toast.success('Cycle marked administered') },
  })

  return (
    <div>
      <h1 className="page-title" style={{ marginBottom: 4 }}>Oncology</h1>
      <p style={{ color: '#8B5CF6', fontSize: 13, marginBottom: 20 }}>Cases, staging, tumor board & chemotherapy cycles</p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: 20 }}>
        <div className="card" style={{ padding: 16 }}>
          <h3 style={{ fontSize: 13, fontWeight: 700, color: '#1E1B4B', marginBottom: 10 }}><Plus size={14} style={{ marginRight: 6, display: 'inline' }} />New Case</h3>
          <form onSubmit={caseForm.handleSubmit(d => createCase.mutate(d))} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <select {...caseForm.register('patient_id', { required: true })} className={inputCls}>
              <option value="">— Patient —</option>
              {patients?.map((p: any) => <option key={p.id} value={p.id}>{p.uhid} — {p.first_name} {p.last_name}</option>)}
            </select>
            <select {...caseForm.register('oncologist_id', { required: true })} className={inputCls}>
              <option value="">— Oncologist —</option>
              {doctors?.map((d: any) => <option key={d.id} value={d.id}>{d.full_name}</option>)}
            </select>
            <input {...caseForm.register('primary_site', { required: true })} className={inputCls} placeholder="Primary site (e.g. breast)" />
            <input {...caseForm.register('histology')} className={inputCls} placeholder="Histology" />
            <select {...caseForm.register('stage')} className={inputCls}>
              {STAGES.map(s => <option key={s} value={s}>{s.replace('_', ' ').toUpperCase()}</option>)}
            </select>
            <input {...caseForm.register('chemo_protocol_name')} className={inputCls} placeholder="Chemo protocol" />
            <button type="submit" className="btn-primary">Create Case</button>
          </form>

          <h3 style={{ fontSize: 13, fontWeight: 700, color: '#1E1B4B', margin: '18px 0 10px' }}>Active Cases</h3>
          {cases?.map((c: any) => (
            <div key={c.id} onClick={() => setSelectedCase(c)}
              style={{ padding: 10, borderBottom: '1px solid #F3F4F6', cursor: 'pointer', background: selectedCase?.id === c.id ? '#F5F3FF' : 'transparent' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                <span style={{ fontWeight: 600 }}>{c.primary_site} — {c.stage.replace('_', ' ')}</span>
                {!c.tumor_board_reviewed && <button onClick={e => { e.stopPropagation(); markTumorBoardReviewed.mutate(c.id) }} style={{ color: '#D97706', fontSize: 10 }}>Mark TB reviewed</button>}
                {c.tumor_board_reviewed && <Check size={14} color="#059669" />}
              </div>
            </div>
          ))}
        </div>

        <div className="card" style={{ padding: 16 }}>
          <h3 style={{ fontSize: 13, fontWeight: 700, color: '#1E1B4B', marginBottom: 10 }}><Ribbon size={14} style={{ marginRight: 6, display: 'inline' }} />Chemotherapy Cycles</h3>
          {!selectedCase && <p style={{ color: '#9CA3AF', fontSize: 12 }}>Select a case to manage chemo cycles.</p>}
          {selectedCase && (
            <>
              <form onSubmit={chemoForm.handleSubmit(d => scheduleChemo.mutate(d))} style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
                <input {...chemoForm.register('cycle_number', { required: true })} className={inputCls} placeholder="Cycle #" style={{ maxWidth: 90 }} />
                <input type="date" {...chemoForm.register('scheduled_date', { required: true })} className={inputCls} />
                <button type="submit" className="btn-primary" style={{ whiteSpace: 'nowrap' }}>Schedule</button>
              </form>
              {chemoCycles?.map((cc: any) => (
                <div key={cc.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #F3F4F6', fontSize: 12 }}>
                  <span>Cycle {cc.cycle_number} — {cc.scheduled_date} — {cc.status}</span>
                  {cc.status === 'scheduled' && <button onClick={() => markAdministered.mutate(cc.id)} style={{ color: '#059669' }}><Check size={16} /></button>}
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
