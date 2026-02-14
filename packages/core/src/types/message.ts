export type MessageType =
  | "ALIMTALK"
  | "FRIENDTALK"
  | "SMS"
  | "LMS"
  | "MMS"
  | "RCS_SMS"
  | "RCS_LMS"
  | "RCS_MMS"
  | "RCS_TPL"
  | "RCS_ITPL"
  | "RCS_LTPL";

export interface BaseOptions {
  to: string;
  from: string;
  messageId?: string;
}

export interface AlimTalkOptions extends BaseOptions {
  type: "ALIMTALK";
  templateId: string;
  variables: Record<string, string>;
}

export interface Button {
  name: string;
  type: string;
  urlPc?: string;
  urlMobile?: string;
}

export interface FriendTalkOptions extends BaseOptions {
  type: "FRIENDTALK";
  text: string;
  imageUrl?: string;
  buttons?: Button[];
}

export interface SmsOptions extends BaseOptions {
  type: "SMS" | "LMS" | "MMS";
  text: string;
  subject?: string;
}

export type SendOptions = AlimTalkOptions | FriendTalkOptions | SmsOptions;

export interface SendResult {
  messageId: string;
  status: "PENDING" | "SENT" | "FAILED";
  provider: string;
}
