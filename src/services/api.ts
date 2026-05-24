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

    // FastAPI OAuth2 expects form-data
    const formData = new URLSearchParams()

    formData.append('username', email)
    formData.append('password', password)

    const response = await api.post(
      '/api/auth/login',
      formData,
      {
        headers: {
          'Content-Type':
            'application/x-www-form-urlencoded',
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
  },

  // CURRENT USER
  me: async () => {
    const response = await api.get('/auth/me')
    return response.data
  },

  // CHANGE PASSWORD
  changePassword: async (data: any) => {
    const response = await api.put(
      '/auth/change-password',
      data
    )

    return response.data
  },

  // LIST USERS
  listUsers: async () => {
    const response = await api.get('/auth/users')
    return response.data
  },

  // CREATE USER
  createUser: async (data: any) => {
    const response = await api.post(
      '/auth/register',
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
  list: (params?: any) => api.get('/patients', { params }),
  get: (id: number) => api.get(`/patients/${id}`),
  getByUhid: (uhid: string) => api.get(`/patients/uhid/${uhid}`),
  create: (data: any) => api.post('/patients', data),
  update: (id: number, data: any) => api.put(`/patients/${id}`, data),
  delete: (id: number) => api.delete(`/patients/${id}`),
  history: (id: number) => api.get(`/patients/${id}/history`),
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

export default api