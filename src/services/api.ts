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

  mfaVerifyLogin: async (mfa_token: string, code: string) => {
    try {
      const response = await api.post('/auth/mfa/verify-login', { mfa_token, code })
      if (response.data.access_token) {
        localStorage.setItem('access_token', response.data.access_token)
      }
      if (response.data.refresh_token) {
        localStorage.setItem('refresh_token', response.data.refresh_token)
      }
      return response.data
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || 'Invalid authentication code')
    }
  },

  mfaSetup: async () => (await api.post('/auth/mfa/setup')).data,
  mfaConfirm: async (code: string) => (await api.post('/auth/mfa/confirm', { code })).data,
  mfaDisable: async (password: string, code: string) => (await api.post('/auth/mfa/disable', { password, code })).data,

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

  updateUser: (id: number, data: any) => api.put(`/auth/users/${id}`, data),

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

  updateProfile: (doctorId: number, data: any) =>
    api.put(`/doctors/${doctorId}/profile`, data),

  addRoster: (doctorId: number, data: any) =>
    api.post(`/doctors/${doctorId}/roster`, data),

  getRoster: (doctorId: number) =>
    api.get(`/doctors/${doctorId}/roster`),

  setBulkRoster: (doctorId: number, days: any[]) =>
    api.post(`/doctors/${doctorId}/roster/bulk`, days),

  updateRoster: (doctorId: number, rosterId: number, data: any) =>
    api.put(`/doctors/${doctorId}/roster/${rosterId}`, data),

  deleteRoster: (doctorId: number, rosterId: number) =>
    api.delete(`/doctors/${doctorId}/roster/${rosterId}`),

  getSlots: (doctorId: number, date: string) =>
    api.get(`/doctors/${doctorId}/available-slots`, {
      params: { appointment_date: date },
    }),
}

// ====================================
// APPOINTMENT SERVICE
// ====================================
export const appointmentService = {

  getQueue: (doctorId?: number) =>
    api.get('/appointments/queue/today', { params: doctorId ? { doctor_id: doctorId } : {} }),

  updateStatus: (id: number, status: string) =>
    api.put(`/appointments/${id}/status`, { status }),

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

  transferBed: (admissionId: number, data: any) =>
    api.post(`/ipd/admissions/${admissionId}/transfer-bed`, data),

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

  assign: (id: number, data: any) =>
    api.put(`/radiology/orders/${id}/assign`, data),

  approve: (id: number) =>
    api.put(`/radiology/orders/${id}/approve`),

  flagCritical: (id: number, notes: string) =>
    api.put(`/radiology/orders/${id}/flag-critical`, { notes }),

  acknowledgeCritical: (id: number) =>
    api.put(`/radiology/orders/${id}/acknowledge-critical`),

  listCritical: (unacknowledgedOnly = true) =>
    api.get('/radiology/orders/critical', { params: { unacknowledged_only: unacknowledgedOnly } }),

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

  // PACKAGE LINE ITEMS (items 142-143)
  listPackageLineItems: (packageId: number) =>
    api.get(`/billing/packages/${packageId}/line-items`),

  addPackageLineItem: (data: any) =>
    api.post('/billing/packages/line-items', data),

  removePackageLineItem: (lineItemId: number) =>
    api.delete(`/billing/packages/line-items/${lineItemId}`),

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

  // REFUND WORKFLOW (items 146-149)
  requestRefund: (data: any) =>
    api.post('/billing/refunds', data),

  listRefunds: (params?: any) =>
    api.get('/billing/refunds', { params }),

  approveRefund: (id: number, data?: any) =>
    api.post(`/billing/refunds/${id}/approve`, data || {}),

  rejectRefund: (id: number) =>
    api.post(`/billing/refunds/${id}/reject`, {}),

  reverseRefund: (id: number, data: any) =>
    api.post(`/billing/refunds/${id}/reverse`, data),
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

  // DRUG RETURNS (item 101)
  requestReturn: (data: any) =>
    api.post('/pharmacy/returns', data),

  listReturns: (params?: any) =>
    api.get('/pharmacy/returns', { params }),

  approveReturn: (id: number, data?: any) =>
    api.post(`/pharmacy/returns/${id}/approve`, data || {}),

  rejectReturn: (id: number) =>
    api.post(`/pharmacy/returns/${id}/reject`, {}),

  // DRUG TRANSFER (item 102)
  transferStock: (data: any) =>
    api.post('/pharmacy/transfers', data),

  listTransfers: (params?: any) =>
    api.get('/pharmacy/transfers', { params }),

  // STOCK ADJUSTMENT (item 103)
  adjustStock: (data: any) =>
    api.post('/pharmacy/stock-adjustments', data),

  listAdjustments: (params?: any) =>
    api.get('/pharmacy/stock-adjustments', { params }),

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

  // SALARY STRUCTURES
  createSalaryStructure: (data: any) =>
    api.post('/hr/salary-structures', data),

  getSalaryStructure: (staffId: number) =>
    api.get(`/hr/salary-structures/staff/${staffId}`),

  computeSalary: (staffId: number) =>
    api.get(`/hr/salary-structures/staff/${staffId}/compute`),

  // SHIFT ASSIGNMENTS
  createShiftAssignment: (data: any) =>
    api.post('/hr/shift-assignments', data),

  listShiftAssignments: (params?: any) =>
    api.get('/hr/shift-assignments', { params }),
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

// ====================================
// UPLOAD SERVICE
// ====================================
export const uploadService = {
  userPhoto: (userId: number, file: File) => {
    const form = new FormData()
    form.append('file', file)
    return api.post(`/upload/user-photo/${userId}`, form, { headers: { 'Content-Type': 'multipart/form-data' } })
  },
  doctorPhoto: (doctorId: number, file: File) => {
    const form = new FormData()
    form.append('file', file)
    return api.post(`/upload/doctor-photo/${doctorId}`, form, { headers: { 'Content-Type': 'multipart/form-data' } })
  },
  patientPhoto: (patientId: number, file: File) => {
    const form = new FormData()
    form.append('file', file)
    return api.post(`/upload/patient-photo/${patientId}`, form, { headers: { 'Content-Type': 'multipart/form-data' } })
  },
  deleteUserPhoto: (userId: number) => api.delete(`/upload/user-photo/${userId}`),
}

// ====================================
// NOTIFY SERVICE
// ====================================
export const notifyService = {
  appointment: (id: number) => api.post(`/notify/appointment/${id}`),
  labResult: (id: number) => api.post(`/notify/lab-result/${id}`),
  custom: (data: { patient_id: number; message: string; subject?: string; send_email?: boolean; send_sms?: boolean }) => api.post('/notify/custom', data),
  getConfig: () => api.get('/notify/config'),
}

// ====================================
// BLOOD BANK SERVICE
// ====================================
export const bloodBankService = {
  getDashboard: () => api.get('/blood-bank/dashboard'),
  addDonor: (data: any) => api.post('/blood-bank/donors', data),
  listDonors: (params?: any) => api.get('/blood-bank/donors', { params }),
  recordDonation: (data: any) => api.post('/blood-bank/donations', data),
  listDonations: () => api.get('/blood-bank/donations'),
  createRequest: (data: any) => api.post('/blood-bank/requests', data),
  listRequests: (status?: string) => api.get('/blood-bank/requests', { params: status ? { status } : {} }),
  issueBlood: (id: number, data: any) => api.put(`/blood-bank/requests/${id}/issue`, data),
  rejectRequest: (id: number, data: any) => api.put(`/blood-bank/requests/${id}/reject`, data),
}

// ====================================
// DIET SERVICE
// ====================================
export const dietService = {
  createChart: (data: any) => api.post('/diet-charts', data),
  getChart: (admissionId: number) => api.get(`/diet-charts/${admissionId}`),
  addMeal: (chartId: number, data: any) => api.post(`/diet-charts/${chartId}/meals`, data),
  markServed: (mealId: number) => api.put(`/diet-charts/meals/${mealId}/serve`),
  markConsumed: (mealId: number, data: any) => api.put(`/diet-charts/meals/${mealId}/consume`, data),
  getTemplate: (dietType: string) => api.get(`/diet-charts/templates/${dietType}`),
}

// ====================================
// REFERRAL SERVICE
// ====================================
export const referralService = {
  create: (data: any) => api.post('/referrals', data),
  list: (params?: any) => api.get('/referrals', { params }),
  updateStatus: (id: number, data: any) => api.put(`/referrals/${id}/status`, data),
  getPrintData: (id: number) => api.get(`/referrals/${id}/print`),
}

// ====================================
// EMERGENCY SERVICE
// ====================================
export const emergencyService = {
  getDashboard: () => api.get('/emergency/dashboard/stats'),
  registerVisit: (data: any) => api.post('/emergency/visits', data),
  listVisits: (params?: any) => api.get('/emergency/visits', { params }),
  activeQueue: () => api.get('/emergency/visits/active'),
  getVisit: (id: number) => api.get(`/emergency/visits/${id}`),
  updateVisit: (id: number, data: any) => api.put(`/emergency/visits/${id}`, data),
  addTriage: (id: number, data: any) => api.post(`/emergency/visits/${id}/triage`, data),
  addTreatment: (id: number, data: any) => api.post(`/emergency/visits/${id}/treatments`, data),
  mlcRegister: () => api.get('/emergency/mlc-register'),
}

// ====================================
// CRITICAL CARE SERVICE (ICU/CCU/NICU)
// ====================================
export const criticalCareService = {
  getDashboard: () => api.get('/critical-care/dashboard/stats'),
  admit: (data: any) => api.post('/critical-care/admissions', data),
  list: (params?: any) => api.get('/critical-care/admissions', { params }),
  get: (id: number) => api.get(`/critical-care/admissions/${id}`),
  update: (id: number, data: any) => api.put(`/critical-care/admissions/${id}`, data),
  stepDown: (id: number, data: any) => api.post(`/critical-care/admissions/${id}/step-down`, data),
  addRound: (id: number, data: any) => api.post(`/critical-care/admissions/${id}/rounds`, data),
  listRounds: (id: number) => api.get(`/critical-care/admissions/${id}/rounds`),
}

// ====================================
// AMBULANCE SERVICE
// ====================================
export const ambulanceService = {
  getDashboard: () => api.get('/ambulance/dashboard/stats'),
  createVehicle: (data: any) => api.post('/ambulance/vehicles', data),
  listVehicles: (params?: any) => api.get('/ambulance/vehicles', { params }),
  updateVehicle: (id: number, data: any) => api.put(`/ambulance/vehicles/${id}`, data),
  updateLocation: (id: number, data: any) => api.put(`/ambulance/vehicles/${id}/location`, data),
  createDriver: (data: any) => api.post('/ambulance/drivers', data),
  listDrivers: () => api.get('/ambulance/drivers'),
  requestTrip: (data: any) => api.post('/ambulance/trips', data),
  listTrips: (params?: any) => api.get('/ambulance/trips', { params }),
  activeTrips: () => api.get('/ambulance/trips/active'),
  dispatchTrip: (id: number, data: any) => api.put(`/ambulance/trips/${id}/dispatch`, data),
  completeTrip: (id: number, data: any) => api.put(`/ambulance/trips/${id}/complete`, data),
  cancelTrip: (id: number) => api.put(`/ambulance/trips/${id}/cancel`),
  addFuelLog: (data: any) => api.post('/ambulance/fuel-logs', data),
  listFuelLogs: (vehicleId?: number) => api.get('/ambulance/fuel-logs', { params: { vehicle_id: vehicleId } }),
  addMaintenanceLog: (data: any) => api.post('/ambulance/maintenance-logs', data),
  listMaintenanceLogs: (vehicleId?: number) => api.get('/ambulance/maintenance-logs', { params: { vehicle_id: vehicleId } }),
}

// ====================================
// BIRTH REGISTER SERVICE
// ====================================
export const birthRegisterService = {
  getDashboard: () => api.get('/birth-register/dashboard/stats'),
  register: (data: any) => api.post('/birth-register', data),
  list: (params?: any) => api.get('/birth-register', { params }),
  get: (id: number) => api.get(`/birth-register/${id}`),
  issueCertificate: (babyId: number, data: any) => api.put(`/birth-register/babies/${babyId}/certificate`, data),
  linkPatient: (babyId: number, data: any) => api.put(`/birth-register/babies/${babyId}/link-patient`, data),
}

// ====================================
// MORTUARY SERVICE
// ====================================
export const mortuaryService = {
  getDashboard: () => api.get('/mortuary/dashboard/stats'),
  registerDeath: (data: any) => api.post('/mortuary/records', data),
  list: (params?: any) => api.get('/mortuary/records', { params }),
  inStorage: () => api.get('/mortuary/records/in-storage'),
  get: (id: number) => api.get(`/mortuary/records/${id}`),
  startPostmortem: (id: number) => api.put(`/mortuary/records/${id}/postmortem/start`),
  completePostmortem: (id: number, data: any) => api.put(`/mortuary/records/${id}/postmortem/complete`, data),
  release: (id: number, data: any) => api.put(`/mortuary/records/${id}/release`, data),
  issueCertificate: (id: number, data: any) => api.put(`/mortuary/records/${id}/certificate`, data),
}

// ====================================
// HOUSEKEEPING SERVICE
// ====================================
export const housekeepingService = {
  getDashboard: () => api.get('/housekeeping/dashboard/stats'),
  createTask: (data: any) => api.post('/housekeeping/tasks', data),
  listTasks: (params?: any) => api.get('/housekeeping/tasks', { params }),
  pendingTasks: () => api.get('/housekeeping/tasks/pending'),
  startTask: (id: number) => api.put(`/housekeeping/tasks/${id}/start`),
  completeTask: (id: number) => api.put(`/housekeeping/tasks/${id}/complete`),
  verifyTask: (id: number) => api.put(`/housekeeping/tasks/${id}/verify`),
  sendLinen: (data: any) => api.post('/housekeeping/linen', data),
  listLinen: (params?: any) => api.get('/housekeeping/linen', { params }),
  receiveLinen: (id: number, data: any) => api.put(`/housekeeping/linen/${id}/receive`, data),
  logWaste: (data: any) => api.post('/housekeeping/waste', data),
  listWaste: (params?: any) => api.get('/housekeeping/waste', { params }),
  disposeWaste: (id: number, data: any) => api.put(`/housekeeping/waste/${id}/dispose`, data),
}

// ====================================
// INFECTION CONTROL SERVICE
// ====================================
export const infectionControlService = {
  getDashboard: () => api.get('/infection-control/dashboard/stats'),
  reportIncident: (data: any) => api.post('/infection-control/incidents', data),
  listIncidents: (params?: any) => api.get('/infection-control/incidents', { params }),
  updateIncident: (id: number, data: any) => api.put(`/infection-control/incidents/${id}`, data),
  startIsolation: (data: any) => api.post('/infection-control/isolation', data),
  listIsolation: (params?: any) => api.get('/infection-control/isolation', { params }),
  endIsolation: (id: number) => api.put(`/infection-control/isolation/${id}/end`),
}

// ====================================
// FRONT DESK SERVICE (Visitors + Lost & Found)
// ====================================
export const frontDeskService = {
  getDashboard: () => api.get('/front-desk/dashboard/stats'),
  checkInVisitor: (data: any) => api.post('/front-desk/visitors/check-in', data),
  listVisitors: (params?: any) => api.get('/front-desk/visitors', { params }),
  currentlyInVisitors: () => api.get('/front-desk/visitors/currently-in'),
  checkOutVisitor: (id: number) => api.put(`/front-desk/visitors/${id}/check-out`),
  reportLostFound: (data: any) => api.post('/front-desk/lost-found', data),
  listLostFound: (params?: any) => api.get('/front-desk/lost-found', { params }),
  claimItem: (id: number, data: any) => api.put(`/front-desk/lost-found/${id}/claim`, data),
  markUnclaimed: (id: number) => api.put(`/front-desk/lost-found/${id}/mark-unclaimed`),
}

// ====================================
// CSSD SERVICE
// ====================================
export const cssdService = {
  getDashboard: () => api.get('/cssd/dashboard/stats'),
  receiveItems: (data: any) => api.post('/cssd/cycles', data),
  listCycles: (params?: any) => api.get('/cssd/cycles', { params }),
  activeCycles: () => api.get('/cssd/cycles/active'),
  startSterilization: (id: number) => api.put(`/cssd/cycles/${id}/start-sterilization`),
  qualityCheck: (id: number, data: any) => api.put(`/cssd/cycles/${id}/quality-check`, data),
  dispatch: (id: number, data: any) => api.put(`/cssd/cycles/${id}/dispatch`, data),
}

// ====================================
// FACILITY & EQUIPMENT SERVICE
// ====================================
export const facilityService = {
  getDashboard: () => api.get('/facility/dashboard/stats'),
  registerEquipment: (data: any) => api.post('/facility/equipment', data),
  listEquipment: (params?: any) => api.get('/facility/equipment', { params }),
  updateEquipment: (id: number, data: any) => api.put(`/facility/equipment/${id}`, data),
  logMaintenance: (id: number, data: any) => api.post(`/facility/equipment/${id}/maintenance`, data),
  listMaintenanceLogs: (id: number) => api.get(`/facility/equipment/${id}/maintenance`),
  createServiceRequest: (data: any) => api.post('/facility/service-requests', data),
  listServiceRequests: (params?: any) => api.get('/facility/service-requests', { params }),
  updateServiceRequest: (id: number, data: any) => api.put(`/facility/service-requests/${id}`, data),
}

// ====================================
// SECURITY INCIDENT SERVICE
// ====================================
export const securityIncidentService = {
  getDashboard: () => api.get('/security-incidents/dashboard/stats'),
  report: (data: any) => api.post('/security-incidents', data),
  list: (params?: any) => api.get('/security-incidents', { params }),
  update: (id: number, data: any) => api.put(`/security-incidents/${id}`, data),
}

// ====================================
// CPOE / CLINICAL ORDERS SERVICE
// ====================================
export const cpoeService = {
  listOrderSets: (params?: any) => api.get('/cpoe/order-sets', { params }),
  createOrderSet: (data: any) => api.post('/cpoe/order-sets', data),
  applyOrderSet: (id: number, data: any) => api.post(`/cpoe/order-sets/${id}/apply`, data),
  createOrder: (data: any) => api.post('/cpoe/orders', data),
  listOrders: (params?: any) => api.get('/cpoe/orders', { params }),
  getQueue: (orderType: string) => api.get(`/cpoe/orders/queue/${orderType}`),
  updateOrder: (id: number, data: any) => api.patch(`/cpoe/orders/${id}`, data),
  addNote: (data: any) => api.post(`/cpoe/orders/${data.order_id}/notes`, data),
  listNotes: (id: number) => api.get(`/cpoe/orders/${id}/notes`),
  claimLab: (id: number, testId: number) => api.post(`/cpoe/orders/${id}/claim/lab`, null, { params: { test_id: testId } }),
  claimRadiology: (id: number, scanType: string, bodyPart: string) =>
    api.post(`/cpoe/orders/${id}/claim/radiology`, null, { params: { scan_type: scanType, body_part: bodyPart } }),
  claimPharmacy: (id: number, drugId: number) => api.post(`/cpoe/orders/${id}/claim/pharmacy`, null, { params: { drug_id: drugId } }),
}

// ====================================
// CONSENT MANAGEMENT SERVICE
// ====================================
export const consentService = {
  listTemplates: (params?: any) => api.get('/consent/templates', { params }),
  createTemplate: (data: any) => api.post('/consent/templates', data),
  listPatientConsents: (params?: any) => api.get('/consent/patient-consents', { params }),
  createPatientConsent: (data: any) => api.post('/consent/patient-consents', data),
  sign: (id: number, data: any) => api.post(`/consent/patient-consents/${id}/sign`, data),
  refuse: (id: number) => api.post(`/consent/patient-consents/${id}/refuse`),
  withdraw: (id: number, data: any) => api.post(`/consent/patient-consents/${id}/withdraw`, data),
}

// ====================================
// CLINICAL FORM BUILDER SERVICE
// ====================================
export const clinicalFormsService = {
  listTemplates: (params?: any) => api.get('/clinical-forms/templates', { params }),
  createTemplate: (data: any) => api.post('/clinical-forms/templates', data),
  updateTemplate: (id: number, data: any) => api.put(`/clinical-forms/templates/${id}`, data),
  listSubmissions: (params?: any) => api.get('/clinical-forms/submissions', { params }),
  submitForm: (data: any) => api.post('/clinical-forms/submissions', data),
  updateSubmission: (id: number, data: any) => api.patch(`/clinical-forms/submissions/${id}`, data),
}

// ====================================
// CLINICAL PATHWAYS / CARE PLANS SERVICE
// ====================================
export const carePlanService = {
  listTemplates: (params?: any) => api.get('/care-plans/templates', { params }),
  createTemplate: (data: any) => api.post('/care-plans/templates', data),
  startFromTemplate: (data: any) => api.post('/care-plans/from-template', data),
  startCustom: (data: any) => api.post('/care-plans/custom', data),
  listForPatient: (patientId: number, activeOnly = false) =>
    api.get(`/care-plans/patient/${patientId}`, { params: { active_only: activeOnly } }),
  listTasks: (planId: number) => api.get(`/care-plans/${planId}/tasks`),
  updateTask: (taskId: number, data: any) => api.patch(`/care-plans/tasks/${taskId}`, data),
  complete: (planId: number) => api.post(`/care-plans/${planId}/complete`),
}

// ====================================
// CLINICAL TIMELINE SERVICE
// ====================================
export const clinicalTimelineService = {
  getPatientTimeline: (patientId: number) => api.get(`/clinical-timeline/patient/${patientId}`),
  getCriticalResults: () => api.get('/clinical-timeline/critical-results'),
  notifyDoctor: (labOrderItemId: number) => api.post(`/clinical-timeline/critical-results/${labOrderItemId}/notify-doctor`),
}

// ====================================
// ANESTHESIA SERVICE
// ====================================
export const anesthesiaService = {
  createPreAssessment: (data: any) => api.post('/anesthesia/pre-assessments', data),
  listPreAssessments: (surgeryId: number) => api.get(`/anesthesia/pre-assessments/surgery/${surgeryId}`),
  startRecord: (data: any) => api.post('/anesthesia/records', data),
  getRecordForSurgery: (surgeryId: number) => api.get(`/anesthesia/records/surgery/${surgeryId}`),
  updateRecord: (id: number, data: any) => api.patch(`/anesthesia/records/${id}`, data),
  addVital: (recordId: number, data: any) => api.post(`/anesthesia/records/${recordId}/vitals`, data),
  listVitals: (recordId: number) => api.get(`/anesthesia/records/${recordId}/vitals`),
}

// ====================================
// RECOVERY ROOM / PACU SERVICE
// ====================================
export const recoveryRoomService = {
  admit: (data: any) => api.post('/recovery-room/stays', data),
  listActive: (params?: any) => api.get('/recovery-room/stays', { params }),
  getForSurgery: (surgeryId: number) => api.get(`/recovery-room/stays/surgery/${surgeryId}`),
  addObservation: (stayId: number, data: any) => api.post(`/recovery-room/stays/${stayId}/observations`, data),
  listObservations: (stayId: number) => api.get(`/recovery-room/stays/${stayId}/observations`),
  discharge: (stayId: number, data: any) => api.post(`/recovery-room/stays/${stayId}/discharge`, data),
}

// ====================================
// PHYSIOTHERAPY / REHABILITATION SERVICE
// ====================================
export const physiotherapyService = {
  createPlan: (data: any) => api.post('/physiotherapy/plans', data),
  listPlans: (params?: any) => api.get('/physiotherapy/plans', { params }),
  completePlan: (id: number) => api.post(`/physiotherapy/plans/${id}/complete`),
  scheduleSession: (data: any) => api.post('/physiotherapy/sessions', data),
  listSessions: (planId: number) => api.get(`/physiotherapy/sessions/plan/${planId}`),
  completeSession: (id: number, data: any) => api.post(`/physiotherapy/sessions/${id}/complete`, data),
  markMissed: (id: number) => api.post(`/physiotherapy/sessions/${id}/mark-missed`),
}

// ====================================
// PAIN MANAGEMENT SERVICE
// ====================================
export const painManagementService = {
  createPlan: (data: any) => api.post('/pain-management/plans', data),
  listPlans: (params?: any) => api.get('/pain-management/plans', { params }),
  closePlan: (id: number) => api.post(`/pain-management/plans/${id}/close`),
  addAssessment: (data: any) => api.post('/pain-management/assessments', data),
  listAssessments: (planId: number) => api.get(`/pain-management/assessments/plan/${planId}`),
}

// ====================================
// PALLIATIVE / HOSPICE CARE SERVICE
// ====================================
export const palliativeCareService = {
  createPlan: (data: any) => api.post('/palliative-care/plans', data),
  listPlans: (params?: any) => api.get('/palliative-care/plans', { params }),
  closePlan: (id: number, data: any) => api.post(`/palliative-care/plans/${id}/close`, data),
  addSymptomAssessment: (data: any) => api.post('/palliative-care/symptom-assessments', data),
  listSymptomAssessments: (planId: number) => api.get(`/palliative-care/symptom-assessments/plan/${planId}`),
}

// ====================================
// TELEMEDICINE / VIRTUAL CONSULTATION SERVICE
// ====================================
export const telemedicineService = {
  schedule: (data: any) => api.post('/telemedicine/consultations', data),
  list: (params?: any) => api.get('/telemedicine/consultations', { params }),
  setMeetingDetails: (id: number, data: any) => api.patch(`/telemedicine/consultations/${id}/meeting-details`, data),
  start: (id: number) => api.post(`/telemedicine/consultations/${id}/start`),
  complete: (id: number, data: any) => api.post(`/telemedicine/consultations/${id}/complete`, data),
  cancel: (id: number, data: any) => api.post(`/telemedicine/consultations/${id}/cancel`, data),
  markNoShow: (id: number) => api.post(`/telemedicine/consultations/${id}/no-show`),
}

// ====================================
// PREVENTIVE HEALTHCARE / HEALTH CHECK-UPS SERVICE
// ====================================
export const preventiveHealthService = {
  bookCheckup: (data: any) => api.post('/preventive-health/checkup-bookings', data),
  listBookings: (params?: any) => api.get('/preventive-health/checkup-bookings', { params }),
  updateBookingStatus: (id: number, data: any) => api.patch(`/preventive-health/checkup-bookings/${id}/status`, data),
  addReview: (id: number, data: any) => api.post(`/preventive-health/checkup-bookings/${id}/review`, data),
  vaccinationsDueSoon: (withinDays = 30) => api.get('/preventive-health/vaccinations/due-soon', { params: { within_days: withinDays } }),
}

// ====================================
// FAMILY / PROXY / CAREGIVER SERVICE
// ====================================
export const familyService = {
  addMember: (data: any) => api.post('/family/members', data),
  listMembers: (patientId: number) => api.get(`/family/members/patient/${patientId}`),
  removeMember: (id: number) => api.delete(`/family/members/${id}`),
  getHealthSummary: (patientId: number) => api.get(`/family/health-summary/patient/${patientId}`),
}

// ====================================
// PATIENT CATEGORY (International / Corporate / Medical Tourism) SERVICE
// ====================================
export const patientCategoryService = {
  upsertProfile: (data: any) => api.put('/patient-category/profile', data),
  getProfile: (patientId: number) => api.get(`/patient-category/profile/patient/${patientId}`),
  listByCategory: (category: string) => api.get(`/patient-category/by-category/${category}`),
}

// ====================================
// CLINICAL DECISION SUPPORT (CDS) SERVICE
// ====================================
export const cdsService = {
  listRules: (activeOnly = true) => api.get('/cds/rules', { params: { active_only: activeOnly } }),
  createRule: (data: any) => api.post('/cds/rules', data),
  deactivateRule: (id: number) => api.delete(`/cds/rules/${id}`),
  getPatientAlerts: (patientId: number) => api.get(`/cds/alerts/patient/${patientId}`),
  overrideAlert: (id: number, data: any) => api.post(`/cds/alerts/${id}/override`, data),
}

// ====================================
// DOCTOR PORTAL SERVICE
// ====================================
export const doctorPortalService = {
  todayAppointments: () => api.get('/doctor-portal/today-appointments'),
  myPatients: () => api.get('/doctor-portal/my-patients'),
  pendingOrders: () => api.get('/doctor-portal/pending-orders'),
  myActiveCarePlans: () => api.get('/doctor-portal/my-active-care-plans'),
}

// ====================================
// NURSE PORTAL SERVICE
// ====================================
export const nursePortalService = {
  myWards: () => api.get('/nurse-portal/my-wards'),
  wardPatients: (wardId: number) => api.get(`/nurse-portal/ward/${wardId}/patients`),
  dueMedications: (windowMinutes = 60) => api.get('/nurse-portal/due-medications', { params: { window_minutes: windowMinutes } }),
  giveMedication: (id: number, data: any) => api.post(`/nurse-portal/due-medications/${id}/give`, data),
  markNotGiven: (id: number, data: any) => api.post(`/nurse-portal/due-medications/${id}/not-given`, data),
  latestHandover: (wardId: number) => api.get(`/nurse-portal/ward/${wardId}/handover/latest`),
  carePlans: (patientId: number) => api.get(`/nurse-portal/care-plans/patient/${patientId}`),
  addNote: (data: any) => api.post('/nurse-portal/notes', data),
  listNotes: (admissionId: number) => api.get(`/nurse-portal/notes/admission/${admissionId}`),
}

// ====================================
// NURSE WARD ROSTER SERVICE
// ====================================
export const nurseRosterService = {
  assign: (data: any) => api.post('/nurse-roster/assignments', data),
  list: (params?: any) => api.get('/nurse-roster/assignments', { params }),
  myWardsToday: () => api.get('/nurse-roster/my-wards-today'),
}

// ====================================
// PATIENT PORTAL SERVICE (staff-side grievance triage; patient auth is separate)
// INVENTORY SERVICE
// ====================================
export const patientPortalService = {
  listAllGrievances: (params?: any) => api.get('/patient-portal/admin/grievances', { params }),
  updateGrievance: (id: number, data: any) => api.patch(`/patient-portal/admin/grievances/${id}`, data),
}

// ====================================
// DIALYSIS SERVICE
// ====================================
export const dialysisService = {
  createProfile: (data: any) => api.post('/dialysis/profiles', data),
  listProfiles: (activeOnly = true) => api.get('/dialysis/profiles', { params: { active_only: activeOnly } }),
  getProfile: (patientId: number) => api.get(`/dialysis/profiles/patient/${patientId}`),
  scheduleSession: (data: any) => api.post('/dialysis/sessions', data),
  listSessions: (profileId: number) => api.get(`/dialysis/sessions/profile/${profileId}`),
  sessionsToday: () => api.get('/dialysis/sessions/today'),
  updateSession: (id: number, data: any) => api.patch(`/dialysis/sessions/${id}`, data),
}

// ====================================
// MENTAL HEALTH / PSYCHIATRY SERVICE
// ====================================
export const mentalHealthService = {
  createAssessment: (data: any) => api.post('/mental-health/assessments', data),
  listAssessments: (patientId: number) => api.get(`/mental-health/assessments/patient/${patientId}`),
  highRisk: () => api.get('/mental-health/high-risk'),
  createCarePlan: (data: any) => api.post('/mental-health/care-plans', data),
  listCarePlans: (patientId: number, activeOnly = true) => api.get(`/mental-health/care-plans/patient/${patientId}`, { params: { active_only: activeOnly } }),
  scheduleSession: (data: any) => api.post('/mental-health/therapy-sessions', data),
  listSessions: (carePlanId: number) => api.get(`/mental-health/therapy-sessions/plan/${carePlanId}`),
  updateSession: (id: number, data: any) => api.patch(`/mental-health/therapy-sessions/${id}`, data),
}

// ====================================
// FERTILITY / IVF SERVICE
// ====================================
export const fertilityService = {
  createProfile: (data: any) => api.post('/fertility/profiles', data),
  getProfile: (patientId: number) => api.get(`/fertility/profiles/patient/${patientId}`),
  startCycle: (data: any) => api.post('/fertility/cycles', data),
  listCycles: (profileId: number) => api.get(`/fertility/cycles/profile/${profileId}`),
  updateCycle: (id: number, data: any) => api.patch(`/fertility/cycles/${id}`, data),
  addMonitoringVisit: (data: any) => api.post('/fertility/monitoring-visits', data),
  listMonitoringVisits: (cycleId: number) => api.get(`/fertility/monitoring-visits/cycle/${cycleId}`),
}

// ====================================
// ONCOLOGY SERVICE
// ====================================
export const oncologyService = {
  createCase: (data: any) => api.post('/oncology/cases', data),
  listCases: (params?: any) => api.get('/oncology/cases', { params }),
  updateCase: (id: number, data: any) => api.patch(`/oncology/cases/${id}`, data),
  scheduleChemoCycle: (data: any) => api.post('/oncology/chemo-cycles', data),
  listChemoCycles: (caseId: number) => api.get(`/oncology/chemo-cycles/case/${caseId}`),
  updateChemoCycle: (id: number, data: any) => api.patch(`/oncology/chemo-cycles/${id}`, data),
  addFollowUp: (data: any) => api.post('/oncology/follow-ups', data),
  listFollowUps: (caseId: number) => api.get(`/oncology/follow-ups/case/${caseId}`),
}

// ====================================
// TRANSPLANT SERVICE
// ====================================
export const transplantService = {
  addCandidate: (data: any) => api.post('/transplant/candidates', data),
  listCandidates: (params?: any) => api.get('/transplant/candidates', { params }),
  updateCandidate: (id: number, data: any) => api.patch(`/transplant/candidates/${id}`, data),
  createCase: (data: any) => api.post('/transplant/cases', data),
  listCases: (patientId?: number) => api.get('/transplant/cases', { params: patientId ? { patient_id: patientId } : {} }),
  updateCase: (id: number, data: any) => api.patch(`/transplant/cases/${id}`, data),
  addFollowUp: (data: any) => api.post('/transplant/follow-ups', data),
  listFollowUps: (caseId: number) => api.get(`/transplant/follow-ups/case/${caseId}`),
}

// ====================================
// MASTER PATIENT INDEX (MPI) SERVICE
// ====================================
export const mpiService = {
  scan: () => api.post('/mpi/scan'),
  listCandidates: (status = 'potential_duplicate') => api.get('/mpi/candidates', { params: { status } }),
  review: (id: number, data: any) => api.post(`/mpi/candidates/${id}/review`, data),
  merge: (id: number, data: any) => api.post(`/mpi/candidates/${id}/merge`, data),
}

// ====================================
// PROVIDER REGISTRY SERVICE
// ====================================
export const providerRegistryService = {
  create: (data: any) => api.post('/provider-registry', data),
  list: (params?: any) => api.get('/provider-registry', { params }),
  update: (id: number, data: any) => api.patch(`/provider-registry/${id}`, data),
}

// ====================================
// FACILITY REGISTRY SERVICE
// ====================================
export const facilityRegistryService = {
  create: (data: any) => api.post('/facility-registry', data),
  list: (params?: any) => api.get('/facility-registry', { params }),
  update: (id: number, data: any) => api.patch(`/facility-registry/${id}`, data),
}

// ====================================
// TERMINOLOGY REPOSITORY SERVICE
// ====================================
export const terminologyService = {
  createCode: (data: any) => api.post('/terminology/codes', data),
  search: (params?: any) => api.get('/terminology/codes/search', { params }),
  bulkImport: (codeSystem: string, csvContent: string) =>
    api.post('/terminology/codes/bulk-import', null, { params: { code_system: codeSystem, csv_content: csvContent } }),
}

// ====================================
// DATA GOVERNANCE SERVICE
// ====================================
export const dataGovernanceService = {
  createAsset: (data: any) => api.post('/data-governance/assets', data),
  listAssets: (params?: any) => api.get('/data-governance/assets', { params }),
  createRetentionPolicy: (data: any) => api.post('/data-governance/retention-policies', data),
  listRetentionPolicies: () => api.get('/data-governance/retention-policies'),
  logArchivalJob: (data: any) => api.post('/data-governance/archival-jobs', data),
  listArchivalJobs: (assetId?: number) => api.get('/data-governance/archival-jobs', { params: assetId ? { data_asset_id: assetId } : {} }),
  createQualityRule: (data: any) => api.post('/data-governance/quality-rules', data),
  listQualityRules: () => api.get('/data-governance/quality-rules'),
  listQualityFindings: (resolved = false) => api.get('/data-governance/quality-findings', { params: { resolved } }),
  resolveFinding: (id: number, data: any) => api.post(`/data-governance/quality-findings/${id}/resolve`, data),
}

// ====================================
// FHIR SERVICE
// ====================================
export const fhirService = {
  capabilityStatement: () => api.get('/fhir/metadata'),
  getPatient: (id: number) => api.get(`/fhir/Patient/${id}`),
  searchPatients: (identifier: string) => api.get('/fhir/Patient', { params: { identifier } }),
  searchObservations: (patientId: number) => api.get('/fhir/Observation', { params: { patient: patientId } }),
  searchAllergies: (patientId: number) => api.get('/fhir/AllergyIntolerance', { params: { patient: patientId } }),
  searchConditions: (patientId: number) => api.get('/fhir/Condition', { params: { patient: patientId } }),
  getClaim: (id: number) => api.get(`/fhir/Claim/${id}`),
  getPaymentNotice: (id: number) => api.get(`/fhir/PaymentNotice/${id}`),
  patientEverything: (patientId: number) => api.get(`/fhir/Patient/${patientId}/$everything`),
}

// ====================================
// HL7 SERVICE
// ====================================
export const hl7Service = {
  admitMessage: (admissionId: number) => api.get(`/hl7/adt/admission/${admissionId}`, { responseType: 'text' }),
  dischargeMessage: (admissionId: number) => api.get(`/hl7/adt/discharge/${admissionId}`, { responseType: 'text' }),
  updateMessage: (admissionId: number) => api.get(`/hl7/adt/update/${admissionId}`, { responseType: 'text' }),
  labResultMessage: (itemId: number) => api.get(`/hl7/oru/lab-result/${itemId}`, { responseType: 'text' }),
}

// ====================================
// CONSENT-BASED DATA EXCHANGE SERVICE
// ====================================
export const dataExchangeService = {
  grant: (data: any) => api.post('/data-exchange/authorizations', data),
  listForPatient: (patientId: number, activeOnly = true) => api.get(`/data-exchange/authorizations/patient/${patientId}`, { params: { active_only: activeOnly } }),
  revoke: (id: number, data: any) => api.post(`/data-exchange/authorizations/${id}/revoke`, data),
  check: (patientId: number, dataCategory: string) => api.get('/data-exchange/check', { params: { patient_id: patientId, data_category: dataCategory } }),
  listLogs: (authId: number) => api.get(`/data-exchange/logs/authorization/${authId}`),
}

// ====================================
// IDENTITY PROVIDER (SSO) SERVICE
// ====================================
export const identityProviderService = {
  create: (data: any) => api.post('/identity-provider/providers', data),
  list: () => api.get('/identity-provider/providers'),
}

// ====================================
// DICOM / PACS SERVICE
// ====================================
export const dicomService = {
  createStudy: (data: any) => api.post('/dicom/studies', data),
  listStudiesForOrder: (orderId: number) => api.get(`/dicom/studies/order/${orderId}`),
  createSeries: (data: any) => api.post('/dicom/series', data),
  listSeriesForStudy: (studyId: number) => api.get(`/dicom/series/study/${studyId}`),
  createWorklistItem: (data: any) => api.post('/dicom/worklist', data),
  listWorklist: (params?: any) => api.get('/dicom/worklist', { params }),
  updateWorklistItem: (id: number, data: any) => api.patch(`/dicom/worklist/${id}`, data),
}

// ====================================
// PAYMENT GATEWAY SERVICE
// ====================================
export const paymentGatewayService = {
  initiate: (data: any) => api.post('/payment-gateway/initiate', data),
  listForBill: (billId: number) => api.get(`/payment-gateway/transactions/bill/${billId}`),
}



export const inventoryService = {
  getDashboard: () => api.get('/inventory/dashboard/stats'),
  createItem: (data: any) => api.post('/inventory/items', data),
  listItems: (params?: any) => api.get('/inventory/items', { params }),
  createVendor: (data: any) => api.post('/inventory/vendors', data),
  listVendors: (params?: any) => api.get('/inventory/vendors', { params }),
  createPO: (data: any) => api.post('/inventory/purchase-orders', data),
  listPOs: (params?: any) => api.get('/inventory/purchase-orders', { params }),
  getPO: (id: number) => api.get(`/inventory/purchase-orders/${id}`),
  receiveGRN: (data: any) => api.post('/inventory/grn', data),
  listStock: (params?: any) => api.get('/inventory/stock', { params }),
  recordMovement: (data: any) => api.post('/inventory/movements', data),
  listMovements: (params?: any) => api.get('/inventory/movements', { params }),
}

// ====================================
// ACCOUNTS SERVICE
// ====================================
export const accountsService = {
  getDashboard: () => api.get('/accounts/dashboard/stats'),
  createAccount: (data: any) => api.post('/accounts/chart', data),
  listAccounts: (params?: any) => api.get('/accounts/chart', { params }),
  createJournalEntry: (data: any) => api.post('/accounts/journal', data),
  quickExpense: (data: any) => api.post('/accounts/journal/quick-expense', data),
  quickIncome: (data: any) => api.post('/accounts/journal/quick-income', data),
  listJournalEntries: (params?: any) => api.get('/accounts/journal', { params }),
  getLedger: (accountId: number) => api.get(`/accounts/ledger/${accountId}`),
  getCashBook: () => api.get('/accounts/cash-book'),
  getBankBook: () => api.get('/accounts/bank-book'),
  getTrialBalance: (params?: any) => api.get('/accounts/reports/trial-balance', { params }),
  getProfitLoss: (params?: any) => api.get('/accounts/reports/profit-loss', { params }),
  getBalanceSheet: (params?: any) => api.get('/accounts/reports/balance-sheet', { params }),
  listPostableBills: (params?: any) => api.get('/accounts/ar/bills', { params }),
  postBillToGL: (billId: number, data: any) => api.post(`/accounts/ar/bills/${billId}/post`, data),
  listPostablePOs: (params?: any) => api.get('/accounts/ap/purchase-orders', { params }),
  postPOToGL: (poId: number, data: any) => api.post(`/accounts/ap/purchase-orders/${poId}/post`, data),
  getARSummary: () => api.get('/accounts/ar/summary'),
  getAPSummary: () => api.get('/accounts/ap/summary'),
}

// ====================================
// MEDICAL CODING & RCM SERVICE
// ====================================
export const medicalCodingService = {
  getDashboard: () => api.get('/medical-coding/dashboard/stats'),
  createCode: (data: any) => api.post('/medical-coding/codes', data),
  listCodes: (params?: any) => api.get('/medical-coding/codes', { params }),
  codeBill: (data: any) => api.post('/medical-coding/patient-coding', data),
  listPatientCoding: (params?: any) => api.get('/medical-coding/patient-coding', { params }),
  getRCMWorklist: (params?: any) => api.get('/medical-coding/rcm/worklist', { params }),
}

// ====================================
// ORGANIZATION & MASTER DATA SERVICE
// ====================================
export const organizationService = {
  listBranches: (params?: any) => api.get('/organization/branches', { params }),
  createBranch: (data: any) => api.post('/organization/branches', data),
  updateBranch: (id: number, data: any) => api.put(`/organization/branches/${id}`, data),
  listTaxRates: (params?: any) => api.get('/organization/tax-rates', { params }),
  createTaxRate: (data: any) => api.post('/organization/tax-rates', data),
  setDefaultTaxRate: (id: number) => api.put(`/organization/tax-rates/${id}/set-default`),
  listPaymentModes: (params?: any) => api.get('/organization/payment-modes', { params }),
  createPaymentMode: (data: any) => api.post('/organization/payment-modes', data),
  togglePaymentMode: (id: number) => api.put(`/organization/payment-modes/${id}/toggle`),
}

export const reportTemplateService = {
  list: (params?: any) => api.get('/report-templates', { params }),
  get: (id: number) => api.get(`/report-templates/${id}`),
  create: (data: any) => api.post('/report-templates', data),
  update: (id: number, data: any) => api.put(`/report-templates/${id}`, data),
  remove: (id: number) => api.delete(`/report-templates/${id}`),
}

// ====================================
// ANALYTICS SERVICE (items 274-276)
// ====================================
export const analyticsService = {
  patientFlowTrend: (params?: any) => api.get('/analytics/operational/patient-flow-trend', { params }),
  bedOccupancyTrend: (params?: any) => api.get('/analytics/operational/bed-occupancy-trend', { params }),
  topDiagnoses: (params?: any) => api.get('/analytics/clinical/top-diagnoses', { params }),
  readmissionRate: (params?: any) => api.get('/analytics/clinical/readmission-rate', { params }),
  revenueTrend: (params?: any) => api.get('/analytics/financial/revenue-trend', { params }),
  paymentModeBreakdown: (params?: any) => api.get('/analytics/financial/payment-mode-breakdown', { params }),
}

export default api
