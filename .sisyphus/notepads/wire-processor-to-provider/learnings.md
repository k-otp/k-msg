## 2026-02-09
- Wired MessageJobProcessor to Provider from @k-msg/core.
- Implemented processSingleMessage using a loop for multiple recipients.
- Integrated error throwing for job retries when sending fails.
- Updated tests with mock providers.
- Note: MessageRequest contains multiple recipients, while Provider.send is for single recipients, necessitating a loop.
