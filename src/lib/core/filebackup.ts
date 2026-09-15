// Writing backups into a folder the person chose (spec §5.15).
//
// This is the File System Access API, and only Chromium on a desktop has the folder half of
// it: no Firefox, no Safari, and no browser on a phone, where every save needs a tap. So
// every call here is guarded, and the app says plainly where it can and cannot do this.
//
// The handle itself is stored in IndexedDB and comes back on the next visit, but the
// permission that goes with it may not, and asking for it again needs a tap.

/** The one file that is kept up to date. Backups taken by hand carry the date instead. */
export const AUTO_BACKUP_NAME = 'giraffy-backup.gnvc.yaml';

export type FolderPermission = 'granted' | 'prompt' | 'denied';

export function supportsFolderBackup(): boolean {
  return typeof window !== 'undefined' && typeof window.showDirectoryPicker === 'function';
}

/** Ask for a folder. Returns null when the person closes the picker, which is not an error. */
export async function pickBackupFolder(): Promise<FileSystemDirectoryHandle | null> {
  if (!supportsFolderBackup()) return null;
  try {
    return await window.showDirectoryPicker!({ id: 'giraffy-backup', mode: 'readwrite', startIn: 'documents' });
  } catch {
    return null;
  }
}

/**
 * Where the folder permission stands. With `request`, asks for it, which only works while
 * handling a tap; without, it just looks, so it is safe to call at startup.
 */
export async function folderPermission(dir: FileSystemDirectoryHandle, request = false): Promise<FolderPermission> {
  const opts = { mode: 'readwrite' as const };
  // a browser without the permission hooks hands back a handle that simply works
  if (!dir.queryPermission) return 'granted';
  try {
    const held = (await dir.queryPermission(opts)) as FolderPermission;
    if (held === 'granted' || !request || !dir.requestPermission) return held;
    return (await dir.requestPermission(opts)) as FolderPermission;
  } catch {
    return 'denied';
  }
}

/** Write one file into the folder, replacing whatever was there under that name. */
export async function writeInto(dir: FileSystemDirectoryHandle, name: string, text: string): Promise<void> {
  const file = await dir.getFileHandle(name, { create: true });
  const stream = await file.createWritable();
  try {
    await stream.write(new Blob([text], { type: 'application/yaml' }));
  } finally {
    await stream.close();
  }
}
