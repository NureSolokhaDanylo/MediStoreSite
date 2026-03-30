import apiClient from '../api/client'

export interface AppSettingsDto {
  alertEnabled: boolean
  tempAlertDeviation: number
  humidityAlertDeviation: number
  checkDeviationInterval: string
  readingsRetentionDays: number
}

export const settingsService = {
  async get(): Promise<unknown> {
    const response = await apiClient.get<unknown>('/settings')
    return response.data
  },

  async update(payload: AppSettingsDto): Promise<unknown> {
    const response = await apiClient.put<unknown>('/settings', payload)
    return response.data
  },
}

export default settingsService
