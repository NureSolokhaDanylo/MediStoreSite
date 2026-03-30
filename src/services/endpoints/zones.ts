import apiClient from '../api/client'
import type { PagedSearchResult, Sensor, Zone, ZoneCreateDto, ZoneSearchResult } from '@/types'

export const zonesService = {
  async getAll(): Promise<Zone[]> {
    const response = await apiClient.get<Zone[]>('/zones')
    return response.data
  },

  async getById(id: number): Promise<Zone> {
    const response = await apiClient.get<Zone>(`/zones/${id}`)
    return response.data
  },

  async search(q: string, skip = 0, take = 10): Promise<PagedSearchResult<ZoneSearchResult>> {
    const response = await apiClient.get<PagedSearchResult<ZoneSearchResult>>('/zones/search', {
      params: { q, skip, take },
    })
    return response.data
  },

  async getSensors(id: number): Promise<Sensor[]> {
    const response = await apiClient.get<Sensor[]>(`/zones/${id}/sensors`)
    return response.data
  },

  async update(data: Zone): Promise<Zone> {
    const response = await apiClient.put<Zone>('/zones', data)
    return response.data
  },

  async create(data: ZoneCreateDto): Promise<Zone> {
    const response = await apiClient.post<Zone>('/zones', data)
    return response.data
  },
}

export default zonesService
