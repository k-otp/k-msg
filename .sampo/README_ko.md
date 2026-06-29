# Sampo 운영 가이드

이 저장소는 **Sampo** 기반 changeset + 릴리즈 자동화를 사용합니다.

## 기본

- 변경사항(`packages/*`)이 있으면 changeset 추가:

  ```bash
  sampo add
  ```

- 로컬 릴리즈 미리보기:

  ```bash
  sampo release --dry-run
  ```

changeset 파일은 `.sampo/changesets/*.md`에 저장됩니다.

## Release PR 운영 정책

release workflow는 아래 두 조건이 모두 맞으면 `sampo/release` PR을 자동으로 생성하거나 갱신합니다.

- `has_changesets == true`
- `should_publish != true`

`should_publish`는 `scripts/publish-oidc.sh --check`에서 npm registry 상태로 계산됩니다.

즉, 기능 PR마다 changeset을 계속 포함해도 되고, `main` 머지 후 release PR은 workflow가 상시 관리합니다.

## 선택 사항: GitHub App

PR 단계에서 changeset 누락 알림까지 받고 싶다면 Sampo GitHub App을 설치할 수 있습니다.

- <https://github.com/apps/sampo-s-bot>

이 App은 changeset 누락만 알려주고, `sampo/release` PR 생성/갱신은 계속 release workflow가 담당합니다.
