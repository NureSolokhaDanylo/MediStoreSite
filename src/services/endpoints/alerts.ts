import { alertsApi, reportApi } from '../api/sdk'
import { wrapApiCall } from '../api/errors'
import { mapAlert, mapAlertPage } from '../api/adapters'
import type { Alert, AlertDtoPagedResultDto } from '@/types'

export interface FilteredAlertsParams {
  Skip?: number
  Take?: number
  IsActive?: boolean
  ZoneId?: number
  BatchId?: number
}

export interface AlertsReportParams {
  from?: string
  to?: string
}

export interface AlertsReportResult {
  data: Blob
  contentType: string
  contentDisposition?: string
}

export const alertsService = {
  /**
   * Wrapper for `alertsGetAll` (`GET /api/v1/alerts`).
   * Required roles: Admin, Operator, Observer.
   * Throws `AppApiError` with codes: auth.forbidden, auth.unauthorized.
   */
  async getAllAlerts(): Promise<Alert[]> {
    const response = await wrapApiCall(() => alertsApi.alertsGetAll())
    return response.map(mapAlert)
  },

  /**
   * Wrapper for `alertsGetFiltered` (`GET /api/v1/alerts/filtered`).
   * Required roles: Admin, Operator, Observer.
   * Throws `AppApiError` with codes: alert.retrieval_failed, auth.forbidden, auth.unauthorized.
   */
  async getFilteredAlerts(params: FilteredAlertsParams = {}): Promise<AlertDtoPagedResultDto> {
    const response = await wrapApiCall(() =>
      alertsApi.alertsGetFiltered({
        skip: params.Skip ?? 0,
        take: params.Take ?? 50,
        isActive: params.IsActive,
        zoneId: params.ZoneId,
        batchId: params.BatchId,
      }),
    )
    return mapAlertPage(response)
  },

  /**
   * Wrapper for `alertsGet` (`GET /api/v1/alerts/{id}`).
   * Required roles: Admin, Operator, Observer.
   * Throws `AppApiError` with codes: auth.forbidden, auth.unauthorized, common.not_found.
   */
  async getById(id: number): Promise<Alert> {
    const response = await wrapApiCall(() => alertsApi.alertsGet({ id }))
    return mapAlert(response)
  },

  /**
   * Wrapper for `reportAlertsReport` (`GET /api/v1/reports/alerts`).
   * Required roles: Admin, Observer.
   * Throws `AppApiError` with codes: auth.forbidden, auth.unauthorized, report.invalid_time_range.
   */
  async generateAlertsReport(params: AlertsReportParams = {}): Promise<AlertsReportResult> {
    const response = await wrapApiCall(() =>
      reportApi.reportAlertsReport({
        from: toDateValue(params.from),
        to: toDateValue(params.to),
      }),
    )

    return {
      data: response,
      contentType: 'application/pdf',
    }
  },

  async getAll(): Promise<Alert[]> {
    return this.getAllAlerts()
  },
}

export default alertsService

function toDateValue(value?: string): Date | undefined {
  if (!value) {
    return undefined
  }

  const normalized = value.trim()
  if (!normalized) {
    return undefined
  }

  const candidate = normalized.length === 10
    ? new Date(`${normalized}T00:00:00.000Z`)
    : new Date(normalized)

  return Number.isNaN(candidate.getTime()) ? undefined : candidate
}
