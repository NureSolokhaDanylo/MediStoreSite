<template>
  <MainLayout>
    <div class="page">
      <div class="toolbar">
        <h1>{{ t('pages.zonesTitle') }}</h1>
        <div class="search-controls">
          <input
            v-model.trim="query"
            class="search-input"
            :placeholder="t('pages.zonesSearchPlaceholder')"
            @keyup.enter="applyFilters"
          />
          <input v-model.number="take" type="number" min="1" class="take-input" />
          <button class="btn" :disabled="loading" @click="applyFilters">
            {{ t('pages.search') }}
          </button>
        </div>
      </div>

      <p v-if="error" class="error">{{ error }}</p>

      <div class="table-wrap">
        <table class="table">
          <thead>
            <tr>
              <th>ID</th>
              <th>{{ t('pages.zonesName') }}</th>
              <th>{{ t('pages.zonesDescription') }}</th>
              <th>{{ t('pages.zonesTempRange') }}</th>
              <th>{{ t('pages.zonesHumidRange') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="!loading && zones.length === 0">
              <td colspan="5">{{ t('pages.noData') }}</td>
            </tr>
            <tr v-for="zone in zones" :key="zone.id">
              <td>{{ zone.id }}</td>
              <td>
                <RouterLink
                  :to="{ name: 'zone-details', params: { id: zone.id } }"
                  class="entity-link"
                >
                  {{ zone.name }}
                </RouterLink>
              </td>
              <td>{{ zone.description || '-' }}</td>
              <td>{{ formatRange(zone.tempMin, zone.tempMax) }}</td>
              <td>{{ formatRange(zone.humidMin, zone.humidMax) }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="pagination">
        <button class="btn" :disabled="loading || skip === 0" @click="goPrev">Prev</button>
        <span class="meta">Total: {{ totalCount }} | skip {{ skip }} take {{ take }}</span>
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
import zonesService from '@/services/endpoints/zones'
import type { Zone } from '@/types'

const { t } = useI18n()
const loading = ref(false)
const error = ref('')
const query = ref('')
const skip = ref(0)
const take = ref(50)
const totalCount = ref(0)
type ZoneRow = {
  id: number
  name: string
  description?: string
  tempMin?: number
  tempMax?: number
  humidMin?: number
  humidMax?: number
}
const zones = ref<ZoneRow[]>([])

function asArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : []
}

type ZoneSearchLike = {
  id: number
  name?: string
  description?: string
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
      const all = asArray<Zone>(await zonesService.getAll())
      totalCount.value = all.length
      zones.value = all.slice(skip.value, skip.value + take.value)
      return
    }

    const result = await zonesService.search(query.value, skip.value, take.value)
    const items = asArray<ZoneSearchLike>(result?.items)
    const byId = new Map<number, ZoneRow>()
    for (const item of items) {
      byId.set(item.id, {
        id: item.id,
        name: item.name || '-',
        description: item.description || '',
        tempMin: undefined,
        tempMax: undefined,
        humidMin: undefined,
        humidMax: undefined,
      })
    }
    zones.value = Array.from(byId.values())
    totalCount.value = typeof result?.totalCount === 'number' ? result.totalCount : zones.value.length
  } catch (e: any) {
    error.value = e?.message || t('pages.requestFailed')
    zones.value = []
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

onMounted(() => {
  // Keep list view lightweight; details are on zone-details route.
  loadPage()
})
</script>

<style scoped>
.page { max-width: 1400px; }
.toolbar { display: flex; justify-content: space-between; align-items: center; gap: 1rem; margin-bottom: 1rem; }
.search-controls { display: flex; gap: .5rem; align-items: center; }
.search-input { padding: .5rem .75rem; border-radius: .375rem; border: 1px solid var(--color-outline-variant); min-width: 240px; }
.take-input { width: 88px; padding: .5rem .65rem; border-radius: .375rem; border: 1px solid var(--color-outline-variant); }
.btn { padding: .5rem .75rem; border: none; border-radius: .375rem; background: var(--color-primary); color: var(--color-on-primary); cursor: pointer; }
.btn:disabled { opacity: .6; cursor: not-allowed; }
.error { color: var(--color-error); margin-bottom: .75rem; }
.table-wrap { overflow: auto; background: var(--color-surface-container-lowest); border-radius: .75rem; }
.table { width: 100%; border-collapse: collapse; }
.table th, .table td { padding: .75rem; text-align: left; border-bottom: 1px solid rgba(0,0,0,.06); }
.entity-link { color: var(--color-primary); text-decoration: none; }
.entity-link:hover { text-decoration: underline; }
.pagination { margin-top: .75rem; display: flex; justify-content: space-between; align-items: center; gap: .75rem; }
.meta { color: var(--color-on-surface-variant); }
</style>
