import type { HandlerArgs } from "@bunli/core";

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

export type PromptApi = HandlerArgs["prompt"];

export class PromptCancelledError extends Error {
  constructor() {
    super("Prompt cancelled.");
    this.name = "PromptCancelledError";
  }
}

function remapPromptCancellation(prompt: PromptApi, error: unknown): never {
  if (error instanceof prompt.clack.PromptCancelledError) {
    throw new PromptCancelledError();
  }
  throw error;
}

export function isPromptCancelledError(
  error: unknown,
): error is PromptCancelledError {
  return error instanceof PromptCancelledError;
}

export async function promptText(
  prompt: PromptApi,
  options: PromptOptions,
): Promise<string> {
  try {
    return await prompt.text(options.message, {
      default: options.defaultValue,
      validate: options.validate,
    });
  } catch (error) {
    remapPromptCancellation(prompt, error);
  }
}

export async function promptConfirm(
  prompt: PromptApi,
  options: ConfirmOptions,
): Promise<boolean> {
  try {
    return await prompt.confirm(options.message, {
      default: options.defaultValue,
    });
  } catch (error) {
    remapPromptCancellation(prompt, error);
  }
}

export async function promptSelect<T>(
  prompt: PromptApi,
  message: string,
  options: SelectOptions<T>,
): Promise<T> {
  try {
    return await prompt.select(message, options);
  } catch (error) {
    remapPromptCancellation(prompt, error);
  }
}
