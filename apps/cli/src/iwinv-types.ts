/**
 * IWINV API TypeScript 타입 정의
 * IWINV 알림톡 REST API 규격서 기반
 */

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
  reserve?: 'Y' | 'N'; // 기본값: N
  sendDate?: string; // yyyy-MM-dd HH:mm:ss (예약발송시 필수)
  reSend?: 'Y' | 'N'; // 기본값: N
  resendCallback?: string; // 발신번호
  resendType?: 'Y' | 'N'; // 기본값: Y (Y:알림톡내용, N:직접입력)
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

export interface TemplateListRequest {
  pageNum?: number; // 기본값: 1
  pageSize?: number; // 기본값: 15, 최대: 1000
  templateCode?: string;
  templateName?: string;
  templateStatus?: 'Y' | 'I' | 'R'; // Y:사용가능, I:검수중, R:부결
}

export interface TemplateButton {
  ordering?: string; // 버튼 순서 (1~5)
  name: string; // 버튼명 (최대 15자)
  linkType: 'WL' | 'AL' | 'DS' | 'BK' | 'MD'; // 버튼 타입
  linkTypeName?: string; // 버튼 타입명
  linkMo?: string; // 모바일 웹링크 (WL용)
  linkPc?: string; // PC 웹링크 (WL용)
  linkIos?: string; // iOS 앱링크 (AL용)
  linkAnd?: string; // 안드로이드 앱링크 (AL용)
}

export interface Template {
  templateCode: string;
  templateName: string;
  templateContent: string;
  status: 'Y' | 'I' | 'R'; // Y:사용가능, I:검수중, R:부결
  templateStatusMsg?: string;
  templateStatusComments?: string;
  createDate: string;
  buttons: TemplateButton[];
}

export interface TemplateListResponse extends IWINVBaseResponse {
  totalCount: number;
  list: Template[];
}

export interface CreateTemplateRequest {
  templateName: string; // 최대 15자
  templateContent: string; // 최대 1000자
  buttons?: CreateTemplateButton[];
}

export interface CreateTemplateButton {
  type: 'WL' | 'AL' | 'DB' | 'BK' | 'MD';
  name: string; // 최대 15자
  linkMo?: string; // WL타입 필수, 최대 200자
  linkPc?: string; // WL타입 필수, 최대 200자
  linkIos?: string; // AL타입 필수, 최대 200자
  linkAnd?: string; // AL타입 필수, 최대 200자
}

export interface ModifyTemplateRequest extends CreateTemplateRequest {
  templateCode: string;
}

export interface DeleteTemplateRequest {
  templateCode: string;
}

export type CreateTemplateResponse = IWINVBaseResponse;
export type ModifyTemplateResponse = IWINVBaseResponse;
export type DeleteTemplateResponse = IWINVBaseResponse;

// =============================================================================
// 전송 결과 관련 타입
// =============================================================================

export interface HistoryRequest {
  pageNum?: number; // 기본값: 1
  pageSize?: number; // 기본값: 15, 최대: 1000
  reserve?: 'Y' | 'N'; // 예약발송 여부
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
  reserve: 'Y' | 'N'; // 예약발송 여부
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
// 에러 응답 타입
// =============================================================================

export interface IWINVErrorResponse extends IWINVBaseResponse {
  code: 201 | 400 | 401 | 403 | 404 | 429 | 500; // 일반적인 에러 코드들
}

// =============================================================================
// API 클라이언트 설정 타입
// =============================================================================

export interface IWINVConfig {
  apiKey: string;
  baseUrl?: string;
  timeout?: number;
  retries?: number;
  debug?: boolean;
}

// =============================================================================
// 상태 코드 상수
// =============================================================================

export const IWINV_STATUS_CODES = {
  SUCCESS: 200,
  AUTH_FAILED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500
} as const;

export const TEMPLATE_STATUS = {
  APPROVED: 'Y', // 사용가능
  PENDING: 'I',  // 검수중
  REJECTED: 'R'  // 부결(반려)
} as const;

export const BUTTON_TYPES = {
  WEB_LINK: 'WL',      // 웹링크
  APP_LINK: 'AL',      // 앱링크
  DELIVERY: 'DS',      // 배송조회
  BOT_KEYWORD: 'BK',   // 봇키워드
  MESSAGE_DELIVERY: 'MD' // 메시지전달
} as const;

export const RESERVE_STATUS = {
  IMMEDIATE: 'N', // 즉시발송
  RESERVED: 'Y'   // 예약발송
} as const;

export const RESEND_TYPE = {
  ALIMTALK_CONTENT: 'Y', // 알림톡 내용
  CUSTOM_CONTENT: 'N'    // 직접 입력
} as const;