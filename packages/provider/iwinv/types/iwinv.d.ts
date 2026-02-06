/**
 * IWINV API TypeScript 타입 정의
 * IWINV 알림톡 REST API 규격서 기반
 */
export interface IWINVBaseResponse {
    code: number;
    message: string;
}
export interface SendMessageRequest {
    templateCode: string;
    reserve?: 'Y' | 'N';
    sendDate?: string;
    reSend?: 'Y' | 'N';
    resendCallback?: string;
    resendType?: 'Y' | 'N';
    resendTitle?: string;
    resendContent?: string;
    list: SendRecipient[];
}
export interface SendRecipient {
    phone: string;
    templateParam?: string[];
}
export interface SendMessageResponse extends IWINVBaseResponse {
    success: number;
    fail: number;
}
export interface CreateTemplateRequest {
    templateName: string;
    templateContent: string;
    buttons?: CreateTemplateButton[];
}
export interface CreateTemplateButton {
    type: 'WL' | 'AL' | 'DB' | 'BK' | 'MD';
    name: string;
    linkMo?: string;
    linkPc?: string;
    linkIos?: string;
    linkAnd?: string;
}
export interface Template {
    templateCode: string;
    templateName: string;
    templateContent: string;
    status: 'Y' | 'I' | 'R';
    templateStatusMsg?: string;
    templateStatusComments?: string;
    createDate: string;
    buttons: any[];
}
export interface TemplateListRequest {
    pageNum?: string;
    pageSize?: string;
    templateCode?: string;
    templateName?: string;
    templateStatus?: 'Y' | 'I' | 'R';
}
export interface TemplateListResponse extends IWINVBaseResponse {
    totalCount: number;
    list: Template[];
}
export interface ModifyTemplateRequest {
    templateCode: string;
    templateName: string;
    templateContent: string;
    buttons?: CreateTemplateButton[];
}
export interface DeleteTemplateRequest {
    templateCode: string;
}
export type CreateTemplateResponse = IWINVBaseResponse;
export type ModifyTemplateResponse = IWINVBaseResponse;
export type DeleteTemplateResponse = IWINVBaseResponse;
export interface HistoryRequest {
    pageNum?: number;
    pageSize?: number;
    reserve?: 'Y' | 'N';
    startDate?: string;
    endDate?: string;
    seqNo?: number;
    phone?: string;
}
export interface MessageHistory {
    seqNo: number;
    phone: string;
    callback: string;
    templateCode: string;
    sendMessage: string;
    reserve: 'Y' | 'N';
    requestDate: string;
    sendDate: string;
    receiveDate: string;
    statusCode: string;
    statusCodeName: string;
    resendStatus: string | null;
    resendStatusName: string | null;
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
    seqNo: number;
}
export type CancelReservationResponse = IWINVBaseResponse;
export interface BalanceResponse extends IWINVBaseResponse {
    charge: number;
}
export interface IWINVConfig {
    apiKey: string;
    baseUrl: string;
    debug?: boolean;
    [key: string]: unknown;
}
export declare const IWINV_STATUS_CODES: {
    readonly SUCCESS: 200;
    readonly AUTH_FAILED: 201;
    readonly BAD_REQUEST: 400;
    readonly UNAUTHORIZED: 401;
    readonly FORBIDDEN: 403;
    readonly NOT_FOUND: 404;
    readonly TOO_MANY_REQUESTS: 429;
    readonly INTERNAL_SERVER_ERROR: 500;
};
