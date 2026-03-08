---
title: 예제 가이드
description: 런타임과 목적에 따라 어떤 starter example부터 보는 게 맞는지 고릅니다.
---

런타임과 목적에 맞는 예제를 고를 수 있도록 정리한 허브입니다.

- 첫 send-only 검증: [express-node-send-only](/guides/examples/express-node-send-only/)
- Cloudflare queue/tracking: [hono-worker-queue-do](/guides/examples/hono-worker-queue-do/), [hono-worker-tracking-d1](/guides/examples/hono-worker-tracking-d1/)
- Webhook runtime: [hono-worker-webhook-d1](/guides/examples/hono-worker-webhook-d1/)

## 빠른 선택

| 목표 | 추천 예제 | 이 예제를 먼저 보면 좋은 경우 |
| --- | --- | --- |
| 가장 빨리 send-only 검증 | [express-node-send-only](/guides/examples/express-node-send-only/) | Node 서버에서 가장 단순한 성공 경로가 필요할 때 |
| Bun 기반의 가벼운 API 서버 | [hono-bun-send-only](/guides/examples/hono-bun-send-only/) | Bun + Hono 조합으로 빠르게 시작할 때 |
| Pages Functions에 send-only 배포 | [hono-pages-send-only](/guides/examples/hono-pages-send-only/) | Cloudflare Pages에 간단히 올릴 때 |
| Workers에서 큐 처리 | [hono-worker-queue-do](/guides/examples/hono-worker-queue-do/) | Durable Objects 기반 비동기 처리 흐름이 필요할 때 |
| Workers + D1 배달 추적 | [hono-worker-tracking-d1](/guides/examples/hono-worker-tracking-d1/) | Cloudflare에서 tracking 저장소까지 같이 보고 싶을 때 |
| Pages + Hyperdrive 추적 | [hono-pages-tracking-hyperdrive](/guides/examples/hono-pages-tracking-hyperdrive/) | Pages 런타임에서 Hyperdrive를 붙일 때 |
| 웹훅 수신과 runtime 운영 | [hono-worker-webhook-d1](/guides/examples/hono-worker-webhook-d1/) | 이벤트 수집, 재시도, persistence까지 보고 싶을 때 |

## 추천 읽는 순서

- 처음 보는 사용자: [express-node-send-only](/guides/examples/express-node-send-only/) 또는 [hono-bun-send-only](/guides/examples/hono-bun-send-only/) 로 send-only 흐름을 먼저 확인
- Cloudflare 배포가 목표면: [hono-pages-send-only](/guides/examples/hono-pages-send-only/) -> [hono-worker-queue-do](/guides/examples/hono-worker-queue-do/) -> [hono-worker-tracking-d1](/guides/examples/hono-worker-tracking-d1/)
- 웹훅 중심 시스템이면: [hono-worker-webhook-d1](/guides/examples/hono-worker-webhook-d1/) 부터 보고 필요 시 [hono-worker-tracking-d1](/guides/examples/hono-worker-tracking-d1/) 를 함께 참고

## 예제별 역할

- [express-node-send-only](/guides/examples/express-node-send-only/): 가장 단순한 Node + Express send-only 서버 예제입니다.
- [hono-bun-send-only](/guides/examples/hono-bun-send-only/): Bun + Hono 기반의 빠른 send-only API 예제입니다.
- [hono-pages-send-only](/guides/examples/hono-pages-send-only/): Cloudflare Pages Functions용 send-only 스타터입니다.
- [hono-pages-tracking-hyperdrive](/guides/examples/hono-pages-tracking-hyperdrive/): Pages + Hyperdrive 기반 delivery tracking 예제입니다.
- [hono-worker-queue-do](/guides/examples/hono-worker-queue-do/): Workers + Durable Objects 큐 처리 예제입니다.
- [hono-worker-tracking-d1](/guides/examples/hono-worker-tracking-d1/): Workers + D1 delivery tracking 예제입니다.
- [hono-worker-webhook-d1](/guides/examples/hono-worker-webhook-d1/): Workers + D1 웹훅 runtime 예제입니다.
