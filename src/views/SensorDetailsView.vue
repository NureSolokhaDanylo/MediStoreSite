<template>
  <MainLayout>
    <div class="page">
      <h1>{{ t('pages.sensorsTitle') }}</h1>

      <p v-if="loading" class="loading">{{ t('messages.loadingDetails') }}</p>
      <p v-else-if="error" class="error">{{ error }}</p>
      <p v-if="successMessage" class="success">{{ successMessage }}</p>

      <template v-else>
        <p v-if="!sensor" class="empty">{{ t('pages.noData') }}</p>

        <div v-else class="details-grid">
          <section class="card">
            <div class="card-head">
              <h2>{{ t('fields.general') }}</h2>
              <button v-if="!editing" class="btn btn-secondary" @click="startEdit">{{ t('actions.edit') }}</button>
            </div>
            <dl v-if="!editing" class="details-list">
              <div class="row"><dt>{{ t('fields.id') }}</dt><dd>{{ sensor.id }}</dd></div>
              <div class="row"><dt>{{ t('fields.serialNumber') }}</dt><dd>{{ sensor.serialNumber || '-' }}</dd></div>
              <div class="row"><dt>{{ t('fields.sensorType') }}</dt><dd>{{ sensorTypeLabel(sensor.sensorType) }}</dd></div>
              <div class="row"><dt>{{ t('fields.status') }}</dt><dd>{{ sensor.isOn ? t('status.on') : t('status.off') }}</dd></div>
              <div class="row">
                <dt>{{ t('fields.zone') }}</dt>
                <dd>
                  <RouterLink
                    v-if="typeof sensor.zoneId === 'number'"
                    :to="{ name: 'zone-details', params: { id: sensor.zoneId } }"
                    class="entity-link"
                  >
                    {{ zoneLabel(sensor.zoneId) }}
                  </RouterLink>
                  <span v-else>-</span>
                </dd>
              </div>
            </dl>
            <div v-else class="edit-form">
              <label class="field"><span>{{ t('fields.serialNumber') }}</span><input v-model.trim="editForm.serialNumber" class="input" /></label>
              <label class="field">
                <span>{{ t('fields.status') }}</span>
                <select v-model="editForm.isOnText" class="input">
                  <option value="on">{{ t('status.on') }}</option>
                  <option value="off">{{ t('status.off') }}</option>
                </select>
              </label>
              <label class="field">
                <span>{{ t('fields.zone') }}</span>
                <select v-model="editForm.zoneIdText" class="input">
                  <option value="">{{ t('filters.noZone') }}</option>
                  <option v-for="zone in lookups.zones" :key="zone.id" :value="String(zone.id)">
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
            <h2>{{ t('apiKey.title') }}</h2>
            <p class="hint">{{ t('apiKey.hint') }}</p>
            <div v-if="generatedApiKey" class="api-key-box">
              <div class="api-key-warning">⚠️ {{ t('apiKey.warning') }}</div>
              <div class="api-key-display">
                <code>{{ generatedApiKey }}</code>
                <button class="btn btn-secondary btn-icon" @click="copyApiKey" :title="t('apiKey.buttonCopy')">
                  {{ copiedMessage || t('actions.copy') }}
                </button>
              </div>
            </div>
            <button 
              v-else 
              class="btn btn-secondary" 
              :disabled="generatingKey"
              @click="showGenerateConfirm"
            >
              {{ generatingKey ? t('messages.generating') : t('apiKey.buttonGenerate') }}
            </button>
          </section>

          <section class="card">
            <h2>{{ t('fields.lastReading') }}</h2>
            <div class="table-wrap">
              <table class="table">
                <thead><tr><th>{{ t('fields.field') }}</th><th>{{ t('fields.value') }}</th></tr></thead>
                <tbody>
                  <tr><td>{{ t('fields.currentValue') }}</td><td>{{ currentValue }}</td></tr>
                  <tr><td>{{ t('fields.lastUpdate') }}</td><td>{{ formatDate(sensor.lastUpdate) }}</td></tr>
                  <tr><td>{{ t('fields.temperature') }}</td><td>{{ formatTemperature(lastReading?.temperature) }}</td></tr>
                  <tr><td>{{ t('fields.humidity') }}</td><td>{{ formatHumidity(lastReading?.humidity) }}</td></tr>
                  <tr><td>{{ t('fields.readingTime') }}</td><td>{{ formatDate(lastReading?.timestamp) }}</td></tr>
                  <tr v-if="lastReadingError"><td>{{ t('fields.readingStatus') }}</td><td>{{ lastReadingError }}</td></tr>
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </template>

      <!-- Confirm API key generation modal -->
      <div v-if="showingConfirm" class="modal-overlay" @click.self="cancelGenerateKey">
        <div class="modal-box">
          <h3>{{ t('apiKey.confirmTitle') }}</h3>
          <p>{{ t('apiKey.confirmText') }}</p>
          <div class="modal-actions">
            <button class="btn btn-secondary" @click="cancelGenerateKey">{{ t('actions.cancel') }}</button>
            <button class="btn btn-danger" @click="confirmGenerateKey">{{ t('actions.confirm') }}</button>
          </div>
        </div>
      </div>
    </div>
  </MainLayout>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import MainLayout from '@/components/layout/MainLayout.vue'
import sensorsService from '@/services/endpoints/sensors'
import type { Reading, Sensor } from '@/types'
import { useLookupsStore } from '@/stores/lookups'

const { t } = useI18n()
const route = useRoute()
const lookups = useLookupsStore()
const loading = ref(false)
const saving = ref(false)
const error = ref('')
const successMessage = ref('')
const sensor = ref<Sensor | null>(null)
const lastReading = ref<Reading | null>(null)
const lastReadingError = ref('')
const editing = ref(false)
const editForm = ref({
  serialNumber: '',
  isOnText: 'off',
  zoneIdText: '',
})
const generatedApiKey = ref('')
const generatingKey = ref(false)
const showingConfirm = ref(false)
const copiedMessage = ref('')

function parseId(value: unknown): number | null {
  const raw = Array.isArray(value) ? value[0] : value
  const id = Number(raw)
  return Number.isInteger(id) && id > 0 ? id : null
}

function sensorTypeLabel(value: number): string {
  if (value === 1) return 'Temperature'
  if (value === 2) return 'Humidity'
  return String(value)
}

function zoneLabel(zoneId: number): string {
  return lookups.zoneNameById.get(zoneId) ?? `#${zoneId}`
}

function readText(value: unknown): string {
  if (value === null || value === undefined) return '-'
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  if (typeof value === 'string') return value || '-'
  return '-'
}

function formatDate(value: unknown): string {
  if (typeof value !== 'string' || !value) return '-'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString()
}

function numberOrNull(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value)
    if (Number.isFinite(parsed)) return parsed
  }
  return null
}

function formatTemperature(value: unknown): string {
  const numeric = numberOrNull(value)
  return numeric === null ? '-' : `${numeric.toFixed(1)} °C`
}

function formatHumidity(value: unknown): string {
  const numeric = numberOrNull(value)
  return numeric === null ? '-' : `${numeric.toFixed(1)} %`
}

function formatCurrentValueByType(type: number, value: unknown, isOn: boolean): string {
  if (!isOn) return '-'
  if (type === 1) return formatTemperature(value)
  if (type === 2) return formatHumidity(value)
  return readText(value)
}

const currentValue = computed(() => {
  if (!sensor.value) return '-'
  return formatCurrentValueByType(sensor.value.sensorType, sensor.value.lastValue, sensor.value.isOn)
})

async function load(): Promise<void> {
  const id = parseId(route.params.id)
  if (id === null) {
    error.value = t('pages.invalidSensorId')
    sensor.value = null
    lastReading.value = null
    lastReadingError.value = ''
    return
  }
  loading.value = true
  error.value = ''
  successMessage.value = ''
  try {
    const sensorResponse = await sensorsService.getById(id)
    sensor.value = sensorResponse
    lastReadingError.value = ''
    try {
      const readings = await sensorsService.getLastReadings(id)
      lastReading.value = readings[0] || null
    } catch (readingError: any) {
      lastReading.value = null
      lastReadingError.value = readingError?.message || t('messages.lastReadingUnavailable')
    }
  } catch (e: any) {
    error.value = e?.message || t('pages.requestFailed')
    sensor.value = null
    lastReading.value = null
    lastReadingError.value = ''
  } finally {
    loading.value = false
  }
}

function startEdit(): void {
  if (!sensor.value) return
  editForm.value = {
    serialNumber: sensor.value.serialNumber || '',
    isOnText: sensor.value.isOn ? 'on' : 'off',
    zoneIdText: typeof sensor.value.zoneId === 'number' ? String(sensor.value.zoneId) : '',
  }
  editing.value = true
}

function cancelEdit(): void {
  editing.value = false
}

function zoneFromForm(): number | null {
  if (!editForm.value.zoneIdText) return null
  const parsed = Number(editForm.value.zoneIdText)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null
}

async function saveEdit(): Promise<void> {
  if (!sensor.value) return
  error.value = ''
  successMessage.value = ''
  if (!editForm.value.serialNumber.trim()) {
    error.value = t('pages.serialNumberRequired')
    return
  }

  saving.value = true
  try {
    await sensorsService.update({
      id: sensor.value.id,
      serialNumber: editForm.value.serialNumber.trim(),
      isOn: editForm.value.isOnText === 'on',
      zoneId: zoneFromForm(),
    })
    editing.value = false
    successMessage.value = t('messages.success', { entity: t('entities.sensor'), action: t('actions.edit') })
    await load()
  } catch (e: any) {
    error.value = e?.message || t('pages.requestFailed')
  } finally {
    saving.value = false
  }
}

function showGenerateConfirm(): void {
  showingConfirm.value = true
}

function cancelGenerateKey(): void {
  showingConfirm.value = false
}

async function confirmGenerateKey(): Promise<void> {
  if (!sensor.value) return
  showingConfirm.value = false
  generatingKey.value = true
  error.value = ''
  successMessage.value = ''

  try {
    const apiKey = await sensorsService.generateApiKey(sensor.value.id)
    generatedApiKey.value = apiKey
  } catch (e: any) {
    error.value = e?.message || t('pages.requestFailed')
  } finally {
    generatingKey.value = false
  }
}

async function copyApiKey(): Promise<void> {
  if (!generatedApiKey.value) return
  try {
    await navigator.clipboard.writeText(generatedApiKey.value)
    copiedMessage.value = t('apiKey.copied')
    setTimeout(() => {
      copiedMessage.value = ''
    }, 2000)
  } catch (e) {
    copiedMessage.value = '✗'
    setTimeout(() => {
      copiedMessage.value = ''
    }, 2000)
  }
}

watch(() => route.params.id, load)
onMounted(() => {
  lookups.ensureLoaded()
  load()
})
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
.details-list { margin: 0; }
.row { display: grid; grid-template-columns: 160px 1fr; gap: .75rem; padding: .45rem 0; }
dt { color: var(--color-on-surface-variant); }
dd { margin: 0; }
.table-wrap { overflow: auto; }
.table { width: 100%; border-collapse: collapse; }
.table th,.table td { text-align: left; padding: .65rem; border-bottom: 1px solid rgba(0,0,0,.06); }
.entity-link { color: var(--color-primary); text-decoration: none; }
.entity-link:hover { text-decoration: underline; }
.edit-form { display: flex; flex-direction: column; gap: .6rem; }
.field { display: flex; flex-direction: column; gap: .3rem; font-size: .9rem; }
.input {
  padding: .5rem .65rem;
  border-radius: .375rem;
  border: 1px solid var(--color-outline-variant);
  background: var(--color-surface-container-lowest);
  color: var(--color-on-surface);
}
.actions { display: flex; justify-content: flex-end; gap: .5rem; }
.btn {
  padding: .45rem .75rem;
  border: none;
  border-radius: .375rem;
  background: var(--color-primary);
  color: var(--color-on-primary);
  cursor: pointer;
}
.btn:disabled { opacity: .6; cursor: not-allowed; }
.btn-secondary { background: var(--color-surface-container); color: var(--color-on-surface); }
.btn-danger { background: var(--color-error); color: white; }
.btn-icon { display: inline-flex; align-items: center; gap: .25rem; }

.hint { color: var(--color-on-surface-variant); font-size: .875rem; margin-bottom: .75rem; }

.api-key-box { 
  background: var(--color-surface-container); 
  border-radius: .5rem; 
  padding: 1rem; 
  margin-top: .5rem;
}

.api-key-warning {
  background: #fff4e5;
  color: #663c00;
  padding: .5rem .75rem;
  border-radius: .375rem;
  margin-bottom: .75rem;
  font-size: .875rem;
  font-weight: 500;
}

.api-key-display {
  display: flex;
  gap: .5rem;
  align-items: center;
}

.api-key-display code {
  flex: 1;
  background: var(--color-surface-container-lowest);
  padding: .5rem .75rem;
  border-radius: .375rem;
  font-family: 'Courier New', monospace;
  font-size: .9rem;
  word-break: break-all;
  border: 1px solid var(--color-outline-variant);
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
  max-width: 500px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
}

.modal-box h3 {
  margin: 0 0 1rem;
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
