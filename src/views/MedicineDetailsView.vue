<template>
  <MainLayout>
    <div class="page">
      <h1>{{ t('pages.medicineDetailsTitle') }}</h1>

      <p v-if="loading" class="loading">{{ t('messages.loadingDetails') }}</p>
      <p v-else-if="error" class="error">{{ error }}</p>
      <p v-if="successMessage" class="success">{{ successMessage }}</p>

      <template v-else>
        <p v-if="!medicine" class="empty">{{ t('pages.noData') }}</p>

        <div v-else class="details-grid">
          <section class="card">
            <div class="card-head">
      <h2>{{ t('fields.general') }}</h2>
              <button v-if="!editing && authStore.canManageMedicines" class="btn btn-secondary" @click="startEdit">{{ t('actions.edit') }}</button>
            </div>

            <dl v-if="!editing" class="details-list">
              <div class="row"><dt>{{ t('fields.id') }}</dt><dd>{{ medicine.id }}</dd></div>
              <div class="row"><dt>{{ t('fields.name') }}</dt><dd>{{ medicine.name || '-' }}</dd></div>
              <div class="row"><dt>{{ t('fields.description') }}</dt><dd>{{ medicine.description || '-' }}</dd></div>
            </dl>

            <div v-else class="edit-form">
              <label class="field">
                <span>{{ t('fields.name') }}</span>
                <input v-model.trim="editForm.name" class="input" />
              </label>
              <label class="field">
                <span>{{ t('fields.description') }}</span>
                <textarea v-model.trim="editForm.description" class="input textarea" />
              </label>
              <div class="grid-two">
                <label class="field"><span>{{ t('fields.tempMin') }}</span><input v-model.number="editForm.tempMin" type="number" step="0.1" class="input" /></label>
                <label class="field"><span>{{ t('fields.tempMax') }}</span><input v-model.number="editForm.tempMax" type="number" step="0.1" class="input" /></label>
                <label class="field"><span>{{ t('fields.humidMin') }}</span><input v-model.number="editForm.humidMin" type="number" step="0.1" class="input" /></label>
                <label class="field"><span>{{ t('fields.humidMax') }}</span><input v-model.number="editForm.humidMax" type="number" step="0.1" class="input" /></label>
              </div>
              <div class="actions">
                <button class="btn btn-secondary" :disabled="saving" @click="cancelEdit">{{ t('actions.cancel') }}</button>
                <button class="btn" :disabled="saving" @click="saveEdit">{{ saving ? t('messages.saving') : t('actions.save') }}</button>
              </div>
            </div>
          </section>

          <section class="card">
            <h2>{{ t('actions.limits') }}</h2>
            <div class="table-wrap">
              <table class="table">
                <thead>
                  <tr>
                    <th>{{ t('fields.metric') }}</th>
                    <th>{{ t('fields.min') }}</th>
                    <th>{{ t('fields.max') }}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>{{ t('fields.temperature') }}</td>
                    <td>{{ medicine.tempMin }}</td>
                    <td>{{ medicine.tempMax }}</td>
                  </tr>
                  <tr>
                    <td>{{ t('fields.humidity') }}</td>
                    <td>{{ medicine.humidMin }}</td>
                    <td>{{ medicine.humidMax }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section class="card">
            <h2>{{ t('fields.relatedBatches') }}</h2>
            <div class="table-wrap">
              <table class="table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Batch number</th>
                    <th>Zone</th>
                    <th>Quantity</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-if="relatedBatches.length === 0">
                    <td colspan="4">{{ t('pages.noData') }}</td>
                  </tr>
                  <tr v-for="batch in relatedBatches" :key="batch.id">
                    <td>
                      <RouterLink :to="{ name: 'batch-details', params: { id: batch.id } }" class="entity-link">
                        {{ batch.id }}
                      </RouterLink>
                    </td>
                    <td>{{ batch.batchNumber }}</td>
                    <td>
                      <RouterLink :to="{ name: 'zone-details', params: { id: batch.zoneId } }" class="entity-link">
                        {{ lookups.zoneNameById.get(batch.zoneId) ?? `#${batch.zoneId}` }}
                      </RouterLink>
                    </td>
                    <td>{{ batch.quantity }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </template>
    </div>
  </MainLayout>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import MainLayout from '@/components/layout/MainLayout.vue'
import medicinesService from '@/services/endpoints/medicines'
import type { Medicine, MedicineUpdateDto } from '@/types'
import { useI18n } from 'vue-i18n'
import batchesService from '@/services/endpoints/batches'
import type { Batch } from '@/types'
import { useLookupsStore } from '@/stores/lookups'
import { useAuthStore } from '@/stores/auth'

const { t } = useI18n()
const route = useRoute()
const authStore = useAuthStore()

const loading = ref(false)
const saving = ref(false)
const error = ref('')
const successMessage = ref('')
const medicine = ref<Medicine | null>(null)
const relatedBatches = ref<Batch[]>([])
const lookups = useLookupsStore()
const editing = ref(false)
const editForm = ref({
  name: '',
  description: '',
  tempMin: 0,
  tempMax: 0,
  humidMin: 0,
  humidMax: 0,
})

function parseRouteId(value: unknown): number | null {
  const raw = Array.isArray(value) ? value[0] : value
  if (typeof raw !== 'string' || raw.trim() === '') return null

  const id = Number(raw)
  if (!Number.isInteger(id) || id <= 0) return null

  return id
}

async function loadMedicineDetails(): Promise<void> {
  const id = parseRouteId(route.params.id)
  if (id === null) {
    error.value = t('pages.invalidMedicineId')
    medicine.value = null
    loading.value = false
    return
  }

  loading.value = true
  error.value = ''
  successMessage.value = ''

  try {
    medicine.value = await medicinesService.getById(id)
    const allBatches = await batchesService.getAll()
    relatedBatches.value = Array.isArray(allBatches)
      ? allBatches.filter((batch) => batch.medicineId === id).slice(0, 20)
      : []
  } catch (e: any) {
    error.value = e?.message || t('pages.requestFailed')
    medicine.value = null
    relatedBatches.value = []
  } finally {
    loading.value = false
  }
}

function startEdit(): void {
  if (!authStore.canManageMedicines) return
  if (!medicine.value) return
  editForm.value = {
    name: medicine.value.name || '',
    description: medicine.value.description || '',
    tempMin: medicine.value.tempMin,
    tempMax: medicine.value.tempMax,
    humidMin: medicine.value.humidMin,
    humidMax: medicine.value.humidMax,
  }
  editing.value = true
}

function cancelEdit(): void {
  editing.value = false
}

function isValidNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

async function saveEdit(): Promise<void> {
  if (!authStore.canManageMedicines) return
  if (!medicine.value) return
  error.value = ''
  successMessage.value = ''

  if (!editForm.value.name.trim()) {
    error.value = t('pages.nameRequired')
    return
  }
  if (
    !isValidNumber(editForm.value.tempMin) ||
    !isValidNumber(editForm.value.tempMax) ||
    !isValidNumber(editForm.value.humidMin) ||
    !isValidNumber(editForm.value.humidMax)
  ) {
    error.value = t('messages.invalidLimits')
    return
  }
  if (editForm.value.tempMin > editForm.value.tempMax) {
    error.value = t('messages.tempMinMaxError')
    return
  }
  if (editForm.value.humidMin > editForm.value.humidMax) {
    error.value = t('messages.humidMinMaxError')
    return
  }

  saving.value = true
  try {
    const payload: MedicineUpdateDto = {
      id: medicine.value.id,
      name: editForm.value.name.trim(),
      description: editForm.value.description.trim() || undefined,
      tempMin: editForm.value.tempMin,
      tempMax: editForm.value.tempMax,
      humidMin: editForm.value.humidMin,
      humidMax: editForm.value.humidMax,
    }
    await medicinesService.update(payload)
    editing.value = false
    successMessage.value = t('messages.editMedicineSuccess')
    await loadMedicineDetails()
  } catch (e: any) {
    error.value = e?.message || t('pages.requestFailed')
  } finally {
    saving.value = false
  }
}

watch(
  () => route.params.id,
  () => {
    loadMedicineDetails()
  },
)

onMounted(() => {
  lookups.ensureLoaded()
  loadMedicineDetails()
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

.card h2 {
  margin: 0 0 .75rem;
  font-size: 1.05rem;
}

.card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: .75rem;
  margin-bottom: .75rem;
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

.edit-form {
  display: flex;
  flex-direction: column;
  gap: .6rem;
}

.grid-two {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: .5rem .75rem;
}

.field {
  display: flex;
  flex-direction: column;
  gap: .3rem;
  font-size: .9rem;
}

.input {
  padding: .5rem .65rem;
  border-radius: .375rem;
  border: 1px solid var(--color-outline-variant);
  background: var(--color-surface-container-lowest);
  color: var(--color-on-surface);
}

.textarea {
  min-height: 84px;
  resize: vertical;
}

.actions {
  display: flex;
  justify-content: flex-end;
  gap: .5rem;
}

.btn {
  padding: .45rem .75rem;
  border: none;
  border-radius: .375rem;
  background: var(--color-primary);
  color: var(--color-on-primary);
  cursor: pointer;
}

.btn-secondary {
  background: var(--color-surface-container);
  color: var(--color-on-surface);
}
</style>
