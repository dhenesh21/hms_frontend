import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { familyService, patientService } from '../../services/api'
import { Users, Plus, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { cleanPayload } from '../../utils/form'

const inputCls = "w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-violet-500 outline-none"
const RELATIONS = ['spouse', 'child', 'parent', 'sibling', 'guardian', 'caregiver', 'other']

export default function FamilyPage() {
  const qc = useQueryClient()
  const [patientId, setPatientId] = useState('')
  const form = useForm<any>({ defaultValues: { relation_type: 'spouse' } })

  const { data: patients } = useQuery({ queryKey: ['patients-all'], queryFn: () => patientService.list({ limit: 200 }).then(r => r.data) })
  const { data: members } = useQuery({
    queryKey: ['family-members', patientId], queryFn: () => familyService.listMembers(parseInt(patientId)).then(r => r.data), enabled: !!patientId,
  })
  const { data: healthSummary } = useQuery({
    queryKey: ['family-health', patientId], queryFn: () => familyService.getHealthSummary(parseInt(patientId)).then(r => r.data), enabled: !!patientId,
  })

  const addMember = useMutation({
    mutationFn: (d: any) => familyService.addMember(cleanPayload({ ...d, patient_id: parseInt(patientId), linked_patient_id: d.linked_patient_id ? parseInt(d.linked_patient_id) : undefined })),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['family-members', 'family-health'] }); form.reset({ relation_type: 'spouse' }); toast.success('Family member added') },
  })
  const removeMember = useMutation({
    mutationFn: (id: number) => familyService.removeMember(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['family-members', 'family-health'] }); toast.success('Removed') },
  })

  return (
    <div>
      <h1 className="page-title" style={{ marginBottom: 4 }}>Family / Proxy / Caregiver</h1>
      <p style={{ color: '#8B5CF6', fontSize: 13, marginBottom: 20 }}>Emergency contacts, authorized proxies & family health status</p>

      <select value={patientId} onChange={e => setPatientId(e.target.value)} className={inputCls} style={{ maxWidth: 400, marginBottom: 20 }}>
        <option value="">— Select patient —</option>
        {patients?.map((p: any) => <option key={p.id} value={p.id}>{p.uhid} — {p.first_name} {p.last_name}</option>)}
      </select>

      {patientId && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <div className="card" style={{ padding: 16 }}>
            <h3 style={{ fontSize: 13, fontWeight: 700, color: '#1E1B4B', marginBottom: 10 }}><Plus size={14} style={{ marginRight: 6, display: 'inline' }} />Add Family Member / Caregiver</h3>
            <form onSubmit={form.handleSubmit(d => addMember.mutate(d))} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <select {...form.register('relation_type')} className={inputCls}>
                {RELATIONS.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
              <select {...form.register('linked_patient_id')} className={inputCls}>
                <option value="">— Not a registered patient —</option>
                {patients?.filter((p: any) => String(p.id) !== patientId).map((p: any) => <option key={p.id} value={p.id}>{p.uhid} — {p.first_name} {p.last_name}</option>)}
              </select>
              <input {...form.register('name')} className={inputCls} placeholder="Name (if not a registered patient)" />
              <input {...form.register('phone')} className={inputCls} placeholder="Phone" />
              <label style={{ display: 'flex', gap: 6, fontSize: 12 }}><input type="checkbox" {...form.register('is_emergency_contact')} /> Emergency contact</label>
              <label style={{ display: 'flex', gap: 6, fontSize: 12 }}><input type="checkbox" {...form.register('is_authorized_proxy')} /> Authorized proxy (can consent on behalf)</label>
              <button type="submit" className="btn-primary">Add</button>
            </form>

            <h3 style={{ fontSize: 13, fontWeight: 700, color: '#1E1B4B', margin: '18px 0 10px' }}><Users size={14} style={{ marginRight: 6, display: 'inline' }} />Family Members</h3>
            {members?.map((m: any) => (
              <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #F3F4F6', fontSize: 12 }}>
                <span>{m.name || `Linked patient #${m.linked_patient_id}`} — {m.relation_type} {m.is_authorized_proxy && '· proxy'}</span>
                <button onClick={() => removeMember.mutate(m.id)}><Trash2 size={14} color="#DC2626" /></button>
              </div>
            ))}
          </div>

          <div className="card" style={{ padding: 16 }}>
            <h3 style={{ fontSize: 13, fontWeight: 700, color: '#1E1B4B', marginBottom: 10 }}>Family Health Status</h3>
            <p style={{ fontSize: 11, color: '#9CA3AF', marginBottom: 10 }}>Coarse status only for linked family members — full records need their own portal login.</p>
            {healthSummary?.length ? healthSummary.map((h: any, i: number) => (
              <div key={i} style={{ padding: 8, borderBottom: '1px solid #F3F4F6', fontSize: 12 }}>
                Patient #{h.linked_patient_id} ({h.relation_type}) —
                {h.has_upcoming_appointment && <span style={{ color: '#7C3AED' }}> upcoming appointment</span>}
                {h.has_active_ipd_admission && <span style={{ color: '#DC2626' }}> currently admitted</span>}
                {!h.has_upcoming_appointment && !h.has_active_ipd_admission && <span style={{ color: '#059669' }}> nothing pending</span>}
              </div>
            )) : <p style={{ color: '#9CA3AF', fontSize: 12 }}>No linked-patient family members yet.</p>}
          </div>
        </div>
      )}
    </div>
  )
}
