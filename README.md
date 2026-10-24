# WABI-LAB 年内受験対策

総合型選抜、学校推薦型選抜、志望理由書、小論文、面接対策の記事を掲載する WABI-LAB の Vite 製静的ブログです。

## 開発

```bash
npm install
npm run dev
```

記事は `content/posts/<slug>/index.md` に追加します。書き方は `docs/article-writing-guide.md` を参照してください。ビルド時に `scripts/generate-posts.mjs` が Markdown を読み込み、サイト用のデータを生成します。

## 公開

初回だけ GitHub のリポジトリ設定で `Settings` -> `Pages` -> `Build and deployment` -> `Source` を `GitHub Actions` にしてください。

その後は `main` ブランチへ push すると、GitHub Actions が `npm run build` を実行し、GitHub Pages に自動公開します。

## SEO

ビルド時に `sitemap.xml`、`robots.txt`、各記事の静的HTMLを `dist` に生成します。

トップページと全記事は、本文・記事へのリンク・ページ固有のタイトル／説明・canonicalを含むHTMLとして出力します。記事には `BlogPosting` の構造化データも付けます。公開ページはJavaScriptを実行しなくても閲覧できます。開発サーバーと静的HTMLの表示は `src/render.mjs` で共通管理します。

存在しないURLは、記事一覧へのリンクがある `noindex` の404ページを表示します。HTTPからHTTPS、wwwありからwwwなしへの転送はGitHub Pages側の正常なURL統一として維持します。

`npm run build` の後に `npm run check:seo` を実行すると、全記事の本文・正規URL・メタデータ・サイト内リンク・404ページを検証します。GitHub Actionsでも公開前に実行します。

このサイトの公開URLは `https://wabi-lab.blog/` です。GitHub Actions では `SITE_URL=https://wabi-lab.blog/`、`BASE_PATH=/` を使ってビルドします。

GitHub Pages の Custom domain には `wabi-lab.blog` を設定してください。`public/CNAME` も同じドメインで管理しています。

公開後は Google Search Console にサイトを登録し、`https://wabi-lab.blog/sitemap.xml` を送信してください。
