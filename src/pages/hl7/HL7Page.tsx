import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { hl7Service } from '../../services/api'
import { FileCode, Copy } from 'lucide-react'
import toast from 'react-hot-toast'

const inputCls = "w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-violet-500 outline-none"

export default function HL7Page() {
  const [admissionId, setAdmissionId] = useState('')
  const [labItemId, setLabItemId] = useState('')
  const [message, setMessage] = useState('')

  const admit = useMutation({ mutationFn: () => hl7Service.admitMessage(parseInt(admissionId)), onSuccess: r => setMessage(r.data) })
  const discharge = useMutation({ mutationFn: () => hl7Service.dischargeMessage(parseInt(admissionId)), onSuccess: r => setMessage(r.data) })
  const update = useMutation({ mutationFn: () => hl7Service.updateMessage(parseInt(admissionId)), onSuccess: r => setMessage(r.data) })
  const labResult = useMutation({ mutationFn: () => hl7Service.labResultMessage(parseInt(labItemId)), onSuccess: r => setMessage(r.data) })

  const copyMessage = () => { navigator.clipboard.writeText(message); toast.success('Copied to clipboard') }

  return (
    <div>
      <h1 className="page-title" style={{ marginBottom: 4 }}>HL7 v2 (Interoperability)</h1>
      <p style={{ color: '#8B5CF6', fontSize: 13, marginBottom: 6 }}>Standard pipe-delimited ADT/ORU message generation</p>
      <p style={{ color: '#D97706', fontSize: 11, marginBottom: 20 }}>⚠ This generates well-formed HL7 v2 text — it does not send it anywhere. Actual delivery needs an MLLP connection to a specific receiving system.</p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.3fr', gap: 20 }}>
        <div className="card" style={{ padding: 16 }}>
          <h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 10 }}>Generate ADT Message</h3>
          <input value={admissionId} onChange={e => setAdmissionId(e.target.value)} className={inputCls} placeholder="IPD Admission ID" style={{ marginBottom: 10 }} />
          <div style={{ display: 'flex', gap: 6, marginBottom: 20 }}>
            <button onClick={() => admit.mutate()} className="btn-primary" style={{ fontSize: 12, padding: '6px 10px' }}>ADT^A01 Admit</button>
            <button onClick={() => discharge.mutate()} className="btn-primary" style={{ fontSize: 12, padding: '6px 10px' }}>ADT^A03 Discharge</button>
            <button onClick={() => update.mutate()} className="btn-primary" style={{ fontSize: 12, padding: '6px 10px' }}>ADT^A08 Update</button>
          </div>

          <h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 10 }}>Generate ORU (Lab Result)</h3>
          <input value={labItemId} onChange={e => setLabItemId(e.target.value)} className={inputCls} placeholder="Lab Order Item ID" style={{ marginBottom: 10 }} />
          <button onClick={() => labResult.mutate()} className="btn-primary" style={{ fontSize: 12, padding: '6px 10px' }}>ORU^R01 Result</button>
        </div>

        <div className="card" style={{ padding: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <h3 style={{ fontSize: 13, fontWeight: 700 }}><FileCode size={14} style={{ marginRight: 6, display: 'inline' }} />Generated Message</h3>
            {message && <button onClick={copyMessage} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#7C3AED' }}><Copy size={12} /> Copy</button>}
          </div>
          {!message && <p style={{ color: '#9CA3AF', fontSize: 12 }}>Generate a message to see it here.</p>}
          {message && <pre style={{ fontSize: 11, background: '#F9FAFB', padding: 12, borderRadius: 8, overflow: 'auto', whiteSpace: 'pre-wrap' }}>{message}</pre>}
        </div>
      </div>
    </div>
  )
}
