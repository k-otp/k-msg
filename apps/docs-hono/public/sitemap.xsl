<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0"
  xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
  xmlns:s="http://www.sitemaps.org/schemas/sitemap/0.9">
  <xsl:output method="html" encoding="UTF-8" indent="yes" />

  <xsl:template match="/">
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <title>k-msg Sitemap</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; margin: 24px; }
          h1 { margin: 0 0 12px; }
          p { color: #555; margin: 0 0 16px; }
          table { border-collapse: collapse; width: 100%; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background: #f7f7f7; }
          a { color: #0b57d0; text-decoration: none; }
          a:hover { text-decoration: underline; }
        </style>
      </head>
      <body>
        <xsl:choose>
          <xsl:when test="s:sitemapindex">
            <h1>k-msg Sitemap Index</h1>
            <p>Total sitemap files: <xsl:value-of select="count(s:sitemapindex/s:sitemap)" /></p>
            <table>
              <thead>
                <tr>
                  <th>Sitemap</th>
                  <th>Last Modified</th>
                </tr>
              </thead>
              <tbody>
                <xsl:for-each select="s:sitemapindex/s:sitemap">
                  <tr>
                    <td><a href="{s:loc}"><xsl:value-of select="s:loc" /></a></td>
                    <td><xsl:value-of select="s:lastmod" /></td>
                  </tr>
                </xsl:for-each>
              </tbody>
            </table>
          </xsl:when>

          <xsl:when test="s:urlset">
            <h1>k-msg URL Sitemap</h1>
            <p>Total URLs: <xsl:value-of select="count(s:urlset/s:url)" /></p>
            <table>
              <thead>
                <tr>
                  <th>URL</th>
                  <th>Last Modified</th>
                  <th>Change Frequency</th>
                  <th>Priority</th>
                </tr>
              </thead>
              <tbody>
                <xsl:for-each select="s:urlset/s:url">
                  <tr>
                    <td><a href="{s:loc}"><xsl:value-of select="s:loc" /></a></td>
                    <td><xsl:value-of select="s:lastmod" /></td>
                    <td><xsl:value-of select="s:changefreq" /></td>
                    <td><xsl:value-of select="s:priority" /></td>
                  </tr>
                </xsl:for-each>
              </tbody>
            </table>
          </xsl:when>

          <xsl:otherwise>
            <h1>k-msg Sitemap</h1>
            <p>Unsupported XML structure.</p>
          </xsl:otherwise>
        </xsl:choose>
      </body>
    </html>
  </xsl:template>
</xsl:stylesheet>
