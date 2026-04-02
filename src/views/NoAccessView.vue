<template>
  <div class="no-access-view">
    <div class="card">
      <h1>{{ t('pages.noAccessTitle') }}</h1>
      <p class="message">{{ t('pages.noAccessText') }}</p>
      <p class="hint">{{ t('pages.noAccessHint') }}</p>
      <button class="btn" :disabled="loading" @click="handleLogout">
        {{ t('common.logout') }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()
const { t } = useI18n()
const loading = ref(false)

async function handleLogout(): Promise<void> {
  loading.value = true
  try {
    await authStore.logout()
    await router.replace({ name: 'login' })
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.no-access-view {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-background);
  padding: 1rem;
}

.card {
  width: min(520px, 100%);
  background: var(--color-surface-container-lowest);
  border-radius: 1rem;
  padding: 2rem;
  box-shadow: var(--shadow-xl);
}

h1 {
  margin: 0 0 1rem;
  font-family: var(--font-headline);
  font-size: 1.8rem;
  color: var(--color-on-surface);
}

.message {
  margin: 0 0 .75rem;
  color: var(--color-on-surface);
  font-size: 1rem;
}

.hint {
  margin: 0 0 1.5rem;
  color: var(--color-on-surface-variant);
}

.btn {
  padding: .75rem 1rem;
  border: none;
  border-radius: .5rem;
  background: var(--color-primary);
  color: var(--color-on-primary);
  cursor: pointer;
}

.btn:disabled {
  opacity: .6;
  cursor: not-allowed;
}
</style>
