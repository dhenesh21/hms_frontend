import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { cdsService, patientService } from '../../services/api'
import { ShieldAlert, Plus, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { cleanPayload } from '../../utils/form'

const inputCls = "w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-violet-500 outline-none"
const RULE_TYPES = ['drug_interaction', 'duplicate_therapy', 'max_dose', 'age_restriction', 'general_alert']

export default function CDSPage() {
  const qc = useQueryClient()
  const [patientId, setPatientId] = useState('')
  const form = useForm<any>({ defaultValues: { rule_type: 'drug_interaction', severity: 'warning' } })

  const { data: rules } = useQuery({ queryKey: ['cds-rules'], queryFn: () => cdsService.listRules().then(r => r.data) })
  const { data: patients } = useQuery({ queryKey: ['patients-all'], queryFn: () => patientService.list({ limit: 200 }).then(r => r.data) })
  const { data: alerts } = useQuery({
    queryKey: ['cds-alerts', patientId], queryFn: () => cdsService.getPatientAlerts(parseInt(patientId)).then(r => r.data), enabled: !!patientId,
  })

  const createRule = useMutation({
    mutationFn: (d: any) => cdsService.createRule(cleanPayload(d)),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['cds-rules'] }); form.reset({ rule_type: 'drug_interaction', severity: 'warning' }); toast.success('CDS rule created') },
  })
  const deactivateRule = useMutation({
    mutationFn: (id: number) => cdsService.deactivateRule(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['cds-rules'] }); toast.success('Rule deactivated') },
  })
  const overrideAlert = useMutation({
    mutationFn: (id: number) => cdsService.overrideAlert(id, { override_reason: 'Clinically reviewed and overridden' }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['cds-alerts'] }); toast.success('Alert overridden') },
  })

  return (
    <div>
      <h1 className="page-title" style={{ marginBottom: 4 }}>Clinical Decision Support</h1>
      <p style={{ color: '#8B5CF6', fontSize: 13, marginBottom: 6 }}>Configurable keyword-based rules — not a licensed drug-interaction database</p>
      <p style={{ color: '#DC2626', fontSize: 11, marginBottom: 20 }}>⚠ Rules only fire on the keywords you enter below. Do not present this as clinically-validated interaction checking.</p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <div className="card" style={{ padding: 16 }}>
          <h3 style={{ fontSize: 13, fontWeight: 700, color: '#1E1B4B', marginBottom: 10 }}><Plus size={14} style={{ marginRight: 6, display: 'inline' }} />New Rule</h3>
          <form onSubmit={form.handleSubmit(d => createRule.mutate(d))} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <input {...form.register('rule_name', { required: true })} className={inputCls} placeholder="Rule name" />
            <select {...form.register('rule_type')} className={inputCls}>
              {RULE_TYPES.map(t => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
            </select>
            <select {...form.register('severity')} className={inputCls}>
              <option value="info">Info</option><option value="warning">Warning</option><option value="critical">Critical</option>
            </select>
            <input {...form.register('trigger_keyword', { required: true })} className={inputCls} placeholder="Trigger keyword (matches new order)" />
            <input {...form.register('conflict_keyword')} className={inputCls} placeholder="Conflict keyword (for interaction/duplicate rules)" />
            <textarea {...form.register('message', { required: true })} className={inputCls} rows={2} placeholder="Alert message shown to the doctor" />
            <button type="submit" className="btn-primary">Create Rule</button>
          </form>

          <h3 style={{ fontSize: 13, fontWeight: 700, color: '#1E1B4B', margin: '18px 0 10px' }}>Active Rules</h3>
          {rules?.map((r: any) => (
            <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #F3F4F6', fontSize: 12 }}>
              <span>{r.rule_name} — <i>{r.trigger_keyword}</i>{r.conflict_keyword && ` ↔ ${r.conflict_keyword}`}</span>
              <button onClick={() => deactivateRule.mutate(r.id)}><Trash2 size={14} color="#DC2626" /></button>
            </div>
          ))}
        </div>

        <div className="card" style={{ padding: 16 }}>
          <h3 style={{ fontSize: 13, fontWeight: 700, color: '#1E1B4B', marginBottom: 10 }}><ShieldAlert size={14} style={{ marginRight: 6, display: 'inline' }} />Alert Log by Patient</h3>
          <select value={patientId} onChange={e => setPatientId(e.target.value)} className={inputCls} style={{ marginBottom: 10 }}>
            <option value="">— Select patient —</option>
            {patients?.map((p: any) => <option key={p.id} value={p.id}>{p.uhid} — {p.first_name} {p.last_name}</option>)}
          </select>
          {alerts?.map((a: any) => (
            <div key={a.id} style={{ padding: 8, borderBottom: '1px solid #F3F4F6', fontSize: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: a.severity === 'critical' ? '#DC2626' : '#D97706', fontWeight: 600 }}>{a.severity}</span>
                <span style={{ color: '#9CA3AF' }}>{new Date(a.created_at).toLocaleString()}</span>
              </div>
              <p style={{ margin: '2px 0' }}>{a.message}</p>
              {a.was_overridden ? <span style={{ color: '#059669', fontSize: 11 }}>Overridden</span> :
                <button onClick={() => overrideAlert.mutate(a.id)} style={{ fontSize: 11, color: '#7C3AED' }}>Override & proceed</button>}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
