<template>
  <MainLayout>
    <div class="page">
      <h1>{{ t('pages.batchDetailsTitle') }}</h1>

      <p v-if="loading" class="loading">{{ t('messages.loadingDetails') }}</p>
      <p v-else-if="error" class="error">{{ error }}</p>
      <p v-if="successMessage" class="success">{{ successMessage }}</p>

      <template v-else>
        <p v-if="!batch" class="empty">{{ t('pages.noData') }}</p>

        <div v-else class="details-grid">
          <section class="card">
            <div class="card-head">
              <h2>{{ t('fields.general') }}</h2>
              <div v-if="authStore.canManageBatches && !editing" class="actions">
                <button class="btn btn-secondary" @click="startEdit">{{ t('actions.edit') }}</button>
                <button class="btn btn-danger" :disabled="deleting" @click="startDelete">{{ t('actions.delete') }}</button>
              </div>
            </div>
            <dl v-if="!editing" class="details-list">
              <div class="row">
                <dt>{{ t('fields.id') }}</dt>
                <dd>{{ batch.id }}</dd>
              </div>
              <div class="row">
                <dt>{{ t('fields.batchNumber') }}</dt>
                <dd>{{ batch.batchNumber }}</dd>
              </div>
              <div class="row">
                <dt>{{ t('fields.quantity') }}</dt>
                <dd>{{ batch.quantity }}</dd>
              </div>
              <div class="row">
                <dt>{{ t('entities.medicine') }}</dt>
                <dd>
                  <RouterLink
                    :to="{ name: 'medicine-details', params: { id: batch.medicineId } }"
                    class="entity-link"
                  >
                    {{ medicineLabel(batch.medicineId) }}
                  </RouterLink>
                </dd>
              </div>
              <div class="row">
                <dt>{{ t('fields.zone') }}</dt>
                <dd>
                  <RouterLink :to="{ name: 'zone-details', params: { id: batch.zoneId } }" class="entity-link">
                    {{ zoneLabel(batch.zoneId) }}
                  </RouterLink>
                </dd>
              </div>
            </dl>

            <div v-else class="edit-form">
              <label class="field">
                <span>{{ t('fields.batchNumber') }}</span>
                <input v-model.trim="editForm.batchNumber" class="input" />
              </label>
              <label class="field">
                <span>{{ t('fields.quantity') }}</span>
                <input v-model.number="editForm.quantity" type="number" min="1" class="input" />
              </label>
              <label class="field">
                <span>{{ t('pages.expireDate') }}</span>
                <input v-model="editForm.expireDate" type="date" class="input" />
              </label>
              <label class="field">
                <span>{{ t('entities.medicine') }}</span>
                <select v-model.number="editForm.medicineId" class="input">
                  <option v-for="medicine in lookups.medicines" :key="medicine.id" :value="medicine.id">
                    {{ medicine.name }}
                  </option>
                </select>
              </label>
              <label class="field">
                <span>{{ t('fields.zone') }}</span>
                <select v-model.number="editForm.zoneId" class="input">
                  <option v-for="zone in lookups.zones" :key="zone.id" :value="zone.id">
                    {{ zone.name }}
                  </option>
                </select>
              </label>
              <div class="actions">
                <button class="btn btn-secondary" :disabled="saving" @click="cancelEdit">{{ t('actions.cancel') }}</button>
                <button class="btn" :disabled="saving" @click="saveEdit">{{ saving ? t('messages.saving') : t('actions.save') }}</button>
              </div>
            </div>
          </section>

          <section class="card">
            <h2>Dates</h2>
            <div class="table-wrap">
              <table class="table">
                <thead>
                  <tr>
                    <th>{{ t('fields.type') }}</th>
                    <th>{{ t('fields.value') }}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>{{ t('pages.dateAdded') }}</td>
                    <td>{{ formatDate(batch.dateAdded) }}</td>
                  </tr>
                  <tr>
                    <td>{{ t('pages.expireDate') }}</td>
                    <td>{{ formatDate(batch.expireDate) }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>
        </div>

        <div v-if="confirmingDelete" class="modal-overlay">
          <div class="modal-box">
            <h3>{{ t('actions.delete') }} {{ t('entities.batch') }}</h3>
            <p>{{ t('messages.deleteConfirmation', { name: batch?.batchNumber }) }}</p>
            <div class="actions">
              <button class="btn btn-secondary" :disabled="deleting" @click="cancelDelete">{{ t('actions.cancel') }}</button>
              <button class="btn btn-danger" :disabled="deleting" @click="confirmDelete">
                {{ deleting ? t('messages.deleting') : t('actions.delete') }}
              </button>
            </div>
          </div>
        </div>
      </template>
    </div>
  </MainLayout>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import MainLayout from '@/components/layout/MainLayout.vue'
import batchesService from '@/services/endpoints/batches'
import type { Batch } from '@/types'
import { useI18n } from 'vue-i18n'
import { useLookupsStore } from '@/stores/lookups'
import { useAuthStore } from '@/stores/auth'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const loading = ref(false)
const saving = ref(false)
const deleting = ref(false)
const error = ref('')
const successMessage = ref('')
const batch = ref<Batch | null>(null)
const lookups = useLookupsStore()
const editing = ref(false)
const confirmingDelete = ref(false)
const editForm = ref({
  batchNumber: '',
  quantity: 1,
  expireDate: '',
  medicineId: 0,
  zoneId: 0,
})

function parseRouteId(value: unknown): number | null {
  const raw = Array.isArray(value) ? value[0] : value
  if (typeof raw !== 'string' || raw.trim() === '') return null

  const id = Number(raw)
  if (!Number.isInteger(id) || id <= 0) return null

  return id
}

function formatDate(value: string): string {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString()
}

function medicineLabel(medicineId: number): string {
  return lookups.medicineNameById.get(medicineId) ?? `#${medicineId}`
}

function zoneLabel(zoneId: number): string {
  return lookups.zoneNameById.get(zoneId) ?? `#${zoneId}`
}

async function loadBatchDetails(): Promise<void> {
  const id = parseRouteId(route.params.id)
  if (id === null) {
    error.value = 'Invalid batch id'
    batch.value = null
    loading.value = false
    return
  }

  loading.value = true
  error.value = ''
  successMessage.value = ''
  batch.value = null

  try {
    batch.value = await batchesService.getById(id)
  } catch (e: any) {
    error.value = e?.message || t('pages.requestFailed')
    batch.value = null
  } finally {
    loading.value = false
  }
}

function startEdit(): void {
  if (!batch.value || !authStore.canManageBatches) return
  editForm.value = {
    batchNumber: batch.value.batchNumber,
    quantity: batch.value.quantity,
    expireDate: batch.value.expireDate ? batch.value.expireDate.slice(0, 10) : '',
    medicineId: batch.value.medicineId,
    zoneId: batch.value.zoneId,
  }
  editing.value = true
}

function cancelEdit(): void {
  editing.value = false
}

function startDelete(): void {
  if (!authStore.canManageBatches) return
  confirmingDelete.value = true
}

function cancelDelete(): void {
  confirmingDelete.value = false
}

async function saveEdit(): Promise<void> {
  if (!batch.value || !authStore.canManageBatches) return
  error.value = ''
  successMessage.value = ''
  if (!editForm.value.batchNumber.trim()) {
    error.value = t('messages.required', { field: t('fields.batchNumber') })
    return
  }
  if (!Number.isFinite(editForm.value.quantity) || editForm.value.quantity < 1) {
    error.value = t('pages.batchQuantityRequired')
    return
  }
  if (!editForm.value.expireDate) {
    error.value = t('pages.batchExpireDateRequired')
    return
  }

  saving.value = true
  try {
    await batchesService.update(batch.value.id, {
      batchNumber: editForm.value.batchNumber.trim(),
      quantity: editForm.value.quantity,
      expireDate: editForm.value.expireDate,
      medicineId: editForm.value.medicineId,
      zoneId: editForm.value.zoneId,
    })
    editing.value = false
    successMessage.value = t('messages.batchUpdated')
    await loadBatchDetails()
  } catch (e: any) {
    error.value = e?.message || t('messages.batchUpdateFailed')
  } finally {
    saving.value = false
  }
}

async function confirmDelete(): Promise<void> {
  if (!batch.value || !authStore.canManageBatches) return
  deleting.value = true
  error.value = ''
  successMessage.value = ''
  try {
    await batchesService.delete(batch.value.id)
    successMessage.value = t('messages.batchDeleted')
    confirmingDelete.value = false
    setTimeout(() => {
      router.push({ name: 'batches' })
    }, 500)
  } catch (e: any) {
    error.value = e?.message || t('messages.batchDeleteFailed')
    deleting.value = false
    confirmingDelete.value = false
  } finally {
    deleting.value = false
  }
}

watch(
  () => route.params.id,
  () => {
    loadBatchDetails()
  },
)

onMounted(() => {
  lookups.ensureLoaded()
  loadBatchDetails()
})
</script>

<style scoped>
.page {
  max-width: 1400px;
}

.loading,
.empty {
  color: var(--color-on-surface-variant);
  margin-top: 1rem;
}

.error {
  color: var(--color-error);
  margin-top: 1rem;
}

.success {
  color: #0f8b4c;
  margin-top: .5rem;
}

.details-grid {
  margin-top: 1rem;
  display: grid;
  gap: 1rem;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
}

.card {
  background: var(--color-surface-container-lowest);
  border-radius: .75rem;
  padding: 1rem;
}
.card-head { display: flex; align-items: center; justify-content: space-between; gap: .75rem; margin-bottom: .75rem; }

.card h2 {
  margin: 0 0 .75rem;
  font-size: 1.05rem;
}

.details-list {
  margin: 0;
}

.row {
  display: grid;
  grid-template-columns: 160px 1fr;
  gap: .75rem;
  padding: .45rem 0;
}

dt {
  color: var(--color-on-surface-variant);
}

dd {
  margin: 0;
}

.table-wrap {
  overflow: auto;
}

.table {
  width: 100%;
  border-collapse: collapse;
}

.table th,
.table td {
  text-align: left;
  padding: .65rem;
  border-bottom: 1px solid rgba(0, 0, 0, .06);
}

.entity-link {
  color: var(--color-primary);
  text-decoration: none;
}

.entity-link:hover {
  text-decoration: underline;
}
.actions { display: flex; gap: .5rem; justify-content: flex-end; }
.btn { padding: .5rem .75rem; border: none; border-radius: .375rem; background: var(--color-primary); color: var(--color-on-primary); cursor: pointer; }
.btn-secondary { background: var(--color-surface-container); color: var(--color-on-surface); }
.btn-danger { background: #b42318; color: white; }
.btn:disabled { opacity: .6; cursor: not-allowed; }
.edit-form { display: flex; flex-direction: column; gap: .75rem; }
.field { display: flex; flex-direction: column; gap: .35rem; }
.input { padding: .5rem .75rem; border-radius: .375rem; border: 1px solid var(--color-outline-variant); background: var(--color-surface-container-lowest); color: var(--color-on-surface); }
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,.4); display: flex; align-items: center; justify-content: center; }
.modal-box { background: var(--color-surface-container-lowest); border-radius: .75rem; padding: 1.5rem; width: min(420px, calc(100vw - 2rem)); box-shadow: 0 4px 16px rgba(0,0,0,.15); }
</style>
