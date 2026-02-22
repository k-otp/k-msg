import type { FieldCryptoConfig } from "@k-msg/core";
import type { HttpClient } from "../services/webhook.dispatcher";
import type {
  WebhookConfig,
  WebhookDelivery,
  WebhookEndpoint,
  WebhookEvent,
  WebhookTestResult,
} from "../types/webhook.types";

export interface WebhookDeliveryListOptions {
  endpointId?: string;
  eventType?: WebhookEvent["type"];
  status?: WebhookDelivery["status"];
  limit?: number;
}

export interface WebhookEndpointStore {
  add(endpoint: WebhookEndpoint): Promise<void>;
  update(endpointId: string, endpoint: WebhookEndpoint): Promise<void>;
  remove(endpointId: string): Promise<void>;
  get(endpointId: string): Promise<WebhookEndpoint | null>;
  list(): Promise<WebhookEndpoint[]>;
}

export interface WebhookDeliveryStore {
  add(delivery: WebhookDelivery): Promise<void>;
  list(options?: WebhookDeliveryListOptions): Promise<WebhookDelivery[]>;
}

export interface WebhookPersistence {
  endpointStore: WebhookEndpointStore;
  deliveryStore: WebhookDeliveryStore;
  init?(): Promise<void>;
  close?(): Promise<void>;
}

export interface WebhookRuntimeSecurityOptions {
  allowPrivateHosts?: boolean;
  allowHttpForLocalhost?: boolean;
}

export interface WebhookRuntimeFieldCryptoOptions {
  tenantId?: string;
  endpoint?: FieldCryptoConfig;
  delivery?: FieldCryptoConfig;
}

export type WebhookEndpointInput = Omit<
  WebhookEndpoint,
  "id" | "createdAt" | "updatedAt" | "status"
> & {
  id?: string;
  status?: WebhookEndpoint["status"];
};

export interface WebhookRuntimeConfig {
  delivery: WebhookConfig;
  persistence?: WebhookPersistence;
  endpointStore?: WebhookEndpointStore;
  deliveryStore?: WebhookDeliveryStore;
  fieldCrypto?: WebhookRuntimeFieldCryptoOptions;
  httpClient?: HttpClient;
  security?: WebhookRuntimeSecurityOptions;
  autoStart?: boolean;
}

export interface WebhookRuntimeTestPayload {
  endpointId: string;
  event?: Partial<WebhookEvent>;
}

export interface WebhookRuntime {
  addEndpoint(input: WebhookEndpointInput): Promise<WebhookEndpoint>;
  addEndpoints(
    inputs: readonly WebhookEndpointInput[],
  ): Promise<WebhookEndpoint[]>;
  updateEndpoint(
    endpointId: string,
    updates: Partial<WebhookEndpointInput>,
  ): Promise<WebhookEndpoint>;
  removeEndpoint(endpointId: string): Promise<void>;
  getEndpoint(endpointId: string): Promise<WebhookEndpoint | null>;
  listEndpoints(): Promise<WebhookEndpoint[]>;
  probeEndpoint(
    input: string | WebhookRuntimeTestPayload,
  ): Promise<WebhookTestResult>;
  emit(event: WebhookEvent): Promise<void>;
  emitSync(event: WebhookEvent): Promise<WebhookDelivery[]>;
  flush(): Promise<void>;
  listDeliveries(
    options?: WebhookDeliveryListOptions,
  ): Promise<WebhookDelivery[]>;
  shutdown(): Promise<void>;
}
