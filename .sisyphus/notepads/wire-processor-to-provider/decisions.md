## 2026-02-09
- Chose to loop over recipients in processSingleMessage because the Provider interface in @k-msg/core only supports single-recipient sending.
- Decided to throw an Error if ANY recipient fails to satisfy the requirement 'If send fails, throw error so job fails/retries', though this may cause duplicates for successful recipients on retry.
