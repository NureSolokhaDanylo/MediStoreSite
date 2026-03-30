import apiClient from '../api/client'

export interface UsersListParams {
  skip?: number
  take?: number
  q?: string
  role?: string
}

export interface CreateAccountDto {
  userName: string
  password: string
  roles?: string[]
}

export interface ChangePasswordDto {
  targetUserId?: string
  currentPassword?: string
  newPassword: string
}

export interface ChangeRolesDto {
  targetUserId: string
  roles: string[]
}

export const usersService = {
  async getAll(params: UsersListParams = {}): Promise<unknown> {
    const response = await apiClient.get<unknown>('/account/users', {
      params: {
        skip: params.skip ?? 0,
        take: params.take ?? 50,
        q: params.q,
        role: params.role,
      },
    })
    return response.data
  },

  async getById(id: string): Promise<unknown> {
    const response = await apiClient.get<unknown>('/account/users', {
      params: { skip: 0, take: 2000 },
    })
    const data = response.data as any
    const items = Array.isArray(data)
      ? data
      : Array.isArray(data?.items)
        ? data.items
        : Array.isArray(data?.data?.items)
          ? data.data.items
          : []

    const match = items.find((item: any) => {
      const candidate = item?.id ?? item?.userId ?? item?.sub
      return String(candidate) === String(id)
    })

    if (!match) {
      throw new Error('User not found')
    }
    return match
  },

  async create(payload: CreateAccountDto): Promise<unknown> {
    const response = await apiClient.post<unknown>('/account', payload)
    return response.data
  },

  async changePassword(payload: ChangePasswordDto): Promise<unknown> {
    const response = await apiClient.post<unknown>('/account/change-password', payload)
    return response.data
  },

  async changeRoles(payload: ChangeRolesDto): Promise<unknown> {
    const response = await apiClient.post<unknown>('/account/roles', payload)
    return response.data
  },

  async deleteById(id: string): Promise<void> {
    await apiClient.delete(`/account/${id}`)
  },
}

export default usersService
