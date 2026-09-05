import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { clinicalFormsService, patientService } from '../../services/api'
import { FileText, Plus, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'

const inputCls = "w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-violet-500 outline-none"

export default function ClinicalFormsPage() {
  const qc = useQueryClient()
  const [fields, setFields] = useState<any[]>([{ key: '', label: '', type: 'text', required: false }])
  const templateForm = useForm<any>()
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null)
  const [submitPatientId, setSubmitPatientId] = useState('')
  const [submitData, setSubmitData] = useState<Record<string, string>>({})

  const { data: templates } = useQuery({ queryKey: ['form-templates'], queryFn: () => clinicalFormsService.listTemplates().then(r => r.data) })
  const { data: patients } = useQuery({ queryKey: ['patients-all'], queryFn: () => patientService.list({ limit: 200 }).then(r => r.data) })
  const { data: submissions } = useQuery({
    queryKey: ['form-submissions', selectedTemplate?.id],
    queryFn: () => clinicalFormsService.listSubmissions({ template_id: selectedTemplate.id }).then(r => r.data),
    enabled: !!selectedTemplate,
  })

  const createTemplate = useMutation({
    mutationFn: (d: any) => clinicalFormsService.createTemplate({ ...d, schema_json: fields.filter(f => f.key) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['form-templates'] }); templateForm.reset(); setFields([{ key: '', label: '', type: 'text', required: false }]); toast.success('Form template created') },
  })
  const submitForm = useMutation({
    mutationFn: () => clinicalFormsService.submitForm({ template_id: selectedTemplate.id, patient_id: parseInt(submitPatientId), data_json: submitData }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['form-submissions'] }); setSubmitData({}); toast.success('Form submitted') },
    onError: (e: any) => toast.error(e.response?.data?.detail || 'Submission failed'),
  })

  return (
    <div>
      <h1 className="page-title" style={{ marginBottom: 4 }}>Clinical Form Builder</h1>
      <p style={{ color: '#8B5CF6', fontSize: 13, marginBottom: 20 }}>Dynamic assessment forms, flowsheets & checklists</p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <div className="card" style={{ padding: 16 }}>
          <h3 style={{ fontSize: 13, fontWeight: 700, color: '#1E1B4B', marginBottom: 10 }}><Plus size={14} style={{ marginRight: 6, display: 'inline' }} />New Form Template</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 10 }}>
            <input {...templateForm.register('name')} className={inputCls} placeholder="Form name (e.g. ICU Nursing Assessment)" />
            <input {...templateForm.register('department')} className={inputCls} placeholder="Department" />
            <input {...templateForm.register('category')} className={inputCls} placeholder="Category (assessment/checklist/flowsheet)" />
          </div>
          <p style={{ fontSize: 12, fontWeight: 600, color: '#4C1D95', marginBottom: 6 }}>Fields</p>
          {fields.map((f, i) => (
            <div key={i} style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
              <input value={f.key} onChange={e => setFields(fs => fs.map((x, j) => j === i ? { ...x, key: e.target.value } : x))} className={inputCls} placeholder="key" />
              <input value={f.label} onChange={e => setFields(fs => fs.map((x, j) => j === i ? { ...x, label: e.target.value } : x))} className={inputCls} placeholder="label" />
              <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, whiteSpace: 'nowrap' }}>
                <input type="checkbox" checked={f.required} onChange={e => setFields(fs => fs.map((x, j) => j === i ? { ...x, required: e.target.checked } : x))} /> req
              </label>
              <button onClick={() => setFields(fs => fs.filter((_, j) => j !== i))}><Trash2 size={14} color="#DC2626" /></button>
            </div>
          ))}
          <button onClick={() => setFields(fs => [...fs, { key: '', label: '', type: 'text', required: false }])} style={{ fontSize: 12, color: '#7C3AED', marginBottom: 12 }}>+ Add field</button>
          <button className="btn-primary" onClick={templateForm.handleSubmit(d => createTemplate.mutate(d))}>Save Template</button>
        </div>

        <div className="card" style={{ padding: 16 }}>
          <h3 style={{ fontSize: 13, fontWeight: 700, color: '#1E1B4B', marginBottom: 10 }}><FileText size={14} style={{ marginRight: 6, display: 'inline' }} />Templates</h3>
          {templates?.map((t: any) => (
            <div key={t.id} onClick={() => setSelectedTemplate(t)}
              style={{ padding: 10, borderBottom: '1px solid #F3F4F6', cursor: 'pointer', background: selectedTemplate?.id === t.id ? '#F5F3FF' : 'transparent' }}>
              <span style={{ fontSize: 13, fontWeight: 600 }}>{t.name}</span>
              <span style={{ fontSize: 11, color: '#9CA3AF', marginLeft: 8 }}>v{t.version} · {t.schema_json?.length || 0} fields</span>
            </div>
          ))}

          {selectedTemplate && (
            <div style={{ marginTop: 16, borderTop: '1px solid #F3F4F6', paddingTop: 12 }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: '#4C1D95', marginBottom: 8 }}>Submit: {selectedTemplate.name}</p>
              <select value={submitPatientId} onChange={e => setSubmitPatientId(e.target.value)} className={inputCls} style={{ marginBottom: 8 }}>
                <option value="">— Patient —</option>
                {patients?.map((p: any) => <option key={p.id} value={p.id}>{p.uhid} — {p.first_name} {p.last_name}</option>)}
              </select>
              {selectedTemplate.schema_json?.map((f: any) => (
                <input key={f.key} value={submitData[f.key] || ''} onChange={e => setSubmitData(d => ({ ...d, [f.key]: e.target.value }))}
                  className={inputCls} placeholder={f.label + (f.required ? ' *' : '')} style={{ marginBottom: 6 }} />
              ))}
              <button className="btn-primary" disabled={!submitPatientId} onClick={() => submitForm.mutate()}>Submit Form</button>

              <p style={{ fontSize: 12, fontWeight: 700, color: '#4C1D95', margin: '14px 0 6px' }}>Recent Submissions</p>
              {submissions?.map((s: any) => (
                <div key={s.id} style={{ fontSize: 11, color: '#6B7280', padding: '4px 0' }}>Patient #{s.patient_id} · {new Date(s.created_at).toLocaleString()}</div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
