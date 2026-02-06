# Provider Migration Plan - Adapter Pattern Implementation

## 🎯 목표

현재 하드코딩된 IWINV 구조에서 **확장 가능한 Adapter Pattern 기반 아키텍처**로 마이그레이션하여 다양한 프로바이더(Aligo, 기타) 지원을 위한 확장성 확보

## 📊 현재 상태 분석

### 기존 구조의 문제점
```typescript
// ❌ 현재: 하드코딩된 IWINV 전용 구조
export class IWINVProvider extends BaseAlimTalkProvider {
  public async send(request: AlimTalkRequest): Promise<AlimTalkResult> {
    // IWINV 특화 로직 하드코딩
    const response = await fetch(`${this.config.baseUrl}/send/`, {
      headers: { 'AUTH': btoa(this.config.apiKey) },
      body: JSON.stringify(iwinvSpecificPayload)
    });
  }
}
```

### 프로바이더별 구조 차이점
| 구분 | IWINV | Aligo | 기타 고려사항 |
|------|-------|-------|---------------|
| **Base URL** | `alimtalk.bizservice.iwinv.kr` | `smartsms.aligo.in` | 다양한 도메인 |
| **인증 방식** | `AUTH: base64(apiKey)` | `apikey + userid` | OAuth, JWT 등 |
| **요청 형식** | `{templateCode, phone, ...}` | `{profile_key, receiver, ...}` | GraphQL, XML 등 |
| **응답 형식** | `{code: "0", message}` | `{code: 0, message}` | 다양한 구조 |
| **상태 코드** | `"0"=성공, 기타=실패` | `0=성공, 음수=실패` | HTTP status 등 |

## 🏗️ 목표 아키텍처

### 1. Adapter Pattern 기반 구조
```
┌─────────────────────────────────────┐
│         Application Layer           │
├─────────────────────────────────────┤
│    Unified Provider Interface       │  ← 표준화된 인터페이스
│  send(StandardRequest): StandardResult
├─────────────────────────────────────┤
│         Provider Adapters           │  ← 프로바이더별 변환 레이어
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ │
│  │  IWINV  │ │  Aligo  │ │ Custom  │ │
│  │ Adapter │ │ Adapter │ │ Adapter │ │
│  └─────────┘ └─────────┘ └─────────┘ │
├─────────────────────────────────────┤
│      Provider Implementations      │  ← 각 프로바이더 고유 로직
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ │
│  │  IWINV  │ │  Aligo  │ │ Custom  │ │
│  │  Client │ │  Client │ │  Client │ │
│  └─────────┘ └─────────┘ └─────────┘ │
└─────────────────────────────────────┘
```

### 2. 표준화된 인터페이스 정의
```typescript
// ✅ 목표: 표준화된 요청/응답 형식
interface StandardRequest {
  templateCode: string;
  phoneNumber: string;
  variables: Record<string, string>;
  options?: {
    scheduledAt?: Date;
    priority?: 'high' | 'normal' | 'low';
  };
}

interface StandardResult {
  messageId: string;
  status: 'sent' | 'failed' | 'pending';
  provider: string;
  timestamp: Date;
  error?: StandardError;
}
```

## 🚀 마이그레이션 계획

### Phase 1: 아키텍처 기반 구축 (Week 1-2)

#### 1.1 Base Adapter 인터페이스 정의
```typescript
// packages/provider/src/adapters/base.adapter.ts
export abstract class BaseProviderAdapter {
  abstract adaptRequest(standard: StandardRequest): any;
  abstract adaptResponse(response: any): StandardResult;
  abstract mapErrorResponse(error: any): StandardError;
  abstract getAuthHeaders(config: any): Record<string, string>;
}
```

#### 1.2 Provider Registry 시스템
```typescript
// packages/provider/src/registry/provider.registry.ts
export class ProviderRegistry {
  private adapters = new Map<string, BaseProviderAdapter>();

  register(type: string, adapter: BaseProviderAdapter): void;
  createProvider(type: string, config: any): UniversalProvider;
  getAvailableProviders(): string[];
}
```

#### 1.3 Universal Provider 구현
```typescript
// packages/provider/src/universal/universal.provider.ts
export class UniversalProvider implements BaseProvider {
  constructor(
    private adapter: BaseProviderAdapter,
    private config: ProviderConfig
  ) {}

  async send(request: StandardRequest): Promise<StandardResult> {
    const adaptedRequest = this.adapter.adaptRequest(request);
    const response = await this.makeHttpRequest(adaptedRequest);
    return this.adapter.adaptResponse(response);
  }
}
```

### Phase 2: IWINV Adapter 구현 (Week 2-3)

#### 2.1 IWINV Adapter 생성
```typescript
// packages/provider/src/adapters/iwinv.adapter.ts
export class IWINVAdapter extends BaseProviderAdapter {
  adaptRequest(standard: StandardRequest): IWINVRequest {
    return {
      templateCode: standard.templateCode,
      reserve: standard.options?.scheduledAt ? 'Y' : 'N',
      sendDate: standard.options?.scheduledAt?.toISOString(),
      list: [{
        phone: standard.phoneNumber,
        templateParam: Object.values(standard.variables)
      }]
    };
  }

  adaptResponse(response: IWINVResponse): StandardResult {
    return {
      messageId: response.seqNo?.toString() || this.generateId(),
      status: response.code === 200 ? 'sent' : 'failed',
      provider: 'iwinv',
      timestamp: new Date(),
      error: response.code !== 200 ? {
        code: response.code.toString(),
        message: response.message
      } : undefined
    };
  }
}
```

#### 2.2 기존 IWINV Provider 마이그레이션
```typescript
// 기존 IWINVProvider를 Adapter 기반으로 변경
export class IWINVProvider extends UniversalProvider {
  constructor(config: IWINVConfig) {
    const adapter = new IWINVAdapter();
    super(adapter, config);
  }
}
```

### Phase 3: Aligo Adapter 구현 (Week 3-4)

#### 3.1 Aligo 구조 분석 및 Adapter 구현
```typescript
// packages/provider/src/adapters/aligo.adapter.ts
export class AligoAdapter extends BaseProviderAdapter {
  adaptRequest(standard: StandardRequest): AligoRequest {
    return {
      apikey: this.config.apiKey,
      userid: this.config.userId,
      senderkey: this.config.senderKey,
      tpl_code: standard.templateCode,
      sender: this.config.senderNumber,
      receiver_1: standard.phoneNumber,
      subject_1: this.extractSubject(standard.templateCode),
      message_1: this.replaceVariables(standard.templateCode, standard.variables),
      // Aligo 특화 필드들...
    };
  }

  getAuthHeaders(): Record<string, string> {
    return {
      'Content-Type': 'application/x-www-form-urlencoded'
    };
  }
}
```

### Phase 4: 플러그인 시스템 구축 (Week 4-5)

#### 4.1 동적 프로바이더 로딩
```typescript
// packages/provider/src/plugins/plugin.system.ts
export class ProviderPluginSystem {
  async loadPlugin(pluginPath: string): Promise<ProviderPlugin> {
    const module = await import(pluginPath);
    return new module.default();
  }

  async registerPlugin(plugin: ProviderPlugin): Promise<void> {
    this.registry.register(plugin.id, plugin.createAdapter());
  }
}
```

#### 4.2 설정 기반 프로바이더 관리
```typescript
// config/providers.json
{
  "providers": {
    "iwinv": {
      "adapter": "IWINVAdapter",
      "baseUrl": "https://alimtalk.bizservice.iwinv.kr",
      "authType": "header-base64",
      "endpoints": {
        "send": "/send/",
        "template": "/template/",
        "history": "/history/"
      }
    },
    "aligo": {
      "adapter": "AligoAdapter",
      "baseUrl": "https://smartsms.aligo.in",
      "authType": "form-credentials",
      "endpoints": {
        "send": "/alimtalk/send/",
        "template": "/alimtalk/template/"
      }
    }
  }
}
```

## 🔄 점진적 마이그레이션 전략

### 호환성 보장
```typescript
// 기존 코드 호환성 유지
export class IWINVProviderLegacy extends IWINVProvider {
  // 기존 메서드들 그대로 유지하되 내부적으로 Adapter 사용
  async sendAlimTalk(request: OldIWINVRequest): Promise<OldIWINVResult> {
    const standardRequest = this.convertToStandard(request);
    const result = await this.send(standardRequest);
    return this.convertToLegacy(result);
  }
}
```

### 단계별 마이그레이션
1. **Phase 1**: 새로운 Adapter 시스템 구축 (기존 코드 영향 없음)
2. **Phase 2**: IWINV를 Adapter 기반으로 마이그레이션 (하위 호환성 유지)
3. **Phase 3**: 새로운 프로바이더(Aligo) 추가
4. **Phase 4**: 레거시 코드 정리 및 완전 마이그레이션

## 📈 성공 지표

### 기술적 지표
- [ ] 프로바이더 추가 시간: 기존 1주 → 목표 1일
- [ ] 테스트 커버리지: 90% 이상 유지
- [ ] 타입 안전성: TypeScript 컴파일 에러 0개
- [ ] 성능: 기존 대비 5% 이하 오버헤드

### 비즈니스 지표
- [ ] 새 프로바이더 연동 시간 단축
- [ ] 멀티 프로바이더 환경에서 안정성 확보
- [ ] 프로바이더별 장애 격리 개선

## 🚧 리스크 및 대응 방안

### 주요 리스크
1. **기존 코드 호환성**: Legacy wrapper 제공
2. **성능 저하**: Adapter 계층 최적화
3. **복잡성 증가**: 명확한 문서화 및 예제 제공
4. **테스트 부담**: 프로바이더별 Mock 시스템 구축

### 대응 방안
- 단계별 마이그레이션으로 리스크 분산
- 충분한 테스트 커버리지 확보
- 명확한 롤백 계획 수립
- 팀 교육 및 문서화 강화

## 📝 Action Items

### Immediate (이번 주)
- [ ] Base Adapter 인터페이스 설계 및 구현
- [ ] Provider Registry 기본 구조 구축
- [ ] Universal Provider 초기 버전 구현

### Week 1-2
- [ ] IWINV Adapter 구현 및 테스트
- [ ] 기존 IWINV Provider 마이그레이션
- [ ] 호환성 테스트 suite 구축

### Week 3-4
- [ ] Aligo Adapter 구현
- [ ] 멀티 프로바이더 테스트 환경 구축
- [ ] 성능 벤치마크 수행

### Week 4-5
- [ ] 플러그인 시스템 구현
- [ ] 동적 프로바이더 로딩 테스트
- [ ] 문서화 및 예제 코드 작성

---

**이 마이그레이션을 통해 k-msg가 진정한 멀티 프로바이더 플랫폼으로 진화할 것입니다! 🚀**