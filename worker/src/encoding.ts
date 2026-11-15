/** Text and base64 helpers for tokens, cookies, keys and JWTs (the Worker has no Node.js Buffer). */

/** Encodes bytes as unpadded base64url ("-" and "_" instead of "+" and "/"), safe in URLs and cookies. */
export function toBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/** Decodes standard base64 or base64url, with or without padding. */
export function fromBase64(text: string): Uint8Array<ArrayBuffer> {
  const binary = atob(text.replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

/** A random, URL-safe string with `byteLength` bytes of entropy. */
export function randomToken(byteLength = 32): string {
  return toBase64Url(crypto.getRandomValues(new Uint8Array(byteLength)));
}

const encoder = new TextEncoder();
const decoder = new TextDecoder();
/** Text to UTF-8 bytes. */
export const utf8 = (text: string) => encoder.encode(text);
/** UTF-8 bytes back to text. */
export const fromUtf8 = (bytes: Uint8Array) => decoder.decode(bytes);
