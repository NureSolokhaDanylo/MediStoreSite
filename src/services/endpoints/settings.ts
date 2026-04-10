import { appSettingsApi } from '../api/sdk'
import { wrapApiCall } from '../api/errors'
import type { AppSettings, AppSettingsDto } from '@/sdk/generated'

export type { AppSettings, AppSettingsDto }

export const settingsService = {
  /**
   * Wrapper for `appSettingsGet` (`GET /api/v1/settings`).
   * Required roles: Admin, Operator.
   * Throws `AppApiError` with codes: app_settings.not_found, auth.forbidden, auth.unauthorized.
   */
  async get(): Promise<AppSettings> {
    return wrapApiCall(() => appSettingsApi.appSettingsGet())
  },

  /**
   * Wrapper for `appSettingsUpdate` (`PUT /api/v1/settings`).
   * Required roles: Admin.
   * Throws `AppApiError` with codes: app_settings.humidity_alert_deviation_out_of_range, app_settings.not_found, app_settings.readings_retention_days_out_of_range, app_settings.temp_alert_deviation_out_of_range, auth.forbidden, auth.unauthorized.
   */
  async update(payload: AppSettingsDto): Promise<AppSettings> {
    return await wrapApiCall(() =>
      appSettingsApi.appSettingsUpdate({
        appSettingsDto: payload,
      }),
    )
  },
}

export default settingsService
