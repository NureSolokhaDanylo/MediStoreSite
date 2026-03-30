<template>
  <MainLayout>
    <div class="page">
      <div class="toolbar">
        <h1>{{ t('pages.sensorsTitle') }}</h1>
        <div class="search-controls">
          <input
            v-model.trim="query"
            class="search-input"
            placeholder="Search sensors..."
            @keyup.enter="applyFilters"
          />
          <select v-model.number="sensorType" class="select-input">
            <option :value="0">All types</option>
            <option :value="1">Temperature</option>
            <option :value="2">Humidity</option>
          </select>
          <select v-model="isOnFilter" class="select-input">
            <option value="">All states</option>
            <option value="on">On</option>
            <option value="off">Off</option>
          </select>
          <select v-model="zoneIdFilter" class="select-input">
            <option value="">All zones</option>
            <option v-for="zone in lookups.zones" :key="zone.id" :value="zone.id">
              {{ zone.name }}
            </option>
          </select>
          <input v-model.number="take" type="number" min="1" class="take-input" />
          <button class="btn" :disabled="loading" @click="applyFilters">Apply</button>
        </div>
      </div>

      <p v-if="loading" class="hint">Loading sensors...</p>
      <p v-if="error" class="error">{{ error }}</p>

      <div class="table-wrap">
        <table class="table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name / Serial</th>
              <th>Type</th>
              <th>Zone</th>
              <th>Status</th>
              <th>Current value</th>
              <th>Last update</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="!loading && sensors.length === 0">
              <td colspan="7">{{ t('pages.noData') }}</td>
            </tr>
            <tr v-for="sensor in sensors" :key="String(sensor.id)">
              <td>{{ sensor.id }}</td>
              <td>
                <RouterLink
                  v-if="typeof sensor.id === 'number'"
                  :to="{ name: 'sensor-details', params: { id: sensor.id } }"
                  class="entity-link"
                >
                  {{ sensor.label }}
                </RouterLink>
                <span v-else>{{ sensor.label }}</span>
              </td>
              <td>{{ sensor.type }}</td>
              <td>
                <RouterLink
                  v-if="typeof sensor.zoneId === 'number'"
                  :to="{ name: 'zone-details', params: { id: sensor.zoneId } }"
                  class="entity-link"
                >
                  {{ sensor.zone }}
                </RouterLink>
                <span v-else>{{ sensor.zone }}</span>
              </td>
              <td>
                <span :class="sensor.on ? 'status-on' : 'status-off'">
                  {{ sensor.on ? 'On' : 'Off' }}
                </span>
              </td>
              <td>{{ sensor.currentValue }}</td>
              <td>{{ sensor.lastUpdate }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="pagination">
        <button class="btn" :disabled="loading || skip === 0" @click="goPrev">Prev</button>
        <span class="hint">Total: {{ totalCount }} | skip {{ skip }} take {{ take }}</span>
        <button class="btn" :disabled="loading || skip + take >= totalCount" @click="goNext">Next</button>
      </div>
    </div>
  </MainLayout>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { useI18n } from 'vue-i18n'
import MainLayout from '@/components/layout/MainLayout.vue'
import sensorsService from '@/services/endpoints/sensors'
import { useLookupsStore } from '@/stores/lookups'

type SensorRow = {
  id: number | string
  label: string
  type: string
  sensorTypeCode?: number
  zone: string
  zoneId?: number
  on: boolean
  currentValue: string
  lastUpdate: string
}

const { t } = useI18n()
const loading = ref(false)
const error = ref('')
const query = ref('')
const skip = ref(0)
const take = ref(50)
const totalCount = ref(0)
const sensorType = ref(0)
const isOnFilter = ref('')
const zoneIdFilter = ref('')
const sensors = ref<SensorRow[]>([])
const lookups = useLookupsStore()

function asRecord(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === 'object' ? (value as Record<string, unknown>) : null
}

function asArray(value: unknown): unknown[] {
  if (Array.isArray(value)) return value
  const record = asRecord(value)
  if (!record) return []

  const candidates = [record.items, record.data, record.result, record.sensors]
  for (const candidate of candidates) {
    if (Array.isArray(candidate)) return candidate
  }

  const nestedData = asRecord(record.data)
  if (nestedData?.items && Array.isArray(nestedData.items)) {
    return nestedData.items
  }

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

function bool(value: unknown): boolean {
  if (typeof value === 'boolean') return value
  if (typeof value === 'number') return value !== 0
  if (typeof value === 'string') return ['true', '1', 'on', 'yes'].includes(value.toLowerCase())
  return false
}

function formatDate(value: unknown): string {
  if (typeof value !== 'string' || !value) return '-'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString()
}

function sensorTypeLabel(value: unknown): string {
  if (value === 1 || value === '1') return 'Temperature'
  if (value === 2 || value === '2') return 'Humidity'
  return text(value)
}

function sensorTypeCode(value: unknown): number | undefined {
  if (value === 1 || value === '1') return 1
  if (value === 2 || value === '2') return 2
  return undefined
}

function numberOrNull(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value)
    if (Number.isFinite(parsed)) return parsed
  }
  return null
}

function formatCurrentValue(typeCode: number | undefined, value: unknown, isOn: boolean): string {
  if (!isOn) return '-'
  const numeric = numberOrNull(value)
  if (numeric === null) return '-'
  if (typeCode === 1) return `${numeric.toFixed(1)} °C`
  if (typeCode === 2) return `${numeric.toFixed(1)} %`
  return String(numeric)
}

function zoneLabel(zoneIdValue: unknown, fallback?: unknown): string {
  if (typeof zoneIdValue === 'number') {
    return lookups.zoneNameById.get(zoneIdValue) ?? `#${zoneIdValue}`
  }
  if (typeof zoneIdValue === 'string' && zoneIdValue.trim()) {
    const parsed = Number(zoneIdValue)
    if (Number.isInteger(parsed)) {
      return lookups.zoneNameById.get(parsed) ?? `#${parsed}`
    }
  }
  return text(fallback)
}

function normalizeSensor(item: unknown): SensorRow | null {
  const row = asRecord(item)
  if (!row) return null

  const id = row.id ?? row.sensorId ?? row.serialNumber
  const label = row.name ?? row.serialNumber ?? row.label
  const rawType = row.sensorType ?? row.type
  const rawZoneId = row.zoneId
  const zoneIdNumber = typeof rawZoneId === 'number'
    ? rawZoneId
    : typeof rawZoneId === 'string' && Number.isInteger(Number(rawZoneId))
      ? Number(rawZoneId)
      : undefined
  const zone = zoneLabel(rawZoneId, row.zoneName)
  const on = row.isOn ?? row.isActive ?? row.enabled
  const lastValue = row.lastValue ?? row.value
  const lastUpdate = row.lastUpdate ?? row.updatedAt ?? row.timeStamp
  const typeCode = sensorTypeCode(rawType)
  const isOn = bool(on)
  return {
    id: typeof id === 'number' ? id : text(id),
    label: text(label),
    type: sensorTypeLabel(rawType),
    sensorTypeCode: typeCode,
    zone: text(zone),
    zoneId: zoneIdNumber,
    on: isOn,
    currentValue: formatCurrentValue(typeCode, lastValue, isOn),
    lastUpdate: formatDate(lastUpdate),
  }
}

async function loadSensors(): Promise<void> {
  loading.value = true
  error.value = ''
  try {
    const parsedZoneId = Number(zoneIdFilter.value)
    const response = await sensorsService.getPaged({
      q: query.value || undefined,
      skip: skip.value,
      take: take.value,
      sensorType: sensorType.value > 0 ? sensorType.value : undefined,
      isOn: isOnFilter.value ? isOnFilter.value === 'on' : undefined,
      zoneId: Number.isInteger(parsedZoneId) && parsedZoneId > 0 ? parsedZoneId : undefined,
    })
    const rows = asArray(response?.items)
      .map((item) => normalizeSensor(item))
      .filter((item): item is SensorRow => item !== null)
    sensors.value = rows
    totalCount.value = typeof response?.totalCount === 'number' ? response.totalCount : rows.length
  } catch (e: any) {
    error.value = e?.message || t('pages.requestFailed')
    sensors.value = []
    totalCount.value = 0
  } finally {
    loading.value = false
  }
}

function applyFilters(): void {
  skip.value = 0
  loadSensors()
}

function goPrev(): void {
  if (skip.value === 0) return
  skip.value = Math.max(0, skip.value - take.value)
  loadSensors()
}

function goNext(): void {
  if (skip.value + take.value >= totalCount.value) return
  skip.value += take.value
  loadSensors()
}

onMounted(() => {
  lookups.ensureLoaded()
  loadSensors()
})
</script>

<style scoped>
.page { max-width: 1400px; }
.toolbar { display: flex; justify-content: space-between; align-items: center; gap: 1rem; margin-bottom: 1rem; }
.search-controls { display: flex; gap: .5rem; align-items: center; }
.search-input { padding: .5rem .75rem; border-radius: .375rem; border: 1px solid var(--color-outline-variant); min-width: 240px; }
.select-input { padding: .5rem .65rem; border-radius: .375rem; border: 1px solid var(--color-outline-variant); background: var(--color-surface-container-lowest); color: var(--color-on-surface); }
.take-input { width: 88px; padding: .5rem .65rem; border-radius: .375rem; border: 1px solid var(--color-outline-variant); }
.btn { padding: .5rem .75rem; border: none; border-radius: .375rem; background: var(--color-primary); color: var(--color-on-primary); cursor: pointer; }
.btn:disabled { opacity: .6; cursor: not-allowed; }
.hint { color: var(--color-on-surface-variant); margin-bottom: .5rem; }
.error { color: var(--color-error); margin-bottom: .75rem; }
.table-wrap { overflow: auto; background: var(--color-surface-container-lowest); border-radius: .75rem; }
.table { width: 100%; border-collapse: collapse; }
.table th, .table td { padding: .75rem; text-align: left; border-bottom: 1px solid rgba(0,0,0,.06); }
.entity-link { color: var(--color-primary); text-decoration: none; }
.entity-link:hover { text-decoration: underline; }
.status-on { color: #0f8b4c; font-weight: 600; }
.status-off { color: #b42318; font-weight: 600; }
.pagination { margin-top: .75rem; display: flex; justify-content: space-between; align-items: center; gap: .75rem; }
</style>
