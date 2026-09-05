import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm, useFieldArray } from 'react-hook-form'
import { hrService } from '../../services/api'
import { Users, Clock, Calendar, IndianRupee, Plus, CheckCircle, XCircle, FileText, Wallet, CalendarClock, Trash2, Calculator } from 'lucide-react'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import { cleanPayload } from '../../utils/form'
import { printSalarySlip } from '../../utils/print'
import CustomSelect from '../../components/ui/CustomSelect'

const inputCls = "input"
const TABS = ['Dashboard', 'Staff', 'Attendance', 'Leaves', 'Payroll', 'Holidays', 'Salary Structure', 'Shift Assignment']

const LEAVE_STATUS_COLORS: Record<string, string> = {
  pending: 'badge-amber',
  approved: 'badge-green',
  rejected: 'bg-red-100 text-red-600',
  cancelled: 'badge-gray',
}

export default function HRPage() {
  const qc = useQueryClient()
  const [tab, setTab] = useState(0)
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [payrollStaffId, setPayrollStaffId] = useState('')
  const { register, setValue, watch, handleSubmit, reset } = useForm()
  const staffForm = useForm()
  const deptForm = useForm()
  const leaveForm = useForm()
  const payrollForm = useForm()
  const holidayForm = useForm()
  const salaryForm = useForm({ defaultValues: { staff_id: '', basic: '', components: [] as any[] } })
  const { fields: salaryComponents, append: addComponent, remove: removeComponent } = useFieldArray({ control: salaryForm.control, name: 'components' })
  const shiftForm = useForm()
  const [lookupStaffId, setLookupStaffId] = useState('')
  const [shiftFilterDate, setShiftFilterDate] = useState('')

  const { data: stats } = useQuery({ queryKey: ['hr-stats'], queryFn: () => hrService.getDashboard().then(r => r.data) })
  const { data: staff } = useQuery({ queryKey: ['staff'], queryFn: () => hrService.listStaff().then(r => r.data) })
  const { data: departments } = useQuery({ queryKey: ['departments'], queryFn: () => hrService.listDepartments().then(r => r.data) })
  const { data: designations } = useQuery({ queryKey: ['designations'], queryFn: () => hrService.listDesignations().then(r => r.data) })
  const { data: leaves } = useQuery({ queryKey: ['leaves'], queryFn: () => hrService.listLeaves({ status: 'pending' }).then(r => r.data) })
  const { data: holidays } = useQuery({ queryKey: ['holidays'], queryFn: () => hrService.listHolidays(selectedYear).then(r => r.data) })
  const { data: payrolls } = useQuery({ queryKey: ['payrolls', selectedMonth, selectedYear], queryFn: () => hrService.listPayrolls({ month: selectedMonth, year: selectedYear }).then(r => r.data) })

  const { data: lookedUpStructure, isFetching: structureLoading, error: structureError } = useQuery({
    queryKey: ['salary-structure', lookupStaffId],
    queryFn: () => hrService.getSalaryStructure(parseInt(lookupStaffId)).then(r => r.data),
    enabled: !!lookupStaffId,
    retry: false,
  })
  const { data: computedSalary } = useQuery({
    queryKey: ['salary-compute', lookupStaffId],
    queryFn: () => hrService.computeSalary(parseInt(lookupStaffId)).then(r => r.data),
    enabled: !!lookupStaffId && !!lookedUpStructure,
    retry: false,
  })

  const { data: shiftAssignments } = useQuery({
    queryKey: ['shift-assignments', shiftFilterDate],
    queryFn: () => hrService.listShiftAssignments(shiftFilterDate ? { shift_date: shiftFilterDate } : undefined).then(r => r.data),
  })

  const createDept = useMutation({
    mutationFn: (d: any) => hrService.createDepartment(cleanPayload(d)),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['departments'] }); deptForm.reset(); toast.success('Department created') },
    onError: (err: any) => toast.error(err.response?.data?.detail || 'Failed to create department')
  })

  const createStaff = useMutation({
    mutationFn: (d: any) => hrService.createStaff(cleanPayload({ ...d, user_id: parseInt(d.user_id), department_id: d.department_id ? parseInt(d.department_id) : undefined, designation_id: d.designation_id ? parseInt(d.designation_id) : undefined, basic_salary: parseFloat(d.basic_salary), hra: parseFloat(d.hra || 0), da: parseFloat(d.da || 0) })),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['staff'] }); staffForm.reset(); toast.success('Staff profile created') },
    onError: (err: any) => toast.error(err.response?.data?.detail || 'Failed to create staff profile')
  })

  const approveLeave = useMutation({
    mutationFn: ({ id, status, reason }: any) => hrService.approveLeave(id, cleanPayload({ status, rejection_reason: reason })),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['leaves'] }); toast.success('Leave updated') },
    onError: (err: any) => toast.error(err.response?.data?.detail || 'Failed to update leave')
  })

  const applyLeave = useMutation({
    mutationFn: (d: any) => hrService.applyLeave(cleanPayload({ ...d, staff_id: parseInt(d.staff_id) })),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['leaves'] }); leaveForm.reset(); toast.success('Leave applied') },
    onError: (err: any) => toast.error(err.response?.data?.detail || 'Failed to apply leave')
  })

  const generatePayroll = useMutation({
    mutationFn: (d: any) => hrService.generatePayroll(cleanPayload({ ...d, staff_id: parseInt(d.staff_id), month: selectedMonth, year: selectedYear, bonus: parseFloat(d.bonus || 0), loan_deduction: parseFloat(d.loan_deduction || 0) })),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['payrolls'] }); payrollForm.reset(); toast.success('Payroll generated!') },
    onError: (err: any) => toast.error(err.response?.data?.detail || 'Failed to generate payroll')
  })

  const markPaid = useMutation({
    mutationFn: ({ id, mode }: any) => hrService.updatePayroll(id, { status: 'paid', payment_date: format(new Date(), 'yyyy-MM-dd'), payment_mode: mode }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['payrolls'] }); toast.success('Marked as paid') },
    onError: (err: any) => toast.error(err.response?.data?.detail || 'Failed to update payroll')
  })

  const createHoliday = useMutation({
    mutationFn: (d: any) => hrService.createHoliday(cleanPayload(d)),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['holidays'] }); holidayForm.reset(); toast.success('Holiday added') },
    onError: (err: any) => toast.error(err.response?.data?.detail || 'Failed to add holiday')
  })

  const createSalaryStructure = useMutation({
    mutationFn: (d: any) => hrService.createSalaryStructure(cleanPayload({
      ...d,
      staff_id: parseInt(d.staff_id),
      basic: parseFloat(d.basic),
      components: (d.components || []).map((c: any) => ({ ...c, value: parseFloat(c.value || 0), is_earning: c.is_earning === true || c.is_earning === 'true' })),
    })),
    onSuccess: (_res, vars) => {
      qc.invalidateQueries({ queryKey: ['salary-structure'] })
      qc.invalidateQueries({ queryKey: ['salary-compute'] })
      toast.success('Salary structure saved')
      salaryForm.reset({ staff_id: vars.staff_id, basic: '', components: [] })
    },
    onError: (err: any) => toast.error(err.response?.data?.detail || 'Failed to save salary structure')
  })

  const createShiftAssignment = useMutation({
    mutationFn: (d: any) => hrService.createShiftAssignment(cleanPayload({
      ...d,
      staff_id: parseInt(d.staff_id),
      department_id: d.department_id ? parseInt(d.department_id) : undefined,
    })),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['shift-assignments'] })
      shiftForm.reset()
      toast.success('Shift assigned')
    },
    onError: (err: any) => toast.error(err.response?.data?.detail || 'Failed to assign shift — check for an overlapping shift')
  })

  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div><h1 className="page-title">HR & Payroll</h1>
          <p className="page-subtitle">Staff management · Attendance · Leave · Payroll</p></div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-5 gap-3">
        {[
          { label: 'Total Staff', value: stats?.total_staff, color: 'text-violet-600' },
          { label: 'Present Today', value: stats?.present_today, color: 'text-green-600' },
          { label: 'On Leave', value: stats?.on_leave_today, color: 'text-amber-600' },
          { label: 'Absent', value: stats?.absent_today, color: 'text-red-500' },
          { label: 'Pending Leave Approvals', value: stats?.pending_leave_approvals, color: 'text-purple-600' },
        ].map(({ label, value, color }) => (
          <div key={label} className="card">
            <p className={`text-2xl font-bold ${color}`}>{value ?? 0}</p>
            <p className="text-xs text-gray-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="tabs">
        {TABS.map((t, i) => (
          <button key={t} onClick={() => setTab(i)}
            className={`px-4 py-1.5 text-sm font-medium rounded-md transition
              ${tab === i ? 'tab active' : 'tab'}`}>
            {t}
          </button>
        ))}
      </div>

      {/* DASHBOARD */}
      {tab === 0 && (
        <div className="grid grid-cols-2 gap-4">
          <div className="card">
            <h2 className="section-title" style={{marginBottom:16}}>Add Department</h2>
            <form onSubmit={deptForm.handleSubmit(d => createDept.mutate(d))} className="space-y-3">
              <div><label className="block text-xs text-gray-500 mb-1">Dept Code *</label>
                <input {...deptForm.register('dept_code', { required: true })} className={inputCls} placeholder="CARD" /></div>
              <div><label className="block text-xs text-gray-500 mb-1">Department Name *</label>
                <input {...deptForm.register('name', { required: true })} className={inputCls} placeholder="Cardiology" /></div>
              <div><label className="block text-xs text-gray-500 mb-1">Description</label>
                <textarea {...deptForm.register('description')} rows={2} className={inputCls} /></div>
              <button type="submit" className="btn-primary w-full justify-center">Add Department</button>
            </form>
          </div>
          <div className="card">
            <h2 className="section-title" style={{marginBottom:16}}>Departments ({departments?.length ?? 0})</h2>
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
          <div className="card">
            <h2 className="section-title" style={{marginBottom:16}}>Add Staff Profile</h2>
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
                <button type="submit" className="btn-primary">Add Staff</button>
              </div>
            </form>
          </div>

          <div className="table-wrapper">
            <table className="w-full">
              <thead><tr className="bg-purple-50/50">
                {['Emp Code','Name','Department','Designation','Type','Shift','Joined','Status'].map(h => (
                  <th key={h} className="text-left text-xs font-semibold text-gray-500 px-4 py-3">{h}</th>
                ))}
              </tr></thead>
              <tbody className="divide-y divide-purple-50">
                {staff?.map((s: any) => (
                  <tr key={s.id} className="hover:bg-purple-50/30">
                    <td className="px-4 py-3 text-xs font-mono text-gray-600">{s.employee_code}</td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{s.full_name}</td>
                    <td className="px-4 py-3 page-subtitle">{s.department_name || '—'}</td>
                    <td className="px-4 py-3 page-subtitle">{s.designation_title || '—'}</td>
                    <td className="px-4 py-3"><span className="text-xs badge-blue px-2 py-0.5 rounded-full capitalize">{s.employment_type}</span></td>
                    <td className="px-4 py-3 text-xs text-gray-500">{s.shift}</td>
                    <td className="px-4 py-3 text-xs text-gray-400">{format(new Date(s.date_of_joining), 'dd MMM yyyy')}</td>
                    <td className="px-4 py-3"><span className={`badge ${s.is_active ? 'badge-green' : 'bg-red-100 text-red-600'}`}>{s.is_active ? 'Active' : 'Inactive'}</span></td>
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
          <div className="card">
            <h2 className="section-title" style={{marginBottom:16}}>Mark Attendance</h2>
            <form onSubmit={handleSubmit(d => hrService.markAttendance(cleanPayload({ ...d, staff_id: parseInt(d.staff_id) }))
              .then(() => { reset(); toast.success('Attendance marked') })
              .catch((err: any) => toast.error(err.response?.data?.detail || 'Failed to mark attendance')))} className="space-y-3">
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
              <button type="submit" className="btn-primary w-full justify-center">Mark Attendance</button>
            </form>
          </div>
          <div className="card">
            <h2 className="section-title" style={{marginBottom:16}}>Today's Attendance</h2>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Present', value: stats?.present_today, color: 'badge-green' },
                { label: 'Absent', value: stats?.absent_today, color: 'badge-red' },
                { label: 'On Leave', value: stats?.on_leave_today, color: 'badge-amber' },
                { label: 'Total Staff', value: stats?.total_staff, color: 'badge-blue' },
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
            <div className="card">
              <h2 className="section-title" style={{marginBottom:16}}>Apply Leave</h2>
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
                <button type="submit" className="btn-primary w-full justify-center">Apply Leave</button>
              </form>
            </div>

            <div className="card">
              <h2 className="section-title" style={{marginBottom:16}}>Pending Approvals ({leaves?.length ?? 0})</h2>
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
                      <span className={`badge ${LEAVE_STATUS_COLORS[l.status]}`}>{l.status}</span>
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
            <span className="page-subtitle">{payrolls?.length ?? 0} payroll records</span>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="card">
              <h2 className="section-title" style={{marginBottom:16}}>Generate Payroll</h2>
              <form onSubmit={payrollForm.handleSubmit(d => generatePayroll.mutate(d))} className="space-y-3">
                <div><label className="block text-xs text-gray-500 mb-1">Staff ID *</label>
                  <input {...payrollForm.register('staff_id', { required: true })} type="number" className={inputCls} /></div>
                <div><label className="block text-xs text-gray-500 mb-1">Bonus ₹</label>
                  <input {...payrollForm.register('bonus')} type="number" defaultValue="0" className={inputCls} /></div>
                <div><label className="block text-xs text-gray-500 mb-1">Loan Deduction ₹</label>
                  <input {...payrollForm.register('loan_deduction')} type="number" defaultValue="0" className={inputCls} /></div>
                <div><label className="block text-xs text-gray-500 mb-1">Remarks</label>
                  <textarea {...payrollForm.register('remarks')} rows={2} className={inputCls} /></div>
                <button type="submit" className="btn-primary w-full justify-center">
                  Generate for {months[selectedMonth-1]} {selectedYear}
                </button>
              </form>
            </div>

            <div className="col-span-2 table-wrapper">
              <table className="w-full">
                <thead><tr className="bg-purple-50/50">
                  {['Payroll No.','Staff','Days','Gross ₹','Deductions ₹','Net ₹','Status','Action'].map(h => (
                    <th key={h} className="text-left text-xs font-semibold text-gray-500 px-3 py-3">{h}</th>
                  ))}
                </tr></thead>
                <tbody className="divide-y divide-purple-50">
                  {payrolls?.map((p: any) => (
                    <tr key={p.id} className="hover:bg-purple-50/30">
                      <td className="px-3 py-3 text-xs font-mono text-gray-600">{p.payroll_number}</td>
                      <td className="px-3 py-3 text-sm text-gray-700">{p.staff_id}</td>
                      <td className="px-3 py-3 text-xs text-gray-500">{p.days_present}/{p.total_working_days}</td>
                      <td className="px-3 py-3 text-sm font-medium text-gray-800">₹{p.gross_salary?.toLocaleString()}</td>
                      <td className="px-3 py-3 text-sm text-red-500">₹{p.total_deductions?.toLocaleString()}</td>
                      <td className="px-3 py-3 text-sm font-bold text-green-600">₹{p.net_salary?.toLocaleString()}</td>
                      <td className="px-3 py-3">
                        <span className={`badge ${p.status === 'paid' ? 'badge-green' : p.status === 'processed' ? 'badge-blue' : 'badge-gray'}`}>
                          {p.status}
                        </span>
                      </td>
                      <td className="px-3 py-3">
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button onClick={() => printSalarySlip(p)}
                            style={{ fontSize: 11, color: '#7C3AED', background: '#F5F3FF', border: '1px solid #DDD6FE', padding: '3px 8px', borderRadius: 6, cursor: 'pointer' }}>
                            🖨 Slip
                          </button>
                          {p.status !== 'paid' && (
                            <button onClick={() => markPaid.mutate({ id: p.id, mode: 'bank_transfer' })}
                              style={{ fontSize: 11, color: '#059669', background: '#ECFDF5', border: '1px solid #BBF7D0', padding: '3px 8px', borderRadius: 6, cursor: 'pointer' }}>Mark Paid</button>
                          )}
                        </div>
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
          <div className="card">
            <h2 className="section-title" style={{marginBottom:16}}>Add Holiday</h2>
            <form onSubmit={holidayForm.handleSubmit(d => createHoliday.mutate(d))} className="space-y-3">
              <div><label className="block text-xs text-gray-500 mb-1">Holiday Name *</label>
                <input {...holidayForm.register('name', { required: true })} className={inputCls} placeholder="Pongal" /></div>
              <div><label className="block text-xs text-gray-500 mb-1">Date *</label>
                <input {...holidayForm.register('date', { required: true })} type="date" className={inputCls} /></div>
              <div><label className="block text-xs text-gray-500 mb-1">Type</label>
                <CustomSelect value={holidayForm.watch('holiday_type') || ''} onChange={v => holidayForm.setValue('holiday_type', String(v))} placeholder="— Select —" options={[{ value: '', label: '— Select —' }, { value: "national", label: "National" }, { value: "optional", label: "Optional" }, { value: "restricted", label: "Restricted" }]} /></div>
              <button type="submit" className="btn-primary w-full justify-center">Add Holiday</button>
            </form>
          </div>
          <div className="card">
            <h2 className="section-title" style={{marginBottom:16}}>Holidays {selectedYear}</h2>
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {holidays?.map((h: any) => (
                <div key={h.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-gray-800">{h.name}</p>
                    <p className="text-xs text-gray-400">{format(new Date(h.date), 'EEEE, dd MMM yyyy')}</p>
                  </div>
                  <span className={`badge ${h.holiday_type === 'national' ? 'badge-red' : 'badge-gray'}`}>
                    {h.holiday_type}
                  </span>
                </div>
              ))}
              {!holidays?.length && <p className="text-center text-gray-400 text-sm py-6">No holidays added</p>}
            </div>
          </div>
        </div>
      )}

      {/* SALARY STRUCTURE */}
      {tab === 6 && (
        <div className="grid grid-cols-2 gap-4">
          <div className="card">
            <h2 className="section-title" style={{marginBottom:16}}>Set Salary Structure</h2>
            <form onSubmit={salaryForm.handleSubmit(d => createSalaryStructure.mutate(d))} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-xs text-gray-500 mb-1">Staff ID *</label>
                  <input {...salaryForm.register('staff_id', { required: true })} type="number" className={inputCls} /></div>
                <div><label className="block text-xs text-gray-500 mb-1">Basic Salary ₹ *</label>
                  <input {...salaryForm.register('basic', { required: true })} type="number" className={inputCls} placeholder="25000" /></div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs text-gray-500">Components (HRA, DA, PF, etc.)</label>
                  <button type="button" onClick={() => addComponent({ component_name: '', is_earning: 'true', calc_type: 'fixed', value: '' })}
                    className="text-xs text-violet-600 hover:underline flex items-center gap-1">
                    <Plus size={12} /> Add Component
                  </button>
                </div>
                <div className="space-y-2">
                  {salaryComponents.map((field, i) => (
                    <div key={field.id} className="grid grid-cols-12 gap-2 items-center bg-gray-50 rounded-lg p-2">
                      <input {...salaryForm.register(`components.${i}.component_name`, { required: true })}
                        placeholder="HRA" className={`${inputCls} col-span-4`} style={{ margin: 0 }} />
                      <select {...salaryForm.register(`components.${i}.is_earning`)} className={`${inputCls} bg-white col-span-3`} style={{ margin: 0 }}>
                        <option value="true">Earning</option>
                        <option value="false">Deduction</option>
                      </select>
                      <select {...salaryForm.register(`components.${i}.calc_type`)} className={`${inputCls} bg-white col-span-3`} style={{ margin: 0 }}>
                        <option value="fixed">Fixed ₹</option>
                        <option value="percent_of_basic">% of Basic</option>
                        <option value="percent_of_gross">% of Gross</option>
                      </select>
                      <input {...salaryForm.register(`components.${i}.value`, { required: true })} type="number"
                        placeholder="Value" className={`${inputCls} col-span-1`} style={{ margin: 0 }} />
                      <button type="button" onClick={() => removeComponent(i)} className="col-span-1 text-red-400 hover:text-red-600 flex justify-center">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                  {!salaryComponents.length && <p className="text-xs text-gray-400 text-center py-3">No components added — basic-only structure</p>}
                </div>
              </div>

              <button type="submit" className="btn-primary w-full justify-center">
                <Wallet size={14} /> Save Salary Structure
              </button>
              <p className="text-xs text-gray-400">Saving supersedes any existing active structure for this staff member.</p>
            </form>
          </div>

          <div className="card">
            <h2 className="section-title" style={{marginBottom:16}}>Lookup & Compute</h2>
            <div className="flex gap-2 mb-4">
              <input value={lookupStaffId} onChange={e => setLookupStaffId(e.target.value)} type="number"
                placeholder="Enter Staff ID" className={inputCls} style={{ margin: 0 }} />
            </div>

            {!lookupStaffId && <p className="text-center text-gray-400 text-sm py-8">Enter a staff ID to view their structure</p>}
            {lookupStaffId && structureLoading && <p className="text-center text-gray-400 text-sm py-8">Loading...</p>}
            {lookupStaffId && !structureLoading && structureError && (
              <p className="text-center text-gray-400 text-sm py-8">No active salary structure for this staff member</p>
            )}

            {lookedUpStructure && (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-purple-50/50 rounded-lg">
                  <span className="text-sm text-gray-600">Basic Salary</span>
                  <span className="text-sm font-bold text-gray-900">₹{lookedUpStructure.basic?.toLocaleString()}</span>
                </div>

                {computedSalary && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-500">
                      <Calculator size={12} /> COMPUTED (this month)
                    </div>
                    {computedSalary.earnings?.map((e: any, i: number) => (
                      <div key={`e${i}`} className="flex items-center justify-between text-xs px-1">
                        <span className="text-gray-600">{e.component}</span>
                        <span className="text-green-600 font-medium">+₹{e.amount?.toLocaleString()}</span>
                      </div>
                    ))}
                    {computedSalary.deductions?.map((d: any, i: number) => (
                      <div key={`d${i}`} className="flex items-center justify-between text-xs px-1">
                        <span className="text-gray-600">{d.component}</span>
                        <span className="text-red-500 font-medium">-₹{d.amount?.toLocaleString()}</span>
                      </div>
                    ))}
                    <div className="border-t border-gray-100 pt-2 flex items-center justify-between">
                      <span className="text-sm font-semibold text-gray-700">Gross</span>
                      <span className="text-sm font-bold text-gray-900">₹{computedSalary.gross_salary?.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-gray-700">Net</span>
                      <span className="text-sm font-bold text-green-600">₹{computedSalary.net_salary?.toLocaleString()}</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* SHIFT ASSIGNMENT */}
      {tab === 7 && (
        <div className="grid grid-cols-2 gap-4">
          <div className="card">
            <h2 className="section-title" style={{marginBottom:16}}>Assign Shift</h2>
            <form onSubmit={shiftForm.handleSubmit(d => createShiftAssignment.mutate(d))} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-xs text-gray-500 mb-1">Staff ID *</label>
                  <input {...shiftForm.register('staff_id', { required: true })} type="number" className={inputCls} /></div>
                <div><label className="block text-xs text-gray-500 mb-1">Shift Date *</label>
                  <input {...shiftForm.register('shift_date', { required: true })} type="date"
                    defaultValue={format(new Date(), 'yyyy-MM-dd')} className={inputCls} /></div>
              </div>
              <div><label className="block text-xs text-gray-500 mb-1">Shift Name *</label>
                <input {...shiftForm.register('shift_name', { required: true })} className={inputCls} placeholder="Morning / Evening / Night" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-xs text-gray-500 mb-1">Start Time *</label>
                  <input {...shiftForm.register('start_time', { required: true })} type="time" className={inputCls} /></div>
                <div><label className="block text-xs text-gray-500 mb-1">End Time *</label>
                  <input {...shiftForm.register('end_time', { required: true })} type="time" className={inputCls} /></div>
              </div>
              <div><label className="block text-xs text-gray-500 mb-1">Department</label>
                <select {...shiftForm.register('department_id')} className={`${inputCls} bg-white`}>
                  <option value="">— Optional —</option>
                  {departments?.map((d: any) => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select></div>
              <button type="submit" className="btn-primary w-full justify-center">
                <CalendarClock size={14} /> Assign Shift
              </button>
              <p className="text-xs text-gray-400">Overlapping shifts for the same staff member on the same date are rejected.</p>
            </form>
          </div>

          <div className="card">
            <div className="flex items-center justify-between" style={{marginBottom:16}}>
              <h2 className="section-title" style={{marginBottom:0}}>Shift Roster</h2>
              <input value={shiftFilterDate} onChange={e => setShiftFilterDate(e.target.value)} type="date"
                className={inputCls} style={{ margin: 0, width: 'auto' }} />
            </div>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {shiftAssignments?.map((s: any) => (
                <div key={s.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-gray-800">Staff ID: {s.staff_id} — {s.shift_name}</p>
                    <p className="text-xs text-gray-400">{format(new Date(s.shift_date), 'dd MMM yyyy')} • {s.start_time}–{s.end_time}</p>
                  </div>
                  <span className="badge badge-blue">{s.department_id ? `Dept ${s.department_id}` : 'Any Dept'}</span>
                </div>
              ))}
              {!shiftAssignments?.length && <p className="text-center text-gray-400 text-sm py-6">{shiftFilterDate ? 'No shifts on this date' : 'No shift assignments yet'}</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
