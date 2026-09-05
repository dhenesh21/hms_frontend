import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { telemedicineService, patientService, doctorService } from '../../services/api'
import { Video, Plus } from 'lucide-react'
import toast from 'react-hot-toast'
import { cleanPayload } from '../../utils/form'

const inputCls = "w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-violet-500 outline-none"

export default function TelemedicinePage() {
  const qc = useQueryClient()
  const form = useForm<any>({ defaultValues: { is_second_opinion: false } })

  const { data: patients } = useQuery({ queryKey: ['patients-all'], queryFn: () => patientService.list({ limit: 200 }).then(r => r.data) })
  const { data: doctors } = useQuery({ queryKey: ['doctors-all'], queryFn: () => doctorService.list({ limit: 200 }).then(r => r.data) })
  const { data: consultations } = useQuery({ queryKey: ['tele-consults'], queryFn: () => telemedicineService.list().then(r => r.data) })

  const schedule = useMutation({
    mutationFn: (d: any) => telemedicineService.schedule(cleanPayload({ ...d, patient_id: parseInt(d.patient_id), doctor_id: parseInt(d.doctor_id) })),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['tele-consults'] }); form.reset({ is_second_opinion: false }); toast.success('Consultation scheduled') },
  })
  const setLink = useMutation({
    mutationFn: ({ id, link }: any) => telemedicineService.setMeetingDetails(id, { meeting_link: link, meeting_provider: 'external_link' }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['tele-consults'] }); toast.success('Meeting link set') },
  })
  const startConsult = useMutation({ mutationFn: (id: number) => telemedicineService.start(id), onSuccess: () => { qc.invalidateQueries({ queryKey: ['tele-consults'] }) } })
  const completeConsult = useMutation({
    mutationFn: (id: number) => telemedicineService.complete(id, { consultation_notes: 'Consultation completed', prescription_issued: false }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['tele-consults'] }); toast.success('Consultation completed') },
  })

  return (
    <div>
      <h1 className="page-title" style={{ marginBottom: 4 }}>Telemedicine / Virtual Consultation</h1>
      <p style={{ color: '#8B5CF6', fontSize: 13, marginBottom: 20 }}>Meeting links auto-generate via Jitsi Meet on scheduling — override below if using a different vendor</p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.3fr', gap: 20 }}>
        <div className="card" style={{ padding: 16 }}>
          <h3 style={{ fontSize: 13, fontWeight: 700, color: '#1E1B4B', marginBottom: 10 }}><Plus size={14} style={{ marginRight: 6, display: 'inline' }} />Schedule Consultation</h3>
          <form onSubmit={form.handleSubmit(d => schedule.mutate(d))} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <select {...form.register('patient_id', { required: true })} className={inputCls}>
              <option value="">— Patient —</option>
              {patients?.map((p: any) => <option key={p.id} value={p.id}>{p.uhid} — {p.first_name} {p.last_name}</option>)}
            </select>
            <select {...form.register('doctor_id', { required: true })} className={inputCls}>
              <option value="">— Doctor —</option>
              {doctors?.map((d: any) => <option key={d.id} value={d.id}>{d.full_name}</option>)}
            </select>
            <input type="datetime-local" {...form.register('scheduled_at', { required: true })} className={inputCls} />
            <textarea {...form.register('reason_for_consult')} className={inputCls} rows={2} placeholder="Reason for consult" />
            <label style={{ display: 'flex', gap: 6, fontSize: 12 }}><input type="checkbox" {...form.register('is_second_opinion')} /> This is a second-opinion request</label>
            <button type="submit" className="btn-primary">Schedule</button>
          </form>
        </div>

        <div className="card" style={{ padding: 16 }}>
          <h3 style={{ fontSize: 13, fontWeight: 700, color: '#1E1B4B', marginBottom: 10 }}><Video size={14} style={{ marginRight: 6, display: 'inline' }} />Consultations</h3>
          {consultations?.map((c: any) => (
            <div key={c.id} style={{ padding: 10, borderBottom: '1px solid #F3F4F6', fontSize: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Patient #{c.patient_id} {c.is_second_opinion && <b style={{ color: '#DC2626' }}>· 2nd opinion</b>}</span>
                <span style={{ color: '#8B5CF6' }}>{c.status}</span>
              </div>
              <div style={{ color: '#9CA3AF' }}>{new Date(c.scheduled_at).toLocaleString()}</div>
              {c.meeting_link ? <a href={c.meeting_link} target="_blank" rel="noreferrer" style={{ fontSize: 11, color: '#7C3AED' }}>Join link ({c.meeting_provider || 'jitsi'}) →</a> : (
                <button onClick={() => { const link = prompt('Paste meeting link:'); if (link) setLink.mutate({ id: c.id, link }) }} style={{ fontSize: 11, color: '#7C3AED' }}>Set meeting link</button>
              )}
              {c.status === 'scheduled' && <button onClick={() => startConsult.mutate(c.id)} style={{ fontSize: 11, marginLeft: 10, color: '#059669' }}>Start</button>}
              {c.status === 'in_progress' && <button onClick={() => completeConsult.mutate(c.id)} style={{ fontSize: 11, marginLeft: 10, color: '#059669' }}>Complete</button>}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
