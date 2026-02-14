import * as crypto from "crypto";
import type { WebhookConfig } from "../types/webhook.types";

export interface SecurityConfig {
  algorithm: "sha256" | "sha1";
  header: string;
  prefix?: string;
}

/**
 * Webhook 보안 관리자
 * 서명 생성 및 검증을 담당
 */
export class SecurityManager {
  private config: SecurityConfig;

  constructor(webhookConfig: WebhookConfig) {
    this.config = {
      algorithm: webhookConfig.algorithm || "sha256",
      header: webhookConfig.signatureHeader || "X-Webhook-Signature",
      prefix: webhookConfig.signaturePrefix || "sha256=",
    };
  }

  /**
   * Webhook 페이로드에 대한 서명 생성
   */
  generateSignature(payload: string, secret: string): string {
    const hmac = crypto.createHmac(this.config.algorithm, secret);
    hmac.update(payload, "utf8");
    const signature = hmac.digest("hex");

    return this.config.prefix ? `${this.config.prefix}${signature}` : signature;
  }

  /**
   * Webhook 서명 검증
   */
  verifySignature(payload: string, signature: string, secret: string): boolean {
    try {
      const expectedSignature = this.generateSignature(payload, secret);

      // 타이밍 공격 방지를 위한 constant-time 비교
      return this.constantTimeCompare(signature, expectedSignature);
    } catch (error) {
      console.error("Signature verification failed:", error);
      return false;
    }
  }

  /**
   * HTTP 헤더에서 서명 추출
   */
  extractSignature(headers: Record<string, string>): string | null {
    const headerName = this.config.header.toLowerCase();

    for (const [key, value] of Object.entries(headers)) {
      if (key.toLowerCase() === headerName) {
        return value;
      }
    }

    return null;
  }

  /**
   * Webhook 전송을 위한 보안 헤더 생성
   */
  createSecurityHeaders(
    payload: string,
    secret: string,
  ): Record<string, string> {
    const signature = this.generateSignature(payload, secret);
    const timestamp = Math.floor(Date.now() / 1000).toString();

    return {
      [this.config.header]: signature,
      "X-Webhook-Timestamp": timestamp,
      "X-Webhook-ID": this.generateWebhookId(),
      "User-Agent": "K-Message-Webhook/1.0",
    };
  }

  /**
   * 타임스탬프 기반 재생 공격 방지 검증
   */
  verifyTimestamp(timestamp: string, toleranceSeconds: number = 300): boolean {
    try {
      const webhookTime = parseInt(timestamp, 10);
      const currentTime = Math.floor(Date.now() / 1000);
      const timeDiff = Math.abs(currentTime - webhookTime);

      return timeDiff <= toleranceSeconds;
    } catch (error) {
      return false;
    }
  }

  /**
   * Webhook ID 생성 (추적용)
   */
  private generateWebhookId(): string {
    return `wh_${crypto.randomBytes(16).toString("hex")}`;
  }

  /**
   * Constant-time 문자열 비교 (타이밍 공격 방지)
   */
  private constantTimeCompare(a: string, b: string): boolean {
    if (a.length !== b.length) {
      return false;
    }

    let result = 0;
    for (let i = 0; i < a.length; i++) {
      result |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }

    return result === 0;
  }

  /**
   * 보안 설정 업데이트
   */
  updateConfig(config: Partial<SecurityConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * 현재 보안 설정 반환
   */
  getConfig(): SecurityConfig {
    return { ...this.config };
  }
}
