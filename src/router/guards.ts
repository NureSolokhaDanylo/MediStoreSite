import type { Router, NavigationGuardNext, RouteLocationNormalized } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

export function setupRouterGuards(router: Router) {
  // Global before guard for authentication
  router.beforeEach((to: RouteLocationNormalized, from: RouteLocationNormalized, next: NavigationGuardNext) => {
    const authStore = useAuthStore()
    
    // Initialize auth on first navigation if not already done
    if (!authStore.user && !authStore.isAuthenticated) {
      authStore.initializeAuth()
    }

    const requiresAuth = to.meta.requiresAuth !== false // Default to true
    const allowedRoles = Array.isArray(to.meta.allowedRoles)
      ? (to.meta.allowedRoles as string[])
      : []
    const isAuthenticated = authStore.isAuthenticated

    console.log('Navigation:', { 
      to: to.name, 
      from: from.name, 
      isAuthenticated, 
      requiresAuth,
      user: authStore.user 
    })

    // Allow access to login page without auth
    if (to.name === 'login') {
      if (isAuthenticated) {
        if (!authStore.hasActiveRole) {
          console.log('Authenticated without active roles, redirecting to no-access')
          next({ name: 'no-access' })
        } else {
          // Redirect to medicines if already logged in
          console.log('Already authenticated, redirecting to medicines')
          next({ name: 'medicines' })
        }
      } else {
        next()
      }
      return
    }

    // Check authentication requirement
    if (requiresAuth && !isAuthenticated) {
      console.log('Not authenticated, redirecting to login')
      next({ name: 'login', query: { redirect: to.fullPath } })
      return
    }

    if (isAuthenticated && !authStore.hasActiveRole) {
      if (to.name !== 'no-access') {
        console.warn(`User without active roles attempted to access route: ${to.path}`)
        next({ name: 'no-access' })
      } else {
        next()
      }
      return
    }

    if (to.name === 'no-access' && authStore.hasActiveRole) {
      next({ name: 'medicines' })
      return
    }

    if (allowedRoles.length > 0 && !authStore.hasAnyRole(allowedRoles)) {
      console.warn(`User attempted to access restricted route: ${to.path}`)
      next({ name: 'medicines' })
      return
    }

    // Allow navigation
    next()
  })

  // Global after hook for tracking
  router.afterEach((to: RouteLocationNormalized) => {
    // Update document title
    const baseTitle = 'MediStore Panel'
    document.title = to.meta.title ? `${to.meta.title} | ${baseTitle}` : baseTitle
  })
}
