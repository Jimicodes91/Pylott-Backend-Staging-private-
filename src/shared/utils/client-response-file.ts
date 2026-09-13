/**
 * Client-response file backward-compatibility (Part A / Wave 3, Requirement 11).
 *
 * After Part A, a client response's `file_url` holds a hosted URL reference.
 * Rows created before Part A hold raw base64. This helper tags each response so
 * a reader can render/download either format correctly without erroring.
 *
 * Feature: document-upload-hardening (Part A), Requirement 11.1 / 11.3
 */

export type ClientResponseFileKind = 'url' | 'base64' | 'none';

export interface NormalizedClientResponseFile {
  file_kind: ClientResponseFileKind;
}

/** Classify a stored `file_url` value. */
export function classifyClientResponseFile(fileUrl: string | null | undefined): ClientResponseFileKind {
  if (!fileUrl || fileUrl.length === 0) return 'none';
  // A hosted reference is an http(s) URL; anything else is treated as legacy base64.
  return fileUrl.startsWith('http') ? 'url' : 'base64';
}

/**
 * Return a shallow copy of a client-response row with a `file_kind` tag added,
 * preserving the original `file_url` so existing consumers keep working.
 */
export function tagClientResponseFile<T extends { file_url?: string | null }>(response: T): T & NormalizedClientResponseFile {
  return { ...response, file_kind: classifyClientResponseFile(response.file_url) };
}

/** Tag every response in an array; safe on undefined/empty input. */
export function tagClientResponseFiles<T extends { file_url?: string | null }>(responses: T[] | undefined | null): Array<T & NormalizedClientResponseFile> {
  if (!Array.isArray(responses)) return [];
  return responses.map(tagClientResponseFile);
}
