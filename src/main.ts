import { posts, type Post } from "./generated/posts";
import "./styles.css";

const app = document.querySelector<HTMLDivElement>("#app");

if (!app) {
  throw new Error("App root was not found.");
}

const formatDate = (date: string) =>
  new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(date));

const route = () => {
  const [, section, slug] = location.hash.split("/");
  if (section === "posts" && slug) {
    const post = posts.find((item) => item.slug === slug);
    renderPost(post ?? posts[0]);
    return;
  }
  renderHome();
};

function renderShell(content: string) {
  app.innerHTML = `
    <header class="site-header">
      <a class="brand" href="#">
        <span class="brand-mark">AO</span>
        <span>総合型・学校推薦型選抜ナビ</span>
      </a>
      <nav aria-label="主要ナビゲーション">
        <a href="#articles">記事一覧</a>
        <a href="#topics">対策分野</a>
      </nav>
    </header>
    ${content}
    <footer class="site-footer">
      <p>総合型選抜・学校推薦型選抜の準備を、書類・小論文・面接まで実践的に整理します。</p>
    </footer>
  `;
}

function renderHome() {
  const latest = posts[0];
  const categories = [...new Set(posts.flatMap((post) => post.categories))];
  const tags = [...new Set(posts.flatMap((post) => post.tags))].slice(0, 14);

  renderShell(`
    <main>
      <section class="hero">
        <div class="hero-copy">
          <p class="eyebrow">Admissions Strategy Journal</p>
          <h1>総合型・学校推薦型選抜の準備を、迷わず進める。</h1>
          <p class="lead">志望理由書、小論文、面接、保護者のサポートまで。年内入試で必要な考え方と具体策を、読みやすい記事にまとめています。</p>
          <div class="hero-actions">
            <a class="button primary" href="#articles">記事を読む</a>
            ${latest ? `<a class="button secondary" href="#/posts/${latest.slug}">最新記事</a>` : ""}
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
      <h3><a href="#/posts/${post.slug}">${post.title}</a></h3>
      <p>${post.summary}</p>
      <div class="chips">
        ${post.tags.slice(0, 4).map((tag) => `<span>${tag}</span>`).join("")}
      </div>
    </article>
  `;
}

function renderPost(post: Post) {
  document.title = `${post.title} | 総合型・学校推薦型選抜ナビ`;
  renderShell(`
    <main class="article-page">
      <a class="back-link" href="#articles">記事一覧へ戻る</a>
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

window.addEventListener("hashchange", route);
route();

