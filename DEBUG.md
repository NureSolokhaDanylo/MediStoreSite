# Debug Guide: Login Redirect Issue

## Current Status
✅ API endpoints configured correctly (`/api/v1/account/login`)
✅ Frontend running on http://localhost:5174
✅ Login form submits credentials
⚠️  Redirect after login not working

## What Was Fixed

### 1. Login Flow Enhanced
- Added `nextTick()` to wait for store updates
- Changed `router.push()` to `router.replace()` 
- Added fallback using `window.location.href`
- Added comprehensive logging at each step

### 2. Auth Service Updated
- Now handles multiple response formats:
  - Direct: `{ token, refreshToken, user }`
  - Wrapped: `{ data: { token, refreshToken, user } }`
- Logs raw API response for debugging
- Better error messages

### 3. Debug Page Created
- URL: http://localhost:5174/test-auth
- Shows: Auth store state, LocalStorage contents
- Buttons to test navigation and logout

## How to Debug

### Step 1: Check Console Logs
After attempting login, you should see:
```
Attempting login...
Raw login response: { ... }
Parsed login data: { ... }
Login successful, user set: { ... }
Login completed, redirecting...
Navigating to: /
Navigation: { to: 'dashboard', isAuthenticated: true, ... }
```

### Step 2: Check Network Tab
1. Open DevTools → Network tab
2. Find POST request to `/api/v1/account/login`
3. Check Response:
   - Should contain: `token`, `refreshToken`, `user`
   - Note the exact structure

### Step 3: Check LocalStorage
1. Open DevTools → Application tab → LocalStorage
2. Should see:
   - `access_token`: JWT token
   - `refresh_token`: Refresh token
   - `user`: JSON string with user data

### Step 4: Use Debug Page
1. After login attempt, navigate to: http://localhost:5174/test-auth
2. Check displayed values:
   - `isAuthenticated` should be `true`
   - `user` should contain user data
3. Click "Go to Dashboard" - does navigation work?

## Possible Issues

### Issue 1: API Returns Different Structure
**Symptom**: Login succeeds but `isAuthenticated` is false
**Check**: Console log "Raw login response"
**Fix**: Update `LoginResponse` type in `src/types/index.ts`

### Issue 2: Router Guard Blocks Navigation
**Symptom**: See "Not authenticated, redirecting to login" in console
**Check**: Console log "Navigation:"
**Fix**: Check `src/router/guards.ts` logic

### Issue 3: localStorage Not Saving
**Symptom**: Tokens shown in console but not in Application tab
**Check**: Browser localStorage quota/permissions
**Fix**: Clear localStorage and try again

### Issue 4: Vue Reactivity Issue
**Symptom**: User data saved but `isAuthenticated` still false
**Check**: `src/stores/auth.ts` computed properties
**Fix**: Ensure `user` is a ref() that triggers reactivity

## Quick Tests

### Test Backend Directly
```bash
curl -X POST http://localhost:14000/api/v1/account/login \
  -H "Content-Type: application/json" \
  -d '{"login":"YOUR_USERNAME","password":"YOUR_PASSWORD"}'
```

### Test Frontend State
1. Login
2. Open console
3. Type: `localStorage.getItem('user')`
4. Should show user JSON

## Files to Check

1. **src/views/LoginView.vue** - Login form and redirect logic
2. **src/stores/auth.ts** - Auth state management
3. **src/services/endpoints/auth.ts** - API calls
4. **src/router/guards.ts** - Navigation guards
5. **src/App.vue** - Auth initialization

## Next Steps If Still Not Working

1. Share console output (all logs from login attempt)
2. Share Network tab response (what `/account/login` returns)
3. Share LocalStorage contents
4. Share what's shown on `/test-auth` page

This will help identify the exact point where the flow breaks!
