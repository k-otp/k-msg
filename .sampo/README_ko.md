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

## Release PR 생성 정책 (`AUTO_RELEASE_PR`)

자동 release PR 생성은 저장소 변수로 제어합니다.

- `AUTO_RELEASE_PR=false` (기본): `sampo/release` PR 자동 생성 안 함
- `AUTO_RELEASE_PR=true`: pending changeset이 있을 때 release PR 자동 생성 허용

워크플로우 조건:

- `vars.AUTO_RELEASE_PR == 'true'`
- `has_changesets == true`
- `should_publish != true`

`should_publish`는 `scripts/publish-oidc.sh --check`에서 npm registry 상태로 계산됩니다.

## 여러 PR을 묶어서 한 번에 릴리즈하는 권장 흐름

1. 일반 기능 PR 머지 기간에는 `AUTO_RELEASE_PR=false` 유지
2. 묶음의 마지막 PR 머지 직전에 `AUTO_RELEASE_PR=true`
3. 마지막 PR을 `main`에 머지해서 release PR 생성
4. release PR 생성 확인 후 다시 `AUTO_RELEASE_PR=false`

### 명령어

```bash
# 마지막 PR 머지 직전에 활성화
gh variable set AUTO_RELEASE_PR -b "true" -R k-otp/k-msg

# release PR 생성 후 비활성화
gh variable set AUTO_RELEASE_PR -b "false" -R k-otp/k-msg
```
