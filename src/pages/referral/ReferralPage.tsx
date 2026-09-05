import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { referralService, doctorService } from '../../services/api'
import { useForm } from 'react-hook-form'
import { ArrowRightLeft, Printer, CheckCircle, XCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import { cleanPayload } from '../../utils/form'
import { PatientSearchInput } from '../../components/ui/PatientSearchInput'
import CustomSelect from '../../components/ui/CustomSelect'

const inputCls = "w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-violet-500 outline-none"
const TABS = ['All Referrals', 'New Referral']
const URGENCY_COLORS: Record<string, { bg: string; text: string }> = {
  routine: { bg: '#F5F3FF', text: '#7C3AED' },
  urgent: { bg: '#FFFBEB', text: '#D97706' },
  emergency: { bg: '#FEF2F2', text: '#DC2626' },
}
const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  pending: { bg: '#FFFBEB', text: '#D97706' },
  accepted: { bg: '#EFF6FF', text: '#3B82F6' },
  completed: { bg: '#ECFDF5', text: '#059669' },
  cancelled: { bg: '#F9FAFB', text: '#6B7280' },
}

function printReferralLetter(data: any) {
  const hospitalName = localStorage.getItem('setting_hospital_name') || 'HMS Hospital'
  const win = window.open('', '_blank', 'width=800,height=600')
  if (!win) return
  win.document.write(`<!DOCTYPE html><html><head><title>Referral Letter</title>
  <style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:Arial,sans-serif;padding:30px;font-size:13px}
  .header{text-align:center;border-bottom:3px solid #7C3AED;padding-bottom:12px;margin-bottom:20px}
  h1{font-size:22px;color:#7C3AED}h2{font-size:15px;color:#4C1D95;margin:16px 0 8px;border-bottom:1px solid #EDE9FE;padding-bottom:4px}
  .grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px}
  .field label{font-size:10px;color:#777;text-transform:uppercase;display:block}
  .field span{font-size:13px;font-weight:600;color:#1E1B4B}
  .urgency{display:inline-block;padding:3px 10px;border-radius:99px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;background:${data.urgency==='emergency'?'#FEF2F2':data.urgency==='urgent'?'#FFFBEB':'#F5F3FF'};color:${data.urgency==='emergency'?'#DC2626':data.urgency==='urgent'?'#D97706':'#7C3AED'}}
  .sig-line{border-top:1px solid #000;width:160px;margin:28px 0 4px}
  .footer{margin-top:20px;padding-top:10px;border-top:1px solid #EDE9FE;font-size:10px;color:#9CA3AF;text-align:center}
  @media print{body{padding:10px}}</style></head>
  <body>
  <div class="header"><h1>${hospitalName}</h1><p style="color:#8B5CF6;font-size:12px;margin-top:3px">Referral Letter · ${data.referral_number}</p></div>
  <h2>Patient Information</h2>
  <div class="grid">
    <div class="field"><label>Patient Name</label><span>${data.patient_name}</span></div>
    <div class="field"><label>UHID</label><span>${data.patient_uhid}</span></div>
    <div class="field"><label>Age / Gender</label><span>${data.patient_age || '—'} / ${data.patient_gender || '—'}</span></div>
    <div class="field"><label>Phone</label><span>${data.patient_phone || '—'}</span></div>
  </div>
  <h2>Referral Details</h2>
  <div class="grid">
    <div class="field"><label>Referring Doctor</label><span>Dr. ${data.referring_doctor}</span></div>
    <div class="field"><label>Date</label><span>${data.referral_date}</span></div>
    <div class="field"><label>Referred To</label><span>${data.referred_to_doctor ? 'Dr. ' + data.referred_to_doctor : data.referred_to_hospital || data.referred_to_department || '—'}</span></div>
    <div class="field"><label>Urgency</label><span class="urgency">${data.urgency}</span></div>
  </div>
  <h2>Reason for Referral</h2>
  <p style="line-height:1.7;color:#374151">${data.reason}</p>
  ${data.clinical_summary ? `<h2>Clinical Summary</h2><p style="line-height:1.7;color:#374151">${data.clinical_summary}</p>` : ''}
  ${data.appointment_date ? `<p style="margin-top:12px"><strong>Appointment Date:</strong> ${data.appointment_date}</p>` : ''}
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:40px;margin-top:32px">
    <div><div class="sig-line"></div><p>Referring Doctor Signature</p><p style="font-size:11px;color:#777">Dr. ${data.referring_doctor}</p></div>
    <div><div class="sig-line"></div><p>Receiving Doctor / Stamp</p></div>
  </div>
  <div class="footer">Generated on ${new Date().toLocaleString('en-IN')} · ${hospitalName}</div>
  <script>window.onload=()=>{window.print();window.onafterprint=()=>window.close()}<\/script>
  </body></html>`)
  win.document.close()
}

export default function ReferralPage() {
  const qc = useQueryClient()
  const [tab, setTab] = useState(0)
  const [refType, setRefType] = useState('internal')
  const [urgency, setUrgency] = useState('routine')
  const { register, handleSubmit, reset, setValue } = useForm()

  const { data: referrals, isLoading } = useQuery({
    queryKey: ['referrals'],
    queryFn: () => referralService.list().then(r => r.data),
  })

  const { data: doctors } = useQuery({
    queryKey: ['doctors-referral'],
    queryFn: () => doctorService.list({ size: 100 }).then(r => r.data),
  })

  const createReferral = useMutation({
    mutationFn: (d: any) => referralService.create(cleanPayload(d)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['referrals'] })
      reset(); setTab(0); setRefType('internal'); setUrgency('routine')
      toast.success('Referral created!')
    },
    onError: (e: any) => toast.error(e.response?.data?.detail || 'Failed')
  })

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: any) => referralService.updateStatus(id, { status }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['referrals'] }); toast.success('Status updated') },
  })

  const handlePrint = async (id: number) => {
    try {
      const res = await referralService.getPrintData(id)
      printReferralLetter(res.data)
    } catch { toast.error('Failed to load referral data') }
  }

  const doctorList = Array.isArray(doctors) ? doctors : doctors?.doctors || []

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h1 className="page-title">Referral Management</h1>
        <p style={{ color: '#8B5CF6', fontSize: 13 }}>Internal & external patient referrals</p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: '2px solid #F3F0FF' }}>
        {TABS.map((t, i) => (
          <button key={t} onClick={() => setTab(i)}
            style={{ padding: '8px 18px', fontSize: 13, fontWeight: 600, border: 'none', background: 'none', cursor: 'pointer', marginBottom: -2, borderBottom: tab === i ? '2px solid #7C3AED' : '2px solid transparent', color: tab === i ? '#7C3AED' : '#9CA3AF' }}>
            {t}
          </button>
        ))}
      </div>

      {/* ALL REFERRALS */}
      {tab === 0 && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          {isLoading ? <p style={{ textAlign: 'center', padding: 40, color: '#C4B5FD' }}>Loading...</p>
            : !referrals?.length ? (
              <div style={{ textAlign: 'center', padding: 60, color: '#C4B5FD' }}>
                <ArrowRightLeft size={36} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
                <p style={{ fontSize: 14 }}>No referrals yet</p>
                <button onClick={() => setTab(1)} style={{ marginTop: 12, padding: '8px 20px', fontSize: 13, fontWeight: 600, borderRadius: 8, border: 'none', background: '#7C3AED', color: '#fff', cursor: 'pointer' }}>+ New Referral</button>
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead><tr style={{ background: '#FAFAFF', borderBottom: '1px solid #EDE9FE' }}>
                  {['Ref No.', 'Patient', 'Referring Dr.', 'Referred To', 'Urgency', 'Date', 'Status', 'Actions'].map(h => (
                    <th key={h} style={{ padding: '10px 14px', fontSize: 11, fontWeight: 700, color: '#7C3AED', textAlign: 'left', textTransform: 'uppercase' }}>{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {referrals.map((r: any) => {
                    const uc = URGENCY_COLORS[r.urgency] || URGENCY_COLORS.routine
                    const sc = STATUS_COLORS[r.status] || STATUS_COLORS.pending
                    return (
                      <tr key={r.id} style={{ borderBottom: '1px solid #F9F7FF' }}>
                        <td style={{ padding: '10px 14px', fontSize: 12, fontFamily: 'monospace', color: '#6B7280' }}>{r.referral_number}</td>
                        <td style={{ padding: '10px 14px' }}>
                          <p style={{ fontSize: 13, fontWeight: 600, color: '#1E1B4B', margin: 0 }}>{r.patient_name}</p>
                          <p style={{ fontSize: 11, color: '#8B5CF6', margin: 0 }}>{r.patient_uhid}</p>
                        </td>
                        <td style={{ padding: '10px 14px', fontSize: 13, color: '#1E1B4B' }}>Dr. {r.referring_doctor}</td>
                        <td style={{ padding: '10px 14px', fontSize: 12, color: '#6B7280' }}>
                          {r.referred_to_doctor ? `Dr. ${r.referred_to_doctor}` : r.referred_to_hospital || r.referred_to_department || '—'}
                        </td>
                        <td style={{ padding: '10px 14px' }}>
                          <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 99, background: uc.bg, color: uc.text, textTransform: 'capitalize' }}>{r.urgency}</span>
                        </td>
                        <td style={{ padding: '10px 14px', fontSize: 12, color: '#6B7280' }}>
                          {r.referral_date ? new Date(r.referral_date).toLocaleDateString('en-IN') : '—'}
                        </td>
                        <td style={{ padding: '10px 14px' }}>
                          <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 99, background: sc.bg, color: sc.text, textTransform: 'capitalize' }}>{r.status}</span>
                        </td>
                        <td style={{ padding: '10px 14px' }}>
                          <div style={{ display: 'flex', gap: 4 }}>
                            <button onClick={() => handlePrint(r.id)}
                              style={{ fontSize: 10, padding: '3px 8px', borderRadius: 6, border: '1px solid #DDD6FE', background: '#F5F3FF', color: '#7C3AED', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 2 }}>
                              <Printer size={10} /> Print
                            </button>
                            {r.status === 'pending' && <>
                              <button onClick={() => updateStatus.mutate({ id: r.id, status: 'accepted' })}
                                style={{ fontSize: 10, padding: '3px 8px', borderRadius: 6, border: '1px solid #A7F3D0', background: '#ECFDF5', color: '#059669', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 2 }}>
                                <CheckCircle size={10} /> Accept
                              </button>
                              <button onClick={() => updateStatus.mutate({ id: r.id, status: 'cancelled' })}
                                style={{ fontSize: 10, padding: '3px 8px', borderRadius: 6, border: '1px solid #FECACA', background: '#FEF2F2', color: '#DC2626', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 2 }}>
                                <XCircle size={10} /> Cancel
                              </button>
                            </>}
                            {r.status === 'accepted' && (
                              <button onClick={() => updateStatus.mutate({ id: r.id, status: 'completed' })}
                                style={{ fontSize: 10, padding: '3px 8px', borderRadius: 6, border: '1px solid #A7F3D0', background: '#ECFDF5', color: '#059669', cursor: 'pointer' }}>
                                Complete
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
        </div>
      )}

      {/* NEW REFERRAL */}
      {tab === 1 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <form onSubmit={handleSubmit(d => createReferral.mutate({ ...d, referral_type: refType, urgency }))} style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            <div className="card" style={{ marginBottom: 16 }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: '#1E1B4B', marginBottom: 16 }}>Patient & Details</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#4C1D95', marginBottom: 6 }}>Patient *</label>
                  <input type="hidden" {...register('patient_id', { required: true })} />
                  <PatientSearchInput inputCls={inputCls} onChange={id => setValue('patient_id', id)} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#4C1D95', marginBottom: 6 }}>Reason for Referral *</label>
                  <textarea {...register('reason', { required: true })} rows={3} className={inputCls} placeholder="Clinical reason for referral..." />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#4C1D95', marginBottom: 6 }}>Clinical Summary</label>
                  <textarea {...register('clinical_summary')} rows={3} className={inputCls} placeholder="Brief history, investigations, treatment given..." />
                </div>
              </div>
            </div>

            <div className="card">
              <h3 style={{ fontSize: 14, fontWeight: 700, color: '#1E1B4B', marginBottom: 16 }}>Referral Settings</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#4C1D95', marginBottom: 6 }}>Type</label>
                    <CustomSelect value={refType} onChange={v => setRefType(String(v))}
                      options={[{ value: 'internal', label: 'Internal (within hospital)' }, { value: 'external', label: 'External (other hospital)' }]} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#4C1D95', marginBottom: 6 }}>Urgency</label>
                    <CustomSelect value={urgency} onChange={v => setUrgency(String(v))}
                      options={[{ value: 'routine', label: 'Routine' }, { value: 'urgent', label: 'Urgent' }, { value: 'emergency', label: 'Emergency' }]} />
                  </div>
                </div>

                {refType === 'internal' && (
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#4C1D95', marginBottom: 6 }}>Referred To (Doctor)</label>
                    <select {...register('referred_to_doctor_id')} className={`${inputCls} bg-white`}>
                      <option value="">— Select Doctor —</option>
                      {doctorList.map((d: any) => (
                        <option key={d.id} value={d.doctor_profile_id || d.id}>{d.full_name} — {d.specialization || d.department}</option>
                      ))}
                    </select>
                  </div>
                )}

                {refType === 'external' && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#4C1D95', marginBottom: 6 }}>Hospital Name</label>
                      <input {...register('referred_to_hospital')} className={inputCls} placeholder="e.g. Apollo Hospital" />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#4C1D95', marginBottom: 6 }}>Department</label>
                      <input {...register('referred_to_department')} className={inputCls} placeholder="e.g. Cardiology" />
                    </div>
                  </div>
                )}

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#4C1D95', marginBottom: 6 }}>Appointment Date</label>
                  <input {...register('appointment_date')} type="date" className={inputCls} style={{ maxWidth: 200 }} />
                </div>

                <button type="submit" disabled={createReferral.isPending}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '12px', fontSize: 13, fontWeight: 600, borderRadius: 10, border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg,#7C3AED,#4F46E5)', color: '#fff', marginTop: 4 }}>
                  <ArrowRightLeft size={15} />
                  {createReferral.isPending ? 'Creating...' : 'Create Referral'}
                </button>
              </div>
            </div>
          </form>

          {/* Preview */}
          <div className="card" style={{ background: '#FAFAFF' }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: '#1E1B4B', marginBottom: 16 }}>Referral Preview</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ padding: '10px 14px', background: '#F5F3FF', borderRadius: 8, border: '1px solid #EDE9FE' }}>
                <p style={{ fontSize: 11, color: '#8B5CF6', fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>Type</p>
                <p style={{ fontSize: 13, color: '#1E1B4B', fontWeight: 600, textTransform: 'capitalize' }}>{refType}</p>
              </div>
              <div style={{ padding: '10px 14px', background: URGENCY_COLORS[urgency]?.bg || '#F5F3FF', borderRadius: 8, border: `1px solid ${URGENCY_COLORS[urgency]?.text || '#7C3AED'}30` }}>
                <p style={{ fontSize: 11, color: '#8B5CF6', fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>Urgency</p>
                <p style={{ fontSize: 13, color: URGENCY_COLORS[urgency]?.text || '#7C3AED', fontWeight: 700, textTransform: 'uppercase' }}>{urgency}</p>
              </div>
              <div style={{ padding: '12px 14px', background: '#fff', borderRadius: 8, border: '1px solid #EDE9FE', fontSize: 12, color: '#6B7280', lineHeight: 1.6 }}>
                After creating, click <strong style={{ color: '#7C3AED' }}>Print</strong> on the referral to generate a formal referral letter with patient details, clinical summary, and doctor signatures.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
