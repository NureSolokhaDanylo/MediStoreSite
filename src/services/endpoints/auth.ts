import apiClient from '../api/client'
import type { LoginRequest, LoginResponse, User } from '@/types'

/**
 * Decode JWT token and extract user data from claims
 */
function decodeJwt(token: string): User {
  try {
    const parts = token.split('.')
    if (parts.length !== 3 || !parts[1]) {
      throw new Error('Invalid JWT format')
    }
    
    const base64Url = parts[1]
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    )
    
    const payload = JSON.parse(jsonPayload)
    console.log('Decoded JWT payload:', payload)
    
    // Extract user data from JWT claims
    const user: User = {
      id: payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'] || payload.sub || '',
      username: payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'] || payload.name || '',
      email: payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'] || payload.email || '',
      firstName: payload.given_name || '',
      lastName: payload.family_name || '',
      role: payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] || payload.role || 'User',
    }
    
    console.log('Extracted user from JWT:', user)
    return user
  } catch (error) {
    console.error('Failed to decode JWT:', error)
    throw new Error('Invalid token format')
  }
}

export const authService = {
  /**
   * Login user with credentials
   */
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await apiClient.post<any>('/account/login', credentials)
    
    console.log('Raw login response:', response.data)
    
    // Handle different possible response formats
    let token: string
    let refreshToken: string | undefined
    
    if (response.data.token) {
      // Direct format: { token } or { token, refreshToken }
      token = response.data.token
      refreshToken = response.data.refreshToken
    } else if (response.data.data && response.data.data.token) {
      // Wrapped format: { data: { token, ... } }
      token = response.data.data.token
      refreshToken = response.data.data.refreshToken
    } else {
      throw new Error('Invalid login response format - no token found')
    }
    
    console.log('Extracted token:', token.substring(0, 20) + '...')
    
    // Decode JWT to extract user data
    const user = decodeJwt(token)
    
    // Store tokens
    apiClient.setAuth(token, refreshToken || '')
    
    // Store user data
    localStorage.setItem('user', JSON.stringify(user))
    
    const loginData: LoginResponse = {
      token,
      refreshToken,
      user,
    }
    
    console.log('Parsed login data:', loginData)
    
    return loginData
  },

  /**
   * Logout current user
   */
  async logout(): Promise<void> {
    try {
      await apiClient.post('/account/logout')
    } catch (error) {
      // Even if API call fails, clear local auth
      console.error('Logout API error:', error)
    } finally {
      apiClient.logout()
      localStorage.removeItem('user')
    }
  },

  /**
   * Get current user info from API
   */
  async getCurrentUserFromApi(): Promise<User> {
    const response = await apiClient.get<User>('/account/me')
    
    // Update localStorage
    localStorage.setItem('user', JSON.stringify(response.data))
    
    return response.data
  },

  /**
   * Get current user from localStorage
   */
  getCurrentUser(): User | null {
    const userJson = localStorage.getItem('user')
    if (!userJson) return null
    
    try {
      return JSON.parse(userJson) as User
    } catch {
      return null
    }
  },

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return apiClient.isAuthenticated() && !!this.getCurrentUser()
  },

  /**
   * Refresh auth token
   */
  async refreshToken(): Promise<string> {
    const refreshToken = localStorage.getItem('refresh_token')
    if (!refreshToken) {
      throw new Error('No refresh token available')
    }

    const response = await apiClient.post<{ token: string; refreshToken: string }>(
      '/account/refresh',
      { refreshToken }
    )

    apiClient.setAuth(response.data.token, response.data.refreshToken)
    return response.data.token
  },
}

export default authService
