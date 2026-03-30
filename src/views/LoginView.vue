<template>
  <div class="login-view">
    <div class="login-container">
      <div class="login-header">
        <h1 class="login-title">MediStore Admin</h1>
        <p class="login-subtitle">Sign in to continue</p>
      </div>

      <form @submit.prevent="handleLogin" class="login-form">
        <div class="form-group">
          <label for="login" class="form-label">Login</label>
          <input
            id="login"
            v-model="credentials.login"
            type="text"
            class="form-input"
            placeholder="admin"
            required
            autocomplete="username"
          />
        </div>

        <div class="form-group">
          <label for="password" class="form-label">Password</label>
          <input
            id="password"
            v-model="credentials.password"
            type="password"
            class="form-input"
            placeholder="••••••••"
            required
            autocomplete="current-password"
          />
        </div>

        <div v-if="authStore.error" class="error-message">
          {{ authStore.error }}
        </div>

        <button type="submit" class="login-btn" :disabled="authStore.loading">
          {{ authStore.loading ? 'Signing in...' : 'Sign In' }}
        </button>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, nextTick } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const credentials = reactive({
  login: '',
  password: '',
})

async function handleLogin() {
  try {
    console.log('Attempting login...')
    await authStore.login(credentials)
    console.log('Login completed, redirecting...')
    
    // Wait for next tick to ensure store is updated
    await nextTick()
    
    // Get redirect path from query or default to dashboard
    const redirectPath = (route.query.redirect as string) || '/'
    console.log('Navigating to:', redirectPath)
    
    // Force navigation
    await router.replace(redirectPath)
    
    // If router.replace didn't work, try window.location as fallback
    setTimeout(() => {
      if (window.location.pathname === '/login') {
        console.warn('Router navigation failed, using window.location')
        window.location.href = redirectPath
      }
    }, 100)
    
  } catch (error: any) {
    console.error('Login failed:', error)
    // Error will be shown via authStore.error
  }
}
</script>

<style scoped>
.login-view {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--color-background);
  padding: var(--spacing-4);
}

.login-container {
  background-color: var(--color-surface-container-lowest);
  border-radius: var(--radius-xl);
  padding: var(--spacing-8);
  max-width: 420px;
  width: 100%;
  box-shadow: var(--shadow-xl);
}

.login-header {
  text-align: center;
  margin-bottom: var(--spacing-8);
}

.login-title {
  font-family: var(--font-headline);
  font-size: 2rem;
  font-weight: 700;
  background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dim) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: var(--spacing-2);
}

.login-subtitle {
  color: var(--color-on-surface-variant);
  font-size: 0.875rem;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-5);
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-2);
}

.form-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-on-surface);
}

.form-input {
  padding: var(--spacing-3) var(--spacing-4);
  background-color: var(--color-surface-container-high);
  border: none;
  border-radius: var(--radius-md);
  font-size: 0.875rem;
  color: var(--color-on-surface);
  transition: all var(--transition-normal);
}

.form-input:focus {
  background-color: var(--color-surface-container-lowest);
  outline: 2px solid var(--color-primary);
  outline-offset: 0;
}

.form-input::placeholder {
  color: var(--color-outline);
}

.error-message {
  padding: var(--spacing-3);
  background-color: rgba(254, 137, 131, 0.2);
  color: var(--color-error);
  border-radius: var(--radius-md);
  font-size: 0.875rem;
  text-align: center;
}

.login-btn {
  padding: var(--spacing-4);
  background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dim) 100%);
  color: var(--color-on-primary);
  border: none;
  border-radius: var(--radius-md);
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all var(--transition-normal);
  margin-top: var(--spacing-2);
}

.login-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
}

.login-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
