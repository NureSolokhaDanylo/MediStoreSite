<template>
  <MainLayout>
    <div class="page">
      <h1>{{ t('pages.zoneDetailsTitle') }}</h1>

      <p v-if="loading" class="loading">{{ t('messages.loadingDetails') }}</p>
      <p v-else-if="error" class="error">{{ error }}</p>
      <p v-if="successMessage" class="success">{{ successMessage }}</p>

      <template v-else>
        <p v-if="!zone" class="empty">{{ t('pages.noData') }}</p>

        <!-- Edit mode: single card with form -->
        <section v-else-if="editing" class="card edit-card">
          <div class="card-head">
            <h2>{{ t('actions.edit') }} {{ t('entities.zone') }}</h2>
          </div>
          <div class="edit-form">
            <div class="form-row">
              <span class="form-label">{{ t('fields.id') }}</span>
              <span class="form-value">{{ zone.id }}</span>
            </div>
            <label class="field">
              <span>{{ t('fields.name') }}</span>
              <input v-model.trim="editForm.name" class="input" />
            </label>
            <label class="field">
              <span>{{ t('fields.description') }}</span>
              <textarea v-model.trim="editForm.description" class="input textarea" />
            </label>
            <h3 class="section-title">{{ t('actions.limits') }}</h3>
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

        <!-- View mode: grid with info cards -->
        <div v-else class="details-grid">
          <!-- Actions panel -->
          <section class="card actions-card">
            <div class="actions-content">
              <button class="btn" @click="startEdit">{{ t('actions.edit') }}</button>
              <button class="btn btn-danger" @click="startDelete" :disabled="deleting">{{ t('actions.delete') }}</button>
            </div>
          </section>

          <section class="card">
            <div class="card-head">
              <h2>{{ t('fields.general') }}</h2>
            </div>
            <dl class="details-list">
              <div class="row"><dt>{{ t('fields.id') }}</dt><dd>{{ zone.id }}</dd></div>
              <div class="row"><dt>{{ t('fields.name') }}</dt><dd>{{ zone.name }}</dd></div>
              <div class="row"><dt>{{ t('fields.description') }}</dt><dd>{{ zone.description || '-' }}</dd></div>
            </dl>
          </section>

          <section class="card">
            <h2>{{ t('actions.limits') }}</h2>
            <dl class="details-list">
              <div class="row"><dt>{{ t('fields.temperature') }}</dt><dd>{{ zone.tempMin }} – {{ zone.tempMax }} °C</dd></div>
              <div class="row"><dt>{{ t('fields.humidity') }}</dt><dd>{{ zone.humidMin }} – {{ zone.humidMax }} %</dd></div>
            </dl>
          </section>
        </div>

        <!-- Delete confirmation modal -->
        <div v-if="confirmingDelete" class="modal-overlay">
          <div class="modal-box">
            <h3>{{ t('actions.delete') }} {{ t('entities.zone') }}?</h3>
            <p>{{ t('messages.deleteConfirmation', { name: zone?.name }) }}</p>
            <div class="modal-actions">
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
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import MainLayout from '@/components/layout/MainLayout.vue'
import zonesService from '@/services/endpoints/zones'
import type { Zone } from '@/types'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const loading = ref(false)
const saving = ref(false)
const error = ref('')
const successMessage = ref('')
const zone = ref<Zone | null>(null)
const editing = ref(false)
const editForm = ref({
  name: '',
  description: '',
  tempMin: 0,
  tempMax: 0,
  humidMin: 0,
  humidMax: 0,
})

// Delete state
const deleting = ref(false)
const confirmingDelete = ref(false)

function parseId(value: unknown): number | null {
  const raw = Array.isArray(value) ? value[0] : value
  const id = Number(raw)
  return Number.isInteger(id) && id > 0 ? id : null
}

async function load(): Promise<void> {
  const id = parseId(route.params.id)
  if (id === null) {
    error.value = t('pages.invalidZoneId')
    zone.value = null
    return
  }
  loading.value = true
  error.value = ''
  successMessage.value = ''
  try {
    zone.value = await zonesService.getById(id)
  } catch (e: any) {
    error.value = e?.message || t('pages.requestFailed')
    zone.value = null
  } finally {
    loading.value = false
  }
}

function startEdit(): void {
  if (!zone.value) return
  editForm.value = {
    name: zone.value.name || '',
    description: zone.value.description || '',
    tempMin: zone.value.tempMin,
    tempMax: zone.value.tempMax,
    humidMin: zone.value.humidMin,
    humidMax: zone.value.humidMax,
  }
  editing.value = true
}

function cancelEdit(): void {
  editing.value = false
}

function startDelete(): void {
  confirmingDelete.value = true
}

async function confirmDelete(): Promise<void> {
  if (!zone.value) return
  deleting.value = true
  try {
    await zonesService.delete(zone.value.id)
    successMessage.value = t('messages.deleteZoneSuccess')
    setTimeout(() => {
      router.push({ name: 'zones' })
    }, 500)
  } catch (e: any) {
    error.value = e?.message || t('messages.deleteZoneFailed')
    confirmingDelete.value = false
    deleting.value = false
  }
}

function cancelDelete(): void {
  confirmingDelete.value = false
}

function isValidNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

async function saveEdit(): Promise<void> {
  if (!zone.value) return
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
    await zonesService.update({
      id: zone.value.id,
      name: editForm.value.name.trim(),
      description: editForm.value.description.trim() || undefined,
      tempMin: editForm.value.tempMin,
      tempMax: editForm.value.tempMax,
      humidMin: editForm.value.humidMin,
      humidMax: editForm.value.humidMax,
    })
    editing.value = false
    successMessage.value = t('messages.editZoneSuccess')
    await load()
  } catch (e: any) {
    error.value = e?.message || t('pages.requestFailed')
  } finally {
    saving.value = false
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
.details-grid { margin-top: 1rem; display: grid; gap: 1rem; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); }
.card { background: var(--color-surface-container-lowest); border-radius: .75rem; padding: 1rem; }
.card h2 { margin: 0 0 .75rem; font-size: 1.05rem; }
.card-head { display: flex; align-items: center; justify-content: space-between; gap: .75rem; margin-bottom: .75rem; }
.card-actions { display: flex; gap: .5rem; align-items: center; }
.actions-card {
  grid-column: 1 / -1;
  display: flex;
  gap: 1rem;
  margin-bottom: .5rem;
}
.actions-content {
  display: flex;
  gap: .75rem;
  width: 100%;
}
.actions-content .btn {
  flex: 1;
  max-width: 200px;
}
.edit-card { max-width: 520px; margin-top: 1rem; }
.details-list { margin: 0; }
.row { display: grid; grid-template-columns: 160px 1fr; gap: .75rem; padding: .45rem 0; }
dt { color: var(--color-on-surface-variant); }
dd { margin: 0; }
.edit-form { display: flex; flex-direction: column; gap: .75rem; }
.form-row { display: grid; grid-template-columns: 160px 1fr; gap: .75rem; padding: .3rem 0; font-size: .9rem; }
.form-label { color: var(--color-on-surface-variant); }
.form-value { color: var(--color-on-surface); }
.section-title { margin: .5rem 0 .25rem; font-size: .95rem; font-weight: 600; color: var(--color-on-surface-variant); }
.grid-two { display: grid; grid-template-columns: repeat(2, minmax(0,1fr)); gap: .5rem .75rem; }
.field { display: flex; flex-direction: column; gap: .3rem; font-size: .9rem; }
.input {
  padding: .5rem .65rem;
  border-radius: .375rem;
  border: 1px solid var(--color-outline-variant);
  background: var(--color-surface-container-lowest);
  color: var(--color-on-surface);
}
.textarea { min-height: 84px; resize: vertical; }
.actions { display: flex; justify-content: flex-end; gap: .5rem; margin-top: .5rem; }
.btn {
  padding: .45rem .75rem;
  border: none;
  border-radius: .375rem;
  background: var(--color-primary);
  color: var(--color-on-primary);
  cursor: pointer;
}
.btn-secondary { background: var(--color-surface-container); color: var(--color-on-surface); }

.card-actions {
  display: flex;
  gap: .5rem;
  align-items: center;
}

.btn {
  padding: .45rem .75rem;
  border: none;
  border-radius: .375rem;
  background: var(--color-primary);
  color: var(--color-on-primary);
  cursor: pointer;
  transition: background 0.2s;
}

.btn:hover:not(:disabled) {
  background: var(--color-primary-hover, #1d5b9f);
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-secondary {
  background: var(--color-surface-container);
  color: var(--color-on-surface);
}

.btn-danger {
  background: var(--color-error);
  color: white;
}

.btn-danger:hover:not(:disabled) {
  background: #cc0000;
}

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
  max-width: 400px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
}

.modal-box h3 {
  margin: 0 0 .75rem;
  font-size: 1.1rem;
}

.modal-box p {
  margin: 0 0 1.5rem;
  color: var(--color-on-surface-variant);
}

.modal-actions {
  display: flex;
  gap: .75rem;
  justify-content: flex-end;
}
</style>
