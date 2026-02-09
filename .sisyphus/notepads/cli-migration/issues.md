## Build Issues
- @k-msg/core and @k-msg/provider had build errors during 'bun run build:all' due to missing/incorrect exports in index.ts and platform.ts.
- However, @k-msg/messaging built successfully, and apps/cli built successfully using it.
