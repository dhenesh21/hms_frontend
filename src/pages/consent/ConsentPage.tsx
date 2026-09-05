import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { consentService, patientService } from '../../services/api'
import { FileSignature, Plus } from 'lucide-react'
import toast from 'react-hot-toast'
import { cleanPayload } from '../../utils/form'

const inputCls = "w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-violet-500 outline-none"

export default function ConsentPage() {
  const qc = useQueryClient()
  const [showTemplateForm, setShowTemplateForm] = useState(false)
  const templateForm = useForm<any>()
  const raiseForm = useForm<any>()
  const signForm = useForm<any>()
  const [signingId, setSigningId] = useState<number | null>(null)

  const { data: templates } = useQuery({ queryKey: ['consent-templates'], queryFn: () => consentService.listTemplates().then(r => r.data) })
  const { data: patients } = useQuery({ queryKey: ['patients-all'], queryFn: () => patientService.list({ limit: 200 }).then(r => r.data) })
  const { data: consents } = useQuery({ queryKey: ['patient-consents'], queryFn: () => consentService.listPatientConsents().then(r => r.data) })

  const createTemplate = useMutation({
    mutationFn: (d: any) => consentService.createTemplate(cleanPayload(d)),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['consent-templates'] }); templateForm.reset(); setShowTemplateForm(false); toast.success('Template created') },
  })
  const raiseConsent = useMutation({
    mutationFn: (d: any) => consentService.createPatientConsent(cleanPayload({ ...d, patient_id: parseInt(d.patient_id), template_id: parseInt(d.template_id) })),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['patient-consents'] }); raiseForm.reset(); toast.success('Consent raised for signature') },
  })
  const signConsent = useMutation({
    mutationFn: ({ id, data }: any) => consentService.sign(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['patient-consents'] }); setSigningId(null); toast.success('Consent signed') },
    onError: (e: any) => toast.error(e.response?.data?.detail || 'Failed to sign'),
  })
  const withdrawConsent = useMutation({
    mutationFn: (id: number) => consentService.withdraw(id, { withdrawal_reason: 'Withdrawn via portal' }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['patient-consents'] }); toast.success('Consent withdrawn') },
  })

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h1 className="page-title">Consent Management</h1>
          <p style={{ color: '#8B5CF6', fontSize: 13 }}>Templates, signatures & withdrawal tracking</p>
        </div>
        <button className="btn-primary" onClick={() => setShowTemplateForm(v => !v)}><Plus size={14} style={{ marginRight: 6 }} />New Template</button>
      </div>

      {showTemplateForm && (
        <div className="card" style={{ maxWidth: 560, padding: 20, marginBottom: 20 }}>
          <form onSubmit={templateForm.handleSubmit(d => createTemplate.mutate(d))} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <input {...templateForm.register('name', { required: true })} className={inputCls} placeholder="Template name (e.g. Surgery Consent)" />
            <input {...templateForm.register('category')} className={inputCls} placeholder="Category (procedure, anesthesia, research…)" />
            <textarea {...templateForm.register('body_text', { required: true })} className={inputCls} rows={4} placeholder="Consent body text" />
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
              <input type="checkbox" {...templateForm.register('requires_witness')} /> Requires witness
            </label>
            <button type="submit" className="btn-primary">Save Template</button>
          </form>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: 20 }}>
        <div className="card" style={{ padding: 16 }}>
          <h3 style={{ fontSize: 13, fontWeight: 700, color: '#1E1B4B', marginBottom: 10 }}>Raise Consent for Patient</h3>
          <form onSubmit={raiseForm.handleSubmit(d => raiseConsent.mutate(d))} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <select {...raiseForm.register('patient_id', { required: true })} className={inputCls}>
              <option value="">— Patient —</option>
              {patients?.map((p: any) => <option key={p.id} value={p.id}>{p.uhid} — {p.first_name} {p.last_name}</option>)}
            </select>
            <select {...raiseForm.register('template_id', { required: true })} className={inputCls}>
              <option value="">— Consent template —</option>
              {templates?.map((t: any) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
            <input {...raiseForm.register('source')} className={inputCls} placeholder="Source (opd/ipd/ot/emergency)" />
            <button type="submit" className="btn-primary">Raise for Signature</button>
          </form>
        </div>

        <div className="card" style={{ padding: 16 }}>
          <h3 style={{ fontSize: 13, fontWeight: 700, color: '#1E1B4B', marginBottom: 10 }}><FileSignature size={14} style={{ marginRight: 6, display: 'inline' }} />Patient Consents</h3>
          {consents?.map((c: any) => (
            <div key={c.id} style={{ padding: 10, borderBottom: '1px solid #F3F4F6', fontSize: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Patient #{c.patient_id} · Template #{c.template_id}</span>
                <span style={{ fontWeight: 700, color: c.status === 'signed' ? '#059669' : c.status === 'refused' ? '#DC2626' : '#8B5CF6' }}>{c.status}</span>
              </div>
              {c.status === 'pending' && (
                signingId === c.id ? (
                  <form onSubmit={signForm.handleSubmit(d => signConsent.mutate({ id: c.id, data: d }))} style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                    <input {...signForm.register('consented_by_name', { required: true })} className={inputCls} placeholder="Signed by (name)" />
                    <input {...signForm.register('signature_data', { required: true })} className={inputCls} placeholder="Signature token" />
                    <button type="submit" className="btn-primary" style={{ padding: '6px 12px' }}>Sign</button>
                  </form>
                ) : (
                  <button onClick={() => setSigningId(c.id)} style={{ fontSize: 11, marginTop: 6, color: '#7C3AED' }}>Sign now</button>
                )
              )}
              {c.status === 'signed' && (
                <button onClick={() => withdrawConsent.mutate(c.id)} style={{ fontSize: 11, marginTop: 6, color: '#DC2626' }}>Withdraw</button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
