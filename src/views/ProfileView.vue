<template>
  <MainLayout>
    <div class="page">
      <h1>{{ t('pages.profileTitle') }}</h1>

      <p v-if="loading" class="loading">{{ t('messages.loadingDetails') }}</p>
      <p v-else-if="error" class="error">{{ error }}</p>
      <p v-if="successMessage" class="success">{{ successMessage }}</p>

      <template v-else>
        <p v-if="!user" class="empty">{{ t('pages.noData') }}</p>

        <section v-else class="card">
          <h2>{{ t('fields.general') }}</h2>
          <dl class="details-list">
            <div class="row"><dt>{{ t('fields.id') }}</dt><dd>{{ text(user.id) }}</dd></div>
            <div class="row"><dt>{{ t('fields.username') }}</dt><dd>{{ text(user.username) }}</dd></div>
            <div class="row"><dt>{{ t('fields.roles') }}</dt><dd>{{ roleText(user.role) }}</dd></div>
          </dl>
          <div class="actions-section">
            <button class="btn btn-primary" @click="openPasswordModal">{{ t('pages.changeOwnPassword') }}</button>
          </div>
        </section>
      </template>

      <!-- Password modal -->
      <div v-if="showPasswordModal" class="modal-overlay">
        <div class="modal">
          <h3>{{ t('pages.changeOwnPassword') }}</h3>
          <div class="modal-form">
            <label class="field">
              <span>{{ t('pages.currentPassword') }} *</span>
              <input v-model="passwordForm.currentPassword" type="password" class="input" />
            </label>
            <label class="field">
              <span>{{ t('pages.newPassword') }} *</span>
              <input v-model="passwordForm.newPassword" type="password" class="input" />
            </label>
            <p v-if="passwordError" class="error">{{ passwordError }}</p>
          </div>
          <div class="modal-actions">
            <button class="btn btn-secondary" @click="closePasswordModal">{{ t('actions.cancel') }}</button>
            <button class="btn" :disabled="processingPassword" @click="changePassword">
              {{ processingPassword ? t('messages.saving') : t('actions.save') }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </MainLayout>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import MainLayout from '@/components/layout/MainLayout.vue'
import authService from '@/services/endpoints/auth'
import usersService from '@/services/endpoints/users'
import type { User } from '@/types'

const { t } = useI18n()
const loading = ref(false)
const error = ref('')
const successMessage = ref('')
const user = ref<User | null>(null)
const processingPassword = ref(false)
const passwordError = ref('')

const showPasswordModal = ref(false)

const passwordForm = ref({
  currentPassword: '',
  newPassword: '',
})

function text(value: unknown): string {
  if (value === null || value === undefined) return '-'
  if (typeof value === 'string') return value.trim() || '-'
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  return '-'
}

function roleText(value: unknown): string {
  if (Array.isArray(value)) {
    const parts = value.map((v) => text(v)).filter((v) => v !== '-')
    return parts.length ? parts.join(', ') : '-'
  }
  return text(value)
}

function openPasswordModal(): void {
  passwordForm.value = { currentPassword: '', newPassword: '' }
  passwordError.value = ''
  showPasswordModal.value = true
}

function closePasswordModal(): void {
  showPasswordModal.value = false
  passwordForm.value = { currentPassword: '', newPassword: '' }
  passwordError.value = ''
}

async function changePassword(): Promise<void> {
  if (!passwordForm.value.currentPassword || !passwordForm.value.newPassword) {
    passwordError.value = t('messages.required', { field: t('fields.password') })
    return
  }

  processingPassword.value = true
  passwordError.value = ''
  successMessage.value = ''
  error.value = ''

  try {
    await usersService.changePassword({
      currentPassword: passwordForm.value.currentPassword,
      newPassword: passwordForm.value.newPassword,
    })
    successMessage.value = t('messages.passwordUpdated')
    closePasswordModal()
  } catch (e: any) {
    passwordError.value = e?.message || t('pages.requestFailed')
  } finally {
    processingPassword.value = false
  }
}

async function load(): Promise<void> {
  loading.value = true
  error.value = ''
  successMessage.value = ''
  try {
    const response = await authService.getMe()
    user.value = response
  } catch (e: any) {
    error.value = e?.message || t('pages.requestFailed')
    user.value = null
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>

<style scoped>
.page { max-width: 1400px; }
.loading,.empty { color: var(--color-on-surface-variant); margin-top: 1rem; }
.error { color: var(--color-error); margin-top: 1rem; margin-bottom: .75rem; }
.success { color: #0f8b4c; margin-top: .5rem; }
.card { margin-top: 1rem; background: var(--color-surface-container-lowest); border-radius: .75rem; padding: 1rem; }
.card h2 { margin: 0 0 .75rem; font-size: 1.05rem; }
.details-list { margin: 0; }
.row { display: grid; grid-template-columns: 160px 1fr; gap: .75rem; padding: .45rem 0; }
dt { color: var(--color-on-surface-variant); }
dd { margin: 0; }

.actions-section {
  margin-top: 1.5rem;
  padding-top: 1rem;
  border-top: 1px solid rgba(0, 0, 0, 0.06);
  display: flex;
  gap: .75rem;
  flex-wrap: wrap;
}

.btn {
  padding: .5rem .75rem;
  border: none;
  border-radius: .375rem;
  background: var(--color-primary);
  color: var(--color-on-primary);
  cursor: pointer;
  font-size: .9rem;
}

.btn:disabled { opacity: .6; cursor: not-allowed; }
.btn-secondary { background: var(--color-surface-container); color: var(--color-on-surface); }
.btn-primary { background: var(--color-primary); color: var(--color-on-primary); }

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  width: min(520px, 92vw);
  background: var(--color-surface-container-lowest);
  border-radius: .75rem;
  padding: 1.5rem;
}

.modal h3 {
  margin: 0 0 1rem;
  font-size: 1.1rem;
}

.modal-form {
  display: flex;
  flex-direction: column;
  gap: .75rem;
  margin-bottom: 1rem;
}

.field {
  display: flex;
  flex-direction: column;
  gap: .35rem;
}

.field span {
  font-size: .875rem;
  color: var(--color-on-surface);
  font-weight: 500;
}

.input {
  padding: .5rem .75rem;
  border-radius: .375rem;
  border: 1px solid var(--color-outline-variant);
  background: var(--color-surface-container-lowest);
  color: var(--color-on-surface);
  font-family: inherit;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: .5rem;
}
</style>
