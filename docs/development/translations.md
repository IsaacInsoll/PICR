# Translating PICR

PICR uses i18next and react-i18next for the web interface. English is the typed source catalog and
French is the first additional language. The React Native app and server-sent notifications are not
localized yet.

Coordinate new languages and fluent reviewers through the relevant GitHub issue. Plain JSON pull
requests are the translation workflow until contributor volume justifies a hosted translation tool.

## Catalog structure

Catalogs live under `shared/i18n/locales/<language>/` and use three namespaces:

| Namespace | Content                                                                 |
| --------- | ----------------------------------------------------------------------- |
| `common`  | Small cross-surface labels such as language, dates, tables, and updates |
| `gallery` | Public galleries and file-review UI                                     |
| `admin`   | Login, dashboard, settings, users, links, and branding                  |

Use US English for source strings. Keep keys semantic and grouped by feature; do not use the English
sentence itself as a key.

The English catalog supplies TypeScript's key union through `frontend/src/i18n/i18next.d.ts`.
Components should select the narrow namespace they use:

```tsx
const { t } = useTranslation('admin');

return <Button>{t('common.save')}</Button>;
```

Helpers that receive a `TFunction` do not give the extractor enough context to infer a namespace.
Pass the namespace explicitly at those call sites, for example
`t('metadata.Camera', { ns: 'gallery' })`.

## Add a language

1. Add its language code and self-name to `shared/i18n/languages.ts`. Use a language code such as
   `de`, not a country code such as `DE` or a single regional variant such as `de-CH`.
2. Copy all three English catalogs into `shared/i18n/locales/<code>/` and translate their values.
   Preserve key names and interpolation tokens exactly.
3. Import and register the three catalogs in `shared/i18n/resources.ts`.
4. Add the code to `locales` and `secondaryLanguages` in `i18next.config.ts`.
5. Add representative browser coverage for detection, manual selection, persistence, `<html lang>`,
   and one plural/interpolation case. Do not duplicate the entire catalog in browser assertions.
6. Run the validation commands at the end of this guide and obtain fluent review.

Catalogs are eagerly bundled today. Revisit lazy loading at roughly five supported languages rather
than designing it into each new catalog.

## Plurals and interpolation

Use i18next plural suffixes and pass a numeric `count`:

```json
{
  "file_one": "{{count}} file",
  "file_other": "{{count}} files"
}
```

```tsx
t('count.file', { count: files.length });
```

Do not use `count` for a number that is not meant to select a plural form. Choose a descriptive token
instead. Preserve all `{{doubleBrace}}` i18next interpolation tokens in translations. Third-party
components may define a different template syntax—for example, the lightbox's slide-count template
uses single braces—so copy the library's token shape exactly.

Languages can legitimately have more plural forms than English. Do not compare raw key sets with a
bespoke parity script; `npm run i18n:check` is the plural-aware project gate.

## Dynamic keys and shared fallbacks

Static extraction cannot see a key assembled or selected at runtime, even when TypeScript constrains
it to a finite union. Register every such path under its namespace in `dynamicCatalogPatterns` in
`i18next.config.ts`. Prefer explicit leaves when a family mixes static and dynamic keys; use a
namespace-qualified wildcard only when the whole subtree is dynamic.

`npm run i18n:check` combines i18next-cli's source/unused-key reports with
`tests/api/i18nCatalogContracts.unit.test.ts`. Extend that contract when a shared registry supplies
English presentation fallbacks, as the metadata, font, auth-error, and social-link registries do.
This keeps every locale complete and prevents the English catalog from drifting away from the
untranslated fallback.

Keep `shared/` formatting and presentation helpers independent of the i18next runtime. The mobile app
imports them but does not load the web catalogs. Accept a translator or localized label when needed
and retain an English fallback for untranslated consumers; never import all catalog resources into a
shared leaf helper.

## Language, formatting, and stable data

The catalog language controls interface prose. The formatting locale controls regional date and
number patterns. Keep them separate: an `en-AU` browser uses the English catalog while retaining
Australian formatting, and relative-time prose follows the catalog language to avoid mixed-language
sentences.

Translate display labels, never stable identifiers or user data. Enum values, GraphQL values, sort
keys, folder/file names, comments, branding text, access-log device names, backend diagnostics, and
machine-readable CSV values (including `approved` and `rejected`) must not change when the interface
language changes. When a value and a label currently have the same English spelling, split or
preserve the stable value and translate only the label.

## Review policy and new scripts

Machine-assisted translation is allowed only when it is disclosed in the pull request. A fluent human
must review the catalog before PICR describes that language as supported. Coordinate reviewers through
GitHub issues; do not infer a preferred language from someone's name or location.

Before adding a language that uses a new script, verify every interface font and branding heading
fallback with representative translated headings and user-supplied folder/gallery names. Greek in
particular requires the selected branding font → Roboto → system stack to be implemented and visually
verified before an `el` catalog is added. Do not filter branding choices by interface language: the
language of a photographer's content can differ from the viewer's interface language.

## Literal-string lint boundary

The frontend's `i18next/no-literal-string` rule is a regression guard, not proof that every possible
string is translated. It examines literals lexically inside JSX and a narrow set of user-facing
attributes, then honors enclosing component, call, object-property, typed, and content exclusions.
Module-level data, helper bodies, and event handlers defined outside returned JSX are not covered.

A separate syntax rule rejects direct literal `title` or `message` properties in inline
`notifications.show({...})` calls. It does not trace notification objects through variables or catch
templates and conditional expressions, so review those manually. Keep exceptions file-scoped and
explained; the development-only backend-override banner is the current intentional exception.

## Validation

Run at least:

```bash
npm run i18n:check
npm run check
npm run test:unit
cd frontend && npm run build
```

For visible frontend changes, also run `npm run test:e2e:fresh` from the repository root. The
maintainer runs `npm run workflow` for full CI parity before merge.
