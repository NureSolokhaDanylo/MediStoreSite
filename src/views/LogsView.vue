<template>
  <MainLayout>
    <div class="page">
      <div class="toolbar">
        <h1>{{ t('pages.logsTitle') }}</h1>
        <div class="search-controls">
          <input
            v-model.trim="query"
            class="search-input"
            :placeholder="t('pages.logsEntityTypePlaceholder') + ' / Search'"
            @keyup.enter="applyFilters"
          />
          <input v-model.trim="entityType" class="search-input small" :placeholder="t('pages.logsEntityTypePlaceholder')" />
          <input v-model.trim="action" class="search-input small" placeholder="Action" />
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

      <p class="hint">{{ t('pages.logsHint') }}</p>
      <p v-if="error" class="error">{{ error }}</p>

      <div class="table-wrap">
        <table class="table">
          <thead>
            <tr>
              <th>{{ t('fields.id') }}</th>
              <th>{{ t('pages.logsEntityType') }}</th>
              <th>{{ t('pages.logsAction') }}</th>
              <th>{{ t('pages.logsTimestamp') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="!loading && logs.length === 0">
              <td colspan="4">{{ t('pages.noData') }}</td>
            </tr>
            <tr v-for="item in logs" :key="String(item.id ?? Math.random())">
              <td>{{ item.id ?? '-' }}</td>
              <td>{{ readText(item.entityType) }}</td>
              <td>{{ readText(item.action) }}</td>
              <td>{{ formatTime(item.occurredAt) }}</td>
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
import { useI18n } from 'vue-i18n'
import MainLayout from '@/components/layout/MainLayout.vue'
import auditLogsService from '@/services/endpoints/auditLogs'
import type { AuditLog } from '@/types'

const { t } = useI18n()
const loading = ref(false)
const error = ref('')
const query = ref('')
const entityType = ref('Zone')
const action = ref('')
const skip = ref(0)
const take = ref(50)
const totalCount = ref(0)
const logs = ref<AuditLog[]>([])

function asArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : []
}

function readText(value: unknown): string {
  return typeof value === 'string' && value.trim().length > 0 ? value : '-'
}

function formatTime(value: unknown): string {
  if (typeof value !== 'string' || !value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString()
}

async function loadPage(): Promise<void> {
  loading.value = true
  error.value = ''
  try {
    const response = await auditLogsService.getPaged({
      q: query.value || undefined,
      entityType: entityType.value || undefined,
      action: action.value || undefined,
      skip: skip.value,
      take: take.value,
    })
    logs.value = asArray<AuditLog>(response?.items)
    totalCount.value = typeof response?.totalCount === 'number' ? response.totalCount : logs.value.length
  } catch (e: any) {
    error.value = e?.message || t('pages.requestFailed')
    logs.value = []
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
  loadPage()
})
</script>

<style scoped>
.page { max-width: 1400px; }
.toolbar { display: flex; justify-content: space-between; align-items: center; gap: 1rem; margin-bottom: 1rem; }
.search-controls { display: flex; gap: .5rem; align-items: center; }
.search-input { padding: .5rem .75rem; border-radius: .375rem; border: 1px solid var(--color-outline-variant); min-width: 240px; }
.search-input.small { min-width: 160px; }
.take-select { width: 88px; padding: .5rem .65rem; border-radius: .375rem; border: 1px solid var(--color-outline-variant); background: var(--color-surface-container-lowest); color: var(--color-on-surface); }
.btn { padding: .5rem .75rem; border: none; border-radius: .375rem; background: var(--color-primary); color: var(--color-on-primary); cursor: pointer; }
.btn:disabled { opacity: .6; cursor: not-allowed; }
.hint { color: var(--color-on-surface-variant); margin-bottom: .5rem; }
.error { color: var(--color-error); margin-bottom: .75rem; }
.table-wrap { overflow: auto; background: var(--color-surface-container-lowest); border-radius: .75rem; }
.table { width: 100%; border-collapse: collapse; }
.table th, .table td { padding: .75rem; text-align: left; border-bottom: 1px solid rgba(0,0,0,.06); }
.pagination { margin-top: .75rem; display: flex; justify-content: space-between; align-items: center; gap: .75rem; }
</style>
