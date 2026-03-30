<template>
  <div class="login-view">
    <div class="login-container">
      <div class="login-header">
        <h1 class="login-title">MediStore Admin</h1>
        <p class="login-subtitle">{{ t('login.subtitle') }}</p>
      </div>

      <form @submit.prevent="handleLogin" class="login-form">
        <div class="form-group">
          <label for="login" class="form-label">{{ t('login.labels.login') }}</label>
          <input
            id="login"
            v-model="credentials.login"
            type="text"
            class="form-input"
            :class="{ 'input-error': errorMessage }"
            :placeholder="t('login.placeholders.login')"
            required
            autocomplete="username"
            @input="clearError"
          />
        </div>

        <div class="form-group">
          <label for="password" class="form-label">{{ t('login.labels.password') }}</label>
          <input
            id="password"
            v-model="credentials.password"
            type="password"
            class="form-input"
            :class="{ 'input-error': errorMessage }"
            :placeholder="t('login.placeholders.password')"
            required
            autocomplete="current-password"
            @input="clearError"
          />
        </div>

        <Transition name="fade">
          <div v-if="errorMessage" class="error-message">
            <svg class="error-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <span>{{ errorMessage }}</span>
          </div>
        </Transition>

        <button type="submit" class="login-btn" :disabled="isLoading">
          <span v-if="isLoading" class="spinner"></span>
          {{ isLoading ? t('login.button.signingIn') : t('login.button.signIn') }}
        </button>
      </form>
      
      <p class="login-footer">
        {{ t('login.footer') }}
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, nextTick } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const { t } = useI18n()

const credentials = reactive({
  login: '',
  password: '',
})

const errorMessage = ref<string | null>(null)
const isLoading = ref(false)

function clearError() {
  errorMessage.value = null
  authStore.clearError()
}

async function handleLogin() {
  // Clear previous error
  clearError()
  isLoading.value = true
  
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
    
    // Set error message for display
    if (error.response?.status === 401) {
      errorMessage.value = t('login.errors.invalidCredentials')
    } else if (error.response?.status === 403) {
      errorMessage.value = t('login.errors.forbidden')
    } else if (error.message) {
      errorMessage.value = error.message
    } else {
      errorMessage.value = t('login.errors.default')
    }
  } finally {
    isLoading.value = false
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
  border: 2px solid transparent;
  border-radius: var(--radius-md);
  font-size: 0.875rem;
  color: var(--color-on-surface);
  transition: all var(--transition-normal);
}

.form-input:focus {
  background-color: var(--color-surface-container-lowest);
  border-color: var(--color-primary);
  outline: none;
}

.form-input.input-error {
  border-color: var(--color-error);
  background-color: rgba(254, 137, 131, 0.05);
}

.form-input::placeholder {
  color: var(--color-outline);
}

.error-message {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
  padding: var(--spacing-3) var(--spacing-4);
  background-color: rgba(159, 64, 61, 0.1);
  color: var(--color-error);
  border-radius: var(--radius-md);
  font-size: 0.875rem;
  border: 1px solid rgba(159, 64, 61, 0.2);
}

.error-icon {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
}

.login-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-2);
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
  opacity: 0.7;
  cursor: not-allowed;
  transform: none;
}

.spinner {
  width: 18px;
  height: 18px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.login-footer {
  text-align: center;
  margin-top: var(--spacing-6);
  color: var(--color-outline);
  font-size: 0.75rem;
}

/* Transitions */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>
