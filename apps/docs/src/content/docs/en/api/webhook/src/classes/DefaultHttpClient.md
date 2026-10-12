---
editUrl: false
next: false
prev: false
title: "DefaultHttpClient"
---

Defined in: [packages/webhook/src/services/webhook.dispatcher.ts:124](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/services/webhook.dispatcher.ts#L124)

Delivers only to the hosts it is given, over HTTPS, and never follows a
redirect.

`allowedHosts` entries are exact hostnames, compared in lowercase without a
trailing dot: DNS names, public IPv4 addresses, and IPv6 addresses in
brackets (`[2001:db8::1]`). Write an internationalized name as punycode
(`xn--...`). A URL, a port, credentials, a path and a wildcard throw
`TypeError`.

Port: only the host is compared, so an entry trusts every port of that host
(`https://hooks.example.com:6379/`). Trust only hosts whose every port you
control.

DNS: it checks names, not addresses. A trusted name that resolves to a
private address is still fetched, so it is not a defense against DNS
rebinding. For arbitrary customer URLs, inject an `HttpClient` that pins
DNS or filters egress.

## Implements

- [`HttpClient`](/en/api/webhook/src/interfaces/httpclient/)

## Constructors

### Constructor

> **new DefaultHttpClient**(`allowedHosts?`): `DefaultHttpClient`

Defined in: [packages/webhook/src/services/webhook.dispatcher.ts:126](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/services/webhook.dispatcher.ts#L126)

#### Parameters

##### allowedHosts?

readonly `string`[] = `[]`

#### Returns

`DefaultHttpClient`

## Methods

### assertAllowed()

> **assertAllowed**(`url`): `URL`

Defined in: [packages/webhook/src/services/webhook.dispatcher.ts:135](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/services/webhook.dispatcher.ts#L135)

Parses the URL and throws unless fetch() would deliver to it: HTTPS, a
public host, no credentials, and a host in `allowedHosts`
(`WebhookHostNotAllowedError`).

#### Parameters

##### url

`string`

#### Returns

`URL`

***

### fetch()

> **fetch**(`url`, `_options`): `Promise`\<`Response`\>

Defined in: [packages/webhook/src/services/webhook.dispatcher.ts:144](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/services/webhook.dispatcher.ts#L144)

#### Parameters

##### url

`string`

##### \_options

`RequestInit`

#### Returns

`Promise`\<`Response`\>

#### Implementation of

[`HttpClient`](/en/api/webhook/src/interfaces/httpclient/).[`fetch`](/en/api/webhook/src/interfaces/httpclient/#fetch)
