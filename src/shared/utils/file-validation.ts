/**
 * Document-upload hardening (Wave 1) — content-based file validation.
 *
 * Detects a file's type from its leading bytes (magic numbers) rather than
 * trusting a client-supplied name/extension, and enforces a maximum decoded
 * size. Dependency-free so it adds no new package and cannot break the build.
 *
 * Extend `SIGNATURES` to support additional allowlisted types.
 *
 * Feature: document-upload-hardening, Requirements 1 & 2
 */

export interface FileValidationResult {
  ok: boolean;
  detectedMime: string | null;
  message?: string;
}

/** Strip an optional `data:...;base64,` prefix and decode to a Buffer. */
export function decodeBase64Attachment(attachment: string): Buffer {
  const base64 = attachment.includes(',') ? attachment.split(',')[1] : attachment;
  return Buffer.from(base64, 'base64');
}

/**
 * Magic-byte signatures for supported types. Each entry lists the byte
 * sequence expected at a given offset. A match means the buffer is that type.
 */
const SIGNATURES: Array<{ mime: string; offset: number; bytes: number[] }> = [
  // PDF: "%PDF"
  { mime: 'application/pdf', offset: 0, bytes: [0x25, 0x50, 0x44, 0x46] },
  // PNG: 0x89 P N G CR LF SUB LF
  { mime: 'image/png', offset: 0, bytes: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a] },
  // JPEG: FF D8 FF
  { mime: 'image/jpeg', offset: 0, bytes: [0xff, 0xd8, 0xff] },
];

/** Detect the MIME type of a buffer from its magic bytes, or null if unknown. */
export function detectMimeType(buffer: Buffer): string | null {
  for (const sig of SIGNATURES) {
    if (buffer.length < sig.offset + sig.bytes.length) continue;
    let matched = true;
    for (let i = 0; i < sig.bytes.length; i++) {
      if (buffer[sig.offset + i] !== sig.bytes[i]) {
        matched = false;
        break;
      }
    }
    if (matched) return sig.mime;
  }
  return null;
}

/**
 * Validate a decoded file against the allowlist and size cap.
 *
 * @param buffer decoded file bytes
 * @param allowedMimeTypes allowlist of acceptable MIME types
 * @param maxBytes maximum allowed size in bytes
 */
export function validateFile(buffer: Buffer, allowedMimeTypes: string[], maxBytes: number): FileValidationResult {
  if (!buffer || buffer.length === 0) {
    return { ok: false, detectedMime: null, message: 'File is empty or could not be decoded' };
  }

  if (buffer.length > maxBytes) {
    const maxMb = (maxBytes / (1024 * 1024)).toFixed(1);
    return { ok: false, detectedMime: null, message: `File exceeds the maximum allowed size of ${maxMb} MB` };
  }

  const detectedMime = detectMimeType(buffer);
  if (!detectedMime) {
    return { ok: false, detectedMime: null, message: 'Unsupported or unrecognized file type' };
  }

  if (!allowedMimeTypes.includes(detectedMime)) {
    return { ok: false, detectedMime, message: `File type ${detectedMime} is not allowed` };
  }

  return { ok: true, detectedMime };
}
