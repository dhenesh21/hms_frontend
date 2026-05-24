import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { appointmentService } from '../../services/api'
import { Plus, Calendar, Clock, CheckCircle, XCircle, Search } from 'lucide-react'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

const STATUS_COLORS: Record<string, string> = {
  scheduled: 'bg-blue-100 text-blue-700',
  confirmed: 'bg-indigo-100 text-indigo-700',
  in_progress: 'bg-amber-100 text-amber-700',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-600',
  no_show: 'bg-gray-100 text-gray-500',
}

const TYPE_COLORS: Record<string, string> = {
  consultation: 'bg-purple-100 text-purple-700',
  follow_up: 'bg-teal-100 text-teal-700',
  emergency: 'bg-red-100 text-red-700',
  procedure: 'bg-orange-100 text-orange-700',
}

export default function AppointmentListPage() {
  const qc = useQueryClient()
  const [dateFilter, setDateFilter] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [statusFilter, setStatusFilter] = useState('')

  const { data: appointments, isLoading } = useQuery({
    queryKey: ['appointments', dateFilter, statusFilter],
    queryFn: () => appointmentService.list({
      appointment_date: dateFilter || undefined,
      status: statusFilter || undefined
    }).then(r => r.data)
  })

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      appointmentService.update(id, { status }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['appointments'] })
      toast.success('Status updated')
    }
  })

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Appointments</h1>
          <p className="text-sm text-gray-500">{appointments?.length ?? 0} appointments</p>
        </div>
        <Link to="/appointments/new"
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition">
          <Plus size={16} /> New Appointment
        </Link>
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <input type="date" value={dateFilter} onChange={e => setDateFilter(e.target.value)}
          className="px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="px-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none">
          <option value="">All Statuses</option>
          {Object.keys(STATUS_COLORS).map(s => (
            <option key={s} value={s}>{s.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}</option>
          ))}
        </select>
        <button onClick={() => { setDateFilter(''); setStatusFilter('') }}
          className="px-3 py-2.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 transition text-gray-500">
          Clear
        </button>
      </div>

      {/* List */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              {['Token', 'Patient', 'Doctor', 'Date & Time', 'Type', 'Status', 'Actions'].map(h => (
                <th key={h} className="text-left text-xs font-semibold text-gray-500 px-4 py-3">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {isLoading ? (
              <tr><td colSpan={7} className="text-center py-12 text-gray-400">Loading...</td></tr>
            ) : appointments?.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-16">
                  <Calendar size={36} className="mx-auto mb-3 text-gray-200" />
                  <p className="text-gray-400 text-sm">No appointments found</p>
                </td>
              </tr>
            ) : (
              appointments?.map((a: any) => (
                <tr key={a.id} className="hover:bg-gray-50 transition">
                  <td className="px-4 py-3">
                    <span className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                      {a.token_number}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-sm font-medium text-gray-900">{a.patient_name}</p>
                    <p className="text-xs text-gray-400 font-mono">{a.patient_uhid}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-sm text-gray-800">{a.doctor_name}</p>
                    <p className="text-xs text-gray-400">{a.specialization}</p>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5 text-sm text-gray-700">
                      <Calendar size={13} className="text-gray-400" />
                      {a.appointment_date}
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-gray-400 mt-0.5">
                      <Clock size={11} />
                      {a.appointment_time}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${TYPE_COLORS[a.appointment_type] || 'bg-gray-100 text-gray-600'}`}>
                      {a.appointment_type?.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${STATUS_COLORS[a.status] || 'bg-gray-100 text-gray-600'}`}>
                      {a.status?.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      {a.status === 'scheduled' && (
                        <button
                          onClick={() => updateStatus.mutate({ id: a.id, status: 'confirmed' })}
                          className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg" title="Confirm">
                          <CheckCircle size={16} />
                        </button>
                      )}
                      {!['completed', 'cancelled'].includes(a.status) && (
                        <button
                          onClick={() => updateStatus.mutate({ id: a.id, status: 'cancelled' })}
                          className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg" title="Cancel">
                          <XCircle size={16} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
