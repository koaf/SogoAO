import { posts, type Post } from "./generated/posts";
import "./styles.css";

const app = document.querySelector<HTMLDivElement>("#app");
const siteName = "WABI-LAB 年内受験対策";
const basePath = normalizeBasePath(import.meta.env.BASE_URL);

if (!app) {
  throw new Error("App root was not found.");
}

const formatDate = (date: string) =>
  new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(date));

function normalizeBasePath(value: string) {
  if (!value || value === "./") return "/";
  return value.endsWith("/") ? value : `${value}/`;
}

function sitePath(path = "") {
  const cleanPath = path.replace(/^\//, "");
  return `${basePath}${cleanPath}`;
}

function currentPath() {
  const pathname = window.location.pathname;
  return pathname.startsWith(basePath)
    ? pathname.slice(basePath.length - 1)
    : pathname;
}

const route = () => {
  const postMatch = currentPath().match(/^\/posts\/([^/]+)\/?$/);
  if (postMatch) {
    const post = posts.find((item) => item.slug === postMatch[1]);
    if (post) {
      renderPost(post);
      return;
    }
  }
  renderHome();
};

function renderShell(content: string) {
  app.innerHTML = `
    <header class="site-header">
      <a class="brand" href="${sitePath()}">
        <span class="brand-mark">WL</span>
        <span>${siteName}</span>
      </a>
      <nav aria-label="主要ナビゲーション">
        <a href="${sitePath()}#articles">記事一覧</a>
        <a href="${sitePath()}#topics">対策分野</a>
      </nav>
    </header>
    ${content}
    <footer class="site-footer">
      <p>WABI-LABが、総合型選抜・学校推薦型選抜の準備を実践的に整理します。</p>
    </footer>
  `;
}

function renderHome() {
  document.title = siteName;
  setMetaDescription(
    "WABI-LAB 年内受験対策は、総合型選抜・学校推薦型選抜・志望理由書・小論文・面接対策をわかりやすく整理する受験ブログです。",
  );
  setCanonical(sitePath());

  const latest = posts[0];
  const categories = [...new Set(posts.flatMap((post) => post.categories))];
  const tags = [...new Set(posts.flatMap((post) => post.tags))].slice(0, 14);

  renderShell(`
    <main>
      <section class="hero">
        <div class="hero-copy">
          <p class="eyebrow">WABI-LAB Admissions Journal</p>
          <h1>年内受験の準備を、迷わず進める。</h1>
          <p class="lead">志望理由書、小論文、面接、保護者のサポートまで。年内入試で必要な考え方と具体策を、読みやすい記事にまとめています。</p>
          <div class="hero-actions">
            <a class="button primary" href="${sitePath()}#articles">記事を読む</a>
            ${latest ? `<a class="button secondary" href="${sitePath(`posts/${latest.slug}/`)}">最新記事</a>` : ""}
          </div>
        </div>
        <div class="hero-panel" aria-label="対策ロードマップ">
          <div>
            <span>1</span>
            <strong>自己分析</strong>
            <p>原体験と活動実績を言語化</p>
          </div>
          <div>
            <span>2</span>
            <strong>大学研究</strong>
            <p>AP、カリキュラム、教授研究を確認</p>
          </div>
          <div>
            <span>3</span>
            <strong>出願対策</strong>
            <p>書類、小論文、面接を仕上げる</p>
          </div>
        </div>
      </section>

      <section class="section" id="topics">
        <div class="section-heading">
          <p class="eyebrow">Topics</p>
          <h2>扱うテーマ</h2>
        </div>
        <div class="topic-grid">
          <article>
            <h3>総合型選抜</h3>
            <p>制度の基本、スケジュール、出願条件、合格までの対策を整理します。</p>
          </article>
          <article>
            <h3>学校推薦型選抜</h3>
            <p>評定平均、推薦条件、専願・併願、校内選考に向けた準備を扱います。</p>
          </article>
          <article>
            <h3>書類・面接対策</h3>
            <p>志望理由書、自己PR、小論文、面接の作り方を具体例つきで解説します。</p>
          </article>
        </div>
      </section>

      <section class="section" id="articles">
        <div class="section-heading">
          <p class="eyebrow">Articles</p>
          <h2>記事一覧</h2>
        </div>
        <div class="article-grid">
          ${posts.map(renderPostCard).join("")}
        </div>
      </section>

      <section class="section compact">
        <div class="section-heading">
          <p class="eyebrow">Categories</p>
          <h2>分類</h2>
        </div>
        <div class="chips">
          ${categories.map((category) => `<span>${category}</span>`).join("")}
          ${tags.map((tag) => `<span>${tag}</span>`).join("")}
        </div>
      </section>
    </main>
  `);

  if (location.hash === "#articles" || location.hash === "#topics") {
    document.querySelector(location.hash)?.scrollIntoView();
  }
}

function renderPostCard(post: Post) {
  return `
    <article class="post-card">
      <div class="meta">${formatDate(post.date)} / ${post.readingMinutes}分</div>
      <h3><a href="${sitePath(`posts/${post.slug}/`)}">${post.title}</a></h3>
      <p>${post.summary}</p>
      <div class="chips">
        ${post.tags.slice(0, 4).map((tag) => `<span>${tag}</span>`).join("")}
      </div>
    </article>
  `;
}

function renderPost(post: Post) {
  document.title = `${post.title} | ${siteName}`;
  setMetaDescription(post.description);
  setCanonical(sitePath(`posts/${post.slug}/`));

  renderShell(`
    <main class="article-page">
      <a class="back-link" href="${sitePath()}#articles">記事一覧へ戻る</a>
      <article class="article">
        <header class="article-header">
          <div class="meta">${formatDate(post.date)} / 更新 ${formatDate(post.updated)} / ${post.readingMinutes}分</div>
          <h1>${post.title}</h1>
          <p>${post.description}</p>
          <div class="chips">
            ${post.tags.map((tag) => `<span>${tag}</span>`).join("")}
          </div>
        </header>
        <div class="article-body">${post.html}</div>
      </article>
    </main>
  `);
  window.scrollTo({ top: 0, behavior: "instant" });
}

function setMetaDescription(content: string) {
  const meta = document.querySelector<HTMLMetaElement>('meta[name="description"]');
  if (meta) meta.content = content;
}

function setCanonical(path: string) {
  const canonical = document.querySelector<HTMLLinkElement>('link[rel="canonical"]') ?? document.createElement("link");
  canonical.rel = "canonical";
  canonical.href = new URL(path, window.location.origin).href;
  if (!canonical.parentElement) document.head.appendChild(canonical);
}

window.addEventListener("popstate", route);
route();
