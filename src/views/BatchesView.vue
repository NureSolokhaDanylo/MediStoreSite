<template>
  <MainLayout>
    <div class="page">
      <div class="toolbar">
        <h1>{{ t('pages.batchesTitle') }}</h1>
        <div class="search-controls">
          <input
            v-model.trim="query"
            class="search-input"
            placeholder="Search batches..."
            @keyup.enter="applyFilters"
          />
          <input v-model.number="take" type="number" min="1" class="take-input" />
          <button class="btn" :disabled="loading" @click="applyFilters">
            {{ t('pages.search') }}
          </button>
        </div>
      </div>

      <p v-if="loading" class="loading">Loading batches...</p>
      <p v-if="error" class="error">{{ error }}</p>

      <div class="table-wrap">
        <table class="table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Batch number</th>
              <th>Quantity</th>
              <th>Expire date</th>
              <th>Date added</th>
              <th>Medicine</th>
              <th>Zone</th>
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
        <button class="btn" :disabled="loading || skip === 0" @click="goPrev">Prev</button>
        <span class="loading">Total: {{ totalCount }} | skip {{ skip }} take {{ take }}</span>
        <button class="btn" :disabled="loading || skip + take >= totalCount" @click="goNext">Next</button>
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

const { t } = useI18n()
const loading = ref(false)
const error = ref('')
const query = ref('')
const skip = ref(0)
const take = ref(50)
const totalCount = ref(0)
const lookups = useLookupsStore()

type BatchRow = Partial<Batch> & Pick<Batch, 'id'>
const batches = ref<BatchRow[]>([])

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
.take-input { width: 88px; padding: .5rem .65rem; border-radius: .375rem; border: 1px solid var(--color-outline-variant); }
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
</style>
