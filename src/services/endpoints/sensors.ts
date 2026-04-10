import { readingsApi, sensorsApi } from '../api/sdk'
import { wrapApiCall } from '../api/errors'
import { mapReading, mapSensor, mapSensorPage, toSdkSensorCreateDto, toSdkSensorUpdateDto } from '../api/adapters'
import type { Sensor, Reading, PagedResult, SensorUpdateDto } from '@/types'

export interface SensorsPagedParams {
  skip?: number
  take?: number
  q?: string
  sensorType?: number
  isOn?: boolean
  zoneId?: number
}

export interface ReadingsQueryParams {
  from?: string
  to?: string
}

export const sensorsService = {
  /**
   * Wrapper for `sensorsGetSensors` (`GET /api/v1/sensors`).
   * Required roles: Admin, Operator, Observer.
   * Throws `AppApiError` with codes: auth.forbidden, auth.unauthorized, sensor.retrieval_failed.
   */
  async getAll(zoneId?: number): Promise<Sensor[]> {
    const response = await wrapApiCall(() =>
      sensorsApi.sensorsGetSensors({
        zoneId,
      }),
    )
    return response.map(mapSensor)
  },

  /**
   * Wrapper for `sensorsGetSensorsPaged` (`GET /api/v1/sensors/paged`).
   * Required roles: Admin, Operator, Observer.
   * Throws `AppApiError` with codes: auth.forbidden, auth.unauthorized, sensor.invalid_paging, sensor.retrieval_failed.
   */
  async getPaged(params: SensorsPagedParams = {}): Promise<PagedResult<Sensor>> {
    const response = await wrapApiCall(() =>
      sensorsApi.sensorsGetSensorsPaged({
        skip: params.skip ?? 0,
        take: params.take ?? 50,
        q: params.q,
        sensorType: params.sensorType,
        isOn: params.isOn,
        zoneId: params.zoneId,
      }),
    )
    return mapSensorPage(response)
  },

  /**
   * Wrapper for `sensorsGet` (`GET /api/v1/sensors/{id}`).
   * Required roles: Admin, Operator, Observer.
   * Throws `AppApiError` with codes: auth.forbidden, auth.unauthorized, sensor.not_found.
   */
  async getById(id: number): Promise<Sensor> {
    const response = await wrapApiCall(() => sensorsApi.sensorsGet({ id }))
    return mapSensor(response)
  },

  /**
   * Wrapper for `sensorsUpdateAllowedFields` (`PUT /api/v1/sensors`).
   * Required roles: Admin.
   * Throws `AppApiError` with codes: auth.forbidden, auth.unauthorized, sensor.not_found.
   */
  async update(data: SensorUpdateDto): Promise<void> {
    await wrapApiCall(() =>
      sensorsApi.sensorsUpdateAllowedFields({
        sensorUpdateDto: toSdkSensorUpdateDto(data),
      }),
    )
  },

  /**
   * Wrapper for `sensorsCreate` (`POST /api/v1/sensors`).
   * Required roles: Admin.
   * Throws `AppApiError` with codes: auth.forbidden, auth.unauthorized, sensor.zone_not_found.
   */
  async create(data: { serialNumber: string; sensorType: number; zoneId?: number | null }): Promise<Sensor> {
    const response = await wrapApiCall(() =>
      sensorsApi.sensorsCreate({
        sensorCreateDto: toSdkSensorCreateDto(data),
      }),
    )
    return mapSensor(response)
  },

  /**
   * Wrapper for `sensorsDelete` (`DELETE /api/v1/sensors`).
   * Required roles: Admin.
   * Throws `AppApiError` with codes: auth.forbidden, auth.unauthorized, sensor.not_found.
   */
  async delete(id: number): Promise<void> {
    await wrapApiCall(() => sensorsApi.sensorsDelete({ id }))
  },

  /**
   * Wrapper for `readingsGetForSensor` (`GET /api/v1/readings/sensor/{sensorId}`).
   * Required roles: Admin, Operator, Observer.
   * Throws `AppApiError` with codes: auth.forbidden, auth.unauthorized, reading.invalid_time_range.
   */
  async getReadings(sensorId: number, params: ReadingsQueryParams = {}): Promise<Reading[]> {
    const response = await wrapApiCall(() =>
      readingsApi.readingsGetForSensor({
        sensorId,
        from: toDateValue(params.from),
        to: toDateValue(params.to),
      }),
    )
    return response.map(mapReading)
  },

  /**
   * Wrapper for `readingsGetLastForSensor` (`GET /api/v1/readings/sensor/{sensorId}/last`).
   * Required roles: Admin, Operator, Observer.
   * Throws `AppApiError` with codes: auth.forbidden, auth.unauthorized, reading.invalid_count.
   */
  async getLastReadings(sensorId: number, count: number = 1): Promise<Reading[]> {
    const response = await wrapApiCall(() =>
      readingsApi.readingsGetLastForSensor({
        sensorId,
        count,
      }),
    )
    return response.map(mapReading)
  },

  /**
   * Wrapper for `sensorsCreateApiKey` (`POST /api/v1/sensors/{id}/apikey`).
   * Required roles: Admin.
   * Throws `AppApiError` with codes: auth.forbidden, auth.unauthorized, sensor_api_key.sensor_not_found.
   */
  async generateApiKey(sensorId: number): Promise<string> {
    const response = await wrapApiCall(() =>
      sensorsApi.sensorsCreateApiKey({
        id: sensorId,
      }),
    )
    return response.apiKey
  },

  /**
   * Wrapper for `readingsGetForZone` (`GET /api/v1/readings/zone/{zoneId}`).
   * Required roles: Admin, Operator, Observer.
   * Throws `AppApiError` with codes: auth.forbidden, auth.unauthorized, reading.invalid_time_range.
   */
  async getZoneReadings(zoneId: number, params: ReadingsQueryParams = {}): Promise<Reading[]> {
    const response = await wrapApiCall(() =>
      readingsApi.readingsGetForZone({
        zoneId,
        from: toDateValue(params.from),
        to: toDateValue(params.to),
      }),
    )
    return response.map(mapReading)
  },

  /**
   * Wrapper for `readingsGetLastForZone` (`GET /api/v1/readings/zone/{zoneId}/last`).
   * Required roles: Admin, Operator, Observer.
   * Throws `AppApiError` with codes: auth.forbidden, auth.unauthorized, reading.invalid_count.
   */
  async getZoneLastReadings(zoneId: number): Promise<Reading[]> {
    const response = await wrapApiCall(() =>
      readingsApi.readingsGetLastForZone({
        zoneId,
      }),
    )
    return response.map(mapReading)
  },
}

export default sensorsService

function toDateValue(value?: string): Date | undefined {
  if (!value) {
    return undefined
  }

  const candidate = new Date(value)
  return Number.isNaN(candidate.getTime()) ? undefined : candidate
}
