import { describe, test, expect } from 'bun:test';
import { MockProvider } from '../../packages/provider/src/mock';
import { TemplateService } from '../../packages/template/src/service';
import { KMsg } from '../../packages/messaging/src/k-msg';
import { SendOptions } from '../../packages/core/src/types';

describe('Template and Messaging Flow Integration', () => {
  const mockProvider = new MockProvider();
  const templateService = new TemplateService(mockProvider);
  const kmsg = new KMsg(mockProvider);

  const templateData = {
    code: 'TEST_TPL_001',
    name: 'Test Template',
    content: 'Hello #{name}, your code is #{code}.',
    category: 'AUTHENTICATION' as const,
    variables: ['name', 'code']
  };

  test('full template lifecycle and messaging', async () => {
    const createResult = await templateService.create(templateData);
    expect(createResult.isSuccess).toBe(true);
    if (createResult.isSuccess) {
      expect(createResult.value.code).toBe(templateData.code);
      expect(createResult.value.status).toBe('APPROVED');
    }

    const listResult = await templateService.list();
    expect(listResult.isSuccess).toBe(true);
    if (listResult.isSuccess) {
      expect(listResult.value.length).toBeGreaterThan(0);
      expect(listResult.value.some(t => t.code === templateData.code)).toBe(true);
    }

    const updateData = { name: 'Updated Template Name' };
    const updateResult = await templateService.update(templateData.code, updateData);
    expect(updateResult.isSuccess).toBe(true);
    if (updateResult.isSuccess) {
      expect(updateResult.value.name).toBe(updateData.name);
    }

    const sendOptions: SendOptions = {
      type: 'ALIMTALK',
      from: '0212345678',
      to: '01012345678',
      templateId: templateData.code,
      variables: {
        name: 'John Doe',
        code: '123456'
      }
    };

    const sendResult = await kmsg.send(sendOptions);
    expect(sendResult.isSuccess).toBe(true);
    if (sendResult.isSuccess) {
      expect(sendResult.value.messageId).toBeDefined();
      expect(sendResult.value.status).toBe('SENT');
      expect(sendResult.value.provider).toBe('mock');
    }

    const deleteResult = await templateService.delete(templateData.code);
    expect(deleteResult.isSuccess).toBe(true);

    const getResult = await templateService.get(templateData.code);
    expect(getResult.isFailure).toBe(true);
  });
});
