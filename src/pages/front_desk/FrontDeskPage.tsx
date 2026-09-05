import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { frontDeskService } from '../../services/api'
import { PatientSearchInput } from '../../components/ui/PatientSearchInput'
import { UserCheck, Search, Users, Package } from 'lucide-react'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import { cleanPayload } from '../../utils/form'
import CustomSelect from '../../components/ui/CustomSelect'

const inputCls = "w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-violet-500 outline-none"
const TABS = ['Dashboard', 'Visitors', 'Lost & Found']

export default function FrontDeskPage() {
  const qc = useQueryClient()
  const [tab, setTab] = useState(0)
  const [showVisitorForm, setShowVisitorForm] = useState(false)
  const [showLostFoundForm, setShowLostFoundForm] = useState(false)
  const [visitorPatientId, setVisitorPatientId] = useState('')
  const [claimModal, setClaimModal] = useState<number | null>(null)
  const visitorForm = useForm<any>()
  const lostFoundForm = useForm<any>({ defaultValues: { entry_type: 'found_item' } })
  const claimForm = useForm<any>()

  const { data: dashboard } = useQuery({
    queryKey: ['fd-dashboard'],
    queryFn: () => frontDeskService.getDashboard().then(r => r.data),
    refetchInterval: 30000,
  })
  const { data: visitors } = useQuery({
    queryKey: ['fd-visitors'],
    queryFn: () => frontDeskService.currentlyInVisitors().then(r => r.data),
    enabled: tab === 1,
    refetchInterval: 15000,
  })
  const { data: lostFound } = useQuery({
    queryKey: ['fd-lost-found'],
    queryFn: () => frontDeskService.listLostFound().then(r => r.data),
    enabled: tab === 2,
  })

  const checkIn = useMutation({
    mutationFn: (d: any) => frontDeskService.checkInVisitor(cleanPayload({ ...d, patient_id: parseInt(visitorPatientId) })),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['fd-visitors', 'fd-dashboard'] })
      visitorForm.reset()
      setVisitorPatientId('')
      setShowVisitorForm(false)
      toast.success('Visitor checked in')
    },
    onError: (e: any) => toast.error(e.response?.data?.detail || 'Check-in failed'),
  })

  const checkOut = useMutation({
    mutationFn: (id: number) => frontDeskService.checkOutVisitor(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['fd-visitors', 'fd-dashboard'] })
      toast.success('Visitor checked out')
    },
    onError: () => toast.error('Check-out failed'),
  })

  const reportItem = useMutation({
    mutationFn: (d: any) => frontDeskService.reportLostFound(cleanPayload(d)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['fd-lost-found', 'fd-dashboard'] })
      lostFoundForm.reset({ entry_type: 'found_item' })
      setShowLostFoundForm(false)
      toast.success('Item logged')
    },
    onError: () => toast.error('Failed to log item'),
  })

  const claim = useMutation({
    mutationFn: (d: any) => frontDeskService.claimItem(claimModal!, d),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['fd-lost-found', 'fd-dashboard'] })
      claimForm.reset()
      setClaimModal(null)
      toast.success('Item marked claimed')
    },
    onError: (e: any) => toast.error(e.response?.data?.detail || 'Failed to claim item'),
  })

  const markUnclaimed = useMutation({
    mutationFn: (id: number) => frontDeskService.markUnclaimed(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['fd-lost-found'] })
      toast.success('Marked unclaimed')
    },
    onError: () => toast.error('Failed to update'),
  })

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h1 className="page-title">Front Desk</h1>
        <p style={{ color: '#8B5CF6', fontSize: 13 }}>Visitor management · Lost & found</p>
      </div>

      <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: '2px solid #F3F0FF' }}>
        {TABS.map((t, i) => (
          <button key={t} onClick={() => setTab(i)} style={{ padding: '8px 18px', fontSize: 13, fontWeight: 600, border: 'none', background: 'none', cursor: 'pointer', marginBottom: -2, borderBottom: tab === i ? '2px solid #7C3AED' : '2px solid transparent', color: tab === i ? '#7C3AED' : '#9CA3AF' }}>
            {t}
          </button>
        ))}
      </div>

      {/* DASHBOARD */}
      {tab === 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>
          {[
            { label: 'Visitors Currently In', value: dashboard?.visitors_currently_in ?? 0, icon: Users, color: '#1D4ED8', bg: '#EFF6FF' },
            { label: 'Visitors Today', value: dashboard?.visitors_today ?? 0, icon: UserCheck, color: '#7C3AED', bg: '#F5F3FF' },
            { label: 'Pending Lost & Found', value: dashboard?.pending_lost_found ?? 0, icon: Search, color: '#D97706', bg: '#FFFBEB' },
            { label: 'Claimed This Month', value: dashboard?.claimed_this_month ?? 0, icon: Package, color: '#15803D', bg: '#F0FDF4' },
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

      {/* VISITORS */}
      {tab === 1 && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
            <button className="btn-primary" onClick={() => setShowVisitorForm(true)}>Check In Visitor</button>
          </div>

          {showVisitorForm && (
            <div className="card" style={{ maxWidth: 480, padding: 20, marginBottom: 20 }}>
              <h2 style={{ fontSize: 14, fontWeight: 700, color: '#1E1B4B', marginBottom: 16 }}>Check In Visitor</h2>
              <form onSubmit={visitorForm.handleSubmit(d => {
                if (!visitorPatientId) return toast.error('Please select the patient being visited')
                checkIn.mutate(d)
              })} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#4C1D95', marginBottom: 4 }}>Visiting Patient *</label>
                  <PatientSearchInput inputCls={inputCls} onChange={setVisitorPatientId} />
                </div>
                <input {...visitorForm.register('visitor_name', { required: true })} className={inputCls} placeholder="Visitor Name" />
                <input {...visitorForm.register('visitor_phone')} className={inputCls} placeholder="Visitor Phone" />
                <input {...visitorForm.register('relation_to_patient')} className={inputCls} placeholder="Relation (e.g. Brother, Friend)" />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <input {...visitorForm.register('id_proof_type')} className={inputCls} placeholder="ID Proof Type" />
                  <input {...visitorForm.register('id_proof_number')} className={inputCls} placeholder="ID Number" />
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button type="submit" disabled={checkIn.isPending} className="btn-primary">
                    {checkIn.isPending ? 'Checking In...' : 'Check In'}
                  </button>
                  <button type="button" className="btn-ghost" onClick={() => setShowVisitorForm(false)}>Cancel</button>
                </div>
              </form>
            </div>
          )}

          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <table className="w-full">
              <thead>
                <tr style={{ background: '#FAF5FF' }}>
                  <th style={{ textAlign: 'left', padding: '10px 14px', fontSize: 11, color: '#7C3AED', fontWeight: 700 }}>Pass #</th>
                  <th style={{ textAlign: 'left', padding: '10px 14px', fontSize: 11, color: '#7C3AED', fontWeight: 700 }}>Visitor</th>
                  <th style={{ textAlign: 'left', padding: '10px 14px', fontSize: 11, color: '#7C3AED', fontWeight: 700 }}>Relation</th>
                  <th style={{ textAlign: 'left', padding: '10px 14px', fontSize: 11, color: '#7C3AED', fontWeight: 700 }}>Checked In</th>
                  <th style={{ textAlign: 'left', padding: '10px 14px', fontSize: 11, color: '#7C3AED', fontWeight: 700 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {!visitors?.length && (
                  <tr><td colSpan={5} style={{ textAlign: 'center', padding: 32, color: '#9CA3AF', fontSize: 13 }}>No visitors currently checked in</td></tr>
                )}
                {visitors?.map((v: any) => (
                  <tr key={v.id} style={{ borderTop: '1px solid #F3F4F6' }}>
                    <td style={{ padding: '10px 14px', fontSize: 13, fontWeight: 600, color: '#1E1B4B' }}>{v.pass_number}</td>
                    <td style={{ padding: '10px 14px', fontSize: 13, color: '#374151' }}>{v.visitor_name}</td>
                    <td style={{ padding: '10px 14px', fontSize: 13, color: '#374151' }}>{v.relation_to_patient || '—'}</td>
                    <td style={{ padding: '10px 14px', fontSize: 12, color: '#6B7280' }}>{format(new Date(v.check_in_time), 'HH:mm, dd MMM')}</td>
                    <td style={{ padding: '10px 14px' }}>
                      <button className="btn-ghost" style={{ fontSize: 11, padding: '3px 8px' }} onClick={() => checkOut.mutate(v.id)}>Check Out</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* LOST & FOUND */}
      {tab === 2 && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
            <button className="btn-primary" onClick={() => setShowLostFoundForm(true)}>Log Item</button>
          </div>

          {showLostFoundForm && (
            <div className="card" style={{ maxWidth: 480, padding: 20, marginBottom: 20 }}>
              <h2 style={{ fontSize: 14, fontWeight: 700, color: '#1E1B4B', marginBottom: 16 }}>Log Lost / Found Item</h2>
              <form onSubmit={lostFoundForm.handleSubmit(d => reportItem.mutate(d))} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <CustomSelect value={lostFoundForm.watch('entry_type') || 'found_item'} onChange={v => lostFoundForm.setValue('entry_type', String(v))}
                  options={[{ value: 'found_item', label: 'Found Item (no owner yet)' }, { value: 'lost_by_patient', label: 'Lost by Patient/Attendant' }]} />
                <textarea {...lostFoundForm.register('item_description', { required: true })} className={inputCls} rows={2} placeholder="Item description" />
                <input {...lostFoundForm.register('location_found_lost')} className={inputCls} placeholder="Location (e.g. Ward 3B, OPD)" />
                <input {...lostFoundForm.register('reporter_name')} className={inputCls} placeholder="Reporter Name" />
                <input {...lostFoundForm.register('reporter_phone')} className={inputCls} placeholder="Reporter Phone" />
                <div style={{ display: 'flex', gap: 8 }}>
                  <button type="submit" disabled={reportItem.isPending} className="btn-primary">
                    {reportItem.isPending ? 'Logging...' : 'Log Item'}
                  </button>
                  <button type="button" className="btn-ghost" onClick={() => setShowLostFoundForm(false)}>Cancel</button>
                </div>
              </form>
            </div>
          )}

          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <table className="w-full">
              <thead>
                <tr style={{ background: '#FAF5FF' }}>
                  <th style={{ textAlign: 'left', padding: '10px 14px', fontSize: 11, color: '#7C3AED', fontWeight: 700 }}>Item #</th>
                  <th style={{ textAlign: 'left', padding: '10px 14px', fontSize: 11, color: '#7C3AED', fontWeight: 700 }}>Description</th>
                  <th style={{ textAlign: 'left', padding: '10px 14px', fontSize: 11, color: '#7C3AED', fontWeight: 700 }}>Location</th>
                  <th style={{ textAlign: 'left', padding: '10px 14px', fontSize: 11, color: '#7C3AED', fontWeight: 700 }}>Status</th>
                  <th style={{ textAlign: 'left', padding: '10px 14px', fontSize: 11, color: '#7C3AED', fontWeight: 700 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {!lostFound?.length && (
                  <tr><td colSpan={5} style={{ textAlign: 'center', padding: 32, color: '#9CA3AF', fontSize: 13 }}>No lost & found items</td></tr>
                )}
                {lostFound?.map((item: any) => (
                  <tr key={item.id} style={{ borderTop: '1px solid #F3F4F6' }}>
                    <td style={{ padding: '10px 14px', fontSize: 13, fontWeight: 600, color: '#1E1B4B' }}>{item.item_number}</td>
                    <td style={{ padding: '10px 14px', fontSize: 13, color: '#374151', maxWidth: 220 }}>{item.item_description}</td>
                    <td style={{ padding: '10px 14px', fontSize: 13, color: '#374151' }}>{item.location_found_lost || '—'}</td>
                    <td style={{ padding: '10px 14px' }}>
                      <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: item.status === 'claimed' ? '#F0FDF4' : item.status === 'unclaimed' ? '#F3F4F6' : '#FFFBEB', color: item.status === 'claimed' ? '#15803D' : item.status === 'unclaimed' ? '#4B5563' : '#D97706' }}>
                        {item.status}
                      </span>
                    </td>
                    <td style={{ padding: '10px 14px' }}>
                      {item.status === 'reported' && (
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button className="btn-ghost" style={{ fontSize: 11, padding: '3px 8px', color: '#15803D' }} onClick={() => setClaimModal(item.id)}>Claim</button>
                          <button className="btn-ghost" style={{ fontSize: 11, padding: '3px 8px' }} onClick={() => markUnclaimed.mutate(item.id)}>Mark Unclaimed</button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {claimModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }} onClick={() => setClaimModal(null)}>
          <div className="card" style={{ width: 400, padding: 20 }} onClick={e => e.stopPropagation()}>
            <h2 style={{ fontSize: 14, fontWeight: 700, color: '#1E1B4B', marginBottom: 16 }}>Claim Item</h2>
            <form onSubmit={claimForm.handleSubmit(d => claim.mutate(d))} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <input {...claimForm.register('claimed_by', { required: true })} className={inputCls} placeholder="Claimed By (Name)" />
              <textarea {...claimForm.register('claim_verification')} className={inputCls} rows={2} placeholder="Verification notes" />
              <button type="submit" disabled={claim.isPending} className="btn-primary">
                {claim.isPending ? 'Saving...' : 'Confirm Claim'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
