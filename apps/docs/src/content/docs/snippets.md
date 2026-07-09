---
title: 스니펫
---

문서 예제는 `apps/docs/snippets`를 단일 원천으로 사용합니다.

```ts
import { IWINVProvider } from "@k-msg/provider";
import { KMsg } from "k-msg";

const kmsg = new KMsg({
  providers: [
    new IWINVProvider({
      apiKey: process.env.IWINV_API_KEY ?? "",
      smsApiKey: process.env.IWINV_SMS_API_KEY,
      smsAuthKey: process.env.IWINV_SMS_AUTH_KEY,
    }),
  ],
});

await kmsg.send({
  to: "01012345678",
  text: "hello",
});
```
