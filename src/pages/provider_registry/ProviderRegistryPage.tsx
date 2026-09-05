import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { providerRegistryService } from '../../services/api'
import { UserCheck, Plus, Check } from 'lucide-react'
import toast from 'react-hot-toast'
import { cleanPayload } from '../../utils/form'

const inputCls = "w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-violet-500 outline-none"
const TYPES = ['individual_practitioner', 'facility', 'lab', 'pharmacy']

export default function ProviderRegistryPage() {
  const qc = useQueryClient()
  const form = useForm<any>({ defaultValues: { provider_type: 'individual_practitioner', is_internal: false } })
  const { data: entries } = useQuery({ queryKey: ['provider-registry'], queryFn: () => providerRegistryService.list().then(r => r.data) })

  const create = useMutation({
    mutationFn: (d: any) => providerRegistryService.create(cleanPayload(d)),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['provider-registry'] }); form.reset({ provider_type: 'individual_practitioner', is_internal: false }); toast.success('Provider added') },
  })
  const verify = useMutation({
    mutationFn: (id: number) => providerRegistryService.update(id, { is_verified: true }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['provider-registry'] }); toast.success('Marked verified') },
  })

  return (
    <div>
      <h1 className="page-title" style={{ marginBottom: 4 }}>Provider Registry</h1>
      <p style={{ color: '#8B5CF6', fontSize: 13, marginBottom: 20 }}>External-facing provider directory — referring doctors, partner labs, and this hospital's own staff who need an external registration ID</p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: 20 }}>
        <div className="card" style={{ padding: 16 }}>
          <h3 style={{ fontSize: 13, fontWeight: 700, color: '#1E1B4B', marginBottom: 10 }}><Plus size={14} style={{ marginRight: 6, display: 'inline' }} />Add Provider</h3>
          <form onSubmit={form.handleSubmit(d => create.mutate(d))} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <select {...form.register('provider_type')} className={inputCls}>
              {TYPES.map(t => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
            </select>
            <input {...form.register('full_name', { required: true })} className={inputCls} placeholder="Full name / facility name" />
            <input {...form.register('national_registry_id')} className={inputCls} placeholder="National registry ID (e.g. HPR ID)" />
            <input {...form.register('specialization')} className={inputCls} placeholder="Specialization" />
            <input {...form.register('registration_council')} className={inputCls} placeholder="Registration council" />
            <input {...form.register('contact_phone')} className={inputCls} placeholder="Contact phone" />
            <label style={{ display: 'flex', gap: 6, fontSize: 12 }}><input type="checkbox" {...form.register('is_internal')} /> Works at this hospital</label>
            <button type="submit" className="btn-primary">Add</button>
          </form>
        </div>

        <div className="card" style={{ padding: 16 }}>
          <h3 style={{ fontSize: 13, fontWeight: 700, color: '#1E1B4B', marginBottom: 10 }}><UserCheck size={14} style={{ marginRight: 6, display: 'inline' }} />Registry</h3>
          {entries?.map((e: any) => (
            <div key={e.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 10, borderBottom: '1px solid #F3F4F6', fontSize: 12 }}>
              <div>
                <span style={{ fontWeight: 600 }}>{e.full_name}</span>
                <span style={{ color: '#9CA3AF', marginLeft: 8 }}>{e.provider_type.replace('_', ' ')} {e.is_internal && '· internal'}</span>
              </div>
              {e.is_verified ? <Check size={16} color="#059669" /> : <button onClick={() => verify.mutate(e.id)} style={{ fontSize: 11, color: '#7C3AED' }}>Verify</button>}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
