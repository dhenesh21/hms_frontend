import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { patientCategoryService, patientService } from '../../services/api'
import { Globe2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { cleanPayload } from '../../utils/form'

const inputCls = "w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-violet-500 outline-none"

export default function PatientCategoryPage() {
  const qc = useQueryClient()
  const form = useForm<any>({ defaultValues: { category: 'domestic' } })

  const { data: patients } = useQuery({ queryKey: ['patients-all'], queryFn: () => patientService.list({ limit: 200 }).then(r => r.data) })
  const { data: international } = useQuery({ queryKey: ['pc-international'], queryFn: () => patientCategoryService.listByCategory('international').then(r => r.data) })
  const { data: corporate } = useQuery({ queryKey: ['pc-corporate'], queryFn: () => patientCategoryService.listByCategory('corporate').then(r => r.data) })
  const { data: tourism } = useQuery({ queryKey: ['pc-tourism'], queryFn: () => patientCategoryService.listByCategory('medical_tourism').then(r => r.data) })

  const upsert = useMutation({
    mutationFn: (d: any) => patientCategoryService.upsertProfile(cleanPayload({ ...d, patient_id: parseInt(d.patient_id) })),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['pc-international', 'pc-corporate', 'pc-tourism'] }); form.reset({ category: 'domestic' }); toast.success('Profile saved') },
  })

  return (
    <div>
      <h1 className="page-title" style={{ marginBottom: 4 }}>International / Corporate / Medical Tourism</h1>
      <p style={{ color: '#8B5CF6', fontSize: 13, marginBottom: 20 }}>Registration-variant profile — extends the patient record, doesn't duplicate it</p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: 20 }}>
        <div className="card" style={{ padding: 16 }}>
          <h3 style={{ fontSize: 13, fontWeight: 700, color: '#1E1B4B', marginBottom: 10 }}><Globe2 size={14} style={{ marginRight: 6, display: 'inline' }} />Set Category Profile</h3>
          <form onSubmit={form.handleSubmit(d => upsert.mutate(d))} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <select {...form.register('patient_id', { required: true })} className={inputCls}>
              <option value="">— Patient —</option>
              {patients?.map((p: any) => <option key={p.id} value={p.id}>{p.uhid} — {p.first_name} {p.last_name}</option>)}
            </select>
            <select {...form.register('category')} className={inputCls}>
              <option value="domestic">Domestic</option><option value="international">International</option>
              <option value="medical_tourism">Medical Tourism</option><option value="corporate">Corporate</option>
            </select>
            <input {...form.register('country_of_origin')} className={inputCls} placeholder="Country of origin" />
            <input {...form.register('passport_number')} className={inputCls} placeholder="Passport number" />
            <input {...form.register('preferred_language')} className={inputCls} placeholder="Preferred language" />
            <label style={{ display: 'flex', gap: 6, fontSize: 12 }}><input type="checkbox" {...form.register('interpreter_required')} /> Interpreter required</label>
            <input {...form.register('corporate_employer_name')} className={inputCls} placeholder="Corporate employer (if applicable)" />
            <input {...form.register('corporate_scheme_name')} className={inputCls} placeholder="Corporate scheme name" />
            <button type="submit" className="btn-primary">Save</button>
          </form>
        </div>

        <div className="card" style={{ padding: 16 }}>
          <h3 style={{ fontSize: 13, fontWeight: 700, color: '#1E1B4B', marginBottom: 10 }}>By Category</h3>
          {[{ label: 'International', data: international }, { label: 'Medical Tourism', data: tourism }, { label: 'Corporate', data: corporate }].map(sec => (
            <div key={sec.label} style={{ marginBottom: 14 }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: '#4C1D95', marginBottom: 4 }}>{sec.label} ({sec.data?.length || 0})</p>
              {sec.data?.map((p: any) => (
                <div key={p.id} style={{ fontSize: 11, color: '#6B7280', padding: '3px 0' }}>
                  Patient #{p.patient_id} — {p.country_of_origin || p.corporate_employer_name || '—'}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
