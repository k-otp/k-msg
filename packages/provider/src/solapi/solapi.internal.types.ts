import type { RequestSendOneMessageSchema, SolapiMessageService } from "solapi";

type SolapiV6Send = SolapiMessageService["send"];

export type SolapiSendInput = Parameters<SolapiV6Send>[0];
export type SolapiSendRequestConfig = Exclude<
  Parameters<SolapiV6Send>[1],
  undefined
>;
export type SolapiSendResponse = Awaited<ReturnType<SolapiV6Send>>;

export type SolapiSdkClient = Pick<
  SolapiMessageService,
  "getMessages" | "getBalance" | "uploadFile"
> & {
  send?: (
    messages: SolapiSendInput,
    requestConfig?: SolapiSendRequestConfig,
  ) => Promise<SolapiSendResponse>;
  sendOne?: (
    message: RequestSendOneMessageSchema,
    appId?: string,
  ) => Promise<unknown>;
};

export type SolapiSendOneMessage = RequestSendOneMessageSchema;
export type SolapiMessageType = Exclude<
  SolapiSendOneMessage["type"],
  undefined
>;

export type SolapiKakaoButton = {
  buttonName: string;
  buttonType: "WL";
  linkMo: string;
  linkPc?: string;
};
