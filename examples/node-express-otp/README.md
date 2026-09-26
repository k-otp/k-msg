# Phone verification (OTP) with Express on Node.js

A phone-number verification service: `POST /otp/request` texts a 6-digit code
to a Korean mobile number and `POST /otp/verify` checks it. It shows k-msg
inside a flow that has to hold up in production: the provider and the sender
number come from configuration, codes are stored only as an HMAC and expire
after 5 minutes, sends are capped per number, per client address and for the
whole service, each code allows 5 verify attempts, the provider call has a
10-second timeout, and provider
failures become retryable or non-retryable HTTP errors without exposing the
provider's error text. Express 5 runs on Node.js 24, which executes the
TypeScript sources directly, so there is no build step.

## Run it locally

Requires Node.js 24 or later. The default `mock` provider needs no credentials
and sends nothing.

```bash
cd examples/node-express-otp
npm install
cp .env.example .env
sed -i.bak "s/^OTP_SECRET=.*/OTP_SECRET=$(openssl rand -hex 32)/" .env && rm .env.bak
npm run dev
```

Request a code:

```bash
curl -i -X POST http://localhost:3000/otp/request \
  -H 'content-type: application/json' \
  -d '{"phone":"010-1234-5678"}'
# 202 {"expiresInSeconds":300,"resendAfterSeconds":60}
```

Run the same command again within 60 seconds and it returns `429` with a
`Retry-After` header.

The mock provider delivers nothing and the server never logs codes, so there is
no code to type in locally. A wrong code still exercises the checks:

```bash
curl -i -X POST http://localhost:3000/otp/verify \
  -H 'content-type: application/json' \
  -d '{"phone":"010-1234-5678","code":"000000"}'
# 400 INVALID_CODE; the fifth wrong code and every try after it: 429 TOO_MANY_ATTEMPTS
```

To watch a code verify end to end, run the tests. They read the sent code from
the mock provider's history:

```bash
npm test
```

## Use a real provider

Set `KMSG_PROVIDER`, `KMSG_SENDER_NUMBER` (a sender number registered with that
provider, digits only) and the provider's credentials in `.env`:

| `KMSG_PROVIDER` | Variables |
| --- | --- |
| `iwinv` | `IWINV_API_KEY`, `IWINV_SMS_API_KEY`, `IWINV_SMS_AUTH_KEY`. `IWINVProvider` requires the AlimTalk key (`IWINV_API_KEY`) even when it only sends SMS. |
| `solapi` | `SOLAPI_API_KEY`, `SOLAPI_API_SECRET` |
| `aligo` | `ALIGO_API_KEY`, `ALIGO_USER_ID`; set `ALIGO_TEST_MODE=true` to have Aligo validate requests without sending them |

Only the selected provider's variables are read. If anything is missing or
invalid, the server exits at startup and lists every problem.

IWINV rejects requests from IP addresses that are not registered in its
console, so register your server's outbound IP there.

## Send limits

`POST /otp/request` refuses a code, and counts nothing, when any of these is
reached:

| Limit | Default | Response |
| --- | --- | --- |
| Per number | 1 code per 60 seconds, 5 per hour | `429 RATE_LIMITED` |
| Per client address | 20 codes per hour across all numbers | `429 RATE_LIMITED` |
| Whole service | `OTP_MAX_SENDS_PER_HOUR` codes per hour (1000) | `503 SERVICE_BUSY`, logged as a warning |

The per-client limit keeps one caller from texting many numbers, and the
service-wide limit caps what abuse spread over many addresses can cost. Size
`OTP_MAX_SENDS_PER_HOUR` above your peak hour. The per-number and per-client
constants are at the top of `src/otp/service.ts`.

The client address is `req.ip`. Behind a load balancer or reverse proxy, set
`TRUST_PROXY` to the number of proxies in front of the server (usually `1`), or
to their addresses (`loopback`, `10.0.0.0/8`); otherwise every request seems to
come from the proxy and shares one per-client limit. `TRUST_PROXY=true` is
refused because it would believe an `X-Forwarded-For` header that any caller
can set.

## Endpoints

Errors always have the shape `{"error":{"code":"...","message":"..."}}`.
Malformed JSON gets `400 INVALID_JSON`, a body over 1 KB gets
`413 PAYLOAD_TOO_LARGE`, a body in another charset or content encoding gets
`415 UNSUPPORTED_MEDIA_TYPE`, and an unknown path gets `404 NOT_FOUND`.

### `POST /otp/request`

Body: `{"phone":"010-1234-5678"}`. `01012345678` and `+82 10-1234-5678` are
accepted too.

| Status | Meaning |
| --- | --- |
| `202` | `{"expiresInSeconds":300,"resendAfterSeconds":60}`. The answer never depends on whether the number has an account. |
| `400` | `INVALID_PHONE` |
| `429` | `RATE_LIMITED`, with `Retry-After` in seconds: a per-number or per-client limit was reached (see [Send limits](#send-limits)), or the provider itself is rate limiting |
| `502` | `PROVIDER_ERROR`: the provider refused the send, usually because of credentials, balance or the sender number. The server log has the provider's message. |
| `503` | `SERVICE_BUSY`, with `Retry-After`: the service-wide limit was reached. `PROVIDER_UNAVAILABLE`: a network error or the 10-second timeout; try again later |

An accepted request counts toward the limits even when the send then fails, so
a client cannot hammer a provider that is failing.

### `POST /otp/verify`

Body: `{"phone":"010-1234-5678","code":"123456"}`

| Status | Meaning |
| --- | --- |
| `200` | `{"verified":true}`; the code is used up |
| `400` | `INVALID_REQUEST` for a missing or malformed phone or code, `INVALID_CODE` for a wrong, expired or already used code |
| `429` | `TOO_MANY_ATTEMPTS`: 5 wrong codes were entered; request a new one |

## Production checklist

- Replace `InMemoryOtpStore` (`src/otp/store.ts`) with a shared store such as
  Redis as soon as you run more than one instance, or if pending codes must
  survive a restart. Each `OtpStore` method must be atomic for a number, for
  example a Lua script for `reserveSend` and `recordAttempt` and a
  compare-and-delete for `consume`, with key TTLs of one hour for send counts
  and the code lifetime for challenges.
- The send limits slow abuse down but cannot tell a bot from a person. If
  `POST /otp/request` is reachable without login, put bot protection such as a
  CAPTCHA in front of it, and set `TRUST_PROXY` behind a proxy.
- After `{"verified":true}`, mark the number as verified in your session or
  user record; this example stops at the answer.
- Keep `OTP_SECRET` in a secret manager. Rotating it only invalidates codes
  that are still pending.
- Serve over HTTPS. Logs mask numbers (`010******78`) and never contain codes;
  keep it that way in anything you add.
- SOLAPI's SDK does not accept an abort signal, so the 10-second timeout does
  not cut SOLAPI calls short.
