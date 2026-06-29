import type { SolapiMessageService } from "solapi";

type SolapiV6Send = SolapiMessageService["send"];

export type SolapiSendInput = Parameters<SolapiV6Send>[0];
export type SolapiSendOneMessage = Extract<SolapiSendInput, { to: unknown }>;
export type SolapiSendRequestConfig = Exclude<
  Parameters<SolapiV6Send>[1],
  undefined
>;
export type SolapiSendResponse = Awaited<ReturnType<SolapiV6Send>>;

type SolapiV5SendOne = (
  message: SolapiSendOneMessage,
  appId?: string,
) => Promise<unknown>;

export type SolapiSdkClient = Pick<
  SolapiMessageService,
  "getMessages" | "getBalance" | "uploadFile"
> & {
  send?: SolapiV6Send;
  sendOne?: SolapiV5SendOne;
};
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
