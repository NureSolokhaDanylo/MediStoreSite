<template>
  <MainLayout>
    <div class="page">
      <h1>{{ pageTitle }}</h1>

      <p v-if="loading" class="loading">{{ t('messages.loadingDetails') }}</p>
      <p v-else-if="error" class="error">{{ error }}</p>
      <p v-if="successMessage" class="success">{{ successMessage }}</p>

      <template v-else>
        <p v-if="!user" class="empty">{{ t('pages.noData') }}</p>

        <section v-else class="card">
          <h2>{{ t('fields.general') }}</h2>
          <dl class="details-list">
            <div class="row"><dt>{{ t('fields.id') }}</dt><dd>{{ text(user.id) }}</dd></div>
            <div class="row"><dt>{{ t('fields.username') }}</dt><dd>{{ text(user.userName ?? user.username) }}</dd></div>
            <div class="row"><dt>{{ t('fields.roles') }}</dt><dd>{{ roleText(user.roles ?? user.role) }}</dd></div>
          </dl>
          <div v-if="canManageCurrentUser || isSelf" class="actions-section">
            <button v-if="isSelf" class="btn btn-primary" @click="openPasswordModal">{{ t('pages.changeOwnPassword') }}</button>
            <button v-if="canManageCurrentUser" class="btn btn-primary" @click="openRolesModal">{{ t('pages.saveRoles') }}</button>
            <button v-if="canManageCurrentUser" class="btn btn-primary" @click="openPasswordModal">{{ t('pages.savePassword') }}</button>
            <button v-if="canManageCurrentUser" class="btn btn-danger" @click="confirmDelete">{{ t('actions.delete') }}</button>
          </div>
        </section>
      </template>

      <!-- Roles modal -->
      <div v-if="showRolesModal && canManageCurrentUser" class="modal-overlay">
        <div class="modal">
          <h3>{{ t('pages.saveRoles') }}: {{ text(user?.userName ?? user?.username) }}</h3>
          <div class="field">
            <label><input type="checkbox" v-model="rolesForm.observer" /> observer</label>
            <label><input type="checkbox" v-model="rolesForm.operator" /> operator</label>
          </div>
          <div class="modal-actions">
            <button class="btn btn-secondary" @click="showRolesModal = false">{{ t('actions.cancel') }}</button>
            <button class="btn" :disabled="processingAction" @click="saveRoles">{{ t('pages.saveRoles') }}</button>
          </div>
        </div>
      </div>

      <!-- Password modal -->
      <div v-if="showPasswordModal" class="modal-overlay">
        <div class="modal">
          <h3>{{ isSelf ? t('pages.changeOwnPassword') : t('pages.savePassword') }}: {{ text(user?.userName ?? user?.username) }}</h3>
          <label v-if="isSelf" class="field">{{ t('pages.currentPassword') }} <input v-model="passwordForm.currentPassword" type="password" class="input" /></label>
          <label class="field">{{ t('pages.newPassword') }} <input v-model="passwordForm.newPassword" type="password" class="input" /></label>
          <div class="modal-actions">
            <button class="btn btn-secondary" @click="showPasswordModal = false">{{ t('actions.cancel') }}</button>
            <button class="btn" :disabled="processingAction" @click="savePassword">{{ isSelf ? t('pages.changeOwnPassword') : t('pages.savePassword') }}</button>
          </div>
        </div>
      </div>

      <!-- Delete confirmation modal -->
      <div v-if="showDeleteModal && canManageCurrentUser" class="modal-overlay">
        <div class="modal">
          <h3>{{ t('actions.delete') }} {{ t('entities.user') }}</h3>
          <p>{{ t('messages.deleteConfirmation', { name: text(user?.userName ?? user?.username) }) }}</p>
          <div class="modal-actions">
            <button class="btn btn-secondary" @click="showDeleteModal = false">{{ t('actions.cancel') }}</button>
            <button class="btn btn-danger" :disabled="processingAction" @click="deleteUser">{{ t('actions.delete') }}</button>
          </div>
        </div>
      </div>
    </div>
  </MainLayout>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import MainLayout from '@/components/layout/MainLayout.vue'
import usersService from '@/services/endpoints/users'
import { useAuthStore } from '@/stores/auth'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const loading = ref(false)
const error = ref('')
const successMessage = ref('')
const user = ref<Record<string, unknown> | null>(null)
const processingAction = ref(false)

const showRolesModal = ref(false)
const showPasswordModal = ref(false)
const showDeleteModal = ref(false)

const rolesForm = ref({
  observer: false,
  operator: false,
})

const passwordForm = ref({
  currentPassword: '',
  newPassword: '',
})

const pageTitle = computed(() => (route.name === 'profile' ? t('pages.profileTitle') : t('pages.userDetailsTitle')))
const isSelf = computed(() => {
  if (!user.value) return false
  return String(authStore.user?.id || '') === String(user.value.id)
})
const canManageCurrentUser = computed(() => authStore.canManageUsers && !isSelf.value)

function parseId(value: unknown): string | null {
  const raw = Array.isArray(value) ? value[0] : value
  return typeof raw === 'string' && raw.trim() ? raw : null
}

function resolveTargetUserId(): string | null {
  if (route.name === 'profile') {
    return authStore.user?.id ? String(authStore.user.id) : null
  }
  return parseId(route.params.id)
}

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

function extractRolesArray(value: string): string[] {
  return value
    .split(',')
    .map((part) => part.trim().toLowerCase())
    .filter(Boolean)
}

function openRolesModal(): void {
  if (!user.value) return
  const roles = extractRolesArray(roleText(user.value.roles ?? user.value.role))
  rolesForm.value = {
    observer: roles.includes('observer'),
    operator: roles.includes('operator'),
  }
  showRolesModal.value = true
}

function openPasswordModal(): void {
  if (!user.value) return
  passwordForm.value = { currentPassword: '', newPassword: '' }
  showPasswordModal.value = true
}

function confirmDelete(): void {
  if (!user.value) return
  showDeleteModal.value = true
}

async function saveRoles(): Promise<void> {
  if (!user.value || !canManageCurrentUser.value) return
  processingAction.value = true
  error.value = ''
  successMessage.value = ''
  try {
    const roles: string[] = []
    if (rolesForm.value.observer) roles.push('Observer')
    if (rolesForm.value.operator) roles.push('Operator')
    await usersService.changeRoles({
      targetUserId: String(user.value.id),
      roles,
    })
    successMessage.value = t('messages.rolesUpdated')
    showRolesModal.value = false
    await load()
  } catch (e: any) {
    error.value = e?.message || t('pages.requestFailed')
  } finally {
    processingAction.value = false
  }
}

async function savePassword(): Promise<void> {
  if (!user.value || !passwordForm.value.newPassword) return
  processingAction.value = true
  error.value = ''
  successMessage.value = ''
  if (isSelf.value && !passwordForm.value.currentPassword) {
    error.value = t('messages.required', { field: t('pages.currentPassword') })
    processingAction.value = false
    return
  }
  try {
    const payload = isSelf.value
      ? {
          currentPassword: passwordForm.value.currentPassword || undefined,
          newPassword: passwordForm.value.newPassword,
        }
      : {
          targetUserId: String(user.value.id),
          newPassword: passwordForm.value.newPassword,
        }
    await usersService.changePassword(payload)
    successMessage.value = t('messages.passwordUpdated')
    showPasswordModal.value = false
  } catch (e: any) {
    error.value = e?.message || t('pages.requestFailed')
  } finally {
    processingAction.value = false
  }
}

async function deleteUser(): Promise<void> {
  if (!user.value || !canManageCurrentUser.value) return
  processingAction.value = true
  error.value = ''
  successMessage.value = ''
  try {
    await usersService.deleteById(String(user.value.id))
    successMessage.value = t('messages.userDeleted')
    showDeleteModal.value = false
    setTimeout(() => {
      router.push({ name: 'users' })
    }, 1000)
  } catch (e: any) {
    error.value = e?.message || t('pages.requestFailed')
    showDeleteModal.value = false
  } finally {
    processingAction.value = false
  }
}

async function load(): Promise<void> {
  const id = resolveTargetUserId()
  if (!id) {
    error.value = t('pages.requestFailed')
    user.value = null
    return
  }
  loading.value = true
  error.value = ''
  successMessage.value = ''
  try {
    const response = await usersService.getById(id)
    user.value = response as Record<string, unknown>
  } catch (e: any) {
    error.value = e?.message || t('pages.requestFailed')
    user.value = null
  } finally {
    loading.value = false
  }
}

watch(() => route.params.id, load)
onMounted(load)
</script>

<style scoped>
.page { max-width: 1400px; }
.loading,.empty { color: var(--color-on-surface-variant); margin-top: 1rem; }
.error { color: var(--color-error); margin-top: 1rem; }
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
.btn-danger { background: #b42318; color: white; }

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

.modal p {
  margin: 0 0 1.5rem;
  color: var(--color-on-surface-variant);
}

.field {
  display: flex;
  flex-direction: column;
  gap: .5rem;
  margin-bottom: .75rem;
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
