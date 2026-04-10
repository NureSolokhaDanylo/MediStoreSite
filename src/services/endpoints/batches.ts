import { batchesApi } from '../api/sdk'
import { wrapApiCall } from '../api/errors'
import { mapBatch, mapBatchSearchPage, toSdkBatchCreateDto, toSdkBatchDto } from '../api/adapters'
import type { Batch, BatchCreateDto, BatchSearchResult, BatchUpdateDto, PagedSearchResult } from '@/types'

export const batchesService = {
  /**
   * Wrapper for `batchesGetAll` (`GET /api/v1/batches`).
   * Required roles: Admin, Operator, Observer.
   * Throws `AppApiError` with codes: auth.forbidden, auth.unauthorized.
   */
  async getAll(): Promise<Batch[]> {
    const response = await wrapApiCall(() => batchesApi.batchesGetAll())
    return response.map(mapBatch)
  },

  /**
   * Wrapper for `batchesGet` (`GET /api/v1/batches/{id}`).
   * Required roles: Admin, Operator, Observer.
   * Throws `AppApiError` with codes: auth.forbidden, auth.unauthorized, batch.not_found.
   */
  async getById(id: number): Promise<Batch> {
    const response = await wrapApiCall(() => batchesApi.batchesGet({ id }))
    return mapBatch(response)
  },

  /**
   * Wrapper for `batchesSearch` (`GET /api/v1/batches/search`).
   * Required roles: Admin, Operator, Observer.
   * Throws `AppApiError` with codes: auth.forbidden, auth.unauthorized, batch.invalid_search_paging.
   */
  async search(q: string, skip = 0, take = 10): Promise<PagedSearchResult<BatchSearchResult>> {
    const response = await wrapApiCall(() =>
      batchesApi.batchesSearch({
        q,
        offset: skip,
        limit: take,
      }),
    )
    return mapBatchSearchPage(response)
  },

  /**
   * Wrapper for `batchesCreate` (`POST /api/v1/batches`).
   * Required roles: Operator.
   * Throws `AppApiError` with codes: auth.forbidden, auth.unauthorized, batch.date_added_in_future, batch.expire_date_before_date_added, batch.medicine_not_found, batch.quantity_must_be_positive, batch.zone_not_found.
   */
  async create(data: BatchCreateDto): Promise<Batch> {
    const response = await wrapApiCall(() =>
      batchesApi.batchesCreate({
        batchCreateDto: toSdkBatchCreateDto(data),
      }),
    )
    return mapBatch(response)
  },

  /**
   * Wrapper for `batchesUpdateById` (`PUT /api/v1/batches/{id}`).
   * Required roles: Operator.
   * Throws `AppApiError` with codes: auth.forbidden, auth.unauthorized, batch.date_added_in_future, batch.expire_date_before_date_added, batch.medicine_not_found, batch.not_found, batch.quantity_must_be_positive, batch.zone_not_found, common.validation_error.
   */
  async update(id: number, dto: BatchUpdateDto): Promise<Batch> {
    const response = await wrapApiCall(() =>
      batchesApi.batchesUpdateById({
        id,
        batchDto: toSdkBatchDto(dto),
      }),
    )
    return mapBatch(response)
  },

  /**
   * Wrapper for `batchesDelete` (`DELETE /api/v1/batches/{id}`).
   * Required roles: Operator.
   * Throws `AppApiError` with codes: auth.forbidden, auth.unauthorized, batch.not_found.
   */
  async delete(id: number): Promise<void> {
    await wrapApiCall(() => batchesApi.batchesDelete({ id }))
  },
}

export default batchesService
