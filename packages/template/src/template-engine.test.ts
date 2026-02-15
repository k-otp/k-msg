/**
 * Comprehensive tests for template-engine package
 */

import { describe, expect, test } from "bun:test";
import {
  type AlimTalkTemplate,
  ButtonParser,
  TemplateBuilder,
  TemplateBuilders,
  type TemplateButton,
  TemplateCategory,
  TemplateRegistry,
  MockTemplateService as TemplateService,
  TemplateStatus,
  TemplateValidator,
  type TemplateVariable,
  VariableParser,
} from "./index";

describe("VariableParser", () => {
  test("should extract variables from template content", () => {
    const content = "안녕하세요, #{name}님! 인증번호는 #{code}입니다.";
    const variables = VariableParser.extractVariables(content);

    expect(variables).toEqual(["name", "code"]);
  });

  test("should replace variables in content", () => {
    const content = "안녕하세요, #{name}님! 인증번호는 #{code}입니다.";
    const variables = { name: "홍길동", code: "123456" };

    const result = VariableParser.replaceVariables(content, variables);
    expect(result).toBe("안녕하세요, 홍길동님! 인증번호는 123456입니다.");
  });

  test("should validate variables against definitions", () => {
    const definitions: TemplateVariable[] = [
      { name: "name", type: "string", required: true },
      { name: "age", type: "number", required: false },
    ];

    const validVariables = { name: "홍길동", age: 30 };
    const invalidVariables = { age: "thirty" }; // missing required name, wrong type for age

    const validResult = VariableParser.validateVariables(
      definitions,
      validVariables,
    );
    const invalidResult = VariableParser.validateVariables(
      definitions,
      invalidVariables,
    );

    expect(validResult.isValid).toBe(true);
    expect(invalidResult.isValid).toBe(false);
    expect(invalidResult.errors).toContain(
      "Required variable 'name' is missing",
    );
    expect(invalidResult.errors).toContain(
      "Variable 'age' has invalid type. Expected: number",
    );
  });

  test("should validate template variables consistency", () => {
    const content = "#{name}님, #{code}를 입력하세요.";
    const definitions: TemplateVariable[] = [
      { name: "name", type: "string", required: true },
      { name: "unused", type: "string", required: true },
    ];

    const result = VariableParser.validateTemplateVariables(
      content,
      definitions,
    );

    expect(result.isValid).toBe(false);
    expect(result.errors).toContain(
      "Variable 'code' is used in template but not defined",
    );
    expect(result.errors).toContain(
      "Required variable 'unused' is defined but not used in template",
    );
  });
});

describe("ButtonParser", () => {
  test("should validate web link buttons", () => {
    const buttons: TemplateButton[] = [
      {
        type: "WL",
        name: "웹사이트 방문",
        linkMobile: "https://example.com",
        linkPc: "https://example.com",
      },
    ];

    const result = ButtonParser.validateButtons(buttons);
    expect(result.isValid).toBe(true);
  });

  test("should validate app link buttons", () => {
    const buttons: TemplateButton[] = [
      {
        type: "AL",
        name: "앱 실행",
        linkIos: "https://apps.apple.com/app/123",
        linkAndroid:
          "https://play.google.com/store/apps/details?id=com.example",
        schemeIos: "myapp://open",
        schemeAndroid: "myapp://open",
      },
    ];

    const result = ButtonParser.validateButtons(buttons);
    expect(result.isValid).toBe(true);
  });

  test("should reject buttons with invalid URLs", () => {
    const buttons: TemplateButton[] = [
      {
        type: "WL",
        name: "잘못된 링크",
        linkMobile: "not-a-url",
      },
    ];

    const result = ButtonParser.validateButtons(buttons);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain("Button 1: invalid mobile link URL");
  });

  test("should serialize and deserialize buttons", () => {
    const buttons: TemplateButton[] = [
      {
        type: "WL",
        name: "웹사이트",
        linkMobile: "https://example.com",
        linkPc: "https://example.com",
      },
    ];

    const serialized = ButtonParser.serializeButtons(buttons);
    const deserialized = ButtonParser.deserializeButtons(serialized);

    expect(deserialized).toEqual(buttons);
  });
});

describe("TemplateValidator", () => {
  const validTemplate: AlimTalkTemplate = {
    id: "test-template-1",
    code: "TEST_001",
    name: "테스트 템플릿",
    content: "안녕하세요, #{name}님! 인증번호는 #{code}입니다.",
    variables: [
      { name: "name", type: "string", required: true },
      { name: "code", type: "string", required: true, maxLength: 6 },
    ],
    category: TemplateCategory.AUTHENTICATION,
    status: TemplateStatus.APPROVED,
    provider: "test-provider",
    metadata: {
      createdAt: new Date(),
      updatedAt: new Date(),
      usage: { sent: 0, delivered: 0, failed: 0 },
    },
  };

  test("should validate valid template", () => {
    const result = TemplateValidator.validate(validTemplate);
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  test("should reject template with missing required fields", () => {
    const invalidTemplate = { ...validTemplate, name: "" };
    const result = TemplateValidator.validate(
      invalidTemplate as AlimTalkTemplate,
    );

    expect(result.isValid).toBe(false);
    expect(result.errors).toContain("Template name is required");
  });

  test("should reject template with content too long", () => {
    const longContent = "a".repeat(1001);
    const invalidTemplate = { ...validTemplate, content: longContent };
    const result = TemplateValidator.validate(invalidTemplate);

    expect(result.isValid).toBe(false);
    expect(result.errors).toContain(
      "Template content cannot exceed 1000 characters",
    );
  });

  test("should validate authentication template specifics", () => {
    const authTemplate = {
      ...validTemplate,
      category: TemplateCategory.AUTHENTICATION,
      variables: [{ name: "message", type: "string" as const, required: true }],
    };

    const result = TemplateValidator.validate(authTemplate);
    expect(result.warnings).toContain(
      "Authentication template should include an authentication code variable",
    );
  });

  test("should perform quick validation", () => {
    const partialTemplate = {
      name: "테스트",
      content: "내용",
      category: TemplateCategory.NOTIFICATION,
      provider: "test",
    };

    const result = TemplateValidator.quickValidate(partialTemplate);
    expect(result.isValid).toBe(true);
  });
});

describe("TemplateBuilder", () => {
  test("should build template with fluent API", () => {
    const template = new TemplateBuilder()
      .name("테스트 템플릿")
      .code("TEST_001")
      .content("안녕하세요, #{name}님! 인증번호는 #{code}입니다.")
      .category(TemplateCategory.AUTHENTICATION)
      .provider("test-provider")
      .variable("name", "string", true, { description: "사용자 이름" })
      .variable("code", "string", true, {
        maxLength: 6,
        description: "인증번호",
      })
      .build();

    expect(template.name).toBe("테스트 템플릿");
    expect(template.code).toBe("TEST_001");
    expect(template.category).toBe(TemplateCategory.AUTHENTICATION);
    expect(template.variables).toHaveLength(2);
  });

  test("should auto-extract variables from content", () => {
    const builder = new TemplateBuilder()
      .name("테스트")
      .code("TEST")
      .content("#{name}님, #{code}를 확인하세요.")
      .category(TemplateCategory.NOTIFICATION)
      .provider("test");

    const template = builder.build();
    expect(template.variables.map((v) => v.name)).toEqual(["name", "code"]);
  });

  test("should add web link button", () => {
    const template = new TemplateBuilder()
      .name("테스트")
      .code("TEST")
      .content("내용")
      .category(TemplateCategory.PROMOTION)
      .provider("test")
      .webLinkButton("웹사이트 방문", "https://example.com")
      .build();

    expect(template.buttons).toHaveLength(1);
    expect(template.buttons![0].type).toBe("WL");
    expect(template.buttons![0].name).toBe("웹사이트 방문");
  });

  test("should preview template with sample variables", () => {
    const builder = new TemplateBuilder()
      .content("안녕하세요, #{name}님!")
      .variable("name", "string", true, { example: "홍길동" });

    const preview = builder.preview();
    expect(preview).toBe("안녕하세요, 홍길동님!");
  });

  test("should validate template during build", () => {
    const builder = new TemplateBuilder().name("테스트").content("내용"); // Missing required fields

    expect(() => builder.build()).toThrow("Template code is required");
  });

  test("should clone builder", () => {
    const original = new TemplateBuilder()
      .name("원본")
      .code("ORIG")
      .content("안녕하세요, #{name}님!")
      .category(TemplateCategory.NOTIFICATION)
      .provider("test-provider");

    const cloned = original.clone().name("복사본").code("COPY");

    const originalBuilt = original.build();
    const clonedBuilt = cloned.build();

    // Ensure original is not mutated
    expect(originalBuilt.name).toBe("원본");
    expect(originalBuilt.code).toBe("ORIG");

    expect(clonedBuilt.name).toBe("복사본");
    expect(clonedBuilt.code).toBe("COPY");

    // Dates should stay Dates (clone must not stringify them)
    expect(originalBuilt.metadata.createdAt).toBeInstanceOf(Date);
    expect(clonedBuilt.metadata.createdAt).toBeInstanceOf(Date);
  });
});

describe("TemplateBuilders factory", () => {
  test("should create authentication template", () => {
    const template = TemplateBuilders.authentication("인증 템플릿", "provider")
      .code("AUTH_001")
      .content("인증번호: #{code}")
      .build();

    expect(template.category).toBe(TemplateCategory.AUTHENTICATION);
    expect(template.variables.some((v) => v.name === "code")).toBe(true);
  });

  test("should create notification template", () => {
    const template = TemplateBuilders.notification("알림 템플릿", "provider")
      .code("NOTI_001")
      .content("#{name}님께 알림")
      .build();

    expect(template.category).toBe(TemplateCategory.NOTIFICATION);
    expect(template.variables.some((v) => v.name === "name")).toBe(true);
  });

  test("should create promotion template", () => {
    const template = TemplateBuilders.promotion("프로모션 템플릿", "provider")
      .code("PROMO_001")
      .content("#{name}님, #{discount}% 할인!")
      .build();

    expect(template.category).toBe(TemplateCategory.PROMOTION);
    expect(template.variables.some((v) => v.name === "discount")).toBe(true);
  });

  test("should create payment template", () => {
    const template = TemplateBuilders.payment("결제 템플릿", "provider")
      .code("PAY_001")
      .content("#{name}님, #{amount}원 결제완료")
      .build();

    expect(template.category).toBe(TemplateCategory.PAYMENT);
    expect(template.variables.some((v) => v.name === "amount")).toBe(true);
  });
});

describe("TemplateService", () => {
  test("should create and retrieve template", async () => {
    const service = new TemplateService();

    const templateData = {
      code: "TEST_001",
      name: "테스트 템플릿",
      content: "안녕하세요, #{name}님!",
      variables: [{ name: "name", type: "string", required: true }],
      category: TemplateCategory.NOTIFICATION,
      status: TemplateStatus.DRAFT,
      provider: "test-provider",
    };

    const created = await service.createTemplate(templateData);
    expect(created.id).toBeDefined();
    expect(created.name).toBe(templateData.name);

    const retrieved = await service.getTemplate(created.id);
    expect(retrieved).toEqual(created);
  });

  test("should update template", async () => {
    const service = new TemplateService();

    const created = await service.createTemplate({
      code: "TEST_002",
      name: "원본 템플릿",
      content: "원본 내용",
      category: TemplateCategory.NOTIFICATION,
      status: TemplateStatus.DRAFT,
      provider: "test-provider",
    });

    // Add a small delay to ensure different timestamps
    await new Promise((resolve) => setTimeout(resolve, 1));

    const updated = await service.updateTemplate(created.id, {
      name: "수정된 템플릿",
      content: "수정된 내용",
    });

    expect(updated.name).toBe("수정된 템플릿");
    expect(updated.content).toBe("수정된 내용");
    expect(updated.metadata.updatedAt.getTime()).toBeGreaterThan(
      created.metadata.updatedAt.getTime(),
    );
  });

  test("should delete template", async () => {
    const service = new TemplateService();

    const created = await service.createTemplate({
      code: "TEST_003",
      name: "삭제될 템플릿",
      content: "내용",
      category: TemplateCategory.NOTIFICATION,
      status: TemplateStatus.DRAFT,
      provider: "test-provider",
    });

    await service.deleteTemplate(created.id);

    const retrieved = await service.getTemplate(created.id);
    expect(retrieved).toBeNull();
  });

  test("should render template with variables", async () => {
    const service = new TemplateService();

    const created = await service.createTemplate({
      code: "TEST_004",
      name: "렌더링 템플릿",
      content: "안녕하세요, #{name}님! 코드: #{code}",
      category: TemplateCategory.AUTHENTICATION,
      status: TemplateStatus.APPROVED,
      provider: "test-provider",
    });

    const rendered = await service.renderTemplate(created.id, {
      name: "홍길동",
      code: "123456",
    });

    expect(rendered).toBe("안녕하세요, 홍길동님! 코드: 123456");
  });
});

describe("TemplateRegistry", () => {
  test("should register and retrieve templates", async () => {
    const registry = new TemplateRegistry();

    const template: AlimTalkTemplate = {
      id: "test-1",
      code: "TEST_001",
      name: "테스트 템플릿",
      content: "내용",
      variables: [],
      category: TemplateCategory.NOTIFICATION,
      status: TemplateStatus.APPROVED,
      provider: "test-provider",
      metadata: {
        createdAt: new Date(),
        updatedAt: new Date(),
        usage: { sent: 0, delivered: 0, failed: 0 },
      },
    };

    await registry.register(template);

    const retrieved = registry.get("test-1");
    expect(retrieved).toEqual(template);

    const byCode = registry.getByCode("TEST_001", "test-provider");
    expect(byCode).toEqual(template);
  });

  test("should search templates with filters", async () => {
    const registry = new TemplateRegistry();

    const templates: AlimTalkTemplate[] = [
      {
        id: "auth-1",
        code: "AUTH_001",
        name: "인증 템플릿",
        content: "인증번호: #{code}",
        variables: [{ name: "code", type: "string", required: true }],
        category: TemplateCategory.AUTHENTICATION,
        status: TemplateStatus.APPROVED,
        provider: "provider-1",
        metadata: {
          createdAt: new Date(),
          updatedAt: new Date(),
          usage: { sent: 100, delivered: 95, failed: 5 },
        },
      },
      {
        id: "noti-1",
        code: "NOTI_001",
        name: "알림 템플릿",
        content: "알림: #{message}",
        variables: [{ name: "message", type: "string", required: true }],
        category: TemplateCategory.NOTIFICATION,
        status: TemplateStatus.APPROVED,
        provider: "provider-2",
        metadata: {
          createdAt: new Date(),
          updatedAt: new Date(),
          usage: { sent: 50, delivered: 48, failed: 2 },
        },
      },
    ];

    for (const template of templates) {
      await registry.register(template);
    }

    // Search by category
    const authResults = registry.search({
      category: TemplateCategory.AUTHENTICATION,
    });
    expect(authResults.templates).toHaveLength(1);
    expect(authResults.templates[0].id).toBe("auth-1");

    // Search by provider
    const provider1Results = registry.search({ provider: "provider-1" });
    expect(provider1Results.templates).toHaveLength(1);

    // Search by name
    const nameResults = registry.search({ nameContains: "인증" });
    expect(nameResults.templates).toHaveLength(1);

    // Search with pagination
    const paginatedResults = registry.search({}, { page: 1, limit: 1 });
    expect(paginatedResults.templates).toHaveLength(1);
    expect(paginatedResults.hasMore).toBe(true);
  });

  test("should track template usage", async () => {
    const registry = new TemplateRegistry({ enableUsageTracking: true });

    const template: AlimTalkTemplate = {
      id: "usage-test",
      code: "USAGE_001",
      name: "사용량 테스트",
      content: "내용",
      variables: [],
      category: TemplateCategory.NOTIFICATION,
      status: TemplateStatus.APPROVED,
      provider: "test-provider",
      metadata: {
        createdAt: new Date(),
        updatedAt: new Date(),
        usage: { sent: 0, delivered: 0, failed: 0 },
      },
    };

    await registry.register(template);

    // Update usage
    registry.updateUsageStats("usage-test", {
      sent: 10,
      delivered: 8,
      failed: 2,
    });

    const stats = registry.getUsageStats("usage-test");
    expect(stats).toBeDefined();
    expect(stats!.totalSent).toBe(10);
    expect(stats!.totalDelivered).toBe(8);
    expect(stats!.totalFailed).toBe(2);
    expect(stats!.deliveryRate).toBe(80);
    expect(stats!.failureRate).toBe(20);
  });

  test("should maintain version history", async () => {
    const registry = new TemplateRegistry({ enableVersioning: true });

    const template: AlimTalkTemplate = {
      id: "version-test",
      code: "VER_001",
      name: "버전 테스트",
      content: "원본 내용",
      variables: [],
      category: TemplateCategory.NOTIFICATION,
      status: TemplateStatus.DRAFT,
      provider: "test-provider",
      metadata: {
        createdAt: new Date(),
        updatedAt: new Date(),
        usage: { sent: 0, delivered: 0, failed: 0 },
      },
    };

    await registry.register(template);

    // Update template
    await registry.update("version-test", { content: "수정된 내용" });

    const history = registry.getHistory("version-test");
    expect(history).toBeDefined();
    expect(history!.versions).toHaveLength(2);
    expect(history!.currentVersion).toBe(2);

    // Get specific version
    const version1 = registry.getVersion("version-test", 1);
    expect(version1!.content).toBe("원본 내용");

    const version2 = registry.getVersion("version-test", 2);
    expect(version2!.content).toBe("수정된 내용");
  });

  test("should export and import templates", async () => {
    const registry = new TemplateRegistry();

    const template: AlimTalkTemplate = {
      id: "export-test",
      code: "EXPORT_001",
      name: "내보내기 테스트",
      content: "내용",
      variables: [],
      category: TemplateCategory.NOTIFICATION,
      status: TemplateStatus.APPROVED,
      provider: "test-provider",
      metadata: {
        createdAt: new Date(),
        updatedAt: new Date(),
        usage: { sent: 0, delivered: 0, failed: 0 },
      },
    };

    await registry.register(template);

    // Export
    const exported = registry.export();
    expect(exported).toContain("export-test");

    // Import to new registry
    const newRegistry = new TemplateRegistry();
    const importResult = await newRegistry.import(exported);

    expect(importResult.imported).toBe(1);
    expect(importResult.errors).toHaveLength(0);

    const imported = newRegistry.get("export-test");
    expect(imported).toBeDefined();
    expect(imported!.name).toBe("내보내기 테스트");
  });

  test("should get registry statistics", async () => {
    const registry = new TemplateRegistry();

    const templates: AlimTalkTemplate[] = [
      {
        id: "stat-1",
        code: "STAT_001",
        name: "통계 테스트 1",
        content: "내용",
        variables: [],
        category: TemplateCategory.AUTHENTICATION,
        status: TemplateStatus.APPROVED,
        provider: "provider-1",
        metadata: {
          createdAt: new Date(),
          updatedAt: new Date(),
          usage: { sent: 0, delivered: 0, failed: 0 },
        },
      },
      {
        id: "stat-2",
        code: "STAT_002",
        name: "통계 테스트 2",
        content: "내용",
        variables: [],
        category: TemplateCategory.NOTIFICATION,
        status: TemplateStatus.DRAFT,
        provider: "provider-1",
        metadata: {
          createdAt: new Date(),
          updatedAt: new Date(),
          usage: { sent: 0, delivered: 0, failed: 0 },
        },
      },
    ];

    for (const template of templates) {
      await registry.register(template);
    }

    const stats = registry.getStats();
    expect(stats.totalTemplates).toBe(2);
    expect(stats.byProvider["provider-1"]).toBe(2);
    expect(stats.byCategory[TemplateCategory.AUTHENTICATION.toString()]).toBe(
      1,
    );
    expect(stats.byStatus[TemplateStatus.APPROVED.toString()]).toBe(1);
  });
});

describe("Integration Tests", () => {
  test("should work together in complete workflow", async () => {
    // Create registry and service
    const registry = new TemplateRegistry({
      enableVersioning: true,
      enableUsageTracking: true,
    });
    const service = new TemplateService();

    // Build template using fluent API
    const template = TemplateBuilders.authentication("OTP 인증", "iwinv")
      .code("KOTP_001")
      .content("[K-OTP] 인증번호는 #{code}입니다. 3분 내에 입력해주세요.")
      .variable("code", "string", true, {
        maxLength: 6,
        format: "^[0-9]{6}$",
        description: "6자리 숫자 인증번호",
        example: "123456",
      })
      .build();

    // Register template
    await registry.register(template);

    // Validate template
    const validation = TemplateValidator.validate(template);
    expect(validation.isValid).toBe(true);

    // Search templates
    const searchResult = registry.search({
      category: TemplateCategory.AUTHENTICATION,
      provider: "iwinv",
    });
    expect(searchResult.templates).toHaveLength(1);

    // Update usage
    registry.updateUsageStats(template.id, {
      sent: 100,
      delivered: 98,
      failed: 2,
    });

    // Check usage stats
    const usageStats = registry.getUsageStats(template.id);
    expect(usageStats!.deliveryRate).toBe(98);
    expect(usageStats!.failureRate).toBe(2);

    // Preview template
    const builder = new TemplateBuilder()
      .content(template.content)
      .variable("code", "string", true, { example: "123456" });

    const preview = builder.preview();
    expect(preview).toBe(
      "[K-OTP] 인증번호는 123456입니다. 3분 내에 입력해주세요.",
    );

    // Validate variables
    const variableValidation = VariableParser.validateVariables(
      template.variables,
      { code: "123456" },
    );
    expect(variableValidation.isValid).toBe(true);

    // Test variable replacement
    const replaced = VariableParser.replaceVariables(template.content, {
      code: "654321",
    });
    expect(replaced).toBe(
      "[K-OTP] 인증번호는 654321입니다. 3분 내에 입력해주세요.",
    );
  });
});
