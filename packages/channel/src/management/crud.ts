/**
 * Channel CRUD Operations
 * 채널 생성, 조회, 수정, 삭제 통합 관리
 */

import { EventEmitter } from "node:events";
import {
  type Channel,
  type ChannelCreateRequest,
  type ChannelFilters,
  ChannelStatus,
  ChannelType,
  type SenderNumber,
  type SenderNumberCreateRequest,
  type SenderNumberFilters,
  SenderNumberStatus,
  VerificationStatus,
} from "../types/channel.types";

export interface PaginationOptions {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface ChannelCRUDOptions {
  enableAuditLog: boolean;
  enableEventEmission: boolean;
  defaultPageSize: number;
  maxPageSize: number;
  enableSoftDelete: boolean;
  autoCleanup: boolean;
  cleanupInterval: number; // in milliseconds
}

export interface AuditLogEntry {
  id: string;
  entityType: "channel" | "senderNumber";
  entityId: string;
  action:
    | "create"
    | "read"
    | "update"
    | "delete"
    | "verify"
    | "suspend"
    | "activate";
  userId?: string;
  timestamp: Date;
  changes?: {
    before: any;
    after: any;
  };
  metadata?: Record<string, any>;
}

export class ChannelCRUD extends EventEmitter {
  private channels = new Map<string, Channel>();
  private senderNumbers = new Map<string, SenderNumber>();
  private auditLogs: AuditLogEntry[] = [];
  private cleanupTimer?: NodeJS.Timeout;

  private defaultOptions: ChannelCRUDOptions = {
    enableAuditLog: true,
    enableEventEmission: true,
    defaultPageSize: 20,
    maxPageSize: 100,
    enableSoftDelete: true,
    autoCleanup: true,
    cleanupInterval: 3600000, // 1 hour
  };

  constructor(private options: Partial<ChannelCRUDOptions> = {}) {
    super();
    this.options = { ...this.defaultOptions, ...options };

    if (this.options.autoCleanup) {
      this.startAutoCleanup();
    }
  }

  // Channel CRUD Operations
  async createChannel(
    request: ChannelCreateRequest,
    userId?: string,
  ): Promise<Channel> {
    const channelId = this.generateChannelId();

    const channel: Channel = {
      id: channelId,
      name: request.name,
      provider: request.provider,
      type: request.type,
      status: ChannelStatus.PENDING,
      profileKey: request.profileKey,
      senderNumbers: [],
      metadata: {
        businessInfo: request.businessInfo,
        kakaoInfo: request.kakaoInfo,
        limits: this.getDefaultLimits(request.type),
        features: this.getDefaultFeatures(request.type),
      },
      verification: {
        status: request.businessInfo
          ? VerificationStatus.PENDING
          : VerificationStatus.NOT_REQUIRED,
        documents: [],
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.channels.set(channelId, channel);

    // Audit log
    if (this.options.enableAuditLog) {
      this.addAuditLog(
        "channel",
        channelId,
        "create",
        userId,
        undefined,
        channel,
      );
    }

    // Event emission
    if (this.options.enableEventEmission) {
      this.emit("channel:created", { channel, userId });
    }

    return channel;
  }

  async getChannel(
    channelId: string,
    userId?: string,
  ): Promise<Channel | null> {
    const channel = this.channels.get(channelId);

    if (channel && this.options.enableAuditLog) {
      this.addAuditLog("channel", channelId, "read", userId);
    }

    return channel || null;
  }

  async updateChannel(
    channelId: string,
    updates: Partial<Omit<Channel, "id" | "createdAt" | "updatedAt">>,
    userId?: string,
  ): Promise<Channel> {
    const channel = this.channels.get(channelId);
    if (!channel) {
      throw new Error(`Channel ${channelId} not found`);
    }

    const before = this.options.enableAuditLog ? { ...channel } : undefined;

    // Apply updates
    const updatedChannel = {
      ...channel,
      ...updates,
      id: channelId, // Ensure ID doesn't change
      updatedAt: new Date(),
    };

    this.channels.set(channelId, updatedChannel);

    // Audit log
    if (this.options.enableAuditLog) {
      this.addAuditLog(
        "channel",
        channelId,
        "update",
        userId,
        before,
        updatedChannel,
      );
    }

    // Event emission
    if (this.options.enableEventEmission) {
      this.emit("channel:updated", {
        channel: updatedChannel,
        previousChannel: channel,
        userId,
      });
    }

    return updatedChannel;
  }

  async deleteChannel(channelId: string, userId?: string): Promise<boolean> {
    const channel = this.channels.get(channelId);
    if (!channel) {
      return false;
    }

    if (this.options.enableSoftDelete) {
      // Soft delete - mark as deleted
      channel.status = ChannelStatus.DELETED;
      channel.updatedAt = new Date();
    } else {
      // Hard delete - remove from memory
      this.channels.delete(channelId);

      // Also delete associated sender numbers
      for (const [id, senderNumber] of this.senderNumbers) {
        if (senderNumber.channelId === channelId) {
          this.senderNumbers.delete(id);
        }
      }
    }

    // Audit log
    if (this.options.enableAuditLog) {
      this.addAuditLog("channel", channelId, "delete", userId, channel);
    }

    // Event emission
    if (this.options.enableEventEmission) {
      this.emit("channel:deleted", { channel, userId });
    }

    return true;
  }

  async listChannels(
    filters: ChannelFilters = {},
    pagination: PaginationOptions = {
      page: 1,
      limit: this.options.defaultPageSize!,
    },
  ): Promise<PaginatedResult<Channel>> {
    let channels = Array.from(this.channels.values());

    // Apply filters
    if (filters.provider) {
      channels = channels.filter((c) => c.provider === filters.provider);
    }
    if (filters.type) {
      channels = channels.filter((c) => c.type === filters.type);
    }
    if (filters.status) {
      channels = channels.filter((c) => c.status === filters.status);
    }
    if (filters.verified !== undefined) {
      const targetStatus = filters.verified
        ? VerificationStatus.VERIFIED
        : VerificationStatus.PENDING;
      channels = channels.filter((c) => c.verification.status === targetStatus);
    }
    if (filters.createdAfter) {
      channels = channels.filter((c) => c.createdAt >= filters.createdAfter!);
    }
    if (filters.createdBefore) {
      channels = channels.filter((c) => c.createdAt <= filters.createdBefore!);
    }

    // Exclude soft deleted channels unless specifically requested
    if (!filters.status || filters.status !== ChannelStatus.DELETED) {
      channels = channels.filter((c) => c.status !== ChannelStatus.DELETED);
    }

    // Apply sorting
    const sortBy = pagination.sortBy || "createdAt";
    const sortOrder = pagination.sortOrder || "desc";

    channels.sort((a, b) => {
      let aValue: any, bValue: any;

      switch (sortBy) {
        case "name":
          aValue = a.name;
          bValue = b.name;
          break;
        case "createdAt":
          aValue = a.createdAt.getTime();
          bValue = b.createdAt.getTime();
          break;
        case "updatedAt":
          aValue = a.updatedAt.getTime();
          bValue = b.updatedAt.getTime();
          break;
        default:
          aValue = a.createdAt.getTime();
          bValue = b.createdAt.getTime();
      }

      if (sortOrder === "asc") {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

    // Apply pagination
    const total = channels.length;
    const limit = Math.min(pagination.limit, this.options.maxPageSize!);
    const page = Math.max(1, pagination.page);
    const offset = (page - 1) * limit;
    const paginatedChannels = channels.slice(offset, offset + limit);

    return {
      data: paginatedChannels,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasNext: offset + limit < total,
      hasPrev: page > 1,
    };
  }

  // Sender Number CRUD Operations
  async createSenderNumber(
    channelId: string,
    request: SenderNumberCreateRequest,
    userId?: string,
  ): Promise<SenderNumber> {
    const channel = this.channels.get(channelId);
    if (!channel) {
      throw new Error(`Channel ${channelId} not found`);
    }

    const senderNumberId = this.generateSenderNumberId();

    const senderNumber: SenderNumber = {
      id: senderNumberId,
      channelId,
      phoneNumber: request.phoneNumber,
      status: SenderNumberStatus.PENDING,
      category: request.category,
      metadata: {
        businessName: request.businessInfo?.businessName,
        businessRegistrationNumber:
          request.businessInfo?.businessRegistrationNumber,
        contactPerson: request.businessInfo?.contactPerson,
        contactEmail: request.businessInfo?.contactEmail,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.senderNumbers.set(senderNumberId, senderNumber);

    // Add to channel's sender numbers
    channel.senderNumbers.push(senderNumber);
    channel.updatedAt = new Date();

    // Audit log
    if (this.options.enableAuditLog) {
      this.addAuditLog(
        "senderNumber",
        senderNumberId,
        "create",
        userId,
        undefined,
        senderNumber,
      );
    }

    // Event emission
    if (this.options.enableEventEmission) {
      this.emit("senderNumber:created", { senderNumber, channelId, userId });
    }

    return senderNumber;
  }

  async getSenderNumber(
    senderNumberId: string,
    userId?: string,
  ): Promise<SenderNumber | null> {
    const senderNumber = this.senderNumbers.get(senderNumberId);

    if (senderNumber && this.options.enableAuditLog) {
      this.addAuditLog("senderNumber", senderNumberId, "read", userId);
    }

    return senderNumber || null;
  }

  async updateSenderNumber(
    senderNumberId: string,
    updates: Partial<
      Omit<SenderNumber, "id" | "phoneNumber" | "createdAt" | "updatedAt">
    >,
    userId?: string,
  ): Promise<SenderNumber> {
    const senderNumber = this.senderNumbers.get(senderNumberId);
    if (!senderNumber) {
      throw new Error(`Sender number ${senderNumberId} not found`);
    }

    const before = this.options.enableAuditLog
      ? { ...senderNumber }
      : undefined;

    // Apply updates
    const updatedSenderNumber = {
      ...senderNumber,
      ...updates,
      id: senderNumberId, // Ensure ID doesn't change
      updatedAt: new Date(),
    };

    this.senderNumbers.set(senderNumberId, updatedSenderNumber);

    // Update in channel's sender numbers array
    for (const channel of this.channels.values()) {
      const index = channel.senderNumbers.findIndex(
        (sn) => sn.id === senderNumberId,
      );
      if (index !== -1) {
        channel.senderNumbers[index] = updatedSenderNumber;
        channel.updatedAt = new Date();
        break;
      }
    }

    // Audit log
    if (this.options.enableAuditLog) {
      this.addAuditLog(
        "senderNumber",
        senderNumberId,
        "update",
        userId,
        before,
        updatedSenderNumber,
      );
    }

    // Event emission
    if (this.options.enableEventEmission) {
      this.emit("senderNumber:updated", {
        senderNumber: updatedSenderNumber,
        previousSenderNumber: senderNumber,
        userId,
      });
    }

    return updatedSenderNumber;
  }

  async deleteSenderNumber(
    senderNumberId: string,
    userId?: string,
  ): Promise<boolean> {
    const senderNumber = this.senderNumbers.get(senderNumberId);
    if (!senderNumber) {
      return false;
    }

    // Remove from memory
    this.senderNumbers.delete(senderNumberId);

    // Remove from channel's sender numbers array
    for (const channel of this.channels.values()) {
      const index = channel.senderNumbers.findIndex(
        (sn) => sn.id === senderNumberId,
      );
      if (index !== -1) {
        channel.senderNumbers.splice(index, 1);
        channel.updatedAt = new Date();
        break;
      }
    }

    // Audit log
    if (this.options.enableAuditLog) {
      this.addAuditLog(
        "senderNumber",
        senderNumberId,
        "delete",
        userId,
        senderNumber,
      );
    }

    // Event emission
    if (this.options.enableEventEmission) {
      this.emit("senderNumber:deleted", { senderNumber, userId });
    }

    return true;
  }

  async listSenderNumbers(
    filters: SenderNumberFilters = {},
    pagination: PaginationOptions = {
      page: 1,
      limit: this.options.defaultPageSize!,
    },
  ): Promise<PaginatedResult<SenderNumber>> {
    let senderNumbers = Array.from(this.senderNumbers.values());

    // Apply filters
    if (filters.channelId) {
      const channel = this.channels.get(filters.channelId);
      if (channel) {
        senderNumbers = channel.senderNumbers;
      } else {
        senderNumbers = [];
      }
    }
    if (filters.status) {
      senderNumbers = senderNumbers.filter(
        (sn) => sn.status === filters.status,
      );
    }
    if (filters.category) {
      senderNumbers = senderNumbers.filter(
        (sn) => sn.category === filters.category,
      );
    }
    if (filters.verified !== undefined) {
      if (filters.verified) {
        senderNumbers = senderNumbers.filter(
          (sn) => sn.status === SenderNumberStatus.VERIFIED,
        );
      } else {
        senderNumbers = senderNumbers.filter(
          (sn) => sn.status !== SenderNumberStatus.VERIFIED,
        );
      }
    }

    // Apply sorting
    const sortBy = pagination.sortBy || "createdAt";
    const sortOrder = pagination.sortOrder || "desc";

    senderNumbers.sort((a, b) => {
      let aValue: any, bValue: any;

      switch (sortBy) {
        case "phoneNumber":
          aValue = a.phoneNumber;
          bValue = b.phoneNumber;
          break;
        case "createdAt":
          aValue = a.createdAt.getTime();
          bValue = b.createdAt.getTime();
          break;
        case "updatedAt":
          aValue = a.updatedAt.getTime();
          bValue = b.updatedAt.getTime();
          break;
        default:
          aValue = a.createdAt.getTime();
          bValue = b.createdAt.getTime();
      }

      if (sortOrder === "asc") {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

    // Apply pagination
    const total = senderNumbers.length;
    const limit = Math.min(pagination.limit, this.options.maxPageSize!);
    const page = Math.max(1, pagination.page);
    const offset = (page - 1) * limit;
    const paginatedSenderNumbers = senderNumbers.slice(offset, offset + limit);

    return {
      data: paginatedSenderNumbers,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasNext: offset + limit < total,
      hasPrev: page > 1,
    };
  }

  // Audit and Analytics
  getAuditLogs(
    entityType?: "channel" | "senderNumber",
    entityId?: string,
    limit: number = 100,
  ): AuditLogEntry[] {
    let logs = [...this.auditLogs];

    if (entityType) {
      logs = logs.filter((log) => log.entityType === entityType);
    }
    if (entityId) {
      logs = logs.filter((log) => log.entityId === entityId);
    }

    return logs
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  getStatistics(): {
    channels: {
      total: number;
      byStatus: Record<string, number>;
      byType: Record<string, number>;
      byProvider: Record<string, number>;
    };
    senderNumbers: {
      total: number;
      byStatus: Record<string, number>;
      byCategory: Record<string, number>;
    };
  } {
    const channels = Array.from(this.channels.values());
    const senderNumbers = Array.from(this.senderNumbers.values());

    const channelsByStatus: Record<string, number> = {};
    const channelsByType: Record<string, number> = {};
    const channelsByProvider: Record<string, number> = {};

    channels.forEach((channel) => {
      channelsByStatus[channel.status] =
        (channelsByStatus[channel.status] || 0) + 1;
      channelsByType[channel.type] = (channelsByType[channel.type] || 0) + 1;
      channelsByProvider[channel.provider] =
        (channelsByProvider[channel.provider] || 0) + 1;
    });

    const senderNumbersByStatus: Record<string, number> = {};
    const senderNumbersByCategory: Record<string, number> = {};

    senderNumbers.forEach((senderNumber) => {
      senderNumbersByStatus[senderNumber.status] =
        (senderNumbersByStatus[senderNumber.status] || 0) + 1;
      senderNumbersByCategory[senderNumber.category] =
        (senderNumbersByCategory[senderNumber.category] || 0) + 1;
    });

    return {
      channels: {
        total: channels.length,
        byStatus: channelsByStatus,
        byType: channelsByType,
        byProvider: channelsByProvider,
      },
      senderNumbers: {
        total: senderNumbers.length,
        byStatus: senderNumbersByStatus,
        byCategory: senderNumbersByCategory,
      },
    };
  }

  // Cleanup and Maintenance
  cleanup(): {
    deletedChannels: number;
    expiredAuditLogs: number;
  } {
    let deletedChannels = 0;
    let expiredAuditLogs = 0;

    // Clean up soft-deleted channels older than 30 days
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    for (const [id, channel] of this.channels) {
      if (
        channel.status === ChannelStatus.DELETED &&
        channel.updatedAt < thirtyDaysAgo
      ) {
        this.channels.delete(id);
        deletedChannels++;
      }
    }

    // Clean up audit logs older than 90 days
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    const originalLogCount = this.auditLogs.length;
    this.auditLogs = this.auditLogs.filter(
      (log) => log.timestamp >= ninetyDaysAgo,
    );
    expiredAuditLogs = originalLogCount - this.auditLogs.length;

    return { deletedChannels, expiredAuditLogs };
  }

  destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = undefined;
    }

    this.removeAllListeners();
    this.channels.clear();
    this.senderNumbers.clear();
    this.auditLogs = [];
  }

  private addAuditLog(
    entityType: "channel" | "senderNumber",
    entityId: string,
    action: AuditLogEntry["action"],
    userId?: string,
    before?: any,
    after?: any,
  ): void {
    const auditLog: AuditLogEntry = {
      id: this.generateAuditLogId(),
      entityType,
      entityId,
      action,
      userId,
      timestamp: new Date(),
      changes: before || after ? { before, after } : undefined,
    };

    this.auditLogs.push(auditLog);

    // Keep only last 10000 audit logs to prevent memory issues
    if (this.auditLogs.length > 10000) {
      this.auditLogs = this.auditLogs.slice(-10000);
    }
  }

  private getDefaultLimits(channelType: ChannelType) {
    switch (channelType) {
      case ChannelType.KAKAO_ALIMTALK:
        return {
          dailyMessageLimit: 10000,
          monthlyMessageLimit: 300000,
          rateLimit: 10,
        };
      case ChannelType.KAKAO_FRIENDTALK:
        return {
          dailyMessageLimit: 1000,
          monthlyMessageLimit: 30000,
          rateLimit: 5,
        };
      case ChannelType.SMS:
      case ChannelType.LMS:
      case ChannelType.MMS:
        return {
          dailyMessageLimit: 1000,
          monthlyMessageLimit: 30000,
          rateLimit: 3,
        };
      default:
        return {
          dailyMessageLimit: 1000,
          monthlyMessageLimit: 30000,
          rateLimit: 1,
        };
    }
  }

  private getDefaultFeatures(channelType: ChannelType) {
    switch (channelType) {
      case ChannelType.KAKAO_ALIMTALK:
        return {
          supportsBulkSending: true,
          supportsScheduling: true,
          supportsButtons: true,
          maxButtonCount: 5,
        };
      case ChannelType.KAKAO_FRIENDTALK:
        return {
          supportsBulkSending: true,
          supportsScheduling: true,
          supportsButtons: false,
          maxButtonCount: 0,
        };
      default:
        return {
          supportsBulkSending: false,
          supportsScheduling: false,
          supportsButtons: false,
          maxButtonCount: 0,
        };
    }
  }

  private startAutoCleanup(): void {
    this.cleanupTimer = setInterval(() => {
      this.cleanup();
    }, this.options.cleanupInterval!);
  }

  private generateChannelId(): string {
    return `ch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateSenderNumberId(): string {
    return `sn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateAuditLogId(): string {
    return `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
