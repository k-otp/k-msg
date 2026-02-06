/**
 * Delivery tracking system for messages
 */

import { EventEmitter } from 'events';
import {
  DeliveryReport,
  DeliveryAttempt,
  MessageStatus,
  MessageEventType,
  MessageEvent
} from '../types/message.types';

export interface DeliveryTrackingOptions {
  trackingInterval: number;
  maxTrackingDuration: number;
  batchSize: number;
  enableWebhooks: boolean;
  webhookRetries: number;
  webhookTimeout: number;
  persistence: {
    enabled: boolean;
    retentionDays: number;
  };
}

export interface DeliveryWebhook {
  url: string;
  events: MessageEventType[];
  secret?: string;
  headers?: Record<string, string>;
  timeout: number;
  retries: number;
}

export interface TrackingRecord {
  messageId: string;
  phoneNumber: string;
  templateId: string;
  provider: string;
  currentStatus: MessageStatus;
  statusHistory: StatusHistoryEntry[];
  deliveryReport: DeliveryReport;
  webhooks: DeliveryWebhook[];
  createdAt: Date;
  updatedAt: Date;
  expiresAt: Date;
  metadata: Record<string, any>;
}

export interface StatusHistoryEntry {
  status: MessageStatus;
  timestamp: Date;
  provider: string;
  details?: Record<string, any>;
  source: 'provider' | 'webhook' | 'manual' | 'system';
}

export interface DeliveryStats {
  totalMessages: number;
  byStatus: Record<MessageStatus, number>;
  byProvider: Record<string, number>;
  averageDeliveryTime: number;
  deliveryRate: number;
  failureRate: number;
  lastUpdated: Date;
}

export interface WebhookDeliveryResult {
  success: boolean;
  statusCode?: number;
  error?: string;
  responseTime: number;
  attempt: number;
}

export class DeliveryTracker extends EventEmitter {
  private trackingRecords = new Map<string, TrackingRecord>();
  private statusIndex = new Map<MessageStatus, Set<string>>();
  private trackingTimer?: NodeJS.Timeout;
  private webhookQueue: Array<{ record: TrackingRecord; event: MessageEvent }> = [];
  private isRunning = false;
  private stats: DeliveryStats;

  private defaultOptions: DeliveryTrackingOptions = {
    trackingInterval: 5000,       // Check every 5 seconds
    maxTrackingDuration: 86400000, // 24 hours
    batchSize: 100,
    enableWebhooks: true,
    webhookRetries: 3,
    webhookTimeout: 5000,
    persistence: {
      enabled: true,
      retentionDays: 30
    }
  };

  constructor(private options: DeliveryTrackingOptions) {
    super();
    
    this.options = { ...this.defaultOptions, ...options };
    
    this.stats = {
      totalMessages: 0,
      byStatus: {} as Record<MessageStatus, number>,
      byProvider: {},
      averageDeliveryTime: 0,
      deliveryRate: 0,
      failureRate: 0,
      lastUpdated: new Date()
    };

    // Initialize status counters
    Object.values(MessageStatus).forEach(status => {
      this.stats.byStatus[status] = 0;
      this.statusIndex.set(status, new Set());
    });
  }

  /**
   * Start delivery tracking
   */
  start(): void {
    if (this.isRunning) {
      return;
    }

    this.isRunning = true;
    this.scheduleTracking();
    this.emit('tracker:started');
  }

  /**
   * Stop delivery tracking
   */
  stop(): void {
    this.isRunning = false;
    
    if (this.trackingTimer) {
      clearTimeout(this.trackingTimer);
      this.trackingTimer = undefined;
    }

    this.emit('tracker:stopped');
  }

  /**
   * Start tracking a message
   */
  async trackMessage(
    messageId: string,
    phoneNumber: string,
    templateId: string,
    provider: string,
    options: {
      webhooks?: DeliveryWebhook[];
      metadata?: Record<string, any>;
      initialStatus?: MessageStatus;
    } = {}
  ): Promise<void> {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + this.options.maxTrackingDuration);
    
    const initialStatus = options.initialStatus || MessageStatus.QUEUED;
    
    const deliveryReport: DeliveryReport = {
      messageId,
      phoneNumber,
      status: initialStatus,
      attempts: [{
        attemptNumber: 1,
        attemptedAt: now,
        status: initialStatus,
        provider
      }],
      metadata: options.metadata || {}
    };

    const record: TrackingRecord = {
      messageId,
      phoneNumber,
      templateId,
      provider,
      currentStatus: initialStatus,
      statusHistory: [{
        status: initialStatus,
        timestamp: now,
        provider,
        source: 'system'
      }],
      deliveryReport,
      webhooks: options.webhooks || [],
      createdAt: now,
      updatedAt: now,
      expiresAt,
      metadata: options.metadata || {}
    };

    this.trackingRecords.set(messageId, record);
    this.statusIndex.get(initialStatus)?.add(messageId);
    
    this.updateStats();
    
    this.emit('tracking:started', {
      type: MessageEventType.MESSAGE_QUEUED,
      timestamp: now,
      data: record,
      metadata: record.metadata
    } as MessageEvent);

    // Send initial webhook if configured
    if (this.options.enableWebhooks && record.webhooks.length > 0) {
      const event: MessageEvent = {
        id: `evt_${messageId}_${Date.now()}`,
        type: MessageEventType.MESSAGE_QUEUED,
        timestamp: now,
        data: deliveryReport,
        metadata: record.metadata
      };
      
      this.queueWebhook(record, event);
    }
  }

  /**
   * Update message status
   */
  async updateStatus(
    messageId: string,
    status: MessageStatus,
    details: {
      provider?: string;
      error?: { code: string; message: string; details?: any };
      metadata?: Record<string, any>;
      source?: 'provider' | 'webhook' | 'manual' | 'system';
      sentAt?: Date;
      deliveredAt?: Date;
      clickedAt?: Date;
      failedAt?: Date;
    } = {}
  ): Promise<boolean> {
    const record = this.trackingRecords.get(messageId);
    if (!record) {
      return false;
    }

    const now = new Date();
    const oldStatus = record.currentStatus;
    
    // Update status only if it's a progression
    if (!this.isStatusProgression(oldStatus, status)) {
      return false;
    }

    // Remove from old status index
    this.statusIndex.get(oldStatus)?.delete(messageId);
    
    // Update record
    record.currentStatus = status;
    record.updatedAt = now;
    
    // Add to status history
    record.statusHistory.push({
      status,
      timestamp: now,
      provider: details.provider || record.provider,
      details: details.metadata,
      source: details.source || 'system'
    });

    // Update delivery report
    record.deliveryReport.status = status;
    record.deliveryReport.metadata = { ...record.deliveryReport.metadata, ...details.metadata };
    
    if (details.sentAt) record.deliveryReport.sentAt = details.sentAt;
    if (details.deliveredAt) record.deliveryReport.deliveredAt = details.deliveredAt;
    if (details.clickedAt) record.deliveryReport.clickedAt = details.clickedAt;
    if (details.failedAt) record.deliveryReport.failedAt = details.failedAt;
    if (details.error) record.deliveryReport.error = details.error;

    // Add new delivery attempt
    record.deliveryReport.attempts.push({
      attemptNumber: record.deliveryReport.attempts.length + 1,
      attemptedAt: now,
      status,
      error: details.error,
      provider: details.provider || record.provider
    });

    // Add to new status index
    this.statusIndex.get(status)?.add(messageId);
    
    this.updateStats();

    // Determine event type based on status
    const eventType = this.getEventTypeForStatus(status);
    
    const event: MessageEvent = {
      id: `evt_${messageId}_${Date.now()}`,
      type: eventType,
      timestamp: now,
      data: {
        messageId,
        previousStatus: oldStatus,
        currentStatus: status,
        deliveryReport: record.deliveryReport,
        ...details
      },
      metadata: record.metadata
    };

    this.emit('status:updated', event);

    // Send webhook if configured
    if (this.options.enableWebhooks && record.webhooks.length > 0) {
      this.queueWebhook(record, event);
    }

    // Check if tracking should be completed
    if (this.isTerminalStatus(status)) {
      this.emit('tracking:completed', {
        ...event,
        data: { ...event.data, trackingCompleted: true }
      });
    }

    return true;
  }

  /**
   * Get delivery report for a message
   */
  getDeliveryReport(messageId: string): DeliveryReport | undefined {
    return this.trackingRecords.get(messageId)?.deliveryReport;
  }

  /**
   * Get tracking record for a message
   */
  getTrackingRecord(messageId: string): TrackingRecord | undefined {
    return this.trackingRecords.get(messageId);
  }

  /**
   * Get messages by status
   */
  getMessagesByStatus(status: MessageStatus): TrackingRecord[] {
    const messageIds = this.statusIndex.get(status) || new Set();
    return Array.from(messageIds)
      .map(id => this.trackingRecords.get(id))
      .filter((record): record is TrackingRecord => record !== undefined);
  }

  /**
   * Get delivery statistics
   */
  getStats(): DeliveryStats {
    return { ...this.stats };
  }

  /**
   * Get delivery statistics for a specific time range
   */
  getStatsForPeriod(startDate: Date, endDate: Date): DeliveryStats {
    const records = Array.from(this.trackingRecords.values())
      .filter(record => 
        record.createdAt >= startDate && record.createdAt <= endDate
      );

    const stats: DeliveryStats = {
      totalMessages: records.length,
      byStatus: {} as Record<MessageStatus, number>,
      byProvider: {},
      averageDeliveryTime: 0,
      deliveryRate: 0,
      failureRate: 0,
      lastUpdated: new Date()
    };

    // Initialize counters
    Object.values(MessageStatus).forEach(status => {
      stats.byStatus[status] = 0;
    });

    // Calculate statistics
    let totalDeliveryTime = 0;
    let deliveredCount = 0;
    let failedCount = 0;

    records.forEach(record => {
      // Count by status
      stats.byStatus[record.currentStatus]++;
      
      // Count by provider
      stats.byProvider[record.provider] = (stats.byProvider[record.provider] || 0) + 1;
      
      // Calculate delivery time for delivered messages
      if (record.deliveryReport.deliveredAt && record.deliveryReport.sentAt) {
        const deliveryTime = record.deliveryReport.deliveredAt.getTime() - 
                            record.deliveryReport.sentAt.getTime();
        totalDeliveryTime += deliveryTime;
        deliveredCount++;
      }

      // Count failures
      if (record.currentStatus === MessageStatus.FAILED) {
        failedCount++;
      }
    });

    // Calculate averages and rates
    if (deliveredCount > 0) {
      stats.averageDeliveryTime = totalDeliveryTime / deliveredCount;
    }

    if (records.length > 0) {
      stats.deliveryRate = (stats.byStatus[MessageStatus.DELIVERED] / records.length) * 100;
      stats.failureRate = (failedCount / records.length) * 100;
    }

    return stats;
  }

  /**
   * Clean up expired tracking records
   */
  cleanup(): number {
    const now = new Date();
    let removed = 0;

    for (const [messageId, record] of this.trackingRecords.entries()) {
      if (record.expiresAt <= now || this.isTerminalStatus(record.currentStatus)) {
        // Remove from tracking
        this.trackingRecords.delete(messageId);
        this.statusIndex.get(record.currentStatus)?.delete(messageId);
        removed++;
      }
    }

    if (removed > 0) {
      this.updateStats();
      this.emit('cleanup:completed', { removedCount: removed });
    }

    return removed;
  }

  /**
   * Stop tracking a specific message
   */
  stopTracking(messageId: string): boolean {
    const record = this.trackingRecords.get(messageId);
    if (!record) {
      return false;
    }

    this.trackingRecords.delete(messageId);
    this.statusIndex.get(record.currentStatus)?.delete(messageId);
    
    this.updateStats();
    
    this.emit('tracking:stopped', {
      type: MessageEventType.MESSAGE_CANCELLED,
      timestamp: new Date(),
      data: record,
      metadata: record.metadata
    } as MessageEvent);

    return true;
  }

  private scheduleTracking(): void {
    if (!this.isRunning) {
      return;
    }

    this.trackingTimer = setTimeout(() => {
      this.processTracking();
      this.processWebhookQueue();
      this.scheduleTracking();
    }, this.options.trackingInterval);
  }

  private async processTracking(): Promise<void> {
    // Process webhook queue
    await this.processWebhookQueue();
    
    // Clean up expired records periodically (every hour)
    const shouldCleanup = Date.now() % (60 * 60 * 1000) < this.options.trackingInterval;
    if (shouldCleanup) {
      this.cleanup();
    }
  }

  private async processWebhookQueue(): Promise<void> {
    if (!this.options.enableWebhooks || this.webhookQueue.length === 0) {
      return;
    }

    const batch = this.webhookQueue.splice(0, this.options.batchSize);
    
    for (const { record, event } of batch) {
      for (const webhook of record.webhooks) {
        if (webhook.events.includes(event.type)) {
          this.deliverWebhook(webhook, event);
        }
      }
    }
  }

  private async deliverWebhook(webhook: DeliveryWebhook, event: MessageEvent): Promise<void> {
    let lastError: Error | undefined;

    for (let attempt = 1; attempt <= webhook.retries + 1; attempt++) {
      try {
        const result = await this.sendWebhook(webhook, event, attempt);
        
        if (result.success) {
          this.emit('webhook:delivered', {
            webhook,
            event,
            result,
            attempt
          });
          return;
        } else {
          lastError = new Error(`HTTP ${result.statusCode}: ${result.error}`);
        }
      } catch (error) {
        lastError = error as Error;
      }

      // Wait before retry (exponential backoff)
      if (attempt <= webhook.retries) {
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 30000);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    this.emit('webhook:failed', {
      webhook,
      event,
      error: lastError,
      attempts: webhook.retries + 1
    });
  }

  private async sendWebhook(
    webhook: DeliveryWebhook,
    event: MessageEvent,
    attempt: number
  ): Promise<WebhookDeliveryResult> {
    const startTime = Date.now();

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'User-Agent': 'K-Message-Delivery-Tracker/1.0',
        ...webhook.headers
      };

      // Add signature if secret is provided
      if (webhook.secret) {
        const payload = JSON.stringify(event);
        // This would normally use HMAC-SHA256
        headers['X-Signature'] = `sha256=${webhook.secret}`;
      }

      const response: Response = await fetch(webhook.url, {
        method: 'POST',
        headers,
        body: JSON.stringify(event),
        signal: AbortSignal.timeout(webhook.timeout)
      });

      const responseTime = Date.now() - startTime;

      return {
        success: response.ok,
        statusCode: response.status,
        error: response.ok ? undefined : response.statusText,
        responseTime,
        attempt
      };

    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        responseTime,
        attempt
      };
    }
  }

  private queueWebhook(record: TrackingRecord, event: MessageEvent): void {
    this.webhookQueue.push({ record, event });
  }

  private isStatusProgression(oldStatus: MessageStatus, newStatus: MessageStatus): boolean {
    const statusOrder = [
      MessageStatus.QUEUED,
      MessageStatus.SENDING,
      MessageStatus.SENT,
      MessageStatus.DELIVERED,
      MessageStatus.CLICKED
    ];

    const oldIndex = statusOrder.indexOf(oldStatus);
    const newIndex = statusOrder.indexOf(newStatus);

    // Allow progression forward, or to FAILED/CANCELLED from any status
    return newIndex > oldIndex || 
           newStatus === MessageStatus.FAILED || 
           newStatus === MessageStatus.CANCELLED;
  }

  private isTerminalStatus(status: MessageStatus): boolean {
    return [
      MessageStatus.DELIVERED,
      MessageStatus.FAILED,
      MessageStatus.CANCELLED,
      MessageStatus.CLICKED
    ].includes(status);
  }

  private getEventTypeForStatus(status: MessageStatus): MessageEventType {
    switch (status) {
      case MessageStatus.QUEUED:
        return MessageEventType.MESSAGE_QUEUED;
      case MessageStatus.SENT:
        return MessageEventType.MESSAGE_SENT;
      case MessageStatus.DELIVERED:
        return MessageEventType.MESSAGE_DELIVERED;
      case MessageStatus.FAILED:
        return MessageEventType.MESSAGE_FAILED;
      case MessageStatus.CLICKED:
        return MessageEventType.MESSAGE_CLICKED;
      default:
        return MessageEventType.MESSAGE_QUEUED;
    }
  }

  private updateStats(): void {
    this.stats.totalMessages = this.trackingRecords.size;
    this.stats.lastUpdated = new Date();

    // Reset counters
    Object.values(MessageStatus).forEach(status => {
      this.stats.byStatus[status] = 0;
    });
    this.stats.byProvider = {};

    // Recalculate from current records
    let totalDeliveryTime = 0;
    let deliveredCount = 0;
    let failedCount = 0;

    for (const record of this.trackingRecords.values()) {
      // Count by status
      this.stats.byStatus[record.currentStatus]++;
      
      // Count by provider
      this.stats.byProvider[record.provider] = 
        (this.stats.byProvider[record.provider] || 0) + 1;
      
      // Calculate delivery metrics
      if (record.deliveryReport.deliveredAt && record.deliveryReport.sentAt) {
        const deliveryTime = record.deliveryReport.deliveredAt.getTime() - 
                            record.deliveryReport.sentAt.getTime();
        totalDeliveryTime += deliveryTime;
        deliveredCount++;
      }

      if (record.currentStatus === MessageStatus.FAILED) {
        failedCount++;
      }
    }

    // Calculate rates and averages
    if (deliveredCount > 0) {
      this.stats.averageDeliveryTime = totalDeliveryTime / deliveredCount;
    }

    if (this.stats.totalMessages > 0) {
      this.stats.deliveryRate = 
        (this.stats.byStatus[MessageStatus.DELIVERED] / this.stats.totalMessages) * 100;
      this.stats.failureRate = (failedCount / this.stats.totalMessages) * 100;
    }
  }
}