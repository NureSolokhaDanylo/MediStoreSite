import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authService } from '@/services/endpoints/auth'
import type { User, LoginRequest } from '@/types'

export const useAuthStore = defineStore('auth', () => {
  // State
  const user = ref<User | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Getters
  const isAuthenticated = computed(() => !!user.value)
  const isAdmin = computed(() => {
    if (!user.value) return false
    const role = user.value.role
    if (Array.isArray(role)) {
      return role.includes('Admin')
    }
    return role === 'Admin' || role === 'admin'
  })
  const fullName = computed(() => 
    user.value ? `${user.value.firstName || user.value.username} ${user.value.lastName || ''}`.trim() : ''
  )

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
      user.value = authService.getCurrentUser()
    }
  }

  function clearError() {
    error.value = null
  }

  return {
    // State
    user,
    loading,
    error,
    
    // Getters
    isAuthenticated,
    isAdmin,
    fullName,
    
    // Actions
    login,
    logout,
    initializeAuth,
    clearError,
  }
})
