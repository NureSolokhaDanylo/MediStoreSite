# MediStore Admin Panel - Copilot Instructions

## Commands

```bash
npm run dev          # Start dev server (Vite)
npm run build        # Type-check + build
npm run type-check   # TypeScript validation only
npm run test:unit    # Run all unit tests (Vitest)
npm run test:e2e     # Run E2E tests (Playwright)

# Single test file
npx vitest run src/utils/jwt.test.ts
npx playwright test e2e/login.spec.ts
```

## Architecture

**Vue 3 admin panel** for MediStore medical inventory system. Connects to ASP.NET Core backend at `localhost:14000`.

### Layer Structure

```
src/
├── services/api/      # Axios client with JWT interceptors
├── services/endpoints/# API service modules (auth, medicines, batches, sensors)
├── stores/            # Pinia stores (auth state management)
├── utils/             # Utilities (jwt.ts for token handling)
├── views/             # Page components
├── components/        # Reusable UI components
└── types/             # TypeScript interfaces matching API DTOs
```

### Key Patterns

**API Client** (`services/api/client.ts`):
- Singleton axios instance with base URL from `VITE_API_BASE_URL`
- Auto-attaches `Authorization: Bearer` header
- 401 responses trigger token refresh or logout

**JWT Handling** (`utils/jwt.ts`):
- Backend uses ASP.NET Core claims (long URI-style keys)
- User data extracted from JWT payload, not from API response
- Use `ClaimTypes` constants for claim keys

**Auth Flow**:
- Login returns only `{ token }` - no user object
- `extractUserFromToken()` decodes JWT to get user info
- Only `Admin` role can access the panel

## Conventions

### API Endpoints
- Base path: `/api/v1/`
- Auth: `/account/login`, `/account/me`
- Resources: `/medicines`, `/batches`, `/sensors`, `/zones`
- OpenAPI spec in `note.api` file

### TypeScript
- Interfaces in `src/types/index.ts` match backend DTOs
- `role` field is `string | string[]` (backend may return array)
- All entity IDs are `number` except `User.id` (string UUID)

### Design System
- Theme defined in `src/assets/styles/theme.ts`
- "No borders" philosophy - use background color shifts for structure
- Primary: `#005EB4`, Error: `#9F403D`, Success: `#1C6D25`
- Fonts: Public Sans (headlines), Inter (body)
- Use CSS variables: `--color-primary`, `--spacing-4`, etc.

### Internationalization (uk/en)
- `vue-i18n` is configured in `src/i18n/index.ts` and registered in `src/main.ts`
- Translation messages are centralized in `src/i18n/messages.ts`
- Supported locales: `uk`, `en` with fallback to `en`
- Locale is persisted in `localStorage` under key `app_locale`
- In components, use `const { t } = useI18n()` and translation keys (avoid hardcoded UI strings)
- Language switcher lives in `components/layout/MainLayout.vue`
- For service-layer localized errors, use `i18n.global.t('...')` (see `services/endpoints/auth.ts`)

## Backend Reference

The backend is ASP.NET Core: [github.com/NureSolokhaDanylo/MediStore-server](https://github.com/NureSolokhaDanylo/MediStore-server)

JWT claims use full XML namespace URIs:
```typescript
// Use these constants from utils/jwt.ts
ClaimTypes.NameIdentifier  // user ID
ClaimTypes.Name            // username
ClaimTypes.Role            // roles (may be array)
```
