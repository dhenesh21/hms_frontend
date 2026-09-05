import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { anesthesiaService } from '../../services/api'
import { Syringe, Plus } from 'lucide-react'
import toast from 'react-hot-toast'
import { cleanPayload } from '../../utils/form'

const inputCls = "w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-violet-500 outline-none"

export default function AnesthesiaPage() {
  const qc = useQueryClient()
  const [surgeryId, setSurgeryId] = useState('')
  const paForm = useForm<any>()
  const recordForm = useForm<any>()
  const vitalForm = useForm<any>()

  const { data: paList } = useQuery({
    queryKey: ['pre-anesthesia', surgeryId], queryFn: () => anesthesiaService.listPreAssessments(parseInt(surgeryId)).then(r => r.data), enabled: !!surgeryId,
  })
  const { data: record } = useQuery({
    queryKey: ['anesthesia-record', surgeryId],
    queryFn: () => anesthesiaService.getRecordForSurgery(parseInt(surgeryId)).then(r => r.data).catch(() => null),
    enabled: !!surgeryId,
  })
  const { data: vitals } = useQuery({
    queryKey: ['anesthesia-vitals', record?.id], queryFn: () => anesthesiaService.listVitals(record.id).then(r => r.data), enabled: !!record,
  })

  const createPA = useMutation({
    mutationFn: (d: any) => anesthesiaService.createPreAssessment(cleanPayload({ ...d, surgery_id: parseInt(surgeryId), anesthesiologist_id: parseInt(d.anesthesiologist_id) })),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['pre-anesthesia'] }); paForm.reset(); toast.success('Pre-anesthesia assessment saved') },
  })
  const startRecord = useMutation({
    mutationFn: (d: any) => anesthesiaService.startRecord(cleanPayload({ ...d, surgery_id: parseInt(surgeryId), anesthesiologist_id: parseInt(d.anesthesiologist_id) })),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['anesthesia-record'] }); toast.success('Anesthesia record started') },
  })
  const addVital = useMutation({
    mutationFn: (d: any) => anesthesiaService.addVital(record.id, cleanPayload(d)),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['anesthesia-vitals'] }); vitalForm.reset(); toast.success('Vital recorded') },
  })

  return (
    <div>
      <h1 className="page-title" style={{ marginBottom: 4 }}>Anesthesia</h1>
      <p style={{ color: '#8B5CF6', fontSize: 13, marginBottom: 20 }}>Pre-anesthesia assessment, intra-op record & vitals trend</p>

      <input value={surgeryId} onChange={e => setSurgeryId(e.target.value)} className={inputCls} style={{ maxWidth: 300, marginBottom: 20 }} placeholder="Surgery ID (from OT module)" />

      {surgeryId && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <div className="card" style={{ padding: 16 }}>
            <h3 style={{ fontSize: 13, fontWeight: 700, color: '#1E1B4B', marginBottom: 10 }}><Plus size={14} style={{ marginRight: 6, display: 'inline' }} />Pre-Anesthesia Assessment</h3>
            <form onSubmit={paForm.handleSubmit(d => createPA.mutate(d))} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <input {...paForm.register('anesthesiologist_id', { required: true })} className={inputCls} placeholder="Anesthesiologist (doctor) ID" />
              <select {...paForm.register('asa_grade')} className={inputCls}>
                <option value="">— ASA Grade —</option>
                {['asa_i', 'asa_ii', 'asa_iii', 'asa_iv', 'asa_v', 'asa_vi'].map(g => <option key={g} value={g}>{g.toUpperCase()}</option>)}
              </select>
              <textarea {...paForm.register('airway_assessment')} className={inputCls} rows={2} placeholder="Airway assessment" />
              <input {...paForm.register('planned_technique')} className={inputCls} placeholder="Planned technique (GA/spinal/local)" />
              <label style={{ display: 'flex', gap: 6, fontSize: 12 }}><input type="checkbox" {...paForm.register('fitness_for_anesthesia')} /> Fit for anesthesia</label>
              <button type="submit" className="btn-primary">Save Assessment</button>
            </form>
            {paList?.map((p: any) => (
              <div key={p.id} style={{ fontSize: 12, padding: '6px 0', borderTop: '1px solid #F3F4F6', marginTop: 8 }}>
                {p.asa_grade?.toUpperCase()} · {p.fasting_status} · fit: {String(p.fitness_for_anesthesia)}
              </div>
            ))}
          </div>

          <div className="card" style={{ padding: 16 }}>
            <h3 style={{ fontSize: 13, fontWeight: 700, color: '#1E1B4B', marginBottom: 10 }}><Syringe size={14} style={{ marginRight: 6, display: 'inline' }} />Intra-Op Record</h3>
            {!record ? (
              <form onSubmit={recordForm.handleSubmit(d => startRecord.mutate(d))} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <input {...recordForm.register('anesthesiologist_id', { required: true })} className={inputCls} placeholder="Anesthesiologist ID" />
                <input {...recordForm.register('technique_used')} className={inputCls} placeholder="Technique used" />
                <button type="submit" className="btn-primary">Start Record</button>
              </form>
            ) : (
              <>
                <p style={{ fontSize: 12, color: '#6B7280', marginBottom: 10 }}>Technique: {record.technique_used || '—'}</p>
                <form onSubmit={vitalForm.handleSubmit(d => addVital.mutate(d))} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6, marginBottom: 10 }}>
                  <input {...vitalForm.register('heart_rate')} className={inputCls} placeholder="HR" />
                  <input {...vitalForm.register('spo2')} className={inputCls} placeholder="SpO2" />
                  <input {...vitalForm.register('blood_pressure_systolic')} className={inputCls} placeholder="BP Sys" />
                  <button type="submit" className="btn-primary" style={{ gridColumn: 'span 3' }}>Add Vital Reading</button>
                </form>
                {vitals?.map((v: any) => (
                  <div key={v.id} style={{ fontSize: 11, color: '#6B7280', padding: '3px 0' }}>
                    {new Date(v.recorded_at).toLocaleTimeString()} — HR {v.heart_rate} · SpO2 {v.spo2} · BP {v.blood_pressure_systolic}
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
