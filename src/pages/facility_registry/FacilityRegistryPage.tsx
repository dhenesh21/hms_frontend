import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { facilityRegistryService } from '../../services/api'
import { Building2, Plus, Check } from 'lucide-react'
import toast from 'react-hot-toast'
import { cleanPayload } from '../../utils/form'

const inputCls = "w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-violet-500 outline-none"
const TYPES = ['hospital', 'clinic', 'lab', 'pharmacy', 'diagnostic_center', 'blood_bank']

export default function FacilityRegistryPage() {
  const qc = useQueryClient()
  const form = useForm<any>({ defaultValues: { facility_type: 'hospital', is_self: false } })
  const { data: entries } = useQuery({ queryKey: ['facility-registry'], queryFn: () => facilityRegistryService.list().then(r => r.data) })

  const create = useMutation({
    mutationFn: (d: any) => facilityRegistryService.create(cleanPayload(d)),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['facility-registry'] }); form.reset({ facility_type: 'hospital', is_self: false }); toast.success('Facility added') },
  })
  const verify = useMutation({
    mutationFn: (id: number) => facilityRegistryService.update(id, { is_verified: true }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['facility-registry'] }); toast.success('Marked verified') },
  })

  return (
    <div>
      <h1 className="page-title" style={{ marginBottom: 4 }}>Facility Registry</h1>
      <p style={{ color: '#8B5CF6', fontSize: 13, marginBottom: 20 }}>External facilities this hospital exchanges patients/referrals/results with, plus this hospital's own entry</p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: 20 }}>
        <div className="card" style={{ padding: 16 }}>
          <h3 style={{ fontSize: 13, fontWeight: 700, color: '#1E1B4B', marginBottom: 10 }}><Plus size={14} style={{ marginRight: 6, display: 'inline' }} />Add Facility</h3>
          <form onSubmit={form.handleSubmit(d => create.mutate(d))} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <select {...form.register('facility_type')} className={inputCls}>
              {TYPES.map(t => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
            </select>
            <input {...form.register('name', { required: true })} className={inputCls} placeholder="Facility name" />
            <input {...form.register('national_facility_id')} className={inputCls} placeholder="National facility ID (e.g. HFR ID)" />
            <input {...form.register('city')} className={inputCls} placeholder="City" />
            <input {...form.register('contact_phone')} className={inputCls} placeholder="Contact phone" />
            <label style={{ display: 'flex', gap: 6, fontSize: 12 }}><input type="checkbox" {...form.register('is_self')} /> This is our own hospital's entry</label>
            <button type="submit" className="btn-primary">Add</button>
          </form>
        </div>

        <div className="card" style={{ padding: 16 }}>
          <h3 style={{ fontSize: 13, fontWeight: 700, color: '#1E1B4B', marginBottom: 10 }}><Building2 size={14} style={{ marginRight: 6, display: 'inline' }} />Registry</h3>
          {entries?.map((e: any) => (
            <div key={e.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 10, borderBottom: '1px solid #F3F4F6', fontSize: 12 }}>
              <div>
                <span style={{ fontWeight: 600 }}>{e.name}</span>
                <span style={{ color: '#9CA3AF', marginLeft: 8 }}>{e.facility_type.replace('_', ' ')} {e.is_self && '· self'} {e.city ? `· ${e.city}` : ''}</span>
              </div>
              {e.is_verified ? <Check size={16} color="#059669" /> : <button onClick={() => verify.mutate(e.id)} style={{ fontSize: 11, color: '#7C3AED' }}>Verify</button>}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
