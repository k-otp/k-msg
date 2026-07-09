import MarkdownIt from "markdown-it";
import type { DocsPage } from "./content";
import { renderPreviewBanner, sourceEditUrl } from "./content";
import { navigationLinks } from "./site";
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
    .article {
      border: 1px solid var(--border);
      border-radius: 1.5rem;
      background: var(--card);
      box-shadow: var(--shadow);
    }

    .meta {
      padding: 1rem 1.1rem;
      color: var(--muted);
      font-size: 0.95rem;
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

function navigationFor(localePrefix: string): string {
  return navigationLinks(localePrefix)
    .map(([href, label]) => `<a href="${href}">${label}</a>`)
    .join("");
}

export function renderPage(page: DocsPage): string {
  const localePrefix = page.route.startsWith("/en/") ? "/en" : "";
  const title = escapeHtml(page.title);
  const description = escapeHtml(
    page.description ??
      "k-msg documentation rendered by the Hono static docs app.",
  );
  const contentHtml = md.render(page.body);

  return `<!doctype html>
<html lang="${localePrefix === "/en" ? "en" : "ko"}">
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
        <nav class="nav">${navigationFor(localePrefix)}</nav>
      </section>

      <section class="content">
        <aside class="meta">
          <p><strong>Source</strong></p>
          <p><code>${escapeHtml(page.sourcePath)}</code></p>
          <p><a href="${escapeHtml(sourceEditUrl(page.sourcePath))}" target="_blank" rel="noopener noreferrer">View on GitHub</a></p>
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
