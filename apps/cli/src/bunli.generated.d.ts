import "@bunli/core";

declare module "@bunli/core" {
  interface GeneratedOptionMeta {
    min?: number;
    minLength?: number;
    isTransform?: boolean;
    [key: string]: unknown;
  }
}
