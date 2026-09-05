import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { transplantService, patientService, doctorService } from '../../services/api'
import { HeartPulse, Plus } from 'lucide-react'
import toast from 'react-hot-toast'
import { cleanPayload } from '../../utils/form'

const inputCls = "w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-violet-500 outline-none"
const ORGANS = ['kidney', 'liver', 'heart', 'lung', 'pancreas', 'cornea', 'bone_marrow']
const DONOR_TYPES = ['living_related', 'living_unrelated', 'deceased']

export default function TransplantPage() {
  const qc = useQueryClient()
  const [selectedCandidate, setSelectedCandidate] = useState<any>(null)
  const candidateForm = useForm<any>()
  const caseForm = useForm<any>({ defaultValues: { donor_type: 'living_related' } })

  const { data: patients } = useQuery({ queryKey: ['patients-all'], queryFn: () => patientService.list({ limit: 200 }).then(r => r.data) })
  const { data: doctors } = useQuery({ queryKey: ['doctors-all'], queryFn: () => doctorService.list({ limit: 200 }).then(r => r.data) })
  const { data: candidates } = useQuery({ queryKey: ['transplant-candidates'], queryFn: () => transplantService.listCandidates().then(r => r.data) })

  const addCandidate = useMutation({
    mutationFn: (d: any) => transplantService.addCandidate(cleanPayload({ ...d, patient_id: parseInt(d.patient_id), transplant_surgeon_id: parseInt(d.transplant_surgeon_id), urgency_score: d.urgency_score ? parseInt(d.urgency_score) : undefined })),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['transplant-candidates'] }); candidateForm.reset(); toast.success('Added to waitlist') },
  })
  const createCase = useMutation({
    mutationFn: (d: any) => transplantService.createCase(cleanPayload({
      ...d, candidate_id: selectedCandidate.id, patient_id: selectedCandidate.patient_id,
      transplant_surgeon_id: parseInt(d.transplant_surgeon_id), organ: selectedCandidate.organ_needed,
    })),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['transplant-candidates'] }); caseForm.reset({ donor_type: 'living_related' }); setSelectedCandidate(null); toast.success('Transplant case created, candidate marked transplanted') },
  })
  const toggleWorkup = useMutation({
    mutationFn: ({ id, field, value }: any) => transplantService.updateCandidate(id, { [field]: value }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['transplant-candidates'] }),
  })

  return (
    <div>
      <h1 className="page-title" style={{ marginBottom: 4 }}>Transplant</h1>
      <p style={{ color: '#8B5CF6', fontSize: 13, marginBottom: 20 }}>Waitlist management, donor matching & post-transplant follow-up</p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: 20 }}>
        <div className="card" style={{ padding: 16 }}>
          <h3 style={{ fontSize: 13, fontWeight: 700, color: '#1E1B4B', marginBottom: 10 }}><Plus size={14} style={{ marginRight: 6, display: 'inline' }} />Add to Waitlist</h3>
          <form onSubmit={candidateForm.handleSubmit(d => addCandidate.mutate(d))} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <select {...candidateForm.register('patient_id', { required: true })} className={inputCls}>
              <option value="">— Patient —</option>
              {patients?.map((p: any) => <option key={p.id} value={p.id}>{p.uhid} — {p.first_name} {p.last_name}</option>)}
            </select>
            <select {...candidateForm.register('transplant_surgeon_id', { required: true })} className={inputCls}>
              <option value="">— Transplant surgeon —</option>
              {doctors?.map((d: any) => <option key={d.id} value={d.id}>{d.full_name}</option>)}
            </select>
            <select {...candidateForm.register('organ_needed', { required: true })} className={inputCls}>
              <option value="">— Organ needed —</option>
              {ORGANS.map(o => <option key={o} value={o}>{o.replace('_', ' ')}</option>)}
            </select>
            <input {...candidateForm.register('blood_group')} className={inputCls} placeholder="Blood group" />
            <input {...candidateForm.register('urgency_score')} className={inputCls} placeholder="Urgency score" />
            <button type="submit" className="btn-primary">Add to Waitlist</button>
          </form>

          <h3 style={{ fontSize: 13, fontWeight: 700, color: '#1E1B4B', margin: '18px 0 10px' }}>Active Waitlist</h3>
          {candidates?.map((c: any) => (
            <div key={c.id} onClick={() => setSelectedCandidate(c)}
              style={{ padding: 10, borderBottom: '1px solid #F3F4F6', cursor: 'pointer', background: selectedCandidate?.id === c.id ? '#F5F3FF' : 'transparent' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                <span style={{ fontWeight: 600 }}>Patient #{c.patient_id} — {c.organ_needed}</span>
                <span style={{ color: '#8B5CF6' }}>urgency {c.urgency_score ?? '—'}</span>
              </div>
              <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                <label style={{ fontSize: 10, display: 'flex', gap: 3 }}>
                  <input type="checkbox" checked={c.workup_complete} onClick={e => e.stopPropagation()}
                    onChange={e => toggleWorkup.mutate({ id: c.id, field: 'workup_complete', value: e.target.checked })} /> workup
                </label>
                <label style={{ fontSize: 10, display: 'flex', gap: 3 }}>
                  <input type="checkbox" checked={c.hla_typing_done} onClick={e => e.stopPropagation()}
                    onChange={e => toggleWorkup.mutate({ id: c.id, field: 'hla_typing_done', value: e.target.checked })} /> HLA typed
                </label>
              </div>
            </div>
          ))}
        </div>

        <div className="card" style={{ padding: 16 }}>
          <h3 style={{ fontSize: 13, fontWeight: 700, color: '#1E1B4B', marginBottom: 10 }}><HeartPulse size={14} style={{ marginRight: 6, display: 'inline' }} />Create Transplant Case</h3>
          {!selectedCandidate && <p style={{ color: '#9CA3AF', fontSize: 12 }}>Select a waitlisted candidate to record a match/transplant.</p>}
          {selectedCandidate && (
            <form onSubmit={caseForm.handleSubmit(d => createCase.mutate(d))} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <p style={{ fontSize: 12, color: '#6B7280' }}>Patient #{selectedCandidate.patient_id} — {selectedCandidate.organ_needed}</p>
              <select {...caseForm.register('transplant_surgeon_id', { required: true })} className={inputCls}>
                <option value="">— Transplant surgeon —</option>
                {doctors?.map((d: any) => <option key={d.id} value={d.id}>{d.full_name}</option>)}
              </select>
              <select {...caseForm.register('donor_type')} className={inputCls}>
                {DONOR_TYPES.map(d => <option key={d} value={d}>{d.replace('_', ' ')}</option>)}
              </select>
              <input {...caseForm.register('donor_relation')} className={inputCls} placeholder="Donor relation (e.g. sibling)" />
              <input type="date" {...caseForm.register('surgery_date')} className={inputCls} />
              <input {...caseForm.register('cross_match_result')} className={inputCls} placeholder="Cross-match result" />
              <textarea {...caseForm.register('immunosuppression_protocol')} className={inputCls} rows={2} placeholder="Immunosuppression protocol" />
              <button type="submit" className="btn-primary">Create Case</button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
