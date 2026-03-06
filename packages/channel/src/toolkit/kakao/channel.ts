import {
  type Channel,
  type ChannelCreateRequest,
  ChannelStatus,
  ChannelType,
} from "../../types/channel.types";

export class KakaoChannelManager {
  private channels: Map<string, Channel> = new Map();

  async createChannel(request: ChannelCreateRequest): Promise<Channel> {
    // Validate Kakao-specific requirements
    this.validateKakaoChannelRequest(request);

    const channelId = this.generateChannelId();

    const channel: Channel = {
      id: channelId,
      name: request.name,
      provider: request.provider,
      type: request.type,
      status: ChannelStatus.ACTIVE,
      profileKey: request.profileKey,
      senderNumbers: [],
      metadata: {
        businessInfo: request.businessInfo,
        kakaoInfo: request.kakaoInfo,
        limits: {
          dailyMessageLimit: 10000,
          monthlyMessageLimit: 300000,
          rateLimit: 10, // 10 messages per second
        },
        features: {
          supportsBulkSending: true,
          supportsScheduling: true,
          supportsButtons: true,
          maxButtonCount: 5,
        },
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.channels.set(channelId, channel);

    return channel;
  }

  private validateKakaoChannelRequest(request: ChannelCreateRequest): void {
    if (
      request.type !== ChannelType.KAKAO_ALIMTALK &&
      request.type !== ChannelType.KAKAO_FRIENDTALK
    ) {
      throw new Error("Invalid channel type for Kakao channel");
    }

    if (!request.kakaoInfo?.plusFriendId) {
      throw new Error("Plus Friend ID is required for Kakao channels");
    }

    if (!request.kakaoInfo?.brandName) {
      throw new Error("Brand name is required for Kakao channels");
    }

    // Validate Plus Friend ID format
    if (!this.isValidPlusFriendId(request.kakaoInfo.plusFriendId)) {
      throw new Error("Invalid Plus Friend ID format");
    }
  }

  private isValidPlusFriendId(plusFriendId: string): boolean {
    // Plus Friend ID should start with @ and contain only allowed characters
    const regex = /^@[a-zA-Z0-9_-]{3,30}$/;
    return regex.test(plusFriendId);
  }

  async getChannel(channelId: string): Promise<Channel | null> {
    return this.channels.get(channelId) || null;
  }

  async updateChannel(
    channelId: string,
    updates: Partial<Channel>,
  ): Promise<Channel> {
    const channel = this.channels.get(channelId);
    if (!channel) {
      throw new Error("Channel not found");
    }

    // Validate updates
    if (
      updates.metadata?.kakaoInfo?.plusFriendId &&
      !this.isValidPlusFriendId(updates.metadata.kakaoInfo.plusFriendId)
    ) {
      throw new Error("Invalid Plus Friend ID format");
    }

    // Apply updates
    Object.assign(channel, updates, { updatedAt: new Date() });

    return channel;
  }

  async deleteChannel(channelId: string): Promise<boolean> {
    const channel = this.channels.get(channelId);
    if (!channel) {
      return false;
    }

    // Soft delete - mark as deleted instead of removing
    channel.status = ChannelStatus.DELETED;
    channel.updatedAt = new Date();

    return true;
  }

  async listChannels(filters?: {
    status?: ChannelStatus;
    type?: ChannelType;
  }): Promise<Channel[]> {
    let channels = Array.from(this.channels.values());

    if (filters) {
      if (filters.status) {
        channels = channels.filter((c) => c.status === filters.status);
      }
      if (filters.type) {
        channels = channels.filter((c) => c.type === filters.type);
      }
    }

    // Exclude deleted channels unless specifically requested
    if (filters?.status === ChannelStatus.DELETED) {
      return channels;
    }

    return channels.filter((c) => c.status !== ChannelStatus.DELETED);
  }

  async suspendChannel(channelId: string, reason: string): Promise<void> {
    const channel = this.channels.get(channelId);
    if (!channel) {
      throw new Error("Channel not found");
    }

    channel.status = ChannelStatus.SUSPENDED;
    channel.updatedAt = new Date();

    // In a real implementation, persist to an audit log (do not console.log in library code).
    void reason;
  }

  async reactivateChannel(channelId: string): Promise<void> {
    const channel = this.channels.get(channelId);
    if (!channel) {
      throw new Error("Channel not found");
    }

    if (channel.status !== ChannelStatus.SUSPENDED) {
      throw new Error("Channel is not suspended");
    }

    channel.status = ChannelStatus.ACTIVE;
    channel.updatedAt = new Date();
  }

  async checkChannelHealth(channelId: string): Promise<{
    isHealthy: boolean;
    issues: string[];
    recommendations: string[];
  }> {
    const channel = this.channels.get(channelId);
    if (!channel) {
      throw new Error("Channel not found");
    }

    const issues: string[] = [];
    const recommendations: string[] = [];

    // Check channel status
    if (channel.status !== ChannelStatus.ACTIVE) {
      issues.push(`Channel status is ${channel.status}`);
    }

    // Check if channel has sender numbers
    if (channel.senderNumbers.length === 0) {
      recommendations.push("Add at least one verified sender number");
    }

    // Check business info completeness
    if (!channel.metadata.businessInfo) {
      recommendations.push(
        "Complete business information for better deliverability",
      );
    }

    return {
      isHealthy: issues.length === 0,
      issues,
      recommendations,
    };
  }

  private generateChannelId(): string {
    return `kakao_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
