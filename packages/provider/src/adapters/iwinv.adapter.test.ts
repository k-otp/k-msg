import { describe, expect, test } from 'bun:test';
import type { StandardRequest } from '@k-msg/core';
import { IWINVAdapter } from './iwinv.adapter';

describe('IWINVAdapter adaptRequest', () => {
  const adapter = new IWINVAdapter({
    apiKey: 'test-api-key',
    baseUrl: 'https://alimtalk.bizservice.iwinv.kr',
    senderNumber: '029999999'
  });

  test('builds direct message payload for SMS channel', () => {
    const request: StandardRequest = {
      channel: 'SMS',
      templateCode: 'SMS_DIRECT',
      phoneNumber: '01012345678',
      variables: { code: '123456' },
      text: '인증번호는 123456 입니다.',
      options: {
        subject: '인증안내',
        senderNumber: '021111111'
      }
    };

    const payload = adapter.adaptRequest(request);

    expect(payload.templateCode).toBe('SMS_DIRECT');
    expect(payload.resendType).toBe('N');
    expect(payload.resendContent).toBe('인증번호는 123456 입니다.');
    expect(payload.resendTitle).toBe('인증안내');
    expect(payload.resendCallback).toBe('021111111');
    expect(payload.list[0]?.templateParam).toBeUndefined();
  });

  test('keeps template params for template-based channels', () => {
    const request: StandardRequest = {
      channel: 'ALIMTALK',
      templateCode: 'WELCOME_001',
      phoneNumber: '01099998888',
      variables: {
        name: '홍길동',
        service: 'k-msg'
      }
    };

    const payload = adapter.adaptRequest(request);

    expect(payload.templateCode).toBe('WELCOME_001');
    expect(payload.resendType).toBe('Y');
    expect(payload.list[0]?.templateParam).toEqual(['홍길동', 'k-msg']);
  });
});
