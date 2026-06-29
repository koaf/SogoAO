import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const postsDir = path.join(root, "content", "posts");
const outputDir = path.join(root, "src", "generated");
const outputFile = path.join(outputDir, "posts.ts");

function parseFrontmatter(markdown) {
  const match = markdown.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!match) {
    return { data: {}, body: markdown };
  }

  const data = {};
  for (const rawLine of match[1].split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const separator = line.indexOf(":");
    if (separator === -1) continue;

    const key = line.slice(0, separator).trim();
    const value = line.slice(separator + 1).trim();
    data[key] = parseYamlValue(value);
  }

  return {
    data,
    body: markdown.slice(match[0].length).trim(),
  };
}

function parseYamlValue(value) {
  if (value === "true") return true;
  if (value === "false") return false;
  if (value.startsWith("[") && value.endsWith("]")) {
    const inner = value.slice(1, -1).trim();
    if (!inner) return [];
    return inner
      .split(/,(?=(?:[^"]*"[^"]*")*[^"]*$)/)
      .map((item) => item.trim().replace(/^"|"$/g, ""));
  }
  return value.replace(/^"|"$/g, "");
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function inlineMarkdown(value) {
  let html = escapeHtml(value);
  html = html.replace(/`([^`]+)`/g, "<code>$1</code>");
  html = html.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/\*([^*]+)\*/g, "<em>$1</em>");
  html = html.replace(
    /\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g,
    '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>',
  );
  return html;
}

function renderTable(lines) {
  const rows = lines
    .filter((line) => !/^\|\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?$/.test(line))
    .map((line) =>
      line
        .replace(/^\|/, "")
        .replace(/\|$/, "")
        .split("|")
        .map((cell) => inlineMarkdown(cell.trim())),
    );

  if (!rows.length) return "";
  const [head, ...body] = rows;
  return `<div class="table-wrap"><table><thead><tr>${head
    .map((cell) => `<th>${cell}</th>`)
    .join("")}</tr></thead><tbody>${body
    .map((row) => `<tr>${row.map((cell) => `<td>${cell}</td>`).join("")}</tr>`)
    .join("")}</tbody></table></div>`;
}

function renderMarkdown(markdown) {
  const lines = markdown.split(/\r?\n/);
  const html = [];
  let paragraph = [];
  let list = null;
  let blockquote = [];
  let table = [];

  const flushParagraph = () => {
    if (!paragraph.length) return;
    html.push(`<p>${inlineMarkdown(paragraph.join(" "))}</p>`);
    paragraph = [];
  };

  const flushList = () => {
    if (!list) return;
    html.push(`<${list.type}>${list.items.map((item) => `<li>${inlineMarkdown(item)}</li>`).join("")}</${list.type}>`);
    list = null;
  };

  const flushBlockquote = () => {
    if (!blockquote.length) return;
    html.push(`<blockquote>${blockquote.map((item) => `<p>${inlineMarkdown(item)}</p>`).join("")}</blockquote>`);
    blockquote = [];
  };

  const flushTable = () => {
    if (!table.length) return;
    html.push(renderTable(table));
    table = [];
  };

  const flushAll = () => {
    flushParagraph();
    flushList();
    flushBlockquote();
    flushTable();
  };

  for (const line of lines) {
    const trimmed = line.trim();

    if (!trimmed) {
      flushAll();
      continue;
    }

    if (trimmed === "---") {
      flushAll();
      html.push('<hr />');
      continue;
    }

    if (trimmed.startsWith("|")) {
      flushParagraph();
      flushList();
      flushBlockquote();
      table.push(trimmed);
      continue;
    }

    flushTable();

    const heading = trimmed.match(/^(#{2,4})\s+(.+)$/);
    if (heading) {
      flushParagraph();
      flushList();
      flushBlockquote();
      const level = heading[1].length;
      html.push(`<h${level}>${inlineMarkdown(heading[2])}</h${level}>`);
      continue;
    }

    if (trimmed.startsWith(">")) {
      flushParagraph();
      flushList();
      blockquote.push(trimmed.replace(/^>\s?/, ""));
      continue;
    }

    const unordered = trimmed.match(/^[-*]\s+(.+)$/);
    if (unordered) {
      flushParagraph();
      flushBlockquote();
      if (!list || list.type !== "ul") list = { type: "ul", items: [] };
      list.items.push(unordered[1]);
      continue;
    }

    const ordered = trimmed.match(/^\d+\.\s+(.+)$/);
    if (ordered) {
      flushParagraph();
      flushBlockquote();
      if (!list || list.type !== "ol") list = { type: "ol", items: [] };
      list.items.push(ordered[1]);
      continue;
    }

    flushList();
    flushBlockquote();
    paragraph.push(trimmed);
  }

  flushAll();
  return html.join("\n");
}

function textFromMarkdown(markdown) {
  return markdown
    .replace(/^---[\s\S]*?---/, "")
    .replace(/[#>*|`_\-[\]()]/g, "")
    .replace(/\s+/g, "");
}

const posts = fs
  .readdirSync(postsDir, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => {
    const file = path.join(postsDir, entry.name, "index.md");
    const markdown = fs.readFileSync(file, "utf8");
    const { data, body } = parseFrontmatter(markdown);
    const wordCount = textFromMarkdown(body).length;

    return {
      slug: entry.name,
      title: data.title ?? entry.name,
      date: data.date ?? "",
      updated: data.lastmod ?? data.date ?? "",
      description: data.description ?? data.summary ?? "",
      summary: data.summary ?? data.description ?? "",
      categories: Array.isArray(data.categories) ? data.categories : [],
      tags: Array.isArray(data.tags) ? data.tags : [],
      readingMinutes: Math.max(1, Math.ceil(wordCount / 650)),
      html: renderMarkdown(body),
    };
  })
  .filter((post) => post.title)
  .sort((a, b) => String(b.date).localeCompare(String(a.date)));

fs.mkdirSync(outputDir, { recursive: true });
fs.writeFileSync(
  outputFile,
  `export const posts = ${JSON.stringify(posts, null, 2)} as const;\n\nexport type Post = (typeof posts)[number];\n`,
);

console.log(`Generated ${posts.length} posts.`);
