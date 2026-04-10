---
name: update-sdk-from-openapi
description: Use when the task is to refresh the generated TypeScript SDK from the latest versioned OpenAPI spec in ./openapi, sync wrapper JSDoc with required roles and AppApiError codes, and verify that wrapper coverage and localized error mappings still match the spec.
---

# Update SDK From OpenAPI

This skill is for this repository's SDK refresh workflow.

## Use this skill when

- The user asks to update or regenerate the SDK.
- `openapi/openapi.vNNNN.json` changed.
- Wrapper docs, error-code mappings, or role coverage need to be synced with the latest spec.

## Source of truth

- Prefer the highest versioned file in `./openapi` named `openapi.vNNNN.json`.
- `./openapi.json` is only a fallback when no versioned files exist.
- The generator and all contract scripts already use the same resolver, so do not guess the file manually.

## Workflow

1. Resolve the selected spec if you need to inspect it:
   - `node scripts/resolve_openapi_spec.mjs`
2. Refresh generated SDK:
   - `npm run sdk:generate`
3. Sync wrapper JSDoc in `src/services/endpoints`:
   - `npm run sdk:sync-wrapper-docs`
4. Validate wrapper coverage and error-message coverage:
   - `npm run sdk:check-contract`
5. Run project checks:
   - `npm run type-check`
   - `npm run build`

## What the scripts enforce

- Wrapper JSDoc is generated from OpenAPI `operationId`, HTTP method/path, `Required roles:` and `Possible internal codes:` text.
- Wrapper methods are documented as throwing `AppApiError` with specific `code` values.
- Every OpenAPI error code must exist in `src/i18n/apiErrors.ts` for both locales.
- Any OpenAPI operation without a wrapper must be either implemented or explicitly listed in `scripts/sdk_contract_config.mjs` as ignored.

## When checks fail

- Missing wrapper coverage:
  Add or update the wrapper in `src/services/endpoints/*`, then rerun doc sync and checks.
- Missing localized error codes:
  Add the code to both `apiErrorsEn` and `apiErrorsUk` in `src/i18n/apiErrors.ts`.
- Outdated JSDoc:
  Run `npm run sdk:sync-wrapper-docs`.
- Intentionally unwrapped operation:
  Add its `operationId` to `IGNORED_OPERATION_IDS` in `scripts/sdk_contract_config.mjs` only if the omission is deliberate.

## Notes

- Do not manually edit generated files in `src/sdk/generated`.
- Runtime error normalization still happens through `wrapApiCall` and `AppApiError`; the JSDoc is documentation, not a second error implementation.
- The scripts parse the current description-based role/error format from OpenAPI, so if the spec format changes, update the parser before trusting the results.
