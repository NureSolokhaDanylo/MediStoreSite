import apiClient from '../api/client'
import type { AuditLog, PagedResult } from '@/types'

export interface AuditLogsPagedParams {
  q?: string
  entityType?: string
  action?: string
  userId?: string
  from?: string
  to?: string
  skip?: number
  take?: number
}

export const auditLogsService = {
  async getById(id: number): Promise<AuditLog> {
    const response = await apiClient.get<AuditLog>(`/audit-logs/${id}`)
    return response.data
  },

  async getByType(entityType: string, from?: string, to?: string): Promise<AuditLog[]> {
    const response = await apiClient.get<AuditLog[]>(`/audit-logs/type/${entityType}`, {
      params: { from, to },
    })
    return response.data
  },

  async getLastByType(entityType: string, count = 20): Promise<AuditLog[]> {
    const response = await apiClient.get<AuditLog[]>(`/audit-logs/type/${entityType}/last`, {
      params: { count },
    })
    return response.data
  },

  async getPaged(params: AuditLogsPagedParams = {}): Promise<PagedResult<AuditLog>> {
    const response = await apiClient.get<PagedResult<AuditLog>>('/audit-logs/paged', {
      params: {
        q: params.q,
        entityType: params.entityType,
        action: params.action,
        userId: params.userId,
        from: params.from,
        to: params.to,
        skip: params.skip ?? 0,
        take: params.take ?? 50,
      },
    })
    return response.data
  },
}

export default auditLogsService
