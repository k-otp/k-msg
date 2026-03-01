# k-msg CLI (`apps/cli`)

이 CLI는 [Bunli](https://bunli.dev/)로 작성되었고, 통합 `k-msg` 패키지(KMsg + Providers)를 사용합니다.

## 설치 (curl 단일 경로)

```bash
curl -fsSL https://k-otp.github.io/k-msg/cli/install.sh | bash
k-msg --help
```

설치 스크립트 환경 변수:

- `K_MSG_CLI_VERSION`: 대상 버전 덮어쓰기 (기본값: Pages 스크립트의 최신 버전)
- `K_MSG_CLI_INSTALL_DIR`: 설치 디렉터리 강제 지정 (기본값: 쓰기 가능한 활성 `k-msg` 경로를 우선 감지하고, 실패 시 `~/.local/bin`)
- `K_MSG_CLI_BASE_URL`: release base URL 덮어쓰기 (기본값: `https://github.com/k-otp/k-msg/releases/download/cli-v<version>`)
- `K_MSG_CLI_SETUP_COMPLETIONS`: `false`로 설정하면 자동 shell completion 설정을 건너뜀 (기본값: `true`)
- `K_MSG_CLI_SHELL`: completion 설정용 쉘 감지값 강제 지정 (`zsh|bash|fish`)

사용자 안내 기준 CLI 설치 경로는 curl 설치 스크립트로 단일화했습니다.
다른 설치 경로는 이 문서에서 안내하지 않습니다.

기본 동작으로 설치 시 감지된 `zsh`, `bash`, `fish`에 대해 shell completion도 자동 설정됩니다.
셸 컨텍스트 기준 초기화 파일은 아래처럼 결정됩니다.
- `zsh`: `${ZDOTDIR:-$HOME}/.zshrc`
- `bash`: `~/.bashrc` + 로그인 프로필(`~/.bash_profile` 또는 `~/.profile`)
- `fish`: `~/.config/fish/completions/k-msg.fish`

## 실행 (local/dev)

```bash
# 커맨드 타입 생성
bun run --cwd apps/cli generate

# completion metadata 그래프 검증 (strict)
bun run --cwd apps/cli doctor:completions

# 네이티브 바이너리 빌드
bun run --cwd apps/cli build
./apps/cli/dist/k-msg --help

# Bun-runtime JS 번들 빌드 (선택)
bun run --cwd apps/cli build:js
bun --cwd apps/cli dist/k-msg.js --help

# 또는 TS 직접 실행 (dev)
bun --cwd apps/cli src/k-msg.ts --help
```

## Shell 자동완성

curl 설치 스크립트를 사용한 경우 감지된 쉘에 자동완성이 자동 설정됩니다.
아래 수동 설정은 경로를 직접 제어하거나 비표준 쉘 초기화 구성을 쓸 때만 필요합니다.
설치로 생성된 자동완성은 `kmsg` alias도 함께 지원합니다.

```bash
# shell completion 스크립트 출력
k-msg completions bash
k-msg completions zsh
k-msg completions fish
k-msg completions powershell

# completion 프로토콜 콜백 (쉘 스크립트 내부 사용)
k-msg complete -- ""
```

shell 초기화 예시:

```bash
# bash
k-msg completions bash > ~/.bash_completion.d/k-msg
source ~/.bash_completion.d/k-msg

# zsh
k-msg completions zsh > "${HOME}/.zfunc/_k-msg"
fpath+=("${HOME}/.zfunc")
autoload -Uz compinit && compinit
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
- `k-msg completions <bash|zsh|fish|powershell>`
- `k-msg send --input <json> | --file <path> | --stdin` (고급/Raw JSON 전용)
- `k-msg db schema print|generate`
- `k-msg db tracking migrate plan|apply|status|retry`
- `k-msg kakao channel binding list|resolve|set|delete`
- `k-msg kakao channel api categories|list|auth|add`
- `k-msg kakao template list|get|create|update|delete|request`

템플릿 명령 내부 동작:

- `kakao template *` 명령은 `@k-msg/template`의 `TemplateLifecycleService`를 통해 처리됩니다.
- `create/update`는 provider API 호출 전에 `validateTemplatePayload` + `parseTemplateButtons`로 `name/content/buttons`를 검증합니다.

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

## Tracking 마이그레이션 오케스트레이터

field crypto 전환(legacy -> secure)을 중단/재시작 가능하게 수행하는 명령입니다.

```bash
k-msg db tracking migrate plan --sqlite-file ./local.db
k-msg db tracking migrate apply --sqlite-file ./local.db
k-msg db tracking migrate status --sqlite-file ./local.db
k-msg db tracking migrate retry --sqlite-file ./local.db
```

운영 참고:

- 상태는 DB 메타테이블 + 로컬 스냅샷(`.kmsg/migrations`)에 함께 저장됩니다.
- `retry`는 실패한 청크만 재실행합니다.
- 롤아웃 플래그(`compatPlainColumns`) 변경 전 `status` 확인을 권장합니다.

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

## Kakao Channel

```bash
# config/provider-hint 기반 바인딩 관리 (api/manual/none provider 공통)
k-msg kakao channel binding list
k-msg kakao channel binding resolve --channel main
k-msg kakao channel binding set --alias main --provider aligo-main --sender-key SENDER_KEY --plus-id @my_channel
k-msg kakao channel binding delete --alias old-channel

# provider API 작업 (api 모드 provider만 가능, 예: aligo/mock)
k-msg kakao channel api categories --provider aligo-main
k-msg kakao channel api list --provider aligo-main
k-msg kakao channel api auth --provider aligo-main --plus-id @my_channel --phone 01012345678
k-msg kakao channel api add \
  --provider aligo-main \
  --plus-id @my_channel \
  --auth-num 123456 \
  --phone 01012345678 \
  --category-code 001001001 \
  --save main
```

레거시 안내: `k-msg kakao channel categories|list|auth|add`는 제거되었고, CLI는 `binding` / `api` 명령으로 안내합니다.

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
  - `2`: interactive prompt 취소 (`Ctrl+C`)
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
