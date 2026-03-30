<template>
  <MainLayout>
    <div class="page">
      <h1>{{ t('pages.batchDetailsTitle') }}</h1>

      <p v-if="loading" class="loading">Loading batch details...</p>
      <p v-else-if="error" class="error">{{ error }}</p>

      <template v-else>
        <p v-if="!batch" class="empty">{{ t('pages.noData') }}</p>

        <div v-else class="details-grid">
          <section class="card">
            <h2>General</h2>
            <dl class="details-list">
              <div class="row">
                <dt>ID</dt>
                <dd>{{ batch.id }}</dd>
              </div>
              <div class="row">
                <dt>Batch number</dt>
                <dd>{{ batch.batchNumber }}</dd>
              </div>
              <div class="row">
                <dt>Quantity</dt>
                <dd>{{ batch.quantity }}</dd>
              </div>
              <div class="row">
                <dt>Medicine</dt>
                <dd>
                  <RouterLink
                    :to="{ name: 'medicine-details', params: { id: batch.medicineId } }"
                    class="entity-link"
                  >
                    {{ medicineLabel(batch.medicineId) }}
                  </RouterLink>
                </dd>
              </div>
              <div class="row">
                <dt>Zone</dt>
                <dd>
                  <RouterLink :to="{ name: 'zone-details', params: { id: batch.zoneId } }" class="entity-link">
                    {{ zoneLabel(batch.zoneId) }}
                  </RouterLink>
                </dd>
              </div>
            </dl>
          </section>

          <section class="card">
            <h2>Dates</h2>
            <div class="table-wrap">
              <table class="table">
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>Value</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Date added</td>
                    <td>{{ formatDate(batch.dateAdded) }}</td>
                  </tr>
                  <tr>
                    <td>Expire date</td>
                    <td>{{ formatDate(batch.expireDate) }}</td>
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
import batchesService from '@/services/endpoints/batches'
import type { Batch } from '@/types'
import { useI18n } from 'vue-i18n'
import { useLookupsStore } from '@/stores/lookups'

const { t } = useI18n()
const route = useRoute()

const loading = ref(false)
const error = ref('')
const batch = ref<Batch | null>(null)
const lookups = useLookupsStore()

function parseRouteId(value: unknown): number | null {
  const raw = Array.isArray(value) ? value[0] : value
  if (typeof raw !== 'string' || raw.trim() === '') return null

  const id = Number(raw)
  if (!Number.isInteger(id) || id <= 0) return null

  return id
}

function formatDate(value: string): string {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString()
}

function medicineLabel(medicineId: number): string {
  return lookups.medicineNameById.get(medicineId) ?? `#${medicineId}`
}

function zoneLabel(zoneId: number): string {
  return lookups.zoneNameById.get(zoneId) ?? `#${zoneId}`
}

async function loadBatchDetails(): Promise<void> {
  const id = parseRouteId(route.params.id)
  if (id === null) {
    error.value = 'Invalid batch id'
    batch.value = null
    loading.value = false
    return
  }

  loading.value = true
  error.value = ''
  batch.value = null

  try {
    batch.value = await batchesService.getById(id)
  } catch (e: any) {
    error.value = e?.message || t('pages.requestFailed')
    batch.value = null
  } finally {
    loading.value = false
  }
}

watch(
  () => route.params.id,
  () => {
    loadBatchDetails()
  },
)

onMounted(() => {
  lookups.ensureLoaded()
  loadBatchDetails()
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
</style>
