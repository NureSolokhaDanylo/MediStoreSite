import {
  AccountApi,
  AlertsApi,
  AppSettingsApi,
  AuditLogsApi,
  BatchesApi,
  Configuration,
  MedicinesApi,
  PingApi,
  ReadingsApi,
  ReportApi,
  SensorsApi,
  ZonesApi,
} from '@/sdk/generated'
import { getStoredAccessToken } from './session'

const DEFAULT_API_BASE_URL = 'http://localhost:14000/api/v1'

function normalizeBasePath(rawBasePath: string): string {
  return rawBasePath
    .trim()
    .replace(/\/+$/, '')
    .replace(/\/api\/v1$/i, '')
}

const configuration = new Configuration({
  basePath: normalizeBasePath(import.meta.env.VITE_API_BASE_URL || DEFAULT_API_BASE_URL),
  accessToken: async () => getStoredAccessToken() ?? '',
})

export const accountApi = new AccountApi(configuration)
export const alertsApi = new AlertsApi(configuration)
export const appSettingsApi = new AppSettingsApi(configuration)
export const auditLogsApi = new AuditLogsApi(configuration)
export const batchesApi = new BatchesApi(configuration)
export const medicinesApi = new MedicinesApi(configuration)
export const pingApi = new PingApi(configuration)
export const readingsApi = new ReadingsApi(configuration)
export const reportApi = new ReportApi(configuration)
export const sensorsApi = new SensorsApi(configuration)
export const zonesApi = new ZonesApi(configuration)
