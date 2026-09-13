// The words the app says from code rather than from a template: toasts, undo-history
// labels, confirm bodies, and the notes it writes into a card's history.
// Screen copy lives inline in its own component, next to the markup it belongs to.
// No em dashes in app copy (spec §9).

export const S = {
  tabs: { needs: 'Needs', cards: 'Cards', new: 'New card', people: 'People', settings: 'Settings' },

  common: { undo: 'Undo', redo: 'Redo', history: 'History', close: 'Close' },

  need: {
    named: 'Named someone on a need',
    cleared: (name: string) => 'Removed ' + name + ' from a need',
    added: (area: string) => 'Added. It sits under ' + area + ' now.',
    removed: 'Removed. Cards that used it keep the word. You can undo this.',
    hidden: 'Hidden. Everything you marked on it is kept, and Settings can show it again.',
    showed: 'Back in your list.',
    areaAdded: (name: string) => 'Added. ' + name + ' sits after the seven.',
    areaRemoved: 'Removed, with the needs that sat under it. You can undo this.',
    recordAdded: 'Added a need', recordRemoved: 'Removed a need',
    recordHid: 'Hid a need', recordShowed: 'Showed a need again',
    recordAreaAdded: 'Added an area', recordAreaRemoved: 'Removed an area'
  },

  people: {
    added: (name: string) => name + ' is in your people now.',
    exists: 'Already in your people.',
    isYou: 'That is you already. Cards to yourself go to Myself.',
    removed: 'Removed from your people. Your cards with them are untouched. You can undo this.',
    renamed: 'Renamed, on their cards too.',
    recordAdded: 'Added a person', recordRemoved: 'Removed a person', recordRenamed: 'Renamed a person'
  },

  backup: {
    chosen: (folder: string) => 'Backups go to ' + folder + ' from now on, and keep themselves up to date.',
    savedTo: (folder: string, name: string) => 'Saved to ' + folder + ' as ' + name + '.',
    resumed: 'Backups are running again.',
    paused: 'Backups are paused: the browser needs your permission again. Settings can give it.',
    notAllowed: 'Without permission to write there, Giraffy cannot keep the copy up to date.',
    stopped: 'Backups stopped. The files already in the folder stay where they are.'
  },

  cards: {
    backupSaved: 'Backup saved: your name, settings, people, needs, any needs and areas of your own, drafts, and every card.'
  },

  detail: {
    toasts: {
      yes: 'A yes from the heart. Share it back.',
      given: 'Given from the heart.',
      celebrated: 'Received with joy.',
      heard: 'Held with care. No answer owed yet.',
      no: 'An honest no, with its need visible.',
      withdrawn: 'Withdrawn. It is off the table, and no further actions can be taken on it. You can undo this.',
      deleted: 'Deleted from this device. Files already shared stay with others. You can undo this.',
      linked: 'Linked. Your existing card carries the response.'
    },
    records: {
      withdrew: 'Withdrew a card', deleted: 'Deleted a card', linked: 'Linked two cards',
      heard: 'Marked heard', yes: 'Marked yes', no: 'Marked no',
      given: 'Marked given', celebrated: 'Marked celebrated', shared: 'Marked shared'
    }
  },

  share: {
    // The line that travels with a shared card, so whoever receives it knows what it is.
    preambleText: 'I took some time to put this into words with care, using Giraffy. You can simply read it below, or open it at https://giraffy.riverma.com to reply from the heart.',
    copied: 'Copied. Paste it into any chat.',
    shared: 'Handed to the share sheet.',
    shareFailed: 'Sharing was not available here, so the card was copied instead. Paste it into any chat.',
    downloaded: 'Saved as a file.'
  },

  heard: {
    reflection: (feelings: string, needs: string) => "It sounds like you're feeling " + feelings + ' because you need ' + needs + '.'
  },

  explore: {
    linkNote: 'A card I already carry holds the entangled need.',
    composeNote: 'A need of mine is entangled here. My card carries it.'
  },

  newSheet: { resumed: 'Draft resumed. Nothing was lost.' },

  composer: {
    coachingOff: 'Coaching off for this card. Giraffy will not comment on your words.',
    coachingOn: 'Coaching on for this card. Nudges are suggestions, never blocks.',
    draftSaved: 'Draft saved. It is in Cards, under Drafts, whenever you want it.',
    draftDiscarded: 'Draft discarded. You can undo this.',
    editDropped: 'Changes set aside. The card is as it was.',
    finishFirst: 'Finish the draft first, then share it.',
    updated: 'Your card is updated.',
    savedLinked: 'Linked. Your card carries the response.',
    savedMany: (n: number, names: string) => n + ' cards saved, one each for ' + names + '. Showing the first.',
    saved: 'Saved. Ready when you are.',
    recordNew: 'Wrote a new card', recordEdit: 'Edited a card',
    recordStarted: 'Started a draft', recordDiscarded: 'Discarded a draft'
  },

  settings: {
    recalculated: 'Areas recalculated. You can undo this.',
    recordRecalc: 'Recalculated areas'
  },

  erase: {
    title1: 'Erase everything on this device?',
    body1: 'This removes every card, every need you have marked, every person, and your settings. Giraffy goes back to its very first screen, as if just installed.',
    title2: 'One last check',
    body2: 'There is no undo, and no server copy to recover from. If any of this might matter later, save a backup first. It takes a moment and stays on your device.',
    backupSaved: 'Backup saved. Erase whenever you are ready.',
    done: 'Everything erased. Giraffy is as new.'
  },

  confirm: {
    revert: {
      title: 'Go back to this point?', proceed: 'Go back', cancel: 'Stay here',
      body: (label: string, n: number, when: string, after: number) =>
        'Everything returns to how it was just before "' + label + '" (step #' + n + ', ' + when + '). The ' + after + (after === 1 ? ' step' : ' steps') + ' after it move to redo, so you can come forward again.'
    },
    delete: {
      title: 'Delete this card?', proceed: 'Delete it', cancel: 'Keep it',
      body: (mine: boolean, from: string) =>
        'It will be removed from this device. ' + (mine ? 'Anything you already shared stays with the person you sent it to. ' : (from || 'The sender') + ' still has their copy. ') + 'You can undo this for the rest of this session.'
    },
    withdraw: {
      title: 'Withdraw this card?', proceed: 'Withdraw it', cancel: 'Leave it up',
      body: 'It stays in your history, marked withdrawn, and you can share the change so they know where things landed. You can undo this.'
    },
    derived: {
      title: 'Recalculate every area?', proceed: 'Recalculate', cancel: 'Keep mine',
      body: (felt: number) =>
        (felt ? 'Areas you set by hand (' + felt + ') will be replaced by the new calculation. ' : 'Every area will be recoloured by the new calculation. ') + 'Your needs themselves are not touched. You can undo this.'
    },
    leaveSetup: {
      title: 'Finish setup and write a card?', proceed: 'Write the card', cancel: 'Stay here',
      body: (word: string) => 'Everything you tapped is kept, and you can revisit any need from the Needs tab. A new card about ' + word + ' will open.'
    },
    shareUnanswered: {
      title: 'Share without a response?', proceed: 'Share anyway', cancel: 'Respond first',
      body: (kind: string, from: string) =>
        'You have not chosen a response to this card yet. Sharing it now sends it back just as it arrived, with nothing from you on it. ' + (kind === 'gratitude' ? 'You can celebrate it first, so ' + (from || 'they') + ' knows it landed.' : "You can respond first: heard, I'd love to, let's explore, or I cannot.")
    },
    restore: {
      title: 'Restore this backup?', proceed: 'Restore everything', cancel: 'Not now',
      body: 'Restoring replaces everything on this device with what is in this file, exactly as it was saved. You can undo this for the rest of this session.'
    },
    deletePerson: {
      title: (name: string) => 'Remove ' + name + '?', proceed: 'Remove them', cancel: 'Keep them',
      body: (cards: number) =>
        'Their name leaves your people, and any need you named them on. ' +
        (cards ? 'The ' + cards + (cards === 1 ? ' card between you stays' : ' cards between you stay') + ' exactly as they are. ' : '') +
        'You can undo this.'
    },
    deleteNeed: {
      title: (word: string) => 'Remove ' + word + '?', proceed: 'Remove it', cancel: 'Keep it',
      body: 'It leaves your needs, with how it felt and any note you kept on it. Cards that used the word keep the word. You can undo this.'
    },
    hideNeed: {
      title: (word: string) => 'Hide ' + word + '?', proceed: 'Hide it', cancel: 'Keep it',
      body: 'It leaves your list, your check-ins, and the composer. Everything you marked on it is kept, and Settings can show it again. You can undo this.'
    },
    deleteArea: {
      title: (name: string) => 'Remove ' + name + '?', proceed: 'Remove it', cancel: 'Keep it',
      body: (n: number) =>
        (n ? 'The ' + n + (n === 1 ? ' need' : ' needs') + ' you filed under it go with it, with how they felt. ' : 'Nothing is filed under it yet. ') +
        'You can undo this.'
    },
    discardDraft: {
      title: 'Discard this draft?', proceed: 'Discard it', cancel: 'Keep it',
      body: 'The words go from this device. You can undo this for the rest of this session.'
    }
  },

  history: {
    title: 'History · this session',
    body: 'Every change this session, newest first. Tap any point to go back to it. Giraffy asks before it does.',
    empty: 'Nothing has changed yet this session.',
    undone: (label: string) => 'Undone · ' + label,
    redone: 'Redone',
    reverted: 'Reverted to an earlier point',
    nothingToUndo: 'Nothing to undo.', nothingToRedo: 'Nothing to redo.'
  },

  importScreen: {
    toasts: {
      merged: 'Merged. Two histories, one card.',
      thread: (n: number) => 'Imported. A thread with ' + n + ' of your cards has formed.',
      personAdded: (name: string) => '"' + name + '" added to your people.',
      added: 'Added to Received.',
      addedMine: 'Added to your cards.',
      restored: (cards: number, people: number) => 'Restored: ' + cards + ' cards, ' + people + ' people, your needs, name, and settings. You can undo this.'
    },
    records: { merged: 'Merged a reply', imported: 'Imported a card', restored: 'Restored a backup' }
  },

  install: {
    prompt: 'Add Giraffy to your home screen for the full offline experience.',
    button: 'Install',
    ios: 'To install on iPhone or iPad: tap Share, then Add to Home Screen.',
    generic: 'To install: open your browser menu and choose Add to Home Screen or Install app.',
    installed: 'Giraffy is installed. Open it from your home screen.'
  }
};
