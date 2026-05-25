import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { hrService } from '../../services/api'
import { Users, Clock, Calendar, IndianRupee, Plus, CheckCircle, XCircle, FileText } from 'lucide-react'
import toast from 'react-hot-toast'
import { format } from 'date-fns'

const inputCls = "w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
const TABS = ['Dashboard', 'Staff', 'Attendance', 'Leaves', 'Payroll', 'Holidays']

const LEAVE_STATUS_COLORS: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-700',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-600',
  cancelled: 'bg-gray-100 text-gray-500',
}

export default function HRPage() {
  const qc = useQueryClient()
  const [tab, setTab] = useState(0)
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [payrollStaffId, setPayrollStaffId] = useState('')
  const { register, handleSubmit, reset } = useForm()
  const staffForm = useForm()
  const deptForm = useForm()
  const leaveForm = useForm()
  const payrollForm = useForm()
  const holidayForm = useForm()

  const { data: stats } = useQuery({ queryKey: ['hr-stats'], queryFn: () => hrService.getDashboard().then(r => r.data) })
  const { data: staff } = useQuery({ queryKey: ['staff'], queryFn: () => hrService.listStaff().then(r => r.data) })
  const { data: departments } = useQuery({ queryKey: ['departments'], queryFn: () => hrService.listDepartments().then(r => r.data) })
  const { data: designations } = useQuery({ queryKey: ['designations'], queryFn: () => hrService.listDesignations().then(r => r.data) })
  const { data: leaves } = useQuery({ queryKey: ['leaves'], queryFn: () => hrService.listLeaves({ status: 'pending' }).then(r => r.data) })
  const { data: holidays } = useQuery({ queryKey: ['holidays'], queryFn: () => hrService.listHolidays(selectedYear).then(r => r.data) })
  const { data: payrolls } = useQuery({ queryKey: ['payrolls', selectedMonth, selectedYear], queryFn: () => hrService.listPayrolls({ month: selectedMonth, year: selectedYear }).then(r => r.data) })

  const createDept = useMutation({
    mutationFn: (d: any) => hrService.createDepartment(d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['departments'] }); deptForm.reset(); toast.success('Department created') }
  })

  const createStaff = useMutation({
    mutationFn: (d: any) => hrService.createStaff({ ...d, user_id: parseInt(d.user_id), department_id: parseInt(d.department_id), designation_id: parseInt(d.designation_id), basic_salary: parseFloat(d.basic_salary), hra: parseFloat(d.hra || 0), da: parseFloat(d.da || 0) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['staff'] }); staffForm.reset(); toast.success('Staff profile created') }
  })

  const approveLeave = useMutation({
    mutationFn: ({ id, status, reason }: any) => hrService.approveLeave(id, { status, rejection_reason: reason }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['leaves'] }); toast.success('Leave updated') }
  })

  const applyLeave = useMutation({
    mutationFn: (d: any) => hrService.applyLeave({ ...d, staff_id: parseInt(d.staff_id) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['leaves'] }); leaveForm.reset(); toast.success('Leave applied') }
  })

  const generatePayroll = useMutation({
    mutationFn: (d: any) => hrService.generatePayroll({ ...d, staff_id: parseInt(d.staff_id), month: selectedMonth, year: selectedYear, bonus: parseFloat(d.bonus || 0) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['payrolls'] }); payrollForm.reset(); toast.success('Payroll generated!') }
  })

  const markPaid = useMutation({
    mutationFn: ({ id, mode }: any) => hrService.updatePayroll(id, { status: 'paid', payment_date: format(new Date(), 'yyyy-MM-dd'), payment_mode: mode }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['payrolls'] }); toast.success('Marked as paid') }
  })

  const createHoliday = useMutation({
    mutationFn: (d: any) => hrService.createHoliday(d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['holidays'] }); holidayForm.reset(); toast.success('Holiday added') }
  })

  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div><h1 className="text-xl font-bold text-gray-900">HR & Payroll</h1>
          <p className="text-sm text-gray-500">Staff management · Attendance · Leave · Payroll</p></div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-5 gap-3">
        {[
          { label: 'Total Staff', value: stats?.total_staff, color: 'text-blue-600' },
          { label: 'Present Today', value: stats?.present_today, color: 'text-green-600' },
          { label: 'On Leave', value: stats?.on_leave_today, color: 'text-amber-600' },
          { label: 'Absent', value: stats?.absent_today, color: 'text-red-500' },
          { label: 'Pending Leave Approvals', value: stats?.pending_leave_approvals, color: 'text-purple-600' },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
            <p className={`text-2xl font-bold ${color}`}>{value ?? 0}</p>
            <p className="text-xs text-gray-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit">
        {TABS.map((t, i) => (
          <button key={t} onClick={() => setTab(i)}
            className={`px-4 py-1.5 text-sm font-medium rounded-md transition
              ${tab === i ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
            {t}
          </button>
        ))}
      </div>

      {/* DASHBOARD */}
      {tab === 0 && (
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">Add Department</h2>
            <form onSubmit={deptForm.handleSubmit(d => createDept.mutate(d))} className="space-y-3">
              <div><label className="block text-xs text-gray-500 mb-1">Dept Code *</label>
                <input {...deptForm.register('dept_code', { required: true })} className={inputCls} placeholder="CARD" /></div>
              <div><label className="block text-xs text-gray-500 mb-1">Department Name *</label>
                <input {...deptForm.register('name', { required: true })} className={inputCls} placeholder="Cardiology" /></div>
              <div><label className="block text-xs text-gray-500 mb-1">Description</label>
                <textarea {...deptForm.register('description')} rows={2} className={inputCls} /></div>
              <button type="submit" className="w-full py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700">Add Department</button>
            </form>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">Departments ({departments?.length ?? 0})</h2>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {departments?.map((d: any) => (
                <div key={d.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-gray-800">{d.name}</p>
                    <p className="text-xs text-gray-400 font-mono">{d.dept_code}</p>
                  </div>
                </div>
              ))}
              {!departments?.length && <p className="text-center text-gray-400 text-sm py-4">No departments</p>}
            </div>
          </div>
        </div>
      )}

      {/* STAFF */}
      {tab === 1 && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">Add Staff Profile</h2>
            <form onSubmit={staffForm.handleSubmit(d => createStaff.mutate(d))} className="grid grid-cols-3 gap-3">
              <div><label className="block text-xs text-gray-500 mb-1">User ID *</label>
                <input {...staffForm.register('user_id', { required: true })} type="number" className={inputCls} placeholder="From auth system" /></div>
              <div><label className="block text-xs text-gray-500 mb-1">Employee Code *</label>
                <input {...staffForm.register('employee_code', { required: true })} className={inputCls} placeholder="EMP001" /></div>
              <div><label className="block text-xs text-gray-500 mb-1">Department</label>
                <select {...staffForm.register('department_id')} className={`${inputCls} bg-white`}>
                  <option value="">Select</option>
                  {departments?.map((d: any) => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select></div>
              <div><label className="block text-xs text-gray-500 mb-1">Designation</label>
                <select {...staffForm.register('designation_id')} className={`${inputCls} bg-white`}>
                  <option value="">Select</option>
                  {designations?.map((d: any) => <option key={d.id} value={d.id}>{d.title}</option>)}
                </select></div>
              <div><label className="block text-xs text-gray-500 mb-1">Employment Type</label>
                <select {...staffForm.register('employment_type')} className={`${inputCls} bg-white`}>
                  {['permanent','contract','probation','intern','consultant'].map(t => <option key={t} value={t} className="capitalize">{t}</option>)}
                </select></div>
              <div><label className="block text-xs text-gray-500 mb-1">Date of Joining *</label>
                <input {...staffForm.register('date_of_joining', { required: true })} type="date" className={inputCls} /></div>
              <div><label className="block text-xs text-gray-500 mb-1">Shift</label>
                <select {...staffForm.register('shift')} className={`${inputCls} bg-white`}>
                  {['General','Morning','Evening','Night'].map(s => <option key={s}>{s}</option>)}
                </select></div>
              <div><label className="block text-xs text-gray-500 mb-1">Basic Salary ₹</label>
                <input {...staffForm.register('basic_salary')} type="number" className={inputCls} placeholder="25000" /></div>
              <div><label className="block text-xs text-gray-500 mb-1">HRA ₹</label>
                <input {...staffForm.register('hra')} type="number" className={inputCls} placeholder="10000" /></div>
              <div><label className="block text-xs text-gray-500 mb-1">DA ₹</label>
                <input {...staffForm.register('da')} type="number" className={inputCls} placeholder="5000" /></div>
              <div><label className="block text-xs text-gray-500 mb-1">Account Number</label>
                <input {...staffForm.register('account_number')} className={inputCls} /></div>
              <div><label className="block text-xs text-gray-500 mb-1">IFSC Code</label>
                <input {...staffForm.register('ifsc_code')} className={inputCls} /></div>
              <div className="col-span-3 flex justify-end">
                <button type="submit" className="px-5 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700">Add Staff</button>
              </div>
            </form>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <table className="w-full">
              <thead><tr className="bg-gray-50">
                {['Emp Code','Name','Department','Designation','Type','Shift','Joined','Status'].map(h => (
                  <th key={h} className="text-left text-xs font-semibold text-gray-500 px-4 py-3">{h}</th>
                ))}
              </tr></thead>
              <tbody className="divide-y divide-gray-50">
                {staff?.map((s: any) => (
                  <tr key={s.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-xs font-mono text-gray-600">{s.employee_code}</td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{s.full_name}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{s.department_name || '—'}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{s.designation_title || '—'}</td>
                    <td className="px-4 py-3"><span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full capitalize">{s.employment_type}</span></td>
                    <td className="px-4 py-3 text-xs text-gray-500">{s.shift}</td>
                    <td className="px-4 py-3 text-xs text-gray-400">{format(new Date(s.date_of_joining), 'dd MMM yyyy')}</td>
                    <td className="px-4 py-3"><span className={`text-xs px-2 py-0.5 rounded-full font-medium ${s.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>{s.is_active ? 'Active' : 'Inactive'}</span></td>
                  </tr>
                ))}
                {!staff?.length && <tr><td colSpan={8} className="text-center py-10 text-gray-400">No staff found</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ATTENDANCE */}
      {tab === 2 && (
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">Mark Attendance</h2>
            <form onSubmit={handleSubmit(d => hrService.markAttendance({ ...d, staff_id: parseInt(d.staff_id) }).then(() => { reset(); toast.success('Attendance marked') }))} className="space-y-3">
              <div><label className="block text-xs text-gray-500 mb-1">Staff ID *</label>
                <input {...register('staff_id', { required: true })} type="number" className={inputCls} /></div>
              <div><label className="block text-xs text-gray-500 mb-1">Date *</label>
                <input {...register('date', { required: true })} type="date" defaultValue={format(new Date(), 'yyyy-MM-dd')} className={inputCls} /></div>
              <div><label className="block text-xs text-gray-500 mb-1">Status</label>
                <select {...register('status')} className={`${inputCls} bg-white`}>
                  {['present','absent','half_day','late','on_leave','holiday','weekly_off'].map(s => <option key={s} value={s}>{s.replace(/_/g,' ')}</option>)}
                </select></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-xs text-gray-500 mb-1">Check In</label>
                  <input {...register('check_in')} type="time" className={inputCls} /></div>
                <div><label className="block text-xs text-gray-500 mb-1">Check Out</label>
                  <input {...register('check_out')} type="time" className={inputCls} /></div>
              </div>
              <div><label className="block text-xs text-gray-500 mb-1">Remarks</label>
                <input {...register('remarks')} className={inputCls} /></div>
              <button type="submit" className="w-full py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700">Mark Attendance</button>
            </form>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">Today's Attendance</h2>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Present', value: stats?.present_today, color: 'bg-green-100 text-green-700' },
                { label: 'Absent', value: stats?.absent_today, color: 'bg-red-100 text-red-700' },
                { label: 'On Leave', value: stats?.on_leave_today, color: 'bg-amber-100 text-amber-700' },
                { label: 'Total Staff', value: stats?.total_staff, color: 'bg-blue-100 text-blue-700' },
              ].map(({ label, value, color }) => (
                <div key={label} className={`rounded-xl p-4 ${color}`}>
                  <p className="text-2xl font-bold">{value ?? 0}</p>
                  <p className="text-xs font-medium mt-0.5">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* LEAVES */}
      {tab === 3 && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
              <h2 className="text-sm font-semibold text-gray-700 mb-4">Apply Leave</h2>
              <form onSubmit={leaveForm.handleSubmit(d => applyLeave.mutate(d))} className="space-y-3">
                <div><label className="block text-xs text-gray-500 mb-1">Staff ID *</label>
                  <input {...leaveForm.register('staff_id', { required: true })} type="number" className={inputCls} /></div>
                <div><label className="block text-xs text-gray-500 mb-1">Leave Type</label>
                  <select {...leaveForm.register('leave_type')} className={`${inputCls} bg-white`}>
                    {['casual','sick','earned','maternity','paternity','compensatory','unpaid','emergency'].map(t => <option key={t} value={t} className="capitalize">{t}</option>)}
                  </select></div>
                <div className="grid grid-cols-2 gap-2">
                  <div><label className="block text-xs text-gray-500 mb-1">From *</label>
                    <input {...leaveForm.register('from_date', { required: true })} type="date" className={inputCls} /></div>
                  <div><label className="block text-xs text-gray-500 mb-1">To *</label>
                    <input {...leaveForm.register('to_date', { required: true })} type="date" className={inputCls} /></div>
                </div>
                <div><label className="block text-xs text-gray-500 mb-1">Reason *</label>
                  <textarea {...leaveForm.register('reason', { required: true })} rows={2} className={inputCls} /></div>
                <button type="submit" className="w-full py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700">Apply Leave</button>
              </form>
            </div>

            <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
              <h2 className="text-sm font-semibold text-gray-700 mb-4">Pending Approvals ({leaves?.length ?? 0})</h2>
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {leaves?.map((l: any) => (
                  <div key={l.id} className="border border-gray-100 rounded-lg p-3">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="text-sm font-medium text-gray-800">Staff ID: {l.staff_id}</p>
                        <p className="text-xs text-gray-400 capitalize">{l.leave_type} leave • {l.total_days} day(s)</p>
                        <p className="text-xs text-gray-400">{format(new Date(l.from_date), 'dd MMM')} – {format(new Date(l.to_date), 'dd MMM yyyy')}</p>
                        <p className="text-xs text-gray-500 mt-1">{l.reason}</p>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${LEAVE_STATUS_COLORS[l.status]}`}>{l.status}</span>
                    </div>
                    {l.status === 'pending' && (
                      <div className="flex gap-2">
                        <button onClick={() => approveLeave.mutate({ id: l.id, status: 'approved' })}
                          className="flex-1 py-1.5 text-xs bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center justify-center gap-1">
                          <CheckCircle size={12} /> Approve
                        </button>
                        <button onClick={() => approveLeave.mutate({ id: l.id, status: 'rejected', reason: 'Not approved' })}
                          className="flex-1 py-1.5 text-xs bg-red-500 text-white rounded-lg hover:bg-red-600 flex items-center justify-center gap-1">
                          <XCircle size={12} /> Reject
                        </button>
                      </div>
                    )}
                  </div>
                ))}
                {!leaves?.length && <p className="text-center text-gray-400 text-sm py-6">No pending leave requests</p>}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PAYROLL */}
      {tab === 4 && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <select value={selectedMonth} onChange={e => setSelectedMonth(parseInt(e.target.value))}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white">
              {months.map((m, i) => <option key={m} value={i+1}>{m}</option>)}
            </select>
            <select value={selectedYear} onChange={e => setSelectedYear(parseInt(e.target.value))}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white">
              {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
            <span className="text-sm text-gray-500">{payrolls?.length ?? 0} payroll records</span>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
              <h2 className="text-sm font-semibold text-gray-700 mb-4">Generate Payroll</h2>
              <form onSubmit={payrollForm.handleSubmit(d => generatePayroll.mutate(d))} className="space-y-3">
                <div><label className="block text-xs text-gray-500 mb-1">Staff ID *</label>
                  <input {...payrollForm.register('staff_id', { required: true })} type="number" className={inputCls} /></div>
                <div><label className="block text-xs text-gray-500 mb-1">Bonus ₹</label>
                  <input {...payrollForm.register('bonus')} type="number" defaultValue="0" className={inputCls} /></div>
                <div><label className="block text-xs text-gray-500 mb-1">Loan Deduction ₹</label>
                  <input {...payrollForm.register('loan_deduction')} type="number" defaultValue="0" className={inputCls} /></div>
                <div><label className="block text-xs text-gray-500 mb-1">Remarks</label>
                  <textarea {...payrollForm.register('remarks')} rows={2} className={inputCls} /></div>
                <button type="submit" className="w-full py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700">
                  Generate for {months[selectedMonth-1]} {selectedYear}
                </button>
              </form>
            </div>

            <div className="col-span-2 bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              <table className="w-full">
                <thead><tr className="bg-gray-50">
                  {['Payroll No.','Staff','Days','Gross ₹','Deductions ₹','Net ₹','Status','Action'].map(h => (
                    <th key={h} className="text-left text-xs font-semibold text-gray-500 px-3 py-3">{h}</th>
                  ))}
                </tr></thead>
                <tbody className="divide-y divide-gray-50">
                  {payrolls?.map((p: any) => (
                    <tr key={p.id} className="hover:bg-gray-50">
                      <td className="px-3 py-3 text-xs font-mono text-gray-600">{p.payroll_number}</td>
                      <td className="px-3 py-3 text-sm text-gray-700">{p.staff_id}</td>
                      <td className="px-3 py-3 text-xs text-gray-500">{p.days_present}/{p.total_working_days}</td>
                      <td className="px-3 py-3 text-sm font-medium text-gray-800">₹{p.gross_salary?.toLocaleString()}</td>
                      <td className="px-3 py-3 text-sm text-red-500">₹{p.total_deductions?.toLocaleString()}</td>
                      <td className="px-3 py-3 text-sm font-bold text-green-600">₹{p.net_salary?.toLocaleString()}</td>
                      <td className="px-3 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${p.status === 'paid' ? 'bg-green-100 text-green-700' : p.status === 'processed' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'}`}>
                          {p.status}
                        </span>
                      </td>
                      <td className="px-3 py-3">
                        {p.status !== 'paid' && (
                          <button onClick={() => markPaid.mutate({ id: p.id, mode: 'bank_transfer' })}
                            className="text-xs text-green-600 hover:underline">Mark Paid</button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {!payrolls?.length && <tr><td colSpan={8} className="text-center py-10 text-gray-400">No payroll records for {months[selectedMonth-1]} {selectedYear}</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* HOLIDAYS */}
      {tab === 5 && (
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">Add Holiday</h2>
            <form onSubmit={holidayForm.handleSubmit(d => createHoliday.mutate(d))} className="space-y-3">
              <div><label className="block text-xs text-gray-500 mb-1">Holiday Name *</label>
                <input {...holidayForm.register('name', { required: true })} className={inputCls} placeholder="Pongal" /></div>
              <div><label className="block text-xs text-gray-500 mb-1">Date *</label>
                <input {...holidayForm.register('date', { required: true })} type="date" className={inputCls} /></div>
              <div><label className="block text-xs text-gray-500 mb-1">Type</label>
                <select {...holidayForm.register('holiday_type')} className={`${inputCls} bg-white`}>
                  <option value="national">National</option>
                  <option value="optional">Optional</option>
                  <option value="restricted">Restricted</option>
                </select></div>
              <button type="submit" className="w-full py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700">Add Holiday</button>
            </form>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">Holidays {selectedYear}</h2>
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {holidays?.map((h: any) => (
                <div key={h.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-gray-800">{h.name}</p>
                    <p className="text-xs text-gray-400">{format(new Date(h.date), 'EEEE, dd MMM yyyy')}</p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${h.holiday_type === 'national' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'}`}>
                    {h.holiday_type}
                  </span>
                </div>
              ))}
              {!holidays?.length && <p className="text-center text-gray-400 text-sm py-6">No holidays added</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
