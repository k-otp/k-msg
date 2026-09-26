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
  /** Caps the deliveries returned; the built-in stores return 100 when unset. */
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
  /**
   * Overwrites the stored delivery with the same id. Optional; the tenant
   * migration needs it to re-encrypt stored payloads, and the built-in
   * stores implement it.
   */
  replace?(delivery: WebhookDelivery): Promise<void>;
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
  /**
   * Also reads secrets and payloads written before ciphertext was bound to
   * `tenantId`, which are otherwise rejected. Set it only while migrating
   * them with `migrateFieldCryptoToTenant()`, then remove it: a tenant-less
   * value copied from another tenant's row with the same id would decrypt.
   */
  acceptLegacyAad?: boolean;
}

export interface WebhookTenantMigrationResult {
  /** Endpoints whose secret was re-encrypted with the tenant. */
  endpoints: number;
  /** Deliveries whose payload was re-encrypted with the tenant. */
  deliveries: number;
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
  /**
   * Re-encrypts stored endpoint secrets and delivery payloads written before
   * ciphertext was bound to `fieldCrypto.tenantId`; see
   * `migrateWebhookFieldCryptoToTenant`.
   */
  migrateFieldCryptoToTenant(): Promise<WebhookTenantMigrationResult>;
  shutdown(): Promise<void>;
}
