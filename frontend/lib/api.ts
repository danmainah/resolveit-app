import axios from 'axios'

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  timeout: 10000,
  withCredentials: true, // Enable cookies for CSRF protection
})

// CSRF token management
let csrfToken: string | null = null

const getCSRFToken = async (): Promise<string> => {
  if (!csrfToken) {
    try {
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/auth/csrf-token`, {
        withCredentials: true
      })
      csrfToken = response.data.csrfToken
    } catch (error) {
      console.error('Failed to get CSRF token:', error)
      throw error
    }
  }

  if (!csrfToken) {
    throw new Error('CSRF token is null after fetch attempt')
  }

  return csrfToken
}

// Request interceptor
api.interceptors.request.use(
  async (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }

    // Add CSRF token for non-GET requests
    if (config.method && !['get', 'head', 'options'].includes(config.method.toLowerCase())) {
      try {
        const csrf = await getCSRFToken()
        config.headers['X-CSRF-Token'] = csrf
      } catch (error) {
        console.warn('Could not get CSRF token:', error)
      }
    }

    // Add security headers
    config.headers['X-Requested-With'] = 'XMLHttpRequest'

    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response
  },
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      csrfToken = null // Reset CSRF token
      window.location.href = '/auth/login'
    } else if (error.response?.status === 403 && error.response?.data?.message?.includes('CSRF')) {
      // Reset CSRF token and retry
      csrfToken = null
      console.warn('CSRF token invalid, will retry on next request')
    }
    return Promise.reject(error)
  }
)