<template>
  <div style="padding: 2rem;">
    <h1>Auth Debug Page</h1>
    
    <div style="background: #f0f0f0; padding: 1rem; margin: 1rem 0; border-radius: 8px;">
      <h3>Auth Store State:</h3>
      <pre>{{ JSON.stringify({
        isAuthenticated: authStore.isAuthenticated,
        user: authStore.user,
        loading: authStore.loading,
        error: authStore.error
      }, null, 2) }}</pre>
    </div>

    <div style="background: #f0f0f0; padding: 1rem; margin: 1rem 0; border-radius: 8px;">
      <h3>LocalStorage:</h3>
      <pre>{{ JSON.stringify({
        access_token: getLocalStorageValue('access_token'),
        refresh_token: getLocalStorageValue('refresh_token'),
        user: getUserFromStorage()
      }, null, 2) }}</pre>
    </div>

    <button @click="goToDashboard" style="padding: 0.5rem 1rem; margin-right: 1rem;">
      Go to Dashboard
    </button>

    <button @click="logout" style="padding: 0.5rem 1rem;">
      Logout
    </button>
  </div>
</template>

<script setup lang="ts">
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'

const authStore = useAuthStore()
const router = useRouter()

function goToDashboard() {
  router.push('/')
}

function logout() {
  authStore.logout()
  router.push('/login')
}

function getLocalStorageValue(key: string): string {
  return window.localStorage.getItem(key)?.substring(0, 20) + '...' || 'null'
}

function getUserFromStorage(): string {
  return window.localStorage.getItem('user') || 'null'
}
</script>
