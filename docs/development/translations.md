# Translating PICR

PICR uses i18next and react-i18next for the web interface. English is the typed source catalog. The
languages configured in the current checkout are listed in `shared/i18n/languages.ts`; the languages
released to customers are listed on the [Languages](../languages.md) page. The React Native app and
server-sent notifications are not localized yet.

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

## Add a language: end-to-end workflow

Treat this as the authoritative checklist for both human contributors and coding agents. A language
is not supported merely because its JSON files exist: implementation, automated checks, rendered UI
review, and fluent approval are all required.

### 1. Preflight

Before editing code:

1. Coordinate through the relevant GitHub issue and identify a fluent reviewer. Record whether the
   initial catalog will be human-written or machine-assisted.
2. Confirm the language's base code and self-name. Register a language code such as `de`, not a
   country code such as `DE` or one regional variant such as `de-CH`. Regional browser tags still
   control date and number formatting.
3. Confirm writing direction. PICR's translated web UI currently supports LTR languages only. Treat
   an RTL language as a separately scoped layout and `dir` implementation; do not add its catalog and
   advertise support while relying on an unverified LTR interface.
4. If the language introduces a new script, audit the complete body and branding-heading font stacks
   before translating. Verify both interface text and user-supplied folder/gallery names; CSS alone
   does not prove that the required glyphs render.
5. Count the resulting catalog languages. Catalogs are eagerly bundled today; revisit lazy loading at
   roughly five supported languages rather than adding another eager catalog automatically at that
   threshold.

### 2. Register and translate it

Complete all of these in one working branch:

1. Add the code and self-name to `shared/i18n/languages.ts`.
2. Create and fully translate all three catalogs:
   - `shared/i18n/locales/<code>/common.json`
   - `shared/i18n/locales/<code>/gallery.json`
   - `shared/i18n/locales/<code>/admin.json`
3. Import and register all three catalogs in `shared/i18n/resources.ts`.
4. Add the code to both `locales` and `secondaryLanguages` in `i18next.config.ts`.
5. Add a regional-tag case to `tests/api/resolveLanguage.unit.test.ts`, proving that a tag such as
   `de-CH` selects the `de` catalog while preserving `de-CH` for regional formatting.

Use the English catalogs as the source, translate values rather than keys, and do not leave English
placeholder prose merely to make validation pass. Official names may intentionally remain identical
when that is natural in the target language. Preserve interpolation/template tokens and embedded
markup as described below.

Catalog registration and all three complete catalogs should land together so each committed state is
valid. Do not publish a partially translated language as a supported option.

### 3. Add representative browser coverage

Extend `tests/e2e/i18n.smoke.spec.ts`; do not reproduce every catalog value in Playwright assertions.
At minimum prove:

- a representative regional browser locale selects the new base catalog;
- `<html lang>` uses the base language code;
- the language appears under its self-name in the switcher;
- explicit selection persists across reloads;
- representative `common`, `gallery`, and `admin` text renders in the language;
- one plural/interpolation example behaves correctly; and
- a narrow mobile viewport still fits the switcher and representative longer text.

For a new script, also render representative translated headings and user content through the default
branding choice and at least one branding font that needs the fallback. The fluent reviewer should
inspect the real rendering for missing glyphs, incorrect fallback, clipping, and awkward wrapping.

### 4. Review, document, and release it

The implementation may be committed as a draft, but it must remain unmerged and unreleased until a
fluent human has reviewed both the catalogs and the running interface. Give the reviewer the checklist
in the next section and commit their corrections before describing the language as supported.

After approval, update every customer-facing language list:

- `docs/languages.md`
- the feature summary in `docs/index.md`
- the language-support sentence in `readme.md`

Also update the relevant issue/release notes and any language examples in this guide that became
stale. Do not claim that the React Native app, server notifications, or customer-authored content were
translated: those remain separate scopes.

### Definition of done

- All namespaces are complete and all validation commands below pass.
- Detection, switching, persistence, formatting-locale preservation, and representative browser
  rendering are covered.
- No stable identifier, user content, diagnostic value, or machine-readable export value changes with
  the interface language.
- New-script font rendering has been visually verified where applicable.
- Machine assistance is disclosed and a named fluent reviewer has approved wording, grammar,
  plurals, terminology, and rendered layout.
- Customer documentation is updated only for the language that will actually ship.

For example, once a reviewer is arranged, a maintainer should be able to give a coding agent a task
as short as:

> Add web-interface support for `<language>` (`<code>`) by following
> `docs/development/translations.md` end to end. Treat the catalogs as a machine-assisted draft;
> `<reviewer>` will perform fluent QA. Complete the implementation, tests, script/font preflight, and
> draft documentation. Commit but do not push.

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

Preserve embedded component tags such as `<strong>` and `<code>` as well. A translation can reorder
the surrounding prose, but it must retain the same interpolation names, third-party template tokens,
and valid component tags required by the caller.

Languages can legitimately have more plural forms than English. Check the target categories with
`new Intl.PluralRules('<code>').resolvedOptions().pluralCategories`; the copied English catalog is
only a starting point and may not contain every suffix the target language needs. Do not compare raw
key sets with a bespoke parity script; `npm run i18n:check` is the plural-aware project gate.

The catalog contract compares each translated value with its English source and normally requires the
same interpolation names, third-party template tokens, and opening/closing component tags. It compares
sorted token multisets rather than prose order, so translations remain free to reorder a sentence.
Target-only plural categories use the English plural family's template as their contract. If natural
grammar genuinely omits, adds, or repeats a token, add one narrow, explained override in
`tests/api/i18nCatalogContracts.unit.test.ts`. Before allowing an added interpolation, template, or
tag, verify and cite in the comment that the call site or third-party library actually supplies it;
never use an override to bless an unavailable runtime value. Do not weaken the check for an entire
language or token type. Overrides are applied as additions and omissions to the English contract
rather than replacing it, so future source tokens remain enforced.

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

Give the fluent reviewer a running build as well as the JSON diff. Ask them to check:

- natural wording, grammar, plural forms, photography terminology, and admin terminology;
- login, passcode, public gallery, lightbox/video controls, and representative admin/settings pages;
- language switching, dates, numbers, relative-time prose, and interpolated counts;
- mobile-width wrapping, truncation, controls, and dialog layouts;
- unintended English text, excluding documented proper names and untranslated system/user data; and
- translated UI plus user-supplied content in any newly introduced script.

Record approval and any intentionally unchanged terms in the pull request. Functional testing by a
speaker is valuable, but it is not a substitute for explicit wording/catalog review.

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

`npm run i18n:check` must report the new locale as complete and must pass unused-key and dynamic
catalog contracts. For visible frontend changes, also run `npm run test:e2e:fresh` from the
repository root. The maintainer runs `npm run workflow` for full CI parity before merge.
