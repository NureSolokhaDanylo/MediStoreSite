import apiClient from '../api/client'
import type { Sensor, Reading } from '@/types'

export const sensorsService = {
  /**
   * Get all sensors
   */
  async getAll(): Promise<Sensor[]> {
    const response = await apiClient.get<Sensor[]>('/sensors')
    return response.data
  },

  /**
   * Get sensor by ID
   */
  async getById(id: number): Promise<Sensor> {
    const response = await apiClient.get<Sensor>(`/sensors/${id}`)
    return response.data
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
