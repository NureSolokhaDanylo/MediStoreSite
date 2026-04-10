import path from 'node:path'
import { fileURLToPath } from 'node:url'

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url))

export const ROOT_DIR = path.resolve(SCRIPT_DIR, '..')
export const OPENAPI_DIR = path.join(ROOT_DIR, 'openapi')
export const ROOT_OPENAPI_FILE = path.join(ROOT_DIR, 'openapi.json')
export const GENERATED_SDK_DIR = path.join(ROOT_DIR, 'src', 'sdk', 'generated')
export const ENDPOINTS_DIR = path.join(ROOT_DIR, 'src', 'services', 'endpoints')
export const API_ERRORS_FILE = path.join(ROOT_DIR, 'src', 'i18n', 'apiErrors.ts')

export const IGNORED_OPERATION_IDS = new Set([
  'auditLogsGetByTypePaged',
  'batchesUpdateBatches',
  'medicinesUpdateMedicines',
  'pingPing',
  'pushRegisterDevice',
  'readingsCreateForSensor',
  'readingsGet',
  'readingsGetAll',
  'zonesUpdateZones',
])
