import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { bloodBankService } from '../../services/api'
import { useForm } from 'react-hook-form'
import { Droplets, Users, AlertTriangle, CheckCircle, XCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import { cleanPayload } from '../../utils/form'
import CustomSelect from '../../components/ui/CustomSelect'

const inputCls = "w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-violet-500 outline-none"
const BLOOD_GROUPS = ['A+','A-','B+','B-','AB+','AB-','O+','O-']
const TABS = ['Dashboard','Donors','Donations','Requests']
const GROUP_COLORS: Record<string, {bg:string;text:string}> = {
  'A+':  {bg:'#FEF2F2',text:'#DC2626'}, 'A-':  {bg:'#FFF5F5',text:'#B91C1C'},
  'B+':  {bg:'#FFF7ED',text:'#C2410C'}, 'B-':  {bg:'#FFFBEB',text:'#D97706'},
  'AB+': {bg:'#F0FDF4',text:'#15803D'}, 'AB-': {bg:'#ECFDF5',text:'#059669'},
  'O+':  {bg:'#EFF6FF',text:'#1D4ED8'}, 'O-':  {bg:'#F0F9FF',text:'#0369A1'},
}

export default function BloodBankPage() {
  const qc = useQueryClient()
  const [tab, setTab] = useState(0)
  const donorForm = useForm()
  const donationForm = useForm()
  const requestForm = useForm()

  const { data: dashboard } = useQuery({ queryKey: ['bb-dashboard'], queryFn: () => bloodBankService.getDashboard().then(r => r.data) })
  const { data: donors } = useQuery({ queryKey: ['bb-donors'], queryFn: () => bloodBankService.listDonors().then(r => r.data), enabled: tab === 1 })
  const { data: donations } = useQuery({ queryKey: ['bb-donations'], queryFn: () => bloodBankService.listDonations().then(r => r.data), enabled: tab === 2 })
  const { data: requests } = useQuery({ queryKey: ['bb-requests'], queryFn: () => bloodBankService.listRequests().then(r => r.data), enabled: tab === 3 })

  const addDonor = useMutation({ mutationFn: (d: any) => bloodBankService.addDonor(cleanPayload(d)), onSuccess: () => { qc.invalidateQueries({ queryKey: ['bb-donors','bb-dashboard'] }); donorForm.reset(); toast.success('Donor registered!') }, onError: (e:any) => toast.error(e.response?.data?.detail || 'Failed') })
  const recordDonation = useMutation({ mutationFn: (d: any) => bloodBankService.recordDonation(cleanPayload({...d, donor_id: parseInt(d.donor_id)})), onSuccess: () => { qc.invalidateQueries({ queryKey: ['bb-donations','bb-dashboard'] }); donationForm.reset(); toast.success('Donation recorded!') }, onError: (e:any) => toast.error(e.response?.data?.detail || 'Failed') })
  const createRequest = useMutation({ mutationFn: (d: any) => bloodBankService.createRequest(cleanPayload(d)), onSuccess: () => { qc.invalidateQueries({ queryKey: ['bb-requests','bb-dashboard'] }); requestForm.reset(); toast.success('Request created!') }, onError: (e:any) => toast.error(e.response?.data?.detail || 'Failed') })
  const issueBlood = useMutation({ mutationFn: ({id,units}:any) => bloodBankService.issueBlood(id,{units}), onSuccess: () => { qc.invalidateQueries({ queryKey: ['bb-requests','bb-dashboard'] }); toast.success('Blood issued!') }, onError: (e:any) => toast.error(e.response?.data?.detail || 'Insufficient stock') })
  const rejectRequest = useMutation({ mutationFn: (id:number) => bloodBankService.rejectRequest(id,{reason:'Rejected'}), onSuccess: () => { qc.invalidateQueries({ queryKey: ['bb-requests'] }); toast.success('Rejected') } })

  const stock = dashboard?.stock || []
  const criticalStock = stock.filter((s:any) => s.is_critical)

  return (
    <div>
      <div style={{marginBottom:20}}>
        <h1 className="page-title">Blood Bank</h1>
        <p style={{color:'#8B5CF6',fontSize:13}}>Donor registry · Stock management · Blood requests</p>
      </div>
      {criticalStock.length > 0 && (
        <div style={{display:'flex',alignItems:'center',gap:10,padding:'10px 16px',background:'#FEF2F2',border:'1px solid #FECACA',borderRadius:10,marginBottom:16}}>
          <AlertTriangle size={16} color="#DC2626"/>
          <p style={{fontSize:13,color:'#DC2626',fontWeight:600}}>Critical stock: {criticalStock.map((s:any)=>`${s.blood_group} (${s.units_available})`).join(', ')}</p>
        </div>
      )}
      <div style={{display:'flex',gap:4,marginBottom:20,borderBottom:'2px solid #F3F0FF'}}>
        {TABS.map((t,i) => <button key={t} onClick={()=>setTab(i)} style={{padding:'8px 18px',fontSize:13,fontWeight:600,border:'none',background:'none',cursor:'pointer',marginBottom:-2,borderBottom:tab===i?'2px solid #7C3AED':'2px solid transparent',color:tab===i?'#7C3AED':'#9CA3AF'}}>{t}</button>)}
      </div>

      {tab === 0 && (
        <div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12,marginBottom:20}}>
            {[{label:'Total Donors',value:dashboard?.total_donors||0,color:'#7C3AED',bg:'#F5F3FF'},{label:'Pending Requests',value:dashboard?.pending_requests||0,color:'#D97706',bg:'#FFFBEB'},{label:'Critical Groups',value:dashboard?.critical_groups||0,color:'#DC2626',bg:'#FEF2F2'}].map(({label,value,color,bg})=>(
              <div key={label} className="card" style={{textAlign:'center'}}>
                <p style={{fontSize:28,fontWeight:800,color,margin:0}}>{value}</p>
                <p style={{fontSize:12,color:'#6B7280',margin:0}}>{label}</p>
              </div>
            ))}
          </div>
          <h2 style={{fontSize:14,fontWeight:700,color:'#1E1B4B',marginBottom:12}}>Blood Stock</h2>
          <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12}}>
            {stock.map((s:any)=>{const gc=GROUP_COLORS[s.blood_group]||{bg:'#F9FAFB',text:'#6B7280'};return(
              <div key={s.blood_group} style={{background:gc.bg,border:`2px solid ${s.is_critical?'#FECACA':gc.text}30`,borderRadius:14,padding:'16px 20px',textAlign:'center'}}>
                {s.is_critical&&<AlertTriangle size={14} color="#DC2626" style={{marginBottom:4}}/>}
                <p style={{fontSize:28,fontWeight:900,color:gc.text,margin:0}}>{s.blood_group}</p>
                <p style={{fontSize:22,fontWeight:800,color:'#1E1B4B',margin:'4px 0 0'}}>{s.units_available}</p>
                <p style={{fontSize:11,color:'#9CA3AF',margin:'2px 0 0'}}>units</p>
              </div>
            )})}
          </div>
        </div>
      )}

      {tab === 1 && (
        <div style={{display:'grid',gridTemplateColumns:'320px 1fr',gap:20}}>
          <div className="card">
            <h3 style={{fontSize:14,fontWeight:700,color:'#1E1B4B',marginBottom:16}}>Register Donor</h3>
            <form onSubmit={donorForm.handleSubmit(d=>addDonor.mutate(d))} style={{display:'flex',flexDirection:'column',gap:10}}>
              <div><label style={{fontSize:12,fontWeight:600,color:'#4C1D95',display:'block',marginBottom:4}}>Full Name *</label><input {...donorForm.register('name',{required:true})} className={inputCls} placeholder="Donor name"/></div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
                <div><label style={{fontSize:12,fontWeight:600,color:'#4C1D95',display:'block',marginBottom:4}}>Blood Group *</label>
                  <select {...donorForm.register('blood_group',{required:true})} className={`${inputCls} bg-white`}><option value="">Select</option>{BLOOD_GROUPS.map(g=><option key={g} value={g}>{g}</option>)}</select></div>
                <div><label style={{fontSize:12,fontWeight:600,color:'#4C1D95',display:'block',marginBottom:4}}>Age</label><input {...donorForm.register('age')} type="number" className={inputCls} placeholder="25"/></div>
              </div>
              <div><label style={{fontSize:12,fontWeight:600,color:'#4C1D95',display:'block',marginBottom:4}}>Phone</label><input {...donorForm.register('phone')} className={inputCls} placeholder="9876543210"/></div>
              <button type="submit" disabled={addDonor.isPending} className="btn-primary">{addDonor.isPending?'Registering...':'+ Register Donor'}</button>
            </form>
          </div>
          <div className="card" style={{padding:0,overflow:'hidden'}}>
            <div style={{padding:'12px 16px',borderBottom:'1px solid #F3F0FF'}}><h3 style={{fontSize:14,fontWeight:700,color:'#1E1B4B',margin:0}}>Donors ({donors?.length||0})</h3></div>
            <table style={{width:'100%',borderCollapse:'collapse'}}>
              <thead><tr style={{background:'#FAFAFF'}}>{['ID','Name','Group','Age','Phone','Donations'].map(h=><th key={h} style={{padding:'8px 14px',fontSize:11,fontWeight:700,color:'#7C3AED',textAlign:'left',textTransform:'uppercase'}}>{h}</th>)}</tr></thead>
              <tbody>{(donors||[]).map((d:any)=>{const gc=GROUP_COLORS[d.blood_group]||{bg:'#F9FAFB',text:'#6B7280'};return(
                <tr key={d.id} style={{borderBottom:'1px solid #F9F7FF'}}>
                  <td style={{padding:'10px 14px',fontSize:12,fontFamily:'monospace',color:'#6B7280'}}>{d.donor_id}</td>
                  <td style={{padding:'10px 14px',fontSize:13,fontWeight:600,color:'#1E1B4B'}}>{d.name}</td>
                  <td style={{padding:'10px 14px'}}><span style={{fontSize:12,fontWeight:700,padding:'2px 8px',borderRadius:99,background:gc.bg,color:gc.text}}>{d.blood_group}</span></td>
                  <td style={{padding:'10px 14px',fontSize:13,color:'#6B7280'}}>{d.age||'—'}</td>
                  <td style={{padding:'10px 14px',fontSize:13,color:'#6B7280'}}>{d.phone||'—'}</td>
                  <td style={{padding:'10px 14px',fontSize:13,fontWeight:600,color:'#7C3AED'}}>{d.total_donations}</td>
                </tr>
              )})}
              {!donors?.length&&<tr><td colSpan={6} style={{textAlign:'center',padding:32,color:'#C4B5FD',fontSize:13}}>No donors registered</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 2 && (
        <div style={{display:'grid',gridTemplateColumns:'320px 1fr',gap:20}}>
          <div className="card">
            <h3 style={{fontSize:14,fontWeight:700,color:'#1E1B4B',marginBottom:16}}>Record Donation</h3>
            <form onSubmit={donationForm.handleSubmit(d=>recordDonation.mutate(d))} style={{display:'flex',flexDirection:'column',gap:10}}>
              <div><label style={{fontSize:12,fontWeight:600,color:'#4C1D95',display:'block',marginBottom:4}}>Donor *</label>
                <select {...donationForm.register('donor_id',{required:true})} className={`${inputCls} bg-white`}><option value="">— Select Donor —</option>{(donors||[]).map((d:any)=><option key={d.id} value={d.id}>{d.name} ({d.blood_group})</option>)}</select></div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
                <div><label style={{fontSize:12,fontWeight:600,color:'#4C1D95',display:'block',marginBottom:4}}>Units *</label><input {...donationForm.register('units',{required:true})} type="number" step="0.1" className={inputCls} placeholder="1.0"/></div>
                <div><label style={{fontSize:12,fontWeight:600,color:'#4C1D95',display:'block',marginBottom:4}}>Date *</label><input {...donationForm.register('donation_date',{required:true})} type="date" className={inputCls}/></div>
              </div>
              <button type="submit" disabled={recordDonation.isPending} className="btn-primary">{recordDonation.isPending?'Recording...':'+ Record Donation'}</button>
            </form>
          </div>
          <div className="card" style={{padding:0,overflow:'hidden'}}>
            <div style={{padding:'12px 16px',borderBottom:'1px solid #F3F0FF'}}><h3 style={{fontSize:14,fontWeight:700,color:'#1E1B4B',margin:0}}>Donation Records</h3></div>
            <table style={{width:'100%',borderCollapse:'collapse'}}>
              <thead><tr style={{background:'#FAFAFF'}}>{['No.','Donor','Group','Units','Date','Expiry'].map(h=><th key={h} style={{padding:'8px 14px',fontSize:11,fontWeight:700,color:'#7C3AED',textAlign:'left',textTransform:'uppercase'}}>{h}</th>)}</tr></thead>
              <tbody>{(donations||[]).map((d:any)=>{const gc=GROUP_COLORS[d.blood_group]||{bg:'#F9FAFB',text:'#6B7280'};return(
                <tr key={d.id} style={{borderBottom:'1px solid #F9F7FF',background:d.is_expired?'#FEF2F2':'transparent'}}>
                  <td style={{padding:'10px 14px',fontSize:12,fontFamily:'monospace',color:'#6B7280'}}>{d.donation_number}</td>
                  <td style={{padding:'10px 14px',fontSize:13,fontWeight:600,color:'#1E1B4B'}}>{d.donor_name}</td>
                  <td style={{padding:'10px 14px'}}><span style={{fontSize:12,fontWeight:700,padding:'2px 8px',borderRadius:99,background:gc.bg,color:gc.text}}>{d.blood_group}</span></td>
                  <td style={{padding:'10px 14px',fontSize:13,color:'#1E1B4B'}}>{d.units}</td>
                  <td style={{padding:'10px 14px',fontSize:12,color:'#6B7280'}}>{d.donation_date}</td>
                  <td style={{padding:'10px 14px',fontSize:12,color:d.is_expired?'#DC2626':'#059669',fontWeight:d.is_expired?600:400}}>{d.expiry_date}{d.is_expired&&' ⚠ Expired'}</td>
                </tr>
              )})}
              {!donations?.length&&<tr><td colSpan={6} style={{textAlign:'center',padding:32,color:'#C4B5FD',fontSize:13}}>No records</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 3 && (
        <div style={{display:'grid',gridTemplateColumns:'320px 1fr',gap:20}}>
          <div className="card">
            <h3 style={{fontSize:14,fontWeight:700,color:'#1E1B4B',marginBottom:16}}>New Blood Request</h3>
            <form onSubmit={requestForm.handleSubmit(d=>createRequest.mutate(d))} style={{display:'flex',flexDirection:'column',gap:10}}>
              <div><label style={{fontSize:12,fontWeight:600,color:'#4C1D95',display:'block',marginBottom:4}}>Blood Group *</label>
                <select {...requestForm.register('blood_group',{required:true})} className={`${inputCls} bg-white`}><option value="">Select</option>{BLOOD_GROUPS.map(g=><option key={g} value={g}>{g}</option>)}</select></div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
                <div><label style={{fontSize:12,fontWeight:600,color:'#4C1D95',display:'block',marginBottom:4}}>Units *</label><input {...requestForm.register('units_requested',{required:true})} type="number" step="0.5" className={inputCls} placeholder="1"/></div>
                <div><label style={{fontSize:12,fontWeight:600,color:'#4C1D95',display:'block',marginBottom:4}}>Priority</label>
                  <CustomSelect value={requestForm.watch('priority') || ''} onChange={v => requestForm.setValue('priority', String(v))} placeholder="— Select —" options={[{ value: '', label: '— Select —' }, { value: "routine", label: "Routine" }, { value: "urgent", label: "Urgent" }, { value: "emergency", label: "Emergency" }]} /></div>
              </div>
              <div><label style={{fontSize:12,fontWeight:600,color:'#4C1D95',display:'block',marginBottom:4}}>Reason *</label><input {...requestForm.register('reason',{required:true})} className={inputCls} placeholder="Surgery / Anaemia..."/></div>
              <div><label style={{fontSize:12,fontWeight:600,color:'#4C1D95',display:'block',marginBottom:4}}>Doctor</label><input {...requestForm.register('doctor_name')} className={inputCls} placeholder="Dr. Name"/></div>
              <button type="submit" disabled={createRequest.isPending} className="btn-primary">{createRequest.isPending?'Submitting...':'+ Create Request'}</button>
            </form>
          </div>
          <div className="card" style={{padding:0,overflow:'hidden'}}>
            <div style={{padding:'12px 16px',borderBottom:'1px solid #F3F0FF'}}><h3 style={{fontSize:14,fontWeight:700,color:'#1E1B4B',margin:0}}>Blood Requests</h3></div>
            <table style={{width:'100%',borderCollapse:'collapse'}}>
              <thead><tr style={{background:'#FAFAFF'}}>{['No.','Patient','Group','Units','Priority','Status','Action'].map(h=><th key={h} style={{padding:'8px 14px',fontSize:11,fontWeight:700,color:'#7C3AED',textAlign:'left',textTransform:'uppercase'}}>{h}</th>)}</tr></thead>
              <tbody>{(requests||[]).map((r:any)=>{const gc=GROUP_COLORS[r.blood_group]||{bg:'#F9FAFB',text:'#6B7280'};const PC:Record<string,string>={emergency:'#DC2626',urgent:'#D97706',routine:'#6B7280'};return(
                <tr key={r.id} style={{borderBottom:'1px solid #F9F7FF'}}>
                  <td style={{padding:'10px 14px',fontSize:12,fontFamily:'monospace',color:'#6B7280'}}>{r.request_number}</td>
                  <td style={{padding:'10px 14px',fontSize:13,color:'#1E1B4B'}}>{r.patient_name}</td>
                  <td style={{padding:'10px 14px'}}><span style={{fontSize:12,fontWeight:700,padding:'2px 8px',borderRadius:99,background:gc.bg,color:gc.text}}>{r.blood_group}</span></td>
                  <td style={{padding:'10px 14px',fontSize:13,color:'#1E1B4B'}}>{r.units_requested}</td>
                  <td style={{padding:'10px 14px',fontSize:12,fontWeight:600,color:PC[r.priority]||'#6B7280',textTransform:'capitalize'}}>{r.priority}</td>
                  <td style={{padding:'10px 14px'}}><span style={{fontSize:11,fontWeight:600,padding:'2px 8px',borderRadius:99,background:r.status==='pending'?'#FFFBEB':r.status==='issued'?'#ECFDF5':'#F9FAFB',color:r.status==='pending'?'#D97706':r.status==='issued'?'#059669':'#6B7280',textTransform:'capitalize'}}>{r.status}</span></td>
                  <td style={{padding:'10px 14px'}}>
                    {r.status==='pending'&&<div style={{display:'flex',gap:4}}>
                      <button onClick={()=>issueBlood.mutate({id:r.id,units:r.units_requested})} style={{fontSize:10,padding:'3px 8px',borderRadius:6,border:'1px solid #A7F3D0',background:'#ECFDF5',color:'#059669',cursor:'pointer',fontWeight:600,display:'flex',alignItems:'center',gap:3}}><CheckCircle size={10}/>Issue</button>
                      <button onClick={()=>rejectRequest.mutate(r.id)} style={{fontSize:10,padding:'3px 8px',borderRadius:6,border:'1px solid #FECACA',background:'#FEF2F2',color:'#DC2626',cursor:'pointer',fontWeight:600,display:'flex',alignItems:'center',gap:3}}><XCircle size={10}/>Reject</button>
                    </div>}
                  </td>
                </tr>
              )})}
              {!requests?.length&&<tr><td colSpan={7} style={{textAlign:'center',padding:32,color:'#C4B5FD',fontSize:13}}>No requests</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
