/**
 * Creates a content file with frontmatter filled in.
 *   pnpm new post "How foliq works"
 *   pnpm new snack "Claude Haiku 5.5"
 *   pnpm new project "foliq"
 */
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

const [kind, ...words] = process.argv.slice(2);
const title = words.join(" ").trim();
if (!kind || !title || !["post", "snack", "project"].includes(kind)) {
  console.error('Usage: pnpm new <post|snack|project> "Title"');
  process.exit(1);
}

const today = new Date().toISOString().slice(0, 10);
const slug = title
  .toLowerCase()
  .normalize("NFKD")
  .replace(/[^\w\s-]/g, "")
  .trim()
  .replace(/[\s_]+/g, "-");

const templates = {
  post: {
    path: join("src/content/posts", slug, "index.mdx"),
    body: `---\ntitle: ${title}\ndescription: TODO\ndate: ${today}\ntags: []\ndraft: true\n---\n\n`,
  },
  snack: {
    path: join("src/content/snacks", `${today}-${slug}.md`),
    body: `---\ntitle: ${title}\ndate: ${today}\nkind: app # model | app | cli | library | service | hardware\nverdict: maybe # keep | maybe | drop\nurl: https://\n---\n\n`,
  },
  project: {
    path: join("src/content/projects", `${slug}.mdx`),
    body: `---\ntitle: ${title}\nsummary: TODO\nyear: ${new Date().getFullYear()}\nstack: []\n---\n\n`,
  },
} satisfies Record<string, { path: string; body: string }>;

const { path, body } = templates[kind as keyof typeof templates];
if (existsSync(path)) {
  console.error(`Already exists: ${path}`);
  process.exit(1);
}
mkdirSync(dirname(path), { recursive: true });
writeFileSync(path, body);
console.log(`Created ${path}`);
