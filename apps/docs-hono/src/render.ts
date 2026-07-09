import MarkdownIt from "markdown-it";
import type { DocsPage } from "./content";
import { renderPreviewBanner, sourceEditUrl } from "./content";
import {
  type DocsLocale,
  type DocsNavEntry,
  docsRouteFromId,
  docsSidebar,
  docsTopNav,
  labelForNavLink,
} from "./navigation";
import { escapeHtml, escapeScriptString } from "./utils";

const md = new MarkdownIt({
  breaks: true,
  html: false,
  linkify: true,
  typographer: true,
});

const analyticsEnabled = process.env.NODE_ENV === "production";
const gaMeasurementId = process.env.GA_MEASUREMENT_ID ?? "G-2924TMM32H";
const clarityProjectId = process.env.CLARITY_PROJECT_ID ?? "vlennjsv6z";

function analyticsScripts(): string {
  if (!analyticsEnabled) {
    return "";
  }

  const safeGaMeasurementId = escapeScriptString(gaMeasurementId);
  const safeClarityProjectId = escapeScriptString(clarityProjectId);

  return `
    <script defer src="https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(gaMeasurementId)}"></script>
    <script>
      window.dataLayer = window.dataLayer || [];
      function gtag(){ dataLayer.push(arguments); }
      gtag('js', new Date());
      gtag('config', '${safeGaMeasurementId}');
    </script>
    <script>
      (function(c,l,a,r,i,t,y){
        c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
        t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/" + i;
        y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
      })(window, document, "clarity", "script", "${safeClarityProjectId}");
    </script>
  `;
}

function layoutStyles(): string {
  return `
    :root {
      color-scheme: light;
      --bg: #f5f1e8;
      --card: rgba(255, 252, 245, 0.86);
      --border: rgba(67, 47, 23, 0.12);
      --ink: #1f1a14;
      --muted: #6e6256;
      --accent: #0c7a5d;
      --accent-2: #d86a3f;
      --accent-bg: rgba(12, 122, 93, 0.1);
      --accent-ink: #0f5b46;
      --shadow: 0 24px 70px rgba(41, 28, 16, 0.12);
      --code: #f2ebe0;
      font-family: "Iowan Old Style", "Palatino Linotype", "Book Antiqua", serif;
    }

    * { box-sizing: border-box; }
    body {
      margin: 0;
      color: var(--ink);
      background:
        radial-gradient(circle at top, rgba(216, 106, 63, 0.12), transparent 28rem),
        linear-gradient(180deg, #fbf7ef 0%, var(--bg) 100%);
    }

    a { color: var(--accent); }
    code {
      background: var(--code);
      border-radius: 0.35rem;
      padding: 0.1rem 0.3rem;
    }

    pre {
      overflow-x: auto;
      padding: 1rem;
      border-radius: 1rem;
      background: #1d1916;
      color: #f8f3eb;
      box-shadow: inset 0 0 0 1px rgba(255,255,255,0.05);
    }

    pre code {
      padding: 0;
      background: transparent;
      color: inherit;
    }

    .shell {
      max-width: 1180px;
      margin: 0 auto;
      padding: 2rem 1.25rem 4rem;
    }

    .masthead {
      display: grid;
      gap: 1rem;
      margin-bottom: 1.5rem;
      padding: 1.5rem;
      border: 1px solid var(--border);
      border-radius: 1.75rem;
      background: linear-gradient(135deg, rgba(255,255,255,0.72), rgba(248,238,224,0.9));
      box-shadow: var(--shadow);
    }

    .eyebrow {
      text-transform: uppercase;
      letter-spacing: 0.16em;
      font-size: 0.72rem;
      color: var(--accent-2);
      margin: 0;
    }

    .masthead h1 {
      margin: 0;
      font-size: clamp(2rem, 4vw, 3.6rem);
      line-height: 0.96;
    }

    .masthead p {
      margin: 0;
      max-width: 60ch;
      color: var(--muted);
      font-size: 1rem;
    }

    .nav {
      display: flex;
      flex-wrap: wrap;
      gap: 0.65rem;
    }

    .nav a {
      display: inline-flex;
      align-items: center;
      padding: 0.55rem 0.8rem;
      border-radius: 999px;
      border: 1px solid var(--border);
      text-decoration: none;
      background: rgba(255,255,255,0.78);
      color: var(--ink);
    }

    .content {
      display: grid;
      gap: 1rem;
      grid-template-columns: minmax(0, 1fr);
    }

    .meta,
    .sidebar-nav,
    .article {
      border: 1px solid var(--border);
      border-radius: 1.5rem;
      background: var(--card);
      box-shadow: var(--shadow);
    }

    .sidebar-column {
      display: grid;
      gap: 1rem;
      align-content: start;
    }

    .meta,
    .sidebar-nav {
      padding: 1rem 1.1rem;
    }

    .meta {
      color: var(--muted);
      font-size: 0.95rem;
    }

    .sidebar-nav h2,
    .sidebar-nav h3 {
      margin: 0 0 0.65rem;
      font-size: 0.92rem;
      color: var(--muted);
      letter-spacing: 0.02em;
      text-transform: uppercase;
    }

    .sidebar-nav ul {
      list-style: none;
      margin: 0;
      padding: 0;
      display: grid;
      gap: 0.25rem;
    }

    .sidebar-nav ul ul {
      margin-top: 0.35rem;
      padding-left: 0.85rem;
      border-left: 1px solid var(--border);
    }

    .sidebar-nav li {
      display: grid;
      gap: 0.35rem;
    }

    .sidebar-nav a {
      display: block;
      padding: 0.45rem 0.6rem;
      border-radius: 0.8rem;
      text-decoration: none;
      color: var(--ink);
    }

    .sidebar-nav a.is-active {
      background: var(--accent-bg);
      color: var(--accent-ink);
      font-weight: 600;
    }

    .sidebar-nav .group-label {
      font-size: 0.86rem;
      color: var(--muted);
      font-weight: 600;
      padding: 0.2rem 0.1rem;
    }

    .article {
      padding: 1.5rem;
    }

    .preview-note {
      margin: 0 0 1rem;
      padding: 0.8rem 1rem;
      border-radius: 1rem;
      border: 1px solid rgba(12, 122, 93, 0.18);
      background: rgba(12, 122, 93, 0.08);
      color: #105744;
    }

    @media (min-width: 960px) {
      .content {
        grid-template-columns: 280px minmax(0, 1fr);
      }
    }
  `;
}

function renderTopNav(locale: DocsLocale): string {
  return docsTopNav
    .map((link) => {
      const href = docsRouteFromId(link.id, locale);
      const fallback = link.id === "index" ? "Home" : link.id;
      const label = labelForNavLink(link, locale, fallback);
      return `<a href="${escapeHtml(href)}">${escapeHtml(label)}</a>`;
    })
    .join("");
}

function fallbackTitleFromId(id: string): string {
  const lastSegment = id.split("/").at(-1) ?? id;
  return lastSegment.replaceAll("-", " ");
}

function renderSidebarEntries(params: {
  currentRoute: string;
  entries: DocsNavEntry[];
  locale: DocsLocale;
  titles: ReadonlyMap<string, string>;
}): string {
  return `<ul>${params.entries
    .map((entry) => {
      if (entry.type === "group") {
        return `<li><span class="group-label">${escapeHtml(entry.labels[params.locale])}</span>${renderSidebarEntries(
          {
            ...params,
            entries: entry.items,
          },
        )}</li>`;
      }

      const href = docsRouteFromId(entry.id, params.locale);
      const title =
        params.titles.get(href) ??
        labelForNavLink(entry, params.locale, fallbackTitleFromId(entry.id));
      const activeClass = href === params.currentRoute ? "is-active" : "";

      return `<li><a class="${activeClass}" href="${escapeHtml(href)}">${escapeHtml(title)}</a></li>`;
    })
    .join("")}</ul>`;
}

export function renderPage(
  page: DocsPage,
  titles: ReadonlyMap<string, string>,
): string {
  const locale: DocsLocale = page.route.startsWith("/en/") ? "en" : "ko";
  const title = escapeHtml(page.title);
  const description = escapeHtml(
    page.description ??
      "k-msg documentation rendered by the Hono static docs app.",
  );
  const contentHtml = md.render(page.body);

  return `<!doctype html>
<html lang="${locale}">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${title}</title>
    <meta name="description" content="${description}" />
    <style>${layoutStyles()}</style>
    ${analyticsScripts()}
  </head>
  <body>
    <main class="shell">
      <section class="masthead">
        <p class="eyebrow">Static docs runtime</p>
        <h1>${title}</h1>
        <p>${description}</p>
        <nav class="nav">${renderTopNav(locale)}</nav>
      </section>

      <section class="content">
        <aside class="sidebar-column">
          <nav class="sidebar-nav">
            <h2>${locale === "en" ? "Browse" : "둘러보기"}</h2>
            ${renderSidebarEntries({
              currentRoute: page.route,
              entries: docsSidebar,
              locale,
              titles,
            })}
          </nav>
          <section class="meta">
            <p><strong>Source</strong></p>
            <p><code>${escapeHtml(page.sourcePath)}</code></p>
            <p><a href="${escapeHtml(sourceEditUrl(page.sourcePath))}" target="_blank" rel="noopener noreferrer">View on GitHub</a></p>
          </section>
        </aside>
        <article class="article">
          ${renderPreviewBanner(page.sourcePath)}
          ${contentHtml}
        </article>
      </section>
    </main>
  </body>
</html>`;
}
