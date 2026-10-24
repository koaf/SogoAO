import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { escapeHtml, privacyPage } from "../src/render.mjs";

const dist = path.resolve("dist");
const posts = JSON.parse(fs.readFileSync("src/generated/posts.json", "utf8"));
const sitemap = fs.readFileSync(path.join(dist, "sitemap.xml"), "utf8");
const urls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
assert.equal(urls.length, posts.length + 2);
assert.equal(new Set(urls).size, urls.length);
const siteUrl = new URL(urls[0]);
const basePath = siteUrl.pathname;
const home = fs.readFileSync(path.join(dist, "index.html"), "utf8");
const titles = new Set();

for (const [index, url] of urls.entries()) {
  const post = index && index <= posts.length ? posts[index - 1] : null;
  const isPrivacy = url === new URL(privacyPage.pathname, siteUrl).href;
  const file = post ? path.join(dist, "posts", post.slug, "index.html")
    : isPrivacy ? path.join(dist, privacyPage.pathname, "index.html") : path.join(dist, "index.html");
  const html = fs.readFileSync(file, "utf8");
  assert.equal((html.match(/<h1\b/g) || []).length, 1, `One visible H1: ${url}`);
  assert(!html.includes('<div id="app"></div>'), `Nonempty initial HTML: ${url}`);
  assert.equal((html.match(/rel="canonical"/g) || []).length, 1);
  assert(html.includes(`<link rel="canonical" href="${url}" />`), `Self canonical: ${url}`);
  assert(!/<meta[^>]+name="robots"[^>]+noindex/i.test(html));
  const title = html.match(/<title>([^<]+)<\/title>/)?.[1];
  assert(title && !titles.has(title), `Unique title: ${url}`);
  titles.add(title);
  assert(html.includes(`href="${basePath}${privacyPage.pathname}"`), `Privacy policy link: ${url}`);

  if (post) {
    assert(html.includes(`<h1>${escapeHtml(post.title)}</h1>`));
    assert(html.includes(`<div class="article-body">${post.html}</div>`), `Full article: ${url}`);
    assert(html.includes(`name="description" content="${escapeHtml(post.description)}"`));
    assert(home.includes(`href="${basePath}posts/${post.slug}/"`), `Discoverable from homepage: ${url}`);
    const data = JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);
    assert.equal(data.url, url);
    assert.equal(data.headline, post.title);
    assert.equal(data.dateModified, post.updated);
  }

  // Crawl the output without JavaScript: every internal link and build asset
  // must have a corresponding file or index.html in the deployment artifact.
  for (const match of html.matchAll(/(?:href|src)="([^"<>]+)"/g)) {
    const target = new URL(match[1].replaceAll("&amp;", "&"), url);
    if (target.origin !== siteUrl.origin) continue;
    assert(target.pathname.startsWith(basePath));
    const relative = decodeURIComponent(target.pathname.slice(basePath.length));
    const targetFile = path.join(dist, relative);
    assert(fs.existsSync(targetFile) && (fs.statSync(targetFile).isFile()
      || fs.existsSync(path.join(targetFile, "index.html"))), `Broken internal URL: ${target.href}`);
  }
}

const privacyHtml = fs.readFileSync(path.join(dist, privacyPage.pathname, "index.html"), "utf8");
assert(privacyHtml.includes(`<h1>${privacyPage.title}</h1>`));
assert(!privacyHtml.includes('"@type":"BlogPosting"'));
for (const alias of privacyPage.aliases) {
  assert.equal(fs.readFileSync(path.join(dist, alias, "index.html"), "utf8"), privacyHtml);
  assert(!urls.includes(new URL(alias, siteUrl).href), "Only the canonical privacy URL belongs in the sitemap");
}

const notFound = fs.readFileSync(path.join(dist, "404.html"), "utf8");
assert(notFound.includes('name="robots" content="noindex, follow"'));
assert(notFound.includes("ページが見つかりません"));
assert(!notFound.includes('rel="canonical"'));
assert(!notFound.includes('class="article-body"'));
assert(!sitemap.includes("404.html"));
assert(fs.readFileSync(path.join(dist, "robots.txt"), "utf8").includes(`Sitemap: ${new URL("sitemap.xml", siteUrl)}`));
console.log(`SEO checks passed: ${urls.length} pages with full HTML, metadata, working internal links, and a noindex 404.`);
