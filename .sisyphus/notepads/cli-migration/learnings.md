## CLI Migration to KMsg Architecture
- Replaced AlimTalkPlatform with KMsg and IWINVAdapter.
- Updated message sending commands to use the Result pattern (result.isSuccess).
- Mapped CLI options to the new SendOptions structure.
- Simplified health and info commands for the new architecture.
- Added @k-msg/messaging dependency to apps/cli.
