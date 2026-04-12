import {
  CheckboxField,
  Form,
  FormField,
  Panel,
  SelectField,
  useFormContext,
  useTerminalDimensions,
} from "@bunli/tui";
import { createElement, useEffect, useMemo, useRef } from "react";
import { z } from "zod";
import {
  type AlternateBufferCompletionPayload,
  useAlternateBufferLifecycle,
} from "./alternate-buffer-lifecycle";

export type ProviderFieldSpec = {
  defaultValue?: string;
  description?: string;
  required?: boolean;
  type: "string" | "number" | "boolean" | "stringRecord";
};

export type ProviderAddFlowValues = {
  id: string;
  includeRouting: boolean;
  setDefault: boolean;
  type: string;
} & Record<string, string | boolean | undefined>;

type ProviderTypeOption = {
  description?: string;
  label: string;
  value: string;
};

type ConfigProviderAddFlowProps = {
  initialValues: Partial<ProviderAddFlowValues>;
  onSubmit: (
    values: ProviderAddFlowValues,
  ) => Promise<AlternateBufferCompletionPayload | undefined>;
  providerFieldSpecs: Record<string, Record<string, ProviderFieldSpec>>;
  providerTypeOptions: ProviderTypeOption[];
  title?: string;
};

const BOOLEAN_SELECT_OPTIONS = [
  { description: "Leave unset", name: "(unset)", value: "" },
  { description: "Store true", name: "true", value: "true" },
  { description: "Store false", name: "false", value: "false" },
];

function createProviderAddSchema(
  providerFieldSpecs: Record<string, Record<string, ProviderFieldSpec>>,
) {
  const shape: Record<string, z.ZodTypeAny> = {
    type: z.string().trim().min(1),
    id: z.string().trim().min(1, "Provider id is required"),
    includeRouting: z.boolean().default(true),
    setDefault: z.boolean().default(false),
  };

  const fieldNames = new Set(
    Object.values(providerFieldSpecs).flatMap((specs) => Object.keys(specs)),
  );

  for (const fieldName of fieldNames) {
    shape[fieldName] = z.string().optional();
  }

  return z.object(shape);
}

function formatFieldDescription(spec: ProviderFieldSpec): string {
  const parts = [
    spec.description,
    spec.type === "stringRecord"
      ? 'Use JSON object format, for example {"X-Test":"1"}.'
      : undefined,
    spec.type === "number" ? "Enter a numeric string such as 1000." : undefined,
    spec.type === "boolean"
      ? "Choose true, false, or leave it unset."
      : undefined,
  ].filter((value): value is string => typeof value === "string");

  return parts.join(" ");
}

function ProviderAddCompletion({
  completion,
}: {
  completion: AlternateBufferCompletionPayload;
}) {
  return createElement(
    Panel,
    {
      title: completion.title,
      subtitle: "Press Enter or q to exit",
      tone: "success",
      padded: true,
    },
    createElement(
      "box",
      { style: { flexDirection: "column", gap: 1 } },
      ...(completion.summaryLines ?? []).map((line, index) =>
        createElement("text", {
          content: line,
          key: `summary:${index}`,
        }),
      ),
      ...(completion.nextSteps ?? []).map((line, index) =>
        createElement("text", {
          content: `Next: ${line}`,
          key: `next:${index}`,
        }),
      ),
      ...(completion.warningLines ?? []).map((line, index) =>
        createElement("text", {
          content: `Warning: ${line}`,
          fg: "yellow",
          key: `warning:${index}`,
        }),
      ),
    ),
  );
}

function ProviderAddFields({
  providerFieldSpecs,
  providerTypeOptions,
}: {
  providerFieldSpecs: Record<string, Record<string, ProviderFieldSpec>>;
  providerTypeOptions: ProviderTypeOption[];
}) {
  const { height = 24 } = useTerminalDimensions();
  const { setFieldValue, values } = useFormContext();
  const selectedType =
    typeof values.type === "string" && values.type.length > 0
      ? values.type
      : (providerTypeOptions[0]?.value ?? "");
  const previousTypeRef = useRef(selectedType);
  const visibleFields = useMemo(
    () => Object.entries(providerFieldSpecs[selectedType] ?? {}),
    [providerFieldSpecs, selectedType],
  );

  useEffect(() => {
    const previousType = previousTypeRef.current;
    const currentId = typeof values.id === "string" ? values.id : "";
    if (
      selectedType.length > 0 &&
      (currentId.length === 0 || currentId === previousType)
    ) {
      setFieldValue("id", selectedType);
    }
    previousTypeRef.current = selectedType;
  }, [selectedType, setFieldValue, values.id]);

  const subtitle =
    providerTypeOptions.find((option) => option.value === selectedType)
      ?.description ?? "Configure provider credentials and routing defaults.";

  return createElement(
    "box",
    {
      style: {
        flexDirection: "column",
        gap: 1,
        height: Math.max(12, height - 4),
      },
    },
    createElement(Panel, {
      title: "Provider configuration",
      subtitle,
      tone: "accent",
      padded: true,
    }),
    createElement(SelectField, {
      label: "Provider type",
      name: "type",
      options: providerTypeOptions.map((option) => ({
        description: option.description ?? "",
        name: option.label,
        value: option.value,
      })),
      required: true,
    }),
    createElement(FormField, {
      label: "Provider id",
      name: "id",
      required: true,
      description: "Unique id used by routing, aliases, and CLI commands.",
      placeholder: "example: solapi-main",
    }),
    ...visibleFields.map(([fieldName, spec]) =>
      spec.type === "boolean"
        ? createElement(SelectField, {
            key: fieldName,
            label: fieldName,
            name: fieldName,
            options: BOOLEAN_SELECT_OPTIONS,
            description: formatFieldDescription(spec) || "",
            defaultValue: spec.defaultValue ?? "",
            required: spec.required,
          })
        : createElement(FormField, {
            key: fieldName,
            label: fieldName,
            name: fieldName,
            description: formatFieldDescription(spec) || undefined,
            defaultValue: spec.defaultValue,
            placeholder: spec.defaultValue,
            required: spec.required,
          }),
    ),
    createElement(CheckboxField, {
      label: "Add provider to routing.byType",
      name: "includeRouting",
      description: "Seed matching message types into routing.byType.",
      defaultValue: true,
    }),
    createElement(CheckboxField, {
      label: "Set as default provider",
      name: "setDefault",
      description: "Set routing.defaultProviderId to this provider id.",
      defaultValue: false,
    }),
  );
}

export function ConfigProviderAddFlow({
  initialValues,
  onSubmit,
  providerFieldSpecs,
  providerTypeOptions,
  title = "Add a provider to k-msg config",
}: ConfigProviderAddFlowProps) {
  const { completion, handleCancel, handleSubmit, status } =
    useAlternateBufferLifecycle("k-msg config provider add failed");
  const schema = useMemo(
    () => createProviderAddSchema(providerFieldSpecs),
    [providerFieldSpecs],
  );

  if (status === "completed" && completion) {
    return createElement(ProviderAddCompletion, {
      completion,
    });
  }

  return createElement(ProviderAddFormShell, {
    title,
    schema,
    initialValues,
    onCancel: handleCancel,
    onSubmit: async (values) => {
      await handleSubmit(() => onSubmit(values));
    },
    providerFieldSpecs,
    providerTypeOptions,
  });
}

function ProviderAddFormShell({
  initialValues,
  onCancel,
  onSubmit,
  providerFieldSpecs,
  providerTypeOptions,
  schema,
  title,
}: {
  initialValues: Partial<ProviderAddFlowValues>;
  onCancel: () => void;
  onSubmit: (values: ProviderAddFlowValues) => Promise<void>;
  providerFieldSpecs: Record<string, Record<string, ProviderFieldSpec>>;
  providerTypeOptions: ProviderTypeOption[];
  schema: ReturnType<typeof createProviderAddSchema>;
  title: string;
}) {
  return (
    <Form
      title={title}
      schema={schema}
      initialValues={initialValues}
      onCancel={onCancel}
      onSubmit={async (values) => {
        await onSubmit(values as ProviderAddFlowValues);
      }}
      submitHint="Enter to submit"
    >
      <ProviderAddFields
        providerFieldSpecs={providerFieldSpecs}
        providerTypeOptions={providerTypeOptions}
      />
    </Form>
  );
}
