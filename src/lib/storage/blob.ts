import { del, head } from '@vercel/blob';

/**
 * Validates that the blob token is available.
 */
function ensureToken() {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    throw new Error("BLOB_READ_WRITE_TOKEN is not set in environment variables");
  }
}

/**
 * Deletes a file from Vercel Blob using its storage reference (url).
 */
export async function deleteFile(storageReference: string): Promise<void> {
  ensureToken();
  await del(storageReference);
}

/**
 * Gets metadata for a file from Vercel Blob.
 */
export async function getFileMetadata(storageReference: string) {
  ensureToken();
  return await head(storageReference);
}

/**
 * Since Vercel Blob handles uploads via client tokens, we no longer generate
 * pre-signed upload URLs. Instead, the API endpoint utilizes `@vercel/blob/client` `handleUpload`.
 * 
 * For downloads, we use the storageReference (the URL) in our proxy route to fetch the blob.
 * This proxy enforces RBAC/IDOR constraints.
 */
export async function fetchBlobForProxy(storageReference: string): Promise<Response> {
  ensureToken();
  return fetch(storageReference, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${process.env.BLOB_READ_WRITE_TOKEN}`,
    },
  });
}
