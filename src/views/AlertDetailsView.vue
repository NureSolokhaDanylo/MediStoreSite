<template>
  <MainLayout>
    <div class="page">
      <h1>{{ t('pages.alertsTitle') }}</h1>

      <p v-if="loading" class="hint">{{ t('messages.loadingDetails') }}</p>
      <p v-else-if="error" class="error">{{ error }}</p>

      <template v-else>
        <p v-if="!alert" class="hint">{{ t('pages.noData') }}</p>

        <div v-else class="details-grid">
          <section class="card">
            <h2>{{ t('fields.general') }}</h2>
            <dl class="details-list">
              <div class="row"><dt>{{ t('fields.id') }}</dt><dd>{{ alert.id }}</dd></div>
              <div class="row"><dt>{{ t('fields.type') }}</dt><dd>{{ readType(alert) }}</dd></div>
              <div class="row">
                <dt>{{ t('fields.status') }}</dt>
                <dd>
                  <span class="tone-badge" :class="`tone-${alertTone(alert)}`">
                    {{ toneLabel(alertTone(alert)) }}
                  </span>
                </dd>
              </div>
              <div class="row">
                <dt>{{ t('fields.zone') }}</dt>
                <dd>
                  <RouterLink
                    v-if="readNumericId(alert.zoneId)"
                    :to="{ name: 'zone-details', params: { id: readNumericId(alert.zoneId) } }"
                    class="entity-link"
                  >
                    {{ zoneLabel(alert.zoneId) }}
                  </RouterLink>
                  <span v-else>-</span>
                </dd>
              </div>
              <div class="row">
                <dt>{{ t('entities.batch') }}</dt>
                <dd>
                  <RouterLink
                    v-if="readNumericId(alert.batchId)"
                    :to="{ name: 'batch-details', params: { id: readNumericId(alert.batchId) } }"
                    class="entity-link"
                  >
                    {{ batchLabel(alert.batchId) }}
                  </RouterLink>
                  <span v-else>-</span>
                </dd>
              </div>
              <div class="row"><dt>{{ t('actions.created') }}</dt><dd>{{ formatTime(alert.createdAt) }}</dd></div>
            </dl>
          </section>

          <section class="card">
            <h2>{{ t('pages.alertsTitle') }}</h2>
            <div class="message-list">
              <div
                v-for="(block, index) in parseAlertMessageEntries(alert.message)"
                :key="`entry-${index}`"
                class="message-block"
              >
                <div class="message-head">
                  <strong>{{ block.header }}</strong>
                  <span class="entry-index">#{{ index + 1 }}</span>
                </div>
                <div v-if="block.rows.length > 0" class="message-grid">
                  <template v-for="(row, rowIndex) in block.rows" :key="`row-${index}-${rowIndex}`">
                    <span class="message-label">{{ row.label }}</span>
                    <span>{{ row.value }}</span>
                  </template>
                </div>
              </div>
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
import { useI18n } from 'vue-i18n'
import MainLayout from '@/components/layout/MainLayout.vue'
import alertsService from '@/services/endpoints/alerts'
import batchesService from '@/services/endpoints/batches'
import { useLookupsStore } from '@/stores/lookups'
import type { Alert } from '@/types'

type MessageRow = { label: string; value: string }
type MessageBlock = { header: string; rows: MessageRow[] }

const { t } = useI18n()
const route = useRoute()
const lookups = useLookupsStore()
const loading = ref(false)
const error = ref('')
const alert = ref<Alert | null>(null)
const batchLabelById = ref(new Map<number, string>())

function parseId(value: unknown): number | null {
  const raw = Array.isArray(value) ? value[0] : value
  const id = Number(raw)
  return Number.isInteger(id) && id > 0 ? id : null
}

function readNumericId(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isInteger(value) && value > 0) return value
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value)
    if (Number.isInteger(parsed) && parsed > 0) return parsed
  }
  return undefined
}

function readType(alertValue: Alert): string {
  const sourceType = (alertValue as unknown as Record<string, unknown>).type
  if (typeof sourceType === 'string' && sourceType.trim()) {
    return localizeAlertTypeName(sourceType)
  }
  return alertTypeLabelByCode(alertValue.alertType)
}

function alertTone(alertValue: Alert): 'inactive' | 'warning' | 'alert' {
  if (alertValue.isActive === false) return 'inactive'
  if (alertValue.alertType === 2 || alertValue.alertType === 4) return 'alert'
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

function formatTime(value: unknown): string {
  if (typeof value !== 'string' || !value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString()
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

function parseMessagePart(part: string): MessageBlock {
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
    return { header: 'Alert event', rows: [{ label: 'Details', value: part }] }
  }
  return { header, rows }
}

function parseAlertMessageEntries(value: unknown): MessageBlock[] {
  const formatted = formatAlertMessage(value)
  if (formatted === '-') return [{ header: '-', rows: [] }]

  const parts = formatted
    .split('|')
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => part.replace(/\s+/g, ' ').trim())

  const entries = parts.length > 0 ? parts : [formatted]
  return entries.map((part) => parseMessagePart(part))
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

async function ensureBatchLabel(batchId: unknown): Promise<void> {
  const id = readNumericId(batchId)
  if (!id || batchLabelById.value.has(id)) return
  const batch = await batchesService.getById(id)
  const nextMap = new Map(batchLabelById.value)
  nextMap.set(id, batch.batchNumber || `#${id}`)
  batchLabelById.value = nextMap
}

async function load(): Promise<void> {
  const id = parseId(route.params.id)
  if (id === null) {
    error.value = 'Invalid alert id'
    alert.value = null
    return
  }
  loading.value = true
  error.value = ''
  try {
    const result = await alertsService.getById(id)
    alert.value = result
    await ensureBatchLabel(result.batchId)
  } catch (e: any) {
    error.value = e?.message || t('pages.requestFailed')
    alert.value = null
  } finally {
    loading.value = false
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
.hint { color: var(--color-on-surface-variant); margin-top: .75rem; }
.error { color: var(--color-error); margin-top: .75rem; }
.details-grid {
  margin-top: 1rem;
  display: grid;
  gap: 1rem;
  grid-template-columns: minmax(320px, 460px) 1fr;
}
.card {
  background: var(--color-surface-container-lowest);
  border-radius: .75rem;
  padding: 1rem;
}
.card h2 { margin: 0 0 .75rem; font-size: 1.05rem; }
.details-list { margin: 0; }
.row {
  display: grid;
  grid-template-columns: 130px 1fr;
  gap: .6rem;
  padding: .35rem 0;
}
dt { color: var(--color-on-surface-variant); }
dd { margin: 0; }
.entity-link { color: var(--color-primary); text-decoration: none; }
.entity-link:hover { text-decoration: underline; }
.message-list { display: flex; flex-direction: column; gap: .55rem; }
.message-block {
  border: 1px solid rgba(0, 0, 0, .08);
  border-radius: .55rem;
  background: rgba(0, 0, 0, .015);
  padding: .5rem .6rem;
}
.message-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: .6rem;
  margin-bottom: .35rem;
}
.entry-index {
  font-size: .75rem;
  color: var(--color-on-surface-variant);
}
.message-grid {
  display: grid;
  grid-template-columns: 120px 1fr;
  gap: .2rem .6rem;
  font-size: .84rem;
}
.message-label { color: var(--color-on-surface-variant); }
.tone-badge {
  display: inline-flex;
  align-items: center;
  padding: .2rem .55rem;
  border-radius: 999px;
  font-size: .78rem;
  font-weight: 600;
}
.tone-warning { background: #fff4ce; color: #8a6d1f; }
.tone-alert { background: #fde2e1; color: #b42318; }
.tone-inactive { background: #eceff1; color: #54606c; }
</style>
