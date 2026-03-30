<template>
  <MainLayout>
    <div class="dashboard">
      <h1>Dashboard</h1>
      <p>Welcome to MediStore Admin Dashboard</p>
      
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon">💊</div>
          <div class="stat-content">
            <h3 class="stat-value">245</h3>
            <p class="stat-label">Total Medications</p>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon">📦</div>
          <div class="stat-content">
            <h3 class="stat-value">89</h3>
            <p class="stat-label">Active Batches</p>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon">🌡️</div>
          <div class="stat-content">
            <h3 class="stat-value">12</h3>
            <p class="stat-label">Active Sensors</p>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon">⚠️</div>
          <div class="stat-content">
            <h3 class="stat-value">3</h3>
            <p class="stat-label">Active Alerts</p>
          </div>
        </div>
      </div>
    </div>
  </MainLayout>
</template>

<script setup lang="ts">
import MainLayout from '@/components/layout/MainLayout.vue'
</script>

<style scoped>
.dashboard {
  max-width: 1400px;
}

.dashboard h1 {
  margin-bottom: var(--spacing-2);
}

.dashboard > p {
  color: var(--color-on-surface-variant);
  margin-bottom: var(--spacing-8);
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: var(--spacing-5);
}

.stat-card {
  background-color: var(--color-surface-container-lowest);
  border-radius: var(--radius-xl);
  padding: var(--spacing-6);
  display: flex;
  align-items: center;
  gap: var(--spacing-4);
  transition: all var(--transition-normal);
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.stat-icon {
  font-size: 2.5rem;
  width: 64px;
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--color-primary-container);
  border-radius: var(--radius-xl);
}

.stat-content {
  flex: 1;
}

.stat-value {
  font-family: var(--font-headline);
  font-size: 2rem;
  font-weight: 700;
  color: var(--color-on-surface);
  margin: 0;
}

.stat-label {
  color: var(--color-on-surface-variant);
  font-size: 0.875rem;
  margin: var(--spacing-1) 0 0;
}
</style>
