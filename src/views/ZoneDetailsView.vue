<template>
  <MainLayout>
    <div class="page">
      <h1>Zone details</h1>

      <p v-if="loading" class="loading">Loading zone details...</p>
      <p v-else-if="error" class="error">{{ error }}</p>
      <p v-if="successMessage" class="success">{{ successMessage }}</p>

      <template v-else>
        <p v-if="!zone" class="empty">{{ t('pages.noData') }}</p>

        <div v-else class="details-grid">
          <section class="card">
            <div class="card-head">
              <h2>General</h2>
              <button v-if="!editing" class="btn btn-secondary" @click="startEdit">Edit</button>
            </div>
            <dl v-if="!editing" class="details-list">
              <div class="row"><dt>ID</dt><dd>{{ zone.id }}</dd></div>
              <div class="row"><dt>Name</dt><dd>{{ zone.name }}</dd></div>
              <div class="row"><dt>Description</dt><dd>{{ zone.description || '-' }}</dd></div>
            </dl>
            <div v-else class="edit-form">
              <label class="field"><span>Name</span><input v-model.trim="editForm.name" class="input" /></label>
              <label class="field"><span>Description</span><textarea v-model.trim="editForm.description" class="input textarea" /></label>
              <div class="grid-two">
                <label class="field"><span>Temp min</span><input v-model.number="editForm.tempMin" type="number" step="0.1" class="input" /></label>
                <label class="field"><span>Temp max</span><input v-model.number="editForm.tempMax" type="number" step="0.1" class="input" /></label>
                <label class="field"><span>Humidity min</span><input v-model.number="editForm.humidMin" type="number" step="0.1" class="input" /></label>
                <label class="field"><span>Humidity max</span><input v-model.number="editForm.humidMax" type="number" step="0.1" class="input" /></label>
              </div>
              <div class="actions">
                <button class="btn btn-secondary" :disabled="saving" @click="cancelEdit">Cancel</button>
                <button class="btn" :disabled="saving" @click="saveEdit">Save</button>
              </div>
            </div>
          </section>

          <section class="card">
            <h2>Limits</h2>
            <div class="table-wrap">
              <table class="table">
                <thead><tr><th>Metric</th><th>Min</th><th>Max</th></tr></thead>
                <tbody>
                  <tr><td>Temperature</td><td>{{ zone.tempMin }}</td><td>{{ zone.tempMax }}</td></tr>
                  <tr><td>Humidity</td><td>{{ zone.humidMin }}</td><td>{{ zone.humidMax }}</td></tr>
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
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import MainLayout from '@/components/layout/MainLayout.vue'
import zonesService from '@/services/endpoints/zones'
import type { Zone } from '@/types'

const { t } = useI18n()
const route = useRoute()
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

function parseId(value: unknown): number | null {
  const raw = Array.isArray(value) ? value[0] : value
  const id = Number(raw)
  return Number.isInteger(id) && id > 0 ? id : null
}

async function load(): Promise<void> {
  const id = parseId(route.params.id)
  if (id === null) {
    error.value = 'Invalid zone id'
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

function isValidNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

async function saveEdit(): Promise<void> {
  if (!zone.value) return
  error.value = ''
  successMessage.value = ''
  if (!editForm.value.name.trim()) {
    error.value = 'Name is required'
    return
  }
  if (
    !isValidNumber(editForm.value.tempMin) ||
    !isValidNumber(editForm.value.tempMax) ||
    !isValidNumber(editForm.value.humidMin) ||
    !isValidNumber(editForm.value.humidMax)
  ) {
    error.value = 'All limits must be valid numbers'
    return
  }
  if (editForm.value.tempMin > editForm.value.tempMax) {
    error.value = 'Temperature min must be less than or equal to max'
    return
  }
  if (editForm.value.humidMin > editForm.value.humidMax) {
    error.value = 'Humidity min must be less than or equal to max'
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
    successMessage.value = 'Zone updated'
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
.details-list { margin: 0; }
.row { display: grid; grid-template-columns: 160px 1fr; gap: .75rem; padding: .45rem 0; }
dt { color: var(--color-on-surface-variant); }
dd { margin: 0; }
.table-wrap { overflow: auto; }
.table { width: 100%; border-collapse: collapse; }
.table th,.table td { text-align: left; padding: .65rem; border-bottom: 1px solid rgba(0,0,0,.06); }
.edit-form { display: flex; flex-direction: column; gap: .6rem; }
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
.actions { display: flex; justify-content: flex-end; gap: .5rem; }
.btn {
  padding: .45rem .75rem;
  border: none;
  border-radius: .375rem;
  background: var(--color-primary);
  color: var(--color-on-primary);
  cursor: pointer;
}
.btn-secondary { background: var(--color-surface-container); color: var(--color-on-surface); }
</style>
