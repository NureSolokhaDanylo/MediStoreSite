<template>
  <MainLayout>
    <div class="page">
      <div class="toolbar">
        <h1>{{ t('pages.settingsTitle') }}</h1>
        <button class="btn" :disabled="loading || saving" @click="loadSettings">{{ t('pages.refresh') }}</button>
      </div>

      <p v-if="loading" class="hint">{{ t('messages.loadingDetails') }}</p>
      <p v-if="error" class="error">{{ error }}</p>
      <p v-if="successMessage" class="success">{{ successMessage }}</p>

      <div v-if="!loading && form" class="card">
        <div class="form-grid">
          <label class="field">
            <span>{{ t('pages.settingsAlertEnabled') }}</span>
            <input type="checkbox" v-model="form.alertEnabled" :disabled="readonlyMode || saving" />
          </label>

          <label class="field">
            <span>{{ t('pages.settingsTempAlertDeviation') }}</span>
            <input type="number" step="0.1" class="input" v-model.number="form.tempAlertDeviation" :disabled="readonlyMode || saving" />
          </label>

          <label class="field">
            <span>{{ t('pages.settingsHumidityAlertDeviation') }}</span>
            <input type="number" step="0.1" class="input" v-model.number="form.humidityAlertDeviation" :disabled="readonlyMode || saving" />
          </label>

          <label class="field">
            <span>{{ t('pages.settingsCheckDeviationInterval') }}</span>
            <input type="text" class="input" v-model.trim="form.checkDeviationInterval" :disabled="readonlyMode || saving" />
          </label>

          <label class="field">
            <span>{{ t('pages.settingsReadingsRetentionDays') }}</span>
            <input type="number" class="input" min="1" v-model.number="form.readingsRetentionDays" :disabled="readonlyMode || saving" />
          </label>
        </div>

        <div v-if="authStore.canManageSettings" class="actions">
          <button class="btn-secondary" :disabled="saving" @click="resetForm">{{ t('pages.reset') }}</button>
          <button class="btn" :disabled="saving || !canSave" @click="saveSettings">
            {{ saving ? t('messages.saving') : t('pages.saveSettings') }}
          </button>
        </div>
      </div>
    </div>
  </MainLayout>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import MainLayout from '@/components/layout/MainLayout.vue'
import settingsService, { type AppSettingsDto } from '@/services/endpoints/settings'
import { useAuthStore } from '@/stores/auth'
import type { AppSettings } from '@/sdk/generated'

const { t } = useI18n()
const authStore = useAuthStore()
const loading = ref(false)
const saving = ref(false)
const error = ref('')
const successMessage = ref('')
const form = ref<AppSettingsDto | null>(null)
const initialSettings = ref<AppSettingsDto | null>(null)

function settingsToForm(settings: AppSettings): AppSettingsDto {
  return {
    alertEnabled: settings.alertEnabled ?? false,
    tempAlertDeviation: settings.tempAlertDeviation ?? 0,
    humidityAlertDeviation: settings.humidityAlertDeviation ?? 0,
    checkDeviationInterval: settings.checkDeviationInterval?.trim() || '00:05:00',
    readingsRetentionDays: settings.readingsRetentionDays ?? 30,
  }
}

const canSave = computed(() => {
  if (!authStore.canManageSettings) return false
  if (!form.value) return false
  if (!form.value.checkDeviationInterval) return false
  if (!Number.isFinite(form.value.tempAlertDeviation)) return false
  if (!Number.isFinite(form.value.humidityAlertDeviation)) return false
  if (!Number.isFinite(form.value.readingsRetentionDays) || form.value.readingsRetentionDays < 1) return false
  return true
})

const readonlyMode = computed(() => !authStore.canManageSettings)

async function loadSettings(): Promise<void> {
  loading.value = true
  error.value = ''
  successMessage.value = ''
  try {
    const response = await settingsService.get()
    const normalized = settingsToForm(response)
    form.value = { ...normalized }
    initialSettings.value = { ...normalized }
  } catch (e: any) {
    error.value = e?.message || t('pages.requestFailed')
    form.value = null
    initialSettings.value = null
  } finally {
    loading.value = false
  }
}

function resetForm(): void {
  if (!initialSettings.value) return
  form.value = { ...initialSettings.value }
  successMessage.value = ''
}

async function saveSettings(): Promise<void> {
  if (!form.value || !canSave.value) return
  saving.value = true
  error.value = ''
  successMessage.value = ''
  try {
    await settingsService.update(form.value)
    initialSettings.value = { ...form.value }
    successMessage.value = t('messages.settingsSaved')
  } catch (e: any) {
    error.value = e?.message || t('pages.requestFailed')
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  loadSettings()
})
</script>

<style scoped>
.page { max-width: 1400px; }
.toolbar { display: flex; justify-content: space-between; align-items: center; gap: 1rem; margin-bottom: 1rem; }
.btn { padding: .5rem .75rem; border: none; border-radius: .375rem; background: var(--color-primary); color: var(--color-on-primary); cursor: pointer; }
.btn-secondary { padding: .5rem .75rem; border: 1px solid var(--color-outline-variant); border-radius: .375rem; background: var(--color-surface-container-lowest); color: var(--color-on-surface); cursor: pointer; }
.btn:disabled { opacity: .6; cursor: not-allowed; }
.hint { color: var(--color-on-surface-variant); margin-bottom: .5rem; }
.error { color: var(--color-error); margin-bottom: .75rem; }
.success { color: #0f8b4c; margin-bottom: .75rem; }
.card { background: var(--color-surface-container-lowest); border-radius: .75rem; padding: 1rem; }
.form-grid { display: flex; flex-direction: column; gap: 1rem; max-width: 400px; }
.field { display: flex; flex-direction: column; gap: .35rem; color: var(--color-on-surface); font-size: .9rem; }
.input { padding: .5rem .75rem; border-radius: .375rem; border: 1px solid var(--color-outline-variant); background: var(--color-surface-container-lowest); color: var(--color-on-surface); }
.actions { margin-top: 1rem; display: flex; justify-content: flex-end; gap: .5rem; }
</style>
