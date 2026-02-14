import type { MessageType } from "./message";

export type BalanceChannel = MessageType;

export interface BalanceQuery {
  channel?: BalanceChannel;
}

export interface BalanceResult {
  providerId: string;
  channel?: BalanceChannel;
  amount: number;
  currency?: string;
  raw?: unknown;
}
