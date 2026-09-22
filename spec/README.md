# The gNVC card format

A gNVC card is one moment put into words: what happened, what the writer felt, the need
underneath, and what they would like to ask. It is a single YAML file that a person can
read top to bottom without any software at all.

The format, the schema, and the templates here are released under
[CC0-1.0](LICENSE). They belong to everyone. Write a card by hand, or teach any program to
read and write them, without asking anyone's permission.

Canonical URL: `https://w3id.org/gnvc/1.0`, published at <https://riverma.com/gnvc/>.

**The format lives in its own repository, [riverma/gnvc](https://github.com/riverma/gnvc).**
Giraffy is one client of it, not its owner. The schema and templates here are a vendored copy,
kept because the app compiles the schema into an offline validator and cannot fetch it at run
time. If the two ever disagree, the gnvc repository is right.

## What is here

| File | What it is |
|---|---|
| `SPECIFICATION.md` | The full product and format specification (v0.6). §6 defines the card format. |
| `gnvc-card.schema.json` | JSON Schema (draft 2020-12) for one card. |
| `templates/request.gnvc.yaml` | A blank request card, commented, ready to fill in. |
| `templates/gratitude.gnvc.yaml` | A blank gratitude card. |

## A card at a glance

```yaml
from: Noor
to: Maya
about: "The gallery opening"

summary: >
  When I realised the show opens Friday and three pieces still aren't
  framed, I felt anxious and a little overwhelmed, because I need support
  and some ease before the opening. Would you be willing to spend an hour
  on Thursday framing them with me?

observation: >
  When I realised the show opens Friday and three pieces still aren't framed.

feelings: [anxious, overwhelmed]
needs: [support, ease]
requests:
  - Would you be willing to spend an hour on Thursday framing them with me?

status: shared
status_history:
  - { state: shared, by: Noor, at: 2026-07-11T09:14:00Z }

entangled_with: []

# ---- giraffy app-only details ----
kind: request
id: 7c2f8a10-5b3d-4e91-8a02-1f6c9d4e7b20
created: 2026-07-11T09:10:00Z
updated: 2026-07-11T09:14:00Z
gnvc: "1.0"  # spec: https://w3id.org/gnvc/1.0
```

Everything above the `giraffy app-only details` line is the format. Everything below it is
bookkeeping an app needs; another implementation may keep its own, as long as `gnvc` and
`id` are present.

## Rules worth knowing

- **`gnvc` is required.** Its absence is how a reader tells a card from any other YAML.
- **`id` is stable for the life of a card.** When a card comes back with a reply, the two
  copies are merged by id: history entries are unioned, and nothing already written is
  overwritten.
- **`status_history` is append-only.** It is the card's memory, in order.
- **States**: `draft`, `ready`, `shared`, `received`, `heard`, `yes`, `no`, `maybe`,
  `given`, `celebrated`, `withdrawn`.
- **`entangled_with`** holds the ids of cards whose needs depend on this one's. A pointer to
  a card you do not hold yet is fine; its lineage applies when it arrives.
- **Nothing private travels.** Notes on a need never appear in a card. A backup file is a
  separate thing, and is never shared as a card.

## Validating a card

```
npx ajv-cli@5 validate --spec=draft2020 -s spec/gnvc-card.schema.json -d your-card.yaml
```

Giraffy itself uses a standalone validator compiled from the same schema
(`npm run schema:compile`), so validation works offline with no runtime code generation.
