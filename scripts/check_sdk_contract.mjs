import path from 'node:path'
import {
  discoverEndpointFiles,
  extractDocumentedApiErrorCodes,
  findWrappedOperations,
  formatOperationReference,
  loadOperationMetadata,
  resolveOpenApiSpec,
  syncWrapperDocsForFile,
} from './sdk_contract_utils.mjs'
import { IGNORED_OPERATION_IDS } from './sdk_contract_config.mjs'

const explicitSpecPath = process.argv[2]
const specPath = resolveOpenApiSpec(explicitSpecPath)
const { allErrorCodes, operations } = loadOperationMetadata(specPath)
const localizedCodes = extractDocumentedApiErrorCodes()

const wrappedOperations = []
for (const filePath of discoverEndpointFiles()) {
  for (const block of findWrappedOperations(filePath)) {
    if (block.operationIds.length === 1) {
      wrappedOperations.push({
        filePath,
        methodName: block.methodName,
        operationId: block.operationIds[0],
      })
    }
  }
}

const wrappedOperationIds = new Set(wrappedOperations.map((entry) => entry.operationId))
const missingWrappers = [...operations.keys()]
  .filter((operationId) => !wrappedOperationIds.has(operationId) && !IGNORED_OPERATION_IDS.has(operationId))
  .sort()

const unknownIgnored = [...IGNORED_OPERATION_IDS]
  .filter((operationId) => !operations.has(operationId))
  .sort()

const missingErrorMessagesEn = [...allErrorCodes].filter((code) => !localizedCodes.en.has(code)).sort()
const missingErrorMessagesUk = [...allErrorCodes].filter((code) => !localizedCodes.uk.has(code)).sort()

const staleErrorMessagesEn = [...localizedCodes.en].filter((code) => !allErrorCodes.has(code)).sort()
const staleErrorMessagesUk = [...localizedCodes.uk].filter((code) => !allErrorCodes.has(code)).sort()

const outdatedDocFiles = []
for (const filePath of discoverEndpointFiles()) {
  const result = syncWrapperDocsForFile(filePath, operations)
  if (result.changed) {
    outdatedDocFiles.push(path.relative(process.cwd(), filePath))
  }
}

let failed = false

if (missingWrappers.length > 0) {
  failed = true
  console.error('Missing wrapper coverage for OpenAPI operations:')
  for (const operationId of missingWrappers) {
    console.error(`- ${formatOperationReference(operations.get(operationId))}`)
  }
}

if (missingErrorMessagesEn.length > 0 || missingErrorMessagesUk.length > 0) {
  failed = true
  console.error('Missing localized AppApiError messages:')
  for (const code of missingErrorMessagesEn) {
    console.error(`- EN: ${code}`)
  }
  for (const code of missingErrorMessagesUk) {
    console.error(`- UK: ${code}`)
  }
}

if (outdatedDocFiles.length > 0) {
  failed = true
  console.error('Wrapper JSDoc is out of date in:')
  for (const filePath of outdatedDocFiles) {
    console.error(`- ${filePath}`)
  }
}

if (unknownIgnored.length > 0) {
  failed = true
  console.error('Ignored operation ids do not exist in the selected OpenAPI spec:')
  for (const operationId of unknownIgnored) {
    console.error(`- ${operationId}`)
  }
}

if (!failed) {
  console.log(`SDK contract checks passed for ${specPath}.`)
}

if (staleErrorMessagesEn.length > 0 || staleErrorMessagesUk.length > 0) {
  console.warn('Stale localized error messages detected:')
  for (const code of staleErrorMessagesEn) {
    console.warn(`- EN stale: ${code}`)
  }
  for (const code of staleErrorMessagesUk) {
    console.warn(`- UK stale: ${code}`)
  }
}

process.exit(failed ? 1 : 0)
