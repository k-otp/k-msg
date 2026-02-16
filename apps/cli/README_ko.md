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

기본 설정 경로:

- macOS/Linux: `${XDG_CONFIG_HOME:-~/.config}/k-msg/k-msg.config.json`
- Windows: `%APPDATA%\\k-msg\\k-msg.config.json`
- fallback: `./k-msg.config.json` (홈 경로 파일이 없을 때 사용)

덮어쓰기:

```bash
k-msg --config /path/to/k-msg.config.json providers list
```

예시 파일: `apps/cli/k-msg.config.example.json`

스키마 URL:

- latest: `https://k-otp.github.io/k-msg/schemas/k-msg.config.schema.json`
- 버전 고정(`v1`): `https://k-otp.github.io/k-msg/schemas/k-msg.config.v1.schema.json`

설정 초기화:

```bash
# 기본: interactive wizard (TTY)
k-msg config init

# full 템플릿 강제 (non-interactive 환경에서는 자동 적용)
k-msg config init --template full

# provider를 단계적으로 추가
k-msg config provider add
k-msg config provider add iwinv
```

### `env:` 치환

`"env:NAME"` 형태 문자열은 런타임에 `NAME` 환경 변수 값으로 치환됩니다.
환경 변수가 없거나 비어 있으면, 런타임 provider가 필요한 명령은 종료 코드 `2`로 실패합니다.

## 명령어

- `k-msg config init|show|validate`
- `k-msg config provider add [type]`
- `k-msg providers list|health|doctor`
- `k-msg sms send`
- `k-msg alimtalk preflight|send`
- `k-msg send --input <json> | --file <path> | --stdin`
- `k-msg kakao channel categories|list|auth|add`
- `k-msg kakao template list|get|create|update|delete|request`

## 권장 AlimTalk 운영 흐름

1. provider 진단(`doctor`)을 먼저 실행합니다.
2. 실제 발송 전에 `preflight`로 채널/템플릿/정책 검증을 수행합니다.
3. 통과 후 `send`를 실행합니다.

```bash
k-msg providers doctor
k-msg alimtalk preflight --provider iwinv --template-code TPL_001 --channel main
k-msg alimtalk send --provider iwinv --template-code TPL_001 --to 01012345678 --vars '{"name":"Jane"}'
```

참고:

- iwinv는 카카오 채널 온보딩이 벤더 콘솔 수동 절차이므로 config의 manual 체크 상태를 유지해야 합니다.
- `required_if_no_inference` 정책 provider는 `plusId` 미입력 + 추론 불가 조합이면 preflight가 실패합니다.

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
  --channel main \
  --plus-id @my_channel
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

### Preflight

```bash
k-msg alimtalk preflight \
  --provider iwinv \
  --template-code TPL_001 \
  --channel main \
  --sender-key your_sender_key \
  --plus-id @my_channel
```

`preflight`는 발송 전에 onboarding check(수동/설정/capability/api probe)와 템플릿 조회를 검증합니다.

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

## Manual 체크 설정 예시

`k-msg.config.json`에 수동 온보딩 증빙을 저장해 `doctor/preflight`에서 사용합니다.

```json
{
  "onboarding": {
    "manualChecks": {
      "iwinv": {
        "channel_registered_in_console": {
          "done": true,
          "checkedAt": "2026-02-16T09:00:00+09:00",
          "note": "IWINV 콘솔에서 채널 승인 완료",
          "evidence": "internal-ticket-1234"
        }
      }
    }
  }
}
```
