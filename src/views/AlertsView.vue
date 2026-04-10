<template>
  <MainLayout>
    <div class="page">
      <div class="toolbar">
        <h1>{{ t('pages.alertsTitle') }}</h1>
        <div class="search-controls">
          <select v-model="activeFilter" class="search-input small">
            <option value="all">{{ t('filters.all') }}</option>
            <option value="active">{{ t('filters.active') }}</option>
            <option value="inactive">{{ t('filters.inactive') }}</option>
          </select>
          <input v-model.trim="zoneIdInput" class="search-input tiny" :placeholder="`${t('fields.zone')} ID`" />
          <input v-model.trim="batchIdInput" class="search-input tiny" :placeholder="`${t('entities.batch')} ID`" />
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
      </div>

      <section v-if="authStore.canGenerateAlertsReport" class="report-section">
        <h2>{{ t('pages.generateReport') }}</h2>
        <p class="report-hint">{{ t('pages.generateReportHint') }}</p>
        <div class="report-controls">
          <label class="report-field">
            <span>{{ t('pages.from') }}</span>
            <input v-model="reportFrom" type="date" class="report-input" />
          </label>
          <label class="report-field">
            <span>{{ t('pages.to') }}</span>
            <input v-model="reportTo" type="date" class="report-input" />
          </label>
          <button class="btn report-btn" :disabled="reportLoading" @click="generateReport">
            {{ reportLoading ? t('messages.generating') : t('pages.generatePdf') }}
          </button>
        </div>
        <p v-if="reportError" class="error">{{ reportError }}</p>
        <p v-if="reportSuccess" class="success">{{ reportSuccess }}</p>
      </section>

      <p v-if="loading" class="hint">{{ t('messages.loadingDetails') }}</p>
      <p v-if="error" class="error">{{ error }}</p>

      <div class="table-wrap">
        <table class="table">
          <thead>
            <tr>
              <th>{{ t('fields.id') }}</th>
              <th>{{ t('fields.type') }}</th>
              <th>{{ t('fields.status') }}</th>
              <th>{{ t('pages.logsAction') }}</th>
              <th>{{ t('fields.zone') }}</th>
              <th>{{ t('entities.batch') }}</th>
              <th>{{ t('actions.created') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="!loading && alerts.length === 0">
              <td colspan="7">{{ t('pages.noData') }}</td>
            </tr>
            <tr v-for="(alert, index) in alerts" :key="rowKey(alert, index)">
              <td>
                <RouterLink
                  v-if="readNumericId(alert.id)"
                  :to="{ name: 'alert-details', params: { id: readNumericId(alert.id) } }"
                  class="entity-link"
                >
                  {{ readNumber(alert.id) }}
                </RouterLink>
                <span v-else>{{ readNumber(alert.id) }}</span>
              </td>
              <td>{{ readType(alert) }}</td>
              <td>
                <span class="tone-badge" :class="`tone-${alertTone(alert)}`">
                  {{ toneLabel(alertTone(alert)) }}
                </span>
              </td>
              <td class="message-cell">
                <div class="message-list">
                  <div
                    v-for="(block, blockIndex) in parseAlertMessageBlocks(alert.message)"
                    :key="`msg-${rowKey(alert, index)}-${blockIndex}`"
                    class="message-block"
                  >
                    <div class="message-head">
                      <strong>{{ block.header }}</strong>
                      <span v-if="block.count > 1" class="repeat-badge">×{{ block.count }}</span>
                    </div>
                    <div v-if="block.rows.length > 0" class="message-grid">
                      <template v-for="(row, rowIndex) in block.rows" :key="`row-${rowIndex}`">
                        <span class="message-label">{{ row.label }}</span>
                        <span>{{ row.value }}</span>
                      </template>
                    </div>
                  </div>
                </div>
              </td>
              <td>
                <RouterLink
                  v-if="readNumericId(alert.zoneId)"
                  :to="{ name: 'zone-details', params: { id: readNumericId(alert.zoneId) } }"
                  class="entity-link"
                >
                  {{ zoneLabel(alert.zoneId) }}
                </RouterLink>
                <span v-else>-</span>
              </td>
              <td>
                <RouterLink
                  v-if="readNumericId(alert.batchId)"
                  :to="{ name: 'batch-details', params: { id: readNumericId(alert.batchId) } }"
                  class="entity-link"
                >
                  {{ batchLabel(alert.batchId) }}
                </RouterLink>
                <span v-else>-</span>
              </td>
              <td>{{ formatTime(alert.createdAt) }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="pagination">
        <button class="btn" :disabled="loading || skip === 0" @click="goPrev">{{ t('actions.prev') }}</button>
        <span class="hint">Total: {{ totalCount }} | skip {{ skip }} take {{ take }}</span>
        <button class="btn" :disabled="loading || skip + take >= totalCount" @click="goNext">{{ t('actions.next') }}</button>
      </div>
    </div>
  </MainLayout>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { useI18n } from 'vue-i18n'
import MainLayout from '@/components/layout/MainLayout.vue'
import alertsService from '@/services/endpoints/alerts'
import batchesService from '@/services/endpoints/batches'
import { useAuthStore } from '@/stores/auth'
import { useLookupsStore } from '@/stores/lookups'
import type { Alert } from '@/types'

const { t } = useI18n()
const authStore = useAuthStore()
const loading = ref(false)
const reportLoading = ref(false)
const error = ref('')
const reportError = ref('')
const reportSuccess = ref('')
const lookups = useLookupsStore()
const batchLabelById = ref(new Map<number, string>())

const alerts = ref<Alert[]>([])
const skip = ref(0)
const take = ref(50)
const totalCount = ref(0)

const activeFilter = ref<'all' | 'active' | 'inactive'>('all')
const zoneIdInput = ref('')
const batchIdInput = ref('')

const reportFrom = ref('')
const reportTo = ref('')
type MessageRow = { label: string; value: string }
type MessageBlock = { header: string; rows: MessageRow[]; count: number }

function asArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : []
}

function readNumber(value: unknown): string {
  return typeof value === 'number' ? String(value) : '-'
}

function rowKey(alert: Alert, index: number): string {
  const idValue = (alert as unknown as Record<string, unknown>).id
  return typeof idValue === 'number' || typeof idValue === 'string'
    ? `alert-${String(idValue)}`
    : `alert-row-${index}`
}

function readNumericId(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isInteger(value) && value > 0) return value
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value)
    if (Number.isInteger(parsed) && parsed > 0) return parsed
  }
  return undefined
}

function readType(alert: Alert): string {
  const value = (alert as unknown as Record<string, unknown>).type
  if (typeof value === 'string' && value.trim().length > 0) {
    return localizeAlertTypeName(value)
  }
  if (typeof alert.alertType === 'number') {
    return alertTypeLabelByCode(alert.alertType)
  }
  return '-'
}

function alertTone(alert: Alert): 'inactive' | 'warning' | 'alert' {
  if (alert.isActive === false) return 'inactive'
  if (alert.alertType === 2 || alert.alertType === 4) return 'alert'
  return 'warning'
}

function toneLabel(tone: 'inactive' | 'warning' | 'alert'): string {
  if (tone === 'inactive') return t('alertStatus.inactive')
  if (tone === 'alert') return t('alertStatus.alert')
  return t('alertStatus.warning')
}

function alertTypeLabelByCode(typeCode: number): string {
  if (typeCode === 1) return t('alertTypes.expirationSoon')
  if (typeCode === 2) return t('alertTypes.expired')
  if (typeCode === 3) return t('alertTypes.batchConditionWarning')
  if (typeCode === 4) return t('alertTypes.zoneConditionAlert')
  return t('alertTypes.unknownType', { type: typeCode })
}

function localizeAlertTypeName(value: string): string {
  const normalized = value.trim().toLowerCase().replace(/\s+/g, ' ')
  if (normalized === 'expiration soon') return t('alertTypes.expirationSoon')
  if (normalized === 'expired') return t('alertTypes.expired')
  if (normalized === 'batch condition warning') return t('alertTypes.batchConditionWarning')
  if (normalized === 'zone condition alert') return t('alertTypes.zoneConditionAlert')
  return value
}

function formatAlertMessage(value: unknown): string {
  if (typeof value !== 'string') return '-'
  const trimmed = value.trim()
  if (!trimmed) return '-'
  const normalized = trimmed
    .replace(/_/g, ' ')
    .replace(/([a-zа-яіїєґ])([A-ZА-ЯІЇЄҐ])/g, '$1 $2')
    .replace(/\s*;\s*/g, '; ')
    .replace(/\s*,\s*/g, ', ')
    .replace(/\s+/g, ' ')
  return normalized.charAt(0).toUpperCase() + normalized.slice(1)
}

function parseAlertMessageBlocks(value: unknown): MessageBlock[] {
  const formatted = formatAlertMessage(value)
  if (formatted === '-') return [{ header: '-', rows: [], count: 1 }]

  const parts = formatted
    .split('|')
    .map((part) => part.trim())
    .filter(Boolean)
  const normalizedParts = (parts.length > 0 ? parts : [formatted]).map((part) =>
    part.replace(/\s+/g, ' ').trim()
  )

  const grouped = new Map<string, number>()
  for (const part of normalizedParts) {
    grouped.set(part, (grouped.get(part) || 0) + 1)
  }

  return Array.from(grouped.entries()).map(([part, count]) => parseMessagePart(part, count))
}

function parseMessagePart(part: string, count: number): MessageBlock {
  const batchMatch = part.match(/Batch\s+(\d+)\s+\(#([^)]+)\)\s+for\s+Medicine:\s*([^;]+);?/i)
  const tempMatch = part.match(
    /Temp\s+dev=([-\d.]+),\s*Last=([-\d.]+)\s*at\s*([^;(]+?)(?:\s*\(sensor\s*(\d+)\))?(?:;|$)/i
  )
  const humidityMatch = part.match(
    /Humid(?:ity)?\s+dev=([-\d.]+),\s*Last=([-\d.]+)\s*at\s*([^;(]+?)(?:\s*\(sensor\s*(\d+)\))?(?:;|$)/i
  )

  const rows: MessageRow[] = []
  let header = 'Alert event'

  if (batchMatch) {
    const batchNumber = batchMatch[2] ?? '-'
    const batchId = batchMatch[1] ?? '-'
    const medicineName = (batchMatch[3] ?? '-').trim()
    header = `Batch #${batchNumber}`
    rows.push({ label: 'Batch ID', value: batchId })
    rows.push({ label: 'Medicine', value: medicineName || '-' })
  }

  if (tempMatch) {
    const deviation = tempMatch[1] ?? '-'
    const last = tempMatch[2] ?? '-'
    const measuredAt = (tempMatch[3] ?? '-').trim()
    const sensor = tempMatch[4]
    rows.push({ label: 'Temp deviation', value: `${deviation} °C` })
    rows.push({ label: 'Last temperature', value: `${last} °C` })
    rows.push({ label: 'Measured at', value: measuredAt || '-' })
    if (sensor) rows.push({ label: 'Sensor', value: `#${sensor}` })
  } else if (humidityMatch) {
    const deviation = humidityMatch[1] ?? '-'
    const last = humidityMatch[2] ?? '-'
    const measuredAt = (humidityMatch[3] ?? '-').trim()
    const sensor = humidityMatch[4]
    rows.push({ label: 'Humidity deviation', value: `${deviation} %` })
    rows.push({ label: 'Last humidity', value: `${last} %` })
    rows.push({ label: 'Measured at', value: measuredAt || '-' })
    if (sensor) rows.push({ label: 'Sensor', value: `#${sensor}` })
  }

  if (rows.length === 0) {
    return { header: 'Alert event', rows: [{ label: 'Details', value: part }], count }
  }

  return { header, rows, count }
}

function formatTime(value: unknown): string {
  if (typeof value !== 'string' || !value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString()
}

function readOptionalNumberFromInput(value: string): number | undefined {
  const normalized = value.trim()
  if (!normalized) return undefined
  const parsed = Number(normalized)
  if (!Number.isInteger(parsed) || parsed <= 0) return undefined
  return parsed
}

function zoneLabel(zoneId: unknown): string {
  const id = readNumericId(zoneId)
  if (!id) return '-'
  return lookups.zoneNameById.get(id) ?? `#${id}`
}

function batchLabel(batchId: unknown): string {
  const id = readNumericId(batchId)
  if (!id) return '-'
  return batchLabelById.value.get(id) ?? `#${id}`
}

async function hydrateBatchLabels(items: Alert[]): Promise<void> {
  const ids = new Set<number>()
  for (const item of items) {
    const id = readNumericId(item.batchId)
    if (id && !batchLabelById.value.has(id)) ids.add(id)
  }
  if (ids.size === 0) return

  const results = await Promise.allSettled(
    Array.from(ids).map(async (id) => {
      const batch = await batchesService.getById(id)
      return { id, label: batch.batchNumber || `#${id}` }
    })
  )
  const nextMap = new Map(batchLabelById.value)
  for (const result of results) {
    if (result.status === 'fulfilled') {
      nextMap.set(result.value.id, result.value.label)
    }
  }
  batchLabelById.value = nextMap
}

function clientFilter(items: Alert[]): Alert[] {
  const zoneId = readOptionalNumberFromInput(zoneIdInput.value)
  const batchId = readOptionalNumberFromInput(batchIdInput.value)
  return items.filter((item) => {
    const activeMatch =
      activeFilter.value === 'all' ||
      (activeFilter.value === 'active' && item.isActive === true) ||
      (activeFilter.value === 'inactive' && item.isActive === false)

    const zoneMatch = typeof zoneId !== 'number' || item.zoneId === zoneId
    const batchMatch = typeof batchId !== 'number' || item.batchId === batchId
    return activeMatch && zoneMatch && batchMatch
  })
}

async function loadPage(): Promise<void> {
  loading.value = true
  error.value = ''
  try {
    const isActive =
      activeFilter.value === 'all' ? undefined : activeFilter.value === 'active'
    const zoneId = readOptionalNumberFromInput(zoneIdInput.value)
    const batchId = readOptionalNumberFromInput(batchIdInput.value)

    const paged = await alertsService.getFilteredAlerts({
      Skip: skip.value,
      Take: take.value,
      IsActive: isActive,
      ZoneId: zoneId,
      BatchId: batchId,
    })

    alerts.value = asArray<Alert>(paged?.items)
    await hydrateBatchLabels(alerts.value)
    totalCount.value = typeof paged?.totalCount === 'number' ? paged.totalCount : alerts.value.length
  } catch (primaryError: any) {
    try {
      const all = asArray<Alert>(await alertsService.getAllAlerts())
      const filtered = clientFilter(all)
      totalCount.value = filtered.length
      alerts.value = filtered.slice(skip.value, skip.value + take.value)
      await hydrateBatchLabels(alerts.value)
    } catch (fallbackError: any) {
      error.value =
        fallbackError?.message ||
        primaryError?.message ||
        t('pages.requestFailed')
      alerts.value = []
      totalCount.value = 0
    }
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

function downloadBlob(data: Blob, filename: string): void {
  const objectUrl = URL.createObjectURL(data)
  const anchor = document.createElement('a')
  anchor.href = objectUrl
  anchor.download = filename
  document.body.appendChild(anchor)
  anchor.click()
  document.body.removeChild(anchor)
  URL.revokeObjectURL(objectUrl)
}

function fileNameFromDisposition(value?: string): string | undefined {
  if (!value) return undefined
  const simpleMatch = value.match(/filename="?([^"]+)"?/i)
  return simpleMatch?.[1]
}

function asDateTime(value: string): string {
  if (!value) return value
  return value.length === 10 ? `${value}T00:00:00` : value
}

async function generateReport(): Promise<void> {
  reportLoading.value = true
  reportError.value = ''
  reportSuccess.value = ''
  try {
    const result = await alertsService.generateAlertsReport({
      from: reportFrom.value ? asDateTime(reportFrom.value) : undefined,
      to: reportTo.value ? asDateTime(reportTo.value) : undefined,
    })
    const contentType = result.contentType.toLowerCase()

    if (contentType.includes('application/json') || contentType.startsWith('text/')) {
      const text = await result.data.text()
      let summary = text.trim()
      try {
        const parsed = JSON.parse(text)
        summary = JSON.stringify(parsed)
      } catch {
        // leave text summary as-is
      }
      reportSuccess.value = `Report generated successfully: ${summary.slice(0, 220)}`
      return
    }

    const defaultName = `alerts-report-${new Date().toISOString().slice(0, 10)}`
    const extension = contentType.includes('pdf') ? '.pdf' : '.bin'
    const filename = fileNameFromDisposition(result.contentDisposition) || `${defaultName}${extension}`
    downloadBlob(result.data, filename)
    reportSuccess.value = `Report generated successfully. Download started (${filename}).`
  } catch (e: any) {
    reportError.value = e?.message || t('pages.requestFailed')
  } finally {
    reportLoading.value = false
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

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
}

.search-controls {
  display: flex;
  gap: .5rem;
  align-items: center;
}

.report-section {
  background: var(--color-surface-container-lowest);
  border-radius: .75rem;
  padding: 1rem;
  margin-bottom: 1rem;
}

.report-section h2 {
  margin: 0 0 .25rem;
  font-size: 1.05rem;
}

.report-hint {
  color: var(--color-on-surface-variant);
  font-size: .875rem;
  margin: 0 0 .75rem;
}

.report-controls {
  display: flex;
  gap: 1rem;
  align-items: flex-end;
  flex-wrap: wrap;
}

.report-field {
  display: flex;
  flex-direction: column;
  gap: .25rem;
  font-size: .875rem;
  color: var(--color-on-surface-variant);
}

.report-input {
  padding: .5rem .75rem;
  border-radius: .375rem;
  border: 1px solid var(--color-outline-variant);
  background: var(--color-surface-container-lowest);
  color: var(--color-on-surface);
  min-width: 150px;
}

.report-btn {
  height: 38px;
}

.search-input {
  padding: .5rem .75rem;
  border-radius: .375rem;
  border: 1px solid var(--color-outline-variant);
  min-width: 180px;
}

.search-input.small {
  min-width: 130px;
}

.search-input.tiny {
  min-width: 100px;
}

.take-select {
  width: 88px;
  padding: .5rem .65rem;
  border-radius: .375rem;
  border: 1px solid var(--color-outline-variant);
  background: var(--color-surface-container-lowest);
  color: var(--color-on-surface);
}

.btn {
  padding: .5rem .75rem;
  border: none;
  border-radius: .375rem;
  background: var(--color-primary);
  color: var(--color-on-primary);
  cursor: pointer;
}

.btn:disabled {
  opacity: .6;
  cursor: not-allowed;
}

.hint {
  color: var(--color-on-surface-variant);
}

.error {
  color: var(--color-error);
  margin-bottom: .75rem;
}

.success {
  color: var(--color-primary);
  margin-bottom: .75rem;
}

.table-wrap {
  overflow: auto;
  background: var(--color-surface-container-lowest);
  border-radius: .75rem;
}

.table {
  width: 100%;
  border-collapse: collapse;
}

.table th, .table td {
  padding: .75rem;
  text-align: left;
  border-bottom: 1px solid rgba(0,0,0,.06);
}

.message-cell {
  max-width: 520px;
  white-space: normal;
}

.message-list {
  display: flex;
  flex-direction: column;
  gap: .55rem;
}

.message-block {
  border: 1px solid rgba(0, 0, 0, .08);
  border-radius: .55rem;
  background: rgba(0, 0, 0, .015);
  padding: .5rem .6rem;
}

.message-head {
  display: flex;
  align-items: center;
  gap: .5rem;
  margin-bottom: .35rem;
}

.repeat-badge {
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  background: var(--color-primary-container);
  color: var(--color-on-primary-container);
  padding: .1rem .45rem;
  font-size: .72rem;
  font-weight: 700;
}

.message-grid {
  display: grid;
  grid-template-columns: 120px 1fr;
  gap: .2rem .6rem;
  font-size: .84rem;
}

.message-label {
  color: var(--color-on-surface-variant);
}

.entity-link {
  color: var(--color-primary);
  text-decoration: none;
}

.entity-link:hover {
  text-decoration: underline;
}

.tone-badge {
  display: inline-flex;
  align-items: center;
  padding: .2rem .55rem;
  border-radius: 999px;
  font-size: .78rem;
  font-weight: 600;
}

.tone-warning {
  background: #fff4ce;
  color: #8a6d1f;
}

.tone-alert {
  background: #fde2e1;
  color: #b42318;
}

.tone-inactive {
  background: #eceff1;
  color: #54606c;
}

.pagination {
  margin-top: .75rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: .75rem;
}
</style>
