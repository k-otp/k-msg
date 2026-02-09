#!/bin/bash
set -e  # 에러 시 스크립트 중단

echo "🚀 Starting K-Message Release Process..."

# 0. 사전 체크
echo "📋 Pre-release checks..."
if [[ -n $(git status --porcelain) ]]; then
  echo "❌ Working directory is not clean. Please commit or stash changes."
  exit 1
fi

if [[ $(git branch --show-current) != "main" ]]; then
  echo "❌ Not on main branch. Please switch to main branch."
  exit 1
fi

# 1. 의존성 설치 및 업데이트
echo "📦 Installing dependencies..."
bun install

# 2. 테스트 실행
echo "🧪 Running tests..."
bun run test || {
  echo "❌ Tests failed. Aborting release."
  exit 1
}

# 3. 빌드 실행
echo "🔨 Building all packages..."
bun run build:all || {
  echo "❌ Build failed. Aborting release."
  exit 1
}

# 4. 버전 선택
echo "🔢 Select version increment:"
echo "1) patch (0.1.1 → 0.1.2)"
echo "2) minor (0.1.1 → 0.2.0)" 
echo "3) major (0.1.1 → 1.0.0)"
echo "4) custom version"
read -p "Choose (1-4): " version_choice

case $version_choice in
  1) VERSION_TYPE="patch" ;;
  2) VERSION_TYPE="minor" ;;
  3) VERSION_TYPE="major" ;;
  4) 
    read -p "Enter version (e.g., 1.2.3): " CUSTOM_VERSION
    VERSION_TYPE="$CUSTOM_VERSION"
    ;;
  *) echo "Invalid choice. Aborting."; exit 1 ;;
esac

# 5. 버전 업데이트
echo "📝 Updating version to $VERSION_TYPE..."
OLD_VERSION=$(bun pm pkg get version | tr -d '"')
bun pm version "$VERSION_TYPE"
NEW_VERSION=$(bun pm pkg get version | tr -d '"')

echo "✅ Version updated: $OLD_VERSION → $NEW_VERSION"

# 6. 다시 빌드 (버전 정보 포함)
echo "🔨 Rebuilding with new version..."
bun run build:all

# 7. 패킹 검증
echo "📦 Validating packages..."
bun run pack:dry

# 8. 배포 확인
echo "🚀 Ready to publish packages:"
echo "  - Version: $NEW_VERSION"
NUM_PACKAGES=$(bun pm ls | grep "@workspace" | wc -l | tr -d ' ')
echo "  - Packages: $NUM_PACKAGES packages"
read -p "Continue with publish? (y/N): " confirm

if [[ $confirm != "y" && $confirm != "Y" ]]; then
  echo "❌ Publish cancelled."
  exit 0
fi

# 9. 실제 배포
echo "🚀 Publishing packages..."
bun run publish:all || {
  echo "❌ Publish failed. Please check the errors above."
  exit 1
}

# 10. Git 태그 및 푸시
echo "🏷️ Creating git tag..."
git add .
git commit -m "Release v$NEW_VERSION" || echo "No changes to commit"
git tag "v$NEW_VERSION"
git push origin main
git push origin "v$NEW_VERSION"

echo "🎉 Release v$NEW_VERSION completed successfully!"
echo "📦 Published packages:"
bun run --filter '*' exec -- bash -c 'echo "  - $(bun pm pkg get name | tr -d "\"")@$(bun pm pkg get version | tr -d "\"")"'