# k-msg Docs 운영 가이드

`k-msg` 문서 사이트(`https://k-msg.and.guide`)의 운영/기여 기준 문서입니다.

- Framework: Astro + Starlight
- 기본 언어: `ko` (한국어), 보조 언어: `en`
- 루트 경로: `/` (한국어 루트 로케일), 영어 경로: `/en/`
- 배포 산출물: `apps/docs/dist`

## 1. 빠른 시작

리포 루트에서 실행합니다.

1. 의존성 설치: `bun install --frozen-lockfile`
2. 개발 서버: `bun run docs:dev`
3. 전체 빌드: `bun run docs:build`
4. 머지 전 검증: `bun run docs:check`

## 2. 문서 소스 원칙 (Single Source of Truth)

수동 작성 대상:

- `apps/docs/src/content/docs/cli.mdx`
- `apps/docs/src/content/docs/en/cli.mdx`
- `apps/docs/src/content/docs/snippets.mdx`
- `apps/docs/src/content/docs/en/snippets.mdx`
- `apps/docs/snippets/**` (코드 예제 원본)

자동 생성 대상:

- `apps/docs/src/content/docs/guides/**` (한국어 루트 로케일)
- `apps/docs/src/content/docs/en/guides/**`
- `apps/docs/src/content/docs/api/**` (루트 로케일 API 원본)
- `apps/docs/src/content/docs/en/api/**`
- `apps/docs/src/generated/cli/help.md`
- `apps/docs/src/generated/cli/schema.md`
- `apps/docs/typedoc.entrypoints.json`

규칙:

1. 자동 생성 파일은 직접 수정하지 않습니다.
2. 패키지/CLI/예제 변경 후에는 반드시 `bun run docs:generate`를 다시 실행합니다.
3. 문서 예제 코드는 `apps/docs/snippets/**`에서만 관리합니다.

## 3. 자동 문서화 구성

`bun run docs:generate`는 아래 순서로 실행됩니다.

1. `scripts/docs/collect-entrypoints.ts`
- 패키지 `exports`를 읽어 TypeDoc 엔트리포인트 자동 수집
- 출력: `apps/docs/typedoc.entrypoints.json`

2. `scripts/docs/generate-cli-help.ts`
- `apps/cli/src/k-msg.ts`의 help 출력 스냅샷 생성
- 출력: `apps/docs/src/generated/cli/help.md`

3. `scripts/docs/generate-schema-docs.ts`
- `apps/cli/schemas/*.json` 기반 스키마 문서 생성
- 출력: `apps/docs/src/generated/cli/schema.md`

4. `scripts/docs/generate-guides.ts`
- 루트/패키지/예제 `README*.md` 기반 가이드 생성
- 출력: `apps/docs/src/content/docs/guides/**`, `apps/docs/src/content/docs/en/guides/**`, `index.md`

모든 생성기는 `--check` 모드를 지원합니다.

`bun run docs:build`에는 아래 단계도 포함됩니다.

- `scripts/docs/ensure-git-history.ts` (문서 생성 전 실행)
- CI/Pages shallow clone 환경에서 sitemap `lastmod` 정확도를 위해 git history 보강 시도
- 기본 정책은 fail-open(경고 후 계속)이며, `DOCS_REQUIRE_GIT_HISTORY=1`을 설정하면 strict 모드로 실패 처리

## 4. API 문서 생성 방식

설정 파일:

- `apps/docs/astro.config.mjs`
- `apps/docs/typedoc.tsconfig.json`
- `apps/docs/plugins/sync-typedoc-locales.mjs`

동작:

1. `starlight-typedoc`가 `typedoc.entrypoints.json`으로 API 문서 생성
2. 원본 생성 경로: `src/content/docs/api/**`
3. 플러그인이 `en/api`로 동기화
4. `gitRevision: "main"` 고정으로 링크 드리프트 감소

## 5. 작업 절차 (기여자 기준)

코드 변경(`packages/*`, `apps/cli/*`, `examples/*`)이 있는 경우:

1. 코드 변경
2. `bun run docs:generate`
3. 생성 결과 확인
4. `bun run docs:check`
5. 커밋/푸시

문서 텍스트만 변경한 경우:

1. 문서 수정
2. 필요 시 `bun run docs:generate`
3. `bun run docs:check`
4. 커밋/푸시

## 6. CI 게이트

워크플로:

- `.github/workflows/ci.yml`의 `docs-check` job

트리거 기준:

- `packages/**`
- `apps/cli/**`
- `examples/**`
- `apps/docs/**`
- `scripts/docs/**`
- `package.json`
- `bun.lock`

검증 명령:

- `bun run docs:check`
- `bun run docs:check:sitemap-lastmod` (`docs:check`에 포함)
- 실패 시 PR merge 차단

## 7. Cloudflare Pages 운영값

- Project name: `k-msg`
- Production branch: `main`
- Build command: `bun install --frozen-lockfile && bun run docs:build`
- Output directory: `apps/docs/dist`
- Custom domain: `k-msg.and.guide`
- PR Preview: enabled

참고:

- `astro build` 완료 시 `sitemap-index.xml`이 `apps/docs/dist`에 생성됩니다.
- `apps/docs/astro.config.mjs`에서 sitemap `lastmod`, `changefreq`, `priority`를 커스터마이징합니다.
- `apps/docs/public/robots.txt`가 canonical sitemap URL을 공지합니다.

## 8. 트러블슈팅

`/api/` sitemap 항목의 `lastmod`가 모두 동일하게 보일 때:

1. 빌드 로그에서 `scripts/docs/ensure-git-history.ts` 로그를 확인합니다.
2. 아래 로그 중 하나가 보이는지 확인합니다.
- `ok: git history prepared via: ...`
- `ok: repository already has full history`
3. 경고 로그만 보이면 shallow 상태로 빌드되었을 가능성이 높고 `lastmod` 정밀도가 떨어질 수 있습니다.
4. CI/Pages에서 strict 강제를 원하면 `DOCS_REQUIRE_GIT_HISTORY=1`을 설정합니다.
