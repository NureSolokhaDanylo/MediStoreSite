import axios, { type AxiosInstance, type AxiosError, type InternalAxiosRequestConfig } from 'axios'
import type { ApiError } from '@/types'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:14000/api/v1'

class ApiClient {
  private client: AxiosInstance
  private refreshPromise: Promise<string> | null = null

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    })

    this.setupInterceptors()
  }

  private setupInterceptors() {
    // Request interceptor: Add auth token
    this.client.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        const token = this.getToken()
        if (token) {
          config.headers.Authorization = `Bearer ${token}`
        }
        return config
      },
      (error) => Promise.reject(error)
    )

    // Response interceptor: Handle errors and token refresh
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError<ApiError>) => {
        const originalRequest = error.config

        const requestUrl = String(originalRequest?.url || '')
        const isAuthEndpoint =
          requestUrl.includes('/account/login') ||
          requestUrl.includes('/account/refresh') ||
          requestUrl.includes('/account/logout')
        const hasAccessToken = !!this.getToken()
        const hasRefreshToken = !!this.getRefreshToken()

        // Handle 401 Unauthorized only for authenticated non-auth requests
        if (
          error.response?.status === 401 &&
          originalRequest &&
          !isAuthEndpoint &&
          hasAccessToken &&
          hasRefreshToken
        ) {
          // Prevent infinite loop
          if ((originalRequest as any)._retry) {
            this.clearAuth()
            window.location.href = '/login'
            return Promise.reject(error)
          }

          (originalRequest as any)._retry = true

          try {
            // Try to refresh token
            const newToken = await this.refreshToken()
            originalRequest.headers.Authorization = `Bearer ${newToken}`
            return this.client(originalRequest)
          } catch (refreshError) {
            this.clearAuth()
            window.location.href = '/login'
            return Promise.reject(refreshError)
          }
        }

        // Format error for consistent handling
        const apiError: ApiError = {
          message: error.response?.data?.message || error.message || 'An unexpected error occurred',
          errors: error.response?.data?.errors,
          statusCode: error.response?.status || 500,
        }

        return Promise.reject(apiError)
      }
    )
  }

  private getToken(): string | null {
    return localStorage.getItem('access_token')
  }

  private getRefreshToken(): string | null {
    return localStorage.getItem('refresh_token')
  }

  private setTokens(accessToken: string, refreshToken: string) {
    localStorage.setItem('access_token', accessToken)
    localStorage.setItem('refresh_token', refreshToken)
  }

  private clearAuth() {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    localStorage.removeItem('user')
  }

  private async refreshToken(): Promise<string> {
    // Prevent multiple simultaneous refresh requests
    if (this.refreshPromise) {
      return this.refreshPromise
    }

    this.refreshPromise = (async () => {
      try {
        const refreshToken = this.getRefreshToken()
        if (!refreshToken) {
          throw new Error('No refresh token available')
        }

        const response = await axios.post(
          `${API_BASE_URL}/account/refresh`,
          { refreshToken },
          {
            headers: { 'Content-Type': 'application/json' },
          }
        )

        const { token, refreshToken: newRefreshToken } = response.data
        this.setTokens(token, newRefreshToken)
        return token
      } finally {
        this.refreshPromise = null
      }
    })()

    return this.refreshPromise
  }

  // Public API methods
  public get<T>(url: string, config = {}) {
    return this.client.get<T>(url, config)
  }

  public post<T>(url: string, data?: any, config = {}) {
    return this.client.post<T>(url, data, config)
  }

  public put<T>(url: string, data?: any, config = {}) {
    return this.client.put<T>(url, data, config)
  }

  public patch<T>(url: string, data?: any, config = {}) {
    return this.client.patch<T>(url, data, config)
  }

  public delete<T>(url: string, config = {}) {
    return this.client.delete<T>(url, config)
  }

  public setAuth(accessToken: string, refreshToken: string) {
    this.setTokens(accessToken, refreshToken)
  }

  public logout() {
    this.clearAuth()
  }

  public isAuthenticated(): boolean {
    return !!this.getToken()
  }
}

// Export singleton instance
export const apiClient = new ApiClient()
export default apiClient
