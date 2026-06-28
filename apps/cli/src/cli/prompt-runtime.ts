import readline from "node:readline";
import type { PromptApi, PromptSelectOption } from "./command-contract";

type PromptQuestion = (query: string) => Promise<string>;

type ReadlineQuestionAdapter = {
  close(): void;
  question(query: string, callback: (answer: string) => void): void;
  off?(event: "close" | "SIGINT", listener: () => void): void;
  once?(event: "close" | "SIGINT", listener: () => void): void;
  removeListener?(event: "close" | "SIGINT", listener: () => void): void;
};

type PromptOutput = {
  errorLine?: (line: string) => void;
  printLine?: (line: string) => void;
};

export class PromptCancelledError extends Error {
  constructor() {
    super("Prompt cancelled.");
    this.name = "PromptCancelledError";
  }
}

export function isPromptCancelledError(
  error: unknown,
): error is PromptCancelledError {
  return error instanceof PromptCancelledError;
}

export function createReadlinePrompt(output: PromptOutput = {}): PromptApi {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return createReadlinePromptWithInterface(rl, output);
}

export function createReadlinePromptWithInterface(
  rl: ReadlineQuestionAdapter,
  output: PromptOutput = {},
): PromptApi {
  const { errorLine, printLine } = resolvePromptOutput(output);
  const askQuestion: PromptQuestion = (query) =>
    new Promise<string>((resolve, reject) => {
      let settled = false;
      const cleanup = () => {
        if (typeof rl.off === "function") {
          rl.off("close", onCancel);
          rl.off("SIGINT", onCancel);
          return;
        }
        rl.removeListener?.("close", onCancel);
        rl.removeListener?.("SIGINT", onCancel);
      };
      const onCancel = () => {
        if (settled) return;
        settled = true;
        cleanup();
        reject(new PromptCancelledError());
      };
      const onAnswer = (answer: string) => {
        if (settled) return;
        settled = true;
        cleanup();
        resolve(answer);
      };

      rl.once?.("close", onCancel);
      rl.once?.("SIGINT", onCancel);
      rl.question(query, onAnswer);
    });

  return {
    async text(message, options = {}) {
      const defaultValue = options.default ?? "";

      while (true) {
        const value =
          normalizePromptAnswer(
            await askQuestion(formatTextPrompt(message, defaultValue)),
          ) || defaultValue;

        if (options.validate) {
          const result = options.validate(value);
          if (result !== true) {
            errorLine(formatValidationError(message, result, defaultValue));
            continue;
          }
        }

        return value;
      }
    },
    async confirm(message, options = {}) {
      const defaultValue = options.default ?? false;
      const defaultLabel = defaultValue ? "Y/n" : "y/N";

      while (true) {
        const answer = normalizePromptAnswer(
          await askQuestion(`${message} [${defaultLabel}]: `),
        );
        if (answer.length === 0) {
          return defaultValue;
        }

        const normalized = answer.toLowerCase();
        if (normalized === "y" || normalized === "yes") {
          return true;
        }
        if (normalized === "n" || normalized === "no") {
          return false;
        }

        errorLine(
          `Invalid confirmation: ${answer}. Enter y/yes, n/no, or press Enter for the default.`,
        );
      }
    },
    async select<T>(
      message: string,
      options: {
        default?: T;
        options: PromptSelectOption<T>[];
      },
    ) {
      if (!Array.isArray(options.options) || options.options.length === 0) {
        throw new Error(
          `select() requires at least one option for prompt: ${message}`,
        );
      }

      const resolvedDefaultIndex = resolveDefaultIndex(
        options.options,
        options.default,
      );

      renderSelectPrompt(
        message,
        options.options,
        resolvedDefaultIndex,
        printLine,
      );

      while (true) {
        const answer = normalizePromptAnswer(
          await askQuestion(formatChoicePrompt(resolvedDefaultIndex)),
        );

        if (answer.length === 0) {
          return options.options[resolvedDefaultIndex].value;
        }

        const selection = resolvePromptSelection(options.options, answer);
        if (selection) {
          if (selection.disabled) {
            errorLine(
              `Selection "${selection.label}" is disabled. Choose another option.`,
            );
            continue;
          }
          return selection.value;
        }

        if (isPromptHelpToken(answer)) {
          renderSelectPrompt(
            message,
            options.options,
            resolvedDefaultIndex,
            printLine,
          );
          continue;
        }

        errorLine(
          formatInvalidSelectionError(
            answer,
            options.options,
            resolvedDefaultIndex,
          ),
        );
      }
    },
    close() {
      rl.close();
    },
  };
}

function resolvePromptOutput({
  errorLine,
  printLine,
}: PromptOutput): Required<PromptOutput> {
  return {
    errorLine:
      errorLine ??
      ((line) => {
        process.stderr.write(`${line}\n`);
      }),
    printLine:
      printLine ??
      ((line) => {
        process.stdout.write(`${line}\n`);
      }),
  };
}

function normalizePromptAnswer(value: string): string {
  return String(value).trim();
}

function normalizePromptToken(value: string): string {
  return value.trim().toLowerCase();
}

function formatTextPrompt(message: string, defaultValue: string): string {
  const suffix = defaultValue.length > 0 ? ` [default: ${defaultValue}]` : "";
  return `${message}${suffix}: `;
}

function formatValidationError(
  message: string,
  result: boolean | string,
  defaultValue: string,
): string {
  const detail = typeof result === "string" ? result : "Invalid input";
  const retryHint =
    defaultValue.length > 0 ? ` Press Enter to keep "${defaultValue}".` : "";
  return `${message}: ${detail}.${retryHint}`;
}

function resolveDefaultIndex<T>(
  options: PromptSelectOption<T>[],
  defaultValue: T | undefined,
): number {
  if (defaultValue === undefined) {
    return 0;
  }

  const matchIndex = options.findIndex(
    (option) => option.value === defaultValue,
  );
  return matchIndex >= 0 ? matchIndex : 0;
}

function formatChoicePrompt(defaultIndex: number): string {
  return `Choice [default: ${defaultIndex + 1}, ? for options]: `;
}

function renderSelectPrompt<T>(
  message: string,
  options: PromptSelectOption<T>[],
  defaultIndex: number,
  printLine: (line: string) => void,
): void {
  printLine(message);
  printLine(
    "  Enter a number, option label, or option value. Press Enter to keep the default, or type ? to list choices again.",
  );
  options.forEach((option, index) => {
    const defaultMarker = index === defaultIndex ? " (default)" : "";
    const disabledMarker = option.disabled ? " [disabled]" : "";
    const valueLabel =
      normalizePromptToken(String(option.label)) ===
      normalizePromptToken(String(option.value))
        ? ""
        : ` [${String(option.value)}]`;
    printLine(
      `  ${index + 1}. ${option.label}${valueLabel}${defaultMarker}${disabledMarker}`,
    );
    if (option.hint) {
      printLine(`     ${option.hint}`);
    }
  });
}

function isPromptHelpToken(answer: string): boolean {
  const normalized = normalizePromptToken(answer);
  return normalized === "?" || normalized === "help" || normalized === "list";
}

function resolvePromptSelection<T>(
  options: PromptSelectOption<T>[],
  answer: string,
): PromptSelectOption<T> | undefined {
  const numericChoice = Number(answer);
  if (!Number.isNaN(numericChoice) && options[numericChoice - 1]) {
    return options[numericChoice - 1];
  }

  const normalizedAnswer = normalizePromptToken(answer);
  return options.find((option) => {
    const normalizedLabel = normalizePromptToken(String(option.label));
    const normalizedValue = normalizePromptToken(String(option.value));
    return (
      normalizedAnswer === normalizedLabel ||
      normalizedAnswer === normalizedValue
    );
  });
}

function formatInvalidSelectionError<T>(
  answer: string,
  options: PromptSelectOption<T>[],
  defaultIndex: number,
): string {
  const optionValues = options.map((option) => String(option.value)).join(", ");
  return [
    `Invalid selection: ${answer}.`,
    `Enter 1-${options.length}, one of: ${optionValues},`,
    `or press Enter for "${options[defaultIndex].label}".`,
  ].join(" ");
}
