/**
 * IWINV Channel Contract Implementation  
 */

import {
  ChannelContract,
  Channel,
  SenderNumber,
  ChannelRequest
} from '../../contracts/provider.contract';

import { IWINVConfig } from '../types/iwinv';

// IWINV 플러스친구 API 응답 타입
interface IWINVPlusFriendResponse {
  code: string;
  message: string;
  list?: Array<{
    plusfriend_id: string;
    plusfriend_name: string;
    status: string; // 'ACTIVE', 'INACTIVE', 'PENDING', 'BLOCKED'
    reg_date: string;
    update_date?: string;
    category?: string;
  }>;
}

// IWINV 발신번호 API 응답 타입
interface IWINVSenderNumberResponse {
  code: string;
  message: string;
  list?: Array<{
    callback: string;
    status: string; // 'Y', 'N', 'W'
    reg_date: string;
    approve_date?: string;
  }>;
}

export class IWINVChannelContract implements ChannelContract {
  constructor(private config: IWINVConfig) {}

  async register(channel: ChannelRequest): Promise<Channel> {
    // IWINV doesn't have a dedicated channel registration API
    // This is a mock implementation
    return {
      id: `channel_${Date.now()}`,
      name: channel.name,
      profileKey: channel.profileKey,
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  async list(): Promise<Channel[]> {
    try {
      // IWINV 실제 API: 플러스친구 목록 조회
      const response = await fetch(`${this.config.baseUrl}/plusfriend/`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json;charset=UTF-8',
          'AUTH': btoa(this.config.apiKey)
        }
      });

      if (!response.ok) {
        if (this.config.debug) {
          console.warn(`IWINV plusfriend API returned ${response.status}, using default channel`);
        }
        // API 실패시 기본 채널 반환
        return this.getDefaultChannel();
      }

      const responseText = await response.text();
      if (this.config.debug) {
        console.log('IWINV plusfriend response:', responseText.substring(0, 500));
      }

      let result: IWINVPlusFriendResponse;
      try {
        result = JSON.parse(responseText) as IWINVPlusFriendResponse;
      } catch (parseError) {
        console.warn('Failed to parse IWINV plusfriend JSON, using default channel');
        return this.getDefaultChannel();
      }

      // IWINV API 응답 포맷에 맞춰 매핑
      const channels = (result.list || []).map((plusfriend) => ({
        id: plusfriend.plusfriend_id || `channel_${Date.now()}`,
        name: plusfriend.plusfriend_name || 'IWINV Channel',
        profileKey: plusfriend.plusfriend_id,
        status: this.mapPlusFriendStatus(plusfriend.status),
        createdAt: new Date(plusfriend.reg_date || Date.now()),
        updatedAt: new Date()
      }));

      return channels.length > 0 ? channels : this.getDefaultChannel();
    } catch (error) {
      if (this.config.debug) {
        console.warn('IWINV plusfriend API error:', error);
      }
      return this.getDefaultChannel();
    }
  }

  private getDefaultChannel(): Channel[] {
    return [
      {
        id: 'iwinv-default',
        name: 'IWINV Default Channel',
        profileKey: 'default',
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
  }

  async addSenderNumber(channelId: string, number: string): Promise<SenderNumber> {
    try {
      // IWINV 발신번호 등록은 웹 콘솔에서만 가능 (API 미제공)
      // 상태 조회만 API로 가능
      const response = await fetch(`${this.config.baseUrl}/sender/`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json;charset=UTF-8',
          'AUTH': btoa(this.config.apiKey)
        }
      });

      if (response.ok) {
        const result = JSON.parse(await response.text()) as IWINVSenderNumberResponse;
        const existingSender = result.list?.find(s => s.callback === number);

        if (existingSender) {
          return {
            id: `sender_${number}`,
            channelId,
            phoneNumber: number,
            isVerified: existingSender.status === 'Y',
            createdAt: new Date(existingSender.reg_date)
          };
        }
      }

      // API에서 찾을 수 없는 경우 - 웹 콘솔 등록 필요
      throw new Error(`발신번호 ${number}가 IWINV에 등록되지 않음. 웹 콘솔에서 먼저 등록해주세요.`);
    } catch (error) {
      throw new Error(`발신번호 조회 실패: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async verifySenderNumber(number: string, verificationCode: string): Promise<boolean> {
    try {
      // IWINV는 발신번호 인증이 웹 콘솔에서만 가능
      // API로는 상태 조회만 가능
      const response = await fetch(`${this.config.baseUrl}/sender/`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json;charset=UTF-8',
          'AUTH': btoa(this.config.apiKey)
        }
      });

      if (response.ok) {
        const result = JSON.parse(await response.text()) as IWINVSenderNumberResponse;
        const sender = result.list?.find(s => s.callback === number);
        return sender?.status === 'Y';
      }

      return false;
    } catch (error) {
      console.warn(`발신번호 인증 상태 확인 실패: ${error}`);
      return false;
    }
  }

  private mapPlusFriendStatus(status: string): 'active' | 'inactive' | 'pending' | 'blocked' {
    switch (status) {
      case 'ACTIVE': return 'active';
      case 'INACTIVE': return 'inactive';
      case 'PENDING': return 'pending';
      case 'BLOCKED': return 'blocked';
      default: return 'inactive';
    }
  }
}