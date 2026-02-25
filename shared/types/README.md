# Type Rules

Use these rules when adding or changing TypeScript types in this repo.

## Source Of Truth

- Prefer GraphQL generated types in `shared/gql/graphql.ts` as the schema truth.
- Build small shared aliases around those types when consumers need stable app-facing shapes.

## Which Type Family To Use

- Use GraphQL operation/fragment/result types for API-bound code paths.
- Use `Picr*` domain types (`shared/types/picr.ts`) for reusable cross-screen app/frontend models.
- Use `shared/types/ui.ts` view-model types for component/hook prop shapes used in multiple places.

## Keep Types Shared, Not Repeated

- If a shape is used in 2+ places, move it to `shared/types/*`.
- Avoid repeating `Pick<Picr...>` or `Partial<Pick<...>>` inline across files.

## Assertions And TS Comments

- Do not use `@ts-ignore`.
- `@ts-expect-error` is allowed only with a clear description.
- Avoid double assertions (`as unknown as`); prefer typed adapters and narrowing.

## Metadata Maps

- Use `PicrMetadataMap` from `shared/types/metadata.ts` instead of ad-hoc metadata `Record` declarations.

## Naming

- Use PascalCase for type/interface names.
- Avoid legacy `I*` prefixes unless interacting with external APIs that require that convention.
