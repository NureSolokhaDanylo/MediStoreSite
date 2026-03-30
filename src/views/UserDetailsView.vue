<template>
  <MainLayout>
    <div class="page">
      <h1>User details</h1>

      <p v-if="loading" class="loading">{{ t('messages.loadingDetails') }}</p>
      <p v-else-if="error" class="error">{{ error }}</p>

      <template v-else>
        <p v-if="!user" class="empty">{{ t('pages.noData') }}</p>

        <section v-else class="card">
          <h2>General</h2>
          <dl class="details-list">
            <div class="row"><dt>ID</dt><dd>{{ text(user.id) }}</dd></div>
            <div class="row"><dt>Username</dt><dd>{{ text(user.userName ?? user.username) }}</dd></div>
            <div class="row"><dt>Roles</dt><dd>{{ roleText(user.roles ?? user.role) }}</dd></div>
          </dl>
        </section>
      </template>
    </div>
  </MainLayout>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import MainLayout from '@/components/layout/MainLayout.vue'
import usersService from '@/services/endpoints/users'

const { t } = useI18n()
const route = useRoute()
const loading = ref(false)
const error = ref('')
const user = ref<Record<string, unknown> | null>(null)

function parseId(value: unknown): string | null {
  const raw = Array.isArray(value) ? value[0] : value
  return typeof raw === 'string' && raw.trim() ? raw : null
}

function text(value: unknown): string {
  if (value === null || value === undefined) return '-'
  if (typeof value === 'string') return value.trim() || '-'
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  return '-'
}

function roleText(value: unknown): string {
  if (Array.isArray(value)) {
    const parts = value.map((v) => text(v)).filter((v) => v !== '-')
    return parts.length ? parts.join(', ') : '-'
  }
  return text(value)
}

async function load(): Promise<void> {
  const id = parseId(route.params.id)
  if (!id) {
    error.value = 'Invalid user id'
    user.value = null
    return
  }
  loading.value = true
  error.value = ''
  try {
    const response = await usersService.getById(id)
    user.value = response as Record<string, unknown>
  } catch (e: any) {
    error.value = e?.message || t('pages.requestFailed')
    user.value = null
  } finally {
    loading.value = false
  }
}

watch(() => route.params.id, load)
onMounted(load)
</script>

<style scoped>
.page { max-width: 1400px; }
.loading,.empty { color: var(--color-on-surface-variant); margin-top: 1rem; }
.error { color: var(--color-error); margin-top: 1rem; }
.card { margin-top: 1rem; background: var(--color-surface-container-lowest); border-radius: .75rem; padding: 1rem; }
.card h2 { margin: 0 0 .75rem; font-size: 1.05rem; }
.details-list { margin: 0; }
.row { display: grid; grid-template-columns: 160px 1fr; gap: .75rem; padding: .45rem 0; }
dt { color: var(--color-on-surface-variant); }
dd { margin: 0; }
</style>
