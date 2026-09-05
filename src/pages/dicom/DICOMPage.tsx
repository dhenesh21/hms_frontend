import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { dicomService } from '../../services/api'
import { ScanLine, Plus, Monitor } from 'lucide-react'
import toast from 'react-hot-toast'
import { cleanPayload } from '../../utils/form'

const inputCls = "w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-violet-500 outline-none"

export default function DICOMPage() {
  const qc = useQueryClient()
  const [orderId, setOrderId] = useState('')
  const [selectedStudy, setSelectedStudy] = useState<any>(null)
  const studyForm = useForm<any>()
  const worklistForm = useForm<any>()

  const { data: studies } = useQuery({
    queryKey: ['dicom-studies', orderId], queryFn: () => dicomService.listStudiesForOrder(parseInt(orderId)).then(r => r.data), enabled: !!orderId,
  })
  const { data: series } = useQuery({
    queryKey: ['dicom-series', selectedStudy?.id], queryFn: () => dicomService.listSeriesForStudy(selectedStudy.id).then(r => r.data), enabled: !!selectedStudy,
  })
  const { data: worklist } = useQuery({ queryKey: ['dicom-worklist'], queryFn: () => dicomService.listWorklist().then(r => r.data) })

  const createStudy = useMutation({
    mutationFn: (d: any) => dicomService.createStudy(cleanPayload({ ...d, radiology_order_id: parseInt(orderId), patient_id: parseInt(d.patient_id) })),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['dicom-studies'] }); studyForm.reset(); toast.success('DICOM study registered') },
  })
  const createWorklistItem = useMutation({
    mutationFn: (d: any) => dicomService.createWorklistItem(cleanPayload(d)),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['dicom-worklist'] }); worklistForm.reset(); toast.success('Added to modality worklist') },
  })
  const completeWorklistItem = useMutation({
    mutationFn: (id: number) => dicomService.updateWorklistItem(id, { status: 'completed' }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['dicom-worklist'] }); toast.success('Marked complete') },
  })

  return (
    <div>
      <h1 className="page-title" style={{ marginBottom: 4 }}>DICOM / PACS</h1>
      <p style={{ color: '#8B5CF6', fontSize: 13, marginBottom: 6 }}>International standard (NEMA/ACR) metadata tracking — study/series/instance UIDs and modality worklist</p>
      <p style={{ color: '#D97706', fontSize: 11, marginBottom: 20 }}>⚠ This tracks DICOM-standard identifiers; it does not implement the DICOM network protocol (C-STORE/C-FIND) — that needs a real PACS connection.</p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: 20, marginBottom: 20 }}>
        <div className="card" style={{ padding: 16 }}>
          <h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 10 }}><ScanLine size={14} style={{ marginRight: 6, display: 'inline' }} />Studies</h3>
          <input value={orderId} onChange={e => setOrderId(e.target.value)} className={inputCls} placeholder="Radiology Order ID" style={{ marginBottom: 10 }} />
          {orderId && (
            <form onSubmit={studyForm.handleSubmit(d => createStudy.mutate(d))} style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 10 }}>
              <input {...studyForm.register('patient_id', { required: true })} className={inputCls} placeholder="Patient ID" />
              <input {...studyForm.register('modality')} className={inputCls} placeholder="Modality (CT, MR, CR, US…)" />
              <input {...studyForm.register('study_description')} className={inputCls} placeholder="Study description" />
              <button type="submit" className="btn-primary" style={{ padding: '6px 10px', fontSize: 12 }}>Register Study</button>
            </form>
          )}
          {studies?.map((s: any) => (
            <div key={s.id} onClick={() => setSelectedStudy(s)}
              style={{ padding: 8, borderBottom: '1px solid #F3F4F6', cursor: 'pointer', fontSize: 12, background: selectedStudy?.id === s.id ? '#F5F3FF' : 'transparent' }}>
              {s.modality} — {s.accession_number}
            </div>
          ))}
        </div>

        <div className="card" style={{ padding: 16 }}>
          <h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 10 }}>Series</h3>
          {!selectedStudy && <p style={{ color: '#9CA3AF', fontSize: 12 }}>Select a study to view its series.</p>}
          {series?.map((s: any) => (
            <div key={s.id} style={{ padding: 8, borderBottom: '1px solid #F3F4F6', fontSize: 12 }}>
              Series {s.series_number ?? s.id} — {s.modality} — <span style={{ color: '#9CA3AF', fontFamily: 'monospace' }}>{s.series_instance_uid.slice(0, 30)}…</span>
            </div>
          ))}
        </div>
      </div>

      <div className="card" style={{ padding: 16 }}>
        <h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 10 }}><Monitor size={14} style={{ marginRight: 6, display: 'inline' }} />Modality Worklist</h3>
        <form onSubmit={worklistForm.handleSubmit(d => createWorklistItem.mutate(d))} style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
          <input {...worklistForm.register('radiology_order_id', { required: true })} className={inputCls} placeholder="Order ID" style={{ maxWidth: 120 }} />
          <input {...worklistForm.register('scheduled_station_ae_title')} className={inputCls} placeholder="Scanner AE Title" style={{ maxWidth: 160 }} />
          <input {...worklistForm.register('modality')} className={inputCls} placeholder="Modality" style={{ maxWidth: 100 }} />
          <button type="submit" className="btn-primary" style={{ whiteSpace: 'nowrap' }}>Add to Worklist</button>
        </form>
        {worklist?.map((w: any) => (
          <div key={w.id} style={{ display: 'flex', justifyContent: 'space-between', padding: 8, borderBottom: '1px solid #F3F4F6', fontSize: 12 }}>
            <span>{w.accession_number} — {w.modality} — {w.scheduled_station_ae_title || 'unassigned'}</span>
            <button onClick={() => completeWorklistItem.mutate(w.id)} style={{ color: '#059669' }}>Mark complete</button>
          </div>
        ))}
      </div>
    </div>
  )
}
