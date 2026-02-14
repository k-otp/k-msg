import {
  type BulkSMSResult,
  type ScheduleResult,
  type SMSAccountContract,
  type SMSAccountProfile,
  type SMSBalance,
  type SMSContract,
  type SMSResult,
  type SMSSenderNumber,
  type SMSSendRequest,
  SMSStatus,
} from "../../contracts/sms.contract";
import type { IWINVConfig } from "../types/iwinv";

// IWINV SMS API Response types (실제 API 스펙 기반)
interface IWINVSMSResponse {
  code: string; // '0': 성공, 그외: 실패
  message: string; // 응답 메시지
  msgid?: string; // 메시지 ID (성공시)
  sms_count?: number; // SMS 차감 건수
  lms_count?: number; // LMS 차감 건수
}

interface IWINVBalanceResponse {
  code: string;
  message: string;
  sms_balance?: number; // SMS 잔여 건수
  lms_balance?: number; // LMS 잔여 건수
  total_balance?: number; // 전체 잔여 건수
}

interface IWINVHistoryResponse {
  code: string;
  message: string;
  list?: Array<{
    msgid: string;
    phone: string;
    callback: string;
    msg: string;
    status: string; // 'WAIT', 'SENDING', 'COMPLETE', 'FAIL'
    result: string; // 상세 결과 코드
    send_time: string;
    complete_time?: string;
  }>;
}

interface IWINVSenderResponse {
  code: string;
  message: string;
  list?: Array<{
    callback: string;
    status: string; // 'Y': 승인, 'N': 반려, 'W': 대기
    reg_date: string;
    approve_date?: string;
  }>;
}

export class IWINVSMSContract implements SMSContract {
  constructor(private config: IWINVConfig) {}

  async send(request: SMSSendRequest): Promise<SMSResult> {
    const messageType = this.determineMessageType(
      request.text,
      request.messageType,
    );

    // IWINV SMS API 실제 요청 형식
    const payload = {
      phone: request.phoneNumber,
      msg: request.text,
      callback: request.senderNumber || this.getDefaultSenderNumber(),
      ...(messageType === "LMS" &&
        request.subject && { subject: request.subject }),
      // 예약 발송시 YYYYMMDDHHMISS 형식
      reqdate: request.options?.scheduledAt
        ? this.formatDate(request.options.scheduledAt)
        : undefined,
    };

    // IWINV API 엔드포인트: https://sms.bizservice.iwinv.kr/api/
    const endpoint = messageType === "SMS" ? "/send/" : "/send_lms/";

    try {
      const response = await this.makeRequest<IWINVSMSResponse>(
        "POST",
        endpoint,
        payload,
      );

      return {
        messageId: response.msgid || this.generateMessageId(),
        status: this.mapIWINVStatusToDeliveryStatus(response.code),
        provider: "iwinv-sms",
        timestamp: new Date(),
        phoneNumber: request.phoneNumber,
        messageType,
        error:
          response.code !== "0"
            ? {
                code: response.code,
                message: response.message || "SMS send failed",
                retryable: this.isRetryableError(response.code),
              }
            : undefined,
      };
    } catch (error) {
      throw new Error(
        `SMS send failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  async sendBulk(requests: SMSSendRequest[]): Promise<BulkSMSResult> {
    const results: SMSResult[] = [];

    // IWINV는 네이티브 bulk API가 없으므로 순차 전송
    for (const request of requests) {
      try {
        const result = await this.send(request);
        results.push(result);
      } catch (error) {
        results.push({
          messageId: this.generateMessageId(),
          status: { status: "failed", timestamp: new Date() },
          provider: "iwinv",
          timestamp: new Date(),
          phoneNumber: request.phoneNumber,
          messageType: this.determineMessageType(
            request.text,
            request.messageType,
          ),
          error: {
            code: "SEND_FAILED",
            message: error instanceof Error ? error.message : "Unknown error",
            retryable: false,
          },
        });
      }
    }

    return {
      requestId: this.generateRequestId(),
      results,
      summary: {
        total: requests.length,
        sent: results.filter((r) => !r.error).length,
        failed: results.filter((r) => r.error).length,
      },
    };
  }

  async schedule(
    request: SMSSendRequest,
    scheduledAt: Date,
  ): Promise<ScheduleResult> {
    const result = await this.send({
      ...request,
      options: { ...request.options, scheduledAt },
    });

    return {
      scheduleId: this.generateScheduleId(),
      messageId: result.messageId,
      scheduledAt,
      status: "scheduled",
    };
  }

  async cancel(messageId: string): Promise<void> {
    try {
      await this.makeRequest("POST", "/cancel", { msgid: messageId });
    } catch (error) {
      throw new Error(
        `Cancel failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  async getStatus(messageId: string): Promise<SMSStatus> {
    try {
      // IWINV 실제 전송 이력 조회 API
      const response = await this.makeRequest<IWINVHistoryResponse>(
        "POST",
        "/history/",
        {
          start_date: this.formatDateForHistory(
            new Date(Date.now() - 24 * 60 * 60 * 1000),
          ), // 24시간 전
          end_date: this.formatDateForHistory(new Date()),
          msgid: messageId,
        },
      );

      if (
        response.code !== "0" ||
        !response.list ||
        response.list.length === 0
      ) {
        return SMSStatus.QUEUED; // 조회 실패시 기본값
      }

      const messageRecord = response.list[0];
      return this.mapIWINVStatusToSMSStatus(messageRecord.status);
    } catch (error) {
      throw new Error(
        `Status check failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  // Helper methods
  private determineMessageType(
    text: string,
    explicitType?: "SMS" | "LMS",
  ): "SMS" | "LMS" {
    if (explicitType) return explicitType;
    // SMS: 90자 이하, LMS: 90자 초과
    return text.length <= 90 ? "SMS" : "LMS";
  }

  private getDefaultSenderNumber(): string {
    // IWINV 기본 발신번호 또는 설정된 발신번호
    return "15443456"; // IWINV 기본 발신번호
  }

  private formatDate(date: Date): string {
    return date
      .toISOString()
      .replace(/[-:]/g, "")
      .replace("T", "")
      .slice(0, 14);
  }

  private mapIWINVStatusToDeliveryStatus(code: string) {
    switch (code) {
      case "0":
        return { status: "sent" as const, timestamp: new Date() };
      default:
        return { status: "failed" as const, timestamp: new Date() };
    }
  }

  private mapIWINVStatusToSMSStatus(status: string): SMSStatus {
    switch (status) {
      case "COMPLETE":
        return SMSStatus.DELIVERED;
      case "SENDING":
        return SMSStatus.SENDING;
      case "WAIT":
        return SMSStatus.QUEUED;
      case "FAIL":
        return SMSStatus.FAILED;
      default:
        return SMSStatus.QUEUED;
    }
  }

  private isRetryableError(code: string): boolean {
    // IWINV 에러 코드 기반 재시도 가능 여부
    // 일시적 오류: 네트워크, 서버 과부하 등
    const retryableCodes = ["1001", "1002", "1003", "2001", "2002"];
    return retryableCodes.includes(code);
  }

  private formatDateForHistory(date: Date): string {
    // IWINV 이력 조회용 날짜 형식: YYYY-MM-DD
    return date.toISOString().split("T")[0];
  }

  private generateMessageId(): string {
    return `sms_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateRequestId(): string {
    return `bulk_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateScheduleId(): string {
    return `schedule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async makeRequest<T = any>(
    method: string,
    endpoint: string,
    data?: Record<string, unknown>,
  ): Promise<T> {
    // IWINV SMS API 기본 URL: https://sms.bizservice.iwinv.kr/api/
    const baseUrl =
      this.config.baseUrl
        ?.replace("/api/", "")
        .replace("alimtalk.bizservice", "sms.bizservice") ||
      "https://sms.bizservice.iwinv.kr";
    const url = `${baseUrl}/api${endpoint}`;

    const headers = {
      "Content-Type": "application/json;charset=UTF-8",
      AUTH: btoa(this.config.apiKey),
    };

    if (this.config.debug) {
      console.log(
        `IWINV SMS API ${method} ${url}:`,
        data ? JSON.stringify(data).substring(0, 200) : "no body",
      );
    }

    const response = await fetch(url, {
      method,
      headers,
      body: data ? JSON.stringify(data) : undefined,
    });

    const responseText = await response.text();

    if (this.config.debug) {
      console.log(`IWINV SMS API response:`, responseText.substring(0, 500));
    }

    let result: T;
    try {
      result = JSON.parse(responseText);
    } catch (parseError) {
      throw new Error(`Invalid JSON response: ${responseText}`);
    }

    if (!response.ok) {
      throw new Error(
        `HTTP ${response.status}: ${response.statusText} - ${responseText}`,
      );
    }

    return result;
  }
}

export class IWINVSMSAccountContract implements SMSAccountContract {
  constructor(private config: IWINVConfig) {}

  async getBalance(): Promise<SMSBalance> {
    try {
      // IWINV 실제 잔액 조회 API
      const response = await this.makeRequest<IWINVBalanceResponse>(
        "POST",
        "/balance/",
        {},
      );

      if (response.code !== "0") {
        throw new Error(`Balance check failed: ${response.message}`);
      }

      return {
        sms: response.sms_balance || 0,
        lms: response.lms_balance || 0,
        currency: "KRW",
        lastUpdated: new Date(),
      };
    } catch (error) {
      throw new Error(
        `Balance check failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  async getProfile(): Promise<SMSAccountProfile> {
    try {
      const response = await this.makeRequest<{
        account_id?: string;
        account_name?: string;
        status?: string;
        daily_sms_limit?: number;
        daily_lms_limit?: number;
        monthly_limit?: number;
      }>("GET", "/profile");

      return {
        accountId: response.account_id || "unknown",
        name: response.account_name || "IWINV Account",
        status: response.status === "active" ? "active" : "suspended",
        tier: "standard",
        limits: {
          dailySMSLimit: response.daily_sms_limit || 1000,
          dailyLMSLimit: response.daily_lms_limit || 500,
          monthlyLimit: response.monthly_limit || 30000,
          rateLimit: 100,
        },
      };
    } catch (error) {
      throw new Error(
        `Profile check failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  async getSenderNumbers(): Promise<SMSSenderNumber[]> {
    try {
      // IWINV 실제 발신번호 목록 조회 API
      const response = await this.makeRequest<IWINVSenderResponse>(
        "POST",
        "/sender/",
        {},
      );

      if (response.code !== "0") {
        throw new Error(`Sender numbers check failed: ${response.message}`);
      }

      return (response.list || []).map((sender) => ({
        id: `sender_${sender.callback}`,
        phoneNumber: sender.callback,
        isVerified: sender.status === "Y",
        verifiedAt: sender.approve_date
          ? new Date(sender.approve_date)
          : undefined,
        status: this.mapSenderStatus(sender.status),
        createdAt: new Date(sender.reg_date),
      }));
    } catch (error) {
      throw new Error(
        `Sender numbers check failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  async addSenderNumber(phoneNumber: string): Promise<SMSSenderNumber> {
    // IWINV는 발신번호 등록이 웹 콘솔에서만 가능
    throw new Error(
      `IWINV 발신번호 등록은 웹 콘솔에서만 가능합니다. https://sms.bizservice.iwinv.kr 에서 등록하세요.`,
    );
  }

  async verifySenderNumber(
    phoneNumber: string,
    verificationCode: string,
  ): Promise<boolean> {
    // IWINV는 발신번호 인증이 웹 콘솔에서만 가능
    // API로는 인증 상태 조회만 가능
    try {
      const senderNumbers = await this.getSenderNumbers();
      const sender = senderNumbers.find((s) => s.phoneNumber === phoneNumber);
      return sender?.isVerified || false;
    } catch (error) {
      throw new Error(
        `Verify sender number failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  private mapSenderStatus(status: string): "active" | "inactive" | "pending" {
    switch (status) {
      case "Y":
        return "active";
      case "N":
        return "inactive";
      case "W":
        return "pending";
      default:
        return "pending";
    }
  }

  private async makeRequest<T = any>(
    method: string,
    endpoint: string,
    data?: Record<string, unknown>,
  ): Promise<T> {
    // IWINV SMS API 기본 URL: https://sms.bizservice.iwinv.kr/api/
    const baseUrl =
      this.config.baseUrl
        ?.replace("/api/", "")
        .replace("alimtalk.bizservice", "sms.bizservice") ||
      "https://sms.bizservice.iwinv.kr";
    const url = `${baseUrl}/api${endpoint}`;

    const headers = {
      "Content-Type": "application/json;charset=UTF-8",
      AUTH: btoa(this.config.apiKey),
    };

    if (this.config.debug) {
      console.log(
        `IWINV SMS Account API ${method} ${url}:`,
        data ? JSON.stringify(data).substring(0, 200) : "no body",
      );
    }

    const response = await fetch(url, {
      method,
      headers,
      body: data ? JSON.stringify(data) : undefined,
    });

    const responseText = await response.text();

    if (this.config.debug) {
      console.log(
        `IWINV SMS Account API response:`,
        responseText.substring(0, 500),
      );
    }

    let result: T;
    try {
      result = JSON.parse(responseText);
    } catch (parseError) {
      throw new Error(`Invalid JSON response: ${responseText}`);
    }

    if (!response.ok) {
      throw new Error(
        `HTTP ${response.status}: ${response.statusText} - ${responseText}`,
      );
    }

    return result;
  }
}
