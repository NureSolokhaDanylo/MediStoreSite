<template>
  <MainLayout>
    <div class="page">
      <div class="toolbar">
        <h1>{{ t('pages.medicinesTitle') }}</h1>
        <div class="toolbar-right">
          <button class="btn btn-primary" @click="startCreate">{{ t('actions.createNew') }}</button>
        </div>
      </div>
      <div class="search-controls">
        <input
          v-model.trim="query"
          class="search-input"
          :placeholder="t('pages.medicinesSearchPlaceholder')"
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

            <p v-if="loading" class="loading">{{ t('messages.loadingDetails') }}</p>
      <p v-if="error" class="error">{{ error }}</p>

      <div class="table-wrap">
        <table class="table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Description</th>
              <th>Temperature range</th>
              <th>Humidity range</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="!loading && medicines.length === 0">
              <td colspan="5">{{ t('pages.noData') }}</td>
            </tr>
            <tr v-for="medicine in medicines" :key="medicine.id">
              <td>{{ medicine.id }}</td>
              <td>
                <RouterLink
                  :to="{ name: 'medicine-details', params: { id: medicine.id } }"
                  class="entity-link"
                >
                  {{ medicine.name || '-' }}
                </RouterLink>
              </td>
              <td>{{ medicine.description || '-' }}</td>
              <td>{{ formatRange(medicine.tempMin, medicine.tempMax) }}</td>
              <td>{{ formatRange(medicine.humidMin, medicine.humidMax) }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="pagination">
        <button class="btn" :disabled="loading || skip === 0" @click="goPrev">{{ t('actions.prev') }}</button>
        <span class="loading">Total: {{ totalCount }} | skip {{ skip }} take {{ take }}</span>
        <button class="btn" :disabled="loading || skip + take >= totalCount" @click="goNext">{{ t('actions.next') }}</button>
      </div>

      <!-- Create modal -->
      <div v-if="creating" class="modal-overlay">
        <div class="modal-box">
          <h3> {{ t('actions.create') }} {{ t('entities.medicine') }} </h3>
          <div class="modal-form">
            <label class="field">
              <span>{{ t('fields.name') }} *</span>
              <input v-model.trim="createForm.name" class="input" />
            </label>
            <label class="field">
              <span>{{ t('fields.description') }}</span>
              <textarea v-model.trim="createForm.description" class="input textarea" style="min-height: 80px;" />
            </label>
            <h4 style="margin: .5rem 0 0.5rem; font-size: 0.9rem;">{{ t('actions.limits') }}</h4>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: .5rem;">
              <label class="field"><span>{{ t('fields.tempMin') }}</span><input v-model.number="createForm.tempMin" type="number" step="0.1" class="input" /></label>
              <label class="field"><span>{{ t('fields.tempMax') }}</span><input v-model.number="createForm.tempMax" type="number" step="0.1" class="input" /></label>
              <label class="field"><span>{{ t('fields.humidMin') }}</span><input v-model.number="createForm.humidMin" type="number" step="0.1" class="input" /></label>
              <label class="field"><span>{{ t('fields.humidMax') }}</span><input v-model.number="createForm.humidMax" type="number" step="0.1" class="input" /></label>
            </div>
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
import medicinesService from '@/services/endpoints/medicines'
import type { Medicine, MedicineSearchResult } from '@/types'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const loading = ref(false)
const error = ref('')
const query = ref('')
const skip = ref(0)
const take = ref(50)
const totalCount = ref(0)

type MedicineRow = Partial<Medicine> & Pick<Medicine, 'id'>
const medicines = ref<MedicineRow[]>([])

// Create state
const creating = ref(false)
const creatingInProgress = ref(false)
const createError = ref('')
const createForm = ref({
  name: '',
  description: '',
  tempMin: 0,
  tempMax: 0,
  humidMin: 0,
  humidMax: 0,
})

function asArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : []
}

function formatRange(min: number | undefined, max: number | undefined): string {
  if (typeof min !== 'number' || typeof max !== 'number') return '-'
  return `${min} – ${max}`
}

async function loadPage(): Promise<void> {
  loading.value = true
  error.value = ''
  try {
    if (!query.value.trim()) {
      const all = asArray<Medicine>(await medicinesService.getAll())
      totalCount.value = all.length
      medicines.value = all.slice(skip.value, skip.value + take.value)
      return
    }

    const result = await medicinesService.search(query.value, skip.value, take.value)
    medicines.value = asArray<MedicineSearchResult>(result?.items).map((item) => ({
      id: item.id,
      name: item.name,
      description: item.description,
      tempMin: undefined,
      tempMax: undefined,
      humidMin: undefined,
      humidMax: undefined,
    }))
    totalCount.value = typeof result?.totalCount === 'number' ? result.totalCount : medicines.value.length
  } catch (e: any) {
    error.value = e?.message || t('pages.requestFailed')
    medicines.value = []
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
    name: '',
    description: '',
    tempMin: 0,
    tempMax: 0,
    humidMin: 0,
    humidMax: 0,
  }
}

async function submitCreate(): Promise<void> {
  createError.value = ''
  if (!createForm.value.name.trim()) {
    createError.value = 'Name is required'
    return
  }
  if (typeof createForm.value.tempMin !== 'number' || typeof createForm.value.tempMax !== 'number' ||
      typeof createForm.value.humidMin !== 'number' || typeof createForm.value.humidMax !== 'number') {
    createError.value = 'All limits must be valid numbers'
    return
  }
  creatingInProgress.value = true
  try {
    await medicinesService.create({
      name: createForm.value.name,
      description: createForm.value.description,
      tempMin: createForm.value.tempMin,
      tempMax: createForm.value.tempMax,
      humidMin: createForm.value.humidMin,
      humidMax: createForm.value.humidMax,
    })
    creating.value = false
    createForm.value = {
      name: '',
      description: '',
      tempMin: 0,
      tempMax: 0,
      humidMin: 0,
      humidMax: 0,
    }
    skip.value = 0
    loadPage()
  } catch (e: any) {
    createError.value = e?.message || 'Failed to create medicine'
    creatingInProgress.value = false
  }
}

onMounted(() => {
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

.toolbar-right { display: flex; gap: .5rem; }
.btn-primary { background: var(--color-primary); color: var(--color-on-primary); }
.btn-secondary { background: var(--color-surface-container); color: var(--color-on-surface); }
.textarea { resize: vertical; }

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}

.modal-box {
  background: var(--color-surface-container-lowest);
  border-radius: .75rem;
  padding: 1.5rem;
  max-width: 500px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  max-height: 80vh;
  overflow-y: auto;
}

.modal-box h3 {
  margin: 0 0 1rem;
  font-size: 1.1rem;
}

.modal-form {
  display: flex;
  flex-direction: column;
  gap: .75rem;
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
  gap: .75rem;
  justify-content: flex-end;
  margin-top: .5rem;
}
</style>
