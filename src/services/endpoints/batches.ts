import apiClient from '../api/client'
import type { Batch, BatchCreateDto } from '@/types'

export const batchesService = {
  /**
   * Get all batches
   */
  async getAll(): Promise<Batch[]> {
    const response = await apiClient.get<Batch[]>('/batches')
    return response.data
  },

  /**
   * Get batch by ID
   */
  async getById(id: number): Promise<Batch> {
    const response = await apiClient.get<Batch>(`/batches/${id}`)
    return response.data
  },

  /**
   * Search batches
   */
  async search(query: string): Promise<Batch[]> {
    const response = await apiClient.get<Batch[]>('/batches/search', {
      params: { query },
    })
    return response.data
  },

  /**
   * Create new batch
   */
  async create(data: BatchCreateDto): Promise<Batch> {
    const response = await apiClient.post<Batch>('/batches', data)
    return response.data
  },

  /**
   * Update batch
   */
  async update(id: number, data: Partial<BatchCreateDto>): Promise<Batch> {
    const response = await apiClient.put<Batch>(`/batches/${id}`, data)
    return response.data
  },

  /**
   * Delete batch
   */
  async delete(id: number): Promise<void> {
    await apiClient.delete(`/batches/${id}`)
  },
}

export default batchesService
