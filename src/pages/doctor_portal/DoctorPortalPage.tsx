import { useQuery } from '@tanstack/react-query'
import { doctorPortalService } from '../../services/api'
import { CalendarCheck, ClipboardList, ListChecks, Users } from 'lucide-react'

export default function DoctorPortalPage() {
  const { data: appointments } = useQuery({ queryKey: ['dp-appointments'], queryFn: () => doctorPortalService.todayAppointments().then(r => r.data) })
  const { data: myPatients } = useQuery({ queryKey: ['dp-patients'], queryFn: () => doctorPortalService.myPatients().then(r => r.data) })
  const { data: pendingOrders } = useQuery({ queryKey: ['dp-orders'], queryFn: () => doctorPortalService.pendingOrders().then(r => r.data) })
  const { data: carePlans } = useQuery({ queryKey: ['dp-care-plans'], queryFn: () => doctorPortalService.myActiveCarePlans().then(r => r.data) })

  return (
    <div>
      <h1 className="page-title" style={{ marginBottom: 4 }}>My Doctor Portal</h1>
      <p style={{ color: '#8B5CF6', fontSize: 13, marginBottom: 20 }}>Your personal worklist — today's appointments, pending orders & care plans</p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <div className="card" style={{ padding: 16 }}>
          <h3 style={{ fontSize: 13, fontWeight: 700, color: '#1E1B4B', marginBottom: 10 }}><CalendarCheck size={14} style={{ marginRight: 6, display: 'inline' }} />Today's Appointments</h3>
          {appointments?.length ? appointments.map((a: any) => (
            <div key={a.id} style={{ padding: 8, borderBottom: '1px solid #F3F4F6', fontSize: 12 }}>Patient #{a.patient_id} — {a.status}</div>
          )) : <p style={{ color: '#9CA3AF', fontSize: 12 }}>No appointments today.</p>}
        </div>

        <div className="card" style={{ padding: 16 }}>
          <h3 style={{ fontSize: 13, fontWeight: 700, color: '#1E1B4B', marginBottom: 10 }}><ClipboardList size={14} style={{ marginRight: 6, display: 'inline' }} />Pending Orders (CPOE)</h3>
          {pendingOrders?.length ? pendingOrders.map((o: any) => (
            <div key={o.id} style={{ padding: 8, borderBottom: '1px solid #F3F4F6', fontSize: 12 }}>
              {o.item_name} — Patient #{o.patient_id} — <span style={{ color: '#8B5CF6' }}>{o.status}</span>
            </div>
          )) : <p style={{ color: '#9CA3AF', fontSize: 12 }}>Nothing pending.</p>}
        </div>

        <div className="card" style={{ padding: 16 }}>
          <h3 style={{ fontSize: 13, fontWeight: 700, color: '#1E1B4B', marginBottom: 10 }}><Users size={14} style={{ marginRight: 6, display: 'inline' }} />My Patients</h3>
          <p style={{ fontSize: 24, fontWeight: 700, color: '#7C3AED' }}>{myPatients?.length ?? 0}</p>
          <p style={{ fontSize: 11, color: '#9CA3AF' }}>Distinct patients seen via OPD</p>
        </div>

        <div className="card" style={{ padding: 16 }}>
          <h3 style={{ fontSize: 13, fontWeight: 700, color: '#1E1B4B', marginBottom: 10 }}><ListChecks size={14} style={{ marginRight: 6, display: 'inline' }} />My Active Care Plans</h3>
          {carePlans?.length ? carePlans.map((c: any) => (
            <div key={c.id} style={{ padding: 8, borderBottom: '1px solid #F3F4F6', fontSize: 12 }}>{c.title} — Patient #{c.patient_id}</div>
          )) : <p style={{ color: '#9CA3AF', fontSize: 12 }}>No active care plans.</p>}
        </div>
      </div>
    </div>
  )
}
