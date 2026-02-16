# k-msg CLI (`apps/cli`)

이 CLI는 [Bunli](https://bunli.dev/)로 작성되었고, 통합 `k-msg` 패키지(KMsg + Providers)를 사용합니다.

## 설치 (권장)

### npm

```bash
npm install -g @k-msg/cli
# 또는: pnpm add -g @k-msg/cli

k-msg --help
```

참고: npm 패키지는 첫 실행 시 GitHub Releases에서 네이티브 바이너리를 내려받습니다.
(`bunli build:all` 산출물: `k-msg-cli-<version>-<target>.tar.gz`)
`checksums.txt`로 검증한 뒤 OS 캐시 디렉터리에 압축 해제/캐시합니다.
(`K_MSG_CLI_CACHE_DIR`로 경로를 덮어쓸 수 있습니다)

환경 변수 오버라이드:

- `K_MSG_CLI_BASE_URL`: GitHub release base URL 덮어쓰기 (기본값: `https://github.com/k-otp/k-msg/releases/download/cli-v<version>`)
- `K_MSG_CLI_CACHE_DIR`: 압축 해제된 바이너리 캐시 경로 덮어쓰기
- `K_MSG_CLI_LOCAL_BINARY`: 다운로드 대신 로컬 바이너리 복사(로컬 테스트 용도)

### curl 설치 스크립트 (GitHub Pages)

```bash
curl -fsSL https://k-otp.github.io/k-msg/cli/install.sh | bash
```

설치 스크립트 환경 변수:

- `K_MSG_CLI_VERSION`: 대상 버전 덮어쓰기 (기본값: Pages 스크립트의 최신 버전)
- `K_MSG_CLI_INSTALL_DIR`: 설치 디렉터리 (기본값: `~/.local/bin`)
- `K_MSG_CLI_BASE_URL`: release base URL 덮어쓰기 (기본값: `https://github.com/k-otp/k-msg/releases/download/cli-v<version>`)

### GitHub Releases (수동 설치)

배포 워크플로우는 아래 prebuilt 바이너리를 GitHub Releases에도 게시합니다:

- `k-msg-cli-<version>-darwin-arm64.tar.gz`
- `k-msg-cli-<version>-darwin-x64.tar.gz`
- `k-msg-cli-<version>-linux-arm64.tar.gz`
- `k-msg-cli-<version>-linux-x64.tar.gz`
- `k-msg-cli-<version>-windows-x64.tar.gz`

압축 해제 후 바이너리 경로는 `<target>/k-msg`(또는 `<target>/k-msg.exe`)입니다.

### macOS/Linux

```bash
tar -xzf k-msg-cli-<version>-<target>.tar.gz
sudo install -m 0755 <target>/k-msg /usr/local/bin/k-msg

# 선택: alias
sudo ln -sf /usr/local/bin/k-msg /usr/local/bin/kmsg

k-msg --help
```

### Windows

압축 파일을 해제한 뒤 `k-msg.exe`를 `PATH`에 포함된 위치에 두세요.
원하면 alias 용도로 `kmsg.exe`로도 복사할 수 있습니다.

## 실행 (local/dev)

```bash
# 커맨드 타입 생성
bun run --cwd apps/cli generate

# 네이티브 바이너리 빌드
bun run --cwd apps/cli build
./apps/cli/dist/k-msg --help

# Bun-runtime JS 번들 빌드 (선택)
bun run --cwd apps/cli build:js
bun --cwd apps/cli dist/k-msg.js --help

# 또는 TS 직접 실행 (dev)
bun --cwd apps/cli src/k-msg.ts --help
```

## 설정 (`k-msg.config.json`)

기본 설정 경로: `./k-msg.config.json`

덮어쓰기:

```bash
k-msg --config /path/to/k-msg.config.json providers list
```

예시 파일: `apps/cli/k-msg.config.example.json`

### `env:` 치환

`"env:NAME"` 형태 문자열은 런타임에 `NAME` 환경 변수 값으로 치환됩니다.
환경 변수가 없거나 비어 있으면, 런타임 provider가 필요한 명령은 종료 코드 `2`로 실패합니다.

## 명령어

- `k-msg config init|show|validate`
- `k-msg providers list|health`
- `k-msg sms send`
- `k-msg alimtalk send`
- `k-msg send --input <json> | --file <path> | --stdin`
- `k-msg kakao channel categories|list|auth|add`
- `k-msg kakao template list|get|create|update|delete|request`

## Send

### SMS

```bash
k-msg sms send --to 01012345678 --text "hello"
```

### AlimTalk

용어 규칙: CLI는 **Kakao Channel**과 **senderKey**를 사용합니다. (“profile” 용어는 사용하지 않음)

```bash
k-msg alimtalk send \
  --to 01012345678 \
  --template-code TPL_001 \
  --vars '{"name":"Jane"}' \
  --channel main
```

Failover 옵션:

```bash
k-msg alimtalk send \
  --to 01012345678 \
  --template-code TPL_001 \
  --vars '{"name":"Jane"}' \
  --failover true \
  --fallback-channel sms \
  --fallback-content "Fallback SMS text" \
  --fallback-title "Fallback LMS title"
```

프로바이더가 전송 warning(예: failover partial/unsupported)을 반환하면,
CLI는 텍스트 모드에서 `WARNING ...` 라인을 출력하고 `--json` 출력에도 포함합니다.

### 고급 JSON 전송

```bash
k-msg send --input '{"to":"01012345678","text":"hello"}'
```

## Kakao Channel (Aligo capability)

```bash
k-msg kakao channel categories
k-msg kakao channel list
k-msg kakao channel auth --plus-id @my_channel --phone 01012345678
k-msg kakao channel add \
  --plus-id @my_channel \
  --auth-num 123456 \
  --phone 01012345678 \
  --category-code 001001001 \
  --save main
```

## Kakao Template (IWINV/Aligo)

채널 스코프(Aligo): `--channel <alias>` 또는 `--sender-key <value>`를 사용하세요.

```bash
k-msg kakao template list
k-msg kakao template get --template-code TPL_001
k-msg kakao template create --name "Welcome" --content "Hello #{name}" --channel main
k-msg kakao template update --template-code TPL_001 --name "Updated"
k-msg kakao template delete --template-code TPL_001

# 검수 요청은 provider별 지원 여부가 다릅니다 (Aligo 지원)
k-msg kakao template request --template-code TPL_001 --channel main
```

## 출력 / 종료 코드

- `--json`: 기계 판독 가능한 JSON 출력
- AI 환경(Bunli `@bunli/plugin-ai-detect`): 에이전트가 감지되면 JSON 출력이 자동 활성화됩니다
  (`CLAUDECODE`, `CURSOR_AGENT`, `CODEX_CI` /
  `CODEX_SHELL` / `CODEX_THREAD_ID`, `MCP_SERVER_NAME` / `MCP_SESSION_ID` /
  `MCP_TOOL_NAME`)
- 종료 코드:
  - `0`: 성공
  - `2`: 입력/설정 오류
  - `3`: provider/network 오류
  - `4`: capability 미지원
