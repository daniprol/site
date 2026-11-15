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

/**
 * The current installation token. Module-level variables live as long as the Worker instance, which serves
 * many requests, so most requests reuse the token instead of asking GitHub for a new one.
 */
let cachedToken: { token: string; expiresAt: number } | undefined;

/** A valid installation token, minted on the first call and again whenever the cached one is nearly out. */
export async function installationToken(env: Env): Promise<string> {
  if (cachedToken && cachedToken.expiresAt - RENEW_MARGIN_MS > Date.now()) return cachedToken.token;
  const { token, expires_at } = await rest<{ token: string; expires_at: string }>(
    await appJwt(env),
    `/app/installations/${env.GITHUB_APP_INSTALLATION_ID}/access_tokens`,
    // Narrowed to what the comments need, whatever else the app may be granted later.
    {
      method: "POST",
      body: { repositories: [env.GITHUB_REPOSITORY.split("/")[1]], permissions: { discussions: "write" } },
    },
  );
  cachedToken = { token, expiresAt: Date.parse(expires_at) };
  return token;
}

/** "Issued at" is backdated a minute to allow for clock drift, as GitHub recommends. */
const JWT_BACKDATE_SECONDS = 60;
/** Nine minutes from now; GitHub refuses app JWTs that live longer than ten. */
const JWT_LIFETIME_SECONDS = 9 * 60;

/** The app's own identity: an RS256-signed JWT, issued by its App ID. */
async function appJwt(env: Env): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const encode = (part: object) => toBase64Url(utf8(JSON.stringify(part)));
  const header = encode({ alg: "RS256", typ: "JWT" });
  const claims = encode({
    iat: now - JWT_BACKDATE_SECONDS,
    exp: now + JWT_LIFETIME_SECONDS,
    iss: Number(env.GITHUB_APP_ID),
  });
  const unsigned = `${header}.${claims}`;
  const signature = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", await privateKey(env), utf8(unsigned));
  return `${unsigned}.${toBase64Url(new Uint8Array(signature))}`;
}

/** The imported private key, kept with the PEM it came from so a changed secret is picked up. */
let importedKey: { pem: string; key: Promise<CryptoKey> } | undefined;

/** The app's private key (GITHUB_APP_PRIVATE_KEY) as a WebCrypto signing key. */
function privateKey(env: Env): Promise<CryptoKey> {
  if (importedKey?.pem !== env.GITHUB_APP_PRIVATE_KEY) {
    const pem = env.GITHUB_APP_PRIVATE_KEY;
    if (pem.includes("BEGIN RSA PRIVATE KEY")) {
      throw new Error("GITHUB_APP_PRIVATE_KEY is PKCS#1; convert it with `openssl pkcs8 -topk8 -nocrypt`.");
    }
    // Whitespace and literal "\n" (how a key often looks in .dev.vars) are not part of the key.
    const der = fromBase64(pem.replace(/-----(BEGIN|END) PRIVATE KEY-----|\\n|\s/g, ""));
    importedKey = {
      pem,
      key: crypto.subtle.importKey("pkcs8", der, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["sign"]),
    };
  }
  return importedKey.key;
}
