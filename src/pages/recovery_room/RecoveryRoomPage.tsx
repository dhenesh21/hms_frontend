import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { recoveryRoomService } from '../../services/api'
import { BedSingle, Plus } from 'lucide-react'
import toast from 'react-hot-toast'
import { cleanPayload } from '../../utils/form'

const inputCls = "w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-violet-500 outline-none"

export default function RecoveryRoomPage() {
  const qc = useQueryClient()
  const admitForm = useForm<any>()

  const { data: activeStays } = useQuery({ queryKey: ['recovery-stays'], queryFn: () => recoveryRoomService.listActive().then(r => r.data), refetchInterval: 20000 })

  const admit = useMutation({
    mutationFn: (d: any) => recoveryRoomService.admit(cleanPayload({ ...d, surgery_id: parseInt(d.surgery_id), patient_id: parseInt(d.patient_id) })),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['recovery-stays'] }); admitForm.reset(); toast.success('Admitted to recovery') },
    onError: (e: any) => toast.error(e.response?.data?.detail || 'Failed'),
  })
  const discharge = useMutation({
    mutationFn: ({ id, destination }: any) => recoveryRoomService.discharge(id, { discharge_destination: destination }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['recovery-stays'] }); toast.success('Discharged from recovery') },
  })

  return (
    <div>
      <h1 className="page-title" style={{ marginBottom: 4 }}>Recovery Room / PACU</h1>
      <p style={{ color: '#8B5CF6', fontSize: 13, marginBottom: 20 }}>Post-anesthesia care unit — admission through ward/ICU discharge</p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: 20 }}>
        <div className="card" style={{ padding: 16 }}>
          <h3 style={{ fontSize: 13, fontWeight: 700, color: '#1E1B4B', marginBottom: 10 }}><Plus size={14} style={{ marginRight: 6, display: 'inline' }} />Admit to Recovery</h3>
          <form onSubmit={admitForm.handleSubmit(d => admit.mutate(d))} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <input {...admitForm.register('surgery_id', { required: true })} className={inputCls} placeholder="Surgery ID" />
            <input {...admitForm.register('patient_id', { required: true })} className={inputCls} placeholder="Patient ID" />
            <input {...admitForm.register('pain_score_on_arrival')} className={inputCls} placeholder="Pain score on arrival (0-10)" />
            <button type="submit" className="btn-primary">Admit</button>
          </form>
        </div>

        <div className="card" style={{ padding: 16 }}>
          <h3 style={{ fontSize: 13, fontWeight: 700, color: '#1E1B4B', marginBottom: 10 }}><BedSingle size={14} style={{ marginRight: 6, display: 'inline' }} />Active in Recovery</h3>
          {activeStays?.length ? activeStays.map((s: any) => (
            <div key={s.id} style={{ padding: 10, borderBottom: '1px solid #F3F4F6', fontSize: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Patient #{s.patient_id} — Surgery #{s.surgery_id}</span>
                <span style={{ color: '#8B5CF6' }}>{s.status}</span>
              </div>
              <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                <button onClick={() => discharge.mutate({ id: s.id, destination: 'ward' })} className="btn-primary" style={{ padding: '4px 10px', fontSize: 11 }}>→ Ward</button>
                <button onClick={() => discharge.mutate({ id: s.id, destination: 'icu' })} style={{ padding: '4px 10px', fontSize: 11, border: '1px solid #E5E7EB', borderRadius: 6 }}>→ ICU</button>
              </div>
            </div>
          )) : <p style={{ color: '#9CA3AF', fontSize: 12 }}>No patients currently in recovery.</p>}
        </div>
      </div>
    </div>
  )
}
