import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { nursePortalService } from '../../services/api'
import { Pill, BedDouble, ClipboardList } from 'lucide-react'
import toast from 'react-hot-toast'

const inputCls = "w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-violet-500 outline-none"

export default function NursePortalPage() {
  const qc = useQueryClient()
  const [wardId, setWardId] = useState('')

  const { data: myWards } = useQuery({ queryKey: ['np-my-wards'], queryFn: () => nursePortalService.myWards().then(r => r.data) })
  useEffect(() => { if (myWards?.length && !wardId) setWardId(String(myWards[0])) }, [myWards])

  const { data: wardPatients } = useQuery({
    queryKey: ['np-ward', wardId], queryFn: () => nursePortalService.wardPatients(parseInt(wardId)).then(r => r.data), enabled: !!wardId,
  })
  const { data: dueMeds } = useQuery({ queryKey: ['np-due-meds'], queryFn: () => nursePortalService.dueMedications(60).then(r => r.data), refetchInterval: 30000 })
  const { data: handover } = useQuery({
    queryKey: ['np-handover', wardId], queryFn: () => nursePortalService.latestHandover(parseInt(wardId)).then(r => r.data).catch(() => null), enabled: !!wardId,
  })

  const give = useMutation({
    mutationFn: (id: number) => nursePortalService.giveMedication(id, {}),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['np-due-meds'] }); toast.success('Marked as given') },
  })
  const notGiven = useMutation({
    mutationFn: (id: number) => nursePortalService.markNotGiven(id, { reason_not_given: 'Patient unavailable', status: 'held' }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['np-due-meds'] }); toast.success('Marked as held') },
  })

  return (
    <div>
      <h1 className="page-title" style={{ marginBottom: 4 }}>Nurse Portal</h1>
      <p style={{ color: '#8B5CF6', fontSize: 13, marginBottom: 6 }}>Ward worklist, MAR due list, shift handover & notes</p>
      {myWards?.length === 0 && (
        <p style={{ color: '#D97706', fontSize: 11, marginBottom: 20 }}>⚠ You have no ward assignment for today — ask your charge nurse or admin to add one via Nurse Roster.</p>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <div className="card" style={{ padding: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <h3 style={{ fontSize: 13, fontWeight: 700, color: '#1E1B4B' }}><BedDouble size={14} style={{ marginRight: 6, display: 'inline' }} />Ward Patients</h3>
            <select value={wardId} onChange={e => setWardId(e.target.value)} className={inputCls} style={{ maxWidth: 160 }}>
              <option value="">— My ward —</option>
              {myWards?.map((w: number) => <option key={w} value={w}>Ward #{w}</option>)}
            </select>
          </div>
          {wardPatients?.map((p: any) => (
            <div key={p.admission_id} style={{ padding: 8, borderBottom: '1px solid #F3F4F6', fontSize: 12 }}>
              Patient #{p.patient_id} — Bed #{p.bed_id ?? '—'} — {p.status}
            </div>
          ))}

          {wardId && (
            <div style={{ marginTop: 16, borderTop: '1px solid #F3F4F6', paddingTop: 10 }}>
              <h4 style={{ fontSize: 12, fontWeight: 700, color: '#4C1D95', marginBottom: 6 }}><ClipboardList size={12} style={{ marginRight: 4, display: 'inline' }} />Latest Handover</h4>
              {handover ? (
                <div style={{ fontSize: 12 }}>
                  <p>{handover.from_shift} → {handover.to_shift} ({handover.shift_date})</p>
                  <p style={{ color: '#6B7280' }}>{handover.total_patients} patients · {handover.critical_patients} critical</p>
                  <p>{handover.general_notes}</p>
                </div>
              ) : <p style={{ color: '#9CA3AF', fontSize: 12 }}>No handover recorded for this ward yet.</p>}
            </div>
          )}
        </div>

        <div className="card" style={{ padding: 16 }}>
          <h3 style={{ fontSize: 13, fontWeight: 700, color: '#1E1B4B', marginBottom: 10 }}><Pill size={14} style={{ marginRight: 6, display: 'inline' }} />Due Medications (next 60 min)</h3>
          {dueMeds?.length ? dueMeds.map((m: any) => (
            <div key={m.administration_id} style={{ padding: 8, borderBottom: '1px solid #F3F4F6', fontSize: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Patient #{m.patient_id} — {m.drug_name} {m.dose}</span>
                <span style={{ color: '#9CA3AF' }}>{new Date(m.scheduled_datetime).toLocaleTimeString()}</span>
              </div>
              <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                <button onClick={() => give.mutate(m.administration_id)} className="btn-primary" style={{ padding: '3px 10px', fontSize: 11 }}>Give</button>
                <button onClick={() => notGiven.mutate(m.administration_id)} style={{ padding: '3px 10px', fontSize: 11, border: '1px solid #E5E7EB', borderRadius: 6 }}>Hold</button>
              </div>
            </div>
          )) : <p style={{ color: '#9CA3AF', fontSize: 12 }}>Nothing due in the next hour.</p>}
        </div>
      </div>
    </div>
  )
}
