import {
  CheckboxField,
  Form,
  MultiSelectField,
  Panel,
  SelectField,
  useFormContext,
} from "@bunli/tui";
import { createElement } from "react";
import { z } from "zod";
import {
  type AlternateBufferCompletionPayload,
  useAlternateBufferLifecycle,
} from "./alternate-buffer-lifecycle";

export type ConfigInitFlowValues = {
  force: boolean;
  providers: string[];
  template: "interactive" | "full";
};

type ConfigInitFlowProps = {
  initialValues: Partial<ConfigInitFlowValues>;
  onSubmit: (
    values: ConfigInitFlowValues,
  ) => Promise<AlternateBufferCompletionPayload | undefined>;
  providerOptions: Array<{
    description?: string;
    label: string;
    value: string;
  }>;
};

const configInitSchema = z.object({
  template: z.enum(["interactive", "full"]).default("interactive"),
  providers: z.array(z.string()).default(["iwinv"]),
  force: z.boolean().default(false),
});

function ConfigInitCompletion({
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

function ConfigInitFields({
  providerOptions,
}: {
  providerOptions: ConfigInitFlowProps["providerOptions"];
}) {
  const { values } = useFormContext();
  const template = values.template === "full" ? "full" : "interactive";

  return createElement(
    "box",
    {
      style: {
        flexDirection: "column",
        gap: 1,
      },
    },
    createElement(Panel, {
      title: "Initialize k-msg config",
      subtitle:
        template === "full"
          ? "Generate the complete reference config with all providers."
          : "Start with selected providers and env-based defaults.",
      tone: "accent",
      padded: true,
    }),
    createElement(SelectField, {
      label: "Template mode",
      name: "template",
      options: [
        {
          description: "Start from selected providers and sensible defaults",
          name: "interactive",
          value: "interactive",
        },
        {
          description: "Generate the complete reference config",
          name: "full",
          value: "full",
        },
      ],
      required: true,
    }),
    template === "interactive"
      ? createElement(MultiSelectField, {
          label: "Providers",
          name: "providers",
          description:
            "Choose one or more providers to seed into the initial config.",
          options: providerOptions.map((option) => ({
            description: option.description ?? "",
            name: option.label,
            value: option.value,
          })),
          required: true,
          defaultValue: ["iwinv"],
        })
      : null,
    createElement(CheckboxField, {
      label: "Overwrite existing config",
      name: "force",
      description: "Allow replacing an existing k-msg config file.",
      defaultValue: false,
    }),
  );
}

export function ConfigInitFlow({
  initialValues,
  onSubmit,
  providerOptions,
}: ConfigInitFlowProps) {
  const { completion, handleCancel, handleSubmit, status } =
    useAlternateBufferLifecycle("k-msg config init failed");

  if (status === "completed" && completion) {
    return createElement(ConfigInitCompletion, {
      completion,
    });
  }

  return (
    <Form
      title="Initialize k-msg config"
      schema={configInitSchema}
      initialValues={initialValues}
      onCancel={handleCancel}
      onSubmit={async (values) => {
        await handleSubmit(() => onSubmit(values as ConfigInitFlowValues));
      }}
      submitHint="Enter to write config"
    >
      <ConfigInitFields providerOptions={providerOptions} />
    </Form>
  );
}
