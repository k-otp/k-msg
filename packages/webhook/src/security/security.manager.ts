import { hmac } from "@noble/hashes/hmac";
import { sha1 } from "@noble/hashes/sha1";
import { sha256 } from "@noble/hashes/sha2";
import { bytesToHex } from "@noble/hashes/utils";
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
  private encoder = new TextEncoder();

  constructor(
    webhookConfig: Pick<
      WebhookConfig,
      "algorithm" | "signatureHeader" | "signaturePrefix"
    >,
  ) {
    this.config = {
      algorithm: webhookConfig.algorithm || "sha256",
      header: webhookConfig.signatureHeader || "X-Webhook-Signature",
      prefix: webhookConfig.signaturePrefix || "sha256=",
    };
  }

  /**
   * Canonical string to sign when a timestamp header is present.
   * Format: `${timestamp}.${payload}`
   */
  createSignedPayload(payload: string, timestamp: string): string {
    return `${timestamp}.${payload}`;
  }

  /**
   * Webhook 페이로드에 대한 서명 생성
   */
  generateSignature(payload: string, secret: string): string {
    const signature = this.generateSignatureDigest(payload, secret);

    return this.config.prefix ? `${this.config.prefix}${signature}` : signature;
  }

  /**
   * Generate signature for a timestamped webhook.
   * (Recommended when also validating `X-Webhook-Timestamp` to prevent replay.)
   */
  generateSignatureWithTimestamp(
    payload: string,
    timestamp: string,
    secret: string,
  ): string {
    return this.generateSignature(
      this.createSignedPayload(payload, timestamp),
      secret,
    );
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
   * Verify signature for a timestamped webhook.
   */
  verifySignatureWithTimestamp(
    payload: string,
    timestamp: string,
    signature: string,
    secret: string,
  ): boolean {
    return this.verifySignature(
      this.createSignedPayload(payload, timestamp),
      signature,
      secret,
    );
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
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const signature = this.generateSignatureWithTimestamp(
      payload,
      timestamp,
      secret,
    );

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
      const webhookTime = (() => {
        // epoch seconds (recommended)
        if (/^[0-9]+$/.test(timestamp.trim())) {
          return parseInt(timestamp, 10);
        }
        // ISO date string (fallback)
        const parsed = new Date(timestamp);
        if (Number.isNaN(parsed.getTime())) return NaN;
        return Math.floor(parsed.getTime() / 1000);
      })();

      const currentTime = Math.floor(Date.now() / 1000);
      const timeDiff = Math.abs(currentTime - webhookTime);

      return timeDiff <= toleranceSeconds;
    } catch {
      return false;
    }
  }

  /**
   * Webhook ID 생성 (추적용)
   */
  private generateWebhookId(): string {
    const bytes = new Uint8Array(16);
    if (globalThis.crypto?.getRandomValues) {
      globalThis.crypto.getRandomValues(bytes);
    } else {
      for (let i = 0; i < bytes.length; i++) {
        bytes[i] = Math.floor(Math.random() * 256);
      }
    }

    return `wh_${bytesToHex(bytes)}`;
  }

  private generateSignatureDigest(payload: string, secret: string): string {
    const key = this.encoder.encode(secret);
    const message = this.encoder.encode(payload);

    const digest =
      this.config.algorithm === "sha1"
        ? hmac(sha1, key, message)
        : hmac(sha256, key, message);

    return bytesToHex(digest);
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
