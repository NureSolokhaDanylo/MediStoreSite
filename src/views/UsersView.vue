<template>
  <MainLayout>
    <div class="page">
      <div class="toolbar">
        <h1>{{ t('pages.usersTitle') }}</h1>
        <div class="search-controls">
          <input
            v-model.trim="query"
            class="search-input"
            placeholder="Search users..."
            @keyup.enter="applyFilters"
          />
          <input v-model.trim="role" class="search-input role-input" placeholder="Role" />
                    <select v-model.number="take" class="take-select">
            <option :value="10">10</option>
            <option :value="25">25</option>
            <option :value="50">50</option>
            <option :value="100">100</option>
          </select>
          <button class="btn" :disabled="loading" @click="applyFilters">{{ t('pages.apply') }}</button>
          <button class="btn btn-add" :disabled="loading" @click="openCreateModal">+ {{ t('entities.user') }}</button>
        </div>
      </div>

      <p v-if="loading" class="hint">{{ t('messages.loadingDetails') }}</p>
      <p v-if="error" class="error">{{ error }}</p>
      <p v-if="successMessage" class="success">{{ successMessage }}</p>

      <div class="table-wrap">
        <table class="table">
          <thead>
            <tr>
              <th>{{ t('fields.id') }}</th>
              <th>{{ t('fields.username') }}</th>
              <th>{{ t('fields.roles') }}</th>
              <th>{{ t('pages.search') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="!loading && users.length === 0">
              <td colspan="4">{{ t('pages.noData') }}</td>
            </tr>
            <tr v-for="user in users" :key="user.id">
              <td>
                <RouterLink :to="{ name: 'user-details', params: { id: user.id } }" class="entity-link">
                  {{ user.id }}
                </RouterLink>
              </td>
              <td>{{ user.username }}</td>
              <td>{{ user.roles }}</td>
              <td class="actions-cell">
                <button class="btn btn-small" :disabled="isSelf(user.id)" @click="openRolesModal(user)">{{ t('fields.roles') }}</button>
                <button class="btn btn-small" :disabled="isSelf(user.id)" @click="openPasswordModal(user)">{{ t('fields.password') }}</button>
                <button class="btn btn-danger btn-small" :disabled="isSelf(user.id)" @click="removeUser(user)">{{ t('actions.delete') }}</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="pagination">
        <button class="btn" :disabled="loading || skip === 0" @click="goPrev">{{ t('actions.prev') }}</button>
        <span class="hint">Total: {{ totalCount }} | skip {{ skip }} take {{ take }}</span>
        <button class="btn" :disabled="loading || skip + take >= totalCount" @click="goNext">{{ t('actions.next') }}</button>
      </div>

      <div v-if="showCreateModal" class="modal-overlay">
        <div class="modal">
          <h3>{{ t('pages.createUserTitle') }}</h3>
          <label class="field">{{ t('fields.username') }} <input v-model.trim="createForm.userName" class="search-input" /></label>
          <label class="field">{{ t('fields.password') }} <input v-model="createForm.password" type="password" class="search-input" /></label>
          <div class="field">
            <span>{{ t('fields.roles') }}</span>
            <label><input type="checkbox" v-model="createForm.observer" /> observer</label>
            <label><input type="checkbox" v-model="createForm.operator" /> operator</label>
          </div>
          <div class="modal-actions">
            <button class="btn" @click="showCreateModal = false">{{ t('actions.cancel') }}</button>
            <button class="btn btn-add" :disabled="processingAction" @click="createUser">{{ t('actions.create') }}</button>
          </div>
        </div>
      </div>

      <div v-if="showRolesModal && selectedUser" class="modal-overlay">
        <div class="modal">
          <h3>{{ t('pages.saveRoles') }}: {{ selectedUser.username }}</h3>
          <div class="field">
            <label><input type="checkbox" v-model="rolesForm.observer" /> observer</label>
            <label><input type="checkbox" v-model="rolesForm.operator" /> operator</label>
          </div>
          <div class="modal-actions">
            <button class="btn" @click="showRolesModal = false">{{ t('actions.cancel') }}</button>
            <button class="btn btn-add" :disabled="processingAction" @click="saveRoles">{{ t('pages.saveRoles') }}</button>
          </div>
        </div>
      </div>

      <div v-if="showPasswordModal && selectedUser" class="modal-overlay">
        <div class="modal">
          <h3>{{ t('pages.savePassword') }}: {{ selectedUser.username }}</h3>
          <label class="field">{{ t('pages.newPassword') }} <input v-model="passwordForm.newPassword" type="password" class="search-input" /></label>
          <div class="modal-actions">
            <button class="btn" @click="showPasswordModal = false">{{ t('actions.cancel') }}</button>
            <button class="btn btn-add" :disabled="processingAction" @click="savePassword">{{ t('pages.savePassword') }}</button>
          </div>
        </div>
      </div>
    </div>
  </MainLayout>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { useI18n } from 'vue-i18n'
import MainLayout from '@/components/layout/MainLayout.vue'
import usersService from '@/services/endpoints/users'
import { useAuthStore } from '@/stores/auth'

type UserRow = {
  id: string
  username: string
  roles: string
}

const { t } = useI18n()
const loading = ref(false)
const error = ref('')
const successMessage = ref('')
const query = ref('')
const role = ref('')
const users = ref<UserRow[]>([])
const skip = ref(0)
const take = ref(50)
const totalCount = ref(0)
const authStore = useAuthStore()
const processingAction = ref(false)

const showCreateModal = ref(false)
const showRolesModal = ref(false)
const showPasswordModal = ref(false)
const selectedUser = ref<UserRow | null>(null)

const createForm = ref({
  userName: '',
  password: '',
  observer: false,
  operator: false,
})

const rolesForm = ref({
  observer: false,
  operator: false,
})

const passwordForm = ref({
  newPassword: '',
})

function asRecord(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === 'object' ? (value as Record<string, unknown>) : null
}

function asArray(value: unknown): unknown[] {
  if (Array.isArray(value)) return value
  const record = asRecord(value)
  if (!record) return []

  const directCandidates = [record.items, record.users, record.data, record.result]
  for (const candidate of directCandidates) {
    if (Array.isArray(candidate)) return candidate
  }

  const nested = asRecord(record.data)
  if (Array.isArray(nested?.items)) return nested.items
  if (Array.isArray(nested?.users)) return nested.users

  return []
}

function text(value: unknown, fallback = '-'): string {
  if (typeof value === 'string') {
    const trimmed = value.trim()
    return trimmed.length > 0 ? trimmed : fallback
  }
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  return fallback
}

function roleText(value: unknown): string {
  if (Array.isArray(value)) {
    const parts = value.map((item) => text(item, '')).filter(Boolean)
    return parts.length > 0 ? parts.join(', ') : '-'
  }
  return text(value)
}

function normalizeUser(item: unknown): UserRow | null {
  const row = asRecord(item)
  if (!row) return null

  const id = row.id ?? row.userId ?? row.sub
  const username = row.userName ?? row.username ?? row.login ?? row.name
  const roles = row.roles ?? row.role

  return {
    id: text(id),
    username: text(username),
    roles: roleText(roles),
  }
}

function isSelf(userId: string): boolean {
  return String(authStore.user?.id || '') === String(userId)
}

function extractRolesArray(value: string): string[] {
  return value
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean)
}

function openCreateModal(): void {
  createForm.value = { userName: '', password: '', observer: false, operator: false }
  showCreateModal.value = true
}

function openRolesModal(user: UserRow): void {
  if (isSelf(user.id)) return
  selectedUser.value = user
  const roles = extractRolesArray(user.roles.toLowerCase())
  rolesForm.value = {
    observer: roles.includes('observer'),
    operator: roles.includes('operator'),
  }
  showRolesModal.value = true
}

function openPasswordModal(user: UserRow): void {
  if (isSelf(user.id)) return
  selectedUser.value = user
  passwordForm.value = { newPassword: '' }
  showPasswordModal.value = true
}

async function createUser(): Promise<void> {
  if (!createForm.value.userName || !createForm.value.password) return
  processingAction.value = true
  error.value = ''
  successMessage.value = ''
  try {
    const roles: string[] = []
    if (createForm.value.observer) roles.push('Observer')
    if (createForm.value.operator) roles.push('Operator')
    await usersService.create({
      userName: createForm.value.userName,
      password: createForm.value.password,
      roles,
    })
    successMessage.value = t('messages.userCreated')
    showCreateModal.value = false
    await loadUsers()
  } catch (e: any) {
    error.value = e?.message || t('pages.requestFailed')
  } finally {
    processingAction.value = false
  }
}

async function saveRoles(): Promise<void> {
  if (!selectedUser.value || isSelf(selectedUser.value.id)) return
  processingAction.value = true
  error.value = ''
  successMessage.value = ''
  try {
    const roles: string[] = []
    if (rolesForm.value.observer) roles.push('Observer')
    if (rolesForm.value.operator) roles.push('Operator')
    await usersService.changeRoles({
      targetUserId: selectedUser.value.id,
      roles,
    })
    successMessage.value = t('messages.rolesUpdated')
    showRolesModal.value = false
    await loadUsers()
  } catch (e: any) {
    error.value = e?.message || t('pages.requestFailed')
  } finally {
    processingAction.value = false
  }
}

async function savePassword(): Promise<void> {
  if (!selectedUser.value || isSelf(selectedUser.value.id)) return
  if (!passwordForm.value.newPassword) return
  processingAction.value = true
  error.value = ''
  successMessage.value = ''
  try {
    await usersService.changePassword({
      targetUserId: selectedUser.value.id,
      newPassword: passwordForm.value.newPassword,
    })
    successMessage.value = t('messages.passwordUpdated')
    showPasswordModal.value = false
  } catch (e: any) {
    error.value = e?.message || t('pages.requestFailed')
  } finally {
    processingAction.value = false
  }
}

async function removeUser(user: UserRow): Promise<void> {
  if (isSelf(user.id)) return
  processingAction.value = true
  error.value = ''
  successMessage.value = ''
  try {
    await usersService.deleteById(user.id)
    successMessage.value = t('messages.userDeleted')
    await loadUsers()
  } catch (e: any) {
    error.value = e?.message || t('pages.requestFailed')
  } finally {
    processingAction.value = false
  }
}

async function loadUsers(): Promise<void> {
  loading.value = true
  error.value = ''
  try {
    const response = await usersService.getAll({
      skip: skip.value,
      take: take.value,
      q: query.value || undefined,
      role: role.value || undefined,
    })
    const record = asRecord(response)
    totalCount.value = typeof record?.totalCount === 'number' ? record.totalCount : 0
    users.value = asArray(response)
      .map((item) => normalizeUser(item))
      .filter((item): item is UserRow => item !== null)
    if (totalCount.value === 0) totalCount.value = users.value.length
  } catch (e: any) {
    error.value = e?.message || t('pages.requestFailed')
    users.value = []
    totalCount.value = 0
  } finally {
    loading.value = false
  }
}

function applyFilters(): void {
  skip.value = 0
  loadUsers()
}

function goPrev(): void {
  if (skip.value === 0) return
  skip.value = Math.max(0, skip.value - take.value)
  loadUsers()
}

function goNext(): void {
  if (skip.value + take.value >= totalCount.value) return
  skip.value += take.value
  loadUsers()
}

onMounted(() => {
  loadUsers()
})
</script>

<style scoped>
.page { max-width: 1400px; }
.toolbar { display: flex; justify-content: space-between; align-items: center; gap: 1rem; margin-bottom: 1rem; }
.search-controls { display: flex; gap: .5rem; align-items: center; }
.search-input { padding: .5rem .75rem; border-radius: .375rem; border: 1px solid var(--color-outline-variant); min-width: 240px; }
.role-input { min-width: 120px; }
.take-select { width: 88px; padding: .5rem .65rem; border-radius: .375rem; border: 1px solid var(--color-outline-variant); background: var(--color-surface-container-lowest); color: var(--color-on-surface); }
.btn { padding: .5rem .75rem; border: none; border-radius: .375rem; background: var(--color-primary); color: var(--color-on-primary); cursor: pointer; }
.btn:disabled { opacity: .6; cursor: not-allowed; }
.hint { color: var(--color-on-surface-variant); margin-bottom: .5rem; }
.error { color: var(--color-error); margin-bottom: .75rem; }
.success { color: #0f8b4c; margin-bottom: .75rem; }
.table-wrap { overflow: auto; background: var(--color-surface-container-lowest); border-radius: .75rem; }
.table { width: 100%; border-collapse: collapse; }
.table th, .table td { padding: .75rem; text-align: left; border-bottom: 1px solid rgba(0,0,0,.06); }
.entity-link { color: var(--color-primary); text-decoration: none; }
.entity-link:hover { text-decoration: underline; }
.pagination { margin-top: .75rem; display: flex; justify-content: space-between; align-items: center; gap: .75rem; }
.btn-add { background: #0f8b4c; }
.btn-danger { background: #b42318; }
.btn-small { padding: .35rem .55rem; font-size: .8rem; }
.actions-cell { display: flex; gap: .4rem; flex-wrap: wrap; }
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
  padding: 1rem;
}
.field { display: flex; flex-direction: column; gap: .5rem; margin-bottom: .75rem; }
.modal-actions { display: flex; justify-content: flex-end; gap: .5rem; }
</style>
