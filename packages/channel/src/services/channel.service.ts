import type { ChannelConfig, ChannelVerificationResult, SenderNumber } from '../types/channel.types';
import { SenderNumberStatus } from '../types/channel.types';

// Define a service-specific SenderNumber interface that extends the types from channel.types
export interface ServiceSenderNumber {
  phoneNumber: string;
  name?: string;
  verifiedAt?: Date;
  status: SenderNumberStatus;
  channelId: string;
}

export class ChannelService {
  private channels: Map<string, ChannelConfig> = new Map();
  private senderNumbers: Map<string, ServiceSenderNumber> = new Map();

  async createChannel(channel: Omit<ChannelConfig, 'id' | 'createdAt' | 'updatedAt'>): Promise<ChannelConfig> {
    const newChannel: ChannelConfig = {
      ...channel,
      id: this.generateChannelId(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.channels.set(newChannel.id, newChannel);
    return newChannel;
  }

  async getChannel(channelId: string): Promise<ChannelConfig | null> {
    return this.channels.get(channelId) || null;
  }

  async listChannels(providerId?: string): Promise<ChannelConfig[]> {
    const channels = Array.from(this.channels.values());
    
    if (providerId) {
      return channels.filter(c => c.providerId === providerId);
    }
    
    return channels;
  }

  async updateChannel(channelId: string, updates: Partial<ChannelConfig>): Promise<ChannelConfig> {
    const channel = this.channels.get(channelId);
    if (!channel) {
      throw new Error(`Channel ${channelId} not found`);
    }

    const updatedChannel = {
      ...channel,
      ...updates,
      updatedAt: new Date(),
    };

    this.channels.set(channelId, updatedChannel);
    return updatedChannel;
  }

  async deleteChannel(channelId: string): Promise<void> {
    this.channels.delete(channelId);
    
    // 관련 발신번호도 삭제
    for (const [key, senderNumber] of this.senderNumbers.entries()) {
      if (senderNumber.channelId === channelId) {
        this.senderNumbers.delete(key);
      }
    }
  }

  async addSenderNumber(channelId: string, phoneNumber: string, name?: string): Promise<ServiceSenderNumber> {
    const channel = this.channels.get(channelId);
    if (!channel) {
      throw new Error(`Channel ${channelId} not found`);
    }

    const senderNumber: ServiceSenderNumber = {
      phoneNumber,
      name,
      status: SenderNumberStatus.PENDING,
      channelId,
    };

    this.senderNumbers.set(phoneNumber, senderNumber);
    return senderNumber;
  }

  async verifySenderNumber(phoneNumber: string): Promise<ChannelVerificationResult> {
    const senderNumber = this.senderNumbers.get(phoneNumber);
    if (!senderNumber) {
      return {
        success: false,
        status: 'not_found',
        error: 'Sender number not found',
      };
    }

    // 실제 검증 로직 (API 호출 등)
    const verificationCode = Math.floor(Math.random() * 900000) + 100000;

    senderNumber.verifiedAt = new Date();
    senderNumber.status = SenderNumberStatus.VERIFIED;

    this.senderNumbers.set(phoneNumber, senderNumber);

    return {
      success: true,
      status: 'verified',
      verificationCode: verificationCode.toString(),
    };
  }

  async getSenderNumbers(channelId?: string): Promise<ServiceSenderNumber[]> {
    const senderNumbers = Array.from(this.senderNumbers.values());
    
    if (channelId) {
      return senderNumbers.filter(s => s.channelId === channelId);
    }
    
    return senderNumbers;
  }

  private generateChannelId(): string {
    return `ch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}