import fs from 'node:fs'
import { discoverEndpointFiles, loadOperationMetadata, resolveOpenApiSpec, syncWrapperDocsForFile } from './sdk_contract_utils.mjs'

const explicitSpecPath = process.argv.find((arg) => !arg.startsWith('--') && arg !== process.argv[1] && arg !== process.argv[0])
const checkMode = process.argv.includes('--check')
const specPath = resolveOpenApiSpec(explicitSpecPath)
const { operations } = loadOperationMetadata(specPath)

const changedFiles = []

for (const filePath of discoverEndpointFiles()) {
  const result = syncWrapperDocsForFile(filePath, operations)
  if (!result.changed) {
    continue
  }

  changedFiles.push(filePath)

  if (!checkMode) {
    fs.writeFileSync(filePath, result.nextSource)
  }
}

if (changedFiles.length === 0) {
  console.log(`Wrapper JSDoc is up to date for ${specPath}.`)
  process.exit(0)
}

if (checkMode) {
  console.error('Wrapper JSDoc is out of date for:')
  for (const filePath of changedFiles) {
    console.error(`- ${filePath}`)
  }
  process.exit(1)
}

console.log(`Updated wrapper JSDoc from ${specPath}:`)
for (const filePath of changedFiles) {
  console.log(`- ${filePath}`)
}
