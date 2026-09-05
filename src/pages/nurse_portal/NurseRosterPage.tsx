import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { nurseRosterService } from '../../services/api'
import { CalendarClock, Plus } from 'lucide-react'
import toast from 'react-hot-toast'
import { cleanPayload } from '../../utils/form'

const inputCls = "w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-violet-500 outline-none"

export default function NurseRosterPage() {
  const qc = useQueryClient()
  const form = useForm<any>({ defaultValues: { shift: 'morning' } })
  const { data: assignments } = useQuery({ queryKey: ['nurse-roster'], queryFn: () => nurseRosterService.list().then(r => r.data) })

  const assign = useMutation({
    mutationFn: (d: any) => nurseRosterService.assign(cleanPayload({ ...d, nurse_id: parseInt(d.nurse_id), ward_id: parseInt(d.ward_id) })),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['nurse-roster'] }); form.reset({ shift: 'morning' }); toast.success('Nurse assigned to ward') },
  })

  return (
    <div>
      <h1 className="page-title" style={{ marginBottom: 4 }}>Nurse Ward Roster</h1>
      <p style={{ color: '#8B5CF6', fontSize: 13, marginBottom: 20 }}>Assign nurses to wards per shift — feeds "my ward" in the Nurse Portal</p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: 20 }}>
        <div className="card" style={{ padding: 16 }}>
          <h3 style={{ fontSize: 13, fontWeight: 700, color: '#1E1B4B', marginBottom: 10 }}><Plus size={14} style={{ marginRight: 6, display: 'inline' }} />New Assignment</h3>
          <form onSubmit={form.handleSubmit(d => assign.mutate(d))} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <input {...form.register('nurse_id', { required: true })} className={inputCls} placeholder="Nurse (User) ID" />
            <input {...form.register('ward_id', { required: true })} className={inputCls} placeholder="Ward ID" />
            <input type="date" {...form.register('assignment_date', { required: true })} className={inputCls} />
            <select {...form.register('shift')} className={inputCls}>
              <option value="morning">Morning</option><option value="evening">Evening</option><option value="night">Night</option>
            </select>
            <label style={{ display: 'flex', gap: 6, fontSize: 12 }}><input type="checkbox" {...form.register('is_charge_nurse')} /> Charge nurse</label>
            <button type="submit" className="btn-primary">Assign</button>
          </form>
        </div>

        <div className="card" style={{ padding: 16 }}>
          <h3 style={{ fontSize: 13, fontWeight: 700, color: '#1E1B4B', marginBottom: 10 }}><CalendarClock size={14} style={{ marginRight: 6, display: 'inline' }} />Current Roster</h3>
          {assignments?.map((a: any) => (
            <div key={a.id} style={{ padding: 8, borderBottom: '1px solid #F3F4F6', fontSize: 12 }}>
              Nurse #{a.nurse_id} → Ward #{a.ward_id} — {a.assignment_date} ({a.shift}) {a.is_charge_nurse && '· charge'}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
