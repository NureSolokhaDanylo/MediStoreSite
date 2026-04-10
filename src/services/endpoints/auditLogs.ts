import { auditLogsApi } from '../api/sdk'
import { wrapApiCall } from '../api/errors'
import { mapAuditLog, mapAuditLogPage } from '../api/adapters'
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
  /**
   * Wrapper for `auditLogsGet` (`GET /api/v1/audit-logs/{id}`).
   * Required roles: Admin.
   * Throws `AppApiError` with codes: auth.forbidden, auth.unauthorized, common.not_found.
   */
  async getById(id: number): Promise<AuditLog> {
    const response = await wrapApiCall(() => auditLogsApi.auditLogsGet({ id }))
    return mapAuditLog(response)
  },

  /**
   * Wrapper for `auditLogsGetByTypeRange` (`GET /api/v1/audit-logs/type/{entityType}`).
   * Required roles: Admin.
   * Throws `AppApiError` with codes: audit_log.invalid_entity_type, auth.forbidden, auth.unauthorized.
   */
  async getByType(entityType: string, from?: string, to?: string): Promise<AuditLog[]> {
    const response = await wrapApiCall(() =>
      auditLogsApi.auditLogsGetByTypeRange({
        entityType,
        from: toDateValue(from),
        to: toDateValue(to),
      }),
    )
    return response.map(mapAuditLog)
  },

  /**
   * Wrapper for `auditLogsGetByTypeLast` (`GET /api/v1/audit-logs/type/{entityType}/last`).
   * Required roles: Admin.
   * Throws `AppApiError` with codes: audit_log.invalid_count, audit_log.invalid_entity_type, auth.forbidden, auth.unauthorized.
   */
  async getLastByType(entityType: string, count = 20): Promise<AuditLog[]> {
    const response = await wrapApiCall(() =>
      auditLogsApi.auditLogsGetByTypeLast({
        entityType,
        count,
      }),
    )
    return response.map(mapAuditLog)
  },

  /**
   * Wrapper for `auditLogsGetPaged` (`GET /api/v1/audit-logs/paged`).
   * Required roles: Admin.
   * Throws `AppApiError` with codes: audit_log.invalid_paging, auth.forbidden, auth.unauthorized.
   */
  async getPaged(params: AuditLogsPagedParams = {}): Promise<PagedResult<AuditLog>> {
    const response = await wrapApiCall(() =>
      auditLogsApi.auditLogsGetPaged({
        q: params.q,
        entityType: params.entityType,
        action: params.action,
        userId: params.userId,
        from: toDateValue(params.from),
        to: toDateValue(params.to),
        skip: params.skip ?? 0,
        take: params.take ?? 50,
      }),
    )
    return mapAuditLogPage(response)
  },
}

export default auditLogsService

function toDateValue(value?: string): Date | undefined {
  if (!value) {
    return undefined
  }

  const candidate = new Date(value)
  return Number.isNaN(candidate.getTime()) ? undefined : candidate
}
