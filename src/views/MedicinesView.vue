<template>
  <MainLayout>
    <div class="page">
      <h1>{{ t('pages.medicinesTitle') }}</h1>
      <p>{{ t('pages.medicinesSubtitle') }}</p>
    </div>
  </MainLayout>
</template>

<script setup lang="ts">
import MainLayout from '@/components/layout/MainLayout.vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
</script>

<style scoped>
.page {
  max-width: 1400px;
}
</style>
