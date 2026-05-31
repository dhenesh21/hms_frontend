import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { insuranceService } from '../../services/api'
import { ShieldCheck, Plus, Search } from 'lucide-react'
import { format } from 'date-fns'

// insuranceService real methods:
// listCompanies(), createCompany(data), listPolicies(params?), createPolicy(data),
// getPolicy(id), createClaim(data), listClaims(params?), getClaim(id),
// updateClaim(id, data), requestPreauth(claimId), preauthResponse(claimId, data),
// submitClaim(claimId, ...), getDashboard()

const STATUS_CONFIG: Record<string, { label: string; cls: string }> = {
  draft:        { label: 'Draft',        cls: 'badge-gray' },
  submitted:    { label: 'Submitted',    cls: 'badge-blue' },
  under_review: { label: 'Under Review', cls: 'badge-amber' },
  approved:     { label: 'Approved',     cls: 'badge-green' },
  rejected:     { label: 'Rejected',     cls: 'badge-red' },
  partial:      { label: 'Partial',      cls: 'badge-indigo' },
  settled:      { label: 'Settled',      cls: 'badge-teal' },
}

export default function InsurancePage() {
  const [activeTab, setActiveTab] = useState<'claims' | 'companies' | 'policies'>('claims')
  const [search, setSearch] = useState('')

  const { data: stats }     = useQuery({ queryKey: ['insurance-stats'],     queryFn: () => insuranceService.getDashboard().then((r: any) => r.data) })
  const { data: claims }    = useQuery({ queryKey: ['insurance-claims'],    queryFn: () => insuranceService.listClaims().then((r: any) => r.data) })
  const { data: companies } = useQuery({ queryKey: ['insurance-companies'], queryFn: () => insuranceService.listCompanies().then((r: any) => r.data) })
  const { data: policies }  = useQuery({ queryKey: ['insurance-policies'],  queryFn: () => insuranceService.listPolicies().then((r: any) => r.data) })

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Insurance</h1>
          <p className="page-subtitle">Claims, companies & patient policies</p>
        </div>
        <button className="btn-primary"><Plus size={15} /> New Claim</button>
      </div>

      <div className="grid-4" style={{ marginBottom: 24 }}>
        {[
          { label: 'Total Claims',   value: stats?.total_claims ?? 0, cls: 'stat-icon-purple' },
          { label: 'Pending',        value: stats?.pending_claims ?? 0, cls: 'stat-icon-amber' },
          { label: 'Approved',       value: stats?.approved_claims ?? 0, cls: 'stat-icon-green' },
          { label: 'Settled Amount', value: `₹${(stats?.settled_amount || 0).toLocaleString()}`, cls: 'stat-icon-blue' },
        ].map(({ label, value, cls }) => (
          <div key={label} className="stat-card">
            <p style={{ fontSize: 12, color: '#8B5CF6', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>{label}</p>
            <p style={{ fontSize: 26, fontWeight: 800, color: '#1E1B4B' }}>{value}</p>
          </div>
        ))}
      </div>

      <div className="tabs" style={{ marginBottom: 20 }}>
        {(['claims', 'companies', 'policies'] as const).map(t => (
          <button key={t} className={`tab ${activeTab === t ? 'active' : ''}`} onClick={() => setActiveTab(t)}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {activeTab === 'claims' && (
        <div>
          <div style={{ position: 'relative', marginBottom: 16 }}>
            <Search size={15} color="#A78BFA" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} />
            <input placeholder="Search claim number, patient..." value={search}
              onChange={e => setSearch(e.target.value)}
              className="input" style={{ paddingLeft: 40 }} />
          </div>
          <div className="table-wrapper">
            <table>
              <thead><tr>
                <th>Claim #</th><th>Patient</th><th>Company</th>
                <th>Claimed</th><th>Approved</th><th>Status</th><th>Date</th>
              </tr></thead>
              <tbody>
                {!(claims?.length) ? (
                  <tr><td colSpan={7} style={{ textAlign: 'center', padding: '40px 0', color: '#C4B5FD', fontSize: 13 }}>No claims found</td></tr>
                ) : (claims || []).filter((c: any) =>
                  !search || c.claim_number?.includes(search) || c.patient_name?.toLowerCase().includes(search.toLowerCase())
                ).map((c: any) => (
                  <tr key={c.id}>
                    <td><span style={{ fontFamily: 'monospace', color: '#7C3AED', fontWeight: 600, fontSize: 12 }}>{c.claim_number}</span></td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div className="avatar avatar-sm avatar-purple">{c.patient_name?.[0] || 'P'}</div>
                        <div>
                          <p style={{ fontWeight: 600, color: '#1E1B4B', fontSize: 13 }}>{c.patient_name}</p>
                          <p style={{ fontSize: 11, color: '#A78BFA' }}>{c.policy_number}</p>
                        </div>
                      </div>
                    </td>
                    <td style={{ fontWeight: 600, color: '#4C1D95', fontSize: 13 }}>{c.company_name || '—'}</td>
                    <td style={{ fontWeight: 700, color: '#1E1B4B', fontSize: 13 }}>₹{c.claimed_amount?.toLocaleString()}</td>
                    <td style={{ fontWeight: 700, color: '#16A34A', fontSize: 13 }}>
                      {c.approved_amount ? `₹${c.approved_amount.toLocaleString()}` : '—'}
                    </td>
                    <td><span className={`badge ${STATUS_CONFIG[c.status]?.cls || 'badge-gray'}`}>{STATUS_CONFIG[c.status]?.label || c.status}</span></td>
                    <td style={{ color: '#6B7280', fontSize: 12 }}>{c.claim_date ? format(new Date(c.claim_date), 'dd MMM yy') : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'companies' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 14 }}>
          {(companies || []).map((c: any) => (
            <div key={c.id} className="card">
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: 'linear-gradient(135deg, #7C3AED, #4F46E5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ShieldCheck size={20} color="#fff" />
                </div>
                <div>
                  <p style={{ fontWeight: 700, color: '#1E1B4B', fontSize: 14 }}>{c.name}</p>
                  <span className={`badge ${c.is_active ? 'badge-green' : 'badge-gray'}`} style={{ fontSize: 10 }}>
                    {c.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
              {c.contact_email && <p style={{ fontSize: 12, color: '#A78BFA', marginTop: 4 }}>{c.contact_email}</p>}
              {c.contact_phone && <p style={{ fontSize: 12, color: '#6B7280' }}>{c.contact_phone}</p>}
            </div>
          ))}
        </div>
      )}

      {activeTab === 'policies' && (
        <div className="table-wrapper">
          <table>
            <thead><tr>
              <th>Policy #</th><th>Patient</th><th>Company</th>
              <th>Coverage</th><th>Expiry</th><th>Status</th>
            </tr></thead>
            <tbody>
              {!(policies?.length) ? (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: '40px 0', color: '#C4B5FD', fontSize: 13 }}>No policies found</td></tr>
              ) : (policies || []).map((p: any) => (
                <tr key={p.id}>
                  <td><span style={{ fontFamily: 'monospace', color: '#7C3AED', fontWeight: 600, fontSize: 12 }}>{p.policy_number}</span></td>
                  <td style={{ fontWeight: 600, color: '#1E1B4B', fontSize: 13 }}>{p.patient_name || '—'}</td>
                  <td style={{ color: '#4C1D95', fontWeight: 600, fontSize: 13 }}>{p.company_name || '—'}</td>
                  <td style={{ fontWeight: 700, color: '#16A34A', fontSize: 13 }}>₹{p.coverage_amount?.toLocaleString()}</td>
                  <td style={{ color: '#6B7280', fontSize: 12 }}>{p.expiry_date ? format(new Date(p.expiry_date), 'dd MMM yyyy') : '—'}</td>
                  <td><span className={`badge ${p.is_active ? 'badge-green' : 'badge-red'}`}>{p.is_active ? 'Active' : 'Expired'}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
