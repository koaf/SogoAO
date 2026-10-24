import "./styles.css";

// Published pages contain the full HTML. Render in the browser only in dev.
if (import.meta.env.DEV) {
  const [{ posts }, view] = await Promise.all([
    import("./generated/posts"),
    import("./render.mjs"),
  ]);
  const app = document.querySelector<HTMLDivElement>("#app");
  if (!app) throw new Error("App root was not found.");

  const basePath = import.meta.env.BASE_URL;
  const pathname = window.location.pathname.slice(basePath.length - 1);
  const match = pathname.match(/^\/posts\/([^/]+)\/?$/);
  const post = match && posts.find((item) => item.slug === match[1]);
  const isHome = pathname === "/" || pathname === "/index.html";
  const isPrivacy = [view.privacyPage.pathname, ...view.privacyPage.aliases]
    .some((path) => pathname === `/${path}` || pathname === `/${path.slice(0, -1)}`);

  app.innerHTML = post
    ? view.renderPost(post, basePath)
    : isHome ? view.renderHome(posts, basePath)
    : isPrivacy ? view.renderPrivacy(basePath) : view.renderNotFound(basePath);
  document.title = post ? `${post.title} | ${view.siteName}` : isHome
    ? view.siteName : `${isPrivacy ? view.privacyPage.title : "ページが見つかりません"} | ${view.siteName}`;

  if (location.hash === "#articles" || location.hash === "#topics") {
    document.querySelector(location.hash)?.scrollIntoView();
  }
}
