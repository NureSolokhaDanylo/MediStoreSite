import { accountApi } from '../api/sdk'
import { wrapApiCall } from '../api/errors'
import type {
  ChangePasswordDto,
  ChangeRolesDto,
  CreateAccountDto,
  PagedResultDtoOfUserDto,
} from '@/sdk/generated'

export interface UsersListParams {
  skip?: number
  take?: number
  q?: string
  role?: string
}

export const usersService = {
  /**
   * Wrapper for `accountGetUsers` (`GET /api/v1/account/users`).
   * Required roles: Admin.
   * Throws `AppApiError` with codes: account.invalid_paging, auth.forbidden, auth.unauthorized.
   */
  async getAll(params: UsersListParams = {}): Promise<PagedResultDtoOfUserDto> {
    return wrapApiCall(() =>
      accountApi.accountGetUsers({
        skip: params.skip ?? 0,
        take: params.take ?? 50,
        q: params.q,
        role: params.role,
      }),
    )
  },

  /**
   * Wrapper for `accountCreateAccount` (`POST /api/v1/account`).
   * Required roles: Admin.
   * Throws `AppApiError` with codes: account.create_failed, account.requester_not_found, account.roles_do_not_exist, auth.forbidden, auth.unauthorized.
   */
  async create(payload: CreateAccountDto): Promise<void> {
    await wrapApiCall(() =>
      accountApi.accountCreateAccount({
        createAccountDto: payload,
      }),
    )
  },

  /**
   * Wrapper for `accountChangePassword` (`POST /api/v1/account/change-password`).
   * Required roles: not specified in OpenAPI.
   * Throws `AppApiError` with codes: account.change_password_failed, account.requester_not_found, account.target_user_not_found, auth.current_password_incorrect, auth.current_password_required, auth.forbidden, auth.unauthorized.
   */
  async changePassword(payload: ChangePasswordDto): Promise<void> {
    await wrapApiCall(() =>
      accountApi.accountChangePassword({
        changePasswordDto: payload,
      }),
    )
  },

  /**
   * Wrapper for `accountChangeRoles` (`POST /api/v1/account/roles`).
   * Required roles: Admin.
   * Throws `AppApiError` with codes: account.cannot_change_admin_roles, account.requester_not_found, account.roles_do_not_exist, account.target_user_not_found, auth.forbidden, auth.unauthorized.
   */
  async changeRoles(payload: ChangeRolesDto): Promise<void> {
    await wrapApiCall(() =>
      accountApi.accountChangeRoles({
        changeRolesDto: payload,
      }),
    )
  },

  /**
   * Wrapper for `accountDelete` (`DELETE /api/v1/account/{id}`).
   * Required roles: Admin.
   * Throws `AppApiError` with codes: account.cannot_delete_self, account.delete_failed, account.requester_not_found, account.target_user_not_found, auth.forbidden, auth.unauthorized.
   */
  async deleteById(id: string): Promise<void> {
    await wrapApiCall(() => accountApi.accountDelete({ id }))
  },
}

export default usersService
