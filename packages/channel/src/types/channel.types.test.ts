import { describe, expect, test } from "bun:test";
import {
  ChannelCreateRequestSchema,
  ChannelType,
  SenderNumberCategory,
  SenderNumberCreateRequestSchema,
} from "./channel.types";

describe("channel.types schema", () => {
  test("validates email/url/regex boundaries in channel create request", () => {
    const valid = ChannelCreateRequestSchema.safeParse({
      name: "channel",
      type: ChannelType.KAKAO_ALIMTALK,
      provider: "provider",
      profileKey: "profile-key",
      businessInfo: {
        name: "biz",
        registrationNumber: "123",
        category: "cat",
        contactPerson: "owner",
        contactEmail: "owner@example.com",
        contactPhone: "010-1234-5678",
      },
      kakaoInfo: {
        plusFriendId: "pfid",
        brandName: "brand",
        logoUrl: "https://example.com/logo.png",
      },
    });

    const invalidEmail = ChannelCreateRequestSchema.safeParse({
      name: "channel",
      type: ChannelType.KAKAO_ALIMTALK,
      provider: "provider",
      profileKey: "profile-key",
      businessInfo: {
        name: "biz",
        registrationNumber: "123",
        category: "cat",
        contactPerson: "owner",
        contactEmail: "bad-email",
        contactPhone: "010-1234-5678",
      },
    });

    const invalidUrl = ChannelCreateRequestSchema.safeParse({
      name: "channel",
      type: ChannelType.KAKAO_ALIMTALK,
      provider: "provider",
      profileKey: "profile-key",
      kakaoInfo: {
        plusFriendId: "pfid",
        brandName: "brand",
        logoUrl: "bad-url",
      },
    });

    expect(valid.success).toBe(true);
    expect(invalidEmail.success).toBe(false);
    expect(invalidUrl.success).toBe(false);
  });

  test("validates sender number phone regex", () => {
    const valid = SenderNumberCreateRequestSchema.safeParse({
      phoneNumber: "01012345678",
      category: SenderNumberCategory.BUSINESS,
    });

    const invalid = SenderNumberCreateRequestSchema.safeParse({
      phoneNumber: "invalid",
      category: SenderNumberCategory.BUSINESS,
    });

    expect(valid.success).toBe(true);
    expect(invalid.success).toBe(false);
  });
});
