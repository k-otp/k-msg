---
title: 예제 가이드
description: 런타임과 목적에 따라 어떤 starter example부터 보는 게 맞는지 고릅니다.
---

런타임과 목적에 맞는 예제를 고를 수 있도록 정리한 허브입니다.

- OTP 발송과 검증: [node-express-otp](/guides/examples/node-express-otp/)
- 알림톡 주문 알림과 delivery tracking: [bun-order-notifications](/guides/examples/bun-order-notifications/)
- Cloudflare: [cloudflare-worker-d1](/guides/examples/cloudflare-worker-d1/)(tracking + 웹훅), [cloudflare-worker-queue-do](/guides/examples/cloudflare-worker-queue-do/)(큐), [cloudflare-worker-hyperdrive](/guides/examples/cloudflare-worker-hyperdrive/)(Postgres)

## 빠른 선택

| 목표 | 추천 예제 | 이 예제를 먼저 보면 좋은 경우 |
| --- | --- | --- |
| OTP·인증번호 | [node-express-otp](/guides/examples/node-express-otp/) | Node 백엔드에서 인증번호를 안전하게 보내고 검증해야 할 때 |
| 알림톡 + SMS 대체 발송 | [bun-order-notifications](/guides/examples/bun-order-notifications/) | 주문·배송 알림을 보내고 도달 여부까지 추적하고 싶을 때 |
| Workers에서 추적과 상태 웹훅 | [cloudflare-worker-d1](/guides/examples/cloudflare-worker-d1/) | Cloudflare에서 상태 변경을 다른 서비스로 알려야 할 때 |
| Workers에서 큐 기반 발송 | [cloudflare-worker-queue-do](/guides/examples/cloudflare-worker-queue-do/) | 요청과 발송을 분리하고 멱등 재시도가 필요할 때 |
| Workers에서 Postgres 추적 | [cloudflare-worker-hyperdrive](/guides/examples/cloudflare-worker-hyperdrive/) | 추적 데이터를 기존 Postgres에 두고 싶을 때 |

## 추천 읽는 순서

- 처음 보는 사용자: [node-express-otp](/guides/examples/node-express-otp/) 로 발송 흐름 하나를 끝까지 본 뒤 [bun-order-notifications](/guides/examples/bun-order-notifications/) 로 알림톡, 대체 발송, 추적을 확인
- Cloudflare 배포가 목표면: [cloudflare-worker-d1](/guides/examples/cloudflare-worker-d1/) -> [cloudflare-worker-queue-do](/guides/examples/cloudflare-worker-queue-do/), 추적 데이터를 Postgres에 둔다면 [cloudflare-worker-hyperdrive](/guides/examples/cloudflare-worker-hyperdrive/)
- 웹훅 중심 시스템이면: [cloudflare-worker-d1](/guides/examples/cloudflare-worker-d1/) 의 서명된 상태 웹훅과 검증하는 수신기부터

## 예제별 역할

- [bun-order-notifications](/guides/examples/bun-order-notifications/): Bun에서 알림톡(SMS 대체 발송), 배치 발송, SQLite delivery tracking을 다루는 주문 알림 예제입니다.
- [cloudflare-worker-d1](/guides/examples/cloudflare-worker-d1/): Workers + D1에서 cron으로 delivery tracking을 돌리고 상태 변경을 서명된 웹훅으로 알리는 예제입니다.
- [cloudflare-worker-hyperdrive](/guides/examples/cloudflare-worker-hyperdrive/): Workers + Hyperdrive(Postgres)에서 cron 폴링으로 delivery tracking을 하는 예제입니다.
- [cloudflare-worker-queue-do](/guides/examples/cloudflare-worker-queue-do/): Workers + Durable Objects로 멱등 발송 큐와 재시도를 구현한 예제입니다.
- [node-express-otp](/guides/examples/node-express-otp/): Node + Express로 OTP 발송과 검증을 구현한 예제입니다.
