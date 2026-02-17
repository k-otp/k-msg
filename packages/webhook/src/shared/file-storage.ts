export interface FileStorageAdapter {
  appendFile(filePath: string, data: string): Promise<void>;
  readFile(filePath: string): Promise<string>;
  writeFile(filePath: string, data: string): Promise<void>;
  ensureDirForFile(filePath: string): Promise<void>;
}

const FILE_ADAPTER_ERROR_MESSAGE =
  "File storage requires `fileAdapter`. Provide a runtime-specific adapter (Node fs, Worker KV/R2, etc.).";

export function requireFileStorageAdapter(
  adapter: FileStorageAdapter | undefined,
): FileStorageAdapter {
  if (!adapter) {
    throw new Error(FILE_ADAPTER_ERROR_MESSAGE);
  }
  return adapter;
}

export function resolveStoragePath(basePath: string, fileName: string): string {
  const normalizedBase = basePath.replace(/[\\/]+$/, "");
  const normalizedFileName = fileName.replace(/^[\\/]+/, "");

  if (!normalizedBase) {
    return normalizedFileName;
  }

  return `${normalizedBase}/${normalizedFileName}`;
}

export function isFileNotFoundError(error: unknown): boolean {
  if (typeof error !== "object" || error === null) {
    return false;
  }

  const candidate = error as { code?: unknown; name?: unknown };
  return candidate.code === "ENOENT" || candidate.name === "NotFoundError";
}
