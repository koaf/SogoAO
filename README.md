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

