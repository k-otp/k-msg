import { useRuntime } from "@bunli/runtime/app";
import { useKeyboard } from "@bunli/tui";
import { useCallback, useState } from "react";

type AlternateBufferKeyEvent = {
  ctrl?: boolean;
  name?: string;
  sequence?: string;
};

export type AlternateBufferCompletionPayload = {
  title: string;
  nextSteps?: string[];
  summaryLines?: string[];
  warningLines?: string[];
};

type AlternateBufferStatus = "editing" | "submitting" | "completed";

function isExitKey(key: AlternateBufferKeyEvent): boolean {
  return key.name === "q" || (key.ctrl === true && key.name === "c");
}

function isCompletionKey(key: AlternateBufferKeyEvent): boolean {
  return (
    key.name === "enter" ||
    key.sequence === "\r" ||
    key.sequence === "\n" ||
    isExitKey(key)
  );
}

function describeFailure(context: string, error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  return `${context}: ${message}`;
}

export function useAlternateBufferLifecycle(context: string): {
  completion: AlternateBufferCompletionPayload | null;
  handleCancel: () => void;
  handleSubmit: (
    action: () => Promise<AlternateBufferCompletionPayload | undefined>,
  ) => Promise<void>;
  status: AlternateBufferStatus;
} {
  const runtime = useRuntime();
  const [completion, setCompletion] =
    useState<AlternateBufferCompletionPayload | null>(null);
  const [status, setStatus] = useState<AlternateBufferStatus>("editing");

  const exit = useCallback(() => {
    runtime.exit();
  }, [runtime]);

  useKeyboard((key: AlternateBufferKeyEvent) => {
    if (status === "completed") {
      if (isCompletionKey(key)) {
        exit();
      }
      return;
    }

    if (isExitKey(key)) {
      exit();
    }
  });

  const handleCancel = useCallback(() => {
    setCompletion(null);
    setStatus("editing");
    exit();
  }, [exit]);

  const handleSubmit = useCallback(
    async (
      action: () => Promise<AlternateBufferCompletionPayload | undefined>,
    ) => {
      setCompletion(null);
      setStatus("submitting");

      try {
        const result = await action();
        if (result) {
          setCompletion(result);
          setStatus("completed");
          return;
        }

        exit();
      } catch (error) {
        setCompletion(null);
        setStatus("editing");
        exit();
        console.error(describeFailure(context, error));
      }
    },
    [context, exit],
  );

  return {
    completion,
    handleCancel,
    handleSubmit,
    status,
  };
}
