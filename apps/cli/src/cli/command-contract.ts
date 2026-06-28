import type { infer as InferZod, ZodTypeAny } from "zod";

export type OptionKind = "flag" | "value";

export interface CliOptionDefinition<TSchema extends ZodTypeAny = ZodTypeAny> {
  argumentKind?: OptionKind;
  description?: string;
  schema: TSchema;
  short?: string;
}

export type CliOptionsShape = Record<string, CliOptionDefinition<ZodTypeAny>>;

export type PromptSelectOption<T> = {
  disabled?: boolean;
  hint?: string;
  label: string;
  value: T;
};

export interface PromptApi {
  close?(): void;
  confirm(
    message: string,
    options?: {
      default?: boolean;
    },
  ): Promise<boolean>;
  select<T>(
    message: string,
    options: {
      default?: T;
      options: PromptSelectOption<T>[];
    },
  ): Promise<T>;
  text(
    message: string,
    options?: {
      default?: string;
      validate?: (value: string) => boolean | string;
    },
  ): Promise<string>;
}

export interface CliTerminal {
  columns?: number;
  isCI: boolean;
  isInteractive: boolean;
  rows?: number;
}

export interface CliSpinnerHandle {
  start(): void;
  stop(): void;
  succeed(message?: string): void;
  update(message: string): void;
}

export type CliSpinnerFactory = (message: string) => CliSpinnerHandle;

export interface CliRuntimeContext {
  env?: Record<string, unknown>;
  store?: Record<string, unknown>;
}

type InferOptionValue<TOption> =
  TOption extends CliOptionDefinition<infer TSchema>
    ? InferZod<TSchema>
    : never;

export type InferCommandFlags<TOptions extends CliOptionsShape | undefined> =
  TOptions extends CliOptionsShape
    ? {
        [Key in keyof TOptions]: InferOptionValue<TOptions[Key]>;
      }
    : Record<string, never>;

export interface CliHandlerArgs<
  TOptions extends CliOptionsShape | undefined = CliOptionsShape,
> {
  context: CliRuntimeContext;
  flags: InferCommandFlags<TOptions>;
  positional: string[];
  prompt: PromptApi;
  spinner: CliSpinnerFactory;
  terminal: CliTerminal;
}

export interface CliCommandDefinition<
  TOptions extends CliOptionsShape = CliOptionsShape,
> {
  description: string;
  handler: (args: CliHandlerArgs<TOptions>) => Promise<void> | void;
  kind: "command";
  name: string;
  options: TOptions;
}

export interface CliGroupDefinition {
  commands: CliNode[];
  description: string;
  kind: "group";
  name: string;
}

export type CliNode = CliCommandDefinition<any> | CliGroupDefinition;

export function option<TSchema extends ZodTypeAny>(
  schema: TSchema,
  config: Omit<CliOptionDefinition<TSchema>, "schema"> = {},
): CliOptionDefinition<TSchema> {
  return {
    argumentKind: config.argumentKind ?? "value",
    description: config.description,
    schema,
    short: config.short,
  };
}

export function defineCommand<const TOptions extends CliOptionsShape>(input: {
  description: string;
  handler: (args: CliHandlerArgs<TOptions>) => Promise<void> | void;
  name: string;
  options?: TOptions;
}): CliCommandDefinition<TOptions> {
  return {
    description: input.description,
    handler: input.handler,
    kind: "command",
    name: input.name,
    options: (input.options ?? {}) as TOptions,
  };
}

export function defineGroup(input: {
  commands: CliNode[];
  description: string;
  name: string;
}): CliGroupDefinition {
  return {
    commands: input.commands,
    description: input.description,
    kind: "group",
    name: input.name,
  };
}

export function isCliCommand(node: CliNode): node is CliCommandDefinition<any> {
  return node.kind === "command";
}

export function isCliGroup(node: CliNode): node is CliGroupDefinition {
  return node.kind === "group";
}
