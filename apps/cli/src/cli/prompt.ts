export type { PromptApi } from "./command-contract";

import type { PromptApi } from "./command-contract";

export {
  createReadlinePrompt,
  createReadlinePromptWithInterface,
  isPromptCancelledError,
  PromptCancelledError,
} from "./prompt-runtime";

type PromptOptions = {
  message: string;
  defaultValue?: string;
  validate?: (value: string) => boolean | string;
};

type ConfirmOptions = {
  message: string;
  defaultValue?: boolean;
};

export type PromptSelectOption<T> = {
  label: string;
  value: T;
  hint?: string;
  disabled?: boolean;
};

type SelectOptions<T> = {
  options: PromptSelectOption<T>[];
  default?: T;
};

export async function promptText(
  prompt: PromptApi,
  options: PromptOptions,
): Promise<string> {
  return await prompt.text(options.message, {
    default: options.defaultValue,
    validate: options.validate,
  });
}

export async function promptConfirm(
  prompt: PromptApi,
  options: ConfirmOptions,
): Promise<boolean> {
  return await prompt.confirm(options.message, {
    default: options.defaultValue,
  });
}

export async function promptSelect<T>(
  prompt: PromptApi,
  message: string,
  options: SelectOptions<T>,
): Promise<T> {
  return await prompt.select(message, options);
}
