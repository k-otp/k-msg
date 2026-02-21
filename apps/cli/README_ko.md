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
- `K_MSG_CLI_INSTALL_DIR`: 설치 디렉터리 강제 지정 (기본값: 쓰기 가능한 활성 `k-msg` 경로를 우선 감지하고, 실패 시 `~/.local/bin`)
- `K_MSG_CLI_BASE_URL`: release base URL 덮어쓰기 (기본값: `https://github.com/k-otp/k-msg/releases/download/cli-v<version>`)

PATH 충돌 관련 참고:

- 설치 스크립트는 가능하면 현재 PATH에서 활성화된 `k-msg` 경로를 우선 업데이트하고, 설치 경로와 활성 경로가 다를 때도 활성 경로를 함께 갱신합니다. 이전 bun/npm/curl 설치본이 남아 버전이 뒤섞이는 문제를 줄이기 위한 동작입니다.

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
k-msg providers list --config /path/to/k-msg.config.json
```

참고: 현재 CLI에서는 `--config`가 상위 명령 옵션이 아니라 하위 명령 옵션(예: `providers`, `sms`, `alimtalk`)입니다.

예시 파일: `apps/cli/k-msg.config.example.json`

스키마 URL:

- latest: `https://raw.githubusercontent.com/k-otp/k-msg/main/apps/cli/schemas/k-msg.config.schema.json`
- 버전 고정(`v1`): `https://raw.githubusercontent.com/k-otp/k-msg/main/apps/cli/schemas/k-msg.config.v1.schema.json`

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

### 프로바이더 발송 값 준비 가이드

발송 전에 어떤 값을 준비해야 하는지 헷갈릴 때는 아래 순서로 확인하세요.

1. provider credential을 `env:` 참조로 설정합니다.
2. `k-msg providers doctor`로 계정/설정 준비 상태를 점검합니다.
3. AlimTalk는 실제 발송 전에 `k-msg alimtalk preflight`를 실행합니다.
4. preflight 통과 후 `send`를 실행합니다.

환경 변수 예시:

```bash
# Aligo
export ALIGO_API_KEY="..."
export ALIGO_USER_ID="..."
export ALIGO_SENDER_KEY="..."   # Kakao senderKey
export ALIGO_SENDER="029302266" # SMS/LMS 발신번호

# IWINV
export IWINV_API_KEY="..."          # AlimTalk 키
export IWINV_SMS_API_KEY="..."      # SMS/LMS/MMS 키
export IWINV_SMS_AUTH_KEY="..."     # SMS/LMS/MMS 시크릿
export IWINV_SMS_COMPANY_ID="..."   # status/balance 맥락
export IWINV_SENDER_NUMBER="029302266"

# SOLAPI
export SOLAPI_API_KEY="..."
export SOLAPI_API_SECRET="..."
export SOLAPI_DEFAULT_FROM="029302266"
export SOLAPI_KAKAO_PF_ID="..."     # Kakao profileId(pfId)
```

프로바이더/채널별 필수값:

| Provider | 채널 | 필수 config 키 | 발송 시 필수값 | 참고 |
| --- | --- | --- | --- | --- |
| `aligo` | `SMS/LMS/MMS` | `apiKey`, `userId` | `to`, `text`, 발신번호 (`--from` 또는 `aligo.config.sender`) | MMS는 이미지 입력도 필요 |
| `aligo` | `ALIMTALK` | `apiKey`, `userId` | `to`, `template-id`, `vars`, senderKey (`--sender-key`/`--channel` alias/`aligo.config.senderKey`), 발신번호 (`--from` 또는 `aligo.config.sender`) | `preflight`에서 채널/템플릿 접근성 확인 |
| `iwinv` | `SMS/LMS/MMS` | `apiKey`, `smsApiKey`, `smsAuthKey` | `to`, `text`, 발신번호 (`--from` 또는 `iwinv.config.smsSenderNumber`/`senderNumber`) | MMS는 바이너리 이미지 입력 필요 |
| `iwinv` | `ALIMTALK` | `apiKey` | `to`, `template-id`, `vars` | failover/reSend 활성화 시 callback 발신번호 필요 (`--from` 또는 config sender) |
| `solapi` | `SMS/LMS/MMS` | `apiKey`, `apiSecret` | `to`, `text`, 발신번호 (`--from` 또는 `solapi.config.defaultFrom`) | MMS는 이미지 입력도 필요 |
| `solapi` | `ALIMTALK` | `apiKey`, `apiSecret` | `to`, `template-id`, `vars`, profileId/pfId (`--sender-key`/채널 alias 또는 `solapi.config.kakaoPfId`) | preflight 정책 점검용 `plusId`는 `--plus-id` 또는 channel/default alias로 지정 |
| `mock` | 전체 | 없음 | 최소 메시지 필드 (`to`, `text` 또는 `template-id`/`vars`) | 로컬 테스트용 provider |

## 명령어

- `k-msg config init|show|validate`
- `k-msg config provider add [type]`
- `k-msg providers list|health|doctor`
- `k-msg sms send`
- `k-msg alimtalk preflight|send`
- `k-msg send --input <json> | --file <path> | --stdin` (고급/Raw JSON 전용)
- `k-msg db schema print|generate`
- `k-msg kakao channel categories|list|auth|add`
- `k-msg kakao template list|get|create|update|delete|request`

## DB 스키마 제네레이터

`@k-msg/messaging/adapters/cloudflare`의 스키마 유틸을 그대로 사용해
SQL DDL / Drizzle 스키마 소스를 생성합니다.

```bash
# drizzle+sql 모두 stdout 출력
k-msg db schema print --dialect postgres

# queue 스키마만 SQL로 출력
k-msg db schema print --dialect postgres --target queue --format sql

# 현재 디렉터리에 두 파일 생성
k-msg db schema generate --dialect postgres

# SQL만 커스텀 경로로 생성
k-msg db schema generate \
  --dialect mysql \
  --target tracking \
  --format sql \
  --out-dir ./db \
  --sql-file tracking.sql
```

옵션:

- `--dialect <postgres|mysql|sqlite>`: 필수
- `--target <tracking|queue|both>`: 기본값 `both`
- `--format <drizzle|sql|both>`: 기본값 `both`
- `generate` 전용:
  - `--out-dir <path>` 기본 현재 디렉터리
  - `--drizzle-file <name>` 기본 `kmsg.schema.ts`
  - `--sql-file <name>` 기본 `kmsg.schema.sql`
  - `--force` 기본 `false` (없으면 기존 파일 존재 시 실패)

## 권장 AlimTalk 운영 흐름

1. provider 진단(`doctor`)을 먼저 실행합니다.
2. 실제 발송 전에 `preflight`로 채널/템플릿/정책 검증을 수행합니다.
3. 통과 후 `send`를 실행합니다.

```bash
k-msg providers doctor
k-msg alimtalk preflight --provider iwinv --template-id TPL_001 --channel main
k-msg alimtalk send --provider iwinv --template-id TPL_001 --to 01012345678 --vars '{"name":"Jane"}'
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
  --template-id TPL_001 \
  --vars '{"name":"Jane"}' \
  --channel main \
  --plus-id @my_channel
```

Failover 옵션:

```bash
k-msg alimtalk send \
  --to 01012345678 \
  --template-id TPL_001 \
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
  --template-id TPL_001 \
  --channel main \
  --sender-key your_sender_key \
  --plus-id @my_channel
```

`preflight`는 발송 전에 onboarding check(수동/설정/capability/api probe)와 템플릿 조회를 검증합니다.

### 고급 JSON 전송

`k-msg send`는 Raw `SendInput` JSON(객체/배열) 전용 고급 명령입니다.
일반 발송 흐름은 `k-msg sms send`, `k-msg alimtalk send` 사용을 권장합니다.

```bash
k-msg send --input '{"to":"01012345678","text":"hello"}'
```

실제 발송 없이 단건 미리보기:

```bash
k-msg send --input '{"to":"01012345678","text":"hello"}' --dry-run
```

실제 발송 없이 배치 미리보기:

```bash
k-msg send --input '[{"to":"01011112222","text":"hello 1"},{"to":"01033334444","text":"hello 2"}]' --dry-run
```

`providers doctor`와 `send --dry-run`의 역할은 다릅니다:

- `k-msg providers doctor`: provider/account/capability 준비 상태 점검
- `k-msg send --dry-run`: 요청 payload 미리보기/검증 (실제 전송 없음)

Boolean 플래그 규칙 (`--json`, `--verbose`, `--dry-run`, `--stdin`, `--failover`, `--force` 공통):

- `--flag` -> `true`
- `--flag true` -> `true`
- `--flag false` -> `false`
- `--no-flag` -> `false`
- 잘못된 boolean 값(예: `--dry-run maybe`)은 종료 코드 `2`로 실패합니다

같은 값이 여러 소스에 있을 때 우선순위:

- `CLI flag > environment variable > config file > built-in default`

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
k-msg kakao template get --template-id TPL_001
k-msg kakao template create --name "Welcome" --content "Hello #{name}" --channel main
k-msg kakao template update --template-id TPL_001 --name "Updated"
k-msg kakao template delete --template-id TPL_001

# 검수 요청은 provider별 지원 여부가 다릅니다 (Aligo 지원)
k-msg kakao template request --template-id TPL_001 --channel main
```

## 출력 / 종료 코드

- `--json`: 기계 판독 가능한 JSON 출력
- AI 환경(Bunli `@bunli/plugin-ai-detect`): 에이전트가 감지되면 JSON 출력이 자동 활성화됩니다
  (`CLAUDECODE`, `CURSOR_AGENT`, `CODEX_CI` /
  `CODEX_SHELL` / `CODEX_THREAD_ID`, `MCP_SERVER_NAME` / `MCP_SESSION_ID` /
  `MCP_TOOL_NAME`)
- AI 환경에서도 `--json false`(또는 `--no-json`)를 주면 텍스트 출력으로 강제할 수 있습니다
- 종료 코드:
  - `0`: 성공
  - `2`: 입력/설정 오류
  - `3`: provider/network 오류
  - `4`: 지원되지 않는 기능(capability) (예: provider의 `balance` 미지원)

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
