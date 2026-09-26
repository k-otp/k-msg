---
npm/@k-msg/template: minor
---

Format template date variables in Korea Standard Time regardless of the host timezone. The `date`, `datetime`, and `time` formatters and custom `date:` patterns used the host's local zone, so on a UTC host (Cloudflare Workers, most containers) a message sent at 08:30 in Seoul showed the previous day's date. The new `timeZone` option (default `"Asia/Seoul"`) selects another zone.
