import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { fertilityService, patientService, doctorService } from '../../services/api'
import { Baby, Plus } from 'lucide-react'
import toast from 'react-hot-toast'
import { cleanPayload } from '../../utils/form'

const inputCls = "w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-violet-500 outline-none"
const TREATMENT_TYPES = ['iui', 'ivf', 'icsi', 'fet', 'ovulation_induction', 'fertility_preservation']

export default function FertilityPage() {
  const qc = useQueryClient()
  const [patientId, setPatientId] = useState('')
  const [profile, setProfile] = useState<any>(null)
  const [selectedCycle, setSelectedCycle] = useState<any>(null)
  const profileForm = useForm<any>()
  const cycleForm = useForm<any>({ defaultValues: { treatment_type: 'ivf' } })

  const { data: patients } = useQuery({ queryKey: ['patients-all'], queryFn: () => patientService.list({ limit: 200 }).then(r => r.data) })
  const { data: doctors } = useQuery({ queryKey: ['doctors-all'], queryFn: () => doctorService.list({ limit: 200 }).then(r => r.data) })
  const { data: cycles } = useQuery({
    queryKey: ['fertility-cycles', profile?.id], queryFn: () => fertilityService.listCycles(profile.id).then(r => r.data), enabled: !!profile,
  })

  const loadProfile = useMutation({
    mutationFn: (pid: number) => fertilityService.getProfile(pid),
    onSuccess: (res) => setProfile(res.data),
    onError: () => setProfile(null),
  })

  const createProfile = useMutation({
    mutationFn: (d: any) => fertilityService.createProfile(cleanPayload({ ...d, patient_id: parseInt(patientId), fertility_specialist_id: parseInt(d.fertility_specialist_id) })),
    onSuccess: (res) => { setProfile(res.data); profileForm.reset(); toast.success('Fertility profile created') },
  })
  const startCycle = useMutation({
    mutationFn: (d: any) => fertilityService.startCycle(cleanPayload({ ...d, profile_id: profile.id })),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['fertility-cycles'] }); cycleForm.reset({ treatment_type: 'ivf' }); toast.success('Cycle started') },
  })

  return (
    <div>
      <h1 className="page-title" style={{ marginBottom: 4 }}>Fertility / IVF</h1>
      <p style={{ color: '#8B5CF6', fontSize: 13, marginBottom: 20 }}>Fertility profiles, treatment cycles & stimulation monitoring</p>

      <select value={patientId} onChange={e => { setPatientId(e.target.value); if (e.target.value) loadProfile.mutate(parseInt(e.target.value)); else setProfile(null) }}
        className={inputCls} style={{ maxWidth: 400, marginBottom: 20 }}>
        <option value="">— Select patient —</option>
        {patients?.map((p: any) => <option key={p.id} value={p.id}>{p.uhid} — {p.first_name} {p.last_name}</option>)}
      </select>

      {patientId && !profile && (
        <div className="card" style={{ maxWidth: 500, padding: 16, marginBottom: 20 }}>
          <h3 style={{ fontSize: 13, fontWeight: 700, color: '#1E1B4B', marginBottom: 10 }}><Plus size={14} style={{ marginRight: 6, display: 'inline' }} />No profile yet — create one</h3>
          <form onSubmit={profileForm.handleSubmit(d => createProfile.mutate(d))} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <select {...profileForm.register('fertility_specialist_id', { required: true })} className={inputCls}>
              <option value="">— Fertility specialist —</option>
              {doctors?.map((d: any) => <option key={d.id} value={d.id}>{d.full_name}</option>)}
            </select>
            <input {...profileForm.register('partner_name')} className={inputCls} placeholder="Partner name" />
            <input {...profileForm.register('diagnosis')} className={inputCls} placeholder="Diagnosis" />
            <input {...profileForm.register('amh_level')} className={inputCls} placeholder="AMH level" />
            <button type="submit" className="btn-primary">Create Profile</button>
          </form>
        </div>
      )}

      {profile && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <div className="card" style={{ padding: 16 }}>
            <h3 style={{ fontSize: 13, fontWeight: 700, color: '#1E1B4B', marginBottom: 10 }}><Plus size={14} style={{ marginRight: 6, display: 'inline' }} />Start Treatment Cycle</h3>
            <form onSubmit={cycleForm.handleSubmit(d => startCycle.mutate(d))} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <select {...cycleForm.register('treatment_type')} className={inputCls}>
                {TREATMENT_TYPES.map(t => <option key={t} value={t}>{t.toUpperCase()}</option>)}
              </select>
              <input type="date" {...cycleForm.register('cycle_start_date')} className={inputCls} />
              <input {...cycleForm.register('stimulation_protocol')} className={inputCls} placeholder="Stimulation protocol" />
              <button type="submit" className="btn-primary">Start Cycle</button>
            </form>

            <h3 style={{ fontSize: 13, fontWeight: 700, color: '#1E1B4B', margin: '18px 0 10px' }}>Cycles</h3>
            {cycles?.map((c: any) => (
              <div key={c.id} onClick={() => setSelectedCycle(c)}
                style={{ padding: 10, borderBottom: '1px solid #F3F4F6', cursor: 'pointer', background: selectedCycle?.id === c.id ? '#F5F3FF' : 'transparent' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                  <span style={{ fontWeight: 600 }}>{c.treatment_type.toUpperCase()}</span>
                  <span style={{ color: '#8B5CF6' }}>{c.status}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="card" style={{ padding: 16 }}>
            <h3 style={{ fontSize: 13, fontWeight: 700, color: '#1E1B4B', marginBottom: 10 }}><Baby size={14} style={{ marginRight: 6, display: 'inline' }} />Cycle Details</h3>
            {!selectedCycle && <p style={{ color: '#9CA3AF', fontSize: 12 }}>Select a cycle to view outcomes.</p>}
            {selectedCycle && (
              <div style={{ fontSize: 12 }}>
                <p>Eggs retrieved: {selectedCycle.eggs_retrieved ?? '—'}</p>
                <p>Embryos transferred: {selectedCycle.embryos_transferred ?? '—'}</p>
                <p>Pregnancy test: {selectedCycle.pregnancy_test_result || 'pending'}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
