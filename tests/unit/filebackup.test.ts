// Writing a backup into a folder someone chose, with a stand-in for the browser's handles.
import { describe, expect, it } from 'vitest';
import { AUTO_BACKUP_NAME, folderPermission, supportsFolderBackup, writeInto } from '../../src/lib/core/filebackup';
import { fakeFolder } from './helpers/fake-folder';

type Dir = ReturnType<typeof fakeFolder>;
const asHandle = (d: Dir) => d as unknown as FileSystemDirectoryHandle;

describe('writing into the folder', () => {
  it('replaces the file under that name', async () => {
    const dir = fakeFolder();
    await writeInto(asHandle(dir), AUTO_BACKUP_NAME, 'giraffy-backup: "1"\n');
    expect(dir.files.get(AUTO_BACKUP_NAME)).toBe('giraffy-backup: "1"\n');
    await writeInto(asHandle(dir), AUTO_BACKUP_NAME, 'newer');
    expect(dir.files.get(AUTO_BACKUP_NAME)).toBe('newer');
    expect(dir.files.size).toBe(1);
  });

  it('keeps a backup taken by hand beside it, under its own date', async () => {
    const dir = fakeFolder();
    await writeInto(asHandle(dir), AUTO_BACKUP_NAME, 'kept fresh');
    await writeInto(asHandle(dir), 'giraffy-backup-2026-09-12.gnvc.yaml', 'by hand');
    expect([...dir.files.keys()].sort()).toEqual(['giraffy-backup-2026-09-12.gnvc.yaml', 'giraffy-backup.gnvc.yaml']);
  });
});

describe('the permission that goes with the folder', () => {
  it('reports what is held without asking', async () => {
    const dir = fakeFolder('Giraffy', 'prompt');
    expect(await folderPermission(asHandle(dir))).toBe('prompt');
    expect(dir.asked).toBe(0);
  });

  it('reports a refusal as a refusal', async () => {
    const dir = fakeFolder('Giraffy', 'prompt', false);
    expect(await folderPermission(asHandle(dir), true)).toBe('prompt');
  });

  it('asks only when told to, and only when it has to', async () => {
    const dir = fakeFolder('Giraffy', 'prompt');
    expect(await folderPermission(asHandle(dir), true)).toBe('granted');
    expect(dir.asked).toBe(1);

    const held = fakeFolder('Giraffy', 'granted');
    expect(await folderPermission(asHandle(held), true)).toBe('granted');
    expect(held.asked).toBe(0);
  });

  it('treats a handle without the permission hooks as usable', async () => {
    const bare = { name: 'Giraffy' } as unknown as FileSystemDirectoryHandle;
    expect(await folderPermission(bare)).toBe('granted');
  });

  it('treats a handle that throws as out of reach', async () => {
    const cross = { name: 'x', async queryPermission() { throw new Error('gone'); } } as unknown as FileSystemDirectoryHandle;
    expect(await folderPermission(cross)).toBe('denied');
  });
});

describe('knowing where this can work at all', () => {
  it('is false where the browser has no folder picker', () => {
    // node has no window; a phone browser has one, without showDirectoryPicker on it
    expect(supportsFolderBackup()).toBe(false);
  });
});
