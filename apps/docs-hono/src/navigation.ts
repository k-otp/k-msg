export type DocsLocale = "en" | "ko";

type LocalizedLabel = Partial<Record<DocsLocale, string>>;

export type DocsNavLink = {
  id: string;
  labels?: LocalizedLabel;
  type: "link";
};

export type DocsNavGroup = {
  items: DocsNavEntry[];
  labels: Record<DocsLocale, string>;
  type: "group";
};

export type DocsNavEntry = DocsNavGroup | DocsNavLink;

export const docsTopNav: DocsNavLink[] = [
  {
    id: "index",
    labels: { en: "Home", ko: "홈" },
    type: "link",
  },
  {
    id: "guides/overview",
    labels: { en: "Overview", ko: "개요" },
    type: "link",
  },
  {
    id: "guides/getting-started",
    labels: { en: "Getting Started", ko: "시작하기" },
    type: "link",
  },
  {
    id: "guides/package-selection",
    labels: { en: "Package Selection", ko: "패키지 선택" },
    type: "link",
  },
  {
    id: "guides/provider-selection",
    labels: { en: "Provider Selection", ko: "Provider 선택" },
    type: "link",
  },
  {
    id: "api",
    labels: { en: "API", ko: "API" },
    type: "link",
  },
  {
    id: "cli",
    labels: { en: "CLI", ko: "CLI" },
    type: "link",
  },
  {
    id: "snippets",
    labels: { en: "Snippets", ko: "코드 스니펫" },
    type: "link",
  },
];

export const docsSidebar: DocsNavEntry[] = [
  {
    id: "index",
    labels: { en: "Home", ko: "홈" },
    type: "link",
  },
  {
    items: [
      { id: "guides/overview", type: "link" },
      { id: "guides/getting-started", type: "link" },
      { id: "guides/package-selection", type: "link" },
      { id: "guides/provider-selection", type: "link" },
      { id: "guides/message-types", type: "link" },
      { id: "guides/troubleshooting", type: "link" },
      {
        items: [
          { id: "guides/use-cases", type: "link" },
          { id: "guides/use-cases/otp-verification", type: "link" },
          { id: "guides/use-cases/order-notification", type: "link" },
          { id: "guides/use-cases/marketing-message", type: "link" },
        ],
        labels: { en: "Use Cases", ko: "사용 사례" },
        type: "group",
      },
      {
        items: [
          { id: "guides/packages", type: "link" },
          { id: "guides/packages/k-msg", type: "link" },
          { id: "guides/packages/analytics", type: "link" },
          { id: "guides/packages/channel", type: "link" },
          { id: "guides/packages/core", type: "link" },
          { id: "guides/packages/messaging", type: "link" },
          { id: "guides/packages/provider", type: "link" },
          { id: "guides/packages/template", type: "link" },
          { id: "guides/packages/webhook", type: "link" },
        ],
        labels: { en: "Packages", ko: "Packages" },
        type: "group",
      },
      {
        items: [
          { id: "guides/examples", type: "link" },
          { id: "guides/examples/express-node-send-only", type: "link" },
          { id: "guides/examples/hono-bun-send-only", type: "link" },
          { id: "guides/examples/hono-pages-send-only", type: "link" },
          {
            id: "guides/examples/hono-pages-tracking-hyperdrive",
            type: "link",
          },
          { id: "guides/examples/hono-worker-queue-do", type: "link" },
          { id: "guides/examples/hono-worker-tracking-d1", type: "link" },
          { id: "guides/examples/hono-worker-webhook-d1", type: "link" },
        ],
        labels: { en: "Examples", ko: "Examples" },
        type: "group",
      },
      {
        items: [
          { id: "guides/security", type: "link" },
          { id: "guides/security/glossary", type: "link" },
          { id: "guides/security/field-crypto-v1", type: "link" },
          { id: "guides/security/key-management-rotation", type: "link" },
          { id: "guides/security/migration-orchestrator", type: "link" },
          { id: "guides/security/auto-mitigation", type: "link" },
          { id: "guides/security/recipes", type: "link" },
          { id: "guides/security/kr-b2b-retention", type: "link" },
        ],
        labels: { en: "Security", ko: "보안" },
        type: "group",
      },
    ],
    labels: { en: "Guides", ko: "가이드" },
    type: "group",
  },
  {
    id: "cli",
    labels: { en: "CLI", ko: "CLI" },
    type: "link",
  },
  {
    id: "snippets",
    labels: { en: "Snippets", ko: "코드 스니펫" },
    type: "link",
  },
  {
    id: "api",
    labels: { en: "API", ko: "API" },
    type: "link",
  },
];

export function docsRouteFromId(id: string, locale: DocsLocale): string {
  const prefix = locale === "en" ? "/en" : "";
  if (id === "index") {
    return prefix ? `${prefix}/` : "/";
  }
  return `${prefix}/${id}/`;
}

export function flattenGuideIds(
  entries: DocsNavEntry[] = docsSidebar,
): string[] {
  const output = new Set<string>();

  function visit(list: DocsNavEntry[]): void {
    for (const entry of list) {
      if (entry.type === "group") {
        visit(entry.items);
        continue;
      }

      if (entry.id.startsWith("guides/")) {
        output.add(entry.id.toLowerCase());
      }
    }
  }

  visit(entries);
  return [...output];
}

export function labelForNavLink(
  link: DocsNavLink,
  locale: DocsLocale,
  fallback: string,
): string {
  return (
    link.labels?.[locale] ??
    link.labels?.[locale === "en" ? "ko" : "en"] ??
    fallback
  );
}
