# Giraffy — Product Specification (v0.10)

**A Nonviolent Communication companion app**
*Progressive Web App · Offline-first · No accounts, no servers*
*Home: https://giraffy.riverma.com*

> **v0.10 note — a first guess, in their words.** A card no longer has to wait for the other
> person to write it (2026-09-21). **Imagine their card** starts a draft written *as* someone
> else and addressed to you: a first guess at what they might observe, feel, need and ask,
> for them to correct. It stays a draft, clearly marked as a guess and never as something they
> said, until you send it. They receive it as their own draft, in their own Giraffy, fix every
> word, and send it back; the reply merges into the same card, their words become its body, and
> your guess stays visible in the history beside it (§5.7, §5.10). Startable from the **⊕**
> sheet, a person's own screen, or a need's screen. Nothing new in the file format: a guess is
> an ordinary card with `status: draft`, which the schema has always allowed (§6.4).

> **v0.9 note — second thoughts, and a list that moves.** Two things a person changes their mind about after the fact (2026-09-14). Who a card is **for** can be changed from the card itself rather than by writing it again, with the history kept honest (§5.8). A person can be **renamed from the People list** under Edit, not only from their own screen (§5.9). Also: every control opts out of the double-tap zoom gesture. Cycling how a need feels is two quick taps on one small dot, which iOS reads as a request to zoom, and a zoomed page cannot scroll an app pinned with `position: fixed` — which presents as scrolling being broken on the Needs tab. The scroll region in every screen is also explicitly allowed to be shorter than its contents (`min-height: 0`), the guarantee WebKit wants before it will scroll a flex child. Sharing a card also stops putting prose above it, so what one Giraffy sends another can read (§5.10). And the bottom bar measures itself rather than being guessed at: every list reserves the room the bar actually takes plus a margin, so the last row of a short list can never sit underneath it with no scrolling left to lift it clear.

> **v0.8 note — editing what the app holds.** This revision adds the three things the app could hold but not let anyone change: **drafts**, **people**, and **needs of your own** (2026-09-12). A card being written is now a card with status `draft`, kept in the cards list rather than off to one side, so it is in the Cards tab under **Drafts**, in the **⊕ sheet**, in a **backup**, and in the **undo history** like anything else (§5.7). **People** can be added by name before there is a card, renamed, and removed, which keeps every card written with them (§5.9). The shipped needs vocabulary stays fixed, and beside it a person can **add needs of their own**, filed under any area, **add areas of their own**, and **hide** shipped needs they do not use, with everything they marked on a hidden need kept and one tap in Settings to show it again (§5.4). Each of the three lists gains an **Edit** control in its header rather than always-on delete affordances, and each add and remove is one step in the undo history (§5.14). **Backups can now keep themselves**: setup ends by asking where a copy should live, and on a browser that allows it (Chromium on a desktop) Giraffy rewrites one file in that folder after the changes settle and when the app closes, with the folder reconfigurable in Settings (§5.15). Where the browser has no folder API, which is every phone, the app says so plainly and keeps the one-tap backup. Also fixed: undo threw in the browser, because a snapshot read back out of the session history came wrapped in a reactive proxy.

> **v0.7 note — the needs vocabulary, settled.** The needs list was reviewed by hand and fixed (2026-09-11, alphabetized 2026-09-12). Every word now belongs to exactly one category: duplicates were renamed to say what they meant in place, or folded into one need. 110 leaves became 103. Every need gained a one-line meaning shown wherever it can be marked. The vocabulary is a released structure from here, and changes to it ship with a data migration (§5.4, §5.16.2). Also in this revision: onboarding can be walked backwards and replayed from Settings, it names the **check-in** and says a full pass takes about twenty minutes, the Check in control carries a check mark rather than a tier dot, the layout widens on larger screens, and app copy says **device** rather than **phone**.

> **v0.6 note — the signed-off mockup, and the build begins.** Nine hand-test rounds (r2–r10, 2026-09-06 → 2026-09-07) revised the mockup, and the user signed it off on 2026-09-07; this revision brings the specification into line with it, and it is the authority for the production build (§8). What changed, in brief: **onboarding** is four pages (welcome with the giraffe mark and a privacy line → *A few concepts*, four illustrated steps → your name → *Every feeling points to a need*); the setup **check-in** has a legend, a page counter, *Skip to end*, a *Summary* page and a leave-setup confirm; the tier wording is **unexamined** (never "untouched" / "not yet looked at"); Settings gains a **derived-tier method** (Most unmet · Most common · Average) with a recalculate confirm, and the category override simply sticks; the reflective line and the Insights sections are **gone** (replaced by counts inside the Cards **Filters sheet** and by the inline **entangled glyph** on need rows); Cards gets a **Sort sheet**, a pinned *More filters* pill, and a **+ sheet** (write / import); the composer writes **one card per person** when several are chosen and its gratitude examples are positive; received cards can be **shared and deleted** (with a *Share without a response?* check); the session-history sheet **confirms before reverting**; **backup is the whole app state** and restore replaces it exactly; Settings gains **Erase all data** (asked twice, backup offered on the way); the About page credits the author with **© 2026** and names the **AGPL-3.0** licence; the whole app sits on a **light dawn canvas** with quiet text darkened to read on it; and app copy uses **no em dashes**. The gNVC file format is **unchanged**.

> **v0.5 note — the needs tree becomes the home screen.** This revision adds the **Needs** home (§5.16): a scannable inventory of every NVC need, each carrying a self-reported *met · partly · unmet* tier, each naming **who might help meet it** (Myself first, then people), and each opening straight into the composer. The app now **opens on Needs**; Cards, People and Settings follow. The former **Insights** tab folds into the Needs home (§5.13). The needs vocabulary (§5.4) grows to the fuller CNVC-style inventory and keeps **Honesty** as a category. Tier colours use the Ahimsa accents — clay / turmeric / bodhi — never red / yellow / green. The gNVC file format is **unchanged**. *The mockup now includes §5.16 (Needs home, Need detail, Check-in, re-ordered tab bar).*

> **v0.4 note — reconciled to the working mockup.** This revision brings the specification into line with the interactive mockup (`mockup/Giraffy.dc.html`), which is now the authority on interaction, copy, and the exact shape of the gNVC format. Where the mockup made or changed a decision, this document was updated to match; nothing here asks the mockup to change. The most significant reconciliations: the fifth tab is **Insights** (a calm dashboard), not a bare Threads list (§5.13); the needs-web visualization ships **radial**, with two-column deferred (§5.12); an **undo / redo / session-history** system was added throughout (§5.14); the response flow uses **bottom sheets** and a specific button order (§5.8); and **`entangled_with` is a plain list of id pointers** — the per-link `states:` lineage from the old §6.3 is gone, with response state living only in each card's own history (§6.3).

> **Name & brand:** **Giraffy** — after the giraffe, Marshall Rosenberg's symbol for NVC (the land animal with the largest heart, and a long neck for perspective). App icon: a friendly giraffe.
>
> **Design system: Ahimsa.** The mockup is built on the **Ahimsa Design System** — a warm, editorial system "rooted in non-harm": cream instead of white, a serif (Fraunces) for the heart and a sans for utility, italic pull-quotes instead of red banners, and an explicit refusal of dark patterns (no manufactured urgency, no shame nudges, no red badge dots — "if a design pattern requires the user to lose for the product to win, this system will not produce it"). Its accent palette is a muted, warm-adjusted set — *saffron, turmeric, clay, bodhi, peacock, indigo, monsoon* — over cream surfaces. This is a strong fit for Giraffy and supersedes the earlier loose "giraffe tones" palette direction; the designer iterates within Ahimsa rather than from scratch.

---

## 1. Summary

Giraffy is a free, installable web app that guides a person step-by-step through Marshall Rosenberg's Nonviolent Communication (NVC) framework — **Observation → Feelings → Needs → Request** — to produce a carefully considered, judgment-free request (or expression of gratitude). Finished requests become **cards** that live in the app, tagged to the people they concern. Cards can be **shared as a small, human-readable YAML file** through any channel the user already has (Signal, WhatsApp, SMS, email, AirDrop). The recipient — with or without the app — can read it, respond from the heart, link their own needs to it, and send it back. Over several exchanges, the two people build a shared, visible picture of the **interwoven needs** at play, until everyone's needs can be met.

Giraffy is a **supplement to in-person conversation, not a replacement for it.** Its job is to help people arrive at conversations (or asynchronous exchanges) with their needs already untangled and their requests actionable.

The app **opens on your needs** (§5.16): a quiet, scannable tree of every universal need, where you mark how met each one feels right now and name who might help — yourself first. Cards grow out of that tree; every unmet need is one tap from the composer.

There is no backend, no account, and no network dependency. All data lives in an embedded local database on the device, with first-class export/import/backup.

### The one-sentence pitch

*A pocket guide that helps you say hard things kindly — and hear them kindly too.*

---

## 2. Background: the NVC framework (context for designer & developer)

Nonviolent Communication was developed by Marshall Rosenberg (book: *Nonviolent Communication: A Language of Life*), drawing on the nonviolence traditions of Gandhi and Martin Luther King Jr. and contemplative traditions. Its core practice is a four-part expression:

| Step | What it is | What it must avoid |
|---|---|---|
| **1. Observation** | A plain, factual statement of what happened, free of interpretation. | Judgments, evaluations, diagnoses, generalizations ("always", "never", "lazy", "rude"). |
| **2. Feelings** | What *I* feel — emotions arising in me. | Anything about the other person. "Faux feelings" that are actually judgments in disguise ("I feel ignored" = a judgment that someone ignored me). The word **"you"** never appears here. |
| **3. Needs** | The universal human need or value of mine that is (or isn't) being met, and which gives rise to the feeling. | Strategies disguised as needs; any mention of the other person. **"You" never appears here either.** |
| **4. Request** | A concrete, doable, present-tense ask — always **optional** for the other person. Typically phrased "Would you be willing to…?" | Demands. The litmus test: if a "yes" would earn warmth or reward and a "no" would be met with criticism or ill feeling, it is a demand, not a request. |

### Receiving a request, the NVC way

Rosenberg's teaching on the *listener's* side of a request is just as specific as the speaker's side, and Giraffy's response flow (§5.8) is built directly on it. The distinct moves he describes:

1. **Empathize first ("giraffe ears").** Before answering at all, reflect back the speaker's feelings and needs — *"It sounds like you're feeling … because you need …"* — so understanding precedes any decision.
2. **Say yes only from the heart.** Rosenberg asks listeners to comply *only* out of willing joy — "with the joy of a child feeding ducks" — and explicitly asks people **not** to say yes out of fear of punishment, hope of reward, guilt, shame, duty, or obligation. His shorthand: *"Never do anything that isn't play."*
3. **Say no by revealing the need behind it.** In NVC there is no bare rejection: *"all nos are tragic expressions of a need."* Rather than "no," the listener says **the need that keeps them from saying yes** (his example: a partner asked for evening company answers with their conflicting need for solitude). An honest, clearly expressed no — with its need visible — is a complete, valid, respected response.
4. **Propose another strategy.** When both people's needs are on the table, the listener can suggest a different way to meet everyone's needs ("Could we find a way to get your work done *and* meet my need for connection?").
5. **Take time.** Presence and unhurried consideration are part of empathic receiving; a slow honest answer honors the request more than a fast coerced one.

Other ideas from NVC that shape this product:

- **Gratitude uses the same anatomy.** NVC expresses appreciation as observation + feeling + need that was met (no request required). The app supports gratitude cards as a first-class type.
- **A "no" is a "yes" to something else.** Whenever someone can't say yes, it is because saying yes would cost them a need of their own. NVC asks us to *hear the need behind the no* — and treats that moment as an invitation to surface the conflicting need and keep working until a strategy meets everyone's needs. This is the heart of Giraffy's **entangled-needs** feature (§5.11).

---

## 3. Product principles

1. **Coach, don't police.** Validation nudges are gentle, dismissible suggestions — never blocking errors. The user is always the authority on their own words.
2. **Mobile-first, offline-always.** Every feature works with zero connectivity. No CDN dependencies; all assets self-hosted and cached.
3. **The file is the protocol.** Interoperability happens through a small, versioned, hand-writable YAML format — not an API. A person with a text editor is a full citizen of the ecosystem. **One card, one file** — no bundles, no duplication, no second file format (§6).
4. **Private by default.** Nothing leaves the device unless the user explicitly shares a file. No analytics, no accounts, no server.
5. **Warm, calm, unhurried.** The composer should feel like a guided reflection, not a form. Generous whitespace, one question at a time, no timers, no gamification.
6. **Honor the "from the heart" ethic.** Response language avoids transactional words (accept/reject) in favor of honest, warm phrasings that follow Rosenberg's teaching (§5.8).
7. **A supplement to conversation.** Requests in Giraffy are always concrete and actionable. The deeper relational work — empathy, dialogue, repair — happens between people; Giraffy prepares the ground for it.
8. **No hidden rank.** Wherever the app presents vocabularies (feelings, needs), lists are alphabetized so ordering never implies importance or preference.
9. **Start from needs.** NVC locates every feeling and every request in a universal need. Giraffy therefore opens on the needs tree (§5.16), not on a list of cards: you meet your needs by name first, and requests to others (or to yourself) grow from there. My needs are mine to meet — others are invited, never obligated — so **Myself** is always offered first as the one who might help.

---

## 4. Personas & core journeys

### Personas

- **Maya (composer).** Practices NVC imperfectly. Something her partner did is bothering her; she wants help untangling judgment from observation before she says something she regrets.
- **Sam (recipient, has the app).** Receives Maya's request file over Signal. Wants to respond honestly — part of him wants to say yes, part of him has a conflicting need he can't name yet.
- **Ravi (recipient, no app).** Gets the same file as plain text. He can read every field aloud and reply in his own words — the YAML is designed to be legible to him top-to-bottom.
- **June (self-empathy user).** Uses the composer alone, addressed to herself, to process a hard day. Never shares anything.

### Journey 0 — Check in with my needs

1. Maya opens Giraffy and lands on **Needs** (§5.16). She taps **Check in** and takes a quiet pass, one category at a time, tapping each need as it feels today — *met*, *partly*, *unmet* — skipping any she likes.
2. *Closeness* and *shared care* come up unmet. Under *closeness* she names who might help: **Myself**, and **Sam**.
3. From Sam's row she taps **Write a card**. The composer opens with Sam and the need already in place, on the Observation step — Journey A picks up from here.

### Journey A — Compose & share a request

1. Maya taps **New card** → chooses *Request* (vs. *Gratitude*).
2. Guided composer walks her through the four steps (§5.1), with coaching nudges (§5.2).
3. Synthesis screen assembles her entries into a single spoken-word paragraph; she edits or steps back as needed, then confirms.
4. Card is saved, tagged to **Sam**. From the card she taps **Share** → the app produces `maya-request-2026-07-10-7f3b9e.gnvc.yaml` and opens the OS share sheet.
5. Card state becomes **Shared**.

### Journey B — Receive & respond

1. Sam opens the file with Giraffy (file-handler / paste / import button). It appears in **Received**.
2. He can immediately send back **Heard** ("Sitting with it") — optionally with a reflection of what he heard (§5.8).
3. When he's ready, he answers through one of the heart-honest buttons: **I'd love to**, **I cannot**, or **Let's explore** (§5.8).
4. If a need of his is tangled up in Maya's request, he either **composes a new card** of his own (the composer opens pre-linked) or **links a card he already has** — perhaps he processed this very need last week.
5. He shares back a single file; Maya imports it. Her original card updates its state, his card (if any) appears in her Received list, and the **thread view** stitches the links into a visible chain of entangled needs (§5.11).

### Journey C — Self-empathy

June composes a card addressed to **Myself**. No sharing UI is emphasized; the card lives in her list as a processed reflection.

---

## 5. Feature specification

### 5.1 The guided composer

A full-screen, step-at-a-time wizard. Progress is shown as four soft dots/steps (plus Synthesis). The user can move back and forth freely; drafts auto-save continuously (a killed app never loses work).

**Step 0 — Setup (lightweight, one screen)**
- Card type: **Request** | **Gratitude**.
- Who is it about? Person chips are **multi-select** (existing people, *Myself*, or a typed new name, which is added to People). Choosing several writes **one card per person, the same words each** — the step shows *"N cards will be written, one each for A, B and C"* and the save button reads *"Write these N cards"*; the first card opens and a toast states the count. Who a card is for can be set from **step 5 as well as step 0** (v0.11), under *This card is for*, because a compose seeded with a person skips step 0 entirely and would otherwise never show a picker. **Editing an existing card offers no person picker on either step**: it is always single-card, and changing a recipient belongs to *Change who it is for* (§5.8), which refuses a card the other person has already answered and returns a shared card to `ready`. An entangled-need link made from the composer joins only the first card.
- Optional context line (e.g., "About last night's dinner") used as the card's display subtitle.

**Step 1 — Observation**
- Prompt (request): *"What happened? Share just what you saw or heard — the way a caring friend who watched the moment, but wasn't part of it, might retell it. No meaning added, no judgment."* Prompt (gratitude): *"What did they do? Share just what you saw or heard, the moment you want to thank them for."*
- Free-text box (multi-line).
- Inline guidance (collapsible "Show me examples") is **kind-aware**. For a request:
  - ✅ *"When I saw the dishes from last night on the counter this morning…"*
  - ❌ *"When you left the kitchen a mess like you always do…"* — "always" is a generalization; "a mess" is an evaluation.
  - ✅ *"When you said 'I don't have time for this' and left the room…"* (direct quotes are observations)
  - ❌ *"When you dismissed me…"* — "dismissed" is a diagnosis of intent.

  For a gratitude card the examples are **positive**, and the contrast is observation vs. praise (rows are labelled *carries evaluation*, not *judgment*):
  - ✅ *"When you drove out to the airport at midnight and waited by the curb with the heater on…"*
  - ❌ *"When you were so thoughtful and amazing…"* — "thoughtful" and "amazing" are verdicts; say what they did.
  - ✅ *"When you said 'take the day, I've got the kids' on Saturday morning…"*
  - ❌ *"When you were there for me like you always are…"* — "always" generalizes; name the one moment.
- Live coaching nudges appear below the box as chips (§5.2).
- Multiple observations allowed (add another) but the default UI encourages one focused observation per card.

**Step 2 — Feelings**
- Prompt: *"When that happened, what did you feel — in you?"*
- **Two-level feelings picker** (§5.3): top-level "feeling families" as large tappable tiles; tapping a family expands its more precise words. Multi-select; selected feelings collect as chips at the top.
- A search box filters the whole vocabulary.
- Free-text "my own word" entry is allowed; it passes through the coaching layer (e.g., typing "betrayed" surfaces: *"'Betrayed' describes what you think someone did. Underneath it, are you feeling hurt? scared? angry?"*).
- For **Gratitude** cards, the picker shows the *needs-met* half of the vocabulary by default.

**Step 3 — Needs**
- Prompt: *"Which of your needs {are not being met / were met}? Try completing: 'I need…' or 'I value…'"*
- A **needs vocabulary** browser (§5.4), organized by category, multi-select, plus free-text with the sentence stems *"I need…"* / *"I value…"* pre-offered.
- **Feeling ↔ need mapping:** each selected feeling is shown as a row; the user can attach one or more needs to each feeling (and one need may serve several feelings — the data model is many-to-many, §6). The UI keeps this optional and lightweight: a default "these feelings ↔ these needs" bundle is fine; explicit per-feeling linking is available via a "connect" affordance for users who want precision.
- Coaching layer flags "you"/other-person language and strategy-shaped needs (§5.2).
- The browser reads from the **needs inventory** (§5.16): each need shows its current tier dot, and a need chosen from the inventory is linked to it (§5.16.3). When the composer was launched from the Needs home, the launching need arrives pre-selected. After selecting a need that has no tier yet, one soft, dismissible chip offers *"How met is this, in general?"* with the three-way switcher — optional, one tap.

**Step 4 — Request** *(skipped for Gratitude cards)*
- Prompt: *"What would you like to ask? Remember: a request is a gift of clarity, not an obligation. The other person is free to say no."*
- Free-text box with offered sentence starters (tappable, insert into the box):
  - *"Would you be willing to…"*
  - *"Would you consider…"*
  - *"How would you feel about…"*
  - For cards addressed to **Myself**, the starters become self-addressed — *"I'd like to try…"*, *"Would I be willing to…"* — so a self-request is never forced into "Would you…" phrasing.
- **Requests are actionable.** Giraffy requests always name a concrete, doable action. (NVC also teaches "connection requests" — *"would you tell me what you heard me say?"* — but those belong to live conversation, which Giraffy supplements rather than replaces. The in-app NVC primer mentions them as a practice for face-to-face moments; the response flow's **Heard** button, §5.8, is Giraffy's asynchronous cousin of them.)
- Guidance emphasizes concrete + doable + positive ("what you *do* want").
- Multiple requests allowed; each request can be linked to the needs it would serve (again many-to-many, defaulting to "all").
- Coaching layer flags demand language (§5.2).
- A gentle standing reminder, always visible on this step: *"If a yes would be rewarded with warmth you'd otherwise withhold, or a no would be met with criticism or ill feeling — it isn't a request yet. It's a demand."*

**Step 5 — Synthesis**
- The app assembles the entries into one flowing paragraph in the classic NVC skeleton:

  > *"When I saw the dishes from last night still on the counter this morning, I felt frustrated and a little discouraged, because I need shared care for our home and reliability around agreements. Would you be willing to wash your dishes before bed tonight?"*

- Assembly rules: `When {observation}, I feel/felt {feelings, joined naturally}, because I need/value {needs}. {Request(s)}.` For gratitude: `When {observation}, I felt {feelings}, because it met my need for {needs}. Thank you.`
- The paragraph is **fully editable** in place; any manual edit is immediately reflected on the card and re-run through the coaching layer (validation). Edits are stored as `summary` alongside (not instead of) the structured fields; likewise, edits to any structured field regenerate the summary unless the user has customized it, in which case the app shows both and asks which to keep.
- "Something's off?" links jump back to any step.
- Confirm button: **"This is what I want to say"** → card is saved as **Ready**.

### 5.2 The coaching (validation) layer

A client-side, keyword/pattern-based linter that runs as the user types (debounced). It never blocks; it renders as small warm-toned chips under the text with a one-line explanation and, where possible, a suggestion. Each nudge is dismissible; dismissal is remembered per card.

**Default: Standard.** Coaching can be toggled off entirely in Settings, and for a single card from the composer header, for practiced users or raw moments. The per-card control **says what it does** — *coaching on* / *coaching off*, not an opaque word like "quiet" — and confirms the change in a toast, because a control whose effect is invisible until you notice something missing is no control at all. It is hidden when coaching is already off in Settings, since there would be nothing to silence.

Rule groups (v1 is deliberately simple — word lists + a few regexes; no ML required):

**Observation step**
- *Generalizations:* `again, all the time, always, constantly, every time, never` → "Generalizations invite argument. Can you name one specific time?"
- *Evaluative adjectives/adverbs:* `careless, cold, crazy, distant, disrespectful, dramatic, inconsiderate, irresponsible, lazy, manipulative, mess, messy, needy, ridiculous, rude, selfish, thoughtless, toxic, unfair` → "This is an evaluation. What did you actually see or hear?"
- *Diagnosis of intent:* `avoided me, deliberately, didn't care, dismissed, doesn't care, ignored, on purpose, refused to` → "This describes what you believe their intent was. What did you actually see or hear?"
- *Second person density:* many `you`-sentences → soft note that observations land better centered on events, quotes, and times.

**Feelings step**
- *"You" anywhere* → "This step is only about what's alive in you — the other person doesn't appear here."
- *Faux feelings list* (evaluations masquerading as feelings): `abandoned, attacked, belittled, betrayed, blamed, cheated, criticized, dismissed, disrespected, ignored, insulted, judged, let down, manipulated, misunderstood, neglected, pressured, provoked, rejected, taken for granted, unappreciated, unheard, unseen, used, victimized` → each maps to 2–3 suggested true feelings (e.g., *ignored → hurt, lonely, sad*; *pressured → anxious, overwhelmed, resentful*). Tapping a suggestion selects it.
- *"I feel that / like / as if"* → "'I feel that…' usually introduces a thought, not a feeling. What's the emotion underneath?"

**Needs step**
- *"You" / person names / "he/she/they" referring to the other* → "Needs are universal and belong to you alone — no other person appears in them."
- *Strategy detection (heuristic):* needs phrased as specific actions by specific people (`I need you to…`, `I need him to…`) → "That's a strategy — one way to meet a need. What's the deeper need it would serve?"

**Request step**
- *Demand markers:* `demand, expect you to, have to, if you don't, insist, must, need you to, or else, require, should, you'd better` → "This may land as a demand. Try 'Would you be willing to…?'"
- *Vagueness:* `be better, be more respectful, change your attitude, stop being, try harder` → "Requests work best when they're concrete and doable. What specific action would help?"
- *Negative requests:* leading `don't, quit, stop` → "Asking for what you *do* want is easier to say yes to than what you don't."

All word lists live in a single data file (`coaching-rules.yaml` or JSON) so they can be tuned and localized without code changes.

### 5.3 Feelings vocabulary

Two halves, mirroring standard NVC inventories: **when needs are met** and **when needs are unmet**. Each half has ~8 top-level families; each family holds 5–10 precise words. Ship as a data file. **All families and all words within a family are listed alphabetically — in this spec, in the data file, and in the UI — so ordering never implies rank, frequency, or preference.** Starting taxonomy (to be refined; based on the widely used CNVC-style inventory):

**When needs are NOT met** *(families A→Z)*
- **Angry** — annoyed, bitter, exasperated, furious, indignant, irate, irritated, resentful
- **Confused** — ambivalent, baffled, hesitant, lost, perplexed, puzzled, torn
- **Embarrassed** — ashamed, flustered, guilty, mortified, regretful, self-conscious
- **Longing** — envious, homesick, nostalgic, pining, yearning
- **Sad** — disappointed, discouraged, gloomy, grieving, heavy-hearted, hopeless, hurt, lonely, wistful
- **Scared** — afraid, anxious, dread, insecure, mistrustful, panicked, terrified, wary, worried
- **Tense** — burnt out, edgy, frazzled, irritable, jittery, overwhelmed, restless, stressed
- **Tired** — depleted, drained, exhausted, listless, numb, weary

**When needs ARE met** *(families A→Z)*
- **Glad** — delighted, ecstatic, elated, happy, joyful, pleased, tickled
- **Grateful** — appreciative, moved, thankful, touched
- **Hopeful** — confident, encouraged, expectant, optimistic
- **Interested** — absorbed, curious, eager, enchanted, engaged, fascinated, inspired
- **Loving** — affectionate, compassionate, friendly, open-hearted, tender, warm
- **Peaceful** — at ease, calm, centered, content, fulfilled, relaxed, satisfied, serene
- **Playful** — adventurous, alive, energetic, giddy, invigorated, refreshed
- **Proud** — accomplished, confident, empowered

UI: family tiles first (with a subtle color per family), expanding to word chips. Long-press (or an ⓘ) shows a one-line definition. Selected feelings persist as chips at the top of the step.

### 5.4 Needs vocabulary

One multi-select organized under the classic NVC need categories, and — since v0.5 — the backbone of the **needs tree** (§5.16). It follows the fuller CNVC-style inventory, reviewed and settled by hand in v0.7.

**Every word belongs to exactly one category.** Earlier revisions let a word appear under several headings as a distinct leaf; hand review found that the repeats cost more in confusion than they bought in nuance, so each was either renamed to say what it actually meant there (*Connection · integrity* became *alignment*, *Connection · presence* became *attentiveness*, *Meaning · consciousness* became *intentional*) or folded into the single place it belongs (the three *self-expression* leaves became one under Meaning; *presence* became *Peace · present*). A need's identity is still **(category, word)**, and that identity is a released structure: data is entered against it, so it changes only in a deliberate release with a migration (§5.16.2).

**Every need carries a one-line meaning**, written for the category it sits under. It shows under the word on Need detail, as a second line on the needs list, and on its own line when a need is tapped during a check-in, so a pass through the vocabulary teaches it as it goes. Keep it short (under 90 characters), lower case, no full stop, and no em dashes. **Categories and the words within them are alphabetized**, so nothing in the order implies a preference between one need and another.

- **Autonomy** — choice, dignity, freedom, independence, self-direction, space, spontaneity
- **Connection** — acceptance, affection, alignment, appreciation, attentiveness, belonging, care, closeness, communication, communion, community, companionship, compassion, consideration, cooperation, empathy, friendship, inclusion, inspiration, intimacy, love, mutuality, nurturing, partnership, resonance, respect, security, shared reality, stability, support, to be heard, to know and be known, to see and be seen, trust, understanding, vulnerability, warmth
- **Honesty** — authenticity, awareness, integrity, self-acceptance, self-connection, transparency
- **Meaning** — celebration, challenge, clarity, competence, contribution, creativity, discovery, effectiveness, efficiency, growth, insight, integration, intentional, learning, mattering, mourning, participation, perspective, progress, purpose, self-expression, wholeness
- **Peace** — balance, beauty, contentment, ease, equanimity, faith, harmony, hope, order, peace of mind, predictability, present, transcendence
- **Physical well-being** — air, comfort, food, movement / exercise, rest / sleep, safety (physical), self-care, sexual expression, shelter, touch, water
- **Play** — adventure, excitement, fun, humor, joy, relaxation, stimulation

Custom needs are allowed via free text (with the coaching layer watching for strategies and "you"); a custom need can be filed under a category so it appears in the tree.

**Needs and areas of your own (v0.8).** The list above is a released structure and is never rewritten (§5.16.2), so what a person adds or hides lives in their own data beside it and the two are folded into one list everywhere the app shows needs.

- **Add a need.** From the Needs tab in **Edit** mode (*"+ a need under {area}"*), from the ⊕ sheet (*Add a need*), or from the composer, where a word typed in *"in your own words"* that is not in the list offers *"**{word}** is not in your needs yet. Add it under an area"* and links the card to it once added. The sheet asks for the word, the area (chips, the seven plus any of your own), and optionally one line of what it means to you, shown wherever the need can be marked.
- **A word is unique within its area, not across the list.** "space" may sit under Autonomy and under an area of your own; the same word twice under one area is refused in place (*"Already under Play."*), as is a word that would slug to one already there (*"Already under Physical well-being, as \"self-care\"."*).
- **Ids.** A need of your own has the id `custom/<area>/<word>`. The prefix keeps it out of the shipped namespace and out of the vocabulary migration, so a need called "presence" under Connection is never mistaken for the shipped `connection/presence` that became `connection/attentiveness`.
- **Add an area.** Areas of your own sit after the seven, alphabetically among themselves, and take a colour from the needs inside them like the others. A name that matches, or nearly matches, an area already there is refused in place. An area with nothing in it still lists, so there is somewhere to add the first need.
- **Hiding, not deleting.** A shipped need is **hidden**, never removed: it leaves the list, the check-in, the area colours and the composer, while how it felt, its note and anyone named on it are kept. Settings lists every hidden need with **show again**; need detail says so too. A need of your own is **removed** for real, with its tier and note; cards that used the word keep the word, and their link to the need becomes nothing.
- Counts follow what is shown: *"46 of 103 looked at"* counts visible needs, and the check-in has one page per visible area.

### 5.5 Linking model (feelings ↔ needs ↔ requests)

- Within a card: **feelings ↔ needs** is many-to-many; **needs ↔ requests** is many-to-many. Defaults are "everything connects to everything" so casual users never have to think about it; a "connect" mode lets precise users draw the exact mapping.
- The synthesis paragraph and the card detail view use the mapping to render honest sentences ("…frustrated because I need reliability; discouraged because I need shared care…" when mapped; the simpler bundled sentence when not).

### 5.6 Cards

A **card** is the atomic object: one processed NVC expression. Fields (full schema in §6): type (request/gratitude), people, observation, feelings, needs, requests, mappings, summary paragraph, status + status history, entanglement links to other cards, timestamps, free-form private notes (never exported unless the user opts in — default **not exported**).

Card detail view shows the synthesis paragraph as the hero, with the four structured parts below it in labeled, softly separated sections, followed by status, people, entangled cards, and actions. Every card has an action row: my own cards offer **Share · Edit · Withdraw · Delete**; a **received** card offers **Share · Delete**. Sharing a received card that has no response yet first asks *"Share without a response?"* — **Share anyway** / **Respond first**.

### 5.7 Cards & lists

The **Cards** tab (second in the bar, after Needs — §7) carries a `Mine | Received` segmented control (the Received pill shows a gentle dot when unactioned imports are waiting) with **Import** at the right; a **Search** field with a **Sort** pill beside it; a horizontally scrolling row of **filter pills** with a pinned **More filters ›** pill at its right edge; and a **By person** grouping toggle inside the row.

- **Mine** — cards I authored. **Received** — cards imported from others.
- **Search** — full-text over all fields.
- **Filters.** One filter at a time. The inline row shows the common ones — **All · Needs attention · Requests · Gratitude · Entangled · With history** — plus whichever state or person filter is currently active, so it can be cleared with a tap. The pinned *More filters ›* pill (italic, peacock; always visible, the row scrolls and fades beneath it) opens the **Filters sheet**, which lists **every** filter with a count: **Kind** (Requests, Gratitude) · **Where it stands** (each lifecycle state present, with its status dot and human label, e.g. *New to you · 2*) · **People** (one per person) · **Other** (Needs attention, Entangled, With history) · *Show every card*. Picking one applies it and closes the sheet; when every matching card lives on the other side of `Mine | Received`, the tab switches too. The kind / other filters persist across sessions; state and person filters do not.
- **Sort.** The pill reads ⇅ plus the current order and opens the **Sort sheet**: **Latest change** (default) · Date written · Oldest first · Type · Most entangled · Person · Where it stands. Ties fall back to latest change. Persisted.
- **By person** — groups the list into per-person sections with card counts.
- A dismissible **backup reminder** card may appear at the top of the list (§5.15); its dismiss action is a neutral *"Later"*.
- Each card row shows the person, first lines of the summary, kind, a status dot + label, and small glyphs for *has history* and *entangled (n)*.
- An empty list under an active filter or search says so (*"Nothing here matches. Clear the filter to see every card."*) instead of the first-run copy.

**Drafts (v0.8).** A card being written is a card: it is created with status `draft` the moment the composer opens, and every keystroke is saved into it. That means a draft is in the cards list, in a backup, and in the undo history like anything else, and there can be as many as a person likes.

- The **Cards** tab shows a **Drafts · n** section above the list when Mine is showing with no filter and no search (*"Unfinished cards, exactly where you left them. Tap one to carry on writing."*). Tapping a draft carries on writing it, on the step it was left on. The `Mine · n` count and the main list are finished cards only; the **Still a draft** state filter shows drafts as the list.
- The **⊕ sheet** lists up to three recent drafts by their first line and date, with *See all n drafts ›* when there are more.
- **Nothing is lost, and nothing is left behind.** Closing the composer keeps the words (*"Draft saved. It is in Cards, under Drafts, whenever you want it."*), and leaving the screen any other way does the same. Opening the composer and closing it again without writing anything removes the draft and its undo step, so changing your mind leaves no trace. Moving through the steps or opening an accordion is not writing.
- Card detail for a draft offers **Continue writing** · **Discard**, and nothing else: a half-written card cannot be shared (*"Finish the draft first, then share it."*). Discarding asks first and is undoable.
- Finishing a draft turns that same card into the finished one, keeping its id and its place in the list, with a clean history of one `ready` entry. Writing for several people keeps the draft as the first card and mints the rest.
- A draft holds the composer's own state (the step, the open accordion, the coaching switch), which travels in a backup under the card's `x-private.draft` and never in a share.

**Imagining their card (v0.9).** A guess is a draft written *as* someone else: **Imagine their card** (⊕ sheet, a person's own screen, or a need's screen, seeding that need) asks whose words these are, then turns every prompt around — *"What might Robin say they saw or heard?"*, *"When that happened, what might Robin have felt?"* — under a standing reminder, *"You are writing as Robin. Every word of this is yours to be wrong about, and theirs to correct."* The card itself carries no new field: it is `from: Robin`, `to:` the owner, `mine: false`, `status: draft`, with the undo history's `draft` entry naming who actually wrote it (`by:` the owner), which is what keeps the record honest. A guess sits under **Drafts** like any other, marked *as Robin*, and its own screen reads *"Still a guess, in Robin's words. Not from Robin until Robin sends it."* Because it is a draft meant to be sent, it is the one exception to *"a half-written card cannot be shared"*: card detail offers **Send it to Robin** · **Continue writing** · **Discard**, never Edit or Reassign. Finishing it — writing an ending of your own — is not offered: a card from Robin that Robin never wrote would be a lie in your own records. Only Robin, receiving and correcting it, can finish it (§5.10).

The centre **⊕** in the tab bar opens a small sheet — recent **Drafts** when there are any · **Write a new card** · **Imagine their card** · **Add a person** · **Add a need** · **Import a card** — rather than launching the composer directly.

The five bottom tabs are, left to right: **Needs · Cards · ⊕ New · People · Settings** (§7). **People** is covered in §5.9.

### 5.8 Card lifecycle & the language of response

**Grounding.** This flow maps one-to-one onto Rosenberg's teaching on receiving requests (§2 "Receiving a request, the NVC way"): **Heard** is empathic receiving plus honored time-taking; **I'd love to** is the yes that only comes from the heart; **I cannot** is the no expressed as the need behind it; **Let's explore** is the search for a strategy that meets everyone's needs.

**The response buttons.** On a received request's detail screen, under a *"Respond from the heart"* divider, each response is a full-width card-button: a short label with a one-line subtitle beneath it (the subtitle is part of the button). The order and copy, exactly as built:

1. **Heard** — *"Sitting with it."*
2. *(a faint divider reading "when you are ready —")*
3. **I'd love to** — *"I want to and I'm able to."*
4. **Let's explore** — *"Our needs are entangled, so let's explore."*
5. **I cannot** — *"Because this prevents fulfilling my needs."*

(Note the order: **Heard**, then the free **yes**, then **explore**, then **no** — the no sits last, never presented as the default or first reflex.) A separate **Given to** button appears once a request has been said-yes-to; **Celebrated** replaces the whole set on a gratitude card.

| Button | Subtitle | State | What it means / what happens |
|---|---|---|---|
| **Heard** | Sitting with it. | `heard` | Non-final. Opens the **Heard sheet**: a reflection pre-scaffolded from the card's content (*"It sounds like you're feeling ___ because you need ___."*, editable) with **Send the reflection** or **Without words**. The giraffe-ears move, made asynchronous — far kinder than silence, and commits the responder to nothing. |
| **I'd love to** | I want to and I'm able to. | `yes` | A free, wholehearted yes — never from guilt, fear, reward, or obligation. Records the state, then opens the Share sheet to send it back. |
| **Let's explore** | Our needs are entangled, so let's explore. | `maybe` | Opens the **Explore sheet**: **Compose a new card** (composer opens pre-linked to this one) or **Link one of my cards** (searchable picker — "perhaps you processed this very need already"). Either way the responder's card becomes entangled with this one, and this card is locally marked `maybe`. |
| **I cannot** | Because this prevents fulfilling my needs. | `no` | Opens the **I-cannot sheet**, led by the pull-quote *"In NVC, every no is a yes to something else."* — an optional field to *"share the need that keeps you from a yes"* with **Send** or **Without words**. A complete, honored answer. |
| **Given to** | I've given towards the request from my heart. | `given` | Available once a request has been said-yes-to. Marks the giving done; triggers the gratitude suggestion below. |
| **Celebrated** | Received with joy. | `celebrated` | Gratitude cards only — the recipient takes the appreciation in. |

**After any response, the Share sheet opens** so the responder can send the updated card (or, for Explore, their new/linked card) straight back — the loop is one continuous gesture.

**Withdrawn is not a response.** It's a **sender-side action** on the author's own card (a *Withdraw* button in the actions row, behind a confirm sheet): the author takes their request off the table. Once withdrawn, the card is terminal — *"no further actions can be taken on it"* — and the change can be shared so the other person knows where things landed.

**Who a card is for can change (v0.9).** Writing a card is the hard part, and the person it is meant for is one line of it, so a card you wrote carries **Change who it is for** in its actions row rather than making you write it again. The sheet (*"Who is this card for?"*) offers everyone already in People, with the one it is for now marked, plus a field for a name that is not there yet, which adds them. Nothing else about the card moves: *"The card stays exactly as you wrote it. Only who it is for changes."* Two rules keep the history honest. A card that had been **shared** goes back to `ready`, with a `ready` entry appended whose note records who it used to be for, because the person it is for now has not seen it. A card the other person has **answered** (`heard`, `yes`, `no`, `maybe`, `given`, `celebrated`) cannot be reassigned at all: that exchange belongs to the two of them. Drafts change hands in the composer. One step in the undo history.

**Why both `no` and `maybe` exist** (they are deliberately distinct, per the research in §2): "I cannot" is a *complete answer* — the responder isn't volunteering to renegotiate, and NVC insists that such a no be received with warmth, full stop. "Let's explore" is an *invitation to continue* — the responder wants a strategy that meets both people's needs. Collapsing them would either rob people of a clean, honored no, or make every no feel like an obligation to negotiate.

Full state table (display strings exactly as the mockup renders them; `{name}` is the other person):

| Machine state | Display (author side) | Display (recipient side) |
|---|---|---|
| `draft` | Still a draft | — |
| `ready` | Ready to share | — |
| `shared` | Shared with {name} | New from {name} |
| `received` | — | New from {name} |
| `heard` | {name} heard you — sitting with it | Heard · sitting with it |
| `yes` | {name} would love to | I'd love to |
| `no` | {name} cannot | I cannot |
| `maybe` | Wants to explore | Let's explore |
| `given` | Given from the heart | Given to |
| `celebrated` | Celebrated | Celebrated *(gratitude cards only)* |
| `withdrawn` | Withdrawn | Withdrawn by {name} |

Design notes:
- **No accept/decline vocabulary anywhere in the UI.** The button copy above is exact. This encodes Rosenberg's teaching that we only want a yes that's freely given, and that a no deserves warmth, not defense.
- `heard` is **non-final**: it appends to the history and the card remains awaiting an answer. `yes`, `no`, and `maybe` set the card's current status; `given` closes it; `withdrawn` is terminal.
- Every state change appends to the card's `status_history` (state, by, at, note) — one uniform record shape everywhere (§6). The empathy reflection travels as the `note` on a `heard` entry; the need-behind-the-no as the `note` on a `no` entry.
- When a card reaches `given`, the app gently suggests: *"Would you like to send {name} a gratitude card?"* — closing the loop the NVC way. Same prompt on the author side when their gratitude card is `celebrated`.
- After that suggestion, for each inventory need linked to the card (§5.16.3), one dismissible line: *"Has your need for {need} shifted?"* with the three-way tier switcher inline — the moment a request is met is the natural moment to notice the need has moved.

### 5.9 People

**Which person a card sits under (v0.11).** Not the same question as who the other party is. A card of your own addressed to yourself belongs to **Myself**, whichever way it spells you: the composer writes the owner's own name into `to`, while seeded and imported cards carry the literal `Myself`, and both are accepted rather than one being rewritten. Before this, every card to yourself belonged to nobody and appeared on no screen at all, while the needs named on it still showed, because the needs path did the aliasing and the cards path did not. The same resolver backs the People rows, a person's own screen, the `p:` card filter, and the count in the remove-person confirmation.

**Drafts count, separately (v0.11).** A draft appears under the person it is addressed to, in its own **Drafts** section on their screen and as its own item in their row (*2 open requests · 1 draft*), never folded into the open requests: nothing has been sent, so there is nothing open with them yet. Naming somebody in a draft adds them to People straight away rather than only when the card is finished, which is what used to leave a draft to a new name with no row to appear under. The name is taken when it is chosen, not as it is typed, so one name makes one person.

- A person is just a **display name** (plus optional emoji/color avatar and notes). No global identity, no phone/email, no hidden IDs — names are local and human-scale.
- "Myself" is a built-in person for self-empathy cards.
- The app's owner sets **their own display name** once during first-run onboarding (editable in Settings); it is embedded in exported files as `from`.
- The People list has a **search field** (*"Search people"*, with an empty state). Every row, and the person header on Person detail, carries the peacock **entangled glyph with a count** (the links on cards with that person); card rows in Person detail carry the same glyphs as the Cards tab.
- **Adding, renaming, removing (v0.8).** The People tab header carries **Add** and **Edit**, and the ⊕ sheet offers *Add a person*: a name is all it asks for (*"A display name is all Giraffy keeps. No contact details, ever."*), and a name already there is simply pointed out. Person detail carries **Rename** and **Remove**, and from v0.9 so does every row of the People list under **Edit**, since getting a name wrong is exactly the sort of thing noticed while looking down the list; renaming rewrites the name on that person's cards, since a person **is** their display name. Removing takes the name out of the people list and off any need it was named on, and **keeps every card written with them**, which the confirm sheet says out loud. Myself can be neither renamed nor removed. All three are one step in the undo history.
- On import, the app matches the file's `from` name against existing people. Unknown name → one-tap *"Add 'Sam' to your people?"*. If the name matches more than one person (or the user says "that's a different Sam"), **the UI asks the user to choose or create the right person** — disambiguation is a human act, not a data-model one. The user can resolve duplicates by renaming a person in the app, or by editing the name in the YAML; the app never invents identifiers behind the user's back.

### 5.10 Sharing & importing

**One card, one file, one format.** Every `.gnvc.yaml` file contains exactly **one** card (§6). There is no separate "response" file format: plain answers travel as new entries in the card's own `status_history` (share the card back), and entangled answers travel as the responder's *own* card, which simply names this card in its `entangled_with` list (§6.3). Card content lives in exactly one place; nothing can fall out of sync.

**How sharing works offline (Web Share API + PWA, explained).** "Offline-first" means *Giraffy itself* never needs the network: the app, its assets, and all data are on the device, and the YAML file is generated locally, in memory. The **Web Share API** (`navigator.share`) is not a network call — it is a local operating-system action, like opening a file picker: it pops the OS share sheet and hands the locally generated file (or text) to whichever app the user chooses (Signal, WhatsApp, Mail…). Giraffy's job ends there, network or no network; *delivery* is the chosen messenger's job, whenever it next has connectivity. The API needs HTTPS and a user tap (both already true for an installed PWA) and is well supported on iOS Safari and Android Chrome; where it's absent (some desktop browsers), Giraffy falls back to **Download file** and **Copy as text**, which are also fully local.

**Export (share) paths — all producing a single-document `.gnvc.yaml`:**
1. **Web Share API** (share sheet with the file, falling back to share-as-text) — primary on mobile.
2. **Copy as text** — the full YAML to the clipboard, for pasting into any chat.
3. **Download file** — `{author-slug}-{kind}-{date}-{shortid}.gnvc.yaml`.
4. **Responses are still one file.** A plain answer (`heard`, `yes`, `no`, `given`, `celebrated`) = share the original card back, its `status_history` extended. A `maybe` (Let's explore) = share *your* card, which names the other card in its `entangled_with` list (§6.3). Never two files, never a second format.
5. **A shared card is the card and nothing else (v0.9).** A one-line human preamble is offered
   for whoever has never seen Giraffy (removable; toggle in Settings), and it travels **beside**
   the card, never inside it: as the `text` of the share sheet alongside the file, and as its own
   *Copy the note* on the share screen. It used to be pasted above the card, which made the text
   unreadable to the app at the other end, since prose is not part of the format. Default wording:

   > *"I took some time to put this into words with care, using Giraffy. You can simply read the card as it is, or open it at https://giraffy.riverma.com to reply from the heart."*

   The three export actions are **Send the file** (the share sheet, where the device has one),
   **Save the file** (a place of the person's choosing where the browser can ask, the browser's
   own download where it cannot), and **Copy as text**.

**Import paths:**
1. **Paste** → the Import screen's paste-area accepts raw YAML text (the primary path — critical for chat-app workflows where files are awkward). It offers a **format-help expander** and three **sample loaders** — *"Try a sample request card,"* *"…with history,"* *"…with entanglements"* — so anyone can see the format and the flows without a real file. The same screen in its restoring frame (`#/restore`, §5.15) leads with the file instead, and carries only the backup sample.
2. **Import button** on the Cards header → file picker (`.yaml`, `.yml`, `.gnvc.yaml`, `.txt`).
3. **PWA file handler** registration (`file_handlers` in the manifest) so tapping a shared file offers "Open in Giraffy" where the OS supports it.
4. **Share target** (`share_target` in the manifest) so the app appears in the OS share sheet for text/files on Android; graceful absence elsewhere.

**Anything above the card is not the card (v0.9).** A card rarely arrives alone: versions up to
1.2.2 pasted the preamble above it, and a chat app may add a quoting header. A read that fails is
retried with everything above the card's first key or comment set aside, so both keep working.
The retry only happens after a straight read has already been refused, so a card that reads today
cannot start reading differently.

**Import preview & validation.** After **Preview**, the screen shows the parsed card as it will appear, a green **"validation passed · valid gNVC 1.0"** line, and — for a card that names your cards — an entanglement note (*"a thread with N of your cards will form"*). A malformed paste yields a warm error headed *"This doesn't read as a gNVC card yet"* with the specific reason (e.g. a missing `gnvc:` version key), never a crash. Apply is labelled per case: a new card gets **Add** / **Not now**; your own returning card gets **Merge it in** / **Not now**.

**Import semantics (the sync-without-a-server rules):**
- Every card has a globally unique `id` (UUIDv4) minted by its original author.
- Unknown `id` → new card in **Received** (or in **Mine** if it's my own card coming back — detected by `from` matching my name, confirmed by me if ambiguous).
- **An arriving card that is still `status: draft` is not marked received at all (v0.9).** Nobody has sent it as a finished card yet — it is a guess waiting to be put right — so it goes straight into **Drafts**, in the sender's words, ready to open and correct. When `from` matches the local owner's name, the preview says so plainly (*"Robin wrote this as you. Check it, change what is wrong, and send it back."*) and applying is **Take it as my draft**. When it does not — the same person under a different spelling on each device — naming is a human act, exactly as it is for a received card's `from` above: the preview offers **That is me, take it** (rewrites `from` to the local owner and claims it) alongside **Keep it as it is** (imported as a draft addressed to a person of that name, unclaimed).
- Known `id` → **merge**: `status_history` union by `(state, by, at)`; structured fields update only if the incoming `updated` is newer AND `from` is the card's original author; my private notes are never touched. A confirmation screen shows what will change before applying. This is how a guess resolves once the person it was about sends their own version back: the same id, so the merge takes their words as the body and keeps the original guess as a `draft` entry in the united history — one card, both voices, side by side.
- **Entanglement is re-resolved on import**, not carried as lineage: for each id in the imported card's `entangled_with`, if that card exists locally the app forms the connection **both ways** (it adds the reciprocal link to the local card) so the thread appears from either end. Cards named but not yet present are simply shown as *"a card from {name} you haven't received yet"* until they arrive. No response *states* travel inside `entangled_with` — each card's states live only in its own `status_history` (§6.3).
- Chains stay local and neighbor-to-neighbor: A links to B, B links to C — A never names C; the **UI walks the chain** at render time (§5.11).
- Every import (and any hand-edit made inside the app) is validated against the published gNVC JSON Schema (§6.5); malformed files fail with a friendly message that shows the parse/validation error location and never crashes.

### 5.11 Threads & entanglement

- Cards link to other cards via a single link type: **`entangled_with`** — *"a need in this card and a need in that card are interdependent."* A link is just a **pointer to another card's `id`** (optionally with a human comment). There is no "in_response_to" link type and no per-link state lineage: cards don't answer cards, people answer people (through the response flow, §5.8, which writes to each card's own `status_history`). What the graph records is only the durable fact that two sets of needs are intertwined.
- **How a `maybe` becomes visible on both sides.** When a responder chooses *Let's explore*, their app (a) links their new-or-chosen card to the received card and (b) marks the received card `maybe` locally in its own history. When they share their card back and the original author imports it, the author's app sees the inbound `entangled_with` pointer, forms the reciprocal link, and the thread appears — the entanglement itself carries the meaning, no lineage payload required.
- **Links are neighbor-to-neighbor only.** In a chain A–B–C–D, each card links only to its direct neighbors (A↔B, B↔C, C↔D). The full chain is never serialized; the **UI reconstructs it at render time** by walking links across the local database. Every file stays small, duplication-free, and impossible to de-sync.
- **Thread view** has two modes, toggled at the top: **Timeline** and **Visualize**.
  - *Timeline* — a vertical, conversation-style stream interleaving the entangled cards (each compact: byline, italic summary, "Open the card ›") with the status events between them (dot, label, optional note).
  - *Visualize* — the needs web (§5.12).
- **Scalability:** the link model is a general graph, so threads among 3+ people are representable today; the visualization and timeline are designed so a third participant can be added without a data-model change. Multi-party **UI** is future work (§10) — nothing in v1's format or storage forecloses it.

### 5.12 The needs-web visualization

The signature visualization, reached from a thread's **Visualize** toggle. As built in the mockup it is **radial**: a central node holds the shared theme/need the thread has come to rest on, with the participants' needs arranged around it as pills, connected by soft dashed lines, and a caption naming the insight (e.g. *"your need for rest and my need for shared care are both alive here"*). Below the diagram, a **"Requests on the table"** list shows the open requests from each side, each opening its card.

- **Implementation:** standard web UI components — absolutely-positioned DOM pills and CSS-rotated `<div>` connector lines over a positioned container — **not** a hand-maintained SVG canvas.
- **Two-column is deferred, not chosen.** v0.3 preferred a two-column (my needs | your needs) layout; the mockup ships radial, and radial is the current direction. A two-column mode remains a worthwhile alternative to prototype (the code even carries a latent `columns | radial` switch), but only radial is built today. See §11.
- **Scalability:** radial extends naturally to more than two participants (more nodes around the center) without a format change.
- **Tier tint:** the owner's need pills take the tint of their current inventory tier (§5.16.2) — clay / turmeric / bodhi — so the web shows not just *which* needs are entangled but how met each one feels today. The other person's pills stay neutral (their tiers are theirs, and private).

### 5.13 Insights (removed in v0.6)

*v0.4 gave Insights its own tab; v0.5 folded it under the Needs home; the hand-test rounds found it added little, and v0.6 removes it.* What it offered survives in quieter places: the **counts** live in the Cards **Filters sheet** (§5.7), where every state, kind and person is one tap from the cards behind it; **entangled needs** show as an inline peacock glyph on the need rows of the Needs home (§5.16.4), opening the thread; the **People** tab already carries per-person summaries. The *reflective line* (*"Most of what's aching sits in…"*) is gone everywhere, including the check-in Summary page, which simply states the count. There is no dashboard, no chart, and no cross-category verdict.

### 5.14 Undo, redo & session history

A safety net that runs across the whole app (new in the mockup; not in earlier drafts).

- **Undo / Redo** controls sit in the Needs, Cards and People headers and on card detail. Nearly every mutation — composing, responding, withdrawing, deleting, importing, merging, linking, starting and discarding a draft, adding and removing a person, adding, removing and hiding a need, adding and removing an area — is recorded and reversible within the session. Autosaving a draft is not a step: one step marks the draft's start, one marks the finished card.
- Destructive actions confirm *and* reassure: delete/withdraw toasts end with *"You can undo this."* Withdraw and delete each go through a confirm sheet with warm, non-confirmshaming labels (*"Keep it"* / *"Leave it up"*).
- A **session-history sheet** lists every change, newest first, with a step number and time. Header copy: *"Every change this session, newest first. Tap any point to go back to it. Giraffy asks before it does."* Tapping a point opens a confirm sheet — *"Go back to this point?"* — naming the step, its number and time, and how many later steps will move to redo; **Go back** reverts, **Stay here** returns to the list. Nothing is lost: the later steps sit in redo.
- Scope is the **current session** (an in-memory stack); it is not a substitute for the durable backup file (§5.15).

### 5.15 Backup & restore

- **Full export:** one file holding the **entire app state** — your name, settings (coaching, preamble, derived-tier method, card filter and sort), people, any **needs and areas of your own** and which shipped needs are **hidden** (header keys `custom-areas`, `custom-needs`, and `x-private.hidden-needs`), the **needs inventory** (tiers, category overrides, who-might-help intentions, private notes, tier history — §5.16), and every card including drafts with the composer state they carry, private notes, `mine`, need ids and link pairs — as one YAML stream: a **header document** followed by one document per card (the card documents are ordinary gNVC cards; app-only data sits under `x-private:`). Offered as download and via share sheet. Settings shows the last-backup line. Toast: *"Backup saved: your name, settings, people, needs, and every card."*
- **Visible, occasionally insistent.** Because Giraffy has no server, the browser's local storage *is* the data — and browsers can evict it, devices get lost, and **if the app's domain ever changes, the browser treats it as a different site and all local data becomes unreachable**. There is no reliable way to detect an upcoming domain change from inside the app, so the mitigation is habit: a **gentle, occasional in-app reminder** — a dismissible card at the top of the Cards list (its decline reads *"Later"*), never a modal ambush. Backup is never a hidden power-user feature; it is one tap in Settings and on that Cards-tab card. Mockup copy: *"Giraffy has no server, and this device holds the only copy of your cards. A backup file keeps them yours even if the browser lets go."* Where backups keep themselves (below), the reminder card stays away entirely.
- **Restore** lives in Settings as *"Restore from a backup,"* which opens `#/restore`: the same screen as Import, in its restoring frame. It leads with what a backup **is** (*"the whole app in one file: every card and draft, your people, your needs and any you added, your notes and your settings"*), puts **Open a backup file** first with pasting second, and explains the file rather than the card format (*"What is in a backup?"*). It recognises a backup, previews it (*"A Giraffy backup"*: owner, saved date, and counts of cards and drafts, people, needs examined and noted, needs and areas of their own, name, settings) and offers **Restore everything**, naming what would go in its place (*"What is here now (6 cards, 4 people, 47 needs marked) goes"*); the restore is one undoable step. A single card opened here still imports, with a line saying that is what it is. `#/import`, reached from the Cards tab and the ⊕ sheet, keeps the card framing and the card samples (§5.10).
- **Storage durability:** call `navigator.storage.persist()` on first save and surface the result; the reminder copy explains, kindly, why backups matter.

**Backups that keep themselves (v0.8).** A reminder only works if someone acts on it, so where the browser allows it Giraffy keeps a copy without being asked.

- **Where this works.** The folder half of the File System Access API (`showDirectoryPicker`) is Chromium on a desktop and nowhere else: not Firefox, not Safari on either platform, and not any browser on a phone, where every save needs a tap. The app therefore **says which case it is in** rather than pretending: with the API, *Choose a folder*; without it, *"This browser cannot write to a folder on its own, so a backup here is one tap."* Nothing is hidden behind a feature check.
- **Setup asks.** The last page of onboarding, *"Keep a copy somewhere."*, explains that this device holds the only copy and that clearing history takes it too, then offers the best that this browser can do. It is skippable, and Settings can set it up later.
- **What is written.** One file, `giraffy-backup.gnvc.yaml`, rewritten in place: about a minute after the changes stop, never oftener than once every five minutes, and again when the app is hidden or closed. A backup taken by hand keeps the dated name (`giraffy-backup-2026-09-12.gnvc.yaml`) and is written **beside** it, so a copy someone deliberately kept is never overwritten by the automatic one.
- **The handle.** The chosen folder is stored in IndexedDB, outside the app's data and outside the undo history, and comes back on the next visit. The permission that goes with it may not: browsers forget it between sessions, and asking again needs a tap. That state is shown as **paused**, with **Allow again** in Settings, and the folder copy simply waits rather than failing quietly.
- **Settings** carries the folder's name, an on/off for the automatic writes, *Change folder*, *Stop* (which leaves the files where they are), and the date the copy was last written. The Cards-tab reminder card does not appear while a folder is keeping itself up to date.

**Erase all data.** The last section of Settings, *Start over*, holds a clay-red **Erase all data** button with the caption *"Removes every card, need, person, and setting from this phone and returns Giraffy to its very first screen. Giraffy asks twice before it does, and offers a backup on the way."* The flow is two sheets: (1) *"Erase everything on this phone?"* — red **Continue** / **Keep my data**; (2) *"One last check"* — *"There is no undo, and no server copy to recover from. If any of this might matter later, save a backup first. It takes a moment and stays on your phone."* with **Back up first** (downloads the backup, toasts *"Backup saved. Erase whenever you are ready."*, and leaves the sheet open), red **Erase everything**, and **Keep my data**. Erasing clears the database and every persisted preference, returns to onboarding page one with no name, and toasts *"Everything erased. Giraffy is as new."* It is the one action in the app that undo does not cover, and both sheets say so. This is the only place the app uses a red button.

### 5.16 The needs tree (home)

Giraffy opens here. The tree is a scannable inventory of every need in §5.4, each carrying a self-reported tier, each naming who might help meet it, and each one tap from the composer. It is a *lens* over the cards the user already writes — a card's `to:` is the person, its `needs:` name the needs — plus one genuinely new piece of private state: **how met each need feels right now.**

#### 5.16.1 What it records (app-only, never in a shared file)

```ts
Need         { id: "connection/closeness", category, word, tier?: 'met'|'partly'|'unmet', tierChanged?, note?, custom? }
CategoryTier { category, tier? }                         // the user's felt override; absent = derived (§5.16.2)
NeedPerson   { needId, personId, note?, created }        // "who might help" — may exist with zero cards
CardNeed     { cardId, needIndex, needId }               // links a card's needs[] strings to inventory leaves
NeedTierEvent{ needId, tier, at }                        // quiet history, used only for "was unmet in June"
```

Everything above lives in the local database and in backups (`x-private:`, §5.15). None of it enters a `.gnvc.yaml`; the format is unchanged (§6.4).

#### 5.16.2 Tiers and their colours

Three tiers plus **unexamined** (the word used everywhere for a need not yet marked; never "untouched" or "not yet looked at"). **Traffic-light red / yellow / green is not used** — Ahimsa refuses red badges and alarm colours. Tiers take the Ahimsa accents:

| Tier | Meaning | Colour | Token |
|---|---|---|---|
| **met** | this need is nourished right now | bodhi | `--bodhi-600` (`--accent-success`) |
| **partly** | some of it, some of the time | turmeric | `--turmeric-600` |
| **unmet** | this need is aching | clay | `--clay-600` (`--accent-warning`) |
| *unexamined* | not yet marked | neutral | `--neutral-400` |

Tier glyphs are small filled dots (the same dot the status pills use), never emoji. Counts are stated neutrally — *"12 of 41 looked at"* — never as a score, and there is no overall "your needs are red" verdict.

**Category tier.** A category's glyph is the user's *felt sense* of the whole area, not a formula — the two routinely disagree (an area can feel green while three of its leaves ache). Until the user says otherwise, the category's tier is **derived** from its rated leaves (unrated ignored) by the method chosen in **Settings → Needs**, *"How an area's colour is worked out"*: **Most unmet** (the worst of any rated need) · **Most common** (the majority; ties lean less-met — the default) · **Average** (met = 1, partly = 2, unmet = 3, rounded). Changing the method opens a confirm sheet — *"Recalculate every area?"* / *"Areas you set by hand (n) will be replaced by the new calculation."* — **Recalculate** / **Keep mine**; recalculating clears the hand-set areas and is one undoable step. Tapping the category's dot **overrides** the derived tier and the override simply **sticks** — there is no *derived* / *yours* caption — until the user cycles the dot back to unexamined, which returns it to derived. Beside the glyph, a thin three-segment bar shows the distribution, so a single colour never hides the picture.

**One word, one home.** A need's identity is **(category, word)**, and since v0.7 no word appears under two headings, so there is no cross-link line to show and no chance of marking "the other one" by mistake. Need detail shows the need's meaning instead.

**Changing the vocabulary.** The id stored against every marked tier, named person, private note and card link is derived from (category, word), so renaming a word or moving a need between categories changes it. The vocabulary is therefore fixed between releases, and any change ships with a migration that maps every old id onto the need it became, merging the later mark when two needs collapse into one and keeping both private notes.

**A person's own needs are not a vocabulary change.** What someone adds lives in their data under `custom/` ids and what they hide is a list of shipped ids (§5.4); the shipped list itself is untouched either way, so neither needs a migration and both travel in a backup. A hidden need keeps everything marked on it, and the migration above passes `custom/` ids through unchanged.

**Ordering.** The tree is alphabetical at both levels (§3.8), with a person's own needs sorted in among the shipped ones and their own areas after the seven. Severity is a **filter**, never the default sort.

#### 5.16.3 Linking cards to needs

- A need chosen from the inventory in the composer (§5.1 Step 3) writes both the plain string into the card's `needs[]` (so the exported file is unchanged) and a `CardNeed` link. Free-text needs stay unlinked until the user links them.
- On **import**, and for existing cards on migration, strings are matched to inventory words case-insensitively: exact matches auto-link; near matches get a one-tap *"link to…"*; nothing is invented behind the user's back.
- Under a need, cards are **grouped by the person they're addressed to** (`to:`). That grouping *is* the "who might help" list, joined with the standalone `NeedPerson` intentions so a person can be named before any card exists.

#### 5.16.4 Needs home (the tree)

- Header: **Needs** · italic subline *"What's alive in you, by name. Nothing here to fix in a hurry."*
- Header actions: **Check in** (§5.16.6) · filter chips **All · Unmet · Partly · Met · Unexamined** · a *"n of m looked at"* count · a wrapped **legend** row (met · partly · unmet · unexamined · entangled).
- **Sections = categories**, alphabetical, collapsible via a visible round **+ / −** button (26 px, sunk surface). Header row: category name · tier dot (tap to cycle / override) · distribution bar · *"n of m looked at"*. No *derived* / *yours* caption (§5.16.2).
- **Need rows**, alphabetical: word · tier dot · monograms of the people named on it (Myself shown as *M*) · a faint **card-count** glyph when cards sit on the need · the peacock **entangled glyph** when any of those cards is entangled — tapping it opens the thread. The glyph means one thing only. Tap the row → Need detail. Long-press the dot → cycle the tier in place.
- There is **no** reflective line and **no** insights section beneath the tree (§5.13).
- **Empty / first-run state:** the tree is fully present but unexamined; a single card at the top reads *"Begin with a quiet pass through your needs — or simply tap any need as it feels today."* → **Check in** · **Later**.

#### 5.16.5 Need detail

1. Category in small caps · **word** in Fraunces · the need's **meaning** in the context of this category (§5.4).
2. **Tier** — a three-way Pill switcher *Met · Partly · Unmet* plus a quiet *clear* link. Caption from history: *"changed three weeks ago · was unmet."*
3. **Who to reach out to** — **Myself pinned first**, then people alphabetically, then *"+ someone"* (the existing person picker, or a new name; groups like *Work colleagues* are just names, §5.9). Each person row expands to their **cards on this need** (compact: kind · date · summary line · status) and, under a quiet *write a card* label, **both kinds**: **Request** · **Gratitude**. Either opens the composer pre-filled with that person and this need, on the Observation step. Both are always offered and always in that order: a need can be asked about *or* thanked for whatever its tier says today, and the buttons must not move under the reader's thumb. A person with no cards yet is fine; it is an intention.
4. **A private note** (never exported).

#### 5.16.6 Check-in

The quick scan. Reached from the Needs header and from the first-run card.

- Intro page: *"Take a quiet pass through your needs. Tap each one as it feels today — met, partly, unmet. Skip any you like."* with the four-dot legend (met · partly · unmet · unexamined). Buttons: **Begin** · **Not now**.
- **One category per screen.** Header: progress dots, a **×** to close, and **Skip to end** (jumps to the Summary; every tap so far is kept). Then the **legend** (met · partly · unmet · unexamined), the small-caps label *"{Category} Need"* and the prompt *"How do your {category}-related needs feel right now?"* Needs as ToggleChips in a wrapped grid; each tap cycles *unexamined → met → partly → unmet → unexamined*, the chip tinting with the tier. Beneath the chips, *"Overall, this area feels"* — a Met · Partly · Unmet pill row that shows the derived tier until the user sets it by hand (§5.16.2). Footer: **Back** (quiet on page one) · centred *"Page n of 7"* · **Next** (**Finish** on the last). There is no *Skip this area* — Next with no taps is the skip. No timer, no percentage, no streak; closing mid-way keeps every tap.
- **Summary page** (heading *Summary*): the per-category distribution bars, a plain count (*"n of m needs looked at. That is plenty for one pass."*), and *"Would you like to write a card about any of these?"* — the unmet needs as a list. Tapping one first asks *"Finish setup and write a card?"* — **Write the card** / **Stay here** — then opens the composer with the need pre-selected (the person is chosen next). Footer button: **Done Setup**.
- **Cadence:** nothing schedules a check-in. At most, when it has been a while, the first-run card reappears with softened copy (*"It has been a while since you looked. Whenever you like."*) — dismissible, and off in Settings.

#### 5.16.7 Where else the tree shows

- **Composer, Needs step:** inventory tiers visible; optional one-tap tier set (§5.1).
- **Card detail:** the Needs section shows tier dots; tapping a need opens Need detail.
- **Lifecycle:** *"Has your need for {need} shifted?"* after `given` / `celebrated` (§5.8).
- **Needs web:** the owner's pills tinted by tier (§5.12).
- **Person detail:** a small *"needs you've named together"* list linking back into the tree.

#### 5.16.8 Coaching

A card launched from the tree runs the same coaching (§5.2), unchanged. The tree will attract raw material — the feelings people jot beside an aching need are often faux feelings (*judged*, *controlled*, *pressured*) — which is exactly what the coaching layer is for. The per-composer **quiet** toggle stays visible from the first step.

---

## 6. gNVC — the open card format (`.gnvc.yaml`)

**gNVC** (giraffy-flavored NVC card format) is a deliberately small, versioned, hand-writable format. Design goals: **readable top-to-bottom by a human with no app** (field order puts who-and-what first, machine bookkeeping last); writable by hand in any text editor; parseable by any YAML 1.2 library; validatable against a published schema (§6.5); forward-compatible (unknown keys are preserved on merge and round-trip).

**One document per file. One document kind: the card.** Responses are not a second format — they are new `status_history` entries on the card itself (§6.2). Entanglement between two cards is a plain `id` pointer, carrying no state (§6.3).

### 6.1 Example — a request card

```yaml
# A Giraffy card — written with care. Read it top to bottom,
# or open it at https://giraffy.riverma.com

from: Maya
to: Sam
about: "Last night's dinner dishes"

summary: >
  When I saw the dishes from last night still on the counter this
  morning, I felt frustrated and a little discouraged, because I
  need shared care for our home and reliability around agreements.
  Would you be willing to wash your dishes before bed tonight?

observation: >
  When I saw the dishes from last night still on the counter
  this morning.

feelings:
  - frustrated
  - discouraged

needs:
  - shared care for our home
  - reliability around agreements

requests:
  - Would you be willing to wash your dishes before bed tonight?

status: shared
status_history:
  - { state: ready,  by: Maya, at: 2026-07-10T18:20:00Z }
  - { state: shared, by: Maya, at: 2026-07-10T18:22:00Z }

entangled_with: []             # pointers to other cards, by id (see 6.3)

# Optional precise mappings. Indices are 0-based into the lists above.
# Omitted = "everything relates to everything".
mapping:
  feelings_to_needs:
    - [0, 1]                   # frustrated ↔ reliability around agreements
    - [1, 0]                   # discouraged ↔ shared care for our home
  requests_to_needs:
    - [0, 0]
    - [0, 1]

# ---- giraffy app-only details ----
kind: request                  # request | gratitude
id: 7f3b9e2c-4a1d-4e08-9c11-52d8a0b6f3aa   # minted once, never changes
created: 2026-07-10T18:04:00Z
updated: 2026-07-10T18:22:00Z
gnvc: "1.0"  # spec: https://w3id.org/gnvc/1.0
```

*(The mockup emits exactly this shape — human-first order, the `# ---- giraffy app-only details ----` divider, and the `gnvc: "1.0"  # spec: …` version line last. `mapping` is optional and omitted by the mockup's generator unless present.)*

### 6.2 Example — a plain response (the same card, coming back)

Sam first sends **Heard** (with a reflection), then, after sitting with it, an honest **I cannot**. **No new file format** — he shares Maya's card back with its history extended (everything else unchanged):

```yaml
# …same card as 6.1, with status and history updated…

status: no
status_history:
  - { state: ready,    by: Maya, at: 2026-07-10T18:20:00Z }
  - { state: shared,   by: Maya, at: 2026-07-10T18:22:00Z }
  - state: heard
    by: Sam
    at: 2026-07-10T21:05:00Z
    note: >
      It sounds like you're feeling frustrated and discouraged
      because you need shared care and reliability around agreements.
  - state: no
    by: Sam
    at: 2026-07-11T08:10:00Z
    note: >
      Saying yes tonight would set aside my need for rest — I'm
      wiped out after closing shifts. I'm glad you told me this.
```

On import, Maya's app merges by card `id`: the two new history entries are unioned in, her card's status becomes `no`, and nothing else changes.

### 6.3 Example — an entangled response (`entangled_with` is a plain pointer)

Sam instead answers **Let's explore** and surfaces the need of his that's tangled up in Maya's request. He writes **his own card**, which simply names Maya's card by `id` in its `entangled_with` list. **The link carries no state lineage** — it is just a pointer (with an optional human comment). Sam's own response history stays in *his* card; Maya's card, marked `maybe` and shared back separately (as in §6.2), carries the `heard`/`maybe` entries in *its* history.

```yaml
# A Giraffy card — written with care.

from: Sam
to: Maya
about: "Evenings after closing shifts"

summary: >
  When I get home after closing the store at 10pm, I'm exhausted and
  depleted, because I need rest and some ease in my evenings. Would
  you be willing to try dishes-in-the-morning on my closing nights?

observation: >
  When I get home after closing the store at 10pm on weeknights.

feelings: [exhausted, depleted]

needs: [rest, ease in the evenings]

requests:
  - Would you be willing to try dishes-in-the-morning on my closing nights?

status: shared
status_history:
  - { state: shared, by: Sam, at: 2026-07-10T21:40:00Z }

# names one of Maya's cards as entangled — just a pointer:
entangled_with:
  - id: 7f3b9e2c-4a1d-4e08-9c11-52d8a0b6f3aa   # Maya's dishes request

# ---- giraffy app-only details ----
kind: request
id: 91c4d7aa-2e0b-4f7e-8d3c-6b1f0a9e5c22
created: 2026-07-10T21:38:00Z
updated: 2026-07-10T21:40:00Z
gnvc: "1.0"  # spec: https://w3id.org/gnvc/1.0
```

When Maya imports this file, her app adds Sam's card to her Received list and, seeing his `entangled_with` pointer to a card she holds, **forms the reciprocal link** so the thread appears from either end. An Explore therefore involves up to two ordinary files — Maya's original coming back with a `maybe` in its history (§6.2), and Sam's new card above — each a standalone, valid gNVC card. Nothing carries a special lineage payload; the entanglement pointer plus each card's own history are enough.

### 6.4 Schema rules

- **`kind` values:** `request`, `gratitude`. One card per file. (There is no `response` kind.)
- **Required keys:** `gnvc`, `kind`, `id`, `from`, `created`, `updated`, `observation`, `feelings`, `needs`; `requests` required for `kind: request`, absent on `gratitude`. `to`, `about`, `summary`, `status`, `status_history`, `entangled_with`, `mapping` optional.
- **Field order is a convention, not a requirement** — parsers accept any order; writers (the app, and hand-authors who care) should emit the human-first order shown above: `from` / `to` / `about`, then `summary`, then the four NVC parts, then status, links, mapping, and the app-only details last.
- **Identity is the display name.** `from`/`to` are plain names. No profile ids or hidden identifiers; disambiguating people is the receiving user's act, supported by the UI (§5.9).
- **State record shape (uniform):** each `status_history` entry is `{state, by, at, note?}`. Valid `state` values are exactly the machine states of §5.8's table: `draft, ready, shared, received, heard, yes, no, maybe, given, celebrated, withdrawn` (the schema enforces this). `draft` was always a valid state; from v0.9 it can legitimately travel in a shared file too, as a guess at someone else's card (§5.7) — the recipient's app reads `from` against its own owner name to tell a guess-about-them from an ordinary draft they are simply receiving a copy of.
- **Links:** `entangled_with` is a list of `{id}` pointers (an optional trailing `# comment` is for humans only) referencing direct neighbors. Links carry **no** `from`/`at`/`note`/`states` — a card's states live only in its own `status_history`. Apps form the reciprocal link on import and reconstruct chains at render time; the chain is never serialized.
- **Feelings/needs/requests are plain strings**, not enum-constrained — the vocabularies (§5.3–5.4) are UI conveniences, not format restrictions. Hand-authors can write anything.
- **Timestamps:** ISO-8601 UTC. Apps display in local time.
- **Merging:** union `status_history` by `(state, by, at)`; card body fields take the newest `updated` *from the original author only*; unknown keys are preserved verbatim (forward compatibility).
- **Versioning:** `gnvc: "1.0"`. Apps must accept any `1.x` and ignore unknown keys; a future `2.x` may break.
- **File naming convention (non-normative):** `{author}-{kind}-{YYYY-MM-DD}-{first-6-of-id}.gnvc.yaml`.
- **Privacy rule:** private `notes` fields — and the entire needs inventory of §5.16 (tiers, category overrides, who-might-help intentions, tier history) — are NOT part of this format and are never serialized into shared files (backups use a superset format with an explicit `x-private:` section).

### 6.5 Publishing gNVC as a truly open format

YAML has no native schema language, but **JSON Schema validates YAML directly** — YAML 1.2 parses to the same data model as JSON, and this is the established convention (it's how VS Code and other editors validate YAML today). So one artifact serves everyone: **`gnvc-card.schema.json`** (JSON Schema draft 2020-12).

Where it lives, so the format outlives any one host:

1. **Canonical, permanent identifier: `https://w3id.org/gnvc/1.0`** — w3id.org is the community-run permanent-URL service (used widely for open vocabularies and standards); it simply redirects to wherever the spec is actually hosted. If giraffy.riverma.com ever moves, the redirect is updated and every card ever written still points somewhere real. `…/1.0` serves the human-readable spec page; `…/1.0/schema.json` serves the schema.
2. **Actual hosting (done, 2026-09-22):** the format lives in its own repository, [riverma/gnvc](https://github.com/riverma/gnvc), published at <https://riverma.com/gnvc/>, with the schema at `/gnvc/gnvc-card.schema.json` and the CC0 templates alongside. Giraffy is one client of the format rather than its owner, so the format is not kept inside this app's repository; the copy under `spec/` is vendored for the offline validator. The w3id redirect is prepared on a fork and awaiting review before it is filed.
3. **SchemaStore.org submission:** registering the schema against the `*.gnvc.yaml` filename pattern in the open SchemaStore catalog means VS Code, JetBrains IDEs, and anything using yaml-language-server **validate hand-edited cards automatically, with no setup** — real-time squiggles for a hand-author, for free.
4. **Every card cites the spec:** the version line carries the permanent URL as a comment — `gnvc: "1.0"  # format version — spec: https://w3id.org/gnvc/1.0` — so any card found in the wild leads back to the format's definition. Hand-editors who want live editor validation can additionally add the standard modeline at the top of a file: `# yaml-language-server: $schema=https://w3id.org/gnvc/1.0/schema.json`.
5. **In-app, the same schema** (bundled, via Ajv) validates every import and every hand-edit made inside the app — one source of truth for machine and human alike.

---

## 7. Information architecture & screens

*(Reconciled to the mockup. Mobile-first; on desktop/tablet the same IA presents as a two-pane master-detail. Full-screen flows — composer, card detail, thread, import, about — slide over the tabbed shell.)*

```
Bottom tab bar:  [ Needs ]  [ Cards ]  ( ⊕ New )  [ People ]  [ Settings ]
                    ^ home
```

*The app launches on **Needs** (§5.16). The v0.4 Insights tab is gone; its sections live at the foot of the Needs home (§5.13).*

1. **Onboarding (first run, 4 pages, on the full dawn gradient):** (a) **Welcome** — the display word *Giraffy* with the **giraffe mark** to its right (a flat icon: rounded head, round muzzle, two ossicones with clay tips, leaf ear, dot eye, and a straight neck with a gentle lean, three clay spots), the one-line pitch, and *"Privacy first, offline, and here to help you process your feelings and needs."* → **Setup** · **Skip for now**; (b) **A few concepts** (*how Giraffy works*) — a glass card with four illustrated steps in warm, fill-only Ahimsa shapes: *1 · name your needs* · *2 · write a card* (to someone, or to yourself) · *3 · they do the same* (responses; entangled needs and the thread) · *4 · over time* (a ring of people around a sprout: *"Card by card, need by need, toward a world where everyone's needs are met."*), footed by *"Nothing to memorise. Each of these is explained again where you meet it."*; (c) *"first, a name"* — the owner's display name, "it signs the cards you share, nothing more"; (d) *"Every feeling points to a need."* — *"Giraffy starts there: capture every need, yours to mark as it feels today. Cards and requests grow from it."* → **Take a first pass** (opens Check-in, §5.16.6) · **Skip for now** (*"your needs wait"*). (e) *"Keep a copy somewhere."* — where backups should live (§5.15): **Choose a folder** where the browser can write to one, otherwise the plain statement that it cannot and a **Save one now** button. Buttons read **Setup** on the first page, **Continue** after, and **Start the check-in** on the last; **Skip for now** on every page.
2. **Needs (home):** the tree of §5.16.4 — Add · Edit · Check in · filter chips · legend · categories with + / − → need rows with card-count and entangled glyphs. Undo/Redo in the header as on Cards. **Edit** reveals Hide / Remove on each need, *+ a need under {area}* at each area's foot, Remove on your own areas, and *+ an area* at the end (§5.4).
3. **Need detail:** §5.16.5 — tier switcher · who to reach out to (Myself first) · cards per person · Request / Gratitude · private note, plus *Show it again* on a hidden need and *Remove it* on one of your own.
4. **Check-in (setup wizard):** §5.16.6 — intro with legend; one category per screen with legend, *"{Category} Need"*, tap-to-cycle chips, the *Overall, this area feels* row, Back · *Page n of 7* · Next / Finish, and *Skip to end*; the **Summary** page with unmet needs as launch points (leave-setup confirm) and **Done Setup**. Sits on a canvas one shade deeper than the app.
5. **Cards:** **Add** · **Edit** in the header, with Edit revealing Remove on each card and Discard on each draft; `Mine | Received` segmented control (Received shows a gentle dot for unactioned imports) + **Import**; a **Drafts · n** section above the list (§5.7); search with the **Sort** pill; the filter row with the pinned **More filters ›** pill and **By person**; the **Filters** and **Sort** sheets; **Undo/Redo** and a **session-history** control in the header (§5.14); optional dismissible backup card (§5.15). Rows show person, summary lines, kind, status dot + label, and *has-history* / *entangled (n)* glyphs. (§5.7)
6. **⊕ sheet → New card (the composer):** the centre tab opens *"What would you like to do?"* — recent **Drafts** (up to three, by first line and date, with *See all n drafts ›*) · **Write a new card** · **Add a person** · **Add a need** · **Import a card**. The composer is §5.1: full-screen flow, step dots, a per-card **coaching on / off** control, persistent Back / Continue, and autosave into a real draft card (§5.7), multi-person on step 0.
7. **Card detail:** hero summary + status → **Respond from the heart** buttons when it's a received request (§5.8) → **Given to** / **Celebrated** / gratitude-suggestion when applicable → the four labeled parts (Observation / Feelings / Needs / Requests) → **the history so far** timeline → **entangled with** cards + *View the thread* → the action row (own cards: Share · Edit · Withdraw · Delete; received cards: Share · Delete, with the *Share without a response?* check — §5.6; a draft: **Continue writing** · **Discard** only — §5.7). Undo/Redo in the header.
8. **Respond flow (from a received card):** the buttons of §5.8, each opening a bottom **sheet** — **Heard** (reflection + *Send the reflection* / *Without words*), **I cannot** (need-behind-the-no + *Send* / *Without words*), **Let's explore** (*Compose a new card* / *Link one of my cards* picker) — after which the **Share sheet** opens to send the card back.
9. **Insights:** removed (§5.13); counts live in the Cards Filters sheet.
10. **Thread view:** **Timeline** ↔ **Visualize** toggle — the interleaved card/event stream, or the radial needs-web + "Requests on the table" (§5.11–5.12).
11. **People / Person detail:** **Add** · **Edit** · Undo/Redo in the header, a search field, and per-person summaries and entangled counts (finished cards only) → a person's monogram, summary, entangled count, their **cards together**, and **Rename** · **Remove** (§5.9).
11b. **Restore (`#/restore`):** the Import screen in its restoring frame — what a backup holds, **Open a backup file**, paste below it, the backup preview with counts, and **Restore everything** naming what it would replace (§5.15).
12. **Settings:** **You** (your name, "signs the cards you share as 'from'") · **Coaching** (Standard / off toggle) · **Needs** (*How an area's colour is worked out*: Most unmet · Most common · Average, with the recalculate confirm — §5.16.2; *Your own needs*, a count of what you added; *Hidden needs*, each with **show again** — §5.4) · **Sharing** (preamble on/off, with the preamble text shown) · **Backup** (Back up now · Restore from file · last-backup line · why-it-matters copy · *Backups that keep themselves*: the folder, its on/off, Change folder, Stop, and **Allow again** when the permission has lapsed — §5.15) · **About** (→ Credits, → *The gNVC card format*; caption *"Giraffy {version} · AGPL-3.0 · offline · no accounts · no analytics"*) · **Start over** (the red **Erase all data** button and its two-step flow — §5.15).
13. **About — gratitude & lineage.** A quiet, heartfelt page (the mockup ships this copy verbatim):

    > **With gratitude.**
    > Giraffy exists because of **Marshall B. Rosenberg** (1934–2015), who spent his life developing and teaching Nonviolent Communication — the framework this app walks you through — and shared it in his book *Nonviolent Communication: A Language of Life*. The giraffe was his symbol for this way of speaking: the land animal with the largest heart.
    >
    > Marshall stood in a longer lineage of nonviolence, and so does this app: **Mahatma Gandhi** and the ancient principle of ***ahimsa*** — the commitment to non-harm in thought, word, and action; **Rev. Dr. Martin Luther King Jr.**, who showed that nonviolence is not passivity but a force for justice and connection; and the **Buddha's** teachings on compassion, presence, and the roots of suffering, which echo through NVC's attention to what is alive in us.
    >
    > Giraffy is an independent, free project inspired by their work. It is not affiliated with or endorsed by the Center for Nonviolent Communication. To go deeper — and we hope you do — start with Marshall's book, or cnvc.org.

    Beneath a small-caps *credits* rule: *"Created with ♥ by Rishi Verma. © 2026."* and *"Giraffy is free software, released under the GNU Affero General Public License v3.0. You may use it, study it, share it, and improve it."* — the licence name linking to https://www.gnu.org/licenses/agpl-3.0.html.
14. **Import:** paste-area + format help + three sample loaders; **Preview** → parsed card + green validation line → **Add** / **Merge it in** / **Not now** (§5.10).

Empty states are teaching moments (e.g., the unexamined needs tree, §5.16.4; an empty People search; a filtered Cards list that says what to clear).

**Canvas.** The welcome pages sit on the full Ahimsa *dawn* gradient. The rest of the app carries that warmth in lighter shades: the app canvas is a light dawn gradient (`#fbe5cd → #fdeedb → #fef6ea`, 160°) with sunk wells at `#f9e6d0`; the setup wizard sits one shade deeper (`#f9dcbb → #fbe7cf → #fdf1e0`). Because quiet text would fade on a warm ground, the semantic text tokens are darkened at the app root while keeping Ahimsa's warm grey-brown (`#3d3428`): secondary 76 %, muted 60 %, faint 40 %; rules at 12 % / 25 %. The Ahimsa token files themselves are untouched; these are root-level overrides. Sticky footers use the strong glass overlay with blur rather than restarting the gradient.

---

## 8. Technical architecture

**Current state: an interactive mockup exists** (`mockup/Giraffy.dc.html`), built in a proprietary design-composer runtime purely to prove out flows, copy, and the gNVC format. It is **not** the production stack — it has no persistence, service worker, real file I/O, or schema validation. This section describes the build the developer should produce from it. Requirements here are normative; specific libraries are **recommendations with reasoning** — substitute equivalents that meet the same requirement.

**Design system: Ahimsa** (see the v0.4 note at the top), on the warm canvas of §7. The production app should extract Ahimsa's tokens (colors, type, spacing, radius, shadow, motion — shipped as CSS custom properties in the mockup's `_ds/` folder) and rebuild the components natively in the chosen framework. The visual language, component archetypes, and no-dark-patterns copy rules are already settled; treat them as the design source of truth.

### 8.1 App shell / UI framework

**Requirement:** a small, fast, installable single-page app; bundle < 200 KB gzipped excluding fonts; no runtime network requests (fonts self-hosted, no CDNs, no analytics).

| Option | What it is | Trade-off |
|---|---|---|
| **Svelte (recommended)** | A compiler-based UI framework: components compile to plain, minimal JavaScript at build time, with no framework runtime shipped to the user. | Smallest bundles and very readable component code — ideal for a design-heavy, animation-light app like this. Smaller ecosystem than React, but Giraffy needs almost nothing from an ecosystem. |
| Preact | A 4 KB re-implementation of React's API. | Good if the developer already thinks in React; slightly larger runtime than Svelte's compiled output and JSX tooling required. |
| Lit | Google's thin layer over native Web Components. | Standards-aligned and dependency-light, but templating/state ergonomics are rougher for multi-step wizard flows. |
| Vanilla TS | No framework at all. | Zero dependency risk, but the composer's stateful wizard, list filtering, and diff screens mean hand-rolling reactivity — more code to maintain, not less. |

**Recommendation: Svelte.** It best fits "small, warm, mostly-static screens with one rich wizard," and its compiled output keeps the PWA light.

### 8.2 Local database

**Content security policy.** `index.html` carries a meta CSP whose load-bearing directive is `connect-src 'none'`: the app makes no network request of any kind, and the browser enforces that rather than trusting the code to keep being careful. `script-src 'self'`, `style-src 'self' 'unsafe-inline'` (the app styles elements by attribute), `img-src 'self' data:`, `font-src 'self'`, `base-uri 'none'`, `form-action 'none'`. A static host cannot set headers, so the policy lives in the document.

**Requirement:** embedded, durable, transactional local storage for cards/people/settings/drafts, with versioned schema migrations. In the browser this means **IndexedDB** (the only real embedded database browsers offer; localStorage is too small and non-transactional).

| Option | What it is | Trade-off |
|---|---|---|
| **Dexie.js (recommended)** | A mature, ~25 KB friendly wrapper over IndexedDB: typed tables, promise-based queries, and a clean schema-versioning/migration system. | Raw IndexedDB's API is notoriously awkward (event-based, verbose, easy to get transactions wrong); Dexie removes that risk for minimal size. Widely used, actively maintained. |
| idb | A tiny (~1 KB) promise wrapper over raw IndexedDB by Jake Archibald. | Lighter, but provides no query helpers or migration framework — the app would re-implement what Dexie already provides. |
| Raw IndexedDB | The browser API directly. | No dependency, maximum foot-guns; not worth it. |
| SQLite-WASM | Full SQLite compiled to WebAssembly. | Powerful but heavyweight (~1 MB+) and complicates persistence; overkill for a few thousand cards. |

**Recommendation: Dexie.js.** Its migration system matters most: the schema *will* evolve, and user data must survive every upgrade.

### 8.3 YAML

**Requirement:** parse and emit YAML 1.2, including round-tripping hand-edited files gracefully.

| Option | What it is | Trade-off |
|---|---|---|
| **`yaml` (eemeli/yaml) (recommended)** | A modern, spec-complete YAML library for JS. Supports comment preservation and precise error positions. | Slightly larger than js-yaml, but comment preservation means a hand-annotated file survives an app round-trip, and good error positions power the friendly import-error messages (§5.10). |
| js-yaml | The older, most widely used JS YAML library. | Smaller and battle-tested, but discards comments and has coarser error reporting. |

**Recommendation: `yaml` (eemeli/yaml).** The format is the product's public face; respecting hand-authors' comments is worth the kilobytes.

### 8.4 Service worker / PWA plumbing

**Requirement:** precached app shell; 100% offline; versioned cache-busting; "update available" toast; `manifest.webmanifest` with `display: standalone`, maskable icons, light/dark theme colors; `file_handlers` for `.yaml/.yml`; `share_target` (Android); `launch_handler` focus-existing. Installability verified on iOS Safari (A2HS), Android Chrome, desktop Chrome/Edge; graceful fallbacks where APIs are absent (Web Share → copy-to-clipboard everywhere).

| Option | What it is | Trade-off |
|---|---|---|
| **Workbox (recommended, build-time only)** | Google's service-worker toolkit; its build step generates a precache manifest with content hashes. | Hand-rolled SWs are where PWAs quietly break (stale caches, half-updated shells). Workbox's precache/route logic is boring and proven. Used only at build time — it adds no runtime network dependency. |
| Hand-rolled SW | ~150 lines of custom service worker. | Fully understandable, but the team owns every cache-invalidation edge case forever. Acceptable if the developer strongly prefers it and writes tests for update flows. |

**Recommendation: Workbox** for the service worker; everything else in this section is plain platform code with no library needed.

### 8.5 Supporting pieces

- **IDs:** `crypto.randomUUID()` — built into all modern browsers; no library.
- **Import & hand-edit validation:** **Ajv** (the standard JSON-Schema validator for JS) running the published `gnvc-card.schema.json` — the same schema that lives at the permanent spec URL (§6.5), so the app, hand-editors' IDEs, and any third-party implementation validate against one source of truth.
- **Coaching engine:** no library — a small data-driven module reading `coaching-rules.yaml`, with unit tests per rule.
- **Testing:** **Vitest** for unit tests (fast, first-class with Svelte/Vite) on the three correctness-critical cores — coaching rules, merge/lineage semantics, YAML round-tripping — and **Playwright** for one happy-path E2E (compose → export → import into a second profile → respond → re-import). Playwright is recommended because it drives real Chromium/WebKit, which is the only way to genuinely test service-worker and file-handling behavior.
- **Build:** **Vite** — the default modern bundler, pairs natively with Svelte and Workbox, produces hashed assets for the SW precache.

### 8.6 Hosting & openness

- Any static host over HTTPS (required for service workers/installability). Target: **giraffy.riverma.com** (CNAME on the existing riverma.com Route 53 zone; GitHub Pages or Codeberg Pages both fit existing practice). Note the §5.12 caveat: once users exist, the domain should be treated as permanent — a domain move orphans every install's local data.
- **License & openness:** the app and this specification are released under the **GNU Affero General Public License v3.0** (AGPL-3.0-or-later) — the About page says so and links to it. Because "the file is the protocol" only pays off if others can implement it, the gNVC **format description, JSON Schema and hand-author templates** are additionally published under **CC0 1.0** at the permanent URL (§6.5), so any implementation — open or not — may read and write cards without licence friction.

**Explicit non-requirements:** no backend, no push notifications, no accounts, no real-time sync, no E2E-encryption layer (transport security is delegated to whatever messenger carries the file).

---

## 9. Non-functional requirements

- **Accessibility:** WCAG 2.1 AA. Full keyboard operability; visible focus; feelings/needs pickers navigable by screen reader (chips as toggle buttons with state); paragraph text at least 16px; respects `prefers-reduced-motion` and `prefers-color-scheme`.
- **Tone:** all microcopy in the warm, non-clinical register modeled in this spec. **App copy uses no em dashes** (this document does; the app restructures the sentence or uses a comma, a middle dot, or a colon). Gratitude examples are always positive. A single `strings` file so the writer/designer can tune every word. Structure copy for future i18n (the feelings/needs vocabularies are the hard part of localization — design the data files with locale variants in mind; alphabetization is per-locale).
- **Performance:** first load < 3s on a mid-range phone over 3G; instant (< 100ms) step transitions in the composer; lists virtualized past ~200 cards.
- **Privacy:** no telemetry of any kind. The privacy story is a marketing feature — say it plainly on the About screen.
- **Content sensitivity:** the app may hold emotionally raw material. No previews in OS-level notifications (we have none), and consider an optional app-open PIN as future work (§10).

---

## 10. Out of scope for v1 (parking lot)

- Multi-party (3+) thread **UI** — the data model and format already support it (§5.11); the needs web and thread views grow columns/participants in a later release.
- QR-code hand-off of cards (nice offline-to-offline share path — good v1.1 candidate).
- Optional PIN/biometric lock.
- Guided *empathy mode* (receiving someone's raw non-NVC message and translating it into observation/feelings/needs — a beloved NVC practice and a natural v2 feature).
- Journaling/streaks/reflection prompts.
- Localization beyond English.
- LLM-assisted coaching (the keyword layer is deliberately deterministic and offline in v1).
- **Exchanging needs inventories** — two people share a snapshot of their tiers so the needs web shows both sides. Needs a second document kind, which v1 deliberately avoids (one card, one file).
- A per-need **tier timeline** (quiet text, never a chart) built from `NeedTierEvent` history (§5.16.1).

---

## 11. Decisions & remaining open questions

**Resolved:**

| Question | Decision |
|---|---|
| Name & design | **Giraffy** — giraffe icon; built on the **Ahimsa** design system (warm cream, Fraunces serif, no dark patterns; accents saffron/turmeric/clay/bodhi/peacock/indigo/monsoon). App says "inspired by Nonviolent Communication," cites Rosenberg, does not imply CNVC endorsement. |
| Coaching default | **Standard**, with an off toggle (Settings) and a per-composer **quiet** toggle. |
| Needs web | **Radial**, as built (central theme node, radial need pills, dashed connectors, "Requests on the table" list) using web components, not SVG. Two-column is **deferred**, not chosen — a latent `columns \| radial` switch remains for a future prototype (§5.12). |
| Home screen | **Needs** — the app opens on the needs tree (§5.16); Cards, People, Settings follow. *(v0.5)* Insights is gone altogether; its counts live in the Cards Filters sheet (§5.13). *(v0.6)* |
| Needs tiers | Three self-reported tiers, *met · partly · unmet*, plus **unexamined**. Coloured with the **Ahimsa accents — bodhi / turmeric / clay** — never traffic-light red / yellow / green; dots, never emoji; no overall verdict. Category tier is the user's felt override (which sticks) over a derived default computed by the method chosen in Settings: Most unmet · Most common (default) · Average (§5.16.2). *(v0.5, revised v0.6)* |
| Cards filters & sort | One filter at a time; common ones inline, all of them (with counts) in a Filters sheet behind a pinned *More filters* pill; a Sort sheet with seven orders (§5.7). No dashboard. *(v0.6)* |
| Multi-person cards | Choosing several people writes one card per person, same words (§5.1). *(v0.6)* |
| Backup scope | The whole app state in one YAML stream (header document + cards); restore replaces exactly and is undoable (§5.15). *(v0.6)* |
| Erase all data | A red button in Settings, asked twice, with *Back up first* on the second sheet; the one action undo does not cover (§5.15). *(v0.6)* |
| Licence | App + spec **AGPL-3.0-or-later**; gNVC format, schema and templates also **CC0** (§8.6). Credit line *"Created with ♥ by Rishi Verma. © 2026."* on the About page. *(v0.6)* |
| Canvas | Light dawn gradient throughout, wizard one shade deeper, quiet text darkened at the root (§7). *(v0.6)* |
| Who might help | Per need, a list with **Myself pinned first**, then people; may exist before any card; each row opens the composer pre-filled (§5.16.5). *(v0.5)* |
| Needs vocabulary | The fuller CNVC-style inventory of §5.4, **Honesty kept** as one of the seven categories; a word under several categories is a distinct leaf per category. *(v0.5)* |
| Format impact of the tree | **None.** Tiers, intentions and notes are app-only and travel in backups under `x-private:`; exported `needs:` stay plain strings (§5.16.1, §6.4). *(v0.5)* |
| Undo / redo | **Added** — app-wide session undo/redo + a tap-to-return history sheet; destructive actions are reversible and say so (§5.14). |
| Share preamble | Drafted in §5.10, includes https://giraffy.riverma.com; removable per share, toggleable in Settings. |
| Summary vs. structured fields | In-app manual edits are **immediately reflected** and re-run through coaching; when both diverge, the app shows both and asks (§5.1 Step 5). |
| Gratitude reply loop | **Yes** — `given` and `celebrated` gently suggest sending a gratitude card back (§5.8). |
| Response options | Grounded in Rosenberg's receiving teaching (§2): **Heard** (`heard`, non-final), **I'd love to** (`yes`), **Let's explore** (`maybe`), **I cannot** (`no`) — in that on-screen order — plus **Given to** (`given`) and **Celebrated** (`celebrated`, gratitude only). Each opens a bottom sheet; the Share sheet follows. Explicit decline kept, expressed as the need behind the no. **Withdrawn** is a sender-side action (§5.8). |
| Response & entanglement format | No second file format. Plain answers = the card shared back with extended `status_history` (§6.2). Entanglement = a **plain `id` pointer** in `entangled_with`, carrying no state lineage; apps form the reciprocal link on import (§6.3). *(Changed from v0.3's per-link `states:` design.)* |
| Format identity & openness | **gNVC 1.0**; `gnvc:` version key; `.gnvc.yaml` extension; JSON Schema validating the YAML; permanent spec URL via w3id.org; SchemaStore registration for free editor validation; every card cites the spec URL (§6.5). |

**Still open for the next iteration:**

1. **Trademark sanity check** on "Giraffy" (quick search before the name ships).
2. **Exact reminder cadence** for backups (§5.15 — tune with real use).
3. **Two-column needs-web** — worth prototyping as an alternate mode to radial, or leave radial as the sole view? (Deferred, not urgent — §5.12.)
4. **Hand-author response walkthrough:** the spec site should include a copy-paste guide for replying without the app (add a `status_history` entry to the received card, or write your own card with an `entangled_with` pointer). Confirm it ships with the v1 spec page. (Recommended: yes.)
5. **w3id.org registration** is prepared on a fork of the w3id repository (branch `add-gnvc`, identifier `/gnvc/`) and is deliberately unfiled, pending review.
6. **Version string** — the production app displays its release version (semver, from `package.json`) in the Settings caption; the mockup's "0.5" is frozen with the mockup.
7. ~~**Category tier default**~~ — resolved: the user picks the method in Settings (Most unmet · Most common · Average), *Most common* by default (§5.16.2).
8. ~~**Mockup catch-up**~~ — done, and the mockup was **signed off on 2026-09-07** after rounds r2–r10. It is frozen; the build (§8, Appendix B) is now the moving part.

---

## Appendix A — Coaching rule data (starter set)

Shipped as `coaching-rules.yaml`; excerpt showing the shape:

```yaml
step: feelings
rules:
  - id: faux-feeling-ignored
    match: ["ignored"]
    message: "'Ignored' describes what you think someone did. Underneath it, what's the feeling?"
    suggest: [hurt, lonely, sad]
  - id: you-in-feelings
    match_regex: "\\byou\\b"
    message: "This step is only about what's alive in you."
```

## Appendix B — Deliverables checklist for the build

*(The mockup already realizes the UI/UX and copy for most of these; the work is to rebuild them on the production stack with real persistence, validation, and PWA plumbing. Extract Ahimsa tokens/components from the design system the mockup was built against.)*

- [ ] PWA shell (manifest, SW, offline, installable, `file_handlers`/`share_target`)
- [ ] Guided composer (5 steps + gratitude variant, quiet toggle) with autosaving drafts
- [ ] Coaching engine + starter rule set (§5.2 / Appendix A) + unit tests
- [ ] Feelings & needs vocabulary data files (alphabetized; needs per §5.4 incl. Honesty, category-scoped leaves) + two-level picker UI
- [ ] **Needs home (§5.16):** inventory tables + migration, tree with filters, legend, + / − sections, sticking category override and the derived-method setting with its confirm, inline card-count and entangled glyphs, Need detail (Myself-first who-might-help, Write-a-card launch), Check-in / setup wizard (legend, page counter, Skip to end, Summary, leave-setup confirm), Ahimsa tier tints, string→need linking on import
- [ ] Card model, Cards tab (Mine/Received + Import), search, Sort sheet, inline filters + pinned *More filters* → Filters sheet with counts, By person, ⊕ sheet (write / resume / import)
- [ ] Lifecycle states + heart-honest response **sheets** (Heard · I'd love to · Let's explore · I cannot · Given to · Celebrated · link-existing-card picker) → Share sheet
- [ ] gNVC export (share sheet / copy / download) & import (paste / file / handlers): preview, Ajv schema validation, merge-by-id, reciprocal-link resolution
- [ ] Thread view (Timeline + radial Visualize, owner pills tinted by tier)
- [ ] **Undo / redo + session-history sheet** with the revert confirm (app-wide)
- [ ] Whole-state backup / restore (header document + cards, exact replace, undoable) + gentle periodic backup reminder + **Erase all data** (two sheets, backup offered)
- [ ] gNVC spec page + JSON Schema + hand-author templates (CC0); w3id.org permanent URL; SchemaStore registration
- [ ] Onboarding (4 pages: welcome with giraffe mark, A few concepts with four illustrations, name, every feeling points to a need) + Settings (incl. Needs method, Start over) + About (gratitude & lineage, credit line, AGPL link) + NVC primer
- [ ] Warm canvas (§7): root-level gradient + text-token overrides over untouched Ahimsa tokens; self-hosted Fraunces + DM Sans
- [ ] `LICENSE` (AGPL-3.0-or-later), `spec/LICENSE` (CC0), no em dashes in `strings`
