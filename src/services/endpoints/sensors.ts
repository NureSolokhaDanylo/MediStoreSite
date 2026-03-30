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
   * Create new sensor
   */
  async create(data: { serialNumber: string; sensorType: number; zoneId?: number | null }): Promise<Sensor> {
    const response = await apiClient.post<Sensor>('/sensors', data)
    return response.data
  },

  /**
   * Delete sensor by ID
   */
  async delete(id: number): Promise<void> {
    await apiClient.delete(`/sensors/${id}`)
  },

  /**
   * Get readings for a sensor
   */
  async getReadings(sensorId: number): Promise<Reading[]> {
    const response = await apiClient.get<Reading[]>(`/readings/sensor/${sensorId}`)
    return response.data
  },

  /**
   * Get last readings for a sensor (returns array)
   */
  async getLastReadings(sensorId: number, count: number = 1): Promise<Reading[]> {
    const response = await apiClient.get<Reading[]>(`/readings/sensor/${sensorId}/last`, {
      params: { count },
    })
    return response.data
  },

  /**
   * Generate new API key for a sensor
   */
  async generateApiKey(sensorId: number): Promise<string> {
    const response = await apiClient.post<{ apiKey: string }>(`/sensors/${sensorId}/apikey`)
    return response.data.apiKey
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
