// import axios from 'axios'

// const api = axios.create({
//   baseURL: 'http://127.0.0.1:8000/api',
//   headers: { 'Content-Type': 'application/json' }
// })

// // Request interceptor - attach token
// api.interceptors.request.use((config) => {
//   const token = localStorage.getItem('access_token')
//   if (token) config.headers.Authorization = `Bearer ${token}`
//   return config
// })

// // Response interceptor - handle 401
// api.interceptors.response.use(
//   (res) => res,
//   async (error) => {
//     const original = error.config
//     if (error.response?.status === 401 && !original._retry) {
//       original._retry = true
//       try {
//         const refresh = localStorage.getItem('refresh_token')
//         const res = await axios.post('/api/auth/refresh', null, {
//           params: { refresh_token: refresh }
//         })
//         localStorage.setItem('access_token', res.data.access_token)
//         original.headers.Authorization = `Bearer ${res.data.access_token}`
//         return api(original)
//       } catch {
//         localStorage.clear()
//         window.location.href = '/login'
//       }
//     }
//     return Promise.reject(error)
//   }
// )
// export const authService = {

//   // LOGIN
//   login: async (
//     email: string,
//     password: string
//   ) => {
//     try {

//       const response = await axios.post(
//         'http://127.0.0.1:8000/api/auth/login',
//         { email, password },
//         {
//           headers: {
//            'Content-Type': 'application/json',
//           },
//         }
//       )

//       // Save tokens
//       if (response.data.access_token) {
//         localStorage.setItem(
//           'access_token',
//           response.data.access_token
//         )
//       }

//       if (response.data.refresh_token) {
//         localStorage.setItem(
//           'refresh_token',
//           response.data.refresh_token
//         )
//       }

//       return response.data

//     } catch (error: any) {

//       console.log(error.response?.data)

//       throw new Error(
//         error.response?.data?.detail?.[0]?.msg ||
//         error.response?.data?.detail ||
//         'Login failed'
//       )
//     }
//   },

//   // CURRENT USER
//   me: async () => {
//     const response = await api.get('/api/auth/me')
//     return response.data
//   },

//   // CHANGE PASSWORD
//   changePassword: async (data: any) => {
//     const response = await api.put(
//       '/api/auth/change-password',
//       data
//     )

//     return response.data
//   },

//   // LIST USERS
//   listUsers: async () => {
//     const response = await api.get('/api/auth/users')
//     return response.data
//   },

//   // CREATE USER
//   createUser: async (data: any) => {
//     const response = await api.post(
//       '/api/auth/register',
//       data
//     )

//     return response.data
//   },

//   // LOGOUT
//   logout: () => {
//     localStorage.removeItem('access_token')
//     localStorage.removeItem('refresh_token')

//     window.location.href = '/login'
//   },
// }



// // Auth
// // export const authService = {
// //   login: (email: string, password: string) =>
// //     api.post('/auth/login', { email, password }),
// //   me: () => api.get('/auth/me'),
// //   changePassword: (data: any) => api.put('/auth/change-password', data),
// //   listUsers: () => api.get('/auth/users'),
// //   createUser: (data: any) => api.post('/auth/register', data),
// // }

// // Patients
// export const patientService = {
//   list: (params?: any) => api.get('/api/patients', { params }),
//   get: (id: number) => api.get(`/api/patients/${id}`),
//   getByUhid: (uhid: string) => api.get(`/api/patients/uhid/${uhid}`),
//   create: (data: any) => api.post('/api/patients', data),
//   update: (id: number, data: any) => api.put(`/api/patients/${id}`, data),
//   delete: (id: number) => api.delete(`/api/patients/${id}`),
//   history: (id: number) => api.get(`/api/patients/${id}/history`),
// }

// // Doctors
// export const doctorService = {
//   list: (params?: any) => api.get('/doctors', { params }),
//   get: (id: number) => api.get(`/doctors/${id}`),
//   createProfile: (data: any) => api.post('/doctors/profile', data),
//   addRoster: (doctorId: number, data: any) =>
//     api.post(`/doctors/${doctorId}/roster`, data),
//   getSlots: (doctorId: number, date: string) =>
//     api.get(`/doctors/${doctorId}/available-slots`, { params: { appointment_date: date } }),
// }

// // Appointments
// export const appointmentService = {
//   list: (params?: any) => api.get('/appointments', { params }),
//   create: (data: any) => api.post('/appointments', data),
//   update: (id: number, data: any) => api.put(`/appointments/${id}`, data),
// }

// // OPD
// export const opdService = {
//   listVisits: (params?: any) => api.get('/opd/visits', { params }),
//   getVisit: (id: number) => api.get(`/opd/visits/${id}`),
//   createVisit: (data: any) => api.post('/opd/visits', data),
//   updateVisit: (id: number, data: any) => api.put(`/opd/visits/${id}`, data),
//   getFollowUps: (params?: any) => api.get('/opd/follow-ups', { params }),
//   getDashboard: () => api.get('/opd/dashboard/stats'),
// }

// export const billingService = {
//   listServices: (p?: any) => api.get('/billing/services', { params: p }),
//   createService: (d: any) => api.post('/billing/services', d),
//   listPackages: () => api.get('/billing/packages'),
//   createPackage: (d: any) => api.post('/billing/packages', d),
//   createBill: (d: any) => api.post('/billing/bills', d),
//   listBills: (p?: any) => api.get('/billing/bills', { params: p }),
//   getBill: (id: number) => api.get(`/billing/bills/${id}`),
//   updateBill: (id: number, d: any) => api.put(`/billing/bills/${id}`, d),
//   recordPayment: (d: any) => api.post('/billing/payments', d),
//   getPayments: (billId: number) => api.get(`/billing/payments/${billId}`),
//   collectAdvance: (d: any) => api.post('/billing/advance', d),
//   getAdvances: (patientId: number) => api.get(`/billing/advance/${patientId}`),
//   approveDiscount: (d: any) => api.post('/billing/bills/discount-approval', d),
//   dailyReport: (date?: string) => api.get('/billing/reports/daily', { params: { report_date: date } }),
//   outstandingReport: () => api.get('/billing/reports/outstanding'),
//   getDashboard: () => api.get('/billing/dashboard/stats'),
// }

// // IPD
// export const ipdService = {
//   listWards: () => api.get('/ipd/wards'),
//   createWard: (d: any) => api.post('/ipd/wards', d),
//   getWardBeds: (wardId: number, status?: string) =>
//     api.get(`/ipd/wards/${wardId}/beds`, { params: { status } }),
//   getAvailableBeds: (wardId?: number) =>
//     api.get('/ipd/beds/available', { params: { ward_id: wardId } }),
//   createBed: (d: any) => api.post('/ipd/beds', d),
//   admit: (d: any) => api.post('/ipd/admissions', d),
//   listAdmissions: (p?: any) => api.get('/ipd/admissions', { params: p }),
//   getActiveAdmissions: () => api.get('/ipd/admissions/active'),
//   getAdmission: (id: number) => api.get(`/ipd/admissions/${id}`),
//   updateAdmission: (id: number, d: any) => api.put(`/ipd/admissions/${id}`, d),
//   addNursingNote: (d: any) => api.post('/ipd/nursing-notes', d),
//   getNursingNotes: (admissionId: number) => api.get(`/ipd/nursing-notes/${admissionId}`),
//   addProgressNote: (d: any) => api.post('/ipd/progress-notes', d),
//   getProgressNotes: (admissionId: number) => api.get(`/ipd/progress-notes/${admissionId}`),
//   recordVitals: (d: any) => api.post('/ipd/vitals', d),
//   getVitals: (admissionId: number) => api.get(`/ipd/vitals/${admissionId}`),
//   getDashboard: () => api.get('/ipd/dashboard/stats'),
// }

// // EMR
// export const emrService = {
//   getFullEMR: (patientId: number) => api.get(`/emr/patient/${patientId}`),
//   addAllergy: (d: any) => api.post('/emr/allergies', d),
//   getAllergies: (patientId: number) => api.get(`/emr/allergies/${patientId}`),
//   deleteAllergy: (id: number) => api.delete(`/emr/allergies/${id}`),
//   addCondition: (d: any) => api.post('/emr/conditions', d),
//   getConditions: (patientId: number) => api.get(`/emr/conditions/${patientId}`),
//   addMedication: (d: any) => api.post('/emr/medications', d),
//   getMedications: (patientId: number, currentOnly = false) =>
//     api.get(`/emr/medications/${patientId}`, { params: { current_only: currentOnly } }),
//   addFamilyHistory: (d: any) => api.post('/emr/family-history', d),
//   getFamilyHistory: (patientId: number) => api.get(`/emr/family-history/${patientId}`),
//   addSurgicalHistory: (d: any) => api.post('/emr/surgical-history', d),
//   getSurgicalHistory: (patientId: number) => api.get(`/emr/surgical-history/${patientId}`),
//   addImmunization: (d: any) => api.post('/emr/immunizations', d),
//   getImmunizations: (patientId: number) => api.get(`/emr/immunizations/${patientId}`),
//   addDocument: (d: any) => api.post('/emr/documents', d),
//   getDocuments: (patientId: number, docType?: string) =>
//     api.get(`/emr/documents/${patientId}`, { params: { doc_type: docType } }),
//   addDiagnosis: (d: any) => api.post('/emr/diagnosis', d),
//   getDiagnoses: (patientId: number) => api.get(`/emr/diagnosis/${patientId}`),
// }

// // Lab
// export const labService = {
//   listTests: (p?: any) => api.get('/lab/tests', { params: p }),
//   createTest: (d: any) => api.post('/lab/tests', d),
//   createOrder: (d: any) => api.post('/lab/orders', d),
//   listOrders: (p?: any) => api.get('/lab/orders', { params: p }),
//   getOrder: (id: number) => api.get(`/lab/orders/${id}`),
//   collectSamples: (d: any) => api.post('/lab/sample-collection', d),
//   receiveSample: (itemId: number) => api.put(`/lab/sample-received/${itemId}`),
//   enterResult: (d: any) => api.post('/lab/results', d),
//   approveResult: (itemId: number) => api.put(`/lab/approve/${itemId}`),
//   rejectSample: (itemId: number, reason: string) =>
//     api.put(`/lab/reject/${itemId}`, null, { params: { reason } }),
//   getPending: () => api.get('/lab/pending'),
//   getDashboard: () => api.get('/lab/dashboard/stats'),
// }

// // OT
// export const otService = {
//   listTheatres: () => api.get('/ot/theatres'),
//   createTheatre: (d: any) => api.post('/ot/theatres', d),
//   updateTheatreStatus: (id: number, status: string) =>
//     api.put(`/ot/theatres/${id}/status`, null, { params: { status } }),
//   scheduleSurgery: (d: any) => api.post('/ot/surgeries', d),
//   listSurgeries: (p?: any) => api.get('/ot/surgeries', { params: p }),
//   todaySurgeries: () => api.get('/ot/surgeries/today'),
//   getSurgery: (id: number) => api.get(`/ot/surgeries/${id}`),
//   updateSurgery: (id: number, d: any) => api.put(`/ot/surgeries/${id}`, d),
//   completePreOp: (id: number, checklist: any) =>
//     api.put(`/ot/surgeries/${id}/pre-op-complete`, checklist),
//   addConsumable: (d: any) => api.post('/ot/consumables', d),
//   getConsumables: (surgeryId: number) => api.get(`/ot/consumables/${surgeryId}`),
//   getDashboard: () => api.get('/ot/dashboard/stats'),
// }

// // Radiology
// export const radiologyService = {
//   createOrder: (d: any) => api.post('/radiology/orders', d),
//   listOrders: (p?: any) => api.get('/radiology/orders', { params: p }),
//   getOrder: (id: number) => api.get(`/radiology/orders/${id}`),
//   updateStatus: (id: number, status: string) =>
//     api.put(`/radiology/orders/${id}/status`, null, { params: { status } }),
//   submitReport: (id: number, d: any) => api.put(`/radiology/orders/${id}/report`, d),
//   addImage: (orderId: number, fileName: string, filePath: string, viewType?: string) =>
//     api.post(`/radiology/orders/${orderId}/images`, null,
//       { params: { file_name: fileName, file_path: filePath, view_type: viewType } }),
//   getPending: () => api.get('/radiology/pending'),
//   getDashboard: () => api.get('/radiology/dashboard/stats'),
// }

// // Pharmacy
// export const pharmacyService = {
//   listDrugs: (p?: any) => api.get('/pharmacy/drugs', { params: p }),
//   createDrug: (d: any) => api.post('/pharmacy/drugs', d),
//   getDrugStock: (drugId: number) => api.get(`/pharmacy/drugs/${drugId}/stock`),
//   addStock: (d: any) => api.post('/pharmacy/stock', d),
//   listSuppliers: () => api.get('/pharmacy/suppliers'),
//   createSupplier: (d: any) => api.post('/pharmacy/suppliers', d),
//   createPO: (d: any) => api.post('/pharmacy/purchase-orders', d),
//   listPOs: () => api.get('/pharmacy/purchase-orders'),
//   receivePO: (id: number) => api.put(`/pharmacy/purchase-orders/${id}/receive`),
//   dispense: (d: any) => api.post('/pharmacy/dispense', d),
//   listDispenses: (p?: any) => api.get('/pharmacy/dispense', { params: p }),
//   getAlerts: () => api.get('/pharmacy/alerts'),
//   getDashboard: () => api.get('/pharmacy/dashboard/stats'),
// }

// // Insurance
// export const insuranceService = {
//   listCompanies: () => api.get('/insurance/companies'),
//   createCompany: (d: any) => api.post('/insurance/companies', d),
//   listPolicies: (p?: any) => api.get('/insurance/policies', { params: p }),
//   createPolicy: (d: any) => api.post('/insurance/policies', d),
//   getPolicy: (id: number) => api.get(`/insurance/policies/${id}`),
//   createClaim: (d: any) => api.post('/insurance/claims', d),
//   listClaims: (p?: any) => api.get('/insurance/claims', { params: p }),
//   getClaim: (id: number) => api.get(`/insurance/claims/${id}`),
//   updateClaim: (id: number, d: any) => api.put(`/insurance/claims/${id}`, d),
//   requestPreauth: (claimId: number) => api.post(`/insurance/claims/${claimId}/request-preauth`),
//   preauthResponse: (claimId: number, d: any) => api.post(`/insurance/claims/${claimId}/preauth-response`, d),
//   submitClaim: (claimId: number, ref?: string) => api.post(`/insurance/claims/${claimId}/submit`, null, { params: { submission_reference: ref } }),
//   addDocument: (claimId: number, d: any) => api.post(`/insurance/claims/${claimId}/documents`, d),
//   getDashboard: () => api.get('/insurance/dashboard/stats'),
// }

// // HR Service
// export const hrService = {
//   // Departments
//   listDepartments: () => api.get('/hr/departments'),
//   createDepartment: (d: any) => api.post('/hr/departments', d),

//   // Designations
//   listDesignations: (deptId?: number) => api.get('/hr/designations', { params: { department_id: deptId } }),
//   createDesignation: (d: any) => api.post('/hr/designations', d),

//   // Staff
//   listStaff: (p?: any) => api.get('/hr/staff', { params: p }),
//   getStaff: (id: number) => api.get(`/hr/staff/${id}`),
//   createStaff: (d: any) => api.post('/hr/staff', d),
//   updateStaff: (id: number, d: any) => api.put(`/hr/staff/${id}`, d),

//   // Attendance
//   markAttendance: (d: any) => api.post('/hr/attendance', d),
//   bulkAttendance: (d: any) => api.post('/hr/attendance/bulk', d),
//   getAttendance: (p?: any) => api.get('/hr/attendance', { params: p }),
//   getAttendanceSummary: (staffId: number, month: number, year: number) =>
//     api.get(`/hr/attendance/summary/${staffId}`, { params: { month, year } }),

//   // Leaves
//   applyLeave: (d: any) => api.post('/hr/leaves', d),
//   listLeaves: (p?: any) => api.get('/hr/leaves', { params: p }),
//   approveLeave: (id: number, d: any) => api.put(`/hr/leaves/${id}/approve`, d),
//   getLeaveBalance: (staffId: number, year?: number) =>
//     api.get(`/hr/leaves/balance/${staffId}`, { params: { year } }),

//   // Holidays
//   listHolidays: (year?: number) => api.get('/hr/holidays', { params: { year } }),
//   createHoliday: (d: any) => api.post('/hr/holidays', d),

//   // Payroll
//   generatePayroll: (d: any) => api.post('/hr/payroll/generate', d),
//   listPayrolls: (p?: any) => api.get('/hr/payroll', { params: p }),
//   updatePayroll: (id: number, d: any) => api.put(`/hr/payroll/${id}`, d),
//   getPayslip: (id: number) => api.get(`/hr/payroll/${id}/payslip`),

//   // Dashboard
//   getDashboard: () => api.get('/hr/dashboard/stats'),
// }

// // Nursing Service
// export const nursingService = {
//   // MAR
//   createMAR: (d: any) => api.post('/nursing/mar', d),
//   getMARForAdmission: (admissionId: number, activeOnly?: boolean) =>
//     api.get(`/nursing/mar/${admissionId}`, { params: { active_only: activeOnly } }),
//   discontinueMAR: (marId: number) => api.delete(`/nursing/mar/${marId}`),
//   getPendingDoses: (admissionId: number) => api.get(`/nursing/pending-doses/${admissionId}`),

//   // Administration
//   recordAdministration: (d: any) => api.post('/nursing/administer', d),
//   getAdministrations: (marId: number, fromDate?: string) =>
//     api.get(`/nursing/administer/${marId}`, { params: { from_date: fromDate } }),

//   // Assessments
//   createAssessment: (d: any) => api.post('/nursing/assessments', d),
//   getAssessments: (admissionId: number, type?: string) =>
//     api.get(`/nursing/assessments/${admissionId}`, { params: { assessment_type: type } }),

//   // Care Plans
//   createCarePlan: (d: any) => api.post('/nursing/care-plans', d),
//   getCarePlans: (admissionId: number) => api.get(`/nursing/care-plans/${admissionId}`),
//   updateCarePlan: (id: number, d: any) => api.put(`/nursing/care-plans/${id}`, d),
//   addIntervention: (planId: number, d: any) => api.post(`/nursing/care-plans/${planId}/interventions`, d),

//   // Handover
//   createHandover: (d: any) => api.post('/nursing/handover', d),
//   listHandovers: (p?: any) => api.get('/nursing/handover', { params: p }),
//   receiveHandover: (id: number) => api.put(`/nursing/handover/${id}/receive`),

//   // Dashboard
//   getDashboard: (admissionId: number) => api.get(`/nursing/dashboard/stats/${admissionId}`),
// }

// export default api
import axios from 'axios'

const api = axios.create({
  baseURL: 'http://127.0.0.1:8000/api',
  headers: {
    'Content-Type': 'application/json',
  },
})

// ====================================
// REQUEST INTERCEPTOR
// ====================================
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
})

// ====================================
// RESPONSE INTERCEPTOR
// ====================================
api.interceptors.response.use(
  (response) => response,

  async (error) => {
    const originalRequest = error.config

    if (
      error.response?.status === 401 &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true

      try {
        const refreshToken =
          localStorage.getItem('refresh_token')

        const response = await api.post(
          '/auth/refresh',
          null,
          {
            params: {
              refresh_token: refreshToken,
            },
          }
        )

        const accessToken =
          response.data.access_token

        localStorage.setItem(
          'access_token',
          accessToken
        )

        originalRequest.headers.Authorization =
          `Bearer ${accessToken}`

        return api(originalRequest)

      } catch (refreshError) {

        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')

        window.location.href = '/login'

        return Promise.reject(refreshError)
      }
    }

    return Promise.reject(error)
  }
)

// ====================================
// AUTH SERVICE
// ====================================
export const authService = {

  login: async (
    email: string,
    password: string
  ) => {
    try {

      const response = await api.post(
        '/auth/login',
        {
          email,
          password,
        }
      )

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

  me: async () => {
    const response = await api.get('/auth/me')
    return response.data
  },

  changePassword: async (data: any) => {
    const response = await api.put(
      '/auth/change-password',
      data
    )

    return response.data
  },

  listUsers: async () => {
    const response = await api.get('/auth/users')
    return response.data
  },

  createUser: async (data: any) => {
    const response = await api.post(
      '/auth/register',
      data
    )

    return response.data
  },

  logout: () => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')

    window.location.href = '/login'
  },
}

// ====================================
// PATIENT SERVICE
// ====================================
export const patientService = {

  list: (params?: any) =>
    api.get('/patients', { params }),

  get: (id: number) =>
    api.get(`/patients/${id}`),

  getByUhid: (uhid: string) =>
    api.get(`/patients/uhid/${uhid}`),

  create: (data: any) =>
    api.post('/patients', data),

  update: (
    id: number,
    data: any
  ) =>
    api.put(`/patients/${id}`, data),

  delete: (id: number) =>
    api.delete(`/patients/${id}`),

  history: (id: number) =>
    api.get(`/patients/${id}/history`),
}

// ====================================
// DOCTOR SERVICE
// ====================================
export const doctorService = {

  list: (params?: any) =>
    api.get('/doctors', { params }),

  get: (id: number) =>
    api.get(`/doctors/${id}`),

  createProfile: (data: any) =>
    api.post('/doctors/profile', data),

  addRoster: (
    doctorId: number,
    data: any
  ) =>
    api.post(
      `/doctors/${doctorId}/roster`,
      data
    ),

  getSlots: (
    doctorId: number,
    date: string
  ) =>
    api.get(
      `/doctors/${doctorId}/available-slots`,
      {
        params: {
          appointment_date: date,
        },
      }
    ),
}

// ====================================
// APPOINTMENT SERVICE
// ====================================
export const appointmentService = {

  list: (params?: any) =>
    api.get('/appointments', {
      params,
    }),

  create: (data: any) =>
    api.post('/appointments', data),

  update: (
    id: number,
    data: any
  ) =>
    api.put(`/appointments/${id}`, data),
}

// ====================================
// OPD SERVICE
// ====================================
export const opdService = {

  listVisits: (params?: any) =>
    api.get('/opd/visits', {
      params,
    }),

  getVisit: (id: number) =>
    api.get(`/opd/visits/${id}`),

  createVisit: (data: any) =>
    api.post('/opd/visits', data),

  updateVisit: (
    id: number,
    data: any
  ) =>
    api.put(
      `/opd/visits/${id}`,
      data
    ),

  getFollowUps: (params?: any) =>
    api.get('/opd/follow-ups', {
      params,
    }),

  getDashboard: () =>
    api.get('/opd/dashboard/stats'),
}

// ====================================
// IPD SERVICE
// ====================================
export const ipdService = {

  listWards: () =>
    api.get('/ipd/wards'),

  createWard: (data: any) =>
    api.post('/ipd/wards', data),

  getWardBeds: (
    wardId: number,
    status?: string
  ) =>
    api.get(
      `/ipd/wards/${wardId}/beds`,
      {
        params: {
          status,
        },
      }
    ),

  getAvailableBeds: (
    wardId?: number
  ) =>
    api.get(
      '/ipd/beds/available',
      {
        params: {
          ward_id: wardId,
        },
      }
    ),

  createBed: (data: any) =>
    api.post('/ipd/beds', data),

  admit: (data: any) =>
    api.post('/ipd/admissions', data),

  listAdmissions: (
    params?: any
  ) =>
    api.get('/ipd/admissions', {
      params,
    }),

  getActiveAdmissions: () =>
    api.get('/ipd/admissions/active'),

  getAdmission: (id: number) =>
    api.get(`/ipd/admissions/${id}`),

  updateAdmission: (
    id: number,
    data: any
  ) =>
    api.put(
      `/ipd/admissions/${id}`,
      data
    ),

  addNursingNote: (data: any) =>
    api.post(
      '/ipd/nursing-notes',
      data
    ),

  getNursingNotes: (
    admissionId: number
  ) =>
    api.get(
      `/ipd/nursing-notes/${admissionId}`
    ),

  addProgressNote: (data: any) =>
    api.post(
      '/ipd/progress-notes',
      data
    ),

  getProgressNotes: (
    admissionId: number
  ) =>
    api.get(
      `/ipd/progress-notes/${admissionId}`
    ),

  recordVitals: (data: any) =>
    api.post('/ipd/vitals', data),

  getVitals: (
    admissionId: number
  ) =>
    api.get(
      `/ipd/vitals/${admissionId}`
    ),

  getDashboard: () =>
    api.get('/ipd/dashboard/stats'),
}

// ====================================
// EMR SERVICE
// ====================================
export const emrService = {

  getFullEMR: (
    patientId: number
  ) =>
    api.get(
      `/emr/patient/${patientId}`
    ),

  addAllergy: (data: any) =>
    api.post('/emr/allergies', data),

  getAllergies: (
    patientId: number
  ) =>
    api.get(
      `/emr/allergies/${patientId}`
    ),

  deleteAllergy: (id: number) =>
    api.delete(`/emr/allergies/${id}`),

  addCondition: (data: any) =>
    api.post('/emr/conditions', data),

  getConditions: (
    patientId: number
  ) =>
    api.get(
      `/emr/conditions/${patientId}`
    ),

  addMedication: (data: any) =>
    api.post('/emr/medications', data),

  getMedications: (
    patientId: number,
    currentOnly = false
  ) =>
    api.get(
      `/emr/medications/${patientId}`,
      {
        params: {
          current_only: currentOnly,
        },
      }
    ),

  addFamilyHistory: (data: any) =>
    api.post(
      '/emr/family-history',
      data
    ),

  getFamilyHistory: (
    patientId: number
  ) =>
    api.get(
      `/emr/family-history/${patientId}`
    ),

  addSurgicalHistory: (
    data: any
  ) =>
    api.post(
      '/emr/surgical-history',
      data
    ),

  getSurgicalHistory: (
    patientId: number
  ) =>
    api.get(
      `/emr/surgical-history/${patientId}`
    ),

  addImmunization: (data: any) =>
    api.post(
      '/emr/immunizations',
      data
    ),

  getImmunizations: (
    patientId: number
  ) =>
    api.get(
      `/emr/immunizations/${patientId}`
    ),

  addDocument: (data: any) =>
    api.post('/emr/documents', data),

  getDocuments: (
    patientId: number,
    docType?: string
  ) =>
    api.get(
      `/emr/documents/${patientId}`,
      {
        params: {
          doc_type: docType,
        },
      }
    ),

  addDiagnosis: (data: any) =>
    api.post('/emr/diagnosis', data),

  getDiagnoses: (
    patientId: number
  ) =>
    api.get(
      `/emr/diagnosis/${patientId}`
    ),
}

// ====================================
// LAB SERVICE
// ====================================
export const labService = {

  listTests: (params?: any) =>
    api.get('/lab/tests', {
      params,
    }),

  createTest: (data: any) =>
    api.post('/lab/tests', data),

  createOrder: (data: any) =>
    api.post('/lab/orders', data),

  listOrders: (params?: any) =>
    api.get('/lab/orders', {
      params,
    }),

  getOrder: (id: number) =>
    api.get(`/lab/orders/${id}`),

  collectSamples: (data: any) =>
    api.post(
      '/lab/sample-collection',
      data
    ),

  receiveSample: (itemId: number) =>
    api.put(
      `/lab/sample-received/${itemId}`
    ),

  enterResult: (data: any) =>
    api.post('/lab/results', data),

  approveResult: (itemId: number) =>
    api.put(`/lab/approve/${itemId}`),

  rejectSample: (
    itemId: number,
    reason: string
  ) =>
    api.put(
      `/lab/reject/${itemId}`,
      null,
      {
        params: {
          reason,
        },
      }
    ),

  getPending: () =>
    api.get('/lab/pending'),

  getDashboard: () =>
    api.get('/lab/dashboard/stats'),
}

// ====================================
// OT SERVICE
// ====================================
export const otService = {

  listTheatres: () =>
    api.get('/ot/theatres'),

  createTheatre: (data: any) =>
    api.post('/ot/theatres', data),

  updateTheatreStatus: (
    id: number,
    status: string
  ) =>
    api.put(
      `/ot/theatres/${id}/status`,
      null,
      {
        params: {
          status,
        },
      }
    ),

  scheduleSurgery: (data: any) =>
    api.post('/ot/surgeries', data),

  listSurgeries: (params?: any) =>
    api.get('/ot/surgeries', {
      params,
    }),

  todaySurgeries: () =>
    api.get('/ot/surgeries/today'),

  getSurgery: (id: number) =>
    api.get(`/ot/surgeries/${id}`),

  updateSurgery: (
    id: number,
    data: any
  ) =>
    api.put(
      `/ot/surgeries/${id}`,
      data
    ),

  completePreOp: (
    id: number,
    checklist: any
  ) =>
    api.put(
      `/ot/surgeries/${id}/pre-op-complete`,
      checklist
    ),

  addConsumable: (data: any) =>
    api.post('/ot/consumables', data),

  getConsumables: (
    surgeryId: number
  ) =>
    api.get(
      `/ot/consumables/${surgeryId}`
    ),

  getDashboard: () =>
    api.get('/ot/dashboard/stats'),
}

// ====================================
// NURSING SERVICE
// ====================================
export const nursingService = {

  // MAR
  createMAR: (data: any) =>
    api.post('/nursing/mar', data),

  getMARForAdmission: (
    admissionId: number,
    activeOnly?: boolean
  ) =>
    api.get(
      `/nursing/mar/${admissionId}`,
      {
        params: {
          active_only: activeOnly,
        },
      }
    ),

  discontinueMAR: (marId: number) =>
    api.delete(`/nursing/mar/${marId}`),

  getPendingDoses: (
    admissionId: number
  ) =>
    api.get(
      `/nursing/pending-doses/${admissionId}`
    ),

  // ADMINISTRATION
  recordAdministration: (
    data: any
  ) =>
    api.post(
      '/nursing/administer',
      data
    ),

  getAdministrations: (
    marId: number,
    fromDate?: string
  ) =>
    api.get(
      `/nursing/administer/${marId}`,
      {
        params: {
          from_date: fromDate,
        },
      }
    ),

  // ASSESSMENTS
  createAssessment: (
    data: any
  ) =>
    api.post(
      '/nursing/assessments',
      data
    ),

  getAssessments: (
    admissionId: number,
    type?: string
  ) =>
    api.get(
      `/nursing/assessments/${admissionId}`,
      {
        params: {
          assessment_type: type,
        },
      }
    ),

  // CARE PLANS
  createCarePlan: (
    data: any
  ) =>
    api.post(
      '/nursing/care-plans',
      data
    ),

  getCarePlans: (
    admissionId: number
  ) =>
    api.get(
      `/nursing/care-plans/${admissionId}`
    ),

  updateCarePlan: (
    id: number,
    data: any
  ) =>
    api.put(
      `/nursing/care-plans/${id}`,
      data
    ),

  addIntervention: (
    planId: number,
    data: any
  ) =>
    api.post(
      `/nursing/care-plans/${planId}/interventions`,
      data
    ),

  // HANDOVER
  createHandover: (
    data: any
  ) =>
    api.post(
      '/nursing/handover',
      data
    ),

  listHandovers: (
    params?: any
  ) =>
    api.get(
      '/nursing/handover',
      {
        params,
      }
    ),

  receiveHandover: (
    id: number
  ) =>
    api.put(
      `/nursing/handover/${id}/receive`
    ),

  // DASHBOARD
  getDashboard: (
    admissionId: number
  ) =>
    api.get(
      `/nursing/dashboard/stats/${admissionId}`
    ),
}

// ====================================
// RADIOLOGY SERVICE
// ====================================
export const radiologyService = {

  createOrder: (data: any) =>
    api.post('/radiology/orders', data),

  listOrders: (params?: any) =>
    api.get('/radiology/orders', {
      params,
    }),

  getOrder: (id: number) =>
    api.get(`/radiology/orders/${id}`),

  updateStatus: (
    id: number,
    status: string
  ) =>
    api.put(
      `/radiology/orders/${id}/status`,
      null,
      {
        params: {
          status,
        },
      }
    ),

  submitReport: (
    id: number,
    data: any
  ) =>
    api.put(
      `/radiology/orders/${id}/report`,
      data
    ),

  addImage: (
    orderId: number,
    fileName: string,
    filePath: string,
    viewType?: string
  ) =>
    api.post(
      `/radiology/orders/${orderId}/images`,
      null,
      {
        params: {
          file_name: fileName,
          file_path: filePath,
          view_type: viewType,
        },
      }
    ),

  getPending: () =>
    api.get('/radiology/pending'),

  getDashboard: () =>
    api.get('/radiology/dashboard/stats'),
}

// ====================================
// BILLING SERVICE
// ====================================
export const billingService = {

  listServices: (params?: any) =>
    api.get('/billing/services', {
      params,
    }),

  createService: (data: any) =>
    api.post('/billing/services', data),

  listPackages: () =>
    api.get('/billing/packages'),

  createPackage: (data: any) =>
    api.post('/billing/packages', data),

  createBill: (data: any) =>
    api.post('/billing/bills', data),

  listBills: (params?: any) =>
    api.get('/billing/bills', {
      params,
    }),

  getBill: (id: number) =>
    api.get(`/billing/bills/${id}`),

  updateBill: (
    id: number,
    data: any
  ) =>
    api.put(
      `/billing/bills/${id}`,
      data
    ),

  recordPayment: (data: any) =>
    api.post(
      '/billing/payments',
      data
    ),

  getPayments: (billId: number) =>
    api.get(
      `/billing/payments/${billId}`
    ),

  collectAdvance: (data: any) =>
    api.post(
      '/billing/advance',
      data
    ),

  getAdvances: (
    patientId: number
  ) =>
    api.get(
      `/billing/advance/${patientId}`
    ),

  approveDiscount: (
    data: any
  ) =>
    api.post(
      '/billing/bills/discount-approval',
      data
    ),

  dailyReport: (
    date?: string
  ) =>
    api.get(
      '/billing/reports/daily',
      {
        params: {
          report_date: date,
        },
      }
    ),

  outstandingReport: () =>
    api.get(
      '/billing/reports/outstanding'
    ),

  getDashboard: () =>
    api.get(
      '/billing/dashboard/stats'
    ),
}

// ====================================
// PHARMACY SERVICE
// ====================================
export const pharmacyService = {

  listDrugs: (params?: any) =>
    api.get('/pharmacy/drugs', {
      params,
    }),

  createDrug: (data: any) =>
    api.post('/pharmacy/drugs', data),

  getDrugStock: (drugId: number) =>
    api.get(
      `/pharmacy/drugs/${drugId}/stock`
    ),

  addStock: (data: any) =>
    api.post('/pharmacy/stock', data),

  listSuppliers: () =>
    api.get('/pharmacy/suppliers'),

  createSupplier: (data: any) =>
    api.post(
      '/pharmacy/suppliers',
      data
    ),

  createPO: (data: any) =>
    api.post(
      '/pharmacy/purchase-orders',
      data
    ),

  listPOs: () =>
    api.get(
      '/pharmacy/purchase-orders'
    ),

  receivePO: (id: number) =>
    api.put(
      `/pharmacy/purchase-orders/${id}/receive`
    ),

  dispense: (data: any) =>
    api.post(
      '/pharmacy/dispense',
      data
    ),

  listDispenses: (params?: any) =>
    api.get(
      '/pharmacy/dispense',
      {
        params,
      }
    ),

  getAlerts: () =>
    api.get('/pharmacy/alerts'),

  getDashboard: () =>
    api.get(
      '/pharmacy/dashboard/stats'
    ),
}

// ====================================
// INSURANCE SERVICE
// ====================================
export const insuranceService = {

  listCompanies: () =>
    api.get('/insurance/companies'),

  createCompany: (data: any) =>
    api.post(
      '/insurance/companies',
      data
    ),

  listPolicies: (params?: any) =>
    api.get(
      '/insurance/policies',
      {
        params,
      }
    ),

  createPolicy: (data: any) =>
    api.post(
      '/insurance/policies',
      data
    ),

  getPolicy: (id: number) =>
    api.get(
      `/insurance/policies/${id}`
    ),

  createClaim: (data: any) =>
    api.post(
      '/insurance/claims',
      data
    ),

  listClaims: (params?: any) =>
    api.get(
      '/insurance/claims',
      {
        params,
      }
    ),

  getClaim: (id: number) =>
    api.get(
      `/insurance/claims/${id}`
    ),

  updateClaim: (
    id: number,
    data: any
  ) =>
    api.put(
      `/insurance/claims/${id}`,
      data
    ),

  requestPreauth: (
    claimId: number
  ) =>
    api.post(
      `/insurance/claims/${claimId}/request-preauth`
    ),

  preauthResponse: (
    claimId: number,
    data: any
  ) =>
    api.post(
      `/insurance/claims/${claimId}/preauth-response`,
      data
    ),

  submitClaim: (
    claimId: number,
    reference?: string
  ) =>
    api.post(
      `/insurance/claims/${claimId}/submit`,
      null,
      {
        params: {
          submission_reference:
            reference,
        },
      }
    ),

  addDocument: (
    claimId: number,
    data: any
  ) =>
    api.post(
      `/insurance/claims/${claimId}/documents`,
      data
    ),

  getDashboard: () =>
    api.get(
      '/insurance/dashboard/stats'
    ),
}

// ====================================
// HR SERVICE
// ====================================
export const hrService = {

  // DEPARTMENTS
  listDepartments: () =>
    api.get('/hr/departments'),

  createDepartment: (
    data: any
  ) =>
    api.post(
      '/hr/departments',
      data
    ),

  // DESIGNATIONS
  listDesignations: (
    deptId?: number
  ) =>
    api.get(
      '/hr/designations',
      {
        params: {
          department_id: deptId,
        },
      }
    ),

  createDesignation: (
    data: any
  ) =>
    api.post(
      '/hr/designations',
      data
    ),

  // STAFF
  listStaff: (
    params?: any
  ) =>
    api.get('/hr/staff', {
      params,
    }),

  getStaff: (id: number) =>
    api.get(`/hr/staff/${id}`),

  createStaff: (data: any) =>
    api.post('/hr/staff', data),

  updateStaff: (
    id: number,
    data: any
  ) =>
    api.put(
      `/hr/staff/${id}`,
      data
    ),

  // ATTENDANCE
  markAttendance: (
    data: any
  ) =>
    api.post(
      '/hr/attendance',
      data
    ),

  bulkAttendance: (
    data: any
  ) =>
    api.post(
      '/hr/attendance/bulk',
      data
    ),

  getAttendance: (
    params?: any
  ) =>
    api.get(
      '/hr/attendance',
      {
        params,
      }
    ),

  getAttendanceSummary: (
    staffId: number,
    month: number,
    year: number
  ) =>
    api.get(
      `/hr/attendance/summary/${staffId}`,
      {
        params: {
          month,
          year,
        },
      }
    ),

  // LEAVES
  applyLeave: (data: any) =>
    api.post('/hr/leaves', data),

  listLeaves: (
    params?: any
  ) =>
    api.get('/hr/leaves', {
      params,
    }),

  approveLeave: (
    id: number,
    data: any
  ) =>
    api.put(
      `/hr/leaves/${id}/approve`,
      data
    ),

  getLeaveBalance: (
    staffId: number,
    year?: number
  ) =>
    api.get(
      `/hr/leaves/balance/${staffId}`,
      {
        params: {
          year,
        },
      }
    ),

  // HOLIDAYS
  listHolidays: (
    year?: number
  ) =>
    api.get('/hr/holidays', {
      params: {
        year,
      },
    }),

  createHoliday: (
    data: any
  ) =>
    api.post(
      '/hr/holidays',
      data
    ),

  // PAYROLL
  generatePayroll: (
    data: any
  ) =>
    api.post(
      '/hr/payroll/generate',
      data
    ),

  listPayrolls: (
    params?: any
  ) =>
    api.get('/hr/payroll', {
      params,
    }),

  updatePayroll: (
    id: number,
    data: any
  ) =>
    api.put(
      `/hr/payroll/${id}`,
      data
    ),

  getPayslip: (
    id: number
  ) =>
    api.get(
      `/hr/payroll/${id}/payslip`
    ),

  // DASHBOARD
  getDashboard: () =>
    api.get('/hr/dashboard/stats'),
}

// Reports Service
export const reportsService = {
  getMIS: (p?: any) => api.get('/reports/mis', { params: p }),
  getOPD: (p?: any) => api.get('/reports/opd', { params: p }),
  getIPD: (p?: any) => api.get('/reports/ipd', { params: p }),
  getRevenue: (p?: any) => api.get('/reports/revenue', { params: p }),
  getPatients: (p?: any) => api.get('/reports/patients', { params: p }),
  getLab: (p?: any) => api.get('/reports/lab', { params: p }),
  getPharmacy: (p?: any) => api.get('/reports/pharmacy', { params: p }),
  getInsurance: (p?: any) => api.get('/reports/insurance', { params: p }),
  getBedOccupancy: () => api.get('/reports/bed-occupancy'),
  getDoctorWise: (p?: any) => api.get('/reports/doctor-wise', { params: p }),
  getSavedReports: () => api.get('/reports/saved'),
  createSchedule: (d: any) => api.post('/reports/schedules', d),
  listSchedules: () => api.get('/reports/schedules'),
}

// Admin Service
export const adminService = {
  // Users
  listUsers: (p?: any) => api.get('/admin/users', { params: p }),
  toggleUserStatus: (id: number) => api.put(`/admin/users/${id}/toggle-status`),
  resetPassword: (id: number, password: string) =>
    api.put(`/admin/users/${id}/reset-password`, null, { params: { new_password: password } }),
  getLoginHistory: (userId: number) => api.get(`/admin/users/${userId}/login-history`),

  // Roles
  listRoles: () => api.get('/admin/roles'),
  createRole: (d: any) => api.post('/admin/roles', d),
  deleteRole: (id: number) => api.delete(`/admin/roles/${id}`),

  // Permissions
  listPermissions: (module?: string) => api.get('/admin/permissions', { params: { module } }),
  createPermission: (d: any) => api.post('/admin/permissions', d),
  getRolePermissions: (roleId: number) => api.get(`/admin/roles/${roleId}/permissions`),
  updateRolePermissions: (roleId: number, d: any) => api.put(`/admin/roles/${roleId}/permissions`, d),

  // Assign roles
  assignRole: (d: any) => api.post('/admin/users/assign-role', d),
  revokeRole: (userId: number, roleId: number) => api.delete(`/admin/users/${userId}/roles/${roleId}`),

  // Audit logs
  getAuditLogs: (p?: any) => api.get('/admin/audit-logs', { params: p }),

  // Settings
  listSettings: (category?: string) => api.get('/admin/settings', { params: { category } }),
  createSetting: (d: any) => api.post('/admin/settings', d),
  updateSetting: (key: string, d: any) => api.put(`/admin/settings/${key}`, d),

  // Dashboard
  getDashboard: () => api.get('/admin/dashboard/stats'),
}

export default api