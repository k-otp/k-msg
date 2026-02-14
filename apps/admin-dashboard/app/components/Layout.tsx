import type { Child, FC } from "hono/jsx";

interface LayoutProps {
  title?: string;
  children: Child;
}

export const Layout: FC<LayoutProps> = ({
  title = "K-Message Admin Dashboard",
  children,
}) => {
  return (
    <html lang="ko">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>{title}</title>
        <script src="https://cdn.tailwindcss.com"></script>
      </head>
      <body class="bg-gray-100">{children}</body>
    </html>
  );
};
