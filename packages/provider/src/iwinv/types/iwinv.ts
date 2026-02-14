/**
 * IWINV API TypeScript 타입 정의
 * IWINV 알림톡 REST API 규격서 기반
 */

// Standalone config interface (does not depend on core's removed StandardRequest system)

// =============================================================================
// 공통 응답 타입
// =============================================================================

export interface IWINVBaseResponse {
  code: number;
  message: string;
}

// =============================================================================
// 알림톡 발송 관련 타입
// =============================================================================

export interface SendMessageRequest {
  templateCode: string;
  reserve?: "Y" | "N"; // 기본값: N
  sendDate?: string; // yyyy-MM-dd HH:mm:ss (예약발송시 필수)
  reSend?: "Y" | "N"; // 기본값: N
  resendCallback?: string; // 발신번호
  resendType?: "Y" | "N"; // 기본값: Y (Y:알림톡내용, N:직접입력)
  resendTitle?: string; // LMS 대체문자 제목
  resendContent?: string; // 대체문자 내용
  list: SendRecipient[];
}

export interface SendRecipient {
  phone: string; // 수신번호
  templateParam?: string[]; // 템플릿 변수 배열
}

export interface SendMessageResponse extends IWINVBaseResponse {
  success: number; // 정상 전송요청 연락처 개수
  fail: number; // 전송요청되지 않은 연락처 개수
}

// =============================================================================
// 템플릿 관련 타입
// =============================================================================

export interface CreateTemplateRequest {
  templateName: string; // 최대 15자
  templateContent: string; // 최대 1000자
  buttons?: CreateTemplateButton[];
}

export interface CreateTemplateButton {
  type: "WL" | "AL" | "DB" | "BK" | "MD";
  name: string; // 최대 15자
  linkMo?: string; // WL타입 필수, 최대 200자
  linkPc?: string; // WL타입 필수, 최대 200자
  linkIos?: string; // AL타입 필수, 최대 200자
  linkAnd?: string; // AL타입 필수, 최대 200자
}

export interface Template {
  templateCode: string;
  templateName: string;
  templateContent: string;
  status: "Y" | "I" | "R"; // Y:사용가능, I:검수중, R:부결
  templateStatusMsg?: string;
  templateStatusComments?: string;
  createDate: string;
  buttons: unknown[];
}

export interface TemplateListRequest {
  pageNum?: string; // 기본값: "1"
  pageSize?: string; // 기본값: "15", 최대: "1000"
  templateCode?: string;
  templateName?: string;
  templateStatus?: "Y" | "I" | "R"; // Y:사용가능, I:검수중, R:부결
}

export interface TemplateListResponse extends IWINVBaseResponse {
  totalCount: number;
  list: Template[];
}

export interface ModifyTemplateRequest {
  templateCode: string;
  templateName: string; // 최대 15자
  templateContent: string; // 최대 1000자
  buttons?: CreateTemplateButton[];
}

export interface DeleteTemplateRequest {
  templateCode: string;
}

export type CreateTemplateResponse = IWINVBaseResponse;
export type ModifyTemplateResponse = IWINVBaseResponse;
export type DeleteTemplateResponse = IWINVBaseResponse;

// =============================================================================
// 전송 내역 관련 타입
// =============================================================================

export interface HistoryRequest {
  pageNum?: number; // 기본값: 1
  pageSize?: number; // 기본값: 15, 최대: 1000
  reserve?: "Y" | "N"; // 예약발송 여부
  startDate?: string; // yyyy-MM-dd HH:mm:ss
  endDate?: string; // yyyy-MM-dd HH:mm:ss
  seqNo?: number; // 메시지 ID
  phone?: string; // 수신번호
}

export interface MessageHistory {
  seqNo: number; // 메시지 ID
  phone: string; // 수신번호
  callback: string; // 발신번호
  templateCode: string;
  sendMessage: string; // 전송한 메시지
  reserve: "Y" | "N"; // 예약발송 여부
  requestDate: string; // 요청일
  sendDate: string; // 전송일
  receiveDate: string; // 수신일
  statusCode: string; // 알림톡 발송 요청 상태 코드
  statusCodeName: string; // 알림톡 발송 요청 상태 코드명
  resendStatus: string | null; // 대체 발송 상태 코드
  resendStatusName: string | null; // 대체 발송 상태 코드명
  buttons: {
    link1: string | null;
    link2: string | null;
    link3: string | null;
    link4: string | null;
    link5: string | null;
  };
}

export interface HistoryResponse extends IWINVBaseResponse {
  totalCount: number;
  list: MessageHistory[];
}

export interface CancelReservationRequest {
  seqNo: number; // 메시지 ID
}

export type CancelReservationResponse = IWINVBaseResponse;

// =============================================================================
// 잔액 조회 관련 타입
// =============================================================================

export interface BalanceResponse extends IWINVBaseResponse {
  charge: number; // 잔액
}

// =============================================================================
// SMS(v2) 전송 내역/잔액 조회 타입
// =============================================================================

export interface IWINVSmsChargeRequest {
  version: string; // "1.0"
}

export interface IWINVSmsChargeResponse {
  code: number; // 0 on success
  message: string;
  charge: number; // remaining amount
}

export interface IWINVSmsHistoryRequest {
  version: string; // "1.0"
  companyid: string;
  startDate: string; // yyyy-MM-dd
  endDate: string; // yyyy-MM-dd
  requestNo?: string;
  pageNum?: number;
  pageSize?: number;
  phone?: string;
}

export interface IWINVSmsHistoryItem {
  requestNo: string | number;
  companyid: string;
  msgType: string; // SMS, LMS, MMS
  phone: string;
  callback: string;
  sendStatus?: string;
  sendStatusCode?: string;
  sendStatusMsg?: string;
  sendDate: string; // yyyy-MM-dd HH:mm:ss
}

export interface IWINVSmsHistoryResponse {
  resultCode: number; // 0 on success
  message: string;
  totalCount: number;
  list: IWINVSmsHistoryItem[];
}

// =============================================================================
// 설정 타입
// =============================================================================

export interface IWINVConfig {
  /**
   * IWINV AlimTalk API key (used for AUTH header).
   */
  apiKey: string;

  /**
   * IWINV AlimTalk base URL.
   * Default: https://alimtalk.bizservice.iwinv.kr
   */
  baseUrl: string;

  smsApiKey?: string;
  smsAuthKey?: string;
  smsBaseUrl?: string;
  /**
   * SMS v2 전송 내역 조회시 필요한 조직(업체) 발송 아이디.
   * (API 문서의 `companyid`)
   */
  smsCompanyId?: string;
  senderNumber?: string;
  smsSenderNumber?: string;
  sendEndpoint?: string;
  /**
   * Optional proxy/IP override header for IP-restricted IWINV endpoints.
   * Intended for testing or controlled environments; production should whitelist real egress IPs.
   */
  xForwardedFor?: string;
  /**
   * Extra HTTP headers merged into outgoing requests.
   * Use with care: overriding AUTH/secret can break requests.
   */
  extraHeaders?: Record<string, string>;
  ipRetryCount?: number;
  ipRetryDelayMs?: number;
  ipAlertWebhookUrl?: string;
  onIpRestrictionAlert?: (
    payload: IWINVIPRestrictionAlert,
  ) => void | Promise<void>;
  debug?: boolean;
}

export interface IWINVIPRestrictionAlert {
  provider: "iwinv";
  channel: string;
  endpoint: string;
  phoneNumber: string;
  templateCode?: string;
  code: string;
  message: string;
  attempt: number;
  maxAttempts: number;
  timestamp: string;
}

// =============================================================================
// 상수
// =============================================================================

export const IWINV_STATUS_CODES = {
  SUCCESS: 200,
  AUTH_FAILED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
} as const;
