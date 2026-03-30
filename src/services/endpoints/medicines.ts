import apiClient from '../api/client'
import type { Medicine, MedicineCreateDto } from '@/types'

export const medicinesService = {
  /**
   * Get all medicines
   */
  async getAll(): Promise<Medicine[]> {
    const response = await apiClient.get<Medicine[]>('/medicines')
    return response.data
  },

  /**
   * Get medicine by ID
   */
  async getById(id: number): Promise<Medicine> {
    const response = await apiClient.get<Medicine>(`/medicines/${id}`)
    return response.data
  },

  /**
   * Search medicines
   */
  async search(query: string): Promise<Medicine[]> {
    const response = await apiClient.get<Medicine[]>('/medicines/search', {
      params: { query },
    })
    return response.data
  },

  /**
   * Create new medicine
   */
  async create(data: MedicineCreateDto): Promise<Medicine> {
    const response = await apiClient.post<Medicine>('/medicines', data)
    return response.data
  },

  /**
   * Update medicine
   */
  async update(id: number, data: Partial<MedicineCreateDto>): Promise<Medicine> {
    const response = await apiClient.put<Medicine>(`/medicines/${id}`, data)
    return response.data
  },

  /**
   * Delete medicine
   */
  async delete(id: number): Promise<void> {
    await apiClient.delete(`/medicines/${id}`)
  },
}

export default medicinesService
