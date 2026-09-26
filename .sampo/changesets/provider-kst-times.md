---
npm/@k-msg/provider: patch
---

Send and read IWINV and Aligo times in Korea Standard Time regardless of the host timezone. Reservation times, history query ranges, and response timestamps were formatted and parsed in the host's local zone. On a UTC host such as Cloudflare Workers or most containers, a message scheduled for 10:00 in Seoul was reserved for 01:00, and delivery and template timestamps came back nine hours off.
