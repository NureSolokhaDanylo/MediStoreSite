import apiClient from '../api/client'
import type { Sensor, Reading, PagedResult, SensorUpdateDto } from '@/types'

export interface SensorsPagedParams {
  skip?: number
  take?: number
  q?: string
  sensorType?: number
  isOn?: boolean
  zoneId?: number
}

export const sensorsService = {
  /**
   * Get all sensors
   */
  async getAll(): Promise<Sensor[]> {
    const response = await apiClient.get<Sensor[]>('/sensors')
    return response.data
  },

  async getPaged(params: SensorsPagedParams = {}): Promise<PagedResult<Sensor>> {
    const response = await apiClient.get<PagedResult<Sensor>>('/sensors/paged', {
      params: {
        skip: params.skip ?? 0,
        take: params.take ?? 50,
        q: params.q,
        sensorType: params.sensorType,
        isOn: params.isOn,
        zoneId: params.zoneId,
      },
    })
    return response.data
  },

  /**
   * Get sensor by ID
   */
  async getById(id: number): Promise<Sensor> {
    const response = await apiClient.get<Sensor>(`/sensors/${id}`)
    return response.data
  },

  async update(data: SensorUpdateDto): Promise<void> {
    await apiClient.put('/sensors', data)
  },

  /**
   * Get readings for a sensor
   */
  async getReadings(sensorId: number): Promise<Reading[]> {
    const response = await apiClient.get<Reading[]>(`/readings/sensor/${sensorId}`)
    return response.data
  },

  /**
   * Get last reading for a sensor
   */
  async getLastReading(sensorId: number): Promise<Reading> {
    const response = await apiClient.get<Reading>(`/readings/sensor/${sensorId}/last`)
    return response.data
  },

  /**
   * Get readings for a zone
   */
  async getZoneReadings(zoneId: number): Promise<Reading[]> {
    const response = await apiClient.get<Reading[]>(`/readings/zone/${zoneId}`)
    return response.data
  },

  /**
   * Get last readings for a zone
   */
  async getZoneLastReadings(zoneId: number): Promise<Reading[]> {
    const response = await apiClient.get<Reading[]>(`/readings/zone/${zoneId}/last`)
    return response.data
  },
}

export default sensorsService
