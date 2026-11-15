# Comments Worker

The site is static. This Worker only answers `/api/*` (`assets.run_worker_first` in `wrangler.jsonc`); every
other request is served straight from `./dist` without running any code.

It stores comments in GitHub Discussions, one discussion per page in the Announcements category, titled with
the page's path without base or locale (`writing/how-foliq-works`), the same mapping giscus used.

| Route                          | What it does                                                                    |
| ------------------------------ | ------------------------------------------------------------------------------- |
| `GET /api/comments?term=…`     | The page's thread, read as the GitHub App and kept in the edge cache for 60 s   |
| `POST /api/comments`           | Posts a comment or reply as the signed-in visitor, then drops the cached thread |
| `POST /api/reactions`          | Adds or removes the visitor's reaction on a comment or reply                    |
| `POST /api/markdown`           | Renders a draft comment as GitHub will, for the editor's Preview tab            |
| `GET /api/session`             | Who is signed in, if anyone                                                     |
| `GET /api/auth/login?return=…` | Starts GitHub sign-in                                                           |
| `GET /api/auth/callback`       | Finishes sign-in (must be one of the app's callback URLs)                       |
| `POST /api/auth/logout`        | Signs out and revokes the visitor's token                                       |

The response shapes are in [`src/contract.ts`](src/contract.ts), which the comments island also imports.

## How it fits together

- **`index.ts`**: the entry point. The `routes` object maps each `/api/*` path and method to a handler in `routes/`, and
  turns thrown errors into JSON `{ error }` responses.
- **`routes/comments.ts`** and **`routes/auth.ts`**: one exported function per route. They validate the
  request, then call the GitHub helpers in `github/`.
- **`github/client.ts`** and **`github/discussions.ts`**: small REST and GraphQL clients, and the queries that
  read, create and comment on discussions.
- **`github/app.ts`**: signs a JWT with the app's private key and swaps it for an installation token, which it
  keeps in memory until five minutes before it expires. That token reads discussions and creates a page's
  discussion the first time someone comments there. It only creates discussions for pages that exist in `./dist`.
- **`github/oauth.ts`** and **`routes/auth.ts`**: visitor sign-in through the app's user authorization flow.
  A random `state` in a sealed ten-minute cookie protects the callback. Expiring user tokens are refreshed when
  they are used.
- **`cookies.ts`** and **`session.ts`**: the session is a single AES-GCM-sealed `__Host-` cookie
  (HttpOnly, Secure, SameSite=Lax) that holds the visitor's login, avatar and tokens. There is no database.
- **`cache.ts`**: Cloudflare's Cache API. It only works on a custom domain. On `*.workers.dev`, including
  previews, nothing is cached and every read goes to GitHub.
- POSTs must come with this site's `Origin` and a JSON body.

## Configuration

Plain values live in `wrangler.jsonc` under `vars`: the repository, the category, and the app's App ID, Client ID
and Installation ID. Secrets are stored in Cloudflare and never committed:

```sh
# GitHub's key is PKCS#1; WebCrypto needs PKCS#8.
openssl pkcs8 -topk8 -nocrypt -in <app>.private-key.pem -out app-key.pem
npx wrangler secret put GITHUB_APP_PRIVATE_KEY < app-key.pem
npx wrangler secret put GITHUB_APP_CLIENT_SECRET
openssl rand -base64 32 | npx wrangler secret put SESSION_KEY
```

The GitHub App needs **Repository → Discussions: Read and write** and nothing else. Turn off its webhook, and
install it only on this repository. Register `https://<host>/api/auth/callback` as a callback URL for each host
you sign in on, including `http://localhost:8787/api/auth/callback` for local work.

## Local development

Put the same secrets in `.dev.vars` (gitignored). Quote multi-line values:

```sh
GITHUB_APP_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----
…
-----END PRIVATE KEY-----"
GITHUB_APP_CLIENT_SECRET="…"
SESSION_KEY="…"
```

Then `pnpm build && pnpm preview` runs the site and the Worker together on http://localhost:8787. `pnpm dev` proxies
`/api/*` to that port too, which is enough to read comments while editing pages. Sign in from :8787.

The GitHub Pages build sets `COMMENTS=false`, so pages there render no comments section.
