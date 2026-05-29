import { Shield, CheckCircle } from 'lucide-react'

const ROLES = [
  { role: 'admin', label: 'Admin', color: 'bg-red-100 text-red-700', access: ['Patient Management', 'All OPD/IPD', 'Billing', 'Pharmacy', 'Lab', 'HR', 'Reports', 'User Management'] },
  { role: 'doctor', label: 'Doctor', color: 'bg-blue-100 text-blue-700', access: ['Patient View', 'OPD Consultation', 'IPD Visit', 'Prescriptions', 'Lab Orders', 'Radiology Orders'] },
  { role: 'nurse', label: 'Nurse', color: 'bg-green-100 text-green-700', access: ['Patient View', 'IPD Nursing Notes', 'Vital Charts', 'MAR', 'Care Plans', 'Shift Handover'] },
  { role: 'receptionist', label: 'Receptionist', color: 'bg-amber-100 text-amber-700', access: ['Patient Registration', 'Appointment Booking', 'OPD Check-in', 'Basic Billing'] },
  { role: 'pharmacist', label: 'Pharmacist', color: 'bg-purple-100 text-purple-700', access: ['Drug Dispensing', 'Stock Management', 'Purchase Orders', 'Expiry Alerts'] },
  { role: 'lab_technician', label: 'Lab Technician', color: 'bg-teal-100 text-teal-700', access: ['Sample Collection', 'Result Entry', 'Lab Worklist', 'Report Generation'] },
  { role: 'radiologist', label: 'Radiologist', color: 'bg-indigo-100 text-indigo-700', access: ['Scan Orders View', 'Report Writing', 'Image Upload', 'Report Approval'] },
  { role: 'accountant', label: 'Accountant', color: 'bg-orange-100 text-orange-700', access: ['Billing', 'Payment Collection', 'Insurance Claims', 'Financial Reports'] },
  { role: 'hr', label: 'HR Staff', color: 'bg-pink-100 text-pink-700', access: ['Staff Management', 'Attendance', 'Leave Management', 'Payroll'] },
]

export default function RolesPage() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Roles & Access</h1>
        <p className="text-sm text-gray-500">System roles and their access levels</p>
      </div>
      <div className="grid grid-cols-3 gap-4">
        {ROLES.map(({ role, label, color, access }) => (
          <div key={role} className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <Shield size={20} className="text-gray-400" />
              <div>
                <span className={`text-xs px-2.5 py-1 rounded-full font-bold ${color}`}>{label}</span>
                <p className="text-xs text-gray-400 mt-0.5 font-mono">{role}</p>
              </div>
            </div>
            <div className="space-y-1.5">
              {access.map(a => (
                <div key={a} className="flex items-center gap-2">
                  <CheckCircle size={13} className="text-green-500 flex-shrink-0" />
                  <span className="text-xs text-gray-600">{a}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
