import axios, { AxiosError } from 'axios'
import type { AxiosInstance, AxiosResponse, InternalAxiosRequestConfig } from 'axios'
import type {
  AuthRequest,
  AuthResponse,
  IngestionCreateResponse,
  IngestionStatusResponse,
  RagPromptRequest,
  RagPromptResponse,
} from '../types/api'

// Create axios instance with base URL
const api: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000',
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor for adding auth token if needed
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Get token from localStorage or context if authentication is implemented
    const token = localStorage.getItem('auth_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error: AxiosError) => {
    return Promise.reject(error)
  }
)

// Response interceptor for handling common errors
api.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: AxiosError) => {
    // Keep a console trace for debugging while returning structured messages at call sites.
    console.error('API error:', error.response?.status, error.message)
    return Promise.reject(error)
  }
)

export default api

// API service functions
export const chatService = {
  query: async (request: RagPromptRequest): Promise<RagPromptResponse> => {
    const response = await api.post<RagPromptResponse>('/query', request)
    return response.data
  },
}

export const authService = {
  signup: async (payload: AuthRequest): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/signup', payload)
    return response.data
  },
  login: async (payload: AuthRequest): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/login', payload)
    return response.data
  },
}

export const ingestionService = {
  uploadFile: async (file: File, onProgress?: (percent: number) => void): Promise<IngestionCreateResponse> => {
    const formData = new FormData()
    formData.append('file', file)
    
    const response = await api.post<IngestionCreateResponse>(
      '/ingestion/upload',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        // Enable progress tracking
        onUploadProgress: (progressEvent: { loaded: number; total?: number }) => {
          if (!onProgress || !progressEvent.total) {
            return
          }
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total)
          onProgress(percent)
        },
      }
    )
    return response.data
  },
  getStatus: async (taskId: string): Promise<IngestionStatusResponse> => {
    const response = await api.get<IngestionStatusResponse>(`/ingestion/status/${taskId}`)
    return response.data
  },
}

export const extractApiErrorMessage = (error: unknown): string => {
  if (!axios.isAxiosError(error)) {
    return 'Unexpected error occurred.'
  }

  const status = error.response?.status
  const details =
    typeof error.response?.data === 'string'
      ? error.response.data
      : (error.response?.data as { detail?: string } | undefined)?.detail

  if (status === 404) {
    return 'Requested backend endpoint is unavailable. Verify backend routes and URL.'
  }
  if (status === 401) {
    return 'Authentication failed. Please sign in again.'
  }

  if (status && details) {
    return `Request failed (${status}): ${details}`
  }

  if (status) {
    return `Request failed with status ${status}.`
  }

  return 'Cannot reach backend service. Confirm the API server is running.'
}