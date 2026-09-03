import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

const MAX_BYTES = 1_500_000;

export function storageRoot(): string {
  return process.env.STORAGE_DIR ?? path.resolve(process.cwd(), "data", "storage");
}

export async function storeDocument(input: {
  tenantId: string;
  fileName: string;
  contentType: string;
  bytes: Buffer;
}): Promise<{ storageKey: string; sizeBytes: number }> {
  if (input.bytes.byteLength === 0 || input.bytes.byteLength > MAX_BYTES) {
    throw new Error("FILE_SIZE");
  }
  const key = `${input.tenantId}/${randomUUID()}`;
  const fullPath = path.join(storageRoot(), key);
  await mkdir(path.dirname(fullPath), { recursive: true });
  await writeFile(fullPath, input.bytes);
  return { storageKey: key, sizeBytes: input.bytes.byteLength };
}

export function resolveStoragePath(storageKey: string): string | null {
  if (storageKey.includes("..") || path.isAbsolute(storageKey)) return null;
  return path.join(storageRoot(), storageKey);
}

export async function deleteStoredFile(storageKey: string): Promise<void> {
  const fullPath = resolveStoragePath(storageKey);
  if (!fullPath) return;
  try {
    await unlink(fullPath);
  } catch {
    // missing file is acceptable during forget
  }
}

export function decodeBase64File(contentBase64: string): Buffer {
  const cleaned = contentBase64.includes(",")
    ? contentBase64.slice(contentBase64.indexOf(",") + 1)
    : contentBase64;
  return Buffer.from(cleaned, "base64");
}
