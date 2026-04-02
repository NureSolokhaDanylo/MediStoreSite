<template>
  <MainLayout>
    <div class="page">
      <div class="toolbar">
        <h1>{{ t('pages.batchesTitle') }}</h1>
        <div class="search-controls">
          <input
            v-model.trim="query"
            class="search-input"
            :placeholder="t('pages.search') + '...'"
            @keyup.enter="applyFilters"
          />
                    <select v-model.number="take" class="take-select">
            <option :value="10">10</option>
            <option :value="25">25</option>
            <option :value="50">50</option>
            <option :value="100">100</option>
          </select>
          <button class="btn" :disabled="loading" @click="applyFilters">
            {{ t('pages.search') }}
          </button>
        </div>
        <button v-if="authStore.canManageBatches" class="btn" @click="startCreate">
          {{ t('actions.createNew') }}
        </button>
      </div>

      <p v-if="loading" class="loading">{{ t('messages.loadingDetails') }}</p>
      <p v-if="error" class="error">{{ error }}</p>

      <div class="table-wrap">
        <table class="table">
          <thead>
            <tr>
              <th>{{ t('fields.id') }}</th>
              <th>{{ t('fields.batchNumber') }}</th>
              <th>{{ t('fields.quantity') }}</th>
              <th>{{ t('pages.expireDate') }}</th>
              <th>{{ t('pages.dateAdded') }}</th>
              <th>{{ t('entities.medicine') }}</th>
              <th>{{ t('fields.zone') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="!loading && batches.length === 0">
              <td colspan="7">{{ t('pages.noData') }}</td>
            </tr>
            <tr v-for="batch in batches" :key="batch.id">
              <td>{{ batch.id }}</td>
              <td>
                <RouterLink :to="{ name: 'batch-details', params: { id: batch.id } }" class="entity-link">
                  {{ batch.batchNumber || '-' }}
                </RouterLink>
              </td>
              <td>{{ readNumber(batch.quantity) }}</td>
              <td>{{ formatDate(batch.expireDate) }}</td>
              <td>{{ formatDate(batch.dateAdded) }}</td>
              <td>
                <RouterLink
                  v-if="typeof batch.medicineId === 'number'"
                  :to="{ name: 'medicine-details', params: { id: batch.medicineId } }"
                  class="entity-link"
                >
                  {{ medicineLabel(batch.medicineId) }}
                </RouterLink>
                <span v-else>-</span>
              </td>
              <td>
                <RouterLink
                  v-if="typeof batch.zoneId === 'number'"
                  :to="{ name: 'zone-details', params: { id: batch.zoneId } }"
                  class="entity-link"
                >
                  {{ zoneLabel(batch.zoneId) }}
                </RouterLink>
                <span v-else>-</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="pagination">
        <button class="btn" :disabled="loading || skip === 0" @click="goPrev">{{ t('actions.prev') }}</button>
        <span class="loading">Total: {{ totalCount }} | skip {{ skip }} take {{ take }}</span>
        <button class="btn" :disabled="loading || skip + take >= totalCount" @click="goNext">{{ t('actions.next') }}</button>
      </div>

      <div v-if="creating" class="modal-overlay">
        <div class="modal-box">
          <h3>{{ t('actions.create') }} {{ t('entities.batch') }}</h3>
          <div class="modal-form">
            <label class="field">
              <span>{{ t('fields.batchNumber') }} *</span>
              <input v-model.trim="createForm.batchNumber" class="input" />
            </label>
            <label class="field">
              <span>{{ t('fields.quantity') }} *</span>
              <input v-model.number="createForm.quantity" type="number" min="1" class="input" />
            </label>
            <label class="field">
              <span>{{ t('pages.expireDate') }} *</span>
              <input v-model="createForm.expireDate" type="date" class="input" />
            </label>
            <label class="field">
              <span>{{ t('entities.medicine') }} *</span>
              <select v-model.number="createForm.medicineId" class="input">
                <option :value="0">{{ t('filters.chooseType') }}</option>
                <option v-for="medicine in lookups.medicines" :key="medicine.id" :value="medicine.id">
                  {{ medicine.name }}
                </option>
              </select>
            </label>
            <label class="field">
              <span>{{ t('fields.zone') }} *</span>
              <select v-model.number="createForm.zoneId" class="input">
                <option :value="0">{{ t('filters.chooseType') }}</option>
                <option v-for="zone in lookups.zones" :key="zone.id" :value="zone.id">
                  {{ zone.name }}
                </option>
              </select>
            </label>
            <p v-if="createError" class="error">{{ createError }}</p>
            <div class="modal-actions">
              <button class="btn btn-secondary" :disabled="creatingInProgress" @click="cancelCreate">{{ t('actions.cancel') }}</button>
              <button class="btn" :disabled="creatingInProgress" @click="submitCreate">
                {{ creatingInProgress ? t('messages.creating') : t('actions.create') }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </MainLayout>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import MainLayout from '@/components/layout/MainLayout.vue'
import batchesService from '@/services/endpoints/batches'
import type { Batch, BatchSearchResult } from '@/types'
import { useI18n } from 'vue-i18n'
import { useLookupsStore } from '@/stores/lookups'
import { useAuthStore } from '@/stores/auth'

const { t } = useI18n()
const authStore = useAuthStore()
const loading = ref(false)
const error = ref('')
const query = ref('')
const skip = ref(0)
const take = ref(50)
const totalCount = ref(0)
const lookups = useLookupsStore()
const creating = ref(false)
const creatingInProgress = ref(false)
const createError = ref('')

type BatchRow = Partial<Batch> & Pick<Batch, 'id'>
const batches = ref<BatchRow[]>([])
const createForm = ref({
  batchNumber: '',
  quantity: 1,
  expireDate: '',
  medicineId: 0,
  zoneId: 0,
})

function asArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : []
}

function readNumber(value: number | undefined): string {
  return typeof value === 'number' ? String(value) : '-'
}

function medicineLabel(medicineId: number | undefined): string {
  if (typeof medicineId !== 'number') return '-'
  return lookups.medicineNameById.get(medicineId) ?? `#${medicineId}`
}

function zoneLabel(zoneId: number | undefined): string {
  if (typeof zoneId !== 'number') return '-'
  return lookups.zoneNameById.get(zoneId) ?? `#${zoneId}`
}

function formatDate(value: string | undefined): string {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString()
}

function asDateTime(value: string): string {
  if (!value) return value
  return value.length === 10 ? `${value}T00:00:00` : value
}

async function loadPage(): Promise<void> {
  loading.value = true
  error.value = ''
  try {
    if (!query.value.trim()) {
      const all = asArray<Batch>(await batchesService.getAll())
      totalCount.value = all.length
      batches.value = all.slice(skip.value, skip.value + take.value)
      return
    }

    const result = await batchesService.search(query.value, skip.value, take.value)
    const items = asArray<BatchSearchResult>(result?.items)
    batches.value = items.map((item) => ({
      id: item.id,
      batchNumber: item.batchNumber,
      medicineId: item.medicineId,
      zoneId: item.zoneId,
      quantity: undefined,
      expireDate: undefined,
      dateAdded: undefined,
    }))
    totalCount.value = typeof result?.totalCount === 'number' ? result.totalCount : batches.value.length
  } catch (e: any) {
    error.value = e?.message || t('pages.requestFailed')
    batches.value = []
    totalCount.value = 0
  } finally {
    loading.value = false
  }
}

function applyFilters(): void {
  skip.value = 0
  loadPage()
}

function goPrev(): void {
  if (skip.value === 0) return
  skip.value = Math.max(0, skip.value - take.value)
  loadPage()
}

function goNext(): void {
  if (skip.value + take.value >= totalCount.value) return
  skip.value += take.value
  loadPage()
}

function startCreate(): void {
  createError.value = ''
  creating.value = true
}

function cancelCreate(): void {
  creating.value = false
  createForm.value = {
    batchNumber: '',
    quantity: 1,
    expireDate: '',
    medicineId: 0,
    zoneId: 0,
  }
}

async function submitCreate(): Promise<void> {
  if (!authStore.canManageBatches) return
  createError.value = ''
  if (!createForm.value.batchNumber.trim()) {
    createError.value = t('messages.required', { field: t('fields.batchNumber') })
    return
  }
  if (!Number.isFinite(createForm.value.quantity) || createForm.value.quantity < 1) {
    createError.value = t('pages.batchQuantityRequired')
    return
  }
  if (!createForm.value.expireDate) {
    createError.value = t('pages.batchExpireDateRequired')
    return
  }
  if (createForm.value.medicineId <= 0) {
    createError.value = t('pages.batchMedicineRequired')
    return
  }
  if (createForm.value.zoneId <= 0) {
    createError.value = t('pages.batchZoneRequired')
    return
  }

  creatingInProgress.value = true
  try {
    const dateAdded = new Date().toISOString()
    await batchesService.create({
      batchNumber: createForm.value.batchNumber.trim(),
      quantity: createForm.value.quantity,
      expireDate: asDateTime(createForm.value.expireDate),
      dateAdded,
      medicineId: createForm.value.medicineId,
      zoneId: createForm.value.zoneId,
    })
    creating.value = false
    cancelCreate()
    skip.value = 0
    await loadPage()
  } catch (e: any) {
    createError.value = e?.message || t('messages.batchCreateFailed')
  } finally {
    creatingInProgress.value = false
  }
}

onMounted(() => {
  lookups.ensureLoaded()
  loadPage()
})
</script>

<style scoped>
.page {
  max-width: 1400px;
}
.toolbar { display: flex; justify-content: space-between; align-items: center; gap: 1rem; margin-bottom: 1rem; }
.search-controls { display: flex; gap: .5rem; align-items: center; }
.search-input { padding: .5rem .75rem; border-radius: .375rem; border: 1px solid var(--color-outline-variant); min-width: 240px; }
.take-select { width: 88px; padding: .5rem .65rem; border-radius: .375rem; border: 1px solid var(--color-outline-variant); background: var(--color-surface-container-lowest); color: var(--color-on-surface); }
.btn { padding: .5rem .75rem; border: none; border-radius: .375rem; background: var(--color-primary); color: var(--color-on-primary); cursor: pointer; }
.btn:disabled { opacity: .6; cursor: not-allowed; }
.loading { color: var(--color-on-surface-variant); margin-bottom: .5rem; }
.error { color: var(--color-error); margin-bottom: .75rem; }
.table-wrap { overflow: auto; background: var(--color-surface-container-lowest); border-radius: .75rem; }
.table { width: 100%; border-collapse: collapse; }
.table th, .table td { padding: .75rem; text-align: left; border-bottom: 1px solid rgba(0,0,0,.06); }
.entity-link { color: var(--color-primary); text-decoration: none; }
.entity-link:hover { text-decoration: underline; }
.pagination { margin-top: .75rem; display: flex; justify-content: space-between; align-items: center; gap: .75rem; }
.modal-overlay { position: fixed; inset: 0; background: rgba(0, 0, 0, 0.5); display: flex; align-items: center; justify-content: center; z-index: 100; }
.modal-box { background: var(--color-surface-container-lowest); border-radius: .75rem; padding: 1.5rem; max-width: 500px; width: 100%; box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15); }
.modal-form { display: flex; flex-direction: column; gap: .75rem; }
.field { display: flex; flex-direction: column; gap: .35rem; }
.input { padding: .5rem .75rem; border-radius: .375rem; border: 1px solid var(--color-outline-variant); background: var(--color-surface-container-lowest); color: var(--color-on-surface); }
.modal-actions { display: flex; justify-content: flex-end; gap: .5rem; }
.btn-secondary { background: var(--color-surface-container); color: var(--color-on-surface); }
</style>
