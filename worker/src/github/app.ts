/**
 * Acting as the GitHub App itself: sign a short JWT with the app's private key, trade it for an installation
 * token (valid one hour) and keep that token in memory until shortly before it expires. The installation
 * token reads discussions and creates a page's discussion; it never posts visitors' comments.
 */
import { fromBase64, toBase64Url, utf8 } from "../encoding";
import type { Env } from "../env";
import { rest } from "./client";

/** Renew this long before GitHub's expiry, so a token never runs out mid-request. */
const RENEW_MARGIN_MS = 5 * 60 * 1000;

let cached: { token: string; expiresAt: number } | undefined;

/** A valid installation token, minted on the first call and again whenever the cached one is nearly out. */
export async function installationToken(env: Env): Promise<string> {
  if (cached && cached.expiresAt - RENEW_MARGIN_MS > Date.now()) return cached.token;
  const { token, expires_at } = await rest<{ token: string; expires_at: string }>(
    await appJwt(env),
    `/app/installations/${env.GITHUB_APP_INSTALLATION_ID}/access_tokens`,
    // Narrowed to what the comments need, whatever else the app may be granted later.
    {
      method: "POST",
      body: { repositories: [env.GITHUB_REPOSITORY.split("/")[1]], permissions: { discussions: "write" } },
    },
  );
  cached = { token, expiresAt: Date.parse(expires_at) };
  return token;
}

/** The app's own identity: an RS256 JWT, issued by its App ID, good for nine minutes (GitHub allows ten). */
async function appJwt(env: Env): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const encode = (part: object) => toBase64Url(utf8(JSON.stringify(part)));
  // iat is backdated a minute to allow for clock drift, as GitHub recommends.
  const unsigned = `${encode({ alg: "RS256", typ: "JWT" })}.${encode({ iat: now - 60, exp: now + 540, iss: Number(env.GITHUB_APP_ID) })}`;
  const signature = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", await privateKey(env), utf8(unsigned));
  return `${unsigned}.${toBase64Url(new Uint8Array(signature))}`;
}

let key: { pem: string; key: Promise<CryptoKey> } | undefined;

function privateKey(env: Env): Promise<CryptoKey> {
  if (key?.pem !== env.GITHUB_APP_PRIVATE_KEY) {
    const pem = env.GITHUB_APP_PRIVATE_KEY;
    if (pem.includes("BEGIN RSA PRIVATE KEY")) {
      throw new Error("GITHUB_APP_PRIVATE_KEY is PKCS#1; convert it with `openssl pkcs8 -topk8 -nocrypt`.");
    }
    // Whitespace and literal "\n" (how a key often looks in .dev.vars) are not part of the key.
    const der = fromBase64(pem.replace(/-----(BEGIN|END) PRIVATE KEY-----|\\n|\s/g, ""));
    key = {
      pem,
      key: crypto.subtle.importKey("pkcs8", der, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["sign"]),
    };
  }
  return key.key;
}
