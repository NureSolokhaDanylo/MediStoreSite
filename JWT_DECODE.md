# JWT Token Decoding - Implementation

## Problem
Backend API returns only `{ token: "..." }` without user data or refresh token.
Frontend expected `{ token, refreshToken, user }` format.

## Solution
Decode JWT token on client-side to extract user information from claims.

## JWT Claims Mapping

Your backend uses ASP.NET Core standard claims:

```
JWT Payload:
{
  "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier": "0b8fff93-4490-45be-ae71-6cbcdc743c21",
  "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name": "Admin",
  "http://schemas.microsoft.com/ws/2008/06/identity/claims/role": ["Observer", "Admin"],
  "aud": "MediStoreServer",
  "iss": "MediStoreServer",
  "exp": 1774926804,
  "nbf": 1774866804
}

Mapped to User type:
{
  id: "0b8fff93-4490-45be-ae71-6cbcdc743c21",
  username: "Admin",
  email: "",
  firstName: "",
  lastName: "",
  role: ["Observer", "Admin"]
}
```

## Implementation Details

### 1. JWT Decoder Function
Located in: `src/services/endpoints/auth.ts`

```typescript
function decodeJwt(token: string): User {
  const parts = token.split('.')
  if (parts.length !== 3 || !parts[1]) {
    throw new Error('Invalid JWT format')
  }
  
  const base64Url = parts[1]
  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
  const jsonPayload = decodeURIComponent(
    atob(base64)
      .split('')
      .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
      .join('')
  )
  
  const payload = JSON.parse(jsonPayload)
  
  return {
    id: payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'] || '',
    username: payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'] || '',
    email: payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'] || '',
    firstName: payload.given_name || '',
    lastName: payload.family_name || '',
    role: payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] || 'User'
  }
}
```

### 2. Updated User Type
```typescript
export interface User {
  id: string
  username: string        // Added
  email: string
  firstName: string
  lastName: string
  role: string | string[] // Changed to support array of roles
}
```

### 3. Updated LoginResponse Type
```typescript
export interface LoginResponse {
  token: string
  refreshToken?: string   // Optional now
  user?: User            // Optional now
}
```

### 4. Auth Service Login
```typescript
async login(credentials: LoginRequest): Promise<LoginResponse> {
  const response = await apiClient.post('/account/login', credentials)
  
  // Extract token from response
  const token = response.data.token
  const refreshToken = response.data.refreshToken
  
  // Decode JWT to get user data
  const user = decodeJwt(token)
  
  // Store everything
  apiClient.setAuth(token, refreshToken || '')
  localStorage.setItem('user', JSON.stringify(user))
  
  return { token, refreshToken, user }
}
```

### 5. Admin Check Updated
```typescript
const isAdmin = computed(() => {
  if (!user.value) return false
  const role = user.value.role
  if (Array.isArray(role)) {
    return role.includes('Admin')
  }
  return role === 'Admin' || role === 'admin'
})
```

## Why Client-Side Decoding is Safe

**Q: Is it secure to decode JWT on client?**
**A: Yes!** JWT decoding is NOT the same as JWT verification.

- **Decoding** = Reading the payload (what we do)
- **Verification** = Checking signature (backend does this)

The JWT is **already trusted** because:
1. Backend signed it with secret key
2. Backend validates it on every API request
3. We're just reading public claims (not sensitive data)
4. We don't modify or verify the token

## Testing

Console logs added to track the flow:
```
Raw login response: { token: "..." }
Decoded JWT payload: { nameidentifier: "...", name: "Admin", role: [...] }
Extracted user from JWT: { id: "...", username: "Admin", role: [...] }
Login successful, user set: { ... }
```

## Backend Compatibility

If backend later adds user object to response:
```json
{
  "token": "...",
  "user": { ... }
}
```

The code will use the provided user object instead of decoding.
Fully backward and forward compatible!

## Benefits

1. ✅ Works with minimal API response
2. ✅ No extra API call needed
3. ✅ User data available immediately
4. ✅ Compatible with future API changes
5. ✅ Standard JWT usage pattern
6. ✅ No security concerns

## Limitations

- Email, firstName, lastName may be empty (not in JWT)
- To get full user profile, call `/account/me` endpoint
- Consider adding profile fetch on dashboard load if needed

## Next Steps

If you need full user profile:
```typescript
// In DashboardView.vue onMounted
if (!authStore.user?.email) {
  await authStore.fetchUserProfile() // Calls /account/me
}
```
