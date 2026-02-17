import type { IWINVConfig } from "./types/iwinv";

export type IWINVSendResponse = {
  code: number;
  message: string;
  success?: number;
  fail?: number;
  seqNo?: number;
};

export type SmsV2SendResponse = Record<string, unknown> & {
  resultCode?: number | string;
  code?: number | string;
  message?: string;
  requestNo?: string;
  msgid?: string;
  msgType?: string;
};

export type SmsV2MessageType = "SMS" | "LMS" | "MMS";

export type IWINVImageInput =
  | {
      bytes: Uint8Array;
      filename?: string;
      contentType?: string;
    }
  | {
      blob: Blob;
      filename?: string;
      contentType?: string;
    };

export type NormalizedIwinvConfig = IWINVConfig & {
  baseUrl: string;
  sendEndpoint: string;
};
