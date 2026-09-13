# Changelog

Notable changes to Giraffy. The format follows [Keep a Changelog](https://keepachangelog.com),
and versions follow [Semantic Versioning](https://semver.org).

## [1.1.0] - 2026-09-12

### Added

- **A content security policy that forbids Giraffy from connecting anywhere.** The app has
  never made a network request; now the browser enforces it, so no future change or injected
  code can send a card off the device.
- **Backups that keep themselves.** Setup now ends by asking where a copy should live. On a
  browser that can write to a folder (Chrome or Edge on a desktop), choosing one is all it
  takes: Giraffy rewrites `giraffy-backup.gnvc.yaml` there about a minute after your changes
  settle, and again when you close the app. A backup you take by hand keeps its dated name
  and sits beside that file rather than replacing it. Settings shows the folder, turns the
  automatic writes on and off, changes the folder, or stops. If the browser forgets its
  permission, which happens when it restarts, backups say **paused** and one tap resumes
  them. No phone browser can write to a folder on its own, and Giraffy says so plainly there
  rather than pretending: a backup on a phone stays one tap.
- **Drafts.** A card you are writing is now a card in its own right, kept with status
  *draft*: it waits in the Cards tab under **Drafts**, in the + button, and in your backups,
  and you can have as many as you like. Tapping one carries on writing it, on the step you
  left it on. Closing the composer keeps the words; opening it and closing again without
  writing anything leaves nothing behind, not even an undo step. Card detail for a draft
  offers **Continue writing** and **Discard**; a half-written card cannot be shared.
  Finishing a draft turns that same card into the finished one.
- **People you can add, rename and remove.** The People tab has **Add** and **Edit**, and
  the + button offers *Add a person*, so someone can be named before there is any card.
  Renaming a person renames them on their cards. Removing one takes their name out of your
  people and off any need you named them on, and keeps every card you wrote with them.
- **Needs and areas of your own.** From the Needs tab in Edit mode, from the + button, or
  from the composer when you type a word that is not in the list, you can add a need of your
  own under any area, and add areas of your own. They sit in among the shipped needs and can
  be marked, noted and written about like any other.
- **Hiding needs you do not use.** A shipped need can be hidden rather than removed: it
  leaves your list, your check-ins and the composer, while how it felt, its note and anyone
  you named on it are kept. Settings lists everything hidden, with one tap to show it again.
- **A need can be thanked for, not only asked about.** Each person on a need now offers both
  **Request** and **Gratitude**, the same choice the + button gives, with the need already
  filled in.
- **What each need means.** Every need carries a one-line explanation in the context of its
  area. It shows on the need's screen, as a second line in the needs list, and on a
  dedicated line when you tap a need during a check-in or in the composer.
- **How long a pass takes.** Onboarding, the check-in intro, and the first-run nudge all say
  a full pass is about 20 minutes and can be done a page at a time or later.
- **The introduction, whenever you want it.** Settings → How Giraffy works replays the four
  concepts without re-running setup.

### Changed

- **Restoring a backup is its own screen, and talks about the whole app.** Settings now says
  *Restore from a backup* and opens a screen that leads with what a backup is, offers **Open a
  backup file** first, explains the file rather than the card format, and names what is here
  now that restoring would replace. The preview counts drafts and any needs and areas of your
  own. Importing a single card is unchanged, on its own screen, with its own samples.
- **The backup reminder stays away when a folder is keeping itself up to date.** It was
  nagging about something already done.
- **The + button does more, and says what is waiting.** It lists your recent drafts and
  offers *Write a new card*, *Add a person*, *Add a need* and *Import a card*, instead of
  either a new card or a single draft to resume.
- **The Mine count is finished cards.** Drafts have their own section and their own filter.
- **Closing an edit sets the changes aside** rather than keeping them as a draft. The card
  stays as it was.
- **Backups say what they hold**, now including needs and areas of your own, which needs are
  hidden, and your drafts.
- **The composer's coaching control says what it does.** It read "quiet", which named the
  effect rather than the thing it controlled. It now reads **coaching on** / **coaching
  off**, says what changed in a toast, and is hidden when coaching is already off in
  Settings.
- **A need asks "Who to reach out to"**, not "Who might help meet this", now that a need can
  be thanked for as well as asked about.
- **The needs vocabulary is settled: 110 needs became 103, and every word now belongs to
  exactly one area.** Words that said the same thing twice were folded into one need
  (the three `self-expression` leaves, `presence`, `self-care`, `stimulation`, `space`,
  `awareness`/`consciousness`, `movement`/`progress`, `integration`/`integrity`). Others
  were renamed to say what they actually meant where they sat: Connection's `integrity`
  became `alignment`, its `presence` became `attentiveness`, its `authenticity` became
  `vulnerability`, `respect / self-respect` became `respect`; Meaning's `consciousness`
  became `intentional`, its `integrity` became `wholeness`, its `understanding` became
  `insight`; Peace's `acceptance` became `contentment` and its `communion` became
  `transcendence`. Connection gained `resonance`, Honesty gained `awareness`,
  `self-acceptance` and `self-connection`, and Peace gained `present`.
  Needs you have already marked, the people you named on them, your private notes, and your
  cards' links are all carried across on first open; when two needs became one, the later
  mark wins and both notes are kept. Within each area the needs are alphabetical, so nothing
  in the order implies a preference between one need and another.
- **Wider windows get a wider app.** The frame steps up to 720px and then 900px, filter rows
  wrap instead of scrolling, and card, people, and need lists use two columns when there is
  room. Still mobile first, no longer mobile only.
- **Copy says "device", not "phone".** Giraffy runs on desktops and tablets too.
- **The Check in button carries a check mark**, in the text colour, rather than a saffron
  dot. Dots mean how a need feels, and that meaning should not be borrowed.
- **Onboarding calls it a check-in**, the same word the rest of the app uses.

### Fixed

- **A card file could quietly stop Giraffy saving.** A need id, or a need word, that happens
  to name something every JavaScript object carries ("constructor", "toString") came back
  from the lookup as a function rather than as nothing. That function reached the database,
  which refused it, and every save after that failed silently: the session's work was lost on
  reload. Reachable from a backup someone sent you, and also by simply typing "constructor"
  as a need of your own. Every keyed lookup in the app now answers for its own keys only.
- **A malformed link no longer stops the app from starting.** A link truncated in a chat app
  (`#/card/%`) threw while the address was being read, before anything had loaded, leaving a
  blank page with no way out.
- **The paste area no longer flattens** to a single line once a preview appears below it, and
  neither does a need's private note.
- **Undo worked everywhere except the browser.** A snapshot read back out of the session
  history came wrapped in a reactive proxy, which cannot be cloned, so every Undo, Redo and
  *go back to this point* threw and nothing happened. Now they do what they say.
- Onboarding can be walked backwards, page by page, with Back or by tapping a dot.

## [1.0.0] - 2026-09-07

The first release. Giraffy is a complete, offline Nonviolent Communication companion.

### Added

- **Needs.** Every need from the NVC vocabulary, grouped into seven areas, each markable
  met, partly met, or unmet. An area takes its colour from the needs inside it, by most
  unmet, most common, or average, and you can override any area by hand.
- **Check-in.** A quiet pass through the needs, one area per page, with a summary at the end.
- **Cards.** The four-part composer (observation, feelings, needs, request), with a gratitude
  variant, coaching nudges you can dismiss or switch off, a feelings and needs picker, and a
  final step where your words are assembled into one sentence you can edit.
- **Sharing.** Cards leave as `.gnvc.yaml` files through the system share sheet, the
  clipboard, or a download, with an optional one-line preamble.
- **Responses.** Heard, I'd love to, let's explore, I cannot, given, and celebrated, each
  recorded in the card's history.
- **Entangled needs.** Cards can be linked when two people's needs depend on each other,
  and a thread shows the exchange as a timeline or a web of needs.
- **Import.** Paste or open a card, see exactly what applying it would do, then decide.
  Replies merge into the card they belong to without overwriting anything you wrote.
- **Backup and restore.** One file holds your name, settings, people, needs, and every card.
- **Undo.** Every change is undoable, with redo and a session history you can jump back into.
- **Offline.** A hand-rolled service worker precaches the whole app; it runs with the radio
  off, including a cold start. Fonts are self-hosted; nothing is ever fetched.
- **The gNVC format.** A published JSON Schema, a compiled validator, and CC0 templates, so
  anything can read or write cards.
