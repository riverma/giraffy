// A stand-in for the browser's directory handle, for the tests that write backups.
export type FakePermission = PermissionState;

/** The parts of a directory handle this app uses, and a record of what was written. */
export function fakeFolder(name = 'Giraffy', permission: PermissionState = 'granted', grantOnRequest = true) {
  const files = new Map<string, string>();
  let asked = 0;
  const dir = {
    name,
    kind: 'directory' as const,
    files,
    get asked() { return asked; },
    set permission(p: PermissionState) { permission = p; },
    async queryPermission() { return permission; },
    async requestPermission() { asked += 1; if (grantOnRequest) permission = 'granted'; return permission; },
    async getFileHandle(fileName: string, opts?: { create?: boolean }) {
      if (!files.has(fileName) && !opts?.create) throw new Error('not found');
      return {
        async createWritable() {
          let written = '';
          return {
            async write(chunk: Blob | string) { written += typeof chunk === 'string' ? chunk : await chunk.text(); },
            async close() { files.set(fileName, written); }
          };
        }
      };
    }
  };
  return dir;
}
