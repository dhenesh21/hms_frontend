import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { insuranceService } from '../../services/api'
import { Shield, Plus, FileText, CheckCircle, Clock, XCircle, AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import { format } from 'date-fns'

const inputCls = "w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-600',
  preauth_requested: 'bg-blue-100 text-blue-700',
  preauth_approved: 'bg-indigo-100 text-indigo-700',
  preauth_rejected: 'bg-red-100 text-red-600',
  submitted: 'bg-amber-100 text-amber-700',
  under_review: 'bg-purple-100 text-purple-700',
  approved: 'bg-teal-100 text-teal-700',
  partial_approved: 'bg-cyan-100 text-cyan-700',
  rejected: 'bg-red-100 text-red-700',
  settled: 'bg-green-100 text-green-700',
  appealed: 'bg-orange-100 text-orange-700',
}

export default function InsurancePage() {
  const qc = useQueryClient()
  const [tab, setTab] = useState<'dashboard' | 'companies' | 'policies' | 'claims' | 'new-claim'>('dashboard')
  const [selectedClaim, setSelectedClaim] = useState<any>(null)
  const { register, handleSubmit, reset } = useForm()
  const policyForm = useForm()
  const companyForm = useForm()
  const claimForm = useForm()

  const { data: stats } = useQuery({ queryKey: ['insurance-stats'], queryFn: () => insuranceService.getDashboard().then(r => r.data) })
  const { data: companies } = useQuery({ queryKey: ['ins-companies'], queryFn: () => insuranceService.listCompanies().then(r => r.data) })
  const { data: policies } = useQuery({ queryKey: ['ins-policies'], queryFn: () => insuranceService.listPolicies().then(r => r.data) })
  const { data: claims } = useQuery({ queryKey: ['ins-claims'], queryFn: () => insuranceService.listClaims().then(r => r.data) })

  const createCompany = useMutation({
    mutationFn: (d: any) => insuranceService.createCompany(d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['ins-companies'] }); companyForm.reset(); toast.success('Company added') }
  })

  const createPolicy = useMutation({
    mutationFn: (d: any) => insuranceService.createPolicy({ ...d, patient_id: parseInt(d.patient_id), company_id: parseInt(d.company_id), sum_insured: parseFloat(d.sum_insured) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['ins-policies'] }); policyForm.reset(); toast.success('Policy added') }
  })

  const createClaim = useMutation({
    mutationFn: (d: any) => insuranceService.createClaim({ ...d, policy_id: parseInt(d.policy_id), patient_id: parseInt(d.patient_id), claimed_amount: parseFloat(d.claimed_amount) }),
    onSuccess: (res) => { qc.invalidateQueries({ queryKey: ['ins-claims'] }); claimForm.reset(); toast.success(`Claim created: ${res.data.claim_number}`); setTab('claims') }
  })

  const requestPreauth = useMutation({
    mutationFn: (claimId: number) => insuranceService.requestPreauth(claimId),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['ins-claims'] }); toast.success('Pre-authorization requested') }
  })

  const submitClaim = useMutation({
    mutationFn: ({ id, ref }: { id: number; ref: string }) => insuranceService.submitClaim(id, ref),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['ins-claims'] }); toast.success('Claim submitted to insurer') }
  })

  const updateClaim = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => insuranceService.updateClaim(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['ins-claims'] }); setSelectedClaim(null); toast.success('Claim updated') }
  })

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div><h1 className="text-xl font-bold text-gray-900">Insurance / TPA</h1>
          <p className="text-sm text-gray-500">Policies · Claims · Pre-authorization · Settlement</p></div>
        <button onClick={() => setTab('new-claim')}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">
          <Plus size={16} /> New Claim
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Total Claims', value: stats?.total_claims, color: 'text-blue-600' },
          { label: 'Preauth Pending', value: stats?.preauth_pending, color: 'text-amber-600' },
          { label: 'Under Review', value: stats?.under_review, color: 'text-purple-600' },
          { label: 'Settled Amount', value: `₹${(stats?.settled_amount || 0).toLocaleString()}`, color: 'text-green-600' },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
            <p className={`text-xl font-bold ${color}`}>{value ?? 0}</p>
            <p className="text-xs text-gray-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit">
        {(['dashboard', 'companies', 'policies', 'claims', 'new-claim'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-1.5 text-sm font-medium rounded-md transition capitalize
              ${tab === t ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
            {t.replace('-', ' ')}
          </button>
        ))}
      </div>

      {/* DASHBOARD */}
      {tab === 'dashboard' && (
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">Claim Status Summary</h2>
            <div className="space-y-3">
              {[
                { label: 'Preauth Pending', value: stats?.preauth_pending, color: 'bg-blue-500' },
                { label: 'Submitted', value: stats?.submitted, color: 'bg-amber-500' },
                { label: 'Under Review', value: stats?.under_review, color: 'bg-purple-500' },
                { label: 'Settled', value: stats?.settled, color: 'bg-green-500' },
              ].map(({ label, value, color }) => (
                <div key={label} className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${color}`} />
                  <span className="text-sm text-gray-600 flex-1">{label}</span>
                  <span className="text-sm font-semibold text-gray-800">{value ?? 0}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-3 border-t border-gray-100">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Pending Recovery</span>
                <span className="font-semibold text-amber-600">₹{(stats?.pending_amount || 0).toLocaleString()}</span>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">Quick Actions</h2>
            <div className="space-y-2">
              {[
                { label: 'Add Insurance Company', action: () => setTab('companies'), icon: Shield },
                { label: 'Add Patient Policy', action: () => setTab('policies'), icon: FileText },
                { label: 'Create New Claim', action: () => setTab('new-claim'), icon: Plus },
                { label: 'View All Claims', action: () => setTab('claims'), icon: Clock },
              ].map(({ label, action, icon: Icon }) => (
                <button key={label} onClick={action}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition border border-gray-100">
                  <Icon size={15} />{label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* COMPANIES */}
      {tab === 'companies' && (
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">Add Insurance Company</h2>
            <form onSubmit={companyForm.handleSubmit(d => createCompany.mutate(d))} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-xs text-gray-500 mb-1">Code *</label>
                  <input {...companyForm.register('company_code', { required: true })} className={inputCls} placeholder="STAR" /></div>
                <div><label className="block text-xs text-gray-500 mb-1">Company Name *</label>
                  <input {...companyForm.register('name', { required: true })} className={inputCls} placeholder="Star Health Insurance" /></div>
                <div><label className="block text-xs text-gray-500 mb-1">TPA Name</label>
                  <input {...companyForm.register('tpa_name')} className={inputCls} placeholder="Medi Assist" /></div>
                <div><label className="block text-xs text-gray-500 mb-1">Phone</label>
                  <input {...companyForm.register('phone')} className={inputCls} /></div>
                <div className="col-span-2"><label className="block text-xs text-gray-500 mb-1">Email</label>
                  <input {...companyForm.register('email')} type="email" className={inputCls} /></div>
                <div className="col-span-2"><label className="block text-xs text-gray-500 mb-1">Claim Submission Email</label>
                  <input {...companyForm.register('claim_submission_email')} type="email" className={inputCls} /></div>
              </div>
              <button type="submit" className="w-full py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700">Add Company</button>
            </form>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">Registered Companies ({companies?.length ?? 0})</h2>
            <div className="space-y-2">
              {companies?.map((c: any) => (
                <div key={c.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-gray-800">{c.name}</p>
                    <p className="text-xs text-gray-400">{c.tpa_name ? `TPA: ${c.tpa_name}` : ''} • {c.company_code}</p>
                  </div>
                  <Shield size={16} className="text-blue-400" />
                </div>
              ))}
              {!companies?.length && <p className="text-center text-gray-400 text-sm py-6">No companies added</p>}
            </div>
          </div>
        </div>
      )}

      {/* POLICIES */}
      {tab === 'policies' && (
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">Add Patient Policy</h2>
            <form onSubmit={policyForm.handleSubmit(d => createPolicy.mutate(d))} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-xs text-gray-500 mb-1">Policy Number *</label>
                  <input {...policyForm.register('policy_number', { required: true })} className={inputCls} /></div>
                <div><label className="block text-xs text-gray-500 mb-1">Patient ID *</label>
                  <input {...policyForm.register('patient_id', { required: true })} type="number" className={inputCls} /></div>
                <div><label className="block text-xs text-gray-500 mb-1">Insurance Company *</label>
                  <select {...policyForm.register('company_id', { required: true })} className={`${inputCls} bg-white`}>
                    <option value="">Select</option>
                    {companies?.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select></div>
                <div><label className="block text-xs text-gray-500 mb-1">Policy Holder Name *</label>
                  <input {...policyForm.register('policy_holder_name', { required: true })} className={inputCls} /></div>
                <div><label className="block text-xs text-gray-500 mb-1">Relation</label>
                  <select {...policyForm.register('relation_to_patient')} className={`${inputCls} bg-white`}>
                    {['self', 'spouse', 'parent', 'child', 'other'].map(r => <option key={r} value={r} className="capitalize">{r}</option>)}
                  </select></div>
                <div><label className="block text-xs text-gray-500 mb-1">Sum Insured ₹ *</label>
                  <input {...policyForm.register('sum_insured', { required: true })} type="number" className={inputCls} /></div>
                <div><label className="block text-xs text-gray-500 mb-1">Start Date *</label>
                  <input {...policyForm.register('policy_start_date', { required: true })} type="date" className={inputCls} /></div>
                <div><label className="block text-xs text-gray-500 mb-1">End Date *</label>
                  <input {...policyForm.register('policy_end_date', { required: true })} type="date" className={inputCls} /></div>
                <div><label className="block text-xs text-gray-500 mb-1">Room Rent Limit ₹/day</label>
                  <input {...policyForm.register('room_rent_limit')} type="number" className={inputCls} /></div>
                <div><label className="block text-xs text-gray-500 mb-1">Co-pay %</label>
                  <input {...policyForm.register('copay_percent')} type="number" defaultValue="0" className={inputCls} /></div>
              </div>
              <button type="submit" className="w-full py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700">Add Policy</button>
            </form>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">Active Policies ({policies?.length ?? 0})</h2>
            <div className="space-y-2 max-h-[500px] overflow-y-auto">
              {policies?.map((p: any) => (
                <div key={p.id} className="p-3 border border-gray-100 rounded-lg">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-medium text-gray-800">{p.policy_holder_name}</p>
                      <p className="text-xs font-mono text-gray-400">{p.policy_number}</p>
                    </div>
                    <p className="text-xs font-semibold text-green-600">₹{p.sum_insured?.toLocaleString()}</p>
                  </div>
                  <div className="flex gap-2 mt-1.5 text-xs text-gray-400">
                    <span>{format(new Date(p.policy_start_date), 'dd MMM yyyy')}</span>
                    <span>→</span>
                    <span className={new Date(p.policy_end_date) < new Date() ? 'text-red-500' : ''}>{format(new Date(p.policy_end_date), 'dd MMM yyyy')}</span>
                  </div>
                </div>
              ))}
              {!policies?.length && <p className="text-center text-gray-400 text-sm py-6">No policies registered</p>}
            </div>
          </div>
        </div>
      )}

      {/* CLAIMS */}
      {tab === 'claims' && (
        <div className="space-y-3">
          {selectedClaim && (
            <div className="bg-white rounded-xl border border-blue-200 p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-gray-700">Update Claim — {selectedClaim.claim_number}</h2>
                <button onClick={() => setSelectedClaim(null)} className="text-xs text-gray-400 hover:text-gray-600">Close ✕</button>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div><label className="block text-xs text-gray-500 mb-1">Approved Amount ₹</label>
                  <input defaultValue={selectedClaim.approved_amount} id="approved" type="number" className={inputCls} /></div>
                <div><label className="block text-xs text-gray-500 mb-1">Settlement Ref</label>
                  <input defaultValue={selectedClaim.settlement_reference} id="settlement_ref" className={inputCls} /></div>
                <div><label className="block text-xs text-gray-500 mb-1">New Status</label>
                  <select id="new_status" className={`${inputCls} bg-white`} defaultValue={selectedClaim.status}>
                    {Object.keys(STATUS_COLORS).map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
                  </select></div>
              </div>
              <div className="mt-3"><label className="block text-xs text-gray-500 mb-1">Remarks</label>
                <textarea id="remarks" rows={2} className={inputCls} defaultValue={selectedClaim.remarks} /></div>
              <div className="flex gap-2 mt-3">
                <button onClick={() => requestPreauth.mutate(selectedClaim.id)}
                  className="px-3 py-1.5 text-xs bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200">Request Preauth</button>
                <button onClick={() => submitClaim.mutate({ id: selectedClaim.id, ref: '' })}
                  className="px-3 py-1.5 text-xs bg-amber-100 text-amber-700 rounded-lg hover:bg-amber-200">Submit Claim</button>
                <button onClick={() => updateClaim.mutate({
                  id: selectedClaim.id,
                  data: {
                    status: (document.getElementById('new_status') as HTMLSelectElement)?.value,
                    approved_amount: parseFloat((document.getElementById('approved') as HTMLInputElement)?.value || '0'),
                    settlement_reference: (document.getElementById('settlement_ref') as HTMLInputElement)?.value,
                    remarks: (document.getElementById('remarks') as HTMLTextAreaElement)?.value,
                  }
                })} className="px-3 py-1.5 text-xs bg-green-100 text-green-700 rounded-lg hover:bg-green-200">Save Update</button>
              </div>
            </div>
          )}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <table className="w-full">
              <thead><tr className="bg-gray-50">
                {['Claim No.', 'Patient', 'Claimed ₹', 'Approved ₹', 'Status', 'Submitted', 'Actions'].map(h => (
                  <th key={h} className="text-left text-xs font-semibold text-gray-500 px-4 py-3">{h}</th>
                ))}
              </tr></thead>
              <tbody className="divide-y divide-gray-50">
                {claims?.map((c: any) => (
                  <tr key={c.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-xs font-mono text-gray-600">{c.claim_number}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{c.patient_id}</td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-800">₹{c.claimed_amount?.toLocaleString()}</td>
                    <td className="px-4 py-3 text-sm text-green-600">₹{c.approved_amount?.toLocaleString()}</td>
                    <td className="px-4 py-3"><span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${STATUS_COLORS[c.status]}`}>{c.status?.replace(/_/g, ' ')}</span></td>
                    <td className="px-4 py-3 text-xs text-gray-400">{c.submitted_at ? format(new Date(c.submitted_at), 'dd MMM') : '—'}</td>
                    <td className="px-4 py-3">
                      <button onClick={() => setSelectedClaim(c)} className="text-xs text-blue-600 hover:underline">Manage</button>
                    </td>
                  </tr>
                ))}
                {!claims?.length && <tr><td colSpan={7} className="text-center py-12 text-gray-400">No claims found</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* NEW CLAIM */}
      {tab === 'new-claim' && (
        <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm max-w-2xl">
          <h2 className="text-sm font-semibold text-gray-700 mb-5">Create Insurance Claim</h2>
          <form onSubmit={claimForm.handleSubmit(d => createClaim.mutate(d))} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div><label className="block text-xs text-gray-500 mb-1">Patient ID *</label>
                <input {...claimForm.register('patient_id', { required: true })} type="number" className={inputCls} /></div>
              <div><label className="block text-xs text-gray-500 mb-1">Policy *</label>
                <select {...claimForm.register('policy_id', { required: true })} className={`${inputCls} bg-white`}>
                  <option value="">Select policy</option>
                  {policies?.map((p: any) => <option key={p.id} value={p.id}>{p.policy_number} — {p.policy_holder_name}</option>)}
                </select></div>
              <div><label className="block text-xs text-gray-500 mb-1">IPD Admission ID</label>
                <input {...claimForm.register('ipd_admission_id')} type="number" className={inputCls} /></div>
              <div><label className="block text-xs text-gray-500 mb-1">Bill ID</label>
                <input {...claimForm.register('bill_id')} type="number" className={inputCls} /></div>
              <div className="col-span-2"><label className="block text-xs text-gray-500 mb-1">Admission Diagnosis</label>
                <input {...claimForm.register('admission_diagnosis')} className={inputCls} placeholder="Primary diagnosis at admission" /></div>
              <div><label className="block text-xs text-gray-500 mb-1">Claimed Amount ₹ *</label>
                <input {...claimForm.register('claimed_amount', { required: true })} type="number" step="0.01" className={inputCls} /></div>
              <div><label className="block text-xs text-gray-500 mb-1">Treating Doctor</label>
                <input {...claimForm.register('treating_doctor')} className={inputCls} placeholder="Dr. Name" /></div>
              <div className="col-span-2"><label className="block text-xs text-gray-500 mb-1">Remarks</label>
                <textarea {...claimForm.register('remarks')} rows={2} className={inputCls} /></div>
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setTab('claims')} className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
              <button type="submit" className="px-5 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">Create Claim</button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
