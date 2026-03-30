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
    const requiresAdmin = to.meta.requiresAdmin === true
    const isAuthenticated = authStore.isAuthenticated
    const isAdmin = authStore.isAdmin

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
        // Redirect to medicines if already logged in
        console.log('Already authenticated, redirecting to medicines')
        next({ name: 'medicines' })
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

    // Check admin requirement
    if (requiresAdmin && !isAdmin) {
      console.warn(`User attempted to access admin route: ${to.path}`)
      next({ name: 'medicines' })
      return
    }

    // Allow navigation
    next()
  })

  // Global after hook for tracking
  router.afterEach((to: RouteLocationNormalized) => {
    // Update document title
    const baseTitle = 'MediStore Admin'
    document.title = to.meta.title ? `${to.meta.title} | ${baseTitle}` : baseTitle
  })
}
