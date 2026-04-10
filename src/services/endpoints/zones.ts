import { zonesApi } from '../api/sdk'
import { wrapApiCall } from '../api/errors'
import { mapSensor, mapZone, mapZoneSearchPage, toSdkZoneCreateDto, toSdkZoneDto } from '../api/adapters'
import type { PagedSearchResult, Sensor, Zone, ZoneCreateDto, ZoneSearchResult } from '@/types'

export const zonesService = {
  /**
   * Wrapper for `zonesGetAll` (`GET /api/v1/zones`).
   * Required roles: Admin, Operator, Observer.
   * Throws `AppApiError` with codes: auth.forbidden, auth.unauthorized.
   */
  async getAll(): Promise<Zone[]> {
    const response = await wrapApiCall(() => zonesApi.zonesGetAll())
    return response.map(mapZone)
  },

  /**
   * Wrapper for `zonesGet` (`GET /api/v1/zones/{id}`).
   * Required roles: Admin, Operator, Observer.
   * Throws `AppApiError` with codes: auth.forbidden, auth.unauthorized, zone.not_found.
   */
  async getById(id: number): Promise<Zone> {
    const response = await wrapApiCall(() => zonesApi.zonesGet({ id }))
    return mapZone(response)
  },

  /**
   * Wrapper for `zonesSearch` (`GET /api/v1/zones/search`).
   * Required roles: Admin, Operator, Observer.
   * Throws `AppApiError` with codes: auth.forbidden, auth.unauthorized, zone.invalid_search_paging.
   */
  async search(q: string, skip = 0, take = 10): Promise<PagedSearchResult<ZoneSearchResult>> {
    const response = await wrapApiCall(() =>
      zonesApi.zonesSearch({
        q,
        offset: skip,
        limit: take,
      }),
    )
    return mapZoneSearchPage(response)
  },

  /**
   * Wrapper for `zonesGetSensors` (`GET /api/v1/zones/{id}/sensors`).
   * Required roles: Admin, Operator, Observer.
   * Throws `AppApiError` with codes: auth.forbidden, auth.unauthorized, sensor.retrieval_failed, zone.not_found.
   */
  async getSensors(id: number): Promise<Sensor[]> {
    const response = await wrapApiCall(() => zonesApi.zonesGetSensors({ id }))
    return response.map(mapSensor)
  },

  /**
   * Wrapper for `zonesUpdateById` (`PUT /api/v1/zones/{id}`).
   * Required roles: Admin.
   * Throws `AppApiError` with codes: auth.forbidden, auth.unauthorized, common.validation_error, zone.humid_max_out_of_range, zone.humid_min_out_of_range, zone.humid_range_invalid, zone.not_found, zone.temp_max_out_of_range, zone.temp_min_out_of_range, zone.temp_range_invalid.
   */
  async update(id: number, data: Zone): Promise<Zone> {
    const response = await wrapApiCall(() =>
      zonesApi.zonesUpdateById({
        id,
        zoneDto: toSdkZoneDto(data),
      }),
    )
    return mapZone(response)
  },

  /**
   * Wrapper for `zonesCreate` (`POST /api/v1/zones`).
   * Required roles: Admin.
   * Throws `AppApiError` with codes: auth.forbidden, auth.unauthorized, zone.humid_max_out_of_range, zone.humid_min_out_of_range, zone.humid_range_invalid, zone.temp_max_out_of_range, zone.temp_min_out_of_range, zone.temp_range_invalid.
   */
  async create(data: ZoneCreateDto): Promise<Zone> {
    const response = await wrapApiCall(() =>
      zonesApi.zonesCreate({
        zoneCreateDto: toSdkZoneCreateDto(data),
      }),
    )
    return mapZone(response)
  },

  /**
   * Wrapper for `zonesDelete` (`DELETE /api/v1/zones/{id}`).
   * Required roles: Admin.
   * Throws `AppApiError` with codes: auth.forbidden, auth.unauthorized, zone.has_batches, zone.not_found.
   */
  async delete(id: number): Promise<void> {
    await wrapApiCall(() => zonesApi.zonesDelete({ id }))
  },
}
export default zonesService
