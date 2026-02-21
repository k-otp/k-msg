/**
 * Comprehensive tests for channel-manager package
 */

import { describe, expect, test } from "bun:test";
import {
  ActionType,
  BusinessVerifier,
  ChannelCRUD,
  ChannelStatus,
  // Types
  ChannelType,
  DocumentStatus,
  DocumentType,
  // Classes
  KakaoChannelManager,
  KakaoSenderNumberManager,
  NumberVerifier,
  PermissionManager,
  PermissionScope,
  ResourceType,
  SenderNumberCategory,
  SenderNumberStatus,
  VerificationMethod,
  VerificationStatus,
  VerificationType,
} from "./toolkit";

describe("KakaoChannelManager", () => {
  test("should create Kakao AlimTalk channel", async () => {
    const manager = new KakaoChannelManager();

    const channelRequest = {
      name: "테스트 채널",
      type: ChannelType.KAKAO_ALIMTALK,
      provider: "kakao",
      profileKey: "test-profile-key",
      kakaoInfo: {
        plusFriendId: "@testchannel",
        brandName: "테스트 브랜드",
      },
      businessInfo: {
        name: "테스트 회사",
        registrationNumber: "123-45-67890",
        category: "IT",
        contactPerson: "홍길동",
        contactEmail: "test@example.com",
        contactPhone: "010-1234-5678",
      },
    };

    const channel = await manager.createChannel(channelRequest);

    expect(channel.id).toBeDefined();
    expect(channel.name).toBe("테스트 채널");
    expect(channel.type).toBe(ChannelType.KAKAO_ALIMTALK);
    expect(channel.status).toBe(ChannelStatus.VERIFYING);
    expect(channel.verification.status).toBe(VerificationStatus.UNDER_REVIEW);
  });

  test("should validate Plus Friend ID format", async () => {
    const manager = new KakaoChannelManager();

    const invalidRequest = {
      name: "테스트 채널",
      type: ChannelType.KAKAO_ALIMTALK,
      provider: "kakao",
      profileKey: "test-profile-key",
      kakaoInfo: {
        plusFriendId: "invalid-id", // Should start with @
        brandName: "테스트 브랜드",
      },
    };

    await expect(manager.createChannel(invalidRequest)).rejects.toThrow(
      "Invalid Plus Friend ID format",
    );
  });

  test("should suspend and reactivate channel", async () => {
    const manager = new KakaoChannelManager();

    const channel = await manager.createChannel({
      name: "테스트 채널",
      type: ChannelType.KAKAO_ALIMTALK,
      provider: "kakao",
      profileKey: "test-profile-key",
      kakaoInfo: {
        plusFriendId: "@testchannel",
        brandName: "테스트 브랜드",
      },
    });

    // Complete verification first (required for reactivation)
    await manager.completeVerification(channel.id, true);

    await manager.suspendChannel(channel.id, "Policy violation");
    const suspendedChannel = await manager.getChannel(channel.id);
    expect(suspendedChannel!.status).toBe(ChannelStatus.SUSPENDED);

    await manager.reactivateChannel(channel.id);
    const reactivatedChannel = await manager.getChannel(channel.id);
    expect(reactivatedChannel!.status).toBe(ChannelStatus.ACTIVE);
  });

  test("should check channel health", async () => {
    const manager = new KakaoChannelManager();

    const channel = await manager.createChannel({
      name: "테스트 채널",
      type: ChannelType.KAKAO_ALIMTALK,
      provider: "kakao",
      profileKey: "test-profile-key",
      kakaoInfo: {
        plusFriendId: "@testchannel",
        brandName: "테스트 브랜드",
      },
    });

    const health = await manager.checkChannelHealth(channel.id);

    expect(health.isHealthy).toBe(false); // Should be unhealthy due to pending status
    expect(health.issues.length).toBeGreaterThan(0);
    expect(health.recommendations.length).toBeGreaterThan(0);
  });
});

describe("KakaoSenderNumberManager", () => {
  test("should add and verify sender number", async () => {
    const manager = new KakaoSenderNumberManager();

    const senderNumber = await manager.addSenderNumber("channel-1", {
      phoneNumber: "01012345678",
      category: SenderNumberCategory.BUSINESS,
      businessInfo: {
        businessName: "테스트 회사",
        businessRegistrationNumber: "123-45-67890",
        contactPerson: "홍길동",
        contactEmail: "test@example.com",
      },
    });

    expect(senderNumber.phoneNumber).toBe("01012345678");
    expect(senderNumber.status).toBe(SenderNumberStatus.VERIFYING);
    expect(senderNumber.verificationCode).toBeDefined();

    // Verify with correct code
    const verified = await manager.verifySenderNumber(
      senderNumber.id,
      senderNumber.verificationCode!,
    );
    expect(verified).toBe(true);

    const verifiedNumber = await manager.getSenderNumber(senderNumber.id);
    expect(verifiedNumber!.status).toBe(SenderNumberStatus.VERIFIED);
    expect(verifiedNumber!.verifiedAt).toBeDefined();
  });

  test("should reject invalid phone number format", async () => {
    const manager = new KakaoSenderNumberManager();

    await expect(
      manager.addSenderNumber("channel-1", {
        phoneNumber: "123-456-7890", // Invalid Korean format
        category: SenderNumberCategory.BUSINESS,
      }),
    ).rejects.toThrow("Invalid Korean phone number format");
  });

  test("should handle verification code expiry", async () => {
    const manager = new KakaoSenderNumberManager();

    const senderNumber = await manager.addSenderNumber("channel-1", {
      phoneNumber: "01012345678",
      category: SenderNumberCategory.BUSINESS,
    });

    // Mock expired code by manually setting expiry
    const verificationData = (manager as any).verificationCodes.get(
      senderNumber.id,
    );
    if (verificationData) {
      verificationData.expiresAt = new Date(Date.now() - 1000); // 1 second ago
    }

    await expect(
      manager.verifySenderNumber(
        senderNumber.id,
        senderNumber.verificationCode!,
      ),
    ).rejects.toThrow("Verification code has expired");
  });

  test("should validate sender number for sending", async () => {
    const manager = new KakaoSenderNumberManager();

    const senderNumber = await manager.addSenderNumber("channel-1", {
      phoneNumber: "01012345678",
      category: SenderNumberCategory.BUSINESS,
    });

    // Before verification
    let validation = await manager.validateSenderNumberForSending(
      senderNumber.id,
    );
    expect(validation.isValid).toBe(false);
    expect(validation.errors).toContain(
      "Sender number status is VERIFYING, must be verified",
    );

    // After verification
    await manager.verifySenderNumber(
      senderNumber.id,
      senderNumber.verificationCode!,
    );
    validation = await manager.validateSenderNumberForSending(senderNumber.id);
    expect(validation.isValid).toBe(true);
    expect(validation.errors).toHaveLength(0);
  });
});

describe("ChannelCRUD", () => {
  test("should perform CRUD operations on channels", async () => {
    const crud = new ChannelCRUD();

    // Create
    const channel = await crud.createChannel(
      {
        name: "테스트 채널",
        type: ChannelType.KAKAO_ALIMTALK,
        provider: "kakao",
        profileKey: "test-profile-key",
      },
      "user-1",
    );

    expect(channel.id).toBeDefined();
    expect(channel.name).toBe("테스트 채널");

    // Read
    const retrieved = await crud.getChannel(channel.id);
    expect(retrieved).toEqual(channel);

    // Update
    const updated = await crud.updateChannel(
      channel.id,
      {
        name: "수정된 채널",
        status: ChannelStatus.ACTIVE,
      },
      "user-1",
    );

    expect(updated.name).toBe("수정된 채널");
    expect(updated.status).toBe(ChannelStatus.ACTIVE);
    expect(updated.updatedAt.getTime()).toBeGreaterThanOrEqual(
      channel.updatedAt.getTime(),
    );

    // Delete
    const deleted = await crud.deleteChannel(channel.id, "user-1");
    expect(deleted).toBe(true);
  });

  test("should list channels with filters and pagination", async () => {
    const crud = new ChannelCRUD();

    // Create test channels
    for (let i = 0; i < 25; i++) {
      await crud.createChannel({
        name: `채널 ${i}`,
        type: i % 2 === 0 ? ChannelType.KAKAO_ALIMTALK : ChannelType.SMS,
        provider: "kakao",
        profileKey: `key-${i}`,
      });
    }

    // Test pagination
    const page1 = await crud.listChannels({}, { page: 1, limit: 10 });
    expect(page1.data).toHaveLength(10);
    expect(page1.total).toBe(25);
    expect(page1.hasNext).toBe(true);
    expect(page1.hasPrev).toBe(false);

    const page2 = await crud.listChannels({}, { page: 2, limit: 10 });
    expect(page2.data).toHaveLength(10);
    expect(page2.hasNext).toBe(true);
    expect(page2.hasPrev).toBe(true);

    // Test filtering
    const alimtalkChannels = await crud.listChannels({
      type: ChannelType.KAKAO_ALIMTALK,
    });
    expect(
      alimtalkChannels.data.every((c) => c.type === ChannelType.KAKAO_ALIMTALK),
    ).toBe(true);
  });

  test("should track audit logs", async () => {
    const crud = new ChannelCRUD({ enableAuditLog: true });

    const channel = await crud.createChannel(
      {
        name: "감사 테스트 채널",
        type: ChannelType.KAKAO_ALIMTALK,
        provider: "kakao",
        profileKey: "audit-test",
      },
      "user-1",
    );

    await crud.updateChannel(channel.id, { name: "수정된 채널" }, "user-2");
    await crud.deleteChannel(channel.id, "user-1");

    const auditLogs = crud.getAuditLogs("channel", channel.id);
    expect(auditLogs).toHaveLength(3); // create, update, delete

    // Check that all expected operations are logged
    const actions = auditLogs.map((log) => log.action).sort();
    expect(actions).toEqual(["create", "delete", "update"]);
  });

  test("should get statistics", async () => {
    const crud = new ChannelCRUD();

    await crud.createChannel({
      name: "통계 테스트 1",
      type: ChannelType.KAKAO_ALIMTALK,
      provider: "kakao",
      profileKey: "stats-1",
    });

    await crud.createChannel({
      name: "통계 테스트 2",
      type: ChannelType.SMS,
      provider: "sms-provider",
      profileKey: "stats-2",
    });

    const stats = crud.getStatistics();
    expect(stats.channels.total).toBe(2);
    expect(stats.channels.byType[ChannelType.KAKAO_ALIMTALK]).toBe(1);
    expect(stats.channels.byType[ChannelType.SMS]).toBe(1);
    expect(stats.channels.byProvider["kakao"]).toBe(1);
    expect(stats.channels.byProvider["sms-provider"]).toBe(1);
  });
});

describe("PermissionManager", () => {
  test("should create users and roles", async () => {
    const permissionManager = new PermissionManager();

    // Create user
    const user = await permissionManager.createUser({
      email: "test@example.com",
      name: "홍길동",
      roles: [],
      isActive: true,
    });

    expect(user.id).toBeDefined();
    expect(user.email).toBe("test@example.com");

    // Create role
    const role = await permissionManager.createRole({
      name: "채널 관리자",
      description: "채널 관리 권한",
      isSystem: false,
      permissions: [
        {
          id: "channel-manage",
          resource: ResourceType.CHANNEL,
          action: ActionType.MANAGE,
          scope: PermissionScope.ORGANIZATION,
        },
      ],
    });

    expect(role.id).toBeDefined();
    expect(role.name).toBe("채널 관리자");
  });

  test("should assign roles to users and check permissions", async () => {
    const permissionManager = new PermissionManager();

    const user = await permissionManager.createUser({
      email: "test@example.com",
      name: "홍길동",
      roles: [],
      isActive: true,
    });

    const role = await permissionManager.createRole({
      name: "채널 뷰어",
      description: "채널 조회 권한",
      isSystem: false,
      permissions: [
        {
          id: "channel-read",
          resource: ResourceType.CHANNEL,
          action: ActionType.READ,
          scope: PermissionScope.ORGANIZATION,
        },
      ],
    });

    // Assign role
    await permissionManager.assignRoleToUser(user.id, role.id);

    // Check permission
    const hasReadPermission = await permissionManager.hasPermission(
      user.id,
      ResourceType.CHANNEL,
      ActionType.READ,
    );
    expect(hasReadPermission).toBe(true);

    const hasDeletePermission = await permissionManager.hasPermission(
      user.id,
      ResourceType.CHANNEL,
      ActionType.DELETE,
    );
    expect(hasDeletePermission).toBe(false);
  });

  test("should use system roles", async () => {
    const permissionManager = new PermissionManager();

    const user = await permissionManager.createUser({
      email: "admin@example.com",
      name: "관리자",
      roles: [],
      isActive: true,
    });

    // Get super admin role
    const superAdminRole = await permissionManager.getRole("super-admin");
    expect(superAdminRole).toBeDefined();
    expect(superAdminRole!.isSystem).toBe(true);

    // Assign super admin role
    await permissionManager.assignRoleToUser(user.id, "super-admin");

    // Super admin should have all permissions
    const hasAllPermissions = await permissionManager.hasPermission(
      user.id,
      ResourceType.CHANNEL,
      ActionType.DELETE,
    );
    expect(hasAllPermissions).toBe(true);
  });

  test("should prevent deletion of system roles", async () => {
    const permissionManager = new PermissionManager();

    await expect(permissionManager.deleteRole("super-admin")).rejects.toThrow(
      "Cannot delete system roles",
    );
  });
});

describe("BusinessVerifier", () => {
  test("should submit business verification request", async () => {
    const verifier = new BusinessVerifier();

    const businessInfo = {
      businessName: "테스트 회사",
      businessRegistrationNumber: "123-45-67890",
      businessType: "corporation" as const,
      industry: "IT",
      establishedDate: new Date("2020-01-01"),
      address: {
        street: "서울시 강남구 테헤란로 123",
        city: "서울",
        state: "서울특별시",
        postalCode: "12345",
        country: "KR",
      },
      contactInfo: {
        phoneNumber: "02-1234-5678",
        email: "contact@test.com",
      },
      representatives: [
        {
          name: "홍길동",
          position: "CEO",
          phoneNumber: "010-1234-5678",
          email: "ceo@test.com",
        },
      ],
    };

    const documents = [
      {
        id: "doc-1",
        type: DocumentType.BUSINESS_REGISTRATION,
        fileName: "business_registration.pdf",
        fileUrl: "https://example.com/doc.pdf",
        uploadedAt: new Date(),
        status: DocumentStatus.UPLOADED,
      },
    ];

    const request = await verifier.submitVerification(
      "channel-1",
      businessInfo,
      documents,
    );

    expect(request.id).toBeDefined();
    expect(request.channelId).toBe("channel-1");
    expect(request.businessInfo).toEqual(businessInfo);
    expect(request.status).toBe(VerificationStatus.UNDER_REVIEW);
  });

  test("should validate required documents", async () => {
    const verifier = new BusinessVerifier({
      requiredDocuments: [
        DocumentType.BUSINESS_REGISTRATION,
        DocumentType.ID_CARD,
      ],
    });

    const businessInfo = {
      businessName: "테스트 회사",
      businessRegistrationNumber: "123-45-67890",
      businessType: "corporation" as const,
      industry: "IT",
      establishedDate: new Date(),
      address: {
        street: "서울시 강남구",
        city: "서울",
        state: "서울특별시",
        postalCode: "12345",
        country: "KR",
      },
      contactInfo: {
        phoneNumber: "02-1234-5678",
        email: "contact@test.com",
      },
      representatives: [],
    };

    const documents = [
      {
        id: "doc-1",
        type: DocumentType.BUSINESS_REGISTRATION,
        fileName: "business_registration.pdf",
        fileUrl: "https://example.com/doc.pdf",
        uploadedAt: new Date(),
        status: DocumentStatus.UPLOADED,
      },
    ];

    await expect(
      verifier.submitVerification("channel-1", businessInfo, documents),
    ).rejects.toThrow("Missing required documents: ID_CARD");
  });

  test("should manually approve verification", async () => {
    const verifier = new BusinessVerifier({ enableAutoVerification: false });

    const businessInfo = {
      businessName: "테스트 회사",
      businessRegistrationNumber: "123-45-67890",
      businessType: "corporation" as const,
      industry: "IT",
      establishedDate: new Date(),
      address: {
        street: "서울시 강남구",
        city: "서울",
        state: "서울특별시",
        postalCode: "12345",
        country: "KR",
      },
      contactInfo: {
        phoneNumber: "02-1234-5678",
        email: "contact@test.com",
      },
      representatives: [],
    };

    const documents = [
      {
        id: "doc-1",
        type: DocumentType.BUSINESS_REGISTRATION,
        fileName: "business_registration.pdf",
        fileUrl: "https://example.com/doc.pdf",
        uploadedAt: new Date(),
        status: DocumentStatus.UPLOADED,
      },
    ];

    const request = await verifier.submitVerification(
      "channel-1",
      businessInfo,
      documents,
    );

    const approved = await verifier.approveVerification(
      request.id,
      "reviewer-1",
      "모든 서류 확인 완료",
    );

    expect(approved.status).toBe(VerificationStatus.VERIFIED);
    expect(approved.reviewedBy).toBe("reviewer-1");
    expect(approved.reviewNotes).toBe("모든 서류 확인 완료");
  });
});

describe("NumberVerifier", () => {
  // Mock SMS provider for testing
  const mockSMSProvider = {
    id: "mock-sms",
    name: "Mock SMS Provider",
    sendSMS: async (phoneNumber: string, message: string) => ({
      messageId: `msg-${Date.now()}`,
      status: "sent" as const,
    }),
  };

  test("should start phone verification", async () => {
    const verifier = new NumberVerifier({
      smsProvider: mockSMSProvider,
      codeExpiryMinutes: 5,
    });

    const request = await verifier.startVerification(
      "sender-1",
      "01012345678",
      VerificationType.SMS,
    );

    expect(request.id).toBeDefined();
    expect(request.phoneNumber).toBe("01012345678");
    expect(request.verificationType).toBe(VerificationType.SMS);
    expect(request.verificationCode).toMatch(/^\d{6}$/);
    expect(request.attempts).toHaveLength(1);
  });

  test("should verify correct code", async () => {
    const verifier = new NumberVerifier({
      smsProvider: mockSMSProvider,
    });

    const request = await verifier.startVerification("sender-1", "01012345678");

    const result = await verifier.verifyCode(
      request.id,
      request.verificationCode,
    );

    expect(result.success).toBe(true);
    expect(result.status).toBe("verified");
  });

  test("should reject incorrect code", async () => {
    const verifier = new NumberVerifier({
      smsProvider: mockSMSProvider,
      maxAttempts: 3,
    });

    const request = await verifier.startVerification("sender-1", "01012345678");

    const result = await verifier.verifyCode(request.id, "000000");

    expect(result.success).toBe(false);
    expect(result.status).toBe("failed");
    expect(result.message).toContain("2 attempts remaining");
  });

  test("should block after max attempts", async () => {
    const verifier = new NumberVerifier({
      smsProvider: mockSMSProvider,
      maxAttempts: 3,
    });

    const request = await verifier.startVerification("sender-1", "01012345678");

    // First failed attempt
    await verifier.verifyCode(request.id, "000000");

    // Second failed attempt
    await verifier.verifyCode(request.id, "111111");

    // Third failed attempt should block
    const result = await verifier.verifyCode(request.id, "222222");

    expect(result.success).toBe(false);
    expect(result.status).toBe("blocked");
    expect(result.message).toContain("blocked");
  });

  test("should handle expired codes", async () => {
    const verifier = new NumberVerifier({
      smsProvider: mockSMSProvider,
      codeExpiryMinutes: 0.01, // 0.6 seconds
    });

    const request = await verifier.startVerification("sender-1", "01012345678");

    // Wait for expiry
    await new Promise((resolve) => setTimeout(resolve, 1000)); // Wait longer for expiry

    const result = await verifier.verifyCode(
      request.id,
      request.verificationCode,
    );

    expect(result.success).toBe(false);
    expect(result.status).toBe("expired");
  });

  test("should reject invalid phone numbers", async () => {
    const verifier = new NumberVerifier({
      smsProvider: mockSMSProvider,
    });

    await expect(
      verifier.startVerification("sender-1", "123-456-7890"),
    ).rejects.toThrow("Invalid phone number format");
  });

  test("should handle rate limiting", async () => {
    const verifier = new NumberVerifier({
      smsProvider: mockSMSProvider,
      rateLimitMinutes: 1,
    });

    // First verification should succeed
    await verifier.startVerification("sender-1", "01012345678");

    // Second verification within rate limit should fail
    await expect(
      verifier.startVerification("sender-2", "01012345678"),
    ).rejects.toThrow("Rate limit exceeded");
  });

  test("should not allow rate limit bypass via phone number formatting", async () => {
    const verifier = new NumberVerifier({
      smsProvider: mockSMSProvider,
      rateLimitMinutes: 1,
    });

    await verifier.startVerification("sender-1", "010-1234-5678");

    await expect(
      verifier.startVerification("sender-2", "01012345678"),
    ).rejects.toThrow("Rate limit exceeded");
  });

  test("should treat blocked numbers consistently regardless of formatting", async () => {
    const verifier = new NumberVerifier({
      smsProvider: mockSMSProvider,
      blockedNumbers: ["010-1234-5678"],
    });

    await expect(
      verifier.startVerification("sender-1", "01012345678"),
    ).rejects.toThrow("Phone number is blocked");
  });

  test("should not count send failures as user verification attempts", async () => {
    const verifier = new NumberVerifier({
      maxAttempts: 3,
      smsProvider: {
        id: "mock-sms-fail",
        name: "Mock SMS Provider (Fail)",
        sendSMS: async () => ({
          messageId: "msg-fail",
          status: "failed" as const,
          error: "SMS sending failed",
        }),
      },
      voiceProvider: {
        id: "mock-voice",
        name: "Mock Voice Provider",
        makeCall: async () => ({
          callId: "call-1",
          status: "initiated" as const,
        }),
      },
      enableVoiceFallback: true,
    });

    const request = await verifier.startVerification("sender-1", "01012345678");

    // First invalid code should leave 2 attempts remaining (send failure must not consume attempts)
    const result = await verifier.verifyCode(request.id, "000000");
    expect(result.success).toBe(false);
    expect(result.status).toBe("failed");
    expect(result.message).toContain("2 attempts remaining");
  });

  test("should get verification statistics", async () => {
    const verifier = new NumberVerifier({
      smsProvider: mockSMSProvider,
    });

    // Create some test verifications
    const request1 = await verifier.startVerification(
      "sender-1",
      "01012345678",
    );
    const request2 = await verifier.startVerification(
      "sender-2",
      "01087654321",
    );

    // Verify one
    await verifier.verifyCode(request1.id, request1.verificationCode);

    const stats = verifier.getVerificationStats();

    expect(stats.total).toBe(2);
    expect(stats.byStatus["verified"]).toBe(1);
    expect(stats.byStatus["code_sent"]).toBe(1);
    expect(stats.successRate).toBe(50);
  });
});

describe("Integration Tests", () => {
  test("should work together in complete channel setup workflow", async () => {
    // Initialize all components
    const channelManager = new KakaoChannelManager();
    const senderManager = new KakaoSenderNumberManager();
    const crud = new ChannelCRUD();
    const permissionManager = new PermissionManager();
    const businessVerifier = new BusinessVerifier();
    const numberVerifier = new NumberVerifier({
      smsProvider: {
        id: "mock-sms",
        name: "Mock SMS",
        sendSMS: async () => ({ messageId: "msg-1", status: "sent" as const }),
      },
    });

    // 1. Create user and assign permissions
    const user = await permissionManager.createUser({
      email: "channel-admin@example.com",
      name: "채널 관리자",
      roles: [],
      isActive: true,
    });

    await permissionManager.assignRoleToUser(user.id, "channel-admin");

    // 2. Check permissions
    const hasChannelPermission = await permissionManager.hasPermission(
      user.id,
      ResourceType.CHANNEL,
      ActionType.MANAGE,
    );
    expect(hasChannelPermission).toBe(true);

    // 3. Create channel via CRUD
    const channel = await crud.createChannel(
      {
        name: "통합 테스트 채널",
        type: ChannelType.KAKAO_ALIMTALK,
        provider: "kakao",
        profileKey: "integration-test",
        kakaoInfo: {
          plusFriendId: "@integration",
          brandName: "통합 테스트",
        },
        businessInfo: {
          name: "통합 테스트 회사",
          registrationNumber: "123-45-67890",
          category: "IT",
          contactPerson: "홍길동",
          contactEmail: "test@integration.com",
          contactPhone: "02-1234-5678",
        },
      },
      user.id,
    );

    expect(channel.id).toBeDefined();

    // 4. Submit business verification
    const businessInfo = {
      businessName: "통합 테스트 회사",
      businessRegistrationNumber: "123-45-67890",
      businessType: "corporation" as const,
      industry: "IT",
      establishedDate: new Date("2020-01-01"),
      address: {
        street: "서울시 강남구 테헤란로 123",
        city: "서울",
        state: "서울특별시",
        postalCode: "12345",
        country: "KR",
      },
      contactInfo: {
        phoneNumber: "02-1234-5678",
        email: "contact@integration.com",
      },
      representatives: [
        {
          name: "홍길동",
          position: "CEO",
          phoneNumber: "010-1234-5678",
          email: "ceo@integration.com",
        },
      ],
    };

    const documents = [
      {
        id: "doc-integration",
        type: DocumentType.BUSINESS_REGISTRATION,
        fileName: "business_registration.pdf",
        fileUrl: "https://example.com/doc.pdf",
        uploadedAt: new Date(),
        status: DocumentStatus.UPLOADED,
      },
    ];

    const verificationRequest = await businessVerifier.submitVerification(
      channel.id,
      businessInfo,
      documents,
    );
    expect(verificationRequest.id).toBeDefined();

    // 5. Add sender number
    const senderNumber = await crud.createSenderNumber(
      channel.id,
      {
        phoneNumber: "01012345678",
        category: SenderNumberCategory.BUSINESS,
        businessInfo: {
          businessName: "통합 테스트 회사",
          businessRegistrationNumber: "123-45-67890",
          contactPerson: "홍길동",
          contactEmail: "test@integration.com",
        },
      },
      user.id,
    );

    expect(senderNumber.phoneNumber).toBe("01012345678");

    // 6. Verify phone number
    const phoneVerificationRequest = await numberVerifier.startVerification(
      senderNumber.id,
      "01012345678",
    );

    const phoneVerificationResult = await numberVerifier.verifyCode(
      phoneVerificationRequest.id,
      phoneVerificationRequest.verificationCode,
    );
    expect(phoneVerificationResult.success).toBe(true);

    // 7. Check final state
    const finalChannel = await crud.getChannel(channel.id);
    const finalSenderNumber = await crud.getSenderNumber(senderNumber.id);
    const auditLogs = crud.getAuditLogs();

    expect(finalChannel).toBeDefined();
    expect(finalSenderNumber).toBeDefined();
    expect(auditLogs.length).toBeGreaterThan(0);

    // 8. Verify statistics
    const crudStats = crud.getStatistics();
    const permissionStats = await permissionManager.listUsers();
    const businessStats = businessVerifier.getVerificationStats();
    const phoneStats = numberVerifier.getVerificationStats();

    expect(crudStats.channels.total).toBe(1);
    expect(crudStats.senderNumbers.total).toBe(1);
    expect(permissionStats.length).toBe(1);
    expect(businessStats.total).toBe(1);
    expect(phoneStats.total).toBe(1);
    expect(phoneStats.successRate).toBe(100);
  });
});
