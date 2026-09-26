---
npm/@k-msg/webhook: minor
---

Registering an endpoint no longer replaces or duplicates another one. The D1 endpoint store wrote with `INSERT OR REPLACE`, so adding an endpoint whose URL was already registered silently replaced it with a new id and secret, and updating an endpoint to another endpoint's URL deleted that endpoint. The in-memory store kept both endpoints for a repeated URL, so every event went out twice, and replaced an endpoint that had the same id. Both stores now reject a repeated id or URL on `add()`, and a URL another endpoint uses on `update()`, with the new `WebhookEndpointConflictError` (`field`, `value`, `endpointId`), which `addEndpoint()` and `updateEndpoint()` pass on; `addEndpoints()` checks the whole batch before storing any. To register the same endpoint on every deploy, catch the error and call `updateEndpoint(error.endpointId, input)`. Custom `WebhookEndpointStore` implementations should reject duplicates the same way.
