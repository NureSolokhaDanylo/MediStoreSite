import { i18n } from '@/i18n'
import { accountApi } from '../api/sdk'
import { getStoredUser, isSessionActive, setStoredSession, setStoredUser, clearStoredSession } from '../api/session'
import { wrapApiCall } from '../api/errors'
import type { LoginRequest, LoginResponse, User } from '@/types'
import { decodeToken, ClaimTypes } from '@/utils/jwt'

/**
 * Extract user data from JWT payload
 */
function extractUserFromToken(token: string): User {
  const payload = decodeToken(token)
  
  const roles = payload[ClaimTypes.Role]
  const login = (payload[ClaimTypes.Name] as string) || ''
  const roleList = Array.isArray(roles) ? (roles as string[]) : (roles ? [roles as string] : [])
  
  return {
    id: (payload[ClaimTypes.NameIdentifier] as string) || payload.sub || '',
    login,
    username: login,
    userName: login,
    email: (payload[ClaimTypes.Email] as string) || '',
    firstName: (payload[ClaimTypes.GivenName] as string) || '',
    lastName: (payload[ClaimTypes.Surname] as string) || '',
    roles: roleList,
    role: roleList,
  }
}

function mapCurrentUser(user: { id: string; login?: string | null; roles?: string[] }): User {
  const login = user.login || ''

  return {
    id: user.id,
    login,
    username: login,
    userName: login,
    roles: Array.isArray(user.roles) ? user.roles : [],
    role: Array.isArray(user.roles) ? user.roles : [],
  }
}

export const authService = {
  /**
   * Wrapper for `accountLogin` (`POST /api/v1/account/login`).
   * Required roles: not specified in OpenAPI.
   * Throws `AppApiError` with codes: auth.invalid_credentials.
   */
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await wrapApiCall(() =>
      accountApi.accountLogin({
        loginRequestDto: credentials,
      }),
    )

    const token = response.token
    if (!token) {
      throw new Error(i18n.global.t('login.errors.invalidResponse'))
    }

    const user = extractUserFromToken(token)

    setStoredSession({
      accessToken: token,
      user,
    })

    const loginData: LoginResponse = {
      token,
      user,
    }

    return loginData
  },

  /**
   * Logout current user
   */
  async logout(): Promise<void> {
    clearStoredSession()
  },

  /**
   * Wrapper for `accountMe` (`GET /api/v1/account/me`).
   * Required roles: not specified in OpenAPI.
   * Throws `AppApiError` with codes: auth.unauthorized.
   */
  async getCurrentUserFromApi(): Promise<User> {
    const response = await wrapApiCall(() => accountApi.accountMe())
    const user = mapCurrentUser(response)
    setStoredUser(user)
    return user
  },

  /**
   * Get current user profile from API (alias for getCurrentUserFromApi)
   */
  async getMe(): Promise<User> {
    return this.getCurrentUserFromApi()
  },

  /**
   * Get current user from localStorage
   */
  getCurrentUser(): User | null {
    return getStoredUser()
  },

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return isSessionActive() && !!this.getCurrentUser()
  },
}

export default authService
