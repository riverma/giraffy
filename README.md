# Giraffy

A Nonviolent Communication companion. It opens on your needs, walks you through the four
parts of an NVC card (observation, feelings, needs, request), and lets you share the result
as a small human-readable file. Offline, on your own device, with no accounts and no servers.

*A pocket guide that helps you say hard things kindly, and hear them kindly too.*

Live: <https://giraffy.riverma.com>

## Try it

```
npm install
npm run dev              # open the printed URL
npm run dev -- --open    # …and open it for you
```

Add `?demo` to the URL to seed sample cards and needs on a fresh install.

## Habits

Things this project does the same way every time.

**Everything happens on the device.** No network calls, no analytics, no accounts. Cards
live in IndexedDB; sharing hands a file to the system share sheet or the clipboard. If a
change would introduce a fetch, it does not belong here. `npm run check-offline` fails the
build on any network reference in `dist/`.

**Reactive data stays ordinary.** Svelte does not proxy an object whose prototype is null, so
one of those anywhere in `app.data` silently stops the screen from following the data: the
value changes and nothing redraws. Never hand `Object.create(null)` to the store. Keep the
guard at the read instead (below); a unit test asserts the prototype of what the load path
returns.

**Keyed lookups answer for their own keys only.** Need ids, need words, feelings and card
states all come from files or from what someone types, and a plain object answers
`o['toString']` with a function. A function reaching IndexedDB fails the whole write, and the
failure is silent. Use `Object.hasOwn` for any object indexed by a value the app did not
choose. Not `Object.create(null)`: see above.

**Only free software ships.** Fonts are self-hosted (SIL OFL) and every dependency is on an
allow-list of free licences. `npm run check-licenses` enforces it.

**The mockup is the design authority.** `mockup/Giraffy.dc.html` and `spec/SPECIFICATION.md`
were signed off before the production build started. Screen copy is mirrored from them
verbatim and lives inline in each Svelte component, next to the markup it belongs to.
`src/lib/strings.ts` holds only what code produces at runtime: toasts, undo labels, confirm
bodies, history notes.

**Copy has no em dashes.** In app copy, use a comma, a colon, or a full stop instead.
(The specification document is prose and may use them.)

**The needs vocabulary is fixed.** `needs.ts` and `need-meanings.ts` hold the 103 needs and
what each means in the context of its area. Every word belongs to exactly one area. A need's
id is built from its area and word, and that id is what a person's marked needs, named
people, private notes, and card links are stored against, so changing the vocabulary is a
deliberate, released change: add a map to `need-migration.ts`, bump the Dexie version, and
the old data is carried across. A new need needs a meaning; a unit test will tell you if you
forget one, or if a word ever ends up in two areas.

**A person's own needs live in their data, never in the vocabulary.** What someone adds gets
a `custom/<area>/<word>` id in `data.customNeeds`, their own areas go in `data.customAreas`,
and a shipped need they hide is an id in `data.hiddenNeeds`. `data/vocab.ts` folds the three
together with the shipped list, and every screen reads that through `app.vocab` rather than
`ALL_NEEDS`, so nothing has to be regenerated when someone adds a word. The `custom/` prefix
is what keeps their ids out of the shipped namespace and out of the migration map.

**A draft is a card.** The composer writes into a real card with status `draft` from the
moment it opens (`core/drafts.ts`), which is why drafts are in the cards list, in backups,
and in the undo history without any machinery of their own. The composer's own state rides
on that card under `draft` and is dropped when the card is finished.

**Backups are a file, and only Chromium can write one unasked.** `core/filebackup.ts` wraps
the folder half of the File System Access API, which no phone browser and no Safari has. Every
call is guarded and the UI says which case it is in rather than hiding the feature. The folder
handle lives in IndexedDB outside `AppData`, so it is never in a snapshot, a backup, or the
undo history, and it is kept off `$state` because proxying a native handle breaks it.

**Every change is undoable.** Anything that edits data calls `app.record(label)` first,
which snapshots state for undo, redo, and the session history sheet. Autosaves are not
changes: they mutate without recording. Snapshots go in through `$state.snapshot` and must
come back out the same way, since reading one out of `$state` re-wraps it in a proxy and a
proxy cannot be cloned.

**Nothing is pushed without a review.** `scripts/audit.sh` runs a security pass, and
`scripts/deploy.sh` is a dry run unless you pass `--push`.

**Only the `public` branch is published.** The development history stays on this machine.
`public` is rebuilt as a single orphan commit for each release, leaving out the design-composer
runtime files that are not ours to redistribute (`mockup/support.js`, `mockup/ios-frame.jsx`,
`mockup/_ds/`) and `mockup/uploads/`. Push it by name and nothing else:
`git push origin public:main`. A `git push --all` would publish what that exclusion exists to
prevent.

## Layout

| Path | What it is |
|---|---|
| `src/lib/core/` | Pure logic: the gNVC format, merging, tiers, sorting, threads. No UI, fully unit-tested. |
| `src/lib/data/` | The vocabularies: needs, feelings, what each need means, and the sample data behind `?demo`. |
| `src/lib/store/` | `app.svelte.ts` (all state and actions), `router.svelte.ts` (hash routes), `db.ts` (Dexie). |
| `src/lib/screens/` | One component per screen, mirroring the mockup markup. |
| `src/lib/sheets/` | Every bottom sheet, in one file. |
| `src/lib/ui/` | Small shared pieces: sheet, tab bar, toast, icons, card row. |
| `src/styles/` | Ahimsa design tokens, self-hosted fonts, typography classes. |
| `src/sw.js` | The service worker template; `scripts/build-sw.mjs` injects the asset list. |
| `spec/` | `SPECIFICATION.md`, the gNVC JSON Schema, and card templates. CC0. |
| `mockup/` | The signed-off interactive mockup the app was built from. |

## Commands

| Command | What it does |
|---|---|
| `npm run dev` | Dev server with hot reload. |
| `npm run build` | Production build, then injects the service worker asset list. |
| `npm test` | Unit tests (Vitest) over `src/lib/core`. |
| `npm run test:e2e` | Playwright: the happy path, persistence, and a cold offline boot. |
| `npm run check` | Type and template checking (svelte-check). |
| `npm run check-licenses` | Fails on any dependency outside the free-licence allow-list. |
| `npm run check-offline` | Fails on any network reference in the built site. |
| `npm run schema:compile` | Recompiles the standalone Ajv validator from the JSON Schema. |
| `npm run audit` | Security pass over the repo. Run before pushing. |
| `npm run deploy` | Dry run of the deploy. Add `-- --push` to publish. |

## The gNVC card format

A card is one `.gnvc.yaml` file: readable top to bottom, hand-writable, and validatable
against a published JSON Schema. The format, the schema, and the templates are CC0, so
anything can read or write cards without asking anyone. See [`spec/README.md`](spec/README.md).

## Privacy

Giraffy collects nothing, sends nothing, and has no server to send it to.
See [PRIVACY.md](PRIVACY.md).

## Licence

The app is [AGPL-3.0-or-later](LICENSE). The gNVC format, its schema, and the templates in
`spec/` are [CC0-1.0](spec/LICENSE), so the format belongs to everyone.

Giraffy is an independent project inspired by the work of Marshall B. Rosenberg. It is not
affiliated with or endorsed by the Center for Nonviolent Communication.
