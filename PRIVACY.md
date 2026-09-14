# Privacy

Giraffy collects nothing.

There is no account, no sign-in, and no server. The app is a static site: once it has
loaded, it never contacts anything again. There is no analytics, no telemetry, no crash
reporting, no cookies, and no third-party code of any kind.

## What is stored, and where

Everything you write stays in your browser's storage on this device:

- your name and settings
- the needs you have marked, and any private notes on them
- the people you have named
- every card, including drafts

Giraffy asks the browser to keep this data persistently. Nothing leaves the device unless
you choose to share it.

## Sharing a card

When you share a card, Giraffy produces a `.gnvc.yaml` file or a block of text and hands it
to your system share sheet, your clipboard, or your downloads folder. From that moment the
delivery is entirely up to the app you chose, exactly as with any other file. Private
notes on needs are never included in a shared card.

## Backups

A backup is a file you save yourself. It contains everything the app holds. Keep it
somewhere you trust; anyone who can read it can read your cards.

## Removing your data

Settings → Erase all data removes every card, need, person, and setting from the device and
returns Giraffy to its first screen. It asks twice and offers a backup first. There is no
copy anywhere else to delete.

## Hosting

giraffy.riverma.com is served by GitHub Pages, which, like any web host, sees the requests
that fetch the app itself. After the first load the app runs from its own cache and makes no
further requests. Giraffy sets no cookies and passes nothing to the host.
