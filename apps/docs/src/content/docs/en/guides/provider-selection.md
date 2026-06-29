---
title: "Provider Selection"
description: "Compare IWINV, SOLAPI, and Aligo for your K-Message deployment."
---

K-Message supports multiple provider backends. The right choice depends on your channel mix, onboarding expectations, and whether you need one provider or a routed combination.

## Quick comparison

| Provider | Strongest fit | Notable strengths | Notes |
| --- | --- | --- | --- |
| IWINV | AlimTalk-focused flows | Kakao-centric APIs, template operations, clear split between Kakao and SMS APIs | Good when Kakao messaging is central |
| SOLAPI | Broad channel coverage | Wide channel support, TypeScript SDK, strong developer ecosystem | Good default for mixed channel needs |
| Aligo | Simpler SMS-centric or cost-sensitive setups | Straightforward setup for common send flows | Feature surface is narrower than SOLAPI |

## How to choose

### Choose IWINV if

- AlimTalk is your primary business channel
- you want provider APIs that map closely to Kakao template workflows
- you are comfortable with separate Kakao and SMS configuration surfaces

### Choose SOLAPI if

- you need the broadest channel support
- you expect to use SMS, LMS, AlimTalk, FriendTalk, or adjacent channels together
- your team wants the safest default for general-purpose production use

### Choose Aligo if

- your use case is operationally simple
- you want a lightweight provider choice for SMS-heavy workloads
- you do not need the richest channel matrix

## Example: single-provider setup

```ts
import { KMsg } from "k-msg";
import { SolapiProvider } from "@k-msg/provider/solapi";

const kmsg = new KMsg({
  providers: [
    new SolapiProvider({
      apiKey: process.env.SOLAPI_API_KEY!,
      apiSecret: process.env.SOLAPI_API_SECRET!,
      defaultFrom: "01000000000",
    }),
  ],
});
```

## Example: route AlimTalk separately

This is common when you want one provider for SMS and a different one for Kakao channels.

```ts
import { KMsg } from "k-msg";
import { IWINVProvider } from "@k-msg/provider";
import { SolapiProvider } from "@k-msg/provider/solapi";

const kmsg = KMsg.builder()
  .addProvider(
    new SolapiProvider({
      apiKey: process.env.SOLAPI_API_KEY!,
      apiSecret: process.env.SOLAPI_API_SECRET!,
      defaultFrom: "01000000000",
    }),
  )
  .addProvider(
    new IWINVProvider({
      apiKey: process.env.IWINV_API_KEY!,
      baseUrl: "https://alimtalk.bizservice.iwinv.kr",
      smsApiKey: process.env.IWINV_SMS_API_KEY,
      smsAuthKey: process.env.IWINV_SMS_AUTH_KEY,
      smsSenderNumber: "01000000000",
    }),
  )
  .withRouting({
    defaultProviderId: "solapi",
    byType: {
      ALIMTALK: "iwinv",
    },
  })
  .build();
```

## Example: current AlimTalk API shape

Use `templateId`, not the removed `templateCode` field.

```ts
await kmsg.send({
  type: "ALIMTALK",
  to: "01012345678",
  templateId: "AUTH_OTP",
  variables: { code: "123456" },
});
```

## Selection checklist

Before you commit to a provider, answer these questions:

- Which channels must be available on day one?
- Do you need AlimTalk template operations through provider APIs?
- Is one provider enough, or do you want channel-based routing?
- Which onboarding model fits your team: simple setup or richer provider-specific flows?

## Onboarding expectations and CLI flow

Provider readiness in the CLI is modeled as a vendor prerequisite path, not as a generic channel verification state.

| Provider | Vendor prerequisite path | What the CLI expects | Practical note |
| --- | --- | --- | --- |
| `iwinv` | manual console approval | config values, manual evidence under `onboarding.manualChecks.iwinv`, template probe | good when your team can handle console-based Kakao approval separately |
| `aligo` | API-backed Kakao channel path | config values, Kakao channel probe, template probe, plusId inference guidance | good when you want more API-visible Kakao operations |
| `solapi` | external metadata + explicit binding | config values, explicit `pfId/profileId`, explicit `plusId` when inference is unavailable | good when broad channel coverage matters more than Kakao onboarding APIs |

Recommended CLI sequence:

1. `k-msg config init` or `k-msg config provider add`
2. `k-msg providers doctor`
3. `k-msg alimtalk preflight --provider <id> --template-id <code> ...`
4. `k-msg alimtalk send --interactive` or `k-msg sms send --interactive`

The interactive send commands only fill missing input fields. They do not replace `preflight`, and the raw JSON `k-msg send` command remains automation-oriented.

## Next steps

- [Message Type Guide](/en/guides/message-types/) to decide which channels matter most
- [Examples](/en/guides/examples/) for runtime-specific starter projects
- [Use Case Guides](/en/guides/use-cases/) for OTP, order notification, and marketing flows
