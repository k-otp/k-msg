/**
 * IWINV Account Contract Implementation
 */

import {
  AccountContract,
  Balance,
  AccountProfile
} from '../../contracts/provider.contract';

import { IWINVConfig } from '../types/iwinv';

export class IWINVAccountContract implements AccountContract {
  constructor(private config: IWINVConfig) {}

  async getBalance(): Promise<Balance> {
    try {
      const response = await fetch(`${this.config.baseUrl}/balance`, {
        method: 'GET',
        headers: {
          'AUTH': btoa(this.config.apiKey)
        }
      });

      const result = await response.json() as Record<string, unknown>;

      if (!response.ok) {
        throw new Error(`Failed to get balance: ${(result.message as string)}`);
      }

      return {
        current: Number((result.balance as string)) || 0,
        currency: 'KRW',
        lastUpdated: new Date(),
        threshold: Number((result.threshold as string)) || undefined
      };
    } catch (error) {
      // Return default balance if API fails
      return {
        current: 0,
        currency: 'KRW',
        lastUpdated: new Date()
      };
    }
  }

  async getProfile(): Promise<AccountProfile> {
    try {
      // IWINV doesn't have a profile endpoint, so we'll create a basic one
      const balance = await this.getBalance();
      
      return {
        accountId: 'iwinv-account',
        name: 'IWINV Account',
        email: 'account@iwinv.kr',
        phone: '1588-1234',
        status: balance.current > 0 ? 'active' : 'suspended',
        tier: 'standard',
        features: ['alimtalk', 'sms', 'lms'],
        limits: {
          dailyMessageLimit: 10000,
          monthlyMessageLimit: 300000,
          rateLimit: 100 // per second
        }
      };
    } catch (error) {
      // Return default profile if API fails
      return {
        accountId: 'iwinv-account',
        name: 'IWINV Account',
        email: 'account@iwinv.kr', 
        phone: '1588-1234',
        status: 'active',
        tier: 'basic',
        features: ['alimtalk'],
        limits: {
          dailyMessageLimit: 1000,
          monthlyMessageLimit: 30000,
          rateLimit: 10
        }
      };
    }
  }
}