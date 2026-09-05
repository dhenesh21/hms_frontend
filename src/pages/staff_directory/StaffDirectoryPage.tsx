import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { hrService, doctorService } from '../../services/api'
import { Search, Stethoscope, Briefcase, Mail, Calendar, Badge } from 'lucide-react'
import { format } from 'date-fns'

const inputCls = "w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-violet-500 outline-none"

type UnifiedPerson = {
  key: string
  kind: 'doctor' | 'staff'
  name: string
  role: string
  department?: string
  extra?: string
  active: boolean
  linkId?: number
  meta?: string
}

export default function StaffDirectoryPage() {
  const [search, setSearch] = useState('')
  const [kindFilter, setKindFilter] = useState<'all' | 'doctor' | 'staff'>('all')
  const [deptFilter, setDeptFilter] = useState('')

  const { data: departments } = useQuery({
    queryKey: ['hr-departments'],
    queryFn: () => hrService.listDepartments().then(r => r.data),
  })

  const { data: staff, isLoading: staffLoading } = useQuery({
    queryKey: ['hr-staff-directory'],
    queryFn: () => hrService.listStaff().then(r => r.data),
  })

  const { data: doctors, isLoading: doctorsLoading } = useQuery({
    queryKey: ['doctors-directory'],
    queryFn: () => doctorService.list().then(r => r.data),
  })

  const unified: UnifiedPerson[] = useMemo(() => {
    const doctorRows: UnifiedPerson[] = (doctors || []).map((d: any) => ({
      key: `doctor-${d.id}`,
      kind: 'doctor',
      name: d.full_name,
      role: d.specialization,
      department: d.department,
      extra: d.email,
      active: d.is_available,
      linkId: d.id,
      meta: `${d.experience_years ?? 0} yrs exp`,
    }))
    const staffRows: UnifiedPerson[] = (staff || []).map((s: any) => ({
      key: `staff-${s.id}`,
      kind: 'staff',
      name: s.full_name,
      role: s.designation_title || s.employment_type,
      department: s.department_name,
      extra: s.employee_code,
      active: s.is_active,
      linkId: s.id,
      meta: `Joined ${format(new Date(s.date_of_joining), 'dd MMM yyyy')}`,
    }))
    return [...doctorRows, ...staffRows]
  }, [doctors, staff])

  const filtered = unified.filter(p => {
    if (kindFilter !== 'all' && p.kind !== kindFilter) return false
    if (deptFilter && p.department !== deptFilter) return false
    if (search && !`${p.name} ${p.role} ${p.extra || ''}`.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const isLoading = staffLoading || doctorsLoading

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Staff Directory</h1>
          <p className="text-sm text-gray-500">All doctors and staff in one place — {unified.length} people</p>
        </div>
      </div>

      {/* FILTERS */}
      <div className="flex items-center gap-3 flex-wrap bg-white border border-gray-100 rounded-xl p-3 shadow-sm">
        <div className="relative flex-1 min-w-[220px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, role, employee code..."
            className={`${inputCls} pl-9`} />
        </div>
        <div className="flex bg-gray-50 rounded-lg p-1">
          {(['all', 'doctor', 'staff'] as const).map(k => (
            <button key={k} onClick={() => setKindFilter(k)}
              className={`text-xs font-medium px-3 py-1.5 rounded-md capitalize transition ${kindFilter === k ? 'bg-white shadow-sm text-violet-700' : 'text-gray-500 hover:text-gray-700'}`}>
              {k === 'all' ? 'All' : k === 'doctor' ? 'Doctors' : 'Staff'}
            </button>
          ))}
        </div>
        <select value={deptFilter} onChange={e => setDeptFilter(e.target.value)} className={`${inputCls} bg-white w-auto`}>
          <option value="">All Departments</option>
          {(departments || []).map((d: any) => (
            <option key={d.id} value={d.name}>{d.name}</option>
          ))}
        </select>
      </div>

      {/* GRID */}
      {isLoading ? (
        <div className="text-center py-12 text-gray-400">Loading directory...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-100">
          <Badge size={36} className="mx-auto mb-3 text-gray-200" />
          <p className="text-gray-400">No matching people found</p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {filtered.map(p => (
            <div key={p.key} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${p.kind === 'doctor' ? 'bg-violet-100 text-violet-600' : 'bg-blue-100 text-blue-600'}`}>
                    {p.kind === 'doctor' ? <Stethoscope size={16} /> : <Briefcase size={16} />}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      {p.kind === 'doctor' ? 'Dr. ' : ''}{p.name}
                    </p>
                    <p className="text-xs text-gray-500">{p.role}</p>
                  </div>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${p.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                  {p.active ? 'Active' : (p.kind === 'doctor' ? 'Unavailable' : 'Inactive')}
                </span>
              </div>
              <div className="mt-3 space-y-1 text-xs text-gray-500">
                {p.department && <p className="flex items-center gap-1.5"><Briefcase size={11} /> {p.department}</p>}
                {p.kind === 'doctor' ? (
                  p.extra && <p className="flex items-center gap-1.5"><Mail size={11} /> {p.extra}</p>
                ) : (
                  p.extra && <p className="flex items-center gap-1.5"><Badge size={11} /> {p.extra}</p>
                )}
                {p.meta && <p className="flex items-center gap-1.5"><Calendar size={11} /> {p.meta}</p>}
              </div>
              {p.kind === 'doctor' && p.linkId && (
                <Link to="/doctors/availability" className="mt-3 inline-block text-xs text-violet-600 hover:underline">
                  View availability →
                </Link>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
