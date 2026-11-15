/**
 * Sealed cookies: JSON encrypted and authenticated with AES-GCM under SESSION_KEY, so the browser can carry
 * them but can neither read nor alter them. Each cookie's name is bound in as associated data, so a value
 * sealed for one cookie is useless in another, and every value carries its own expiry.
 *
 * The __Host- prefix makes browsers insist on Secure, Path=/ and no Domain, so the cookies stay on this host.
 */
import { fromBase64, fromUtf8, toBase64Url, utf8 } from "./encoding";
import type { Env } from "./env";

const IV_BYTES = 12;

interface Sealed<T> {
  value: T;
  /** Expiry, in milliseconds since the epoch. */
  exp: number;
}

const keys = new Map<string, Promise<CryptoKey>>();

function sessionKey(env: Env): Promise<CryptoKey> {
  let key = keys.get(env.SESSION_KEY);
  if (!key) {
    key = crypto.subtle.importKey("raw", fromBase64(env.SESSION_KEY), "AES-GCM", false, ["encrypt", "decrypt"]);
    keys.set(env.SESSION_KEY, key);
  }
  return key;
}

/** Builds a Set-Cookie header value holding `value`, sealed, for `maxAgeSeconds`. */
export async function setSealedCookie<T>(env: Env, name: string, value: T, maxAgeSeconds: number): Promise<string> {
  const sealed: Sealed<T> = { value, exp: Date.now() + maxAgeSeconds * 1000 };
  const iv = crypto.getRandomValues(new Uint8Array(IV_BYTES));
  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv, additionalData: utf8(name) },
    await sessionKey(env),
    utf8(JSON.stringify(sealed)),
  );
  const payload = new Uint8Array(IV_BYTES + ciphertext.byteLength);
  payload.set(iv);
  payload.set(new Uint8Array(ciphertext), IV_BYTES);
  return serialize(name, toBase64Url(payload), maxAgeSeconds);
}

/** Reads and opens a sealed cookie. Missing, tampered, foreign or expired cookies all read as null. */
export async function getSealedCookie<T>(request: Request, env: Env, name: string): Promise<T | null> {
  const raw = readCookie(request, name);
  if (!raw) return null;
  try {
    const payload = fromBase64(raw);
    const plaintext = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: payload.subarray(0, IV_BYTES), additionalData: utf8(name) },
      await sessionKey(env),
      payload.subarray(IV_BYTES),
    );
    const sealed = JSON.parse(fromUtf8(new Uint8Array(plaintext))) as Sealed<T>;
    return sealed.exp > Date.now() ? sealed.value : null;
  } catch {
    return null;
  }
}

/** A Set-Cookie header value that deletes the cookie. */
export const clearCookie = (name: string) => serialize(name, "", 0);

function serialize(name: string, value: string, maxAgeSeconds: number): string {
  return `${name}=${value}; Max-Age=${maxAgeSeconds}; Path=/; HttpOnly; Secure; SameSite=Lax`;
}

function readCookie(request: Request, name: string): string | null {
  for (const part of request.headers.get("Cookie")?.split(";") ?? []) {
    const [key, ...rest] = part.trim().split("=");
    if (key === name) return rest.join("=");
  }
  return null;
}
