import { ButtonParser, type TemplateButton } from "@k-msg/template/send";

export function toAligoTplButton(
  buttons: TemplateButton[] | undefined,
): string | undefined {
  if (!Array.isArray(buttons) || buttons.length === 0) return undefined;

  const serializedButtons = JSON.parse(
    ButtonParser.serializeButtons(buttons),
  ) as unknown[];
  return JSON.stringify({ button: serializedButtons });
}
