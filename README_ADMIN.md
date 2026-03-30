# MediStore Admin Panel

Modern admin dashboard for MediStore medical inventory management system.

## 🎨 Design System

Based on "The Clinical Sanctuary" philosophy extracted from mobile app:

- **Primary Color:** `#005EB4` (Medical Blue)
- **Secondary Color:** `#49636F` (Gray-Blue)  
- **Tertiary Color:** `#1C6D25` (Safe Green)
- **Typography:** Public Sans (headlines), Inter (body)
- **Philosophy:** No borders, structure via background shifts, generous whitespace

## 🏗 Architecture

```
src/
├── assets/styles/          # Design system (theme.ts, global.css)
├── components/
│   ├── common/            # Reusable UI components
│   ├── layout/            # Layout components (MainLayout)
│   └── features/          # Feature-specific components
├── views/                 # Page components
├── stores/                # Pinia state management
│   └── auth.ts           # Authentication store
├── services/
│   ├── api/              # API client with axios
│   └── endpoints/        # API endpoint services
├── types/                # TypeScript types
├── composables/          # Vue composables
└── router/               # Vue Router + guards
```

## 🚀 Getting Started

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure API endpoint:**
   Create `.env` file:
   ```
   VITE_API_BASE_URL=http://localhost:14000/api/v1
   ```

3. **Run development server:**
   ```bash
   npm run dev
   ```

4. **Build for production:**
   ```bash
   npm run build
   ```

## 🔐 Authentication

- JWT-based authentication
- Automatic token refresh
- Route guards for protected pages
- Admin role checking

## 📋 Features Roadmap

- ✅ Authentication & authorization
- ✅ Design system & theme
- ✅ Layout & navigation
- ✅ Router with guards
- ✅ API endpoints fixed (account, medicines, batches)
- 🔄 Medicines management (CRUD)
- 🔄 Batches management (CRUD)
- 🔄 Sensors monitoring
- 🔄 Users management
- 🔄 Real-time alerts

## 🛠 Tech Stack

- **Vue 3** - Composition API
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Pinia** - State management
- **Vue Router** - Routing
- **Axios** - HTTP client
- **Vitest** - Unit testing
- **Playwright** - E2E testing

## 📦 API Integration

Configure the API base URL in `.env`:
```
VITE_API_BASE_URL=http://localhost:14000/api/v1
```

The API client automatically handles:
- JWT token injection
- Token refresh on 401
- Error formatting
- Request/response interceptors

## 🎯 Development Status

**Phase 1: Foundation** ✅ Complete
- Design system extracted
- Global styles configured
- Project structure set up

**Phase 2: Core Infrastructure** ✅ Complete  
- API client with interceptors
- Authentication service
- Auth Pinia store
- Router with guards
- Main layout component

**Phase 3: UI Components** 🔄 In Progress
- Button, Input, Card, Table...
- Modal, Loading, Pagination...

**Phase 4: Features** 📅 Planned
- Dashboard with statistics
- Medications CRUD
- Batches CRUD
- Sensors monitoring
- Users management

## 🖼 Screenshots

Login page and dashboard available at `http://localhost:5173`

Default credentials (configure on backend):
- Username: admin (or as configured via SeedOptions__AdminLogin)
- Password: (configured via SeedOptions__AdminPassword)
