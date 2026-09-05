import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { dataExchangeService, patientService, facilityRegistryService } from '../../services/api'
import { ShieldCheck, Plus } from 'lucide-react'
import toast from 'react-hot-toast'
import { cleanPayload } from '../../utils/form'

const inputCls = "w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-violet-500 outline-none"
const CATEGORIES = ['demographics', 'diagnoses', 'medications', 'lab_results', 'imaging', 'allergies', 'full_record']

export default function DataExchangePage() {
  const qc = useQueryClient()
  const [patientId, setPatientId] = useState('')
  const [checkCategory, setCheckCategory] = useState('lab_results')
  const [checkResult, setCheckResult] = useState<any>(null)
  const form = useForm<any>({ defaultValues: { data_categories: [] } })

  const { data: patients } = useQuery({ queryKey: ['patients-all'], queryFn: () => patientService.list({ limit: 200 }).then(r => r.data) })
  const { data: facilities } = useQuery({ queryKey: ['facility-registry'], queryFn: () => facilityRegistryService.list().then(r => r.data) })
  const { data: authorizations } = useQuery({
    queryKey: ['exchange-auths', patientId], queryFn: () => dataExchangeService.listForPatient(parseInt(patientId)).then(r => r.data), enabled: !!patientId,
  })

  const grant = useMutation({
    mutationFn: (d: any) => dataExchangeService.grant(cleanPayload({
      ...d, patient_id: parseInt(patientId),
      authorized_facility_id: d.authorized_facility_id ? parseInt(d.authorized_facility_id) : undefined,
      data_categories: Array.isArray(d.data_categories) ? d.data_categories : [d.data_categories],
    })),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['exchange-auths'] }); form.reset({ data_categories: [] }); toast.success('Authorization granted') },
  })
  const revoke = useMutation({
    mutationFn: (id: number) => dataExchangeService.revoke(id, { revoked_reason: 'Revoked via admin panel' }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['exchange-auths'] }); toast.success('Revoked') },
  })
  const checkAuth = useMutation({
    mutationFn: () => dataExchangeService.check(parseInt(patientId), checkCategory),
    onSuccess: (res) => setCheckResult(res.data),
  })

  return (
    <div>
      <h1 className="page-title" style={{ marginBottom: 4 }}>Consent-based Data Exchange</h1>
      <p style={{ color: '#8B5CF6', fontSize: 13, marginBottom: 20 }}>Patient authorization to share specific data categories with external parties</p>

      <select value={patientId} onChange={e => setPatientId(e.target.value)} className={inputCls} style={{ maxWidth: 400, marginBottom: 20 }}>
        <option value="">— Select patient —</option>
        {patients?.map((p: any) => <option key={p.id} value={p.id}>{p.uhid} — {p.first_name} {p.last_name}</option>)}
      </select>

      {patientId && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: 20 }}>
          <div className="card" style={{ padding: 16 }}>
            <h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 10 }}><Plus size={14} style={{ marginRight: 6, display: 'inline' }} />Grant Authorization</h3>
            <form onSubmit={form.handleSubmit(d => grant.mutate(d))} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <select {...form.register('authorized_facility_id')} className={inputCls}>
                <option value="">— External facility —</option>
                {facilities?.map((f: any) => <option key={f.id} value={f.id}>{f.name}</option>)}
              </select>
              <input {...form.register('authorized_party_name_freetext')} className={inputCls} placeholder="Or party name (if not in registry)" />
              <select {...form.register('data_categories')} className={inputCls} multiple style={{ height: 100 }}>
                {CATEGORIES.map(c => <option key={c} value={c}>{c.replace('_', ' ')}</option>)}
              </select>
              <textarea {...form.register('purpose')} className={inputCls} rows={2} placeholder="Purpose of sharing" />
              <input {...form.register('consented_by_name')} className={inputCls} placeholder="Consented by (name)" />
              <button type="submit" className="btn-primary">Grant</button>
            </form>

            <div style={{ marginTop: 16, borderTop: '1px solid #F3F4F6', paddingTop: 12 }}>
              <p style={{ fontSize: 12, fontWeight: 700, marginBottom: 6 }}>Check Authorization</p>
              <div style={{ display: 'flex', gap: 6 }}>
                <select value={checkCategory} onChange={e => setCheckCategory(e.target.value)} className={inputCls}>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c.replace('_', ' ')}</option>)}
                </select>
                <button onClick={() => checkAuth.mutate()} className="btn-primary" style={{ whiteSpace: 'nowrap' }}>Check</button>
              </div>
              {checkResult && (
                <p style={{ fontSize: 12, marginTop: 8, color: checkResult.authorized ? '#059669' : '#DC2626' }}>
                  {checkResult.authorized ? '✓ Authorized' : `✗ ${checkResult.reason}`}
                </p>
              )}
            </div>
          </div>

          <div className="card" style={{ padding: 16 }}>
            <h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 10 }}><ShieldCheck size={14} style={{ marginRight: 6, display: 'inline' }} />Active Authorizations</h3>
            {authorizations?.length === 0 && <p style={{ color: '#9CA3AF', fontSize: 12 }}>No active authorizations for this patient.</p>}
            {authorizations?.map((a: any) => (
              <div key={a.id} style={{ padding: 10, borderBottom: '1px solid #F3F4F6', fontSize: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontWeight: 600 }}>{a.authorized_party_name_freetext || `Facility #${a.authorized_facility_id}`}</span>
                  <button onClick={() => revoke.mutate(a.id)} style={{ color: '#DC2626', fontSize: 11 }}>Revoke</button>
                </div>
                <div style={{ color: '#9CA3AF' }}>{(a.data_categories || []).join(', ')}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
