import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { dialysisService, patientService, doctorService } from '../../services/api'
import { Droplet, Plus } from 'lucide-react'
import toast from 'react-hot-toast'
import { cleanPayload } from '../../utils/form'

const inputCls = "w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-violet-500 outline-none"
const ACCESS_TYPES = ['av_fistula', 'av_graft', 'central_catheter', 'peritoneal_catheter']

export default function DialysisPage() {
  const qc = useQueryClient()
  const [selectedProfile, setSelectedProfile] = useState<any>(null)
  const profileForm = useForm<any>({ defaultValues: { modality: 'hemodialysis', frequency_per_week: 3 } })
  const sessionForm = useForm<any>()

  const { data: patients } = useQuery({ queryKey: ['patients-all'], queryFn: () => patientService.list({ limit: 200 }).then(r => r.data) })
  const { data: doctors } = useQuery({ queryKey: ['doctors-all'], queryFn: () => doctorService.list({ limit: 200 }).then(r => r.data) })
  const { data: profiles } = useQuery({ queryKey: ['dialysis-profiles'], queryFn: () => dialysisService.listProfiles().then(r => r.data) })
  const { data: todaySessions } = useQuery({ queryKey: ['dialysis-today'], queryFn: () => dialysisService.sessionsToday().then(r => r.data), refetchInterval: 30000 })
  const { data: sessions } = useQuery({
    queryKey: ['dialysis-sessions', selectedProfile?.id], queryFn: () => dialysisService.listSessions(selectedProfile.id).then(r => r.data), enabled: !!selectedProfile,
  })

  const createProfile = useMutation({
    mutationFn: (d: any) => dialysisService.createProfile(cleanPayload({ ...d, patient_id: parseInt(d.patient_id), nephrologist_id: parseInt(d.nephrologist_id) })),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['dialysis-profiles'] }); profileForm.reset({ modality: 'hemodialysis', frequency_per_week: 3 }); toast.success('Dialysis profile created') },
  })
  const scheduleSession = useMutation({
    mutationFn: (d: any) => dialysisService.scheduleSession(cleanPayload({ ...d, profile_id: selectedProfile.id })),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['dialysis-sessions', 'dialysis-today'] }); sessionForm.reset(); toast.success('Session scheduled') },
  })

  return (
    <div>
      <h1 className="page-title" style={{ marginBottom: 4 }}>Dialysis</h1>
      <p style={{ color: '#8B5CF6', fontSize: 13, marginBottom: 20 }}>Renal-care profiles, access management & session scheduling</p>

      {todaySessions?.length > 0 && (
        <div className="card" style={{ padding: 14, marginBottom: 20, background: '#F5F3FF' }}>
          <h3 style={{ fontSize: 13, fontWeight: 700, color: '#4C1D95', marginBottom: 6 }}>Today's Sessions ({todaySessions.length})</h3>
          {todaySessions.map((s: any) => (
            <div key={s.id} style={{ fontSize: 12, padding: '3px 0' }}>Profile #{s.profile_id} — {new Date(s.scheduled_at).toLocaleTimeString()} — {s.status}</div>
          ))}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: 20 }}>
        <div className="card" style={{ padding: 16 }}>
          <h3 style={{ fontSize: 13, fontWeight: 700, color: '#1E1B4B', marginBottom: 10 }}><Plus size={14} style={{ marginRight: 6, display: 'inline' }} />New Renal-Care Profile</h3>
          <form onSubmit={profileForm.handleSubmit(d => createProfile.mutate(d))} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <select {...profileForm.register('patient_id', { required: true })} className={inputCls}>
              <option value="">— Patient —</option>
              {patients?.map((p: any) => <option key={p.id} value={p.id}>{p.uhid} — {p.first_name} {p.last_name}</option>)}
            </select>
            <select {...profileForm.register('nephrologist_id', { required: true })} className={inputCls}>
              <option value="">— Nephrologist —</option>
              {doctors?.map((d: any) => <option key={d.id} value={d.id}>{d.full_name}</option>)}
            </select>
            <select {...profileForm.register('access_type', { required: true })} className={inputCls}>
              <option value="">— Access type —</option>
              {ACCESS_TYPES.map(a => <option key={a} value={a}>{a.replace('_', ' ')}</option>)}
            </select>
            <input {...profileForm.register('access_site')} className={inputCls} placeholder="Access site (e.g. left forearm)" />
            <input {...profileForm.register('dry_weight_kg')} className={inputCls} placeholder="Dry weight (kg)" />
            <input {...profileForm.register('primary_renal_diagnosis')} className={inputCls} placeholder="Primary renal diagnosis" />
            <button type="submit" className="btn-primary">Create Profile</button>
          </form>

          <h3 style={{ fontSize: 13, fontWeight: 700, color: '#1E1B4B', margin: '18px 0 10px' }}>Active Profiles</h3>
          {profiles?.map((p: any) => (
            <div key={p.id} onClick={() => setSelectedProfile(p)}
              style={{ padding: 10, borderBottom: '1px solid #F3F4F6', cursor: 'pointer', background: selectedProfile?.id === p.id ? '#F5F3FF' : 'transparent' }}>
              <span style={{ fontSize: 12, fontWeight: 600 }}>Patient #{p.patient_id}</span>
              <span style={{ fontSize: 11, color: '#8B5CF6', marginLeft: 8 }}>{p.access_type} · {p.frequency_per_week}x/week</span>
            </div>
          ))}
        </div>

        <div className="card" style={{ padding: 16 }}>
          <h3 style={{ fontSize: 13, fontWeight: 700, color: '#1E1B4B', marginBottom: 10 }}><Droplet size={14} style={{ marginRight: 6, display: 'inline' }} />Sessions</h3>
          {!selectedProfile && <p style={{ color: '#9CA3AF', fontSize: 12 }}>Select a profile to schedule and view sessions.</p>}
          {selectedProfile && (
            <>
              <form onSubmit={sessionForm.handleSubmit(d => scheduleSession.mutate(d))} style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
                <input type="datetime-local" {...sessionForm.register('scheduled_at', { required: true })} className={inputCls} />
                <input {...sessionForm.register('machine_id')} className={inputCls} placeholder="Machine" style={{ maxWidth: 100 }} />
                <button type="submit" className="btn-primary" style={{ whiteSpace: 'nowrap' }}>Schedule</button>
              </form>
              {sessions?.map((s: any) => (
                <div key={s.id} style={{ fontSize: 12, padding: '6px 0', borderBottom: '1px solid #F3F4F6' }}>
                  {new Date(s.scheduled_at).toLocaleString()} — <b>{s.status}</b>
                  {s.fluid_removed_ml && ` · ${s.fluid_removed_ml}ml removed`}
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
