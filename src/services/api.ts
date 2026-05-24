import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
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
      '/auth/login',
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

export default api

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
