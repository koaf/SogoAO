import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const distDir = path.join(root, "dist");
const postsFile = path.join(root, "src", "generated", "posts.json");
const indexFile = path.join(distDir, "index.html");

const posts = JSON.parse(fs.readFileSync(postsFile, "utf8"));
const indexHtml = fs.readFileSync(indexFile, "utf8");
const siteUrl = resolveSiteUrl();

function resolveSiteUrl() {
  const explicitUrl = process.env.SITE_URL || process.env.VITE_SITE_URL;
  if (explicitUrl) return ensureTrailingSlash(explicitUrl);

  if (process.env.GITHUB_REPOSITORY) {
    const [owner, repo] = process.env.GITHUB_REPOSITORY.split("/");
    return ensureTrailingSlash(`https://${owner}.github.io/${repo}/`);
  }

  console.warn("SITE_URL is not set. Using http://localhost:5173/ for local SEO files.");
  return "http://localhost:5173/";
}

function ensureTrailingSlash(value) {
  return value.endsWith("/") ? value : `${value}/`;
}

function absoluteUrl(pathname = "") {
  return new URL(pathname, siteUrl).href;
}

function xmlEscape(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

const urls = [
  {
    loc: absoluteUrl(""),
    lastmod: posts[0]?.updated || posts[0]?.date,
    priority: "1.0",
  },
  ...posts.map((post) => ({
    loc: absoluteUrl(`posts/${post.slug}/`),
    lastmod: post.updated || post.date,
    priority: "0.8",
  })),
];

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (url) => `  <url>
    <loc>${xmlEscape(url.loc)}</loc>${url.lastmod ? `
    <lastmod>${xmlEscape(url.lastmod)}</lastmod>` : ""}
    <priority>${url.priority}</priority>
  </url>`,
  )
  .join("\n")}
</urlset>
`;

fs.writeFileSync(path.join(distDir, "sitemap.xml"), sitemap);
fs.writeFileSync(
  path.join(distDir, "robots.txt"),
  `User-agent: *\nAllow: /\n\nSitemap: ${absoluteUrl("sitemap.xml")}\n`,
);
fs.writeFileSync(path.join(distDir, "404.html"), indexHtml);

for (const post of posts) {
  const postDir = path.join(distDir, "posts", post.slug);
  fs.mkdirSync(postDir, { recursive: true });
  fs.writeFileSync(path.join(postDir, "index.html"), indexHtml);
}

console.log(`Generated sitemap, robots.txt, 404.html, and ${posts.length} post HTML files.`);
