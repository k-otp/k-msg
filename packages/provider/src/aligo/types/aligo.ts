export interface AligoConfig {
  apiKey: string;
  userId: string;
  senderKey?: string;
  sender?: string;
  testMode?: boolean;
  debug?: boolean;
  smsBaseUrl?: string;
  alimtalkBaseUrl?: string;
  friendtalkEndpoint?: string;
}

export interface AligoSMSRequest {
  key: string;
  user_id: string;
  sender: string;
  receiver: string;
  msg: string;
  msg_type?: "SMS" | "LMS" | "MMS";
  title?: string;
  testmode_yn?: "Y" | "N";
  destination?: string;
  rdate?: string;
  rtime?: string;
  image?: string;
}

export interface AligoAlimTalkRequest {
  apikey: string;
  userid: string;
  senderkey: string;
  tpl_code: string;
  sender: string;

  // biome-ignore lint/suspicious/noExplicitAny: provider API is loosely typed.
  [key: string]: any;

  testMode?: "Y" | "N";
}

export interface AligoResponse {
  result_code: string;
  message: string;
  msg_id?: string;
  success_cnt?: number;
  error_cnt?: number;
  msg_type?: string;
}

export interface AligoTemplateListRequest {
  apikey: string;
  userid: string;
  senderkey: string;
  tpl_code?: string;
}

export interface AligoTemplateCreateRequest {
  apikey: string;
  userid: string;
  senderkey: string;
  tpl_name: string;
  tpl_content: string;
  tpl_button?: string;
}

export interface AligoTemplateDeleteRequest {
  apikey: string;
  userid: string;
  senderkey: string;
  tpl_code: string;
}

export interface AligoRemainResponse {
  result_code: string;
  message: string;
  SMS_CNT: number;
  LMS_CNT: number;
  MMS_CNT: number;
}

