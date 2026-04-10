import { medicinesApi } from '../api/sdk'
import { wrapApiCall } from '../api/errors'
import { mapMedicine, mapMedicineSearchPage, toSdkMedicineCreateDto, toSdkMedicineDto } from '../api/adapters'
import type { Medicine, MedicineCreateDto, MedicineSearchResult, MedicineUpdateDto, PagedSearchResult } from '@/types'

export const medicinesService = {
  /**
   * Wrapper for `medicinesGetAll` (`GET /api/v1/medicines`).
   * Required roles: Admin, Operator, Observer.
   * Throws `AppApiError` with codes: auth.forbidden, auth.unauthorized.
   */
  async getAll(): Promise<Medicine[]> {
    const response = await wrapApiCall(() => medicinesApi.medicinesGetAll())
    return response.map(mapMedicine)
  },

  /**
   * Wrapper for `medicinesGet` (`GET /api/v1/medicines/{id}`).
   * Required roles: Admin, Operator, Observer.
   * Throws `AppApiError` with codes: auth.forbidden, auth.unauthorized, medicine.not_found.
   */
  async getById(id: number): Promise<Medicine> {
    const response = await wrapApiCall(() => medicinesApi.medicinesGet({ id }))
    return mapMedicine(response)
  },

  /**
   * Wrapper for `medicinesSearch` (`GET /api/v1/medicines/search`).
   * Required roles: Admin, Operator, Observer.
   * Throws `AppApiError` with codes: auth.forbidden, auth.unauthorized, medicine.invalid_search_paging.
   */
  async search(q: string, skip = 0, take = 10): Promise<PagedSearchResult<MedicineSearchResult>> {
    const response = await wrapApiCall(() =>
      medicinesApi.medicinesSearch({
        q,
        offset: skip,
        limit: take,
      }),
    )
    return mapMedicineSearchPage(response)
  },

  /**
   * Wrapper for `medicinesCreate` (`POST /api/v1/medicines`).
   * Required roles: Admin.
   * Throws `AppApiError` with codes: auth.forbidden, auth.unauthorized, medicine.humid_max_out_of_range, medicine.humid_min_out_of_range, medicine.humid_range_invalid, medicine.temp_max_out_of_range, medicine.temp_min_out_of_range, medicine.temp_range_invalid.
   */
  async create(data: MedicineCreateDto): Promise<Medicine> {
    const response = await wrapApiCall(() =>
      medicinesApi.medicinesCreate({
        medicineCreateDto: toSdkMedicineCreateDto(data),
      }),
    )
    return mapMedicine(response)
  },

  /**
   * Wrapper for `medicinesUpdateById` (`PUT /api/v1/medicines/{id}`).
   * Required roles: Admin.
   * Throws `AppApiError` with codes: auth.forbidden, auth.unauthorized, common.validation_error, medicine.humid_max_out_of_range, medicine.humid_min_out_of_range, medicine.humid_range_invalid, medicine.not_found, medicine.temp_max_out_of_range, medicine.temp_min_out_of_range, medicine.temp_range_invalid.
   */
  async update(id: number, data: MedicineUpdateDto): Promise<Medicine> {
    const response = await wrapApiCall(() =>
      medicinesApi.medicinesUpdateById({
        id,
        medicineDto: toSdkMedicineDto(data),
      }),
    )
    return mapMedicine(response)
  },

  /**
   * Wrapper for `medicinesDelete` (`DELETE /api/v1/medicines/{id}`).
   * Required roles: Admin.
   * Throws `AppApiError` with codes: auth.forbidden, auth.unauthorized, medicine.has_batches, medicine.not_found.
   */
  async delete(id: number): Promise<void> {
    await wrapApiCall(() => medicinesApi.medicinesDelete({ id }))
  },
}

export default medicinesService
