import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authService } from '@/services/endpoints/auth'
import type { User, LoginRequest } from '@/types'
import * as jwt from '@/utils/jwt'

type Capability =
  | 'alerts.report'
  | 'batches.manage'
  | 'logs.view'
  | 'medicines.manage'
  | 'sensors.manage'
  | 'settings.manage'
  | 'settings.view'
  | 'users.manage'
  | 'zones.manage'

const ROLE_CAPABILITIES: Record<string, Capability[]> = {
  admin: [
    'alerts.report',
    'logs.view',
    'medicines.manage',
    'sensors.manage',
    'settings.manage',
    'settings.view',
    'users.manage',
    'zones.manage',
  ],
  observer: [
    'alerts.report',
  ],
  operator: [
    'batches.manage',
    'settings.view',
  ],
}

export const useAuthStore = defineStore('auth', () => {
  // State
  const user = ref<User | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Getters
  const isAuthenticated = computed(() => !!user.value)
  const normalizedRoles = computed(() => {
    if (!user.value) return [] as string[]
    const sourceRoles = user.value.roles ?? user.value.role ?? []
    const rawRoles = Array.isArray(sourceRoles) ? sourceRoles : [sourceRoles]
    return rawRoles
      .map((role) => String(role || '').trim().toLowerCase())
      .filter(Boolean)
  })
  const isAdmin = computed(() => normalizedRoles.value.includes('admin'))
  const isOperator = computed(() => normalizedRoles.value.includes('operator'))
  const isObserver = computed(() => normalizedRoles.value.includes('observer'))
  const capabilitySet = computed(() => {
    const capabilities = new Set<Capability>()

    for (const role of normalizedRoles.value) {
      for (const capability of ROLE_CAPABILITIES[role] ?? []) {
        capabilities.add(capability)
      }
    }

    return capabilities
  })
  const fullName = computed(() => 
    user.value
      ? `${user.value.firstName || user.value.login || user.value.username || ''} ${user.value.lastName || ''}`.trim()
      : ''
  )
  const roles = computed(() => {
    if (!user.value) return []
    const sourceRoles = user.value.roles ?? user.value.role ?? []
    return Array.isArray(sourceRoles) ? sourceRoles : [sourceRoles]
  })
  
  // Token info getters
  const tokenInfo = computed(() => {
    const token = jwt.getStoredToken()
    if (!token) return null
    try {
      return jwt.getTokenInfo(token)
    } catch {
      return null
    }
  })
  const tokenExpiresAt = computed(() => tokenInfo.value?.expiresAt || null)
  const tokenExpiresIn = computed(() => {
    const token = jwt.getStoredToken()
    if (!token) return null
    return jwt.getTimeUntilExpiry(token)
  })
  const isTokenValid = computed(() => jwt.hasValidStoredToken())
  const canManageMedicines = computed(() => capabilitySet.value.has('medicines.manage'))
  const canManageZones = computed(() => capabilitySet.value.has('zones.manage'))
  const canManageSensors = computed(() => capabilitySet.value.has('sensors.manage'))
  const canManageUsers = computed(() => capabilitySet.value.has('users.manage'))
  const canViewLogs = computed(() => capabilitySet.value.has('logs.view'))
  const canViewSettings = computed(() => capabilitySet.value.has('settings.view'))
  const canManageSettings = computed(() => capabilitySet.value.has('settings.manage'))
  const canManageBatches = computed(() => capabilitySet.value.has('batches.manage'))
  const canGenerateAlertsReport = computed(() => capabilitySet.value.has('alerts.report'))
  const canChangeOwnPassword = computed(() => isAuthenticated.value)
  const hasActiveRole = computed(() => isAdmin.value || isOperator.value || isObserver.value)

  // Actions
  async function login(credentials: LoginRequest) {
    loading.value = true
    error.value = null

    try {
      const response = await authService.login(credentials)
      user.value = response.user || null
      console.log('Login successful, user set:', user.value)
      return response
    } catch (err: any) {
      error.value = err.message || 'Login failed'
      console.error('Login error:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  async function logout() {
    loading.value = true
    error.value = null

    try {
      await authService.logout()
      user.value = null
    } catch (err: any) {
      error.value = err.message || 'Logout failed'
      // Still clear user even if API fails
      user.value = null
    } finally {
      loading.value = false
    }
  }

  function initializeAuth() {
    // Try to restore user from localStorage on app startup
    if (authService.isAuthenticated()) {
      // Check if token is still valid
      if (jwt.hasValidStoredToken()) {
        user.value = authService.getCurrentUser()
        console.log('Auth initialized from localStorage:', user.value)
      } else {
        // Token expired, clear auth
        console.warn('Stored token expired, clearing auth')
        authService.logout()
        user.value = null
      }
    }
  }

  function clearError() {
    error.value = null
  }
  
  // Check if user has specific role
  function hasRole(role: string): boolean {
    return normalizedRoles.value.includes(role.toLowerCase())
  }

  function hasAnyRole(candidateRoles: string[]): boolean {
    return candidateRoles.some((role) => hasRole(role))
  }

  return {
    // State
    user,
    loading,
    error,
    
    // Getters
    isAuthenticated,
    isAdmin,
    isOperator,
    isObserver,
    fullName,
    roles,
    normalizedRoles,
    tokenInfo,
    tokenExpiresAt,
    tokenExpiresIn,
    isTokenValid,
    canManageMedicines,
    canManageZones,
    canManageSensors,
    canManageUsers,
    canViewLogs,
    canViewSettings,
    canManageSettings,
    canManageBatches,
    canGenerateAlertsReport,
    canChangeOwnPassword,
    hasActiveRole,
    
    // Actions
    login,
    logout,
    initializeAuth,
    clearError,
    hasRole,
    hasAnyRole,
  }
})
