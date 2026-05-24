import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import Layout from './components/layout/Layout'
import LoginPage from './pages/auth/LoginPage'
import Dashboard from './pages/Dashboard'
import PatientListPage from './pages/patients/PatientListPage'
import PatientNewPage from './pages/patients/PatientNewPage'
import PatientDetailPage from './pages/patients/PatientDetailPage'
import DoctorListPage from './pages/doctors/DoctorListPage'
import AppointmentListPage from './pages/appointments/AppointmentListPage'
import AppointmentNewPage from './pages/appointments/AppointmentNewPage'
import OPDListPage from './pages/opd/OPDListPage'
import OPDNewVisitPage from './pages/opd/OPDNewVisitPage'
import OPDVisitDetailPage from './pages/opd/OPDVisitDetailPage'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  return isAuthenticated ? <Layout>{children}</Layout> : <Navigate to="/login" replace />
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />

        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />

        {/* Patients */}
        <Route path="/patients" element={<ProtectedRoute><PatientListPage /></ProtectedRoute>} />
        <Route path="/patients/new" element={<ProtectedRoute><PatientNewPage /></ProtectedRoute>} />
        <Route path="/patients/:id" element={<ProtectedRoute><PatientDetailPage /></ProtectedRoute>} />

        {/* Doctors */}
        <Route path="/doctors" element={<ProtectedRoute><DoctorListPage /></ProtectedRoute>} />

        {/* Appointments */}
        <Route path="/appointments" element={<ProtectedRoute><AppointmentListPage /></ProtectedRoute>} />
        <Route path="/appointments/new" element={<ProtectedRoute><AppointmentNewPage /></ProtectedRoute>} />

        {/* OPD */}
        <Route path="/opd" element={<ProtectedRoute><OPDListPage /></ProtectedRoute>} />
        <Route path="/opd/new" element={<ProtectedRoute><OPDNewVisitPage /></ProtectedRoute>} />
        <Route path="/opd/visits/:id" element={<ProtectedRoute><OPDVisitDetailPage /></ProtectedRoute>} />

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
