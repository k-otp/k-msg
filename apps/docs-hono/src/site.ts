export const siteOrigin = (
  process.env.DOCS_SITE_URL ?? "https://k-msg.and.guide"
).replace(/\/+$/, "");

export const repoUrl = (
  process.env.DOCS_REPO_URL ?? "https://github.com/k-otp/k-msg"
).replace(/\/+$/, "");

export const repoBranch = encodeURIComponent(
  process.env.DOCS_REPO_BRANCH ?? "main",
);

export function navigationLinks(
  localePrefix: string,
): Array<readonly [string, string]> {
  return [
    [localePrefix || "/", "Home"],
    [`${localePrefix}/guides/overview/`, "Overview"],
    [`${localePrefix}/guides/getting-started/`, "Getting Started"],
    [`${localePrefix}/guides/package-selection/`, "Package Selection"],
    [`${localePrefix}/guides/provider-selection/`, "Provider Selection"],
    [`${localePrefix}/api/`, "API"],
    [`${localePrefix}/cli/`, "CLI"],
    [`${localePrefix}/snippets/`, "Snippets"],
  ];
}

export function pathSitemapMeta(pathname: string): {
  changefreq: string;
  priority: number;
} {
  if (pathname === "/" || pathname === "/en/") {
    return { changefreq: "daily", priority: 1.0 };
  }
  if (pathname.endsWith("/cli/") || pathname.endsWith("/snippets/")) {
    return { changefreq: "weekly", priority: 0.9 };
  }
  if (pathname.includes("/guides/")) {
    return { changefreq: "weekly", priority: 0.8 };
  }
  return { changefreq: "weekly", priority: 0.7 };
}

export function robotsText(): string {
  return `User-agent: *\nAllow: /\n\nSitemap: ${siteOrigin}/sitemap-index.xml\n`;
}
