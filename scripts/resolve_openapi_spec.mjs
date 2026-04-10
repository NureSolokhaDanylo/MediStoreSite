import { resolveOpenApiSpec } from './sdk_contract_utils.mjs'

const explicitPath = process.argv[2]
console.log(resolveOpenApiSpec(explicitPath))
