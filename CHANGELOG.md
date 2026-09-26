# Changelog

Notable changes to Giraffy. The format follows [Keep a Changelog](https://keepachangelog.com),
and versions follow [Semantic Versioning](https://semver.org).

## [1.5.0] - 2026-09-25

### Added

- **The last step says who the card is for**, and lets you add or remove people there. Writing
  for several people still writes one card each. A compose started from a person or a need
  skips the first step, so this is often the only place the choice appears.

### Fixed

- **Cards to yourself belonged to nobody.** They appeared on no People row and on no person's
  screen. The composer writes your own name into a card to yourself, while seeded and imported
  cards say "Myself", and neither matched the Myself row. Both are understood now. The same
  fault made the Cards tab's person filter return nothing for Myself, and under-reported how
  many cards removing a person would affect.
- **Drafts never reached the People tab.** A draft now appears under the person it is for, in
  its own section on their screen and counted separately in their row, so an unsent card is
  never described as an open request with them.
- **A draft to a new name created nobody**, so it had no row to appear under. Naming someone in
  a draft adds them straight away. The name is taken when it is chosen rather than as it is
  typed, so "Wren" makes one person and not four.

### Changed

- **Editing a card no longer offers a person picker.** It only ever saved one card and silently
  dropped any others, and it could repoint a card the other person had already answered.
  Changing a recipient is *Change who it is for*, which has the rules for that.

## [1.4.0] - 2026-09-22

### Added

- **See the card before it is finished.** A *See it so far* button on every step of the
  composer shows the assembled sentence at any point, with the parts still to write named
  underneath. Finishing still asks for all four.
- **Send a draft at any stage.** Share a half-written card so someone can read it, add what
  you are missing, and send it back. It stays a draft on both sides, and their additions merge
  into your card with both passes kept in its history.
- **A filter for imagined cards**, in the Cards tab and the filter sheet, once you have one.

### Fixed

- A card written in someone else's voice no longer shows the need colours from *your* last
  check-in. Their needs start unexamined, as they should.
- A draft someone shares with you is no longer labelled as your guess about them. The two are
  told apart by who actually wrote the draft down, which the card has always recorded.
- Updating now waits for the new version to take over rather than reloading after a fixed
  fifth of a second, which could land back on the old one.

### Changed

- Settings can **check for an update** and apply it, rather than only finding out when Giraffy
  next happens to look.
- **The gNVC format now has a home of its own** at
  [riverma.com/gnvc](https://riverma.com/gnvc/), from the repository
  [riverma/gnvc](https://github.com/riverma/gnvc), under CC0. Giraffy is one client of the
  format rather than its owner. The links in Settings and Import point there; the permanent
  identifier each card carries is unchanged.

## [1.3.1] - 2026-09-21

### Fixed

- **Blank screen after an update, in Safari.** Asset filenames carried a content hash and
  each deploy deleted the previous ones. GitHub Pages serves `index.html` with a ten minute
  cache and no way to override it, so a browser could still be running the previous page and
  asking for a file that had just been removed: a 404, and nothing rendered. Asset names are
  stable now, so a page from the last deploy always finds what it asks for.
- If the app cannot start for any reason, the page now explains that and says your cards are
  untouched, instead of showing nothing at all.

## [1.3.0] - 2026-09-21

### Added

- **Imagine their card** — write a first guess at what someone else might be feeling and
  needing, in their voice, addressed to you. Stays a draft until you send it; only they can
  finish it. Start from the + sheet, a person's screen, or a need's screen.
- Sending a guess hands it to them as their own draft, pre-filled. When they finish it and
  send it back, it merges into the same card and your guess stays in its history alongside
  their reply.
- Importing a draft under a name close to yours offers to claim it as your own.

## [1.2.3] - 2026-09-17

### Fixed

- **A shared card could not be pasted into another Giraffy.** The note that introduces a card
  to whoever receives it was pasted above the card itself, and it is prose, not part of the
  format, so the app at the other end refused the whole thing. What gets copied, saved and
  sent is now the card and nothing else. The note travels beside it: it goes into the system
  share sheet alongside the file, and the share screen offers it separately to send in your
  own words. The setting that controls it is unchanged and still on by default.
- **A card that arrives with something above it is read anyway.** Every card shared by an
  earlier version carries that note inside it, and those will keep arriving for a long time.
  Anything above the card is now set aside rather than refused, which also rescues a paste
  that picked up a chat app's quoting header. Only after a straight read has already failed,
  so nothing that used to work reads differently.

### Changed

- **Saving a card as a file says so.** The actions are *Send the file*, *Save the file* and
  *Copy as text*. Where the browser can ask where a file should go, it asks, rather than
  dropping it wherever downloads land. *Send the file* only appears where the device has a
  share sheet to send it to.

## [1.2.2] - 2026-09-14

### Fixed

- **A second go at the needs list not scrolling with every area collapsed.** 1.2.1 made the
  bottom bar measure itself, which is right, but the room it asks for was still reserved as
  padding under the list, and the end padding of a scrolling flex container is not something
  every engine agrees to scroll to. Where it is dropped, the reservation is invisible to the
  browser and the last area stays under the bar with nothing to scroll. That room is now a
  block at the end of the list instead. A block is content, and every engine scrolls to the
  end of its content, so this no longer rests on a detail the specification leaves loose.
  The default, used before the bar has measured itself, is also more generous than the bar
  has ever needed.
- **Dropped `-webkit-overflow-scrolling: touch`**, removed from iOS in version 13 and a route
  into the old scrolling path on anything older.

## [1.2.1] - 2026-09-14

### Fixed

- **The needs list would not scroll with every area collapsed**, because the bottom bar was
  covering the last area and there was nothing left to scroll to lift it clear. Every list
  reserves room at its foot for that bar, and the amount reserved was a guessed number that
  happened to be about twenty pixels more than the bar needed. On a device where the bar
  comes out even slightly taller, the last row sits underneath it, unreachable, and a swipe
  does nothing because there is nothing to scroll. The bar now measures itself and the lists
  reserve what it actually takes, plus room to breathe, so this cannot come down to a guess
  about a particular device again.

## [1.2.0] - 2026-09-14

### Added

- **Change who a card is for.** A card you wrote carries *Change who it is for* beside Share
  and Edit. Pick anyone already in your people, or type a name that is not there yet and they
  are added. The card itself does not move a word. A card you had already shared goes back to
  ready to share, with a line in its history saying who it used to be for, because the person
  it is for now has not seen it. A card the other person has already answered is left alone:
  that exchange is theirs.
- **Rename someone from the People tab.** Edit now offers *Rename* as well as *Remove* on
  every row, which is where a wrong name is usually noticed. It was previously only on the
  person's own screen. Renaming still rewrites the name on their cards, and is still one step
  in the undo history.

### Fixed

- **The Needs tab would not scroll on a phone.** Cycling how a need feels is two quick taps
  on one small dot, and iOS reads two quick taps as a request to zoom. Once the page is
  zoomed, an app pinned in place with `position: fixed` cannot be scrolled at all, which is
  exactly what a broken scroll feels like. Every control now opts out of that gesture, which
  also means taps register on the first try rather than after the browser has waited to see
  whether a second one is coming. Pinch to zoom is untouched.
- **Scroll regions are explicitly allowed to be shorter than their contents.** The list area
  of every screen carries `min-height: 0`, the guarantee WebKit wants before it will let a
  flex child scroll, and the rows above it can no longer be squeezed.

## [1.1.2] - 2026-09-14

### Changed

- **The version Giraffy is running sits at the very bottom of Settings**, where a version
  number is looked for, rather than halfway up under About. Useful when reporting something,
  and for telling at a glance whether an update has landed.

## [1.1.1] - 2026-09-13

### Fixed

- **Marking a need did nothing on screen.** From the second launch onwards, tapping a need's
  dot, or a met / partly / unmet button on the need itself, changed the stored value and left
  the colour where it was. The list of how each need feels was rebuilt, on load, as an object
  with no prototype, and Svelte does not watch one of those: the app had stopped being told
  its own data had changed. It is an ordinary object again, with the check that made it
  prototype-less done where the value is read instead. Every need marked while this was
  broken was saved correctly and shows its real colour now.

### Added

- **A new version says so.** When a new version has downloaded, a quiet bar offers to reload
  into it, instead of waiting for every window of the app to be closed first. On a phone that
  had meant knowing to swipe the app away and open it twice.

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
