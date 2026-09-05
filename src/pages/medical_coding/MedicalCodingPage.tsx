import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { medicalCodingService } from '../../services/api'
import { FileCode, ClipboardList, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import { cleanPayload } from '../../utils/form'
import CustomSelect from '../../components/ui/CustomSelect'

const inputCls = "w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-violet-500 outline-none"
const TABS = ['Dashboard', 'Code Master', 'Code a Bill', 'RCM Worklist']

export default function MedicalCodingPage() {
  const qc = useQueryClient()
  const [tab, setTab] = useState(0)
  const codeForm = useForm<any>({ defaultValues: { code_system: 'icd10' } })
  const codingForm = useForm<any>({ defaultValues: { code_type: 'diagnosis' } })

  const { data: dashboard } = useQuery({
    queryKey: ['mc-dashboard'],
    queryFn: () => medicalCodingService.getDashboard().then(r => r.data),
  })
  const { data: codes } = useQuery({
    queryKey: ['mc-codes'],
    queryFn: () => medicalCodingService.listCodes().then(r => r.data),
  })
  const { data: worklist } = useQuery({
    queryKey: ['mc-rcm'],
    queryFn: () => medicalCodingService.getRCMWorklist().then(r => r.data),
    enabled: tab === 3,
  })

  const createCode = useMutation({
    mutationFn: (d: any) => medicalCodingService.createCode(cleanPayload(d)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['mc-codes', 'mc-dashboard'] })
      codeForm.reset({ code_system: 'icd10' })
      toast.success('Code added')
    },
    onError: (e: any) => toast.error(e.response?.data?.detail || 'Failed to add code'),
  })

  const codeBill = useMutation({
    mutationFn: (d: any) => medicalCodingService.codeBill(cleanPayload({
      ...d, bill_id: parseInt(d.bill_id), patient_id: parseInt(d.patient_id), code_id: parseInt(d.code_id),
    })),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['mc-dashboard', 'mc-rcm'] })
      codingForm.reset({ code_type: 'diagnosis' })
      toast.success('Bill coded')
    },
    onError: (e: any) => toast.error(e.response?.data?.detail || 'Failed to code bill'),
  })

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h1 className="page-title">Medical Coding & RCM</h1>
        <p style={{ color: '#8B5CF6', fontSize: 13 }}>ICD/CPT coding · Revenue cycle claim readiness</p>
      </div>

      <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: '2px solid #F3F0FF' }}>
        {TABS.map((t, i) => (
          <button key={t} onClick={() => setTab(i)} style={{ padding: '8px 18px', fontSize: 13, fontWeight: 600, border: 'none', background: 'none', cursor: 'pointer', marginBottom: -2, borderBottom: tab === i ? '2px solid #7C3AED' : '2px solid transparent', color: tab === i ? '#7C3AED' : '#9CA3AF' }}>
            {t}
          </button>
        ))}
      </div>

      {tab === 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
          {[
            { label: 'Total Codes', value: dashboard?.total_codes ?? 0, icon: FileCode, color: '#7C3AED', bg: '#F5F3FF' },
            { label: 'Coded Bills', value: dashboard?.total_coded_bills ?? 0, icon: CheckCircle, color: '#15803D', bg: '#F0FDF4' },
            { label: 'Insurance Bills Pending Coding', value: dashboard?.insurance_bills_pending_coding ?? 0, icon: ClipboardList, color: '#D97706', bg: '#FFFBEB' },
          ].map(({ label, value, icon: Icon, color, bg }) => (
            <div key={label} className="card" style={{ padding: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <div style={{ width: 34, height: 34, borderRadius: 9, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon size={17} color={color} />
                </div>
                <span style={{ fontSize: 12, color: '#6B7280', fontWeight: 600 }}>{label}</span>
              </div>
              <p style={{ fontSize: 26, fontWeight: 700, color: '#1E1B4B' }}>{value}</p>
            </div>
          ))}
        </div>
      )}

      {tab === 1 && (
        <div>
          <div className="card" style={{ maxWidth: 420, padding: 20, marginBottom: 20 }}>
            <h2 style={{ fontSize: 14, fontWeight: 700, color: '#1E1B4B', marginBottom: 16 }}>Add Code</h2>
            <form onSubmit={codeForm.handleSubmit(d => createCode.mutate(d))} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <CustomSelect value={codeForm.watch('code_system') || 'icd10'} onChange={v => codeForm.setValue('code_system', String(v))}
                options={[{ value: 'icd10', label: 'ICD-10 (Diagnosis)' }, { value: 'cpt', label: 'CPT (Procedure)' }]} />
              <input {...codeForm.register('code', { required: true })} className={inputCls} placeholder="Code (e.g. J18.9)" />
              <input {...codeForm.register('description', { required: true })} className={inputCls} placeholder="Description" />
              <button type="submit" disabled={createCode.isPending} className="btn-primary">Add Code</button>
            </form>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxWidth: 600 }}>
            {codes?.map((c: any) => (
              <div key={c.id} className="card" style={{ padding: 10, fontSize: 12 }}>
                <strong>{c.code}</strong> <span style={{ color: '#9CA3AF' }}>({c.code_system.toUpperCase()})</span> — {c.description}
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 2 && (
        <div className="card" style={{ maxWidth: 420, padding: 20 }}>
          <h2 style={{ fontSize: 14, fontWeight: 700, color: '#1E1B4B', marginBottom: 16 }}>Code a Bill</h2>
          <form onSubmit={codingForm.handleSubmit(d => codeBill.mutate(d))} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <input {...codingForm.register('bill_id', { required: true })} type="number" className={inputCls} placeholder="Bill ID" />
            <input {...codingForm.register('patient_id', { required: true })} type="number" className={inputCls} placeholder="Patient ID" />
            <CustomSelect value={codingForm.watch('code_type') || 'diagnosis'} onChange={v => codingForm.setValue('code_type', String(v))}
              options={[{ value: 'diagnosis', label: 'Diagnosis (ICD-10)' }, { value: 'procedure', label: 'Procedure (CPT)' }]} />
            <select {...codingForm.register('code_id', { required: true })} className={inputCls}>
              <option value="">— Select code —</option>
              {codes?.filter((c: any) => (codingForm.watch('code_type') === 'procedure' ? c.code_system === 'cpt' : c.code_system === 'icd10')).map((c: any) => (
                <option key={c.id} value={c.id}>{c.code} - {c.description}</option>
              ))}
            </select>
            <button type="submit" disabled={codeBill.isPending} className="btn-primary">
              {codeBill.isPending ? 'Saving...' : 'Attach Code'}
            </button>
          </form>
        </div>
      )}

      {tab === 3 && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <table className="w-full">
            <thead>
              <tr style={{ background: '#FAF5FF' }}>
                <th style={{ textAlign: 'left', padding: '10px 14px', fontSize: 11, color: '#7C3AED', fontWeight: 700 }}>Bill #</th>
                <th style={{ textAlign: 'left', padding: '10px 14px', fontSize: 11, color: '#7C3AED', fontWeight: 700 }}>Amount</th>
                <th style={{ textAlign: 'left', padding: '10px 14px', fontSize: 11, color: '#7C3AED', fontWeight: 700 }}>Diagnosis Coded</th>
                <th style={{ textAlign: 'left', padding: '10px 14px', fontSize: 11, color: '#7C3AED', fontWeight: 700 }}>Procedure Coded</th>
                <th style={{ textAlign: 'left', padding: '10px 14px', fontSize: 11, color: '#7C3AED', fontWeight: 700 }}>Claim Ready</th>
              </tr>
            </thead>
            <tbody>
              {!worklist?.length && (
                <tr><td colSpan={5} style={{ textAlign: 'center', padding: 32, color: '#9CA3AF', fontSize: 13 }}>No insurance-linked bills in the worklist</td></tr>
              )}
              {worklist?.map((w: any) => (
                <tr key={w.bill_id} style={{ borderTop: '1px solid #F3F4F6' }}>
                  <td style={{ padding: '10px 14px', fontSize: 13, fontWeight: 600, color: '#1E1B4B' }}>{w.bill_number}</td>
                  <td style={{ padding: '10px 14px', fontSize: 13, color: '#374151' }}>₹{w.gross_total.toLocaleString()}</td>
                  <td style={{ padding: '10px 14px' }}>{w.has_diagnosis_code ? '✓' : '—'}</td>
                  <td style={{ padding: '10px 14px' }}>{w.has_procedure_code ? '✓' : '—'}</td>
                  <td style={{ padding: '10px 14px' }}>
                    <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: w.ready_for_claim_submission ? '#F0FDF4' : '#FFFBEB', color: w.ready_for_claim_submission ? '#15803D' : '#D97706' }}>
                      {w.ready_for_claim_submission ? 'Ready' : 'Pending'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
