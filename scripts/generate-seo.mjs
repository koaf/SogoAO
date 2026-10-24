import fs from "node:fs";
import path from "node:path";
import {
  escapeHtml, renderHome, renderPost, renderNotFound, siteName, siteDescription,
} from "../src/render.mjs";

const root = process.cwd();
const distDir = path.join(root, "dist");
const postsFile = path.join(root, "src", "generated", "posts.json");
const indexFile = path.join(distDir, "index.html");

const posts = JSON.parse(fs.readFileSync(postsFile, "utf8"));
const indexHtml = fs.readFileSync(indexFile, "utf8");
const siteUrl = resolveSiteUrl();
const basePath = new URL(siteUrl).pathname;
// Also support rerunning this generator against an already generated build.
const templateHtml = indexHtml
  .replace(/<meta\b(?=[^>]*\b(?:name="(?:description|robots)"|property="og:[^"]+"))[^>]*>/gi, "")
  .replace(/<link\b(?=[^>]*\brel="canonical")[^>]*>/gi, "")
  .replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/gi, "")
  .replace(/<div id="app">[\s\S]*<\/div>/, '<div id="app"></div>');

function resolveSiteUrl() {
  const explicitUrl = process.env.SITE_URL || process.env.VITE_SITE_URL;
  if (explicitUrl) return ensureTrailingSlash(explicitUrl);

  const cnameFile = path.join(root, "public", "CNAME");
  if (fs.existsSync(cnameFile)) {
    const domain = fs.readFileSync(cnameFile, "utf8").trim();
    if (domain) return `https://${domain}/`;
  }

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

function renderDocument({ title, description, pathname, content, post, noindex = false }) {
  const canonical = pathname === undefined ? null : absoluteUrl(pathname);
  const metadata = [
    `<meta name="description" content="${escapeHtml(description)}" />`,
    `<meta property="og:site_name" content="${escapeHtml(siteName)}" />`,
    `<meta property="og:title" content="${escapeHtml(title)}" />`,
    `<meta property="og:description" content="${escapeHtml(description)}" />`,
    `<meta property="og:type" content="${post ? "article" : "website"}" />`,
    ...(canonical ? [
      `<link rel="canonical" href="${escapeHtml(canonical)}" />`,
      `<meta property="og:url" content="${escapeHtml(canonical)}" />`,
    ] : []),
    ...(noindex ? ['<meta name="robots" content="noindex, follow" />'] : []),
  ];

  if (post) {
    const structuredData = {
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      headline: post.title,
      description: post.description,
      url: canonical,
      mainEntityOfPage: { "@type": "WebPage", "@id": canonical },
      inLanguage: "ja",
      datePublished: post.date,
      dateModified: post.updated,
      author: { "@type": "Organization", name: "WABI-LAB", url: siteUrl },
    };
    metadata.push(`<script type="application/ld+json">${JSON.stringify(structuredData).replaceAll("<", "\\u003c")}</script>`);
  }

  return templateHtml
    .replace(/<title>[\s\S]*?<\/title>/i, () => `<title>${escapeHtml(title)}</title>`)
    .replace("</head>", () => `    ${metadata.join("\n    ")}\n  </head>`)
    .replace('<div id="app"></div>', () => `<div id="app">${content}</div>`);
}

const urls = [
  {
    loc: absoluteUrl(""),
    lastmod: posts.map((post) => post.updated || post.date).sort().at(-1),
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
fs.writeFileSync(indexFile, renderDocument({
  title: siteName,
  description: siteDescription,
  pathname: "",
  content: renderHome(posts, basePath),
}));

fs.writeFileSync(path.join(distDir, "404.html"), renderDocument({
  title: `ページが見つかりません | ${siteName}`,
  description: "指定されたページが見つかりません。記事一覧からお探しください。",
  content: renderNotFound(basePath),
  noindex: true,
}));

for (const post of posts) {
  const postDir = path.join(distDir, "posts", post.slug);
  fs.mkdirSync(postDir, { recursive: true });
  fs.writeFileSync(path.join(postDir, "index.html"), renderDocument({
    title: `${post.title} | ${siteName}`,
    description: post.description,
    pathname: `posts/${post.slug}/`,
    content: renderPost(post, basePath),
    post,
  }));
}

console.log(`Generated sitemap, robots.txt, a noindex 404, and full HTML for home and ${posts.length} posts.`);
