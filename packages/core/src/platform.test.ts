import { describe, expect, test } from "bun:test";
import { AlimTalkPlatform } from "./platform";
import type {
  BaseProvider,
  Config,
  StandardRequest,
  StandardResult,
} from "./types/index";

class MockBaseProvider
  implements BaseProvider<StandardRequest, StandardResult>
{
  readonly type = "messaging";
  readonly version = "1.0.0";
  public requests: StandardRequest[] = [];

  constructor(
    public readonly id: string,
    public readonly name: string,
  ) {}

  async healthCheck() {
    return { healthy: true, issues: [] };
  }

  async send<
    T extends StandardRequest = StandardRequest,
    R extends StandardResult = StandardResult,
  >(request: T): Promise<R> {
    this.requests.push(request);
    return {
      messageId: `${this.id}-${this.requests.length}`,
      status: "SENT",
      provider: this.id,
      timestamp: new Date(),
      phoneNumber: request.phoneNumber,
    } as R;
  }
}

class FailedStatusProvider extends MockBaseProvider {
  async send<
    T extends StandardRequest = StandardRequest,
    R extends StandardResult = StandardResult,
  >(request: T): Promise<R> {
    this.requests.push(request);
    return {
      messageId: `${this.id}-${this.requests.length}`,
      status: "FAILED",
      provider: this.id,
      timestamp: new Date(),
      phoneNumber: request.phoneNumber,
      error: {
        code: "PROVIDER_ERROR",
        message: "provider rejected",
        retryable: false,
      },
    } as R;
  }
}

class FailedResultProvider extends MockBaseProvider {
  async send<
    T extends StandardRequest = StandardRequest,
    R extends StandardResult = StandardResult,
  >(_request: T): Promise<R> {
    return {
      isSuccess: false,
      isFailure: true,
      error: new Error("legacy result failure"),
    } as unknown as R;
  }
}

function createConfig(partial: Partial<Config> = {}): Config {
  return {
    defaultProvider: "default-provider",
    providers: [],
    features: {},
    ...partial,
  };
}

describe("AlimTalkPlatform unified send API", () => {
  test("keeps legacy templateId API compatibility", async () => {
    const platform = new AlimTalkPlatform(createConfig());
    const provider = new MockBaseProvider(
      "default-provider",
      "Default Provider",
    );
    platform.registerProvider(provider);

    const result = await platform.messages.send({
      templateId: "WELCOME_001",
      recipients: [
        { phoneNumber: "01012345678", variables: { name: "홍길동" } },
      ],
      variables: { service: "k-msg" },
    });

    expect(result.summary.total).toBe(1);
    expect(result.summary.sent).toBe(1);
    expect(provider.requests).toHaveLength(1);
    expect(provider.requests[0]?.templateCode).toBe("WELCOME_001");
    expect(provider.requests[0]?.variables).toEqual({
      service: "k-msg",
      name: "홍길동",
    });
  });

  test("injects defaults for unified SMS send options", async () => {
    const platform = new AlimTalkPlatform(
      createConfig({
        messageDefaults: {
          senderNumber: "029999999",
          subject: "기본 제목",
        },
      }),
    );
    const provider = new MockBaseProvider(
      "default-provider",
      "Default Provider",
    );
    platform.registerProvider(provider);

    const result = await platform.messages.send({
      channel: "SMS",
      recipients: [
        { phoneNumber: "01012345678", variables: { name: "홍길동" } },
        "01011112222",
      ],
      text: "인증번호는 123456 입니다.",
      variables: { code: "123456" },
    });

    expect(result.summary.total).toBe(2);
    expect(result.summary.sent).toBe(2);
    expect(provider.requests).toHaveLength(2);
    expect(provider.requests[0]?.templateCode).toBe("SMS_DIRECT");
    expect(provider.requests[0]?.options?.channel).toBe("sms");
    expect(provider.requests[0]?.options?.senderNumber).toBe("029999999");
    expect(provider.requests[0]?.options?.subject).toBe("기본 제목");
    expect(provider.requests[0]?.variables).toEqual({
      code: "123456",
      message: "인증번호는 123456 입니다.",
      subject: "기본 제목",
      name: "홍길동",
    });
  });

  test("selects provider from channel defaults", async () => {
    const platform = new AlimTalkPlatform(
      createConfig({
        messageDefaults: {
          channels: {
            SMS: {
              providerId: "sms-provider",
            },
          },
        },
      }),
    );

    const defaultProvider = new MockBaseProvider(
      "default-provider",
      "Default Provider",
    );
    const smsProvider = new MockBaseProvider("sms-provider", "SMS Provider");
    platform.registerProvider(defaultProvider);
    platform.registerProvider(smsProvider);

    await platform.messages.send({
      channel: "SMS",
      recipients: ["01099998888"],
      text: "테스트",
    });

    expect(defaultProvider.requests).toHaveLength(0);
    expect(smsProvider.requests).toHaveLength(1);
  });

  test("throws for missing templateCode on template-based channels", async () => {
    const platform = new AlimTalkPlatform(createConfig());
    const provider = new MockBaseProvider(
      "default-provider",
      "Default Provider",
    );
    platform.registerProvider(provider);

    await expect(
      platform.messages.send({
        channel: "ALIMTALK",
        recipients: ["01077776666"],
        variables: { name: "테스터" },
      }),
    ).rejects.toThrow("templateCode is required for ALIMTALK");
  });

  test("uses direct fallback template for FRIENDTALK", async () => {
    const platform = new AlimTalkPlatform(createConfig());
    const provider = new MockBaseProvider(
      "default-provider",
      "Default Provider",
    );
    platform.registerProvider(provider);

    const result = await platform.messages.send({
      channel: "FRIENDTALK",
      recipients: ["01055556666"],
      text: "친구톡 안내 메시지",
      variables: { coupon: "WELCOME10" },
    });

    expect(result.summary.total).toBe(1);
    expect(result.summary.sent).toBe(1);
    expect(provider.requests[0]?.templateCode).toBe("FRIENDTALK_DIRECT");
    expect(provider.requests[0]?.options?.channel).toBe("friendtalk");
    expect(provider.requests[0]?.variables?.message).toBe("친구톡 안내 메시지");
  });

  test("validates direct-message channel has text payload", async () => {
    const platform = new AlimTalkPlatform(createConfig());
    const provider = new MockBaseProvider(
      "default-provider",
      "Default Provider",
    );
    platform.registerProvider(provider);

    await expect(
      platform.messages.send({
        channel: "SMS",
        recipients: ["01012340000"],
        variables: {},
      }),
    ).rejects.toThrow("text or variables.message is required for SMS");
  });

  test("counts FAILED provider results as failed without exceptions", async () => {
    const platform = new AlimTalkPlatform(createConfig());
    const provider = new FailedStatusProvider(
      "default-provider",
      "Default Provider",
    );
    platform.registerProvider(provider);

    const result = await platform.messages.send({
      channel: "SMS",
      recipients: ["01012345678"],
      text: "실패 케이스",
      variables: {},
    });

    expect(result.summary.total).toBe(1);
    expect(result.summary.sent).toBe(0);
    expect(result.summary.failed).toBe(1);
    expect(result.results[0]?.status).toBe("FAILED");
    expect(result.results[0]?.error?.message).toContain("provider rejected");
  });

  test("counts legacy Result failure payload as failed", async () => {
    const platform = new AlimTalkPlatform(createConfig());
    const provider = new FailedResultProvider(
      "default-provider",
      "Default Provider",
    );
    platform.registerProvider(provider);

    const result = await platform.messages.send({
      templateId: "WELCOME_001",
      recipients: [{ phoneNumber: "01012345678" }],
      variables: {},
    });

    expect(result.summary.total).toBe(1);
    expect(result.summary.sent).toBe(0);
    expect(result.summary.failed).toBe(1);
    expect(result.results[0]?.status).toBe("FAILED");
    expect(result.results[0]?.error?.message).toContain(
      "legacy result failure",
    );
  });
});
