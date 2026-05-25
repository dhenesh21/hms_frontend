import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'

 import { queryClient } from './lib/queryClient'
import { useAuthStore } from './store/authStore'

import Layout from './components/layout/Layout'
import LoginPage from './pages/auth/LoginPage'

import Dashboard from './pages/Dashboard'

import PatientListPage from './pages/patients/PatientListPage'
import PatientNewPage from './pages/patients/PatientNewPage'

import IPDDashboard from './pages/ipd/IPDDashboard'
import EMRPage from './pages/emr/EMRPage'

import LabPage from './pages/lab/LabPage'
import OTPage from './pages/ot/OTPage'
import RadiologyPage from './pages/radiology/RadiologyPage'

import BillingPage from './pages/billing/BillingPage'
import PharmacyPage from './pages/pharmacy/PharmacyPage'
import InsurancePage from './pages/insurance/InsurancePage'

import HRPage from './pages/hr/HRPage'
import NursingPage from './pages/nursing/NursingPage'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)

  return isAuthenticated
    ? <Layout>{children}</Layout>
    : <Navigate to="/login" replace />
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>

          <Route path="/login" element={<LoginPage />} />

          <Route path="/" element={<Navigate to="/dashboard" replace />} />

          {/* Dashboard */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          {/* Patients */}
          <Route
            path="/patients"
            element={
              <ProtectedRoute>
                <PatientListPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/patients/new"
            element={
              <ProtectedRoute>
                <PatientNewPage />
              </ProtectedRoute>
            }
          />

          {/* IPD */}
          <Route
            path="/ipd"
            element={
              <ProtectedRoute>
                <IPDDashboard />
              </ProtectedRoute>
            }
          />

          {/* EMR */}
          <Route
            path="/emr/:patientId"
            element={
              <ProtectedRoute>
                <EMRPage />
              </ProtectedRoute>
            }
          />

          {/* Lab */}
          <Route
            path="/lab"
            element={
              <ProtectedRoute>
                <LabPage />
              </ProtectedRoute>
            }
          />

          {/* OT */}
          <Route
            path="/ot"
            element={
              <ProtectedRoute>
                <OTPage />
              </ProtectedRoute>
            }
          />

          {/* Radiology */}
          <Route
            path="/radiology"
            element={
              <ProtectedRoute>
                <RadiologyPage />
              </ProtectedRoute>
            }
          />

          {/* Billing */}
          <Route
            path="/billing"
            element={
              <ProtectedRoute>
                <BillingPage />
              </ProtectedRoute>
            }
          />

          {/* Pharmacy */}
          <Route
            path="/pharmacy"
            element={
              <ProtectedRoute>
                <PharmacyPage />
              </ProtectedRoute>
            }
          />

          {/* Insurance */}
          <Route
            path="/insurance"
            element={
              <ProtectedRoute>
                <InsurancePage />
              </ProtectedRoute>
            }
          />

          {/* HR */}
          <Route
            path="/hr"
            element={
              <ProtectedRoute>
                <HRPage />
              </ProtectedRoute>
            }
          />

          {/* Nursing */}
          <Route
            path="/nursing"
            element={
              <ProtectedRoute>
                <NursingPage />
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<Navigate to="/dashboard" replace />} />

        </Routes>

        <Toaster position="top-right" />
      </BrowserRouter>
    </QueryClientProvider>
  )
}