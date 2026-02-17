import type { SolapiMessageService } from "solapi";

export type SolapiSdkClient = Pick<
  SolapiMessageService,
  "sendOne" | "getMessages" | "getBalance" | "uploadFile"
>;

export type SolapiSendOneMessage = Parameters<SolapiSdkClient["sendOne"]>[0];
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
