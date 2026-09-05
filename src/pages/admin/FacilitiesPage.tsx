import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { ipdService, otService } from '../../services/api'
import { BedDouble, Building2, Stethoscope } from 'lucide-react'
import toast from 'react-hot-toast'
import { cleanPayload } from '../../utils/form'
import CustomSelect from '../../components/ui/CustomSelect'

const inputCls = "w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-violet-500 outline-none"

export default function FacilitiesPage() {
  const qc = useQueryClient()
  const [activeTab, setActiveTab] = useState<'wards' | 'beds' | 'ot'>('wards')
  const wardForm = useForm()
  const bedForm = useForm()
  const otForm = useForm()

  const { data: wards } = useQuery({ queryKey: ['admin-wards'], queryFn: () => ipdService.listWards().then(r => r.data) })
  const { data: beds } = useQuery({ queryKey: ['admin-beds'], queryFn: () => ipdService.getAvailableBeds().then((r: any) => r.data) })
  const { data: theatres } = useQuery({ queryKey: ['admin-theatres'], queryFn: () => otService.listTheatres().then(r => r.data) })

  const createWard = useMutation({
    mutationFn: (d: any) => ipdService.createWard(cleanPayload({ ...d, floor: parseInt(d.floor || 1), total_beds: parseInt(d.total_beds), charge_per_day: parseFloat(d.charge_per_day || 0) })),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-wards'] }); qc.invalidateQueries({ queryKey: ['admin-beds'] }); wardForm.reset(); toast.success('Ward added — beds auto-created') },
    onError: (err: any) => toast.error(err.response?.data?.detail || 'Failed to add ward')
  })

  const createBed = useMutation({
    mutationFn: (d: any) => ipdService.createBed(cleanPayload({ ...d, ward_id: parseInt(d.ward_id) })),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-beds'] }); qc.invalidateQueries({ queryKey: ['admin-wards'] }); bedForm.reset(); toast.success('Bed added') },
    onError: (err: any) => toast.error(err.response?.data?.detail || 'Failed to add bed')
  })

  const createTheatre = useMutation({
    mutationFn: (d: any) => otService.createTheatre(cleanPayload({ ...d, floor: d.floor ? parseInt(d.floor) : undefined })),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-theatres'] }); qc.invalidateQueries({ queryKey: ['ot-theatres'] }); otForm.reset(); toast.success('OT Theatre added') },
    onError: (err: any) => toast.error(err.response?.data?.detail || 'Failed to add OT')
  })

  const updateTheatreStatus = useMutation({
    mutationFn: ({ id, status }: any) => otService.updateTheatreStatus(id, status),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-theatres'] }); qc.invalidateQueries({ queryKey: ['ot-theatres'] }); toast.success('Status updated') },
    onError: (err: any) => toast.error(err.response?.data?.detail || 'Failed to update status')
  })

  const TABS = [
    { key: 'wards', label: 'Wards', icon: Building2 },
    { key: 'beds', label: 'Beds', icon: BedDouble },
    { key: 'ot', label: 'OT Theatres', icon: Stethoscope },
  ] as const

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 className="page-title">Facilities</h1>
        <p style={{ color: '#7C3AED', fontSize: 13 }}>Manage wards, beds and operation theatres</p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24, borderBottom: '2px solid #F3F0FF', paddingBottom: 0 }}>
        {TABS.map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => setActiveTab(key)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '8px 16px', fontSize: 13, fontWeight: 600, border: 'none',
              background: 'none', cursor: 'pointer', borderBottom: activeTab === key ? '2px solid #7C3AED' : '2px solid transparent',
              color: activeTab === key ? '#7C3AED' : '#9CA3AF', marginBottom: -2
            }}>
            <Icon size={15} /> {label}
          </button>
        ))}
      </div>

      {/* WARDS TAB */}
      {activeTab === 'wards' && (
        <div style={{ display: 'grid', gridTemplateColumns: '360px 1fr', gap: 20 }}>
          {/* Add Ward Form */}
          <div className="card">
            <h2 style={{ fontSize: 14, fontWeight: 700, color: '#1E1B4B', marginBottom: 4 }}>Add Ward</h2>
            <p style={{ fontSize: 12, color: '#A78BFA', marginBottom: 16 }}>
              Beds are auto-created — e.g. ward #3 with 10 beds → W3-01..W3-10
            </p>
            <form onSubmit={wardForm.handleSubmit(d => createWard.mutate(d))} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#4C1D95', marginBottom: 4 }}>Ward Name *</label>
                <input {...wardForm.register('name', { required: true })} className={inputCls} placeholder="e.g. General Ward A" />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#4C1D95', marginBottom: 4 }}>Ward Type *</label>
                <CustomSelect value={wardForm.watch('ward_type') || ''} onChange={v => wardForm.setValue('ward_type', String(v))} placeholder="— Select —" options={[{ value: '', label: '— Select —' }, { value: "general", label: "General" }, { value: "private", label: "Private" }, { value: "semi_private", label: "Semi Private" }, { value: "icu", label: "ICU" }, { value: "nicu", label: "NICU" }, { value: "hdu", label: "HDU" }, { value: "emergency", label: "Emergency" }, { value: "maternity", label: "Maternity" }]} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#4C1D95', marginBottom: 4 }}>Floor</label>
                  <input {...wardForm.register('floor')} type="number" min={1} className={inputCls} placeholder="1" />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#4C1D95', marginBottom: 4 }}>Total Beds *</label>
                  <input {...wardForm.register('total_beds', { required: true })} type="number" min={1} className={inputCls} placeholder="10" />
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#4C1D95', marginBottom: 4 }}>Charge per Day (₹)</label>
                <input {...wardForm.register('charge_per_day')} type="number" step="0.01" className={inputCls} placeholder="1500" />
              </div>
              <button type="submit" disabled={createWard.isPending}
                className="btn-primary" style={{ marginTop: 4 }}>
                {createWard.isPending ? 'Adding...' : '+ Add Ward'}
              </button>
            </form>
          </div>

          {/* Wards List */}
          <div className="card">
            <h2 style={{ fontSize: 14, fontWeight: 700, color: '#1E1B4B', marginBottom: 16 }}>
              Wards ({wards?.length ?? 0})
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {wards?.map((w: any) => (
                <div key={w.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#FAFAFF', border: '1px solid #EDE9FE', borderRadius: 10, padding: '12px 16px' }}>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 700, color: '#1E1B4B' }}>{w.name}</p>
                    <p style={{ fontSize: 11, color: '#8B5CF6', marginTop: 2, textTransform: 'capitalize' }}>
                      {w.ward_type?.replace('_', ' ')} · Floor {w.floor}
                    </p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ fontSize: 13, fontWeight: 700, color: '#7C3AED' }}>{w.available_beds}/{w.total_beds} beds</p>
                    <p style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>₹{w.charge_per_day}/day</p>
                  </div>
                </div>
              ))}
              {!wards?.length && (
                <div style={{ textAlign: 'center', padding: '40px 0', color: '#C4B5FD' }}>
                  <BedDouble size={32} style={{ margin: '0 auto 8px' }} />
                  <p style={{ fontSize: 13 }}>No wards yet — add one to get started</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* BEDS TAB */}
      {activeTab === 'beds' && (
        <div style={{ display: 'grid', gridTemplateColumns: '360px 1fr', gap: 20 }}>
          {/* Add Bed Form */}
          <div className="card">
            <h2 style={{ fontSize: 14, fontWeight: 700, color: '#1E1B4B', marginBottom: 4 }}>Add Individual Bed</h2>
            <p style={{ fontSize: 12, color: '#A78BFA', marginBottom: 16 }}>
              Use this to add an extra bed to an existing ward
            </p>
            <form onSubmit={bedForm.handleSubmit(d => {
              if (!d.ward_id) return toast.error('Please select a ward')
              createBed.mutate(d)
            })} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#4C1D95', marginBottom: 4 }}>Ward *</label>
                <select {...bedForm.register('ward_id', { required: true })} className={`${inputCls} bg-white`}>
                  <option value="">— Select Ward —</option>
                  {wards?.map((w: any) => <option key={w.id} value={w.id}>{w.name}</option>)}
                </select>
                {!wards?.length && <p style={{ fontSize: 11, color: '#F59E0B', marginTop: 4 }}>⚠ Add a ward first</p>}
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#4C1D95', marginBottom: 4 }}>Bed Number *</label>
                <input {...bedForm.register('bed_number', { required: true })} className={inputCls} placeholder="e.g. ICU-09" />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#4C1D95', marginBottom: 4 }}>Bed Type</label>
                <CustomSelect value={bedForm.watch('bed_type') || ''} onChange={v => bedForm.setValue('bed_type', String(v))} placeholder="— Select —" options={[{ value: '', label: '— Select —' }, { value: "standard", label: "Standard" }, { value: "deluxe", label: "Deluxe" }, { value: "icu", label: "ICU" }, { value: "isolation", label: "Isolation" }]} />
              </div>
              <button type="submit" disabled={createBed.isPending || !wards?.length} className="btn-primary" style={{ marginTop: 4 }}>
                {createBed.isPending ? 'Adding...' : '+ Add Bed'}
              </button>
            </form>
          </div>

          {/* Beds List */}
          <div className="card">
            <h2 style={{ fontSize: 14, fontWeight: 700, color: '#1E1B4B', marginBottom: 16 }}>
              Available Beds ({beds?.length ?? 0})
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {beds?.map((b: any) => (
                <div key={b.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#FAFAFF', border: '1px solid #EDE9FE', borderRadius: 10, padding: '12px 16px' }}>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 700, color: '#1E1B4B' }}>{b.bed_number}</p>
                    <p style={{ fontSize: 11, color: '#8B5CF6', marginTop: 2, textTransform: 'capitalize' }}>{b.bed_type}</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ fontSize: 11, color: '#9CA3AF' }}>{b.ward_name || `Ward #${b.ward_id}`}</p>
                    <span style={{ fontSize: 11, fontWeight: 600, color: '#059669', background: '#ECFDF5', padding: '2px 8px', borderRadius: 99 }}>
                      {b.status}
                    </span>
                  </div>
                </div>
              ))}
              {!beds?.length && (
                <div style={{ textAlign: 'center', padding: '40px 0', color: '#C4B5FD' }}>
                  <BedDouble size={32} style={{ margin: '0 auto 8px' }} />
                  <p style={{ fontSize: 13 }}>No available beds — add a ward first (beds are auto-created)</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* OT THEATRES TAB */}
      {activeTab === 'ot' && (
        <div style={{ display: 'grid', gridTemplateColumns: '360px 1fr', gap: 20 }}>
          {/* Add OT Form */}
          <div className="card">
            <h2 style={{ fontSize: 14, fontWeight: 700, color: '#1E1B4B', marginBottom: 4 }}>Add OT Theatre</h2>
            <p style={{ fontSize: 12, color: '#A78BFA', marginBottom: 16 }}>
              Theatres appear in the OT Schedule doctor dropdown
            </p>
            <form onSubmit={otForm.handleSubmit(d => createTheatre.mutate(d))} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#4C1D95', marginBottom: 4 }}>OT Number *</label>
                <input {...otForm.register('ot_number', { required: true })} className={inputCls} placeholder="e.g. OT-1" />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#4C1D95', marginBottom: 4 }}>Name *</label>
                <input {...otForm.register('name', { required: true })} className={inputCls} placeholder="e.g. Major OT 1" />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#4C1D95', marginBottom: 4 }}>Type</label>
                <input {...otForm.register('ot_type')} className={inputCls} placeholder="e.g. General / Cardiac / Minor" />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#4C1D95', marginBottom: 4 }}>Floor</label>
                <input {...otForm.register('floor')} type="number" className={inputCls} placeholder="1" />
              </div>
              <button type="submit" disabled={createTheatre.isPending} className="btn-primary" style={{ marginTop: 4 }}>
                {createTheatre.isPending ? 'Adding...' : '+ Add OT Theatre'}
              </button>
            </form>
          </div>

          {/* OT List */}
          <div className="card">
            <h2 style={{ fontSize: 14, fontWeight: 700, color: '#1E1B4B', marginBottom: 16 }}>
              OT Theatres ({theatres?.length ?? 0})
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {theatres?.map((t: any) => (
                <div key={t.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#FAFAFF', border: '1px solid #EDE9FE', borderRadius: 10, padding: '12px 16px' }}>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 700, color: '#1E1B4B' }}>{t.ot_number} — {t.name}</p>
                    <p style={{ fontSize: 11, color: '#8B5CF6', marginTop: 2 }}>
                      {t.ot_type || 'General'}{t.floor != null ? ` · Floor ${t.floor}` : ''}
                    </p>
                  </div>
                  <select
                    value={t.status}
                    onChange={e => updateTheatreStatus.mutate({ id: t.id, status: e.target.value })}
                    style={{ fontSize: 12, border: '1.5px solid #EDE9FE', borderRadius: 8, padding: '4px 8px', background: '#fff', color: '#4C1D95', cursor: 'pointer', outline: 'none' }}>
                    <option value="available">Available</option>
                    <option value="booked">Booked</option>
                    <option value="in_use">In Use</option>
                    <option value="cleaning">Cleaning</option>
                    <option value="maintenance">Maintenance</option>
                  </select>
                </div>
              ))}
              {!theatres?.length && (
                <div style={{ textAlign: 'center', padding: '40px 0', color: '#C4B5FD' }}>
                  <Stethoscope size={32} style={{ margin: '0 auto 8px' }} />
                  <p style={{ fontSize: 13 }}>No OT theatres yet — add one above</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
