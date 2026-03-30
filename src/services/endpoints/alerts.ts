import apiClient from '../api/client'
import type { Alert } from '@/types'

export const alertsService = {
  /**
   * Get all alerts
   */
  async getAll(): Promise<Alert[]> {
    const response = await apiClient.get<Alert[]>('/alerts')
    return response.data
  },

  /**
   * Mark alert as read
   */
  async markAsRead(id: string): Promise<void> {
    await apiClient.patch(`/alerts/${id}/read`)
  },

  /**
   * Delete alert
   */
  async delete(id: string): Promise<void> {
    await apiClient.delete(`/alerts/${id}`)
  },
}

export default alertsService
