import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'

import { useAuthStore } from './store/authStore'
import Layout from './components/layout/Layout'

// Auth
import LoginPage from './pages/auth/LoginPage'

// Dashboard
import Dashboard from './pages/Dashboard'

// Patients
import PatientListPage from './pages/patients/PatientListPage'
import PatientNewPage from './pages/patients/PatientNewPage'
import PatientDetailPage from './pages/patients/PatientDetailPage'

// Doctors
import DoctorListPage from './pages/doctors/DoctorListPage'

// Appointments
import AppointmentListPage from './pages/appointments/AppointmentListPage'
import AppointmentNewPage from './pages/appointments/AppointmentNewPage'

// OPD
import OPDListPage from './pages/opd/OPDListPage'
import OPDNewVisitPage from './pages/opd/OPDNewVisitPage'
import OPDVisitDetailPage from './pages/opd/OPDVisitDetailPage'

// IPD
import IPDDashboard from './pages/ipd/IPDDashboard'
import IPDAdmitPage from './pages/ipd/IPDAdmitPage'
import IPDAdmissionDetail from './pages/ipd/IPDAdmissionDetail'

// EMR
import EMRPage from './pages/emr/EMRPage'

// Lab
import LabPage from './pages/lab/LabPage'
import LabNewOrderPage from './pages/lab/LabNewOrderPage'

// OT
import OTPage from './pages/ot/OTPage'
import OTSchedulePage from './pages/ot/OTSchedulePage'

// Nursing
import NursingPage from './pages/nursing/NursingPage'

// Radiology
import RadiologyPage from './pages/radiology/RadiologyPage'

// Phase 3 - Finance
import BillingPage from './pages/billing/BillingPage'
import PharmacyPage from './pages/pharmacy/PharmacyPage'
import InsurancePage from './pages/insurance/InsurancePage'

// Phase 4 - Operations
import HRPage from './pages/hr/HRPage'

// ─── Missing pages placeholder (create these files) ───────────────────────────
// import ReportsPage from './pages/reports/ReportsPage'
// import SettingsPage from './pages/settings/SettingsPage'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30000 },
  },
})

// ─── Protected Route Wrapper ──────────────────────────────────────────────────
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  return isAuthenticated
    ? <Layout>{children}</Layout>
    : <Navigate to="/login" replace />
}

// ─── App ──────────────────────────────────────────────────────────────────────
export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>

          {/* ── Public ── */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />

          {/* ── Dashboard ── */}
          <Route path="/dashboard" element={
            <ProtectedRoute><Dashboard /></ProtectedRoute>
          } />

          {/* ── Phase 1: Patients ── */}
          <Route path="/patients" element={
            <ProtectedRoute><PatientListPage /></ProtectedRoute>
          } />
          <Route path="/patients/new" element={
            <ProtectedRoute><PatientNewPage /></ProtectedRoute>
          } />
          <Route path="/patients/:id" element={
            <ProtectedRoute><PatientDetailPage /></ProtectedRoute>
          } />

          {/* ── Phase 1: Doctors ── */}
          <Route path="/doctors" element={
            <ProtectedRoute><DoctorListPage /></ProtectedRoute>
          } />

          {/* ── Phase 1: Appointments ── */}
          <Route path="/appointments" element={
            <ProtectedRoute><AppointmentListPage /></ProtectedRoute>
          } />
          <Route path="/appointments/new" element={
            <ProtectedRoute><AppointmentNewPage /></ProtectedRoute>
          } />

          {/* ── Phase 1: OPD ── */}
          <Route path="/opd" element={
            <ProtectedRoute><OPDListPage /></ProtectedRoute>
          } />
          <Route path="/opd/new" element={
            <ProtectedRoute><OPDNewVisitPage /></ProtectedRoute>
          } />
          <Route path="/opd/:visitId" element={
            <ProtectedRoute><OPDVisitDetailPage /></ProtectedRoute>
          } />

          {/* ── Phase 2: IPD ── */}
          <Route path="/ipd" element={
            <ProtectedRoute><IPDDashboard /></ProtectedRoute>
          } />
          <Route path="/ipd/admit" element={
            <ProtectedRoute><IPDAdmitPage /></ProtectedRoute>
          } />
          <Route path="/ipd/:admissionId" element={
            <ProtectedRoute><IPDAdmissionDetail /></ProtectedRoute>
          } />

          {/* ── Phase 2: EMR ── */}
          <Route path="/emr" element={
            <ProtectedRoute><EMRPage /></ProtectedRoute>
          } />
          <Route path="/emr/:patientId" element={
            <ProtectedRoute><EMRPage /></ProtectedRoute>
          } />

          {/* ── Phase 2: Lab ── */}
          <Route path="/lab" element={
            <ProtectedRoute><LabPage /></ProtectedRoute>
          } />
          <Route path="/lab/new" element={
            <ProtectedRoute><LabNewOrderPage /></ProtectedRoute>
          } />

          {/* ── Phase 2: OT ── */}
          <Route path="/ot" element={
            <ProtectedRoute><OTPage /></ProtectedRoute>
          } />
          <Route path="/ot/schedule" element={
            <ProtectedRoute><OTSchedulePage /></ProtectedRoute>
          } />

          {/* ── Phase 2: Nursing ── */}
          <Route path="/nursing" element={
            <ProtectedRoute><NursingPage /></ProtectedRoute>
          } />

          {/* ── Phase 2: Radiology ── */}
          <Route path="/radiology" element={
            <ProtectedRoute><RadiologyPage /></ProtectedRoute>
          } />

          {/* ── Phase 3: Billing ── */}
          <Route path="/billing" element={
            <ProtectedRoute><BillingPage /></ProtectedRoute>
          } />

          {/* ── Phase 3: Pharmacy ── */}
          <Route path="/pharmacy" element={
            <ProtectedRoute><PharmacyPage /></ProtectedRoute>
          } />

          {/* ── Phase 3: Insurance ── */}
          <Route path="/insurance" element={
            <ProtectedRoute><InsurancePage /></ProtectedRoute>
          } />

          {/* ── Phase 4: HR ── */}
          <Route path="/hr" element={
            <ProtectedRoute><HRPage /></ProtectedRoute>
          } />

          {/* ── Phase 4: Reports & Settings (create pages first, then uncomment) ── */}
          {/* <Route path="/reports" element={
            <ProtectedRoute><ReportsPage /></ProtectedRoute>
          } /> */}
          {/* <Route path="/settings" element={
            <ProtectedRoute><SettingsPage /></ProtectedRoute>
          } /> */}

          {/* ── Catch-all ── */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />

        </Routes>
      </BrowserRouter>

      <Toaster position="top-right" />
    </QueryClientProvider>
  )
}
