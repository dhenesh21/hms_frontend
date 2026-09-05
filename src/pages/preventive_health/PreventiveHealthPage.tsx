import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { preventiveHealthService, patientService } from '../../services/api'
import { HeartPulse, Plus, Syringe } from 'lucide-react'
import toast from 'react-hot-toast'
import { cleanPayload } from '../../utils/form'

const inputCls = "w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-violet-500 outline-none"

export default function PreventiveHealthPage() {
  const qc = useQueryClient()
  const form = useForm<any>()

  const { data: patients } = useQuery({ queryKey: ['patients-all'], queryFn: () => patientService.list({ limit: 200 }).then(r => r.data) })
  const { data: bookings } = useQuery({ queryKey: ['checkup-bookings'], queryFn: () => preventiveHealthService.listBookings().then(r => r.data) })
  const { data: dueVaccines } = useQuery({ queryKey: ['vaccines-due'], queryFn: () => preventiveHealthService.vaccinationsDueSoon(30).then(r => r.data) })

  const book = useMutation({
    mutationFn: (d: any) => preventiveHealthService.bookCheckup(cleanPayload({ ...d, patient_id: parseInt(d.patient_id), package_id: parseInt(d.package_id) })),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['checkup-bookings'] }); form.reset(); toast.success('Health check-up booked') },
    onError: (e: any) => toast.error(e.response?.data?.detail || 'Failed — check the package ID exists in Billing Packages'),
  })

  return (
    <div>
      <h1 className="page-title" style={{ marginBottom: 4 }}>Preventive Healthcare</h1>
      <p style={{ color: '#8B5CF6', fontSize: 13, marginBottom: 20 }}>Health check-up bookings (redeems existing Billing Packages) & vaccination due-list</p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <div className="card" style={{ padding: 16 }}>
          <h3 style={{ fontSize: 13, fontWeight: 700, color: '#1E1B4B', marginBottom: 10 }}><Plus size={14} style={{ marginRight: 6, display: 'inline' }} />Book Health Check-up</h3>
          <form onSubmit={form.handleSubmit(d => book.mutate(d))} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <select {...form.register('patient_id', { required: true })} className={inputCls}>
              <option value="">— Patient —</option>
              {patients?.map((p: any) => <option key={p.id} value={p.id}>{p.uhid} — {p.first_name} {p.last_name}</option>)}
            </select>
            <input {...form.register('package_id', { required: true })} className={inputCls} placeholder="Health Package ID (from Billing → Packages)" />
            <input type="date" {...form.register('scheduled_date', { required: true })} className={inputCls} />
            <button type="submit" className="btn-primary">Book</button>
          </form>

          <h3 style={{ fontSize: 13, fontWeight: 700, color: '#1E1B4B', margin: '18px 0 10px' }}>Bookings</h3>
          {bookings?.map((b: any) => (
            <div key={b.id} style={{ padding: 8, borderBottom: '1px solid #F3F4F6', fontSize: 12 }}>
              Patient #{b.patient_id} — {b.scheduled_date} — <span style={{ color: '#8B5CF6' }}>{b.status}</span>
            </div>
          ))}
        </div>

        <div className="card" style={{ padding: 16 }}>
          <h3 style={{ fontSize: 13, fontWeight: 700, color: '#1E1B4B', marginBottom: 10 }}><Syringe size={14} style={{ marginRight: 6, display: 'inline' }} />Vaccinations Due (next 30 days)</h3>
          {dueVaccines?.length ? dueVaccines.map((v: any, i: number) => (
            <div key={i} style={{ padding: 8, borderBottom: '1px solid #F3F4F6', fontSize: 12 }}>
              Patient #{v.patient_id} — {v.vaccine_name} (dose {v.dose_number}) — due {v.next_due_date}
            </div>
          )) : <p style={{ color: '#9CA3AF', fontSize: 12 }}>Nothing due in the next 30 days.</p>}
        </div>
      </div>
    </div>
  )
}
