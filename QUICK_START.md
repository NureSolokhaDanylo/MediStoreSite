# MediStore Admin - Quick Start

## ✅ Что уже готово:

### 1. Дизайн-система (из Stitch mobile app)
- ✅ Цвета: #005EB4 (primary), #49636F (secondary), #1C6D25 (tertiary)
- ✅ Шрифты: Public Sans (headlines) + Inter (body)
- ✅ Философия: "No borders" - структура через фоновые слои
- ✅ Global styles и theme.ts

### 2. Инфраструктура
- ✅ API client с JWT interceptors
- ✅ Auth store (Pinia)
- ✅ Router с guards (защита admin routes)
- ✅ MainLayout с sidebar navigation

### 3. API Integration
- ✅ Auth: `/api/v1/account/login`, `/account/me`
- ✅ Medicines: `/api/v1/medicines` (CRUD)
- ✅ Batches: `/api/v1/batches` (CRUD)
- ✅ Sensors: `/api/v1/sensors`, `/readings/*`
- ✅ Alerts: `/api/v1/alerts`

### 4. Views
- ✅ LoginView - форма входа
- ✅ DashboardView - главная страница
- ✅ Placeholder views для всех разделов

## 🚀 Как запустить:

```bash
# 1. Установить зависимости (если еще не сделано)
npm install

# 2. Проверить .env файл
cat .env
# Должен быть: VITE_API_BASE_URL=http://localhost:14000/api/v1

# 3. Запустить dev server
npm run dev

# 4. Открыть в браузере
# http://localhost:5173/login
```

## 🔐 Вход в систему:

1. Убедись что backend запущен на `http://localhost:14000`
2. Открой `http://localhost:5173/login`
3. Введи credentials:
   - **Login:** admin (или из SeedOptions__AdminLogin)
   - **Password:** твой пароль (из SeedOptions__AdminPassword)

## 📁 Структура проекта:

```
src/
├── assets/styles/
│   ├── theme.ts          # Design tokens
│   └── global.css        # Global styles
├── components/
│   ├── layout/
│   │   └── MainLayout.vue    # Sidebar + Header
│   ├── common/               # (для UI Kit)
│   └── features/             # (для feature компонентов)
├── views/
│   ├── LoginView.vue         ✅ Готов
│   ├── DashboardView.vue     ✅ Готов
│   ├── MedicinesView.vue     🔄 Заглушка
│   ├── BatchesView.vue       🔄 Заглушка
│   └── ...
├── stores/
│   └── auth.ts              # Auth state
├── services/
│   ├── api/client.ts        # Axios с interceptors
│   └── endpoints/
│       ├── auth.ts          ✅
│       ├── medicines.ts     ✅
│       ├── batches.ts       ✅
│       ├── sensors.ts       ✅
│       └── alerts.ts        ✅
├── types/index.ts           # TypeScript types
└── router/
    ├── index.ts
    └── guards.ts            # Auth protection
```

## ✅ Тесты интеграции:

### Проверить бэкенд:
```bash
curl -X POST http://localhost:14000/api/v1/account/login \
  -H "Content-Type: application/json" \
  -d '{"login":"admin","password":"yourpass"}'
```

Должен вернуть:
```json
{
  "token": "eyJ...",
  "refreshToken": "...",
  "user": { ... }
}
```

## 📋 Следующие шаги:

### Phase 3: UI Components
- [ ] Button component (Primary/Secondary/Tertiary)
- [ ] Input/Textarea components
- [ ] Card component
- [ ] Table component (с zebra-striping)
- [ ] Modal component (glassmorphic)
- [ ] Loading/Spinner
- [ ] Pagination

### Phase 4: Features
- [ ] Medicines CRUD (таблица + формы)
- [ ] Batches CRUD
- [ ] Sensors dashboard (real-time readings)
- [ ] Dashboard statistics
- [ ] Users management (admin only)

## 📚 Документация:

- `README_ADMIN.md` - полное описание проекта
- `API_ENDPOINTS.md` - все API endpoints с примерами
- `plan.md` (в session folder) - план разработки

## 🐛 Troubleshooting:

**Не могу войти:**
- Проверь что бэкенд запущен: `curl http://localhost:14000/api/v1/account/login`
- Проверь .env файл: `VITE_API_BASE_URL=http://localhost:14000/api/v1`
- Перезапусти dev server после изменения .env

**CORS ошибки:**
- Убедись что бэкенд разрешает CORS для localhost:5173

**401 Unauthorized:**
- Проверь credentials (login/password)
- Очисти localStorage: `localStorage.clear()` в консоли браузера

---

Made with ❤️ using Vue 3 + TypeScript + Vite
