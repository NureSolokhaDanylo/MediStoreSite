export interface User {
  id: string
  login?: string
  roles?: string[]
  username?: string
  userName?: string
  email?: string
  firstName?: string
  lastName?: string
  role?: string | string[] // Can be single role or array of roles
}

export interface LoginRequest {
  login: string
  password: string
}

export interface LoginResponse {
  token: string
  refreshToken?: string
  user?: User
}

export interface ApiError {
  message: string
  errors?: Record<string, string[]>
  statusCode: number
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export interface PagedSearchResult<T> {
  items: T[]
  totalCount: number
  limit: number
  offset: number
}

export interface PagedResult<T> {
  items: T[]
  totalCount: number
  skip: number
  take: number
  hasMore?: boolean
}

// Medicine (from API schema)
export interface Medicine {
  id: number
  name: string
  description?: string
  tempMax: number
  tempMin: number
  humidMax: number
  humidMin: number
}

export interface MedicineCreateDto {
  name: string
  description?: string
  tempMax: number
  tempMin: number
  humidMax: number
  humidMin: number
}

export interface MedicineUpdateDto extends MedicineCreateDto {
  id: number
}

export interface MedicineSearchResult {
  id: number
  name?: string
  description?: string
}

// Batch (from API schema)
export interface Batch {
  id: number
  batchNumber: string
  quantity: number
  expireDate: string
  dateAdded: string
  medicineId: number
  zoneId: number
}

export interface BatchCreateDto {
  batchNumber: string
  quantity: number
  expireDate: string
  medicineId: number
  zoneId: number
}

export interface BatchUpdateDto extends BatchCreateDto {
  id: number
  dateAdded: string
}

export interface BatchSearchResult {
  id: number
  batchNumber?: string
  medicineId: number
  zoneId: number
}

// Sensor & Reading
export interface Sensor {
  id: number
  serialNumber?: string
  lastValue?: number | null
  lastUpdate?: string | null
  isOn: boolean
  sensorType: number
  zoneId?: number | null
}

export interface SensorUpdateDto {
  id: number
  serialNumber?: string
  isOn?: boolean
  zoneId?: number | null
}

export interface Reading {
  id: number
  sensorId: number
  temperature?: number | null
  humidity?: number | null
  timestamp?: string | null
}

export interface SensorReading {
  id: string
  sensorId: string
  temperature?: number
  humidity?: number
  timestamp: string
  isNormal: boolean
  alertLevel?: 'safe' | 'warning' | 'critical'
}

// Alert
export interface Alert {
  id: number
  alertType: number
  message: string
  isActive?: boolean
  resolvedAt?: string | null
  batchId?: number | null
  zoneId?: number | null
  createdAt: string
}

export interface AlertDtoPagedResultDto {
  items: Alert[] | null
  totalCount: number
  skip: number
  take: number
  hasMore?: boolean
}

// Zone
export interface Zone {
  id: number
  name: string
  description?: string
  tempMax: number
  tempMin: number
  humidMax: number
  humidMin: number
}

export interface ZoneCreateDto {
  name: string
  description?: string
  tempMax: number
  tempMin: number
  humidMax: number
  humidMin: number
}

export interface ZoneSearchResult {
  id: number
  name?: string
  description?: string
}

export interface AuditLog {
  id: number
  occurredAt?: string
  entityType?: string | null
  entityId?: number
  action?: string | null
  userId?: string | null
  summary?: string | null
  oldValues?: string | null
  newValues?: string | null
  [key: string]: unknown
}
