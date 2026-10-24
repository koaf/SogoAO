import type { Post } from "./generated/posts";

export const siteName: string;
export const siteDescription: string;
export function escapeHtml(value: unknown): string;
export function renderHome(posts: readonly Post[], basePath?: string): string;
export function renderPost(post: Post, basePath?: string): string;
export function renderNotFound(basePath?: string): string;
