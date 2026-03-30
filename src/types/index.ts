export interface User {
  id: string
  username: string
  email: string
  firstName: string
  lastName: string
  role: string | string[] // Can be single role or array of roles
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

// Sensor & Reading
export interface Sensor {
  id: number
  name?: string
  zoneId: number
  isActive: boolean
}

export interface Reading {
  id: number
  sensorId: number
  temperature: number
  humidity: number
  timestamp: string
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
  id: string
  type: 'temperature' | 'humidity' | 'expiry' | 'stock' | 'system'
  severity: 'info' | 'warning' | 'critical'
  message: string
  entityId?: string
  entityType?: string
  isRead: boolean
  createdAt: string
}

// Zone
export interface Zone {
  id: number
  name: string
  description?: string
}
