/**
 * JWT Token Utilities for MediStore Admin
 * 
 * Handles decoding, validation, and claim extraction from JWT tokens
 * issued by MediStore ASP.NET Core backend.
 */

// ASP.NET Core standard claim types
export const ClaimTypes = {
  NameIdentifier: 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier',
  Name: 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name',
  Email: 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress',
  Role: 'http://schemas.microsoft.com/ws/2008/06/identity/claims/role',
  GivenName: 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/givenname',
  Surname: 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/surname',
} as const

// JWT Payload interface matching your backend
export interface JwtPayload {
  // Standard JWT claims
  iss?: string           // Issuer (MediStoreServer)
  aud?: string           // Audience (MediStoreServer)
  exp?: number           // Expiration time (Unix timestamp)
  nbf?: number           // Not before (Unix timestamp)
  iat?: number           // Issued at (Unix timestamp)
  jti?: string           // JWT ID (unique identifier)
  sub?: string           // Subject (alternative to nameidentifier)
  
  // ASP.NET Core Identity claims (using string index)
  [key: string]: unknown
}

// Token info for display/debugging
export interface TokenInfo {
  userId: string
  username: string
  email: string
  roles: string[]
  issuedAt: Date | null
  expiresAt: Date | null
  issuer: string
  audience: string
  jwtId: string
  isExpired: boolean
  expiresInSeconds: number
  rawPayload: JwtPayload
}

/**
 * Decode base64url string (JWT uses base64url, not standard base64)
 */
function base64UrlDecode(str: string): string {
  // Replace base64url characters with base64 characters
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/')
  
  // Pad with '=' to make length multiple of 4
  const pad = base64.length % 4
  if (pad) {
    base64 += '='.repeat(4 - pad)
  }
  
  // Decode base64 and handle UTF-8
  return decodeURIComponent(
    atob(base64)
      .split('')
      .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
      .join('')
  )
}

/**
 * Decode JWT token and return payload
 * Does NOT verify signature (that's backend's job)
 */
export function decodeToken(token: string): JwtPayload {
  if (!token) {
    throw new Error('Token is empty')
  }
  
  const parts = token.split('.')
  if (parts.length !== 3) {
    throw new Error('Invalid JWT format: expected 3 parts separated by dots')
  }
  
  const payloadPart = parts[1]
  if (!payloadPart) {
    throw new Error('Invalid JWT: missing payload')
  }
  
  try {
    const jsonPayload = base64UrlDecode(payloadPart)
    return JSON.parse(jsonPayload) as JwtPayload
  } catch (error) {
    throw new Error(`Failed to decode JWT payload: ${error}`)
  }
}

/**
 * Get user ID from token
 */
export function getUserId(token: string): string {
  const payload = decodeToken(token)
  return (payload[ClaimTypes.NameIdentifier] as string) || payload.sub || ''
}

/**
 * Get username from token
 */
export function getUsername(token: string): string {
  const payload = decodeToken(token)
  return (payload[ClaimTypes.Name] as string) || ''
}

/**
 * Get email from token (may be empty if not included)
 */
export function getEmail(token: string): string {
  const payload = decodeToken(token)
  return (payload[ClaimTypes.Email] as string) || ''
}

/**
 * Get roles from token (always returns array)
 */
export function getRoles(token: string): string[] {
  const payload = decodeToken(token)
  const roles = payload[ClaimTypes.Role]
  
  if (!roles) return []
  if (Array.isArray(roles)) return roles as string[]
  return [roles as string]
}

/**
 * Check if token has specific role
 */
export function hasRole(token: string, role: string): boolean {
  const roles = getRoles(token)
  return roles.some(r => r.toLowerCase() === role.toLowerCase())
}

/**
 * Check if user is admin
 */
export function isAdmin(token: string): boolean {
  return hasRole(token, 'Admin')
}

/**
 * Check if user is observer
 */
export function isObserver(token: string): boolean {
  return hasRole(token, 'Observer')
}

/**
 * Get token expiration time as Date
 */
export function getExpirationDate(token: string): Date | null {
  const payload = decodeToken(token)
  if (!payload.exp) return null
  return new Date(payload.exp * 1000)
}

/**
 * Get token issued time as Date
 */
export function getIssuedDate(token: string): Date | null {
  const payload = decodeToken(token)
  if (!payload.iat) return null
  return new Date(payload.iat * 1000)
}

/**
 * Check if token is expired
 */
export function isExpired(token: string): boolean {
  const payload = decodeToken(token)
  if (!payload.exp) return false // No expiration = never expires
  
  const now = Math.floor(Date.now() / 1000)
  return payload.exp < now
}

/**
 * Check if token will expire within given seconds
 */
export function willExpireSoon(token: string, withinSeconds: number = 300): boolean {
  const payload = decodeToken(token)
  if (!payload.exp) return false
  
  const now = Math.floor(Date.now() / 1000)
  return payload.exp < (now + withinSeconds)
}

/**
 * Get seconds until token expires (negative if already expired)
 */
export function getSecondsUntilExpiry(token: string): number {
  const payload = decodeToken(token)
  if (!payload.exp) return Infinity
  
  const now = Math.floor(Date.now() / 1000)
  return payload.exp - now
}

/**
 * Get human-readable time until expiry
 */
export function getTimeUntilExpiry(token: string): string {
  const seconds = getSecondsUntilExpiry(token)
  
  if (seconds === Infinity) return 'Never'
  if (seconds <= 0) return 'Expired'
  
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`
  } else if (minutes > 0) {
    return `${minutes}m ${secs}s`
  } else {
    return `${secs}s`
  }
}

/**
 * Check if token is valid (not expired and properly formatted)
 */
export function isValid(token: string): boolean {
  try {
    decodeToken(token)
    return !isExpired(token)
  } catch {
    return false
  }
}

/**
 * Get full token info for debugging/display
 */
export function getTokenInfo(token: string): TokenInfo {
  const payload = decodeToken(token)
  const roles = payload[ClaimTypes.Role]
  
  return {
    userId: (payload[ClaimTypes.NameIdentifier] as string) || payload.sub || '',
    username: (payload[ClaimTypes.Name] as string) || '',
    email: (payload[ClaimTypes.Email] as string) || '',
    roles: Array.isArray(roles) ? (roles as string[]) : (roles ? [roles as string] : []),
    issuedAt: payload.iat ? new Date(payload.iat * 1000) : null,
    expiresAt: payload.exp ? new Date(payload.exp * 1000) : null,
    issuer: payload.iss || '',
    audience: payload.aud || '',
    jwtId: payload.jti || '',
    isExpired: isExpired(token),
    expiresInSeconds: getSecondsUntilExpiry(token),
    rawPayload: payload,
  }
}

/**
 * Format token info for console logging
 */
export function formatTokenInfo(token: string): string {
  try {
    const info = getTokenInfo(token)
    return `
JWT Token Info:
  User ID: ${info.userId}
  Username: ${info.username}
  Email: ${info.email || '(not set)'}
  Roles: ${info.roles.join(', ') || '(none)'}
  Issued: ${info.issuedAt?.toLocaleString() || '(unknown)'}
  Expires: ${info.expiresAt?.toLocaleString() || '(never)'}
  Status: ${info.isExpired ? '❌ EXPIRED' : `✅ Valid (${getTimeUntilExpiry(token)} remaining)`}
  Issuer: ${info.issuer}
  Audience: ${info.audience}
`.trim()
  } catch (error) {
    return `Invalid token: ${error}`
  }
}

/**
 * Create a token refresh scheduler
 * Calls callback when token needs refresh (default: 5 min before expiry)
 */
export function scheduleTokenRefresh(
  token: string,
  onRefreshNeeded: () => void,
  beforeExpirySeconds: number = 300
): { cancel: () => void } {
  const secondsUntilRefresh = getSecondsUntilExpiry(token) - beforeExpirySeconds
  
  if (secondsUntilRefresh <= 0) {
    // Already needs refresh
    onRefreshNeeded()
    return { cancel: () => {} }
  }
  
  const timeoutId = setTimeout(onRefreshNeeded, secondsUntilRefresh * 1000)
  
  return {
    cancel: () => clearTimeout(timeoutId),
  }
}

/**
 * Get stored token from localStorage
 */
export function getStoredToken(): string | null {
  return localStorage.getItem('access_token')
}

/**
 * Check if stored token is valid
 */
export function hasValidStoredToken(): boolean {
  const token = getStoredToken()
  return token ? isValid(token) : false
}

// Export everything as default object for convenience
export default {
  ClaimTypes,
  decodeToken,
  getUserId,
  getUsername,
  getEmail,
  getRoles,
  hasRole,
  isAdmin,
  isObserver,
  getExpirationDate,
  getIssuedDate,
  isExpired,
  willExpireSoon,
  getSecondsUntilExpiry,
  getTimeUntilExpiry,
  isValid,
  getTokenInfo,
  formatTokenInfo,
  scheduleTokenRefresh,
  getStoredToken,
  hasValidStoredToken,
}
