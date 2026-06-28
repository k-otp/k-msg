import { describe, expect, test } from "bun:test";
import type { MessageType, ProviderOnboardingSpec } from "@k-msg/core";
import type { PromptApi, PromptSelectOption } from "../cli/command-contract";
import type { ProviderWithCapabilities } from "../providers/registry";
import type { Runtime } from "../runtime";
import {
  buildInteractiveAlimTalkInput,
  buildInteractiveSmsInput,
  ensureInteractiveSendAllowed,
} from "./send-interactive";

class FakePrompt implements PromptApi {
  readonly confirms: Array<{ message: string }> = [];
  readonly selects: Array<{
    default?: unknown;
    message: string;
    options: PromptSelectOption<unknown>[];
  }> = [];
  readonly texts: string[] = [];

  constructor(
    private readonly input: {
      confirmAnswers?: boolean[];
      selectAnswers?: unknown[];
      textAnswers?: string[];
    } = {},
  ) {}

  async confirm(message: string): Promise<boolean> {
    this.confirms.push({ message });
    return this.input.confirmAnswers?.shift() ?? false;
  }

  async select<T>(
    message: string,
    options: {
      default?: T;
      options: PromptSelectOption<T>[];
    },
  ): Promise<T> {
    this.selects.push({
      default: options.default,
      message,
      options: options.options as PromptSelectOption<unknown>[],
    });
    return (this.input.selectAnswers?.shift() ?? options.default) as T;
  }

  async text(message: string): Promise<string> {
    this.texts.push(message);
    return this.input.textAnswers?.shift() ?? "";
  }
}

function createRuntime(configOverrides?: Record<string, unknown>): Runtime {
  const config = {
    version: 1,
    providers: [
      {
        type: "solapi",
        id: "solapi",
        config: {
          apiKey: "env:SOLAPI_API_KEY",
          apiSecret: "env:SOLAPI_API_SECRET",
          defaultFrom: "029302266",
        },
      },
      {
        type: "aligo",
        id: "aligo",
        config: {
          apiKey: "env:ALIGO_API_KEY",
          userId: "env:ALIGO_USER_ID",
          sender: "029302266",
          senderKey: "ALIGO_PROFILE",
        },
      },
    ],
    routing: {
      defaultProviderId: "solapi",
      strategy: "first",
      byType: {
        ALIMTALK: ["aligo", "solapi"],
        SMS: ["solapi", "aligo"],
        LMS: ["solapi", "aligo"],
      },
    },
    defaults: {
      kakao: {
        channel: "main",
      },
    },
    aliases: {
      kakaoChannels: {
        main: {
          providerId: "aligo",
          senderKey: "ALIGO_PROFILE",
          plusId: "@brand-main",
          name: "Main",
        },
      },
    },
    ...(configOverrides ?? {}),
  };

  const providers: ProviderWithCapabilities[] = [
    {
      id: "solapi",
      name: "SOLAPI",
      supportedTypes: [
        "ALIMTALK",
        "SMS",
        "LMS",
        "MMS",
      ] as readonly MessageType[],
      async healthCheck() {
        return { healthy: true, issues: [] };
      },
      async send() {
        throw new Error("not used");
      },
      getOnboardingSpec(): ProviderOnboardingSpec {
        return {
          providerId: "solapi",
          channelOnboarding: "none",
          templateLifecycleApi: "unavailable",
          plusIdPolicy: "required_if_no_inference",
          plusIdInference: "unsupported",
          checks: [],
        };
      },
    },
    {
      id: "aligo",
      name: "Aligo",
      supportedTypes: [
        "ALIMTALK",
        "SMS",
        "LMS",
        "MMS",
      ] as readonly MessageType[],
      async healthCheck() {
        return { healthy: true, issues: [] };
      },
      async send() {
        throw new Error("not used");
      },
      getOnboardingSpec(): ProviderOnboardingSpec {
        return {
          providerId: "aligo",
          channelOnboarding: "api",
          templateLifecycleApi: "available",
          plusIdPolicy: "required_if_no_inference",
          plusIdInference: "supported",
          checks: [],
        };
      },
    },
  ];

  return {
    config: config as Runtime["config"],
    configPath: "/tmp/k-msg.config.json",
    kmsg: {} as Runtime["kmsg"],
    providers,
    providersById: new Map(
      providers.map((provider) => [provider.id, provider]),
    ),
  };
}

describe("interactive send helpers", () => {
  test("guards interactive mode against non-interactive terminals and explicit JSON", () => {
    expect(() =>
      ensureInteractiveSendAllowed({
        commandPath: "k-msg sms send",
        interactive: true,
        json: undefined,
        terminal: { isCI: false, isInteractive: false },
      }),
    ).toThrow("requires an interactive terminal");

    expect(() =>
      ensureInteractiveSendAllowed({
        commandPath: "k-msg sms send",
        interactive: true,
        json: true,
        terminal: { isCI: false, isInteractive: true },
      }),
    ).toThrow("cannot be combined with --json true");
  });

  test("prompts only for missing SMS fields", async () => {
    const prompt = new FakePrompt({
      textAnswers: ["hello from prompt"],
    });

    const input = await buildInteractiveSmsInput({
      draft: {
        from: "029302266",
        provider: "solapi",
        scheduledAt: new Date("2026-06-29T10:00:00+09:00"),
        to: "01012345678",
      },
      prompt,
      runtime: createRuntime(),
    });

    expect(prompt.selects).toHaveLength(0);
    expect(prompt.texts).toEqual(["Message text"]);
    expect(input).toEqual({
      from: "029302266",
      options: {
        scheduledAt: new Date("2026-06-29T10:00:00+09:00"),
      },
      providerId: "solapi",
      text: "hello from prompt",
      to: "01012345678",
    });
  });

  test("prefers Kakao channel aliases before manual senderKey/plusId prompts", async () => {
    const prompt = new FakePrompt({
      textAnswers: ["01012345678", "TPL_001", '{"name":"Jane"}', "", ""],
      selectAnswers: ["aligo", "main"],
    });

    const input = await buildInteractiveAlimTalkInput({
      draft: {},
      prompt,
      runtime: createRuntime(),
    });

    expect(prompt.selects[1]?.message).toBe("Select Kakao channel alias");
    expect(
      prompt.texts.some((message) => message.includes("senderKey/profileId")),
    ).toBe(false);
    expect(prompt.texts.some((message) => message.includes("plusId"))).toBe(
      false,
    );
    expect(input.kakao).toEqual({
      plusId: "@brand-main",
      profileId: "ALIGO_PROFILE",
    });
  });

  test("prompts for plusId when provider inference is unsupported", async () => {
    const prompt = new FakePrompt({
      textAnswers: [
        "01012345678",
        "TPL_001",
        '{"name":"Jane"}',
        "",
        "",
        "SOLAPI_PROFILE",
        "@solapi-brand",
      ],
    });

    const input = await buildInteractiveAlimTalkInput({
      draft: {
        provider: "solapi",
      },
      prompt,
      runtime: createRuntime({
        aliases: {
          kakaoChannels: {},
        },
      }),
    });

    expect(
      prompt.texts.some((message) =>
        message.includes(
          "Kakao plusId (required for solapi preflight/send readiness)",
        ),
      ),
    ).toBe(true);
    expect(input.kakao).toEqual({
      plusId: "@solapi-brand",
      profileId: "SOLAPI_PROFILE",
    });
  });
});
