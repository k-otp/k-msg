import type { TemplateButton } from "../types/template.types";

export class ButtonParser {
  /**
   * 버튼 설정의 유효성을 검증합니다
   */
  static validateButtons(buttons: TemplateButton[]): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (buttons.length > 5) {
      errors.push("Maximum 5 buttons are allowed");
    }

    for (let i = 0; i < buttons.length; i++) {
      const button = buttons[i];
      const buttonIndex = i + 1;

      // 버튼 이름 검증
      if (!button.name || button.name.trim().length === 0) {
        errors.push(`Button ${buttonIndex}: name is required`);
      } else if (button.name.length > 14) {
        errors.push(`Button ${buttonIndex}: name cannot exceed 14 characters`);
      }

      // 버튼 타입별 검증
      ButtonParser.validateButtonByType(button, buttonIndex, errors);
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  private static validateButtonByType(
    button: TemplateButton,
    buttonIndex: number,
    errors: string[],
  ): void {
    switch (button.type) {
      case "WL": // 웹링크
        ButtonParser.validateWebLinkButton(button, buttonIndex, errors);
        break;
      case "AL": // 앱링크
        ButtonParser.validateAppLinkButton(button, buttonIndex, errors);
        break;
      case "DS": // 배송조회
        ButtonParser.validateDeliveryButton(button, buttonIndex, errors);
        break;
      case "BK": // 봇키워드
        ButtonParser.validateBotKeywordButton(button, buttonIndex, errors);
        break;
      case "MD": // 메시지전달
        ButtonParser.validateMessageDeliveryButton(button, buttonIndex, errors);
        break;
      default:
        errors.push(
          `Button ${buttonIndex}: invalid button type '${button.type}'`,
        );
    }
  }

  private static validateWebLinkButton(
    button: TemplateButton,
    buttonIndex: number,
    errors: string[],
  ): void {
    if (!button.linkMobile && !button.linkPc) {
      errors.push(
        `Button ${buttonIndex}: web link button must have at least mobile or PC link`,
      );
    }

    if (button.linkMobile && !ButtonParser.isValidUrl(button.linkMobile)) {
      errors.push(`Button ${buttonIndex}: invalid mobile link URL`);
    }

    if (button.linkPc && !ButtonParser.isValidUrl(button.linkPc)) {
      errors.push(`Button ${buttonIndex}: invalid PC link URL`);
    }
  }

  private static validateAppLinkButton(
    button: TemplateButton,
    buttonIndex: number,
    errors: string[],
  ): void {
    const hasAnyLink =
      button.linkIos ||
      button.linkAndroid ||
      button.schemeIos ||
      button.schemeAndroid;

    if (!hasAnyLink) {
      errors.push(
        `Button ${buttonIndex}: app link button must have at least one app link or scheme`,
      );
    }

    if (button.linkIos && !ButtonParser.isValidUrl(button.linkIos)) {
      errors.push(`Button ${buttonIndex}: invalid iOS link URL`);
    }

    if (button.linkAndroid && !ButtonParser.isValidUrl(button.linkAndroid)) {
      errors.push(`Button ${buttonIndex}: invalid Android link URL`);
    }
  }

  private static validateDeliveryButton(
    _button: TemplateButton,
    _buttonIndex: number,
    _errors: string[],
  ): void {
    // 배송조회 버튼은 특별한 검증 로직이 필요할 수 있음
    // 현재는 기본 검증만 수행
  }

  private static validateBotKeywordButton(
    _button: TemplateButton,
    _buttonIndex: number,
    _errors: string[],
  ): void {
    // 봇키워드 버튼은 특별한 검증 로직이 필요할 수 있음
    // 현재는 기본 검증만 수행
  }

  private static validateMessageDeliveryButton(
    _button: TemplateButton,
    _buttonIndex: number,
    _errors: string[],
  ): void {
    // 메시지전달 버튼은 특별한 검증 로직이 필요할 수 있음
    // 현재는 기본 검증만 수행
  }

  private static isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * 버튼을 JSON 문자열로 직렬화합니다 (카카오 API 형식)
   */
  static serializeButtons(buttons: TemplateButton[]): string {
    const serializedButtons = buttons.map((button) => ({
      name: button.name,
      type: button.type,
      url_mobile: button.linkMobile,
      url_pc: button.linkPc,
      url_ios: button.linkIos,
      url_android: button.linkAndroid,
      scheme_ios: button.schemeIos,
      scheme_android: button.schemeAndroid,
    }));

    return JSON.stringify(serializedButtons);
  }

  /**
   * JSON 문자열에서 버튼 배열로 역직렬화합니다
   */
  static deserializeButtons(buttonsJson: string): TemplateButton[] {
    try {
      const parsed = JSON.parse(buttonsJson);

      return parsed.map((button: any) => ({
        name: button.name,
        type: button.type,
        linkMobile: button.url_mobile,
        linkPc: button.url_pc,
        linkIos: button.url_ios,
        linkAndroid: button.url_android,
        schemeIos: button.scheme_ios,
        schemeAndroid: button.scheme_android,
      }));
    } catch (error) {
      throw new Error(`Failed to parse buttons JSON: ${error}`);
    }
  }
}
