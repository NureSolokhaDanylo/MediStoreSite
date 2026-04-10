import {
  ApiErrorFromJSON,
  FetchError,
  RequiredError,
  ResponseError,
  type ApiError as SdkApiError,
} from '@/sdk/generated'
import { i18n } from '@/i18n'
import { clearStoredSession, redirectToLogin } from './session'

let unauthorizedRedirectInFlight = false

export class AppApiError extends Error {
  code?: string
  details?: unknown
  isUnknownCode: boolean
  serverMessage?: string
  status?: number
  traceId?: string

  constructor(params: {
    code?: string
    details?: unknown
    isUnknownCode?: boolean
    message: string
    serverMessage?: string
    status?: number
    traceId?: string
  }) {
    super(params.message)
    this.name = 'AppApiError'
    this.code = params.code
    this.details = params.details
    this.isUnknownCode = Boolean(params.isUnknownCode)
    this.serverMessage = params.serverMessage
    this.status = params.status
    this.traceId = params.traceId
  }
}

export async function wrapApiCall<T>(callback: () => Promise<T>): Promise<T> {
  try {
    return await callback()
  } catch (error) {
    throw await normalizeApiError(error)
  }
}

export async function normalizeApiError(error: unknown): Promise<AppApiError> {
  if (error instanceof AppApiError) {
    return error
  }

  if (error instanceof ResponseError) {
    const parsed = await parseResponseError(error)
    if (parsed) {
      if (parsed.code === 'auth.unauthorized') {
        handleUnauthorized()
      }
      return parsed
    }

    const serverMessage = await safeReadText(error.response)

    return new AppApiError({
      isUnknownCode: true,
      message: buildUnknownMessage({
        serverMessage,
        status: error.response.status,
      }),
      serverMessage,
      status: error.response.status,
    })
  }

  if (error instanceof FetchError) {
    return new AppApiError({
      isUnknownCode: true,
      message: translate('apiErrorMeta.network'),
      serverMessage: error.cause?.message,
    })
  }

  if (error instanceof RequiredError) {
    return new AppApiError({
      isUnknownCode: true,
      message: `${translate('apiErrorMeta.client')} ${error.message}`.trim(),
      serverMessage: error.message,
    })
  }

  if (error instanceof Error) {
    return new AppApiError({
      isUnknownCode: true,
      message: `${translate('apiErrorMeta.unexpected')} ${error.message}`.trim(),
      serverMessage: error.message,
    })
  }

  return new AppApiError({
    isUnknownCode: true,
    message: translate('apiErrorMeta.unexpected'),
  })
}

async function parseResponseError(error: ResponseError): Promise<AppApiError | null> {
  const contentType = error.response.headers.get('content-type') || ''
  if (!/application\/json|[+]json/i.test(contentType)) {
    return null
  }

  try {
    const json = await error.response.clone().json()
    const payload = ApiErrorFromJSON(json) as SdkApiError
    if (!payload?.code) {
      return null
    }

    const mappedMessage = translateCode(payload.code)

    return new AppApiError({
      code: payload.code,
      details: payload.details,
      isUnknownCode: !mappedMessage,
      message: mappedMessage ?? buildUnknownMessage(payload),
      serverMessage: payload.message,
      status: payload.status ?? error.response.status,
      traceId: payload.traceId,
    })
  } catch {
    return null
  }
}

function translateCode(code: string): string | null {
  const key = `apiErrors.${code}`
  return i18n.global.te(key) ? String(i18n.global.t(key)) : null
}

function translate(key: string): string {
  return String(i18n.global.t(key))
}

function buildUnknownMessage(params: {
  code?: string
  details?: unknown
  serverMessage?: string
  status?: number
  traceId?: string
}): string {
  const parts = [translate('apiErrorMeta.unknown')]

  if (params.code) {
    parts.push(`${translate('apiErrorMeta.code')}: ${params.code}`)
  }

  if (params.status) {
    parts.push(`${translate('apiErrorMeta.status')}: ${params.status}`)
  }

  if (params.traceId) {
    parts.push(`${translate('apiErrorMeta.traceId')}: ${params.traceId}`)
  }

  if (params.serverMessage) {
    parts.push(`${translate('apiErrorMeta.serverMessage')}: ${params.serverMessage}`)
  }

  const details = formatDetails(params.details)
  if (details) {
    parts.push(`${translate('apiErrorMeta.details')}: ${details}`)
  }

  return parts.join(' | ')
}

function formatDetails(details: unknown): string | null {
  if (details === undefined || details === null) {
    return null
  }

  if (typeof details === 'string') {
    return details
  }

  try {
    return JSON.stringify(details)
  } catch {
    return String(details)
  }
}

async function safeReadText(response: Response): Promise<string | undefined> {
  try {
    const text = await response.clone().text()
    return text.trim() || undefined
  } catch {
    return undefined
  }
}

function handleUnauthorized(): void {
  clearStoredSession()

  if (unauthorizedRedirectInFlight) {
    return
  }

  unauthorizedRedirectInFlight = true
  redirectToLogin()
}
