<template>
  <RouterView v-slot="{ Component }">
    <component :is="Component" />
  </RouterView>
</template>

<script setup lang="ts">
import { onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

onMounted(() => {
  // Initialize auth state on app mount
  authStore.initializeAuth()
  console.log('App mounted, auth initialized:', {
    isAuthenticated: authStore.isAuthenticated,
    user: authStore.user
  })
})

// Watch for auth changes and log them
watch(() => authStore.isAuthenticated, (newValue, oldValue) => {
  console.log('Auth state changed:', { from: oldValue, to: newValue })
})
</script>
