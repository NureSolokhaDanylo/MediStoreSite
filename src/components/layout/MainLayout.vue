<template>
  <div class="admin-layout">
    <!-- Sidebar Navigation -->
    <aside class="sidebar">
      <div class="sidebar-header">
        <h1 class="logo">MediStore</h1>
        <p class="logo-subtitle">Admin Panel</p>
      </div>

      <nav class="sidebar-nav">
        <router-link
          v-for="item in navigation"
          :key="item.name"
          :to="item.to"
          class="nav-item"
          :class="{ active: isActiveRoute(item.to) }"
        >
          <span class="nav-icon">{{ item.icon }}</span>
          <span class="nav-label">{{ item.label }}</span>
        </router-link>
      </nav>

      <div class="sidebar-footer">
        <button @click="handleLogout" class="logout-btn">
          <span>🚪</span>
          <span>Logout</span>
        </button>
      </div>
    </aside>

    <!-- Main Content Area -->
    <div class="main-wrapper">
      <!-- Top Header -->
      <header class="main-header">
        <div class="header-left">
          <h2 class="page-title">{{ pageTitle }}</h2>
        </div>
        <div class="header-right">
          <div class="user-info">
            <span class="user-name">{{ authStore.fullName }}</span>
            <span class="user-role">{{ authStore.user?.role }}</span>
          </div>
        </div>
      </header>

      <!-- Page Content -->
      <main class="main-content">
        <router-view />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const navigation = [
  { name: 'dashboard', label: 'Dashboard', icon: '📊', to: '/' },
  { name: 'medicines', label: 'Medicines', icon: '💊', to: '/medicines' },
  { name: 'batches', label: 'Batches', icon: '📦', to: '/batches' },
  { name: 'sensors', label: 'Sensors', icon: '🌡️', to: '/sensors' },
  { name: 'users', label: 'Users', icon: '👥', to: '/users' },
  { name: 'settings', label: 'Settings', icon: '⚙️', to: '/settings' },
]

const pageTitle = computed(() => {
  const currentRoute = navigation.find((item) => item.to === route.path)
  return currentRoute?.label || 'MediStore Admin'
})

function isActiveRoute(path: string): boolean {
  return route.path === path || route.path.startsWith(path + '/')
}

async function handleLogout() {
  await authStore.logout()
  router.push('/login')
}
</script>

<style scoped>
.admin-layout {
  display: flex;
  min-height: 100vh;
  background-color: var(--color-background);
}

/* ==================== Sidebar ==================== */
.sidebar {
  width: 260px;
  background-color: var(--color-surface-container-lowest);
  border-right: none;
  display: flex;
  flex-direction: column;
  position: fixed;
  height: 100vh;
  left: 0;
  top: 0;
}

.sidebar-header {
  padding: var(--spacing-6) var(--spacing-5);
  background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dim) 100%);
}

.logo {
  font-family: var(--font-headline);
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-on-primary);
  margin: 0;
}

.logo-subtitle {
  font-size: 0.75rem;
  color: var(--color-on-primary);
  opacity: 0.9;
  margin-top: var(--spacing-1);
}

.sidebar-nav {
  flex: 1;
  padding: var(--spacing-4) 0;
  overflow-y: auto;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-3);
  padding: var(--spacing-3) var(--spacing-5);
  color: var(--color-on-surface-variant);
  text-decoration: none;
  transition: all var(--transition-normal);
  font-size: 0.875rem;
  font-weight: 500;
  margin: var(--spacing-1) var(--spacing-3);
  border-radius: var(--radius-md);
}

.nav-item:hover {
  background-color: var(--color-surface-container-low);
  color: var(--color-on-surface);
}

.nav-item.active {
  background-color: var(--color-primary-container);
  color: var(--color-on-primary-container);
}

.nav-icon {
  font-size: 1.25rem;
  width: 24px;
  text-align: center;
}

.sidebar-footer {
  padding: var(--spacing-4) var(--spacing-3);
  border-top: 1px solid rgba(169, 180, 183, 0.15);
}

.logout-btn {
  width: 100%;
  display: flex;
  align-items: center;
  gap: var(--spacing-3);
  padding: var(--spacing-3) var(--spacing-4);
  background-color: var(--color-surface-container);
  color: var(--color-on-surface-variant);
  border-radius: var(--radius-md);
  font-size: 0.875rem;
  font-weight: 500;
  transition: all var(--transition-normal);
}

.logout-btn:hover {
  background-color: var(--color-error-container);
  color: var(--color-on-error);
}

/* ==================== Main Wrapper ==================== */
.main-wrapper {
  margin-left: 260px;
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.main-header {
  background-color: var(--color-surface-container-lowest);
  padding: var(--spacing-4) var(--spacing-6);
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: sticky;
  top: 0;
  z-index: 10;
  box-shadow: var(--shadow-sm);
}

.page-title {
  font-family: var(--font-headline);
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--color-on-surface);
  margin: 0;
}

.user-info {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: var(--spacing-1);
}

.user-name {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--color-on-surface);
}

.user-role {
  font-size: 0.6875rem;
  color: var(--color-on-surface-variant);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.main-content {
  flex: 1;
  padding: var(--spacing-6);
}

/* ==================== Responsive ==================== */
@media (max-width: 1024px) {
  .sidebar {
    width: 220px;
  }

  .main-wrapper {
    margin-left: 220px;
  }
}
</style>
