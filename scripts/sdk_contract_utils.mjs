import fs from 'node:fs'
import path from 'node:path'
import {
  API_ERRORS_FILE,
  ENDPOINTS_DIR,
  OPENAPI_DIR,
  ROOT_OPENAPI_FILE,
} from './sdk_contract_config.mjs'

const VERSIONED_OPENAPI_RE = /^openapi\.v(\d+)\.json$/i
const METHOD_RE = /^(\s*)(async\s+)?([A-Za-z_$][\w$]*)\s*\([^)]*\)\s*:\s*[^=]+{\s*$/
const OPERATION_CALL_RE = /\b[a-zA-Z]+Api\.([A-Za-z0-9_]+)\s*\(/g
const ERROR_CODE_RE = /\b[a-z][a-z0-9_]*\.[a-z0-9_.]+\b/g
const ROLES_RE = /^Required roles:\s*(.+)$/im
const INTERNAL_CODES_RE = /^Possible internal codes:\s*(.+)$/im

export function resolveOpenApiSpec(explicitPath) {
  if (explicitPath) {
    return path.resolve(explicitPath)
  }

  const versionedFiles = listVersionedOpenApiFiles()
  if (versionedFiles.length > 0) {
    return versionedFiles[0].path
  }

  return ROOT_OPENAPI_FILE
}

export function listVersionedOpenApiFiles() {
  if (!fs.existsSync(OPENAPI_DIR)) {
    return []
  }

  return fs.readdirSync(OPENAPI_DIR)
    .map((name) => {
      const match = name.match(VERSIONED_OPENAPI_RE)
      if (!match) {
        return null
      }

      return {
        name,
        path: path.join(OPENAPI_DIR, name),
        version: Number.parseInt(match[1], 10),
      }
    })
    .filter(Boolean)
    .sort((left, right) => right.version - left.version)
}

export function loadOperationMetadata(specPath) {
  const spec = JSON.parse(fs.readFileSync(specPath, 'utf8'))
  const operations = new Map()
  const allErrorCodes = new Set()

  for (const [routePath, pathItem] of Object.entries(spec.paths || {})) {
    for (const [method, operation] of Object.entries(pathItem || {})) {
      if (!['get', 'post', 'put', 'delete', 'patch'].includes(method)) {
        continue
      }

      if (!operation?.operationId) {
        continue
      }

      const roles = extractRoles(operation.description)
      const errorCodes = extractErrorCodes(operation.description, operation.responses)
      for (const code of errorCodes) {
        allErrorCodes.add(code)
      }

      operations.set(operation.operationId, {
        errorCodes,
        method: method.toUpperCase(),
        operationId: operation.operationId,
        path: routePath,
        roles,
      })
    }
  }

  return {
    allErrorCodes,
    operations,
  }
}

export function discoverEndpointFiles() {
  return fs.readdirSync(ENDPOINTS_DIR)
    .filter((name) => name.endsWith('.ts'))
    .map((name) => path.join(ENDPOINTS_DIR, name))
    .sort()
}

export function findWrappedOperations(filePath) {
  const source = fs.readFileSync(filePath, 'utf8')
  const lines = source.split('\n')
  const blocks = []

  for (let index = 0; index < lines.length; index += 1) {
    const match = lines[index].match(METHOD_RE)
    if (!match) {
      continue
    }

    let braceDepth = countBraces(lines[index])
    let endIndex = index
    while (braceDepth > 0 && endIndex + 1 < lines.length) {
      endIndex += 1
      braceDepth += countBraces(lines[endIndex])
    }

    const blockText = lines.slice(index, endIndex + 1).join('\n')
    const operationIds = [...blockText.matchAll(OPERATION_CALL_RE)].map((entry) => entry[1])
    const uniqueOperationIds = [...new Set(operationIds)]

    blocks.push({
      endLine: endIndex,
      filePath,
      indent: match[1],
      methodName: match[3],
      operationIds: uniqueOperationIds,
      source,
      startLine: index,
    })

    index = endIndex
  }

  return blocks
}

export function syncWrapperDocsForFile(filePath, operations) {
  const source = fs.readFileSync(filePath, 'utf8')
  let lines = source.split('\n')
  const blocks = findWrappedOperations(filePath)
  const changes = []

  for (const block of [...blocks].reverse()) {
    if (block.operationIds.length !== 1) {
      continue
    }

    const operationId = block.operationIds[0]
    const metadata = operations.get(operationId)
    if (!metadata) {
      continue
    }

    const docLines = buildDocBlock(metadata, block.indent)
    const existingDoc = findLeadingDocBlock(lines, block.startLine)
    const replaceStart = existingDoc ? existingDoc.startLine : block.startLine
    const replaceEnd = existingDoc ? existingDoc.endLine : block.startLine - 1

    const before = lines.slice(replaceStart, replaceEnd + 1).join('\n')
    const nextLines = [
      ...lines.slice(0, replaceStart),
      ...docLines,
      ...lines.slice(block.startLine),
    ]

    const after = docLines.join('\n')
    if (before !== after) {
      changes.push({
        filePath,
        methodName: block.methodName,
        operationId,
      })
    }

    lines = nextLines
  }

  return {
    changed: lines.join('\n') !== source,
    changes,
    nextSource: lines.join('\n'),
    source,
  }
}

export function extractDocumentedApiErrorCodes() {
  return {
    en: extractApiErrorCodesFromConst(API_ERRORS_FILE, 'apiErrorsEn'),
    uk: extractApiErrorCodesFromConst(API_ERRORS_FILE, 'apiErrorsUk'),
  }
}

export function formatOperationReference(metadata) {
  return `${metadata.operationId} (${metadata.method} ${metadata.path})`
}

function extractRoles(description) {
  const match = String(description || '').match(ROLES_RE)
  if (!match) {
    return []
  }

  return match[1]
    .split(',')
    .map((role) => role.trim())
    .filter(Boolean)
}

function extractErrorCodes(description, responses) {
  const codes = new Set()

  for (const match of extractInlineErrorCodesFromDescription(description)) {
    codes.add(match)
  }

  for (const response of Object.values(responses || {})) {
    const description = String(response?.description || '')
    for (const match of description.match(ERROR_CODE_RE) || []) {
      codes.add(match)
    }

    for (const match of extractInlineErrorCodesFromDescription(description)) {
      codes.add(match)
    }
  }

  return [...codes].sort()
}

function countBraces(line) {
  let depth = 0
  for (const char of line) {
    if (char === '{') {
      depth += 1
    } else if (char === '}') {
      depth -= 1
    }
  }

  return depth
}

function findLeadingDocBlock(lines, startLine) {
  let endLine = startLine - 1
  while (endLine >= 0 && lines[endLine].trim() === '') {
    endLine -= 1
  }

  if (endLine < 0 || lines[endLine].trim() !== '*/') {
    return null
  }

  const overallEnd = endLine
  let overallStart = endLine
  let scanEnd = endLine

  while (scanEnd >= 0 && lines[scanEnd].trim() === '*/') {
    let currentLine = scanEnd
    while (currentLine >= 0) {
      const trimmed = lines[currentLine].trim()
      if (trimmed.startsWith('/**')) {
        overallStart = currentLine
        break
      }

      currentLine -= 1
    }

    if (currentLine < 0) {
      return null
    }

    scanEnd = currentLine - 1
    while (scanEnd >= 0 && lines[scanEnd].trim() === '') {
      scanEnd -= 1
    }

    if (scanEnd < 0 || lines[scanEnd].trim() !== '*/') {
      break
    }
  }

  return {
    startLine: overallStart,
    endLine: overallEnd,
  }
}

function buildDocBlock(metadata, indent) {
  const roles = metadata.roles.length > 0
    ? metadata.roles.join(', ')
    : 'not specified in OpenAPI'
  const codes = metadata.errorCodes.length > 0
    ? metadata.errorCodes.join(', ')
    : 'not documented in OpenAPI'

  return [
    `${indent}/**`,
    `${indent} * Wrapper for \`${metadata.operationId}\` (\`${metadata.method} ${metadata.path}\`).`,
    `${indent} * Required roles: ${roles}.`,
    `${indent} * Throws \`AppApiError\` with codes: ${codes}.`,
    `${indent} */`,
  ]
}

function extractApiErrorCodesFromConst(filePath, constName) {
  const source = fs.readFileSync(filePath, 'utf8')
  const marker = `export const ${constName} = {`
  const startIndex = source.indexOf(marker)
  if (startIndex === -1) {
    return new Set()
  }

  const lines = source.slice(startIndex + marker.length).split('\n')
  const codes = new Set()
  let namespace = null

  for (const line of lines) {
    if (line.trim() === '} as const') {
      break
    }

    const namespaceMatch = line.match(/^  ([a-z0-9_]+): \{$/)
    if (namespaceMatch) {
      namespace = namespaceMatch[1]
      continue
    }

    if (line.match(/^  },?$/)) {
      namespace = null
      continue
    }

    const codeMatch = line.match(/^    ([a-z0-9_]+): /)
    if (namespace && codeMatch) {
      codes.add(`${namespace}.${codeMatch[1]}`)
    }
  }

  return codes
}

function extractInlineErrorCodesFromDescription(description) {
  const match = String(description || '').match(INTERNAL_CODES_RE)
  if (!match) {
    return []
  }

  return match[1].match(ERROR_CODE_RE) || []
}
