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
import EmergencyPage from './pages/emergency/EmergencyPage'
import CriticalCarePage from './pages/critical_care/CriticalCarePage'
import AmbulancePage from './pages/ambulance/AmbulancePage'
import BirthRegisterPage from './pages/birth_register/BirthRegisterPage'
import MortuaryPage from './pages/mortuary/MortuaryPage'
import HousekeepingPage from './pages/housekeeping/HousekeepingPage'
import InfectionControlPage from './pages/infection_control/InfectionControlPage'
import FrontDeskPage from './pages/front_desk/FrontDeskPage'
import CSSDPage from './pages/cssd/CSSDPage'
import FacilityPage from './pages/facility/FacilityPage'
import SecurityIncidentPage from './pages/security_incident/SecurityIncidentPage'
import CPOEPage from './pages/cpoe/CPOEPage'
import ConsentPage from './pages/consent/ConsentPage'
import ClinicalFormsPage from './pages/clinical_forms/ClinicalFormsPage'
import CarePlansPage from './pages/care_plans/CarePlansPage'
import ClinicalTimelinePage from './pages/clinical_timeline/ClinicalTimelinePage'
import AnesthesiaPage from './pages/anesthesia/AnesthesiaPage'
import RecoveryRoomPage from './pages/recovery_room/RecoveryRoomPage'
import PhysiotherapyPage from './pages/physiotherapy/PhysiotherapyPage'
import PainManagementPage from './pages/pain_management/PainManagementPage'
import PalliativeCarePage from './pages/palliative_care/PalliativeCarePage'
import TelemedicinePage from './pages/telemedicine/TelemedicinePage'
import PreventiveHealthPage from './pages/preventive_health/PreventiveHealthPage'
import FamilyPage from './pages/family/FamilyPage'
import PatientCategoryPage from './pages/patient_category/PatientCategoryPage'
import CDSPage from './pages/cds/CDSPage'
import DoctorPortalPage from './pages/doctor_portal/DoctorPortalPage'
import NursePortalPage from './pages/nurse_portal/NursePortalPage'
import NurseRosterPage from './pages/nurse_portal/NurseRosterPage'
import PatientPortalAdminPage from './pages/patient_portal/PatientPortalAdminPage'
import PatientLayout, { PatientProtectedRoute } from './components/patient_web/PatientLayout'
import PatientLoginPage from './pages/patient_web/PatientLoginPage'
import PatientRegisterPage from './pages/patient_web/PatientRegisterPage'
import PatientHomePage from './pages/patient_web/PatientHomePage'
import PatientAppointmentsPage from './pages/patient_web/PatientAppointmentsPage'
import PatientRecordsPage from './pages/patient_web/PatientRecordsPage'
import PatientBillingPage from './pages/patient_web/PatientBillingPage'
import PatientTelemedicinePage from './pages/patient_web/PatientTelemedicinePage'
import PatientFeedbackPage from './pages/patient_web/PatientFeedbackPage'
import DialysisPage from './pages/dialysis/DialysisPage'
import MentalHealthPage from './pages/mental_health/MentalHealthPage'
import FertilityPage from './pages/fertility/FertilityPage'
import OncologyPage from './pages/oncology/OncologyPage'
import TransplantPage from './pages/transplant/TransplantPage'
import MPIPage from './pages/mpi/MPIPage'
import ProviderRegistryPage from './pages/provider_registry/ProviderRegistryPage'
import FacilityRegistryPage from './pages/facility_registry/FacilityRegistryPage'
import TerminologyPage from './pages/terminology/TerminologyPage'
import DataGovernancePage from './pages/data_governance/DataGovernancePage'
import FHIRPage from './pages/fhir/FHIRPage'
import HL7Page from './pages/hl7/HL7Page'
import DataExchangePage from './pages/data_exchange/DataExchangePage'
import IdentityProviderPage from './pages/identity_provider/IdentityProviderPage'
import DICOMPage from './pages/dicom/DICOMPage'
import PaymentGatewayPage from './pages/payment_gateway/PaymentGatewayPage'
import InventoryPage from './pages/inventory/InventoryPage'

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

// Diagnostic Report Templates
import ReportTemplatesPage from './pages/report_templates/ReportTemplatesPage'

// Analytics
import AnalyticsPage from './pages/analytics/AnalyticsPage'

// Staff Directory
import StaffDirectoryPage from './pages/staff_directory/StaffDirectoryPage'

// Finance
import BillingPage from './pages/billing/BillingPage'
import PharmacyPage from './pages/pharmacy/PharmacyPage'
import InsurancePage from './pages/insurance/InsurancePage'

// Operations
import HRPage from './pages/hr/HRPage'

// Admin
import UsersListPage from './pages/admin/UsersListPage'
import UserRegisterPage from './pages/admin/UserRegisterPage'
import DepartmentsPage from './pages/admin/DepartmentsPage'
import RolesPage from './pages/admin/RolesPage'
import FacilitiesPage from './pages/admin/FacilitiesPage'
import HospitalSettingsPage from './pages/admin/HospitalSettingsPage'
import DoctorAvailabilityPage from './pages/doctors/DoctorAvailabilityPage'
import MyProfilePage from './pages/profile/MyProfilePage'
import MFASettingsPage from './pages/profile/MFASettingsPage'
import QueuePage from './pages/appointments/QueuePage'
import BloodBankPage from './pages/blood_bank/BloodBankPage'
import AccountsPage from './pages/accounts/AccountsPage'
import MedicalCodingPage from './pages/medical_coding/MedicalCodingPage'
import OrganizationSettingsPage from './pages/organization/OrganizationSettingsPage'
import NotificationSettingsPage from './pages/admin/NotificationSettingsPage'
import BulkImportPage from './pages/admin/BulkImportPage'
import ReferralPage from './pages/referral/ReferralPage'
import DoctorsPage from './pages/admin/staff/DoctorsPage'
import NursesPage from './pages/admin/staff/NursesPage'
import ReceptionistsPage from './pages/admin/staff/ReceptionistsPage'
import LabTechniciansPage from './pages/admin/staff/LabPage' // ✅ renamed import
import PharmacistsPage from './pages/admin/staff/PharmacistsPage'
import AccountantsPage from './pages/admin/staff/AccountantsPage'
import OtherStaffPage from './pages/admin/staff/OtherStaffPage'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30000 },
  },
})

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

          {/* Public */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />

          {/* Patient Web Self-Service — fully separate from staff auth/layout.
              Own login, own token (services/patientApi.ts), own nav shell
              (PatientLayout, no staff sidebar). Reuses the same backend
              patient-portal endpoints the Flutter app calls. */}
          <Route path="/patient/login" element={<PatientLoginPage />} />
          <Route path="/patient/register" element={<PatientRegisterPage />} />
          <Route path="/patient" element={<PatientProtectedRoute><PatientLayout /></PatientProtectedRoute>}>
            <Route path="home" element={<PatientHomePage />} />
            <Route path="appointments" element={<PatientAppointmentsPage />} />
            <Route path="records" element={<PatientRecordsPage />} />
            <Route path="billing" element={<PatientBillingPage />} />
            <Route path="telemedicine" element={<PatientTelemedicinePage />} />
            <Route path="feedback" element={<PatientFeedbackPage />} />
          </Route>

          {/* Dashboard */}
          <Route path="/dashboard" element={
            <ProtectedRoute><Dashboard /></ProtectedRoute>
          } />

          {/* Patients */}
          <Route path="/patients" element={
            <ProtectedRoute><PatientListPage /></ProtectedRoute>
          } />
          <Route path="/patients/new" element={
            <ProtectedRoute><PatientNewPage /></ProtectedRoute>
          } />
          <Route path="/patients/:id" element={
            <ProtectedRoute><PatientDetailPage /></ProtectedRoute>
          } />

          {/* Doctors */}
          <Route path="/doctors" element={
            <ProtectedRoute><DoctorListPage /></ProtectedRoute>
          } />

          {/* Appointments */}
          <Route path="/appointments" element={
            <ProtectedRoute><AppointmentListPage /></ProtectedRoute>
          } />
          <Route path="/appointments/new" element={
            <ProtectedRoute><AppointmentNewPage /></ProtectedRoute>
          } />

          {/* OPD */}
          <Route path="/opd" element={
            <ProtectedRoute><OPDListPage /></ProtectedRoute>
          } />
          <Route path="/opd/new" element={
            <ProtectedRoute><OPDNewVisitPage /></ProtectedRoute>
          } />
          <Route path="/opd/:visitId" element={
            <ProtectedRoute><OPDVisitDetailPage /></ProtectedRoute>
          } />

          {/* Emergency */}
          <Route path="/emergency" element={
            <ProtectedRoute><EmergencyPage /></ProtectedRoute>
          } />

          {/* Critical Care (ICU/CCU/NICU) */}
          <Route path="/critical-care" element={
            <ProtectedRoute><CriticalCarePage /></ProtectedRoute>
          } />

          {/* Ambulance */}
          <Route path="/ambulance" element={
            <ProtectedRoute><AmbulancePage /></ProtectedRoute>
          } />

          {/* Birth Register */}
          <Route path="/birth-register" element={
            <ProtectedRoute><BirthRegisterPage /></ProtectedRoute>
          } />

          {/* Mortuary */}
          <Route path="/mortuary" element={
            <ProtectedRoute><MortuaryPage /></ProtectedRoute>
          } />

          {/* Housekeeping */}
          <Route path="/housekeeping" element={
            <ProtectedRoute><HousekeepingPage /></ProtectedRoute>
          } />

          {/* Infection Control */}
          <Route path="/infection-control" element={
            <ProtectedRoute><InfectionControlPage /></ProtectedRoute>
          } />

          {/* Front Desk (Visitors + Lost & Found) */}
          <Route path="/front-desk" element={
            <ProtectedRoute><FrontDeskPage /></ProtectedRoute>
          } />

          {/* CSSD */}
          <Route path="/cssd" element={
            <ProtectedRoute><CSSDPage /></ProtectedRoute>
          } />

          {/* Facility & Equipment */}
          <Route path="/facility" element={
            <ProtectedRoute><FacilityPage /></ProtectedRoute>
          } />

          {/* Security Incidents */}
          <Route path="/security-incidents" element={
            <ProtectedRoute><SecurityIncidentPage /></ProtectedRoute>
          } />

          {/* Group 4 — Clinical Depth */}
          <Route path="/cpoe" element={<ProtectedRoute><CPOEPage /></ProtectedRoute>} />
          <Route path="/consent" element={<ProtectedRoute><ConsentPage /></ProtectedRoute>} />
          <Route path="/clinical-forms" element={<ProtectedRoute><ClinicalFormsPage /></ProtectedRoute>} />
          <Route path="/care-plans" element={<ProtectedRoute><CarePlansPage /></ProtectedRoute>} />
          <Route path="/clinical-timeline" element={<ProtectedRoute><ClinicalTimelinePage /></ProtectedRoute>} />
          <Route path="/cds" element={<ProtectedRoute><CDSPage /></ProtectedRoute>} />

          {/* Group 4 — Specialized Clinical Departments */}
          <Route path="/anesthesia" element={<ProtectedRoute><AnesthesiaPage /></ProtectedRoute>} />
          <Route path="/recovery-room" element={<ProtectedRoute><RecoveryRoomPage /></ProtectedRoute>} />
          <Route path="/physiotherapy" element={<ProtectedRoute><PhysiotherapyPage /></ProtectedRoute>} />
          <Route path="/pain-management" element={<ProtectedRoute><PainManagementPage /></ProtectedRoute>} />
          <Route path="/palliative-care" element={<ProtectedRoute><PalliativeCarePage /></ProtectedRoute>} />

          {/* Group 4 — Portals & Patient Experience */}
          <Route path="/telemedicine" element={<ProtectedRoute><TelemedicinePage /></ProtectedRoute>} />
          <Route path="/preventive-health" element={<ProtectedRoute><PreventiveHealthPage /></ProtectedRoute>} />
          <Route path="/family" element={<ProtectedRoute><FamilyPage /></ProtectedRoute>} />
          <Route path="/patient-category" element={<ProtectedRoute><PatientCategoryPage /></ProtectedRoute>} />
          <Route path="/doctor-portal" element={<ProtectedRoute><DoctorPortalPage /></ProtectedRoute>} />
          <Route path="/nurse-portal" element={<ProtectedRoute><NursePortalPage /></ProtectedRoute>} />
          <Route path="/nurse-roster" element={<ProtectedRoute><NurseRosterPage /></ProtectedRoute>} />
          <Route path="/patient-portal-admin" element={<ProtectedRoute><PatientPortalAdminPage /></ProtectedRoute>} />

          {/* Group 4 — Niche Specialty Departments */}
          <Route path="/dialysis" element={<ProtectedRoute><DialysisPage /></ProtectedRoute>} />
          <Route path="/mental-health" element={<ProtectedRoute><MentalHealthPage /></ProtectedRoute>} />
          <Route path="/fertility" element={<ProtectedRoute><FertilityPage /></ProtectedRoute>} />
          <Route path="/oncology" element={<ProtectedRoute><OncologyPage /></ProtectedRoute>} />
          <Route path="/transplant" element={<ProtectedRoute><TransplantPage /></ProtectedRoute>} />

          {/* Group 5 — Enterprise Data (Batch A) */}
          <Route path="/mpi" element={<ProtectedRoute><MPIPage /></ProtectedRoute>} />
          <Route path="/provider-registry" element={<ProtectedRoute><ProviderRegistryPage /></ProtectedRoute>} />
          <Route path="/facility-registry" element={<ProtectedRoute><FacilityRegistryPage /></ProtectedRoute>} />
          <Route path="/terminology" element={<ProtectedRoute><TerminologyPage /></ProtectedRoute>} />
          <Route path="/data-governance" element={<ProtectedRoute><DataGovernancePage /></ProtectedRoute>} />
          <Route path="/fhir" element={<ProtectedRoute><FHIRPage /></ProtectedRoute>} />
          <Route path="/hl7" element={<ProtectedRoute><HL7Page /></ProtectedRoute>} />
          <Route path="/data-exchange" element={<ProtectedRoute><DataExchangePage /></ProtectedRoute>} />
          <Route path="/identity-provider" element={<ProtectedRoute><IdentityProviderPage /></ProtectedRoute>} />
          <Route path="/dicom" element={<ProtectedRoute><DICOMPage /></ProtectedRoute>} />
          <Route path="/payment-gateway" element={<ProtectedRoute><PaymentGatewayPage /></ProtectedRoute>} />

          {/* Inventory */}
          <Route path="/inventory" element={
            <ProtectedRoute><InventoryPage /></ProtectedRoute>
          } />

          {/* IPD */}
          <Route path="/ipd" element={
            <ProtectedRoute><IPDDashboard /></ProtectedRoute>
          } />
          <Route path="/ipd/admit" element={
            <ProtectedRoute><IPDAdmitPage /></ProtectedRoute>
          } />
          <Route path="/ipd/:admissionId" element={
            <ProtectedRoute><IPDAdmissionDetail /></ProtectedRoute>
          } />

          {/* EMR */}
          <Route path="/emr" element={
            <ProtectedRoute><EMRPage /></ProtectedRoute>
          } />
          <Route path="/emr/:patientId" element={
            <ProtectedRoute><EMRPage /></ProtectedRoute>
          } />

          {/* Lab */}
          <Route path="/lab" element={
            <ProtectedRoute><LabPage /></ProtectedRoute>
          } />
          <Route path="/lab/new" element={
            <ProtectedRoute><LabNewOrderPage /></ProtectedRoute>
          } />

          {/* OT */}
          <Route path="/ot" element={
            <ProtectedRoute><OTPage /></ProtectedRoute>
          } />
          <Route path="/ot/schedule" element={
            <ProtectedRoute><OTSchedulePage /></ProtectedRoute>
          } />
          <Route path="/ot/new" element={
            <ProtectedRoute><OTSchedulePage /></ProtectedRoute>
          } />

          {/* ✅ OT fix */}
          <Route path="/ot/schedule/new" element={
            <ProtectedRoute><OTSchedulePage /></ProtectedRoute>
          } />
          <Route path="/ot/surgeries/:id" element={
            <ProtectedRoute><OTPage /></ProtectedRoute>
          } />

          {/* ✅ Lab fix */}
          <Route path="/lab/order/new" element={
            <ProtectedRoute><LabNewOrderPage /></ProtectedRoute>
          } />

          {/* Nursing */}
          <Route path="/nursing" element={
            <ProtectedRoute><NursingPage /></ProtectedRoute>
          } />

          {/* Radiology */}
          <Route path="/radiology" element={
            <ProtectedRoute><RadiologyPage /></ProtectedRoute>
          } />

          {/* Diagnostic Report Templates */}
          <Route path="/report-templates" element={
            <ProtectedRoute><ReportTemplatesPage /></ProtectedRoute>
          } />

          {/* Analytics */}
          <Route path="/analytics" element={
            <ProtectedRoute><AnalyticsPage /></ProtectedRoute>
          } />

          {/* Staff Directory */}
          <Route path="/staff-directory" element={
            <ProtectedRoute><StaffDirectoryPage /></ProtectedRoute>
          } />

          {/* Billing */}
          <Route path="/billing" element={
            <ProtectedRoute><BillingPage /></ProtectedRoute>
          } />

          {/* Pharmacy */}
          <Route path="/pharmacy" element={
            <ProtectedRoute><PharmacyPage /></ProtectedRoute>
          } />

          {/* Insurance */}
          <Route path="/insurance" element={
            <ProtectedRoute><InsurancePage /></ProtectedRoute>
          } />

          {/* HR */}
          <Route path="/hr" element={
            <ProtectedRoute><HRPage /></ProtectedRoute>
          } />

          {/* ✅ Reports - Coming Soon */}
          <Route path="/reports" element={
            <ProtectedRoute>
              <div className="p-8">
                <h1 className="text-xl font-bold text-gray-900">Reports</h1>
                <p className="text-sm text-gray-500 mt-1">Coming Soon</p>
              </div>
            </ProtectedRoute>
          } />

          {/* ✅ Settings - Coming Soon */}
          <Route path="/settings" element={
            <ProtectedRoute>
              <div className="p-8">
                <h1 className="text-xl font-bold text-gray-900">Settings</h1>
                <p className="text-sm text-gray-500 mt-1">Coming Soon</p>
              </div>
            </ProtectedRoute>
          } />

          {/* Admin */}
          <Route path="/admin" element={<Navigate to="/admin/users" replace />} />
          <Route path="/admin/users" element={<ProtectedRoute><UsersListPage /></ProtectedRoute>} />
          <Route path="/admin/users/new" element={<ProtectedRoute><UserRegisterPage /></ProtectedRoute>} />
          <Route path="/admin/departments" element={<ProtectedRoute><DepartmentsPage /></ProtectedRoute>} />
          <Route path="/admin/roles" element={<ProtectedRoute><RolesPage /></ProtectedRoute>} />
          <Route path="/admin/facilities" element={<ProtectedRoute><FacilitiesPage /></ProtectedRoute>} />
          <Route path="/admin/settings" element={<ProtectedRoute><HospitalSettingsPage /></ProtectedRoute>} />
          <Route path="/doctors/availability" element={<ProtectedRoute><DoctorAvailabilityPage /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><MyProfilePage /></ProtectedRoute>} />
          <Route path="/profile/mfa" element={<ProtectedRoute><MFASettingsPage /></ProtectedRoute>} />
          <Route path="/queue" element={<ProtectedRoute><QueuePage /></ProtectedRoute>} />
          <Route path="/blood-bank" element={<ProtectedRoute><BloodBankPage /></ProtectedRoute>} />
          <Route path="/accounts" element={<ProtectedRoute><AccountsPage /></ProtectedRoute>} />
          <Route path="/inventory" element={<ProtectedRoute><InventoryPage /></ProtectedRoute>} />
          <Route path="/medical-coding" element={<ProtectedRoute><MedicalCodingPage /></ProtectedRoute>} />
          <Route path="/organization-settings" element={<ProtectedRoute><OrganizationSettingsPage /></ProtectedRoute>} />
          <Route path="/admin/notifications" element={<ProtectedRoute><NotificationSettingsPage /></ProtectedRoute>} />
          <Route path="/admin/bulk-import" element={<ProtectedRoute><BulkImportPage /></ProtectedRoute>} />
          <Route path="/referrals" element={<ProtectedRoute><ReferralPage /></ProtectedRoute>} />
          <Route path="/admin/staff/doctors" element={<ProtectedRoute><DoctorsPage /></ProtectedRoute>} />
          <Route path="/admin/staff/nurses" element={<ProtectedRoute><NursesPage /></ProtectedRoute>} />
          <Route path="/admin/staff/receptionists" element={<ProtectedRoute><ReceptionistsPage /></ProtectedRoute>} />
          <Route path="/admin/staff/lab" element={<ProtectedRoute><LabTechniciansPage /></ProtectedRoute>} /> {/* ✅ Fixed */}
          <Route path="/admin/staff/pharmacists" element={<ProtectedRoute><PharmacistsPage /></ProtectedRoute>} />
          <Route path="/admin/staff/accountants" element={<ProtectedRoute><AccountantsPage /></ProtectedRoute>} />
          <Route path="/admin/staff/others" element={<ProtectedRoute><OtherStaffPage /></ProtectedRoute>} />

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />

        </Routes>
      </BrowserRouter>

      <Toaster position="top-right" />
    </QueryClientProvider>
  )
}