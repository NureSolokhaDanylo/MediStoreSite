import { i18n } from '@/i18n'
import apiClient from '../api/client'
import type { LoginRequest, LoginResponse, User } from '@/types'
import { decodeToken, ClaimTypes, isAdmin as checkIsAdmin } from '@/utils/jwt'

/**
 * Extract user data from JWT payload
 */
function extractUserFromToken(token: string): User {
  const payload = decodeToken(token)
  
  const roles = payload[ClaimTypes.Role]
  
  return {
    id: (payload[ClaimTypes.NameIdentifier] as string) || payload.sub || '',
    username: (payload[ClaimTypes.Name] as string) || '',
    email: (payload[ClaimTypes.Email] as string) || '',
    firstName: (payload[ClaimTypes.GivenName] as string) || '',
    lastName: (payload[ClaimTypes.Surname] as string) || '',
    role: (roles as string | string[]) || 'User',
  }
}

export const authService = {
  /**
   * Login user with credentials
   * Only Admin role is allowed to access admin panel
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
      throw new Error(i18n.global.t('login.errors.invalidResponse'))
    }
    
    console.log('Extracted token:', token.substring(0, 20) + '...')
    
    // Check if user has Admin role BEFORE storing anything
    if (!checkIsAdmin(token)) {
      console.warn('Login rejected: user does not have Admin role')
      throw new Error(i18n.global.t('login.errors.adminOnly'))
    }
    
    // Decode JWT to extract user data
    const user = extractUserFromToken(token)
    console.log('Extracted user from JWT:', user)
    
    // Store tokens (only after admin check passed)
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
