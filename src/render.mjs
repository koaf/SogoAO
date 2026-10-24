export const siteName = "WABI-LAB 年内受験対策";
export const siteDescription = "WABI-LAB 年内受験対策は、総合型選抜・学校推薦型選抜・志望理由書・小論文・面接対策をわかりやすく整理する受験ブログです。";

export function escapeHtml(value) {
  return String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
}

const formatDate = (date) => new Intl.DateTimeFormat("ja-JP", {
  year: "numeric", month: "long", day: "numeric", timeZone: "Asia/Tokyo",
}).format(new Date(date));

function sitePath(basePath, pathname = "") {
  return `${basePath}${pathname.replace(/^\//, "")}`;
}

function renderShell(content, basePath) {
  return `
    <header class="site-header">
      <a class="brand" href="${sitePath(basePath)}">
        <span class="brand-mark">WL</span>
        <span>${siteName}</span>
      </a>
      <nav aria-label="主要ナビゲーション">
        <a href="${sitePath(basePath)}#articles">記事一覧</a>
        <a href="${sitePath(basePath)}#topics">対策分野</a>
      </nav>
    </header>
    ${content}
    <footer class="site-footer">
      <p>WABI-LABが、総合型選抜・学校推薦型選抜の準備を実践的に整理します。</p>
    </footer>
  `;
}

export function renderHome(posts, basePath = "/") {
  const latest = posts[0];
  const categories = [...new Set(posts.flatMap((post) => post.categories))];
  const tags = [...new Set(posts.flatMap((post) => post.tags))].slice(0, 14);

  return renderShell(`
    <main>
      <section class="hero">
        <div class="hero-copy">
          <p class="eyebrow">WABI-LAB Admissions Journal</p>
          <h1>年内受験の準備を、迷わず進める。</h1>
          <p class="lead">志望理由書、小論文、面接、保護者のサポートまで。年内入試で必要な考え方と具体策を、読みやすい記事にまとめています。</p>
          <div class="hero-actions">
            <a class="button primary" href="${sitePath(basePath)}#articles">記事を読む</a>
            ${latest ? `<a class="button secondary" href="${sitePath(basePath, `posts/${latest.slug}/`)}">最新記事</a>` : ""}
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
          ${posts.map((post) => renderPostCard(post, basePath)).join("")}
        </div>
      </section>

      <section class="section compact">
        <div class="section-heading">
          <p class="eyebrow">Categories</p>
          <h2>分類</h2>
        </div>
        <div class="chips">
          ${categories.map((category) => `<span>${escapeHtml(category)}</span>`).join("")}
          ${tags.map((tag) => `<span>${escapeHtml(tag)}</span>`).join("")}
        </div>
      </section>
    </main>
  `, basePath);
}

function renderPostCard(post, basePath) {
  return `
    <article class="post-card">
      <div class="meta">${formatDate(post.date)} / ${post.readingMinutes}分</div>
      <h3><a href="${sitePath(basePath, `posts/${post.slug}/`)}">${escapeHtml(post.title)}</a></h3>
      <p>${escapeHtml(post.summary)}</p>
      <div class="chips">
        ${post.tags.slice(0, 4).map((tag) => `<span>${escapeHtml(tag)}</span>`).join("")}
      </div>
    </article>
  `;
}

export function renderPost(post, basePath = "/") {
  return renderShell(`
    <main class="article-page">
      <a class="back-link" href="${sitePath(basePath)}#articles">記事一覧へ戻る</a>
      <article class="article">
        <header class="article-header">
          <div class="meta">${formatDate(post.date)} / 更新 ${formatDate(post.updated)} / ${post.readingMinutes}分</div>
          <h1>${escapeHtml(post.title)}</h1>
          <p>${escapeHtml(post.description)}</p>
          <div class="chips">
            ${post.tags.map((tag) => `<span>${escapeHtml(tag)}</span>`).join("")}
          </div>
        </header>
        <div class="article-body">${post.html}</div>
      </article>
    </main>
  `, basePath);
}

export function renderNotFound(basePath = "/") {
  return renderShell(`
    <main class="article-page">
      <article class="article">
        <h1>ページが見つかりません</h1>
        <p>URLをご確認いただくか、記事一覧からお探しください。</p>
        <a class="back-link" href="${sitePath(basePath)}#articles">記事一覧へ戻る</a>
      </article>
    </main>
  `, basePath);
}
