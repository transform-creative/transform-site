/*******************************
 * bytesToBase64
 * Encode raw bytes as base64 for email attachment payloads.
 * Chunked because String.fromCharCode(...spread) overflows the call stack
 * once the array is large — a PDF is comfortably past that limit.
 */
export function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  const chunkSize = 8192;
  for (let offset = 0; offset < bytes.length; offset += chunkSize) {
    binary += String.fromCharCode(
      ...bytes.subarray(offset, offset + chunkSize),
    );
  }
  return btoa(binary);
}
