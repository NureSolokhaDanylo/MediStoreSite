import type {
  AlertDto,
  AuditLogDto,
  BatchCreateDto as SdkBatchCreateDto,
  BatchDto,
  BatchSearchResultDto,
  MedicineCreateDto as SdkMedicineCreateDto,
  MedicineDto,
  MedicineSearchResultDto,
  PagedResultDtoOfAlertDto,
  PagedResultDtoOfAuditLogDto,
  PagedResultDtoOfSensorDto,
  PagedSearchResultDtoOfBatchSearchResultDto,
  PagedSearchResultDtoOfMedicineSearchResultDto,
  PagedSearchResultDtoOfZoneSearchResultDto,
  ReadingDto,
  SensorCreateDto as SdkSensorCreateDto,
  SensorDto,
  SensorUpdateDto as SdkSensorUpdateDto,
  ZoneCreateDto as SdkZoneCreateDto,
  ZoneDto,
  ZoneSearchResultDto,
} from '@/sdk/generated'
import type {
  Alert,
  AlertDtoPagedResultDto,
  AuditLog,
  Batch,
  BatchCreateDto,
  BatchSearchResult,
  BatchUpdateDto,
  Medicine,
  MedicineCreateDto,
  MedicineSearchResult,
  MedicineUpdateDto,
  PagedResult,
  PagedSearchResult,
  Reading,
  Sensor,
  SensorUpdateDto,
  Zone,
  ZoneCreateDto,
  ZoneSearchResult,
} from '@/types'
import { AppApiError } from './errors'

export function mapAlert(dto: AlertDto): Alert {
  return {
    alertType: dto.alertType,
    batchId: dto.batchId,
    createdAt: asString(dto.createdAt) ?? '',
    id: dto.id,
    isActive: dto.isActive,
    message: dto.message,
    resolvedAt: asString(dto.resolvedAt),
    zoneId: dto.zoneId,
  }
}

export function mapAlertPage(dto: PagedResultDtoOfAlertDto): AlertDtoPagedResultDto {
  return {
    hasMore: dto.hasMore,
    items: dto.items.map(mapAlert),
    skip: dto.skip,
    take: dto.take,
    totalCount: dto.totalCount,
  }
}

export function mapAuditLog(dto: AuditLogDto): AuditLog {
  return {
    action: dto.action ?? undefined,
    entityId: dto.entityId,
    entityType: dto.entityType ?? undefined,
    id: requiredNumber(dto.id, 'auditLog.id'),
    newValues: dto.newValues ?? undefined,
    occurredAt: asString(dto.occurredAt) ?? undefined,
    oldValues: dto.oldValues ?? undefined,
    summary: dto.summary ?? undefined,
    userId: dto.userId ?? undefined,
  }
}

export function mapAuditLogPage(dto: PagedResultDtoOfAuditLogDto): PagedResult<AuditLog> {
  return {
    hasMore: dto.hasMore,
    items: dto.items.map(mapAuditLog),
    skip: dto.skip,
    take: dto.take,
    totalCount: dto.totalCount,
  }
}

export function mapBatch(dto: BatchDto): Batch {
  return {
    batchNumber: dto.batchNumber,
    dateAdded: asString(dto.dateAdded) ?? '',
    expireDate: asString(dto.expireDate) ?? '',
    id: dto.id,
    medicineId: dto.medicineId,
    quantity: dto.quantity,
    zoneId: dto.zoneId,
  }
}

export function mapBatchSearchResult(dto: BatchSearchResultDto): BatchSearchResult {
  return {
    batchNumber: dto.batchNumber,
    id: requiredNumber(dto.id, 'batchSearchResult.id'),
    medicineId: requiredNumber(dto.medicineId, 'batchSearchResult.medicineId'),
    zoneId: requiredNumber(dto.zoneId, 'batchSearchResult.zoneId'),
  }
}

export function mapBatchSearchPage(dto: PagedSearchResultDtoOfBatchSearchResultDto): PagedSearchResult<BatchSearchResult> {
  return {
    items: requiredArray(dto.items, 'batchSearch.items').map(mapBatchSearchResult),
    limit: requiredNumber(dto.limit, 'batchSearch.limit'),
    offset: requiredNumber(dto.offset, 'batchSearch.offset'),
    totalCount: requiredNumber(dto.totalCount, 'batchSearch.totalCount'),
  }
}

export function toSdkBatchCreateDto(dto: BatchCreateDto): SdkBatchCreateDto {
  return {
    batchNumber: dto.batchNumber,
    dateAdded: asDate(dto.dateAdded),
    expireDate: asDate(dto.expireDate),
    medicineId: dto.medicineId,
    quantity: dto.quantity,
    zoneId: dto.zoneId,
  }
}

export function toSdkBatchDto(dto: BatchUpdateDto): BatchDto {
  return {
    batchNumber: dto.batchNumber,
    dateAdded: asDate(dto.dateAdded),
    expireDate: asDate(dto.expireDate),
    id: dto.id,
    medicineId: dto.medicineId,
    quantity: dto.quantity,
    zoneId: dto.zoneId,
  }
}

export function mapMedicine(dto: MedicineDto): Medicine {
  return {
    description: dto.description ?? undefined,
    humidMax: dto.humidMax,
    humidMin: dto.humidMin,
    id: dto.id,
    name: dto.name,
    tempMax: dto.tempMax,
    tempMin: dto.tempMin,
  }
}

export function mapMedicineSearchResult(dto: MedicineSearchResultDto): MedicineSearchResult {
  return {
    description: dto.description ?? undefined,
    id: requiredNumber(dto.id, 'medicineSearchResult.id'),
    name: dto.name,
  }
}

export function mapMedicineSearchPage(dto: PagedSearchResultDtoOfMedicineSearchResultDto): PagedSearchResult<MedicineSearchResult> {
  return {
    items: requiredArray(dto.items, 'medicineSearch.items').map(mapMedicineSearchResult),
    limit: requiredNumber(dto.limit, 'medicineSearch.limit'),
    offset: requiredNumber(dto.offset, 'medicineSearch.offset'),
    totalCount: requiredNumber(dto.totalCount, 'medicineSearch.totalCount'),
  }
}

export function toSdkMedicineCreateDto(dto: MedicineCreateDto): SdkMedicineCreateDto {
  return {
    description: dto.description,
    humidMax: dto.humidMax,
    humidMin: dto.humidMin,
    name: dto.name,
    tempMax: dto.tempMax,
    tempMin: dto.tempMin,
  }
}

export function toSdkMedicineDto(dto: MedicineUpdateDto): MedicineDto {
  return {
    description: dto.description,
    humidMax: dto.humidMax,
    humidMin: dto.humidMin,
    id: dto.id,
    name: dto.name,
    tempMax: dto.tempMax,
    tempMin: dto.tempMin,
  }
}

export function mapReading(dto: ReadingDto): Reading {
  return {
    id: dto.id,
    timeStamp: asString(dto.timeStamp),
    value: dto.value,
  }
}

export function mapSensor(dto: SensorDto): Sensor {
  return {
    id: dto.id,
    isOn: dto.isOn,
    lastUpdate: asString(dto.lastUpdate),
    lastValue: dto.lastValue,
    sensorType: dto.sensorType,
    serialNumber: dto.serialNumber,
    zoneId: dto.zoneId,
  }
}

export function mapSensorPage(dto: PagedResultDtoOfSensorDto): PagedResult<Sensor> {
  return {
    hasMore: dto.hasMore,
    items: dto.items.map(mapSensor),
    skip: dto.skip,
    take: dto.take,
    totalCount: dto.totalCount,
  }
}

export function toSdkSensorCreateDto(dto: { serialNumber: string; sensorType: number; zoneId?: number | null }): SdkSensorCreateDto {
  return {
    isOn: true,
    sensorType: dto.sensorType,
    serialNumber: dto.serialNumber,
    zoneId: dto.zoneId,
  }
}

export function toSdkSensorUpdateDto(dto: SensorUpdateDto): SdkSensorUpdateDto {
  return {
    id: dto.id,
    isOn: dto.isOn,
    serialNumber: dto.serialNumber,
    zoneId: dto.zoneId,
  }
}

export function mapZone(dto: ZoneDto): Zone {
  return {
    description: dto.description ?? undefined,
    humidMax: dto.humidMax,
    humidMin: dto.humidMin,
    id: dto.id,
    name: dto.name,
    tempMax: dto.tempMax,
    tempMin: dto.tempMin,
  }
}

export function mapZoneSearchResult(dto: ZoneSearchResultDto): ZoneSearchResult {
  return {
    description: dto.description ?? undefined,
    id: requiredNumber(dto.id, 'zoneSearchResult.id'),
    name: dto.name,
  }
}

export function mapZoneSearchPage(dto: PagedSearchResultDtoOfZoneSearchResultDto): PagedSearchResult<ZoneSearchResult> {
  return {
    items: requiredArray(dto.items, 'zoneSearch.items').map(mapZoneSearchResult),
    limit: requiredNumber(dto.limit, 'zoneSearch.limit'),
    offset: requiredNumber(dto.offset, 'zoneSearch.offset'),
    totalCount: requiredNumber(dto.totalCount, 'zoneSearch.totalCount'),
  }
}

export function toSdkZoneCreateDto(dto: ZoneCreateDto): SdkZoneCreateDto {
  return {
    description: dto.description,
    humidMax: dto.humidMax,
    humidMin: dto.humidMin,
    name: dto.name,
    tempMax: dto.tempMax,
    tempMin: dto.tempMin,
  }
}

export function toSdkZoneDto(dto: Zone): ZoneDto {
  return {
    description: dto.description,
    humidMax: dto.humidMax,
    humidMin: dto.humidMin,
    id: dto.id,
    name: dto.name,
    tempMax: dto.tempMax,
    tempMin: dto.tempMin,
  }
}

function asString(value: Date | string | null | undefined): string | null | undefined {
  if (value === undefined) {
    return undefined
  }

  if (value === null) {
    return null
  }

  return value instanceof Date ? value.toISOString() : value
}

function asDate(value: string | Date): Date {
  if (value instanceof Date) {
    return value
  }

  const candidate = new Date(value)
  return Number.isNaN(candidate.getTime())
    ? new Date(`${value}T00:00:00.000Z`)
    : candidate
}

function requiredNumber(value: number | null | undefined, field: string): number {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value
  }

  throw responseContractError(field)
}

function requiredArray<T>(value: T[] | null | undefined, field: string): T[] {
  if (Array.isArray(value)) {
    return value
  }

  throw responseContractError(field)
}

function responseContractError(field: string): AppApiError {
  return new AppApiError({
    isUnknownCode: true,
    message: `Unexpected API response: required field "${field}" is missing or invalid.`,
  })
}
