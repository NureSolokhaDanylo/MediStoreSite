import apiClient from '../api/client'
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
   * Get all alerts
   */
  async getAllAlerts(): Promise<Alert[]> {
    const response = await apiClient.get<Alert[]>('/alerts')
    return response.data
  },

  async getFilteredAlerts(params: FilteredAlertsParams = {}): Promise<AlertDtoPagedResultDto> {
    const response = await apiClient.get<AlertDtoPagedResultDto>('/alerts/filtered', {
      params: {
        Skip: params.Skip ?? 0,
        Take: params.Take ?? 50,
        IsActive: params.IsActive,
        ZoneId: params.ZoneId,
        BatchId: params.BatchId,
      },
    })
    return response.data
  },

  async getById(id: number): Promise<Alert> {
    const response = await apiClient.get<Alert>(`/alerts/${id}`)
    return response.data
  },

  async generateAlertsReport(params: AlertsReportParams = {}): Promise<AlertsReportResult> {
    const response = await apiClient.get<Blob>('/reports/alerts', {
      params: {
        from: params.from,
        to: params.to,
      },
      responseType: 'blob',
    })
    return {
      data: response.data,
      contentType: String(response.headers?.['content-type'] || ''),
      contentDisposition: response.headers?.['content-disposition'],
    }
  },

  async getAll(): Promise<Alert[]> {
    return this.getAllAlerts()
  },

  /**
   * Delete alert
   */
  async delete(id: number): Promise<void> {
    await apiClient.delete(`/alerts/${id}`)
  },
}

export default alertsService
