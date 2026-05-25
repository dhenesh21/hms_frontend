import axios from 'axios'

const api = axios.create({
  baseURL: 'http://127.0.0.1:8000',
  headers: { 'Content-Type': 'application/json' }
})

// Request interceptor - attach token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Response interceptor - handle 401
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true
      try {
        const refresh = localStorage.getItem('refresh_token')
        const res = await axios.post('/api/auth/refresh', null, {
          params: { refresh_token: refresh }
        })
        localStorage.setItem('access_token', res.data.access_token)
        original.headers.Authorization = `Bearer ${res.data.access_token}`
        return api(original)
      } catch {
        localStorage.clear()
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)
export const authService = {

  // LOGIN
  login: async (
    email: string,
    password: string
  ) => {
    try {

      const response = await axios.post(
        'http://127.0.0.1:8000/api/auth/login',
        { email, password },
        {
          headers: {
           'Content-Type': 'application/json',
          },
        }
      )

      // Save tokens
      if (response.data.access_token) {
        localStorage.setItem(
          'access_token',
          response.data.access_token
        )
      }

      if (response.data.refresh_token) {
        localStorage.setItem(
          'refresh_token',
          response.data.refresh_token
        )
      }

      return response.data

    } catch (error: any) {

      console.log(error.response?.data)

      throw new Error(
        error.response?.data?.detail?.[0]?.msg ||
        error.response?.data?.detail ||
        'Login failed'
      )
    }
  },

  // CURRENT USER
  me: async () => {
    const response = await api.get('/api/auth/me')
    return response.data
  },

  // CHANGE PASSWORD
  changePassword: async (data: any) => {
    const response = await api.put(
      '/api/auth/change-password',
      data
    )

    return response.data
  },

  // LIST USERS
  listUsers: async () => {
    const response = await api.get('/api/auth/users')
    return response.data
  },

  // CREATE USER
  createUser: async (data: any) => {
    const response = await api.post(
      '/api/auth/register',
      data
    )

    return response.data
  },

  // LOGOUT
  logout: () => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')

    window.location.href = '/login'
  },
}



// Auth
// export const authService = {
//   login: (email: string, password: string) =>
//     api.post('/auth/login', { email, password }),
//   me: () => api.get('/auth/me'),
//   changePassword: (data: any) => api.put('/auth/change-password', data),
//   listUsers: () => api.get('/auth/users'),
//   createUser: (data: any) => api.post('/auth/register', data),
// }

// Patients
export const patientService = {
  list: (params?: any) => api.get('/api/patients', { params }),
  get: (id: number) => api.get(`/api/patients/${id}`),
  getByUhid: (uhid: string) => api.get(`/api/patients/uhid/${uhid}`),
  create: (data: any) => api.post('/api/patients', data),
  update: (id: number, data: any) => api.put(`/api/patients/${id}`, data),
  delete: (id: number) => api.delete(`/api/patients/${id}`),
  history: (id: number) => api.get(`/api/patients/${id}/history`),
}

// Doctors
export const doctorService = {
  list: (params?: any) => api.get('/doctors', { params }),
  get: (id: number) => api.get(`/doctors/${id}`),
  createProfile: (data: any) => api.post('/doctors/profile', data),
  addRoster: (doctorId: number, data: any) =>
    api.post(`/doctors/${doctorId}/roster`, data),
  getSlots: (doctorId: number, date: string) =>
    api.get(`/doctors/${doctorId}/available-slots`, { params: { appointment_date: date } }),
}

// Appointments
export const appointmentService = {
  list: (params?: any) => api.get('/appointments', { params }),
  create: (data: any) => api.post('/appointments', data),
  update: (id: number, data: any) => api.put(`/appointments/${id}`, data),
}

// OPD
export const opdService = {
  listVisits: (params?: any) => api.get('/opd/visits', { params }),
  getVisit: (id: number) => api.get(`/opd/visits/${id}`),
  createVisit: (data: any) => api.post('/opd/visits', data),
  updateVisit: (id: number, data: any) => api.put(`/opd/visits/${id}`, data),
  getFollowUps: (params?: any) => api.get('/opd/follow-ups', { params }),
  getDashboard: () => api.get('/opd/dashboard/stats'),
}

export const billingService = {
  listServices: (p?: any) => api.get('/billing/services', { params: p }),
  createService: (d: any) => api.post('/billing/services', d),
  listPackages: () => api.get('/billing/packages'),
  createPackage: (d: any) => api.post('/billing/packages', d),
  createBill: (d: any) => api.post('/billing/bills', d),
  listBills: (p?: any) => api.get('/billing/bills', { params: p }),
  getBill: (id: number) => api.get(`/billing/bills/${id}`),
  updateBill: (id: number, d: any) => api.put(`/billing/bills/${id}`, d),
  recordPayment: (d: any) => api.post('/billing/payments', d),
  getPayments: (billId: number) => api.get(`/billing/payments/${billId}`),
  collectAdvance: (d: any) => api.post('/billing/advance', d),
  getAdvances: (patientId: number) => api.get(`/billing/advance/${patientId}`),
  approveDiscount: (d: any) => api.post('/billing/bills/discount-approval', d),
  dailyReport: (date?: string) => api.get('/billing/reports/daily', { params: { report_date: date } }),
  outstandingReport: () => api.get('/billing/reports/outstanding'),
  getDashboard: () => api.get('/billing/dashboard/stats'),
}

// IPD
export const ipdService = {
  listWards: () => api.get('/ipd/wards'),
  createWard: (d: any) => api.post('/ipd/wards', d),
  getWardBeds: (wardId: number, status?: string) =>
    api.get(`/ipd/wards/${wardId}/beds`, { params: { status } }),
  getAvailableBeds: (wardId?: number) =>
    api.get('/ipd/beds/available', { params: { ward_id: wardId } }),
  createBed: (d: any) => api.post('/ipd/beds', d),
  admit: (d: any) => api.post('/ipd/admissions', d),
  listAdmissions: (p?: any) => api.get('/ipd/admissions', { params: p }),
  getActiveAdmissions: () => api.get('/ipd/admissions/active'),
  getAdmission: (id: number) => api.get(`/ipd/admissions/${id}`),
  updateAdmission: (id: number, d: any) => api.put(`/ipd/admissions/${id}`, d),
  addNursingNote: (d: any) => api.post('/ipd/nursing-notes', d),
  getNursingNotes: (admissionId: number) => api.get(`/ipd/nursing-notes/${admissionId}`),
  addProgressNote: (d: any) => api.post('/ipd/progress-notes', d),
  getProgressNotes: (admissionId: number) => api.get(`/ipd/progress-notes/${admissionId}`),
  recordVitals: (d: any) => api.post('/ipd/vitals', d),
  getVitals: (admissionId: number) => api.get(`/ipd/vitals/${admissionId}`),
  getDashboard: () => api.get('/ipd/dashboard/stats'),
}

// EMR
export const emrService = {
  getFullEMR: (patientId: number) => api.get(`/emr/patient/${patientId}`),
  addAllergy: (d: any) => api.post('/emr/allergies', d),
  getAllergies: (patientId: number) => api.get(`/emr/allergies/${patientId}`),
  deleteAllergy: (id: number) => api.delete(`/emr/allergies/${id}`),
  addCondition: (d: any) => api.post('/emr/conditions', d),
  getConditions: (patientId: number) => api.get(`/emr/conditions/${patientId}`),
  addMedication: (d: any) => api.post('/emr/medications', d),
  getMedications: (patientId: number, currentOnly = false) =>
    api.get(`/emr/medications/${patientId}`, { params: { current_only: currentOnly } }),
  addFamilyHistory: (d: any) => api.post('/emr/family-history', d),
  getFamilyHistory: (patientId: number) => api.get(`/emr/family-history/${patientId}`),
  addSurgicalHistory: (d: any) => api.post('/emr/surgical-history', d),
  getSurgicalHistory: (patientId: number) => api.get(`/emr/surgical-history/${patientId}`),
  addImmunization: (d: any) => api.post('/emr/immunizations', d),
  getImmunizations: (patientId: number) => api.get(`/emr/immunizations/${patientId}`),
  addDocument: (d: any) => api.post('/emr/documents', d),
  getDocuments: (patientId: number, docType?: string) =>
    api.get(`/emr/documents/${patientId}`, { params: { doc_type: docType } }),
  addDiagnosis: (d: any) => api.post('/emr/diagnosis', d),
  getDiagnoses: (patientId: number) => api.get(`/emr/diagnosis/${patientId}`),
}

// Lab
export const labService = {
  listTests: (p?: any) => api.get('/lab/tests', { params: p }),
  createTest: (d: any) => api.post('/lab/tests', d),
  createOrder: (d: any) => api.post('/lab/orders', d),
  listOrders: (p?: any) => api.get('/lab/orders', { params: p }),
  getOrder: (id: number) => api.get(`/lab/orders/${id}`),
  collectSamples: (d: any) => api.post('/lab/sample-collection', d),
  receiveSample: (itemId: number) => api.put(`/lab/sample-received/${itemId}`),
  enterResult: (d: any) => api.post('/lab/results', d),
  approveResult: (itemId: number) => api.put(`/lab/approve/${itemId}`),
  rejectSample: (itemId: number, reason: string) =>
    api.put(`/lab/reject/${itemId}`, null, { params: { reason } }),
  getPending: () => api.get('/lab/pending'),
  getDashboard: () => api.get('/lab/dashboard/stats'),
}

// OT
export const otService = {
  listTheatres: () => api.get('/ot/theatres'),
  createTheatre: (d: any) => api.post('/ot/theatres', d),
  updateTheatreStatus: (id: number, status: string) =>
    api.put(`/ot/theatres/${id}/status`, null, { params: { status } }),
  scheduleSurgery: (d: any) => api.post('/ot/surgeries', d),
  listSurgeries: (p?: any) => api.get('/ot/surgeries', { params: p }),
  todaySurgeries: () => api.get('/ot/surgeries/today'),
  getSurgery: (id: number) => api.get(`/ot/surgeries/${id}`),
  updateSurgery: (id: number, d: any) => api.put(`/ot/surgeries/${id}`, d),
  completePreOp: (id: number, checklist: any) =>
    api.put(`/ot/surgeries/${id}/pre-op-complete`, checklist),
  addConsumable: (d: any) => api.post('/ot/consumables', d),
  getConsumables: (surgeryId: number) => api.get(`/ot/consumables/${surgeryId}`),
  getDashboard: () => api.get('/ot/dashboard/stats'),
}

// Radiology
export const radiologyService = {
  createOrder: (d: any) => api.post('/radiology/orders', d),
  listOrders: (p?: any) => api.get('/radiology/orders', { params: p }),
  getOrder: (id: number) => api.get(`/radiology/orders/${id}`),
  updateStatus: (id: number, status: string) =>
    api.put(`/radiology/orders/${id}/status`, null, { params: { status } }),
  submitReport: (id: number, d: any) => api.put(`/radiology/orders/${id}/report`, d),
  addImage: (orderId: number, fileName: string, filePath: string, viewType?: string) =>
    api.post(`/radiology/orders/${orderId}/images`, null,
      { params: { file_name: fileName, file_path: filePath, view_type: viewType } }),
  getPending: () => api.get('/radiology/pending'),
  getDashboard: () => api.get('/radiology/dashboard/stats'),
}

// Pharmacy
export const pharmacyService = {
  listDrugs: (p?: any) => api.get('/pharmacy/drugs', { params: p }),
  createDrug: (d: any) => api.post('/pharmacy/drugs', d),
  getDrugStock: (drugId: number) => api.get(`/pharmacy/drugs/${drugId}/stock`),
  addStock: (d: any) => api.post('/pharmacy/stock', d),
  listSuppliers: () => api.get('/pharmacy/suppliers'),
  createSupplier: (d: any) => api.post('/pharmacy/suppliers', d),
  createPO: (d: any) => api.post('/pharmacy/purchase-orders', d),
  listPOs: () => api.get('/pharmacy/purchase-orders'),
  receivePO: (id: number) => api.put(`/pharmacy/purchase-orders/${id}/receive`),
  dispense: (d: any) => api.post('/pharmacy/dispense', d),
  listDispenses: (p?: any) => api.get('/pharmacy/dispense', { params: p }),
  getAlerts: () => api.get('/pharmacy/alerts'),
  getDashboard: () => api.get('/pharmacy/dashboard/stats'),
}

// Insurance
export const insuranceService = {
  listCompanies: () => api.get('/insurance/companies'),
  createCompany: (d: any) => api.post('/insurance/companies', d),
  listPolicies: (p?: any) => api.get('/insurance/policies', { params: p }),
  createPolicy: (d: any) => api.post('/insurance/policies', d),
  getPolicy: (id: number) => api.get(`/insurance/policies/${id}`),
  createClaim: (d: any) => api.post('/insurance/claims', d),
  listClaims: (p?: any) => api.get('/insurance/claims', { params: p }),
  getClaim: (id: number) => api.get(`/insurance/claims/${id}`),
  updateClaim: (id: number, d: any) => api.put(`/insurance/claims/${id}`, d),
  requestPreauth: (claimId: number) => api.post(`/insurance/claims/${claimId}/request-preauth`),
  preauthResponse: (claimId: number, d: any) => api.post(`/insurance/claims/${claimId}/preauth-response`, d),
  submitClaim: (claimId: number, ref?: string) => api.post(`/insurance/claims/${claimId}/submit`, null, { params: { submission_reference: ref } }),
  addDocument: (claimId: number, d: any) => api.post(`/insurance/claims/${claimId}/documents`, d),
  getDashboard: () => api.get('/insurance/dashboard/stats'),
}

// HR Service
export const hrService = {
  // Departments
  listDepartments: () => api.get('/hr/departments'),
  createDepartment: (d: any) => api.post('/hr/departments', d),

  // Designations
  listDesignations: (deptId?: number) => api.get('/hr/designations', { params: { department_id: deptId } }),
  createDesignation: (d: any) => api.post('/hr/designations', d),

  // Staff
  listStaff: (p?: any) => api.get('/hr/staff', { params: p }),
  getStaff: (id: number) => api.get(`/hr/staff/${id}`),
  createStaff: (d: any) => api.post('/hr/staff', d),
  updateStaff: (id: number, d: any) => api.put(`/hr/staff/${id}`, d),

  // Attendance
  markAttendance: (d: any) => api.post('/hr/attendance', d),
  bulkAttendance: (d: any) => api.post('/hr/attendance/bulk', d),
  getAttendance: (p?: any) => api.get('/hr/attendance', { params: p }),
  getAttendanceSummary: (staffId: number, month: number, year: number) =>
    api.get(`/hr/attendance/summary/${staffId}`, { params: { month, year } }),

  // Leaves
  applyLeave: (d: any) => api.post('/hr/leaves', d),
  listLeaves: (p?: any) => api.get('/hr/leaves', { params: p }),
  approveLeave: (id: number, d: any) => api.put(`/hr/leaves/${id}/approve`, d),
  getLeaveBalance: (staffId: number, year?: number) =>
    api.get(`/hr/leaves/balance/${staffId}`, { params: { year } }),

  // Holidays
  listHolidays: (year?: number) => api.get('/hr/holidays', { params: { year } }),
  createHoliday: (d: any) => api.post('/hr/holidays', d),

  // Payroll
  generatePayroll: (d: any) => api.post('/hr/payroll/generate', d),
  listPayrolls: (p?: any) => api.get('/hr/payroll', { params: p }),
  updatePayroll: (id: number, d: any) => api.put(`/hr/payroll/${id}`, d),
  getPayslip: (id: number) => api.get(`/hr/payroll/${id}/payslip`),

  // Dashboard
  getDashboard: () => api.get('/hr/dashboard/stats'),
}

// Nursing Service
export const nursingService = {
  // MAR
  createMAR: (d: any) => api.post('/nursing/mar', d),
  getMARForAdmission: (admissionId: number, activeOnly?: boolean) =>
    api.get(`/nursing/mar/${admissionId}`, { params: { active_only: activeOnly } }),
  discontinueMAR: (marId: number) => api.delete(`/nursing/mar/${marId}`),
  getPendingDoses: (admissionId: number) => api.get(`/nursing/pending-doses/${admissionId}`),

  // Administration
  recordAdministration: (d: any) => api.post('/nursing/administer', d),
  getAdministrations: (marId: number, fromDate?: string) =>
    api.get(`/nursing/administer/${marId}`, { params: { from_date: fromDate } }),

  // Assessments
  createAssessment: (d: any) => api.post('/nursing/assessments', d),
  getAssessments: (admissionId: number, type?: string) =>
    api.get(`/nursing/assessments/${admissionId}`, { params: { assessment_type: type } }),

  // Care Plans
  createCarePlan: (d: any) => api.post('/nursing/care-plans', d),
  getCarePlans: (admissionId: number) => api.get(`/nursing/care-plans/${admissionId}`),
  updateCarePlan: (id: number, d: any) => api.put(`/nursing/care-plans/${id}`, d),
  addIntervention: (planId: number, d: any) => api.post(`/nursing/care-plans/${planId}/interventions`, d),

  // Handover
  createHandover: (d: any) => api.post('/nursing/handover', d),
  listHandovers: (p?: any) => api.get('/nursing/handover', { params: p }),
  receiveHandover: (id: number) => api.put(`/nursing/handover/${id}/receive`),

  // Dashboard
  getDashboard: (admissionId: number) => api.get(`/nursing/dashboard/stats/${admissionId}`),
}

export default api