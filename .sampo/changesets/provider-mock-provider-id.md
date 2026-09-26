---
npm/@k-msg/provider: minor
---

`MockProvider` takes an optional `id` (`new MockProvider({ id: "mock-sms" })`), which `KMsg` routes by and which results and errors report, so two mocks can stand in for different providers, for example to try `routing.byType` without credentials. The id defaults to `"mock"`, an empty id throws, and `getOnboardingSpec()` returns the mock spec whatever the id.
